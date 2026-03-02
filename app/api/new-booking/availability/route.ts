import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const clinic_id = searchParams.get("clinic_id");
    const date = searchParams.get("date"); // formato: YYYY-MM-DD

    if (!clinic_id || !date) {
      return NextResponse.json(
        { success: false, message: "Faltan parámetros" },
        { status: 400 }
      );
    }

    // ⏰ Horario fijo inicial (luego lo haremos dinámico)
    const startHour = 9;
    const endHour = 18;

    // 📅 Obtener citas ya existentes ese día
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: appointments } = await supabase
      .from("appointments")
      .select("appointment_date")
      .eq("clinic_id", clinic_id)
      .gte("appointment_date", startOfDay)
      .lte("appointment_date", endOfDay);

    const bookedSlots = appointments?.map((a) =>
      new Date(a.appointment_date).getHours()
    ) || [];

    // 🧠 Generar todos los posibles slots
    const availableSlots: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      if (!bookedSlots.includes(hour)) {
        const slot = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
        availableSlots.push(slot.toISOString());
      }
    }

    return NextResponse.json({
      success: true,
      available_slots: availableSlots,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    );
  }
}