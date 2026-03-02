"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Appointment = {
  id: string;
  patient_name: string;
  appointment_date: string;
  status: string;
  treatment_id: string;
  treatment_name?: string;
};

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async (clinic_id: string) => {
    const { data } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_name,
        appointment_date,
        status,
        treatment_id,
        treatments (
          name
        )
      `)
      .eq("clinic_id", clinic_id)
      .order("appointment_date", { ascending: true });

    const formatted =
      data?.map((a: any) => ({
        id: a.id,
        patient_name: a.patient_name,
        appointment_date: a.appointment_date,
        status: a.status,
        treatment_id: a.treatment_id,
        treatment_name: a.treatments?.name ?? "",
      })) ?? [];

    setAppointments(formatted);
  };

  const createAppointment = async (
    patient_name: string,
    treatment_id: string,
    appointment_date: string
  ) => {
    if (!clinicId) return;

    await supabase.from("appointments").insert([
      {
        clinic_id: clinicId,
        patient_name,
        treatment_id,
        appointment_date,
        status: "pendiente",
      },
    ]);

    await fetchAppointments(clinicId);
  };

  const updateStatus = async (id: string, status: string) => {
    if (!clinicId) return;

    await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    await fetchAppointments(clinicId);
  };

  const getClinicId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    return profile?.clinic_id || null;
  };

  useEffect(() => {
    const init = async () => {
      const id = await getClinicId();
      if (!id) return;

      setClinicId(id);
      await fetchAppointments(id);
      setLoading(false);
    };

    init();
  }, []);

  return {
    appointments,
    clinicId,
    loading,
    createAppointment,
    updateStatus,
  };
}