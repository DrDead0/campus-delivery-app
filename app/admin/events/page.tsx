import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/app/db";
import Event from "@/app/models/events.model";
import { EventsListClient } from "./events-list-client";
import { AutoRefresh } from "@/components/auto-refresh";

async function getAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}

export default async function AdminEventsPage() {
  const isAuthed = await getAuth();
  if (!isAuthed) redirect("/admin/login");

  try {
    const conn = await dbConnect();
    const eventsData = conn
      ? await Event.find({}).sort({ date: -1 }).lean()
      : [];

    // Convert MongoDB objects to plain JS objects
    const plainEvents = JSON.parse(JSON.stringify(eventsData));

    return (
      <div className="min-h-screen px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Manage Events</h1>
          <a
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Back to Dashboard
          </a>
        </div>

        <EventsListClient initialEvents={plainEvents} />
        <AutoRefresh />
      </div>
    );
  } catch (err) {
    console.error("AdminEventsPage error:", err);
    return (
      <div className="min-h-screen p-4">
        <p className="text-red-600">Failed to load events management page.</p>
      </div>
    );
  }
}
