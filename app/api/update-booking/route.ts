import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      appointment_id,
      clinic_id,
      patient_name,
      treatment_id,
      appointment_date,
      status,
    } = body;

    if (
      !appointment_id ||
      !clinic_id ||
      !patient_name ||
      !treatment_id ||
      !appointment_date ||
      !status
    ) {
      return NextResponse.json(
        { success: false, message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const startDate = new Date(appointment_date);

    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Fecha inválida" },
        { status: 400 }
      );
    }

    // 🔎 Obtener duración tratamiento
    const { data: treatment } = await supabase
      .from("treatments")
      .select("duration_minutes")
      .eq("id", treatment_id)
      .single();

    if (!treatment) {
      return NextResponse.json(
        { success: false, message: "Tratamiento no encontrado" },
        { status: 404 }
      );
    }

    const duration = treatment.duration_minutes;
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // 🔎 Buscar otras citas activas de la clínica (menos esta)
    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("id, appointment_date, treatment_id, status")
      .eq("clinic_id", clinic_id)
      .neq("id", appointment_id)
      .in("status", ["pendiente", "confirmada"]);

    if (existingAppointments) {
      for (const appt of existingAppointments) {
        const apptStart = new Date(appt.appointment_date);

        const { data: existingTreatment } = await supabase
          .from("treatments")
          .select("duration_minutes")
          .eq("id", appt.treatment_id)
          .single();

        const apptDuration = existingTreatment?.duration_minutes ?? 0;
        const apptEnd = new Date(
          apptStart.getTime() + apptDuration * 60000
        );

        const overlaps =
          startDate < apptEnd && endDate > apptStart;

        if (overlaps) {
          return NextResponse.json(
            {
              success: false,
              message: "Conflicto con otra cita existente",
            },
            { status: 409 }
          );
        }
      }
    }

    // 🔎 Verificar bloqueos
    const { data: blockedSlots } = await supabase
      .from("blocked_slots")
      .select("start_datetime, end_datetime")
      .eq("clinic_id", clinic_id);

    if (blockedSlots) {
      for (const block of blockedSlots) {
        const blockStart = new Date(block.start_datetime);
        const blockEnd = new Date(block.end_datetime);

        const overlaps =
          startDate < blockEnd && endDate > blockStart;

        if (overlaps) {
          return NextResponse.json(
            {
              success: false,
              message: "Horario bloqueado por la clínica",
            },
            { status: 409 }
          );
        }
      }
    }

    // ✅ Actualizar
    const { error } = await supabase
      .from("appointments")
      .update({
        patient_name,
        treatment_id,
        appointment_date: startDate.toISOString(),
        status,
      })
      .eq("id", appointment_id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cita actualizada correctamente",
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}