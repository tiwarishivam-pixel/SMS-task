import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import api from "@/api/client";
import type { UserBooking } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/users/me/bookings")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Failed to load your bookings."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">My Bookings</h1>
        <p className="text-muted-foreground mt-1">Only your confirmed bookings are shown here.</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && bookings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Ticket className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No bookings yet. Reserve seats from an event page.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <Card key={booking._id} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{booking.eventId?.name || "Event"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 text-muted-foreground">
              <p>{booking.eventId?.venue}</p>
              <p>{booking.eventId?.dateTime ? new Date(booking.eventId.dateTime).toLocaleString() : ""}</p>
              <p className="font-medium text-foreground pt-2">Seats: {booking.seatNumbers.join(", ")}</p>
              <p className="text-xs">Booked {new Date(booking.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyBookingsPage;
