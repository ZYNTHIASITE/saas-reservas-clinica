import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title");
  const start = searchParams.get("start");
  const duration = searchParams.get("duration");
  const location = searchParams.get("location");

  if (!title || !start || !duration) {
    return NextResponse.json(
      { error: "Faltan parámetros" },
      { status: 400 }
    );
  }

  const startDate = new Date(start);
  const endDate = new Date(
    startDate.getTime() + parseInt(duration) * 60000
  );

  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dental SaaS//ES
BEGIN:VEVENT
UID:${Date.now()}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
LOCATION:${location || "Clínica Dental"}
END:VEVENT
END:VCALENDAR
`;

  return new NextResponse(icsContent.trim(), {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": "attachment; filename=appointment.ics",
    },
  });
}