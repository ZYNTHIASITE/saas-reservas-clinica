"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUserEmail(session.user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const { data: clinic } = await supabase
          .from("clinics")
          .select("name")
          .eq("id", profile.clinic_id)
          .single();

        if (clinic) {
          setClinicName(clinic.name);
        }
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return <div className="p-10">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600 mb-8">
            DentUp
          </h2>

          <nav className="space-y-4">
            <a href="/dashboard" className="block hover:text-blue-600">
              Dashboard
            </a>
            <a href="#" className="block text-gray-400 cursor-not-allowed">
              Agenda
            </a>
            <a href="#" className="block text-gray-400 cursor-not-allowed">
              Pacientes
            </a>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 text-sm text-red-600 hover:underline"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm text-gray-500">
              Clínica
            </p>
            <p className="font-semibold">
              {clinicName}
            </p>
          </div>

          <div className="text-sm text-gray-600">
            {userEmail}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}