import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { token, status } = await req.json();

    if (!token || !status) {
      return NextResponse.json(
        { success: false, message: "Datos inválidos" },
        { status: 400 }
      );
    }

    if (!["pendiente", "confirmada", "cancelada"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Estado inválido" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("manage_token", token);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

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