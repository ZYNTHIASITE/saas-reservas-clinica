"use client";

export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageBookingPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      const res = await fetch(`/api/manage-booking?token=${token}`);
      const data = await res.json();

      if (data.success) {
        setAppointment(data.appointment);
      }

      setLoading(false);
    };

    fetchAppointment();
  }, [token]);

  const updateStatus = async (newStatus: string) => {
    if (!token) return;

    await fetch("/api/manage-booking/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        status: newStatus,
      }),
    });

    setAppointment((prev: any) => ({
      ...prev,
      status: newStatus,
    }));
  };

  if (loading) {
    return <p style={{ padding: 40 }}>Cargando...</p>;
  }

  if (!appointment) {
    return <p style={{ padding: 40 }}>Cita no encontrada</p>;
  }

  const isPast =
    new Date(appointment.start_datetime) < new Date();

  const visualStatus =
    isPast && appointment.status !== "cancelada"
      ? "completada"
      : appointment.status;

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Gestionar cita</h1>

      <p>
        <strong>Fecha:</strong>{" "}
        {new Date(appointment.start_datetime).toLocaleString()}
      </p>

      <p>
        <strong>Estado:</strong> {visualStatus}
      </p>

      {!isPast && (
        <div style={{ marginTop: 20 }}>
          {appointment.status !== "confirmada" && (
            <button
              onClick={() => updateStatus("confirmada")}
              style={{ marginRight: 10 }}
            >
              Confirmar
            </button>
          )}

          {appointment.status !== "cancelada" && (
            <button
              onClick={() => updateStatus("cancelada")}
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      {isPast && (
        <p style={{ marginTop: 20 }}>
          Esta cita ya ha finalizado y no puede modificarse.
        </p>
      )}
    </div>
  );
}