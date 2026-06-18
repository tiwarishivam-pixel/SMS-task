import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import api from "@/api/client";
import type { EventSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const EventsPage = () => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/events")
      .then((res) => setEvents(res.data))
      .catch(() => setError("Unable to fetch events."))
      .finally(() => setLoading(false));
  }, []);

  const featured = events[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Upcoming Events</h1>
        <p className="text-muted-foreground mt-1">Pick an event and view seat availability in real time.</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading events...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {featured && (
            <Link to={`/events/${featured._id}`} className="block group">
              <Card className="overflow-hidden border-border bg-gradient-to-br from-zinc-900 to-zinc-800 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                <CardHeader>
                  <span className="text-xs font-bold uppercase tracking-wider text-black bg-white w-fit px-2 py-1 rounded-full">
                    Featured
                  </span>
                  <CardTitle className="text-2xl">{featured.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{featured.venue}</p>
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(featured.dateTime).toLocaleString()}</p>
                  <div className="flex gap-2 pt-2">
                    <span className="px-2 py-1 rounded-full bg-white text-black text-xs">{featured.seatStats.available} free</span>
                    <span className="px-2 py-1 rounded-full bg-zinc-600/50 text-zinc-200 text-xs">{featured.seatStats.booked} booked</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.map((event) => (
                <Link
                  key={event._id}
                  to={`/events/${event._id}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border hover:bg-accent/50 transition-all duration-200 hover:shadow-sm"
                >
                  <div>
                    <p className="font-semibold">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{new Date(event.dateTime).toLocaleDateString()}</p>
                    <p className="text-muted-foreground">{event.seatStats.available} seats left</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-zinc-900/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg">Quick tip</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Open any event to see who sits where. Only seat-level occupancy is shared — not full booking history.
            </CardContent>
          </Card>
          <div className="grid gap-3">
            {events.slice(0, 4).map((event) => (
              <Link key={event._id} to={`/events/${event._id}`}>
                <Card className={cn("transition-all duration-200 hover:shadow-md hover:-translate-y-0.5")}>
                  <CardContent className="p-4">
                    <p className="font-medium text-sm">{event.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.seatStats.booked}/{event.totalSeats} booked</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
