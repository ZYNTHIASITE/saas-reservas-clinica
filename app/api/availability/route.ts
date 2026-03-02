import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const clinic_id = searchParams.get("clinic_id");
  const date = searchParams.get("date");
  const treatment_id = searchParams.get("treatment_id");

  if (!clinic_id || !date || !treatment_id) {
    return NextResponse.json(
      { success: false, message: "Faltan parámetros" },
      { status: 400 }
    );
  }

  // 🔹 Obtener duración del tratamiento
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

  // 🔹 Obtener horario clínica
  const { data: clinic } = await supabase
    .from("clinics")
    .select("opening_hour, closing_hour")
    .eq("id", clinic_id)
    .single();

  const startHour = clinic?.opening_hour ?? 9;
  const endHour = clinic?.closing_hour ?? 18;

  const startOfDay = new Date(`${date}T00:00:00Z`);
  const endOfDay = new Date(`${date}T23:59:59Z`);

  // 🔹 Obtener citas existentes
  const { data: existingAppointments } = await supabase
    .from("appointments")
    .select("start_datetime, end_datetime, status")
    .eq("clinic_id", clinic_id)
    .in("status", ["pendiente", "confirmada"])
    .gte("start_datetime", startOfDay.toISOString())
    .lte("start_datetime", endOfDay.toISOString());

  // 🔹 Generar posibles slots cada 30 minutos
  const slots: Date[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotStart = new Date(
        Date.UTC(
          startOfDay.getUTCFullYear(),
          startOfDay.getUTCMonth(),
          startOfDay.getUTCDate(),
          hour,
          minute,
          0
        )
      );

      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // ❌ Si termina fuera de horario
      if (slotEnd.getUTCHours() > endHour ||
          (slotEnd.getUTCHours() === endHour && slotEnd.getUTCMinutes() > 0)) {
        continue;
      }

      // ❌ Comprobar solapamiento real
      const overlaps = existingAppointments?.some((appt) => {
        const existingStart = new Date(appt.start_datetime);
        const existingEnd = new Date(appt.end_datetime);

        return (
          existingStart < slotEnd &&
          existingEnd > slotStart
        );
      });

      if (!overlaps) {
        slots.push(slotStart);
      }
    }
  }

  return NextResponse.json({
    success: true,
    available_slots: slots.map((s) => s.toISOString()),
  });
}