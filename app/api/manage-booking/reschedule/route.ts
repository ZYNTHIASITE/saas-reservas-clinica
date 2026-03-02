import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { token, new_datetime } = await req.json();

    if (!token || !new_datetime) {
      return NextResponse.json(
        { success: false, message: "Datos inválidos" },
        { status: 400 }
      );
    }

    // 1️⃣ Obtener cita actual
    const { data: appointment } = await supabase
      .from("appointments")
      .select("*")
      .eq("manage_token", token)
      .single();

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // 2️⃣ Obtener duración del tratamiento
    const { data: treatment } = await supabase
      .from("treatments")
      .select("duration_minutes")
      .eq("id", appointment.treatment_id)
      .single();

    if (!treatment) {
      return NextResponse.json(
        { success: false, message: "Tratamiento no encontrado" },
        { status: 404 }
      );
    }

    const duration = treatment.duration_minutes;

    const startDate = new Date(new_datetime);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // 3️⃣ Validar solapamiento
    const { data: overlapping } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", appointment.clinic_id)
      .in("status", ["pendiente", "confirmada"])
      .neq("manage_token", token)
      .lt("start_datetime", endDate.toISOString())
      .gt("end_datetime", startDate.toISOString());

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { success: false, message: "Ese horario ya no está disponible" },
        { status: 409 }
      );
    }

    // 4️⃣ Actualizar cita
    await supabase
      .from("appointments")
      .update({
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        status: "pendiente",
      })
      .eq("manage_token", token);

    return NextResponse.json({
      success: true,
    });

  } catch {
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    );
  }
}