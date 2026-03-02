"use client";

import { useState, useEffect } from "react";
import { useAppointments } from "@/hooks/useAppointments";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
const {
  appointments,
  createAppointment,
  clinicId,
  updateStatus,
} = useAppointments();
  const [showModal, setShowModal] = useState(false);
  const [patientName, setPatientName] = useState("");

  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  const todaysAppointments = appointments.filter((a) =>
    a.appointment_date.startsWith(todayString)
  );

  const confirmed = todaysAppointments.filter(
    (a) => a.status === "confirmada"
  ).length;

  const pending = todaysAppointments.filter(
    (a) => a.status === "pendiente"
  ).length;

  // 🔹 Cargar tratamientos
  useEffect(() => {
    if (!clinicId) return;

    const fetchTreatments = async () => {
      const { data } = await supabase
        .from("treatments")
        .select("id, name")
        .eq("clinic_id", clinicId)
        .eq("active", true);

      setTreatments(data || []);
    };

    fetchTreatments();
  }, [clinicId]);

  // 🔹 Availability sincronizado correctamente
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate || !clinicId || !selectedTreatmentId) {
        setAvailableSlots([]);
        return;
      }

      const res = await fetch(
        `/api/availability?clinic_id=${clinicId}&date=${selectedDate}&treatment_id=${selectedTreatmentId}`
      );

      const data = await res.json();

      if (data.success) {
        setAvailableSlots(data.available_slots);
      }
    };

    fetchAvailability();
  }, [selectedDate, selectedTreatmentId, clinicId]);

  const handleCreate = async () => {
    if (!patientName || !selectedTreatmentId || !selectedSlot) return;

    await createAppointment(
      patientName,
      selectedTreatmentId,
      selectedSlot
    );

    setShowModal(false);
    setPatientName("");
    setSelectedTreatmentId("");
    setSelectedDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
  };

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Clínica</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Nueva cita
        </button>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Citas hoy</p>
          <p className="text-3xl font-bold mt-2">
            {todaysAppointments.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Confirmadas</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {confirmed}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Pendientes</p>
          <p className="text-3xl font-bold text-yellow-500 mt-2">
            {pending}
          </p>
        </div>
      </div>

      {/* AGENDA DEL DÍA */}
<div>
  <h2 className="text-xl font-semibold mb-4">Agenda de hoy</h2>

  <div className="space-y-4">
    {todaysAppointments.length === 0 && (
      <p className="text-gray-500">No hay citas hoy.</p>
    )}

    {todaysAppointments.map((appointment) => (
      <div
        key={appointment.id}
        className="bg-white p-4 rounded-xl shadow space-y-3"
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold">
              {new Date(
                appointment.appointment_date
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              - {appointment.patient_name}
            </p>

            <p className="text-gray-600">
              {appointment.treatment_name}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-sm ${
              appointment.status === "confirmada"
                ? "bg-green-100 text-green-700"
                : appointment.status === "cancelada"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {appointment.status}
          </span>
        </div>

        <div className="flex gap-2">
          {appointment.status !== "confirmada" && (
            <button
              onClick={() =>
                updateStatus(appointment.id, "confirmada")
              }
              className="text-sm bg-green-600 text-white px-3 py-1 rounded"
            >
              Confirmar
            </button>
          )}

          {appointment.status !== "cancelada" && (
            <button
              onClick={() =>
                updateStatus(appointment.id, "cancelada")
              }
              className="text-sm bg-red-600 text-white px-3 py-1 rounded"
            >
              Cancelar
            </button>
          )}

          {appointment.status !== "pendiente" && (
            <button
              onClick={() =>
                updateStatus(appointment.id, "pendiente")
              }
              className="text-sm bg-yellow-500 text-white px-3 py-1 rounded"
            >
              Marcar pendiente
            </button>
          )}

          <button
            onClick={() =>
              router.push(`/dashboard/citas/${appointment.id}`)
            }
            className="text-sm border px-3 py-1 rounded"
          >
            Editar
          </button>
        </div>
      </div>
    ))}
  </div>
</div>
      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-96 space-y-4">
            <h2 className="text-xl font-semibold">Nueva cita</h2>

            <input
              type="text"
              placeholder="Nombre del paciente"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <select
              value={selectedTreatmentId}
              onChange={(e) => {
                setSelectedTreatmentId(e.target.value);
                setSelectedSlot("");
                setAvailableSlots([]);
              }}
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
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border p-2 rounded"
            />

            {availableSlots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 rounded border text-sm ${
                      selectedSlot === slot
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {new Date(slot).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreate}
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