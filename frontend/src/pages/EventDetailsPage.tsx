import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { ArrowLeft, Clock } from "lucide-react";
import api from "@/api/client";
import SeatGrid from "@/components/SeatGrid";
import type { EventDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEvent = async () => {
    if (!id) return;
    const response = await api.get(`/events/${id}`);
    setEvent(response.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await fetchEvent();
      } catch {
        setError("Failed to load event.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        setReservationId(null);
        setExpiresAt(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleToggleSeat = (seatNumber: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber) ? prev.filter((seat) => seat !== seatNumber) : [...prev, seatNumber]
    );
  };

  const handleReserve = async () => {
    if (!id || selectedSeats.length === 0) return;
    setError("");
    setMessage("");
    try {
      const response = await api.post("/reserve", { eventId: id, seatNumbers: selectedSeats });
      setReservationId(response.data.reservationId);
      setExpiresAt(response.data.expiresAt);
      setMessage(`Reserved seats: ${response.data.seatNumbers.join(", ")}`);
      await fetchEvent();
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Reservation failed.");
      await fetchEvent();
    }
  };

  const handleConfirmBooking = async () => {
    if (!reservationId) return;
    setError("");
    setMessage("");
    try {
      const response = await api.post("/bookings", { reservationId });
      setMessage(`Booking confirmed for seats: ${response.data.booking.seatNumbers.join(", ")}`);
      setReservationId(null);
      setExpiresAt(null);
      setSelectedSeats([]);
      await fetchEvent();
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Booking failed.");
      await fetchEvent();
    }
  };

  const timerLabel = useMemo(() => {
    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const secs = String(secondsLeft % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }, [secondsLeft]);

  if (loading) return <p className="text-muted-foreground">Loading event...</p>;
  if (!event) return <p className="text-destructive">Event not found.</p>;

  const occupiedSeats = event.seats.filter((seat) => seat.occupiedBy);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm text-primary hover:underline transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-white">{event.name}</CardTitle>
            <p className="text-muted-foreground mt-1">{new Date(event.dateTime).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{event.venue}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["available", "reserved", "booked", "selected"] as const).map((status) => (
              <span
                key={status}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                  status === "available" && "bg-white text-black",
                  status === "reserved" && "bg-zinc-500/25 text-zinc-200",
                  status === "booked" && "bg-zinc-600/40 text-zinc-300",
                  status === "selected" && "bg-white text-black border border-black/20"
                )}
              >
                {status === "selected" ? "Your pick" : status}
              </span>
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <SeatGrid seats={event.seats} selectedSeats={selectedSeats} onToggle={handleToggleSeat} />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selected: {selectedSeats.length ? selectedSeats.join(", ") : "None"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleReserve} disabled={!selectedSeats.length} className="text-black">
                  Reserve
                </Button>
                <Button variant="outline" onClick={handleConfirmBooking} disabled={!reservationId || secondsLeft === 0}>
                  Confirm Booking
                </Button>
              </div>
              {reservationId && secondsLeft > 0 && (
                <p className="flex items-center gap-2 text-zinc-200 text-sm font-medium">
                  <Clock className="h-4 w-4" /> Expires in {timerLabel}
                </p>
              )}
              {message && <p className="text-sm text-white">{message}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Who&apos;s sitting where</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Seat-level view only — booking history stays private.</p>
            {occupiedSeats.length === 0 && <p className="text-sm text-muted-foreground">No occupied seats yet.</p>}
            {occupiedSeats.map((seat) => (
              <div key={seat._id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                <span
                  className={cn(
                    "min-w-[42px] text-center font-bold text-sm py-1.5 rounded-md",
                    seat.status === "booked" ? "bg-zinc-600/50 text-white" : "bg-zinc-500/30 text-zinc-200"
                  )}
                >
                  {seat.seatNumber}
                </span>
                <div>
                  <p className="text-sm font-medium">{seat.occupiedBy?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{seat.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventDetailsPage;
