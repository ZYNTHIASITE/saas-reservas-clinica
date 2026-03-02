export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔒 Rate limit básico en memoria (solo para dev/local)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 5; // máximo 5 intentos
const WINDOW_MS = 60 * 1000; // 1 minuto

export async function POST(request: Request) {
  try {
    // 🔒 Rate limiting por IP
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (entry) {
      if (now - entry.timestamp < WINDOW_MS) {
        if (entry.count >= RATE_LIMIT) {
          return NextResponse.json(
            { success: false, message: "Demasiados intentos. Intenta más tarde." },
            { status: 429 }
          );
        }
        entry.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }

    const body = await request.json();

    const {
      clinic_id,
      patient_name,
      patient_email,
      patient_phone,
      treatment_id,
      appointment_date,
    } = body;

    // 🔹 Validación campos obligatorios
    if (
      !clinic_id ||
      !patient_name ||
      !patient_email ||
      !patient_phone ||
      !treatment_id ||
      !appointment_date
    ) {
      return NextResponse.json(
        { success: false, message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // 🔹 Validación email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(patient_email)) {
      return NextResponse.json(
        { success: false, message: "Email no válido" },
        { status: 400 }
      );
    }

    // 🔹 Obtener tratamiento
    const { data: treatment, error: treatmentError } = await supabase
      .from("treatments")
      .select("duration_minutes")
      .eq("id", treatment_id)
      .single();

    if (treatmentError || !treatment) {
      return NextResponse.json(
        { success: false, message: "Tratamiento no encontrado" },
        { status: 404 }
      );
    }

    // 🔹 Obtener buffer clínica
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("buffer_minutes")
      .eq("id", clinic_id)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json(
        { success: false, message: "Clínica no encontrada" },
        { status: 404 }
      );
    }

    const buffer = clinic.buffer_minutes ?? 0;
    const duration = treatment.duration_minutes;
    const totalMinutes = duration + buffer;

    const startDate = new Date(appointment_date);
    const endDate = new Date(startDate.getTime() + totalMinutes * 60000);

    // 🔹 No permitir fechas pasadas
    if (startDate < new Date()) {
      return NextResponse.json(
        { success: false, message: "No puedes reservar en una fecha pasada" },
        { status: 400 }
      );
    }

    // 🔹 Validación previa de solapamiento (UX)
    const { data: overlapping } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", clinic_id)
      .in("status", ["pendiente", "confirmada"])
      .lt("start_datetime", endDate.toISOString())
      .gt("end_datetime", startDate.toISOString());

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { success: false, message: "Ese horario ya no está disponible" },
        { status: 409 }
      );
    }

    // 🔹 Buscar paciente
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinic_id)
      .eq("email", patient_email)
      .maybeSingle();

    let patientId: string;

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert([
          {
            clinic_id,
            name: patient_name,
            email: patient_email,
            phone: patient_phone,
          },
        ])
        .select()
        .single();

      if (patientError || !newPatient) {
        console.error("Error creando paciente:", patientError);
        return NextResponse.json(
          { success: false, message: "No se pudo crear el paciente" },
          { status: 500 }
        );
      }

      patientId = newPatient.id;
    }

    const manageToken = crypto.randomBytes(32).toString("hex");

    // 🔹 Insertar cita (protegido por constraint DB)
    const { error: appointmentError } = await supabase
      .from("appointments")
      .insert([
        {
          clinic_id,
          patient_id: patientId,
          patient_name,
          patient_email,
          patient_phone,
          treatment_id,
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          status: "pendiente",
          manage_token: manageToken,
        },
      ]);

    if (appointmentError) {
      if (appointmentError.code === "23P01") {
        return NextResponse.json(
          { success: false, message: "Ese horario ya no está disponible" },
          { status: 409 }
        );
      }

      console.error("Error creando cita:", appointmentError);

      return NextResponse.json(
        { success: false, message: "No se pudo crear la cita" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cita creada correctamente",
      manage_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/manage?token=${manageToken}`,
    });

  } catch (err) {
    console.error("Error interno:", err);

    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}