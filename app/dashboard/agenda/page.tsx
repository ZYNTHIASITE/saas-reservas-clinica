"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Appointment = {
  id: string;
  patient_name: string;
  treatment: string;
  appointment_date: string;
  status: string;
};

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();

  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*");

    setAppointments(data || []);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter((a) => {
      const date = new Date(a.appointment_date);
      return (
        date.getDate() === day &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });
  };

  const renderCalendar = () => {
    const cells = [];
    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startDay + 1;

      if (dayNumber < 1 || dayNumber > daysInMonth) {
        cells.push(
          <div
            key={i}
            className="border bg-gray-50 rounded-lg"
          />
        );
      } else {
        const dayAppointments = getAppointmentsForDay(dayNumber);

        cells.push(
          <div
            key={i}
            className="border bg-white rounded-lg p-2 overflow-hidden"
          >
            <div className="font-semibold text-sm mb-1">
              {dayNumber}
            </div>

            <div className="space-y-1">
              {dayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => setSelectedAppointment(appt)}
                  className="text-[10px] bg-blue-100 text-blue-700 px-1 py-[2px] rounded cursor-pointer truncate hover:bg-blue-200"
                >
                  {new Date(appt.appointment_date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  {appt.patient_name}
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    return cells;
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <h1 className="text-3xl font-bold">
        Agenda mensual
      </h1>

      {/* Encabezados */}
      <div className="grid grid-cols-7 text-center font-semibold">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mié</div>
        <div>Jue</div>
        <div>Vie</div>
        <div>Sáb</div>
        <div>Dom</div>
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-2 auto-rows-[110px]">
        {renderCalendar()}
      </div>

      {/* Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-96 space-y-4 shadow-lg">
            <h2 className="text-xl font-semibold">
              Detalle de cita
            </h2>

            <p>
              <strong>Paciente:</strong>{" "}
              {selectedAppointment.patient_name}
            </p>

            <p>
              <strong>Tratamiento:</strong>{" "}
              {selectedAppointment.treatment}
            </p>

            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(
                selectedAppointment.appointment_date
              ).toLocaleString()}
            </p>

            <p>
              <strong>Estado:</strong>{" "}
              {selectedAppointment.status}
            </p>

            <button
              onClick={() => setSelectedAppointment(null)}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}