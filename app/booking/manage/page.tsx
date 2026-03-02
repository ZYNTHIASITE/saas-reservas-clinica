"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageBookingPage() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [rescheduling, setRescheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // 🔹 Obtener token estable
  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
    else setLoading(false);
  }, [searchParams]);

  // 🔹 Cargar cita
  useEffect(() => {
    if (!token) return;

    const fetchAppointment = async () => {
      const res = await fetch(`/api/manage-booking?token=${token}`);
      const data = await res.json();

      if (data.success) {
        setAppointment(data.appointment);
      } else {
        setAppointment(null);
      }

      setLoading(false);
    };

    fetchAppointment();
  }, [token]);

  const isPast =
    appointment &&
    new Date(appointment.start_datetime) < new Date();

  const visualStatus =
    isPast && appointment?.status !== "cancelada"
      ? "completada"
      : appointment?.status;

  // 🔹 Confirmar / cancelar
  const updateStatus = async (newStatus: string) => {
    if (!token || isPast) return;

    setUpdating(true);

    await fetch("/api/manage-booking/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, status: newStatus }),
    });

    setAppointment((prev: any) => ({
      ...prev,
      status: newStatus,
    }));

    setUpdating(false);
  };

  // 🔹 Cargar disponibilidad
  const fetchAvailability = async (date: string) => {
    if (!appointment) return;

    const res = await fetch(
      `/api/availability?clinic_id=${appointment.clinic_id}&date=${date}&treatment_id=${appointment.treatment_id}`
    );

    const data = await res.json();

    if (data.success) {
      setAvailableSlots(data.available_slots);
    }
  };

  // 🔹 Confirmar nueva hora
  const handleReschedule = async (newSlot: string) => {
    if (!token || isPast || appointment.status === "cancelada")
      return;

    setUpdating(true);

    const res = await fetch("/api/manage-booking/reschedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        new_datetime: newSlot,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setAppointment((prev: any) => ({
        ...prev,
        start_datetime: newSlot,
        status: "pendiente",
      }));
      setRescheduling(false);
      setAvailableSlots([]);
    }

    setUpdating(false);
  };

  if (loading) {
    return <p className="p-10 text-center">Cargando...</p>;
  }

  if (!appointment) {
    return <p className="p-10 text-center">Cita no encontrada</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6 text-center">
      <h1 className="text-3xl font-bold">Gestionar cita</h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <p>
          <strong>Fecha:</strong>{" "}
          {new Date(appointment.start_datetime).toLocaleString()}
        </p>

        <p>
          <strong>Estado actual:</strong>{" "}
          <span className="font-semibold capitalize">
            {visualStatus}
          </span>
        </p>

        {/* 🔹 BOTONES SOLO SI NO ES PASADA */}
        {!isPast && !rescheduling && (
          <div className="flex justify-center gap-4 pt-4 flex-wrap">
            {appointment.status !== "confirmada" && (
              <button
                disabled={updating}
                onClick={() => updateStatus("confirmada")}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Confirmar
              </button>
            )}

            {appointment.status !== "cancelada" && (
              <button
                disabled={updating}
                onClick={() => updateStatus("cancelada")}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            )}

            {appointment.status !== "cancelada" && (
              <button
                onClick={() => setRescheduling(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Reprogramar
              </button>
            )}
          </div>
        )}

        {/* 🔹 REPROGRAMACIÓN */}
        {rescheduling && !isPast && appointment.status !== "cancelada" && (
          <div className="space-y-4 pt-4">
            <input
              type="date"
              className="w-full border p-3 rounded-xl"
              onChange={(e) => {
                setSelectedDate(e.target.value);
                fetchAvailability(e.target.value);
              }}
            />

            <div className="grid grid-cols-3 gap-3">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => handleReschedule(slot)}
                  className="p-3 border rounded-xl hover:bg-blue-50"
                >
                  {new Date(slot).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setRescheduling(false);
                setAvailableSlots([]);
              }}
              className="text-gray-500 underline"
            >
              Cancelar reprogramación
            </button>
          </div>
        )}

        {isPast && (
          <p className="text-sm text-gray-500 pt-4">
            Esta cita ya ha finalizado y no puede modificarse.
          </p>
        )}
      </div>
    </div>
  );
}