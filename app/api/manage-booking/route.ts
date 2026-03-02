import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Token requerido" },
      { status: 400 }
    );
  }

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("manage_token", token)
    .single();

  if (!data) {
    return NextResponse.json(
      { success: false, message: "Cita no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    appointment: data,
  });
}