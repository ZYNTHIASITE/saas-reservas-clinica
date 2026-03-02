"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Treatment = {
  id: string;
  name: string;
  duration_minutes: number;
  active: boolean;
};

export default function TratamientosPage() {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);

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

  // 🔹 Cargar tratamientos
  useEffect(() => {
    if (!clinicId) return;

    const fetchTreatments = async () => {
      const { data } = await supabase
        .from("treatments")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      setTreatments(data || []);
    };

    fetchTreatments();
  }, [clinicId]);

  const refreshTreatments = async () => {
    if (!clinicId) return;

    const { data } = await supabase
      .from("treatments")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    setTreatments(data || []);
  };

  // 🔹 Crear tratamiento
  const createTreatment = async () => {
    if (!clinicId || !name || !duration) return;

    await supabase.from("treatments").insert([
      {
        clinic_id: clinicId,
        name,
        duration_minutes: duration,
        active: true,
      },
    ]);

    setName("");
    setDuration(30);
    setShowModal(false);
    refreshTreatments();
  };

  // 🔹 Activar / desactivar
  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from("treatments")
      .update({ active: !current })
      .eq("id", id);

    refreshTreatments();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tratamientos</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Nuevo tratamiento
        </button>
      </div>

      <div className="space-y-4">
        {treatments.length === 0 && (
          <p className="text-gray-500">
            No hay tratamientos creados.
          </p>
        )}

        {treatments.map((t) => (
          <div
            key={t.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-gray-600">
                Duración: {t.duration_minutes} minutos
              </p>
              <p
                className={`text-sm ${
                  t.active ? "text-green-600" : "text-red-600"
                }`}
              >
                {t.active ? "Activo" : "Inactivo"}
              </p>
            </div>

            <button
              onClick={() => toggleActive(t.id, t.active)}
              className="border px-3 py-1 rounded"
            >
              {t.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-96 space-y-4">
            <h2 className="text-xl font-semibold">
              Nuevo tratamiento
            </h2>

            <input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              placeholder="Duración (minutos)"
              value={duration}
              onChange={(e) =>
                setDuration(Number(e.target.value))
              }
              className="w-full border p-2 rounded"
            />

            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600"
              >
                Cancelar
              </button>

              <button
                onClick={createTreatment}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}