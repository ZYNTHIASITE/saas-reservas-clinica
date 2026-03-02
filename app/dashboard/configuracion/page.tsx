"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Block = {
  id: string;
  start_datetime: string;
  end_datetime: string;
};

export default function ConfiguracionPage() {
  const [clinicId, setClinicId] = useState<string | null>(null);

  const [openingHour, setOpeningHour] = useState(9);
  const [closingHour, setClosingHour] = useState(18);

  const [blocks, setBlocks] = useState<Block[]>([]);

  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");

  // 🔹 Obtener clinicId
  useEffect(() => {
    const getClinicId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (profile?.clinic_id) {
        setClinicId(profile.clinic_id);
      }
    };

    getClinicId();
  }, []);

  // 🔹 Cargar configuración y bloqueos
  useEffect(() => {
    if (!clinicId) return;

    const loadData = async () => {
      // Horario
      const { data: clinic } = await supabase
        .from("clinics")
        .select("opening_hour, closing_hour")
        .eq("id", clinicId)
        .single();

      if (clinic) {
        setOpeningHour(clinic.opening_hour);
        setClosingHour(clinic.closing_hour);
      }

      // Bloqueos
      const { data: blocked } = await supabase
        .from("blocked_slots")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("start_datetime", { ascending: false });

      setBlocks(blocked || []);
    };

    loadData();
  }, [clinicId]);

  const refreshBlocks = async () => {
    if (!clinicId) return;

    const { data } = await supabase
      .from("blocked_slots")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("start_datetime", { ascending: false });

    setBlocks(data || []);
  };

  // 🔹 Guardar horario
  const saveSchedule = async () => {
    if (!clinicId) return;

    await supabase
      .from("clinics")
      .update({
        opening_hour: openingHour,
        closing_hour: closingHour,
      })
      .eq("id", clinicId);

    alert("Horario actualizado");
  };

  // 🔹 Crear bloqueo
  const createBlock = async () => {
    if (!clinicId || !blockDate || !blockStart || !blockEnd) return;

    const start = new Date(`${blockDate}T${blockStart}:00Z`);
    const end = new Date(`${blockDate}T${blockEnd}:00Z`);

    await supabase.from("blocked_slots").insert([
      {
        clinic_id: clinicId,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
      },
    ]);

    setBlockDate("");
    setBlockStart("");
    setBlockEnd("");

    refreshBlocks();
  };

  // 🔹 Eliminar bloqueo
  const deleteBlock = async (id: string) => {
    await supabase.from("blocked_slots").delete().eq("id", id);
    refreshBlocks();
  };

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Configuración</h1>

      {/* HORARIO */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Horario</h2>

        <div className="flex gap-4">
          <div>
            <label>Apertura</label>
            <input
              type="number"
              value={openingHour}
              onChange={(e) => setOpeningHour(Number(e.target.value))}
              className="border p-2 rounded w-24"
            />
          </div>

          <div>
            <label>Cierre</label>
            <input
              type="number"
              value={closingHour}
              onChange={(e) => setClosingHour(Number(e.target.value))}
              className="border p-2 rounded w-24"
            />
          </div>
        </div>

        <button
          onClick={saveSchedule}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Guardar horario
        </button>
      </div>

      {/* BLOQUEOS */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Bloquear horario</h2>

        <div className="flex gap-4">
          <input
            type="date"
            value={blockDate}
            onChange={(e) => setBlockDate(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="time"
            value={blockStart}
            onChange={(e) => setBlockStart(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="time"
            value={blockEnd}
            onChange={(e) => setBlockEnd(e.target.value)}
            className="border p-2 rounded"
          />

          <button
            onClick={createBlock}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Bloquear
          </button>
        </div>

        <div className="space-y-2">
          {blocks.map((b) => (
            <div
              key={b.id}
              className="flex justify-between items-center border p-3 rounded"
            >
              <div>
                {new Date(b.start_datetime).toLocaleString()} —{" "}
                {new Date(b.end_datetime).toLocaleString()}
              </div>

              <button
                onClick={() => deleteBlock(b.id)}
                className="text-red-600"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}