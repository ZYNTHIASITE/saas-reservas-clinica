import { Suspense } from "react";
import ManageBookingClient from "./ManageBookingClient";

export default function Page() {
  return (
    <Suspense fallback={<p style={{ padding: 40 }}>Cargando...</p>}>
      <ManageBookingClient />
    </Suspense>
  );
}