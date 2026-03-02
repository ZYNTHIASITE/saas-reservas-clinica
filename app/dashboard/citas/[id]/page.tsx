"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditAppointmentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const [patientName, setPatientName] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [status, setStatus] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");

  const [treatments, setTreatments] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      // 1️⃣ Cargar cita completa
      const { data: appt } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();

      if (!appt) return;

      setClinicId(appt.clinic_id);
      setPatientName(appt.patient_name);
      setTreatmentId(appt.treatment_id);
      setStatus(appt.status);

      setAppointmentDate(
        new Date(appt.appointment_date)
          .toISOString()
          .slice(0, 16)
      );

      // 2️⃣ Cargar tratamientos de la clínica
      const { data: treatmentsData } = await supabase
        .from("treatments")
        .select("id, name")
        .eq("clinic_id", appt.clinic_id)
        .eq("active", true);

      setTreatments(treatmentsData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleUpdate = async () => {
    if (!clinicId) return;

    const res = await fetch("/api/update-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointment_id: id,
        clinic_id: clinicId,
        patient_name: patientName,
        treatment_id: treatmentId,
        appointment_date: appointmentDate,
        status: status,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message);
      return;
    }

    router.push("/dashboard");
  };

  const handleDelete = async () => {
    await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    router.push("/dashboard");
  };

  if (loading) {
    return <p className="p-10">Cargando...</p>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Editar cita</h1>

      <input
        type="text"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
        className="w-full border p-2 rounded"
        placeholder="Nombre del paciente"
      />

      <select
        value={treatmentId}
        onChange={(e) => setTreatmentId(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">Selecciona tratamiento</option>
        {treatments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <input
        type="datetime-local"
        value={appointmentDate}
        onChange={(e) => setAppointmentDate(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="pendiente">Pendiente</option>
        <option value="confirmada">Confirmada</option>
        <option value="cancelada">Cancelada</option>
      </select>

      <div className="flex justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-600"
        >
          Cancelar
        </button>

        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Eliminar
        </button>

        <button
          onClick={handleUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}