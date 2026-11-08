import { eventById } from "@/lib/events/catalogue";
import { eventCalendar } from "@/lib/events/calendar";

export function GET(_request: Request, { params }: { params: { id: string } }) {
  const event = eventById(params.id);
  if (!event) return new Response("Event not found", { status: 404 });
  return new Response(eventCalendar(event), { headers: {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": `attachment; filename="${event.id}.ics"`,
    "Cache-Control": "no-store"
  } });
}
