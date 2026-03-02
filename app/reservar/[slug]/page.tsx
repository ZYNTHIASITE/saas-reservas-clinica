"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PublicBookingPage() {
  const params = useParams();

  const rawSlug = params?.slug;
  const slug =
    typeof rawSlug === "string"
      ? rawSlug
      : Array.isArray(rawSlug)
      ? rawSlug[0]
      : null;

  const [clinic, setClinic] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [loading, setLoading] = useState(true);

  // 🔹 Cargar clínica y tratamientos
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchClinic = async () => {
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!clinicData) {
        setClinic(null);
        setLoading(false);
        return;
      }

      setClinic(clinicData);

      const { data: treatmentsData } = await supabase
        .from("treatments")
        .select("id, name, duration_minutes")
        .eq("clinic_id", clinicData.id)
        .eq("active", true);

      setTreatments(treatmentsData || []);
      setLoading(false);
    };

    fetchClinic();
  }, [slug]);

  // 🔹 Availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate || !selectedTreatment || !clinic) {
        setAvailableSlots([]);
        return;
      }

      const res = await fetch(
        `/api/availability?clinic_id=${clinic.id}&date=${selectedDate}&treatment_id=${selectedTreatment}`
      );

      const data = await res.json();

      if (data.success) {
        setAvailableSlots(data.available_slots);
      }
    };

    fetchAvailability();
  }, [selectedDate, selectedTreatment, clinic]);

  if (loading) {
    return <p className="p-10 text-center">Cargando...</p>;
  }

  if (!clinic) {
    return <p className="p-10 text-center">Clínica no encontrada</p>;
  }

if (bookingSuccess) {
  const calendarUrl = `/api/calendar?title=Cita%20Dental&start=${selectedSlot}&duration=30&location=${clinic.name}`;

  return (
    <div className="max-w-xl mx-auto p-10 text-center space-y-6">
      <h1 className="text-3xl font-bold">
        🎉 Reserva confirmada
      </h1>

      <p>Te hemos enviado un email con los detalles.</p>

      <a
        href={calendarUrl}
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl"
      >
        Añadir a mi calendario
      </a>
    </div>
  );
}

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">
        Reservar en {clinic.name}
      </h1>

      {/* PASO 1 */}
      {!selectedTreatment && (
        <>
          <h2 className="text-lg font-semibold">1️⃣ Selecciona tratamiento</h2>

          <div className="space-y-3">
            {treatments.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTreatment(t.id)}
                className="w-full p-4 border rounded-xl text-left hover:bg-gray-50"
              >
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-gray-500">
                  Duración: {t.duration_minutes} minutos
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* PASO 2 */}
      {selectedTreatment && (
        <>
          <h2 className="text-lg font-semibold">2️⃣ Selecciona fecha</h2>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot(null);
            }}
            className="w-full border p-3 rounded-xl"
          />

          {availableSlots.length > 0 && (
            <>
              <h2 className="text-lg font-semibold pt-4">
                3️⃣ Selecciona hora
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 border rounded-xl ${
                      selectedSlot === slot
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    {new Date(slot).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* PASO 4 */}
          {selectedSlot && (
            <>
              <h2 className="text-lg font-semibold pt-6">4️⃣ Tus datos</h2>

              <input
                type="text"
                placeholder="Tu nombre"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full border p-3 rounded-xl"
              />

              <input
                type="email"
                placeholder="Tu email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                className="w-full border p-3 rounded-xl"
              />

              <input
                type="tel"
                placeholder="Tu teléfono"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full border p-3 rounded-xl"
              />

              <button
                disabled={
                  !patientName ||
                  !patientEmail ||
                  !patientPhone ||
                  bookingLoading
                }
                onClick={async () => {
                  setBookingLoading(true);

                  const res = await fetch("/api/new-booking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      clinic_id: clinic.id,
                      patient_name: patientName,
                      patient_email: patientEmail,
                      patient_phone: patientPhone,
                      treatment_id: selectedTreatment,
                      appointment_date: selectedSlot,
                    }),
                  });

                  const data = await res.json();

                  if (data.success) {
                    setBookingSuccess(true);
                  } else {
                    alert(data.message || "Error al reservar");
                  }

                  setBookingLoading(false);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-xl mt-3"
              >
                {bookingLoading ? "Reservando..." : "Confirmar reserva"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}