export const metadata = {
  title: "DentUp",
  description: "Sistema de gestión de reservas dentales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}