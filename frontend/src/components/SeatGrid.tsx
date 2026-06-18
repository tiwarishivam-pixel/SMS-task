import type { Seat } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onToggle: (seatNumber: string) => void;
}

const SeatGrid = ({ seats, selectedSeats, onToggle }: SeatGridProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Seat Map</CardTitle>
        <p className="text-sm text-muted-foreground">See who occupies each seat before you book.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
          {seats.map((seat) => {
            const isSelected = selectedSeats.includes(seat.seatNumber);
            const isAvailable = seat.status === "available";

            return (
              <button
                key={seat._id}
                type="button"
                disabled={!isAvailable}
                onClick={() => onToggle(seat.seatNumber)}
                title={seat.occupiedBy ? `${seat.seatNumber} — ${seat.occupiedBy.name}` : seat.seatNumber}
                className={cn(
                  "min-h-[80px] rounded-xl border-2 p-2 flex flex-col items-center justify-center gap-1 transition-all duration-200",
                  seat.status === "available" && "bg-white border-zinc-300 text-black hover:shadow-md hover:-translate-y-0.5",
                  seat.status === "reserved" && "bg-zinc-700/40 border-zinc-600/50 text-zinc-300 cursor-not-allowed",
                  seat.status === "booked" && "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 cursor-not-allowed",
                  isSelected && "border-black ring-2 ring-black/20 shadow-md"
                )}
              >
                <span
                  className={cn(
                    "font-bold text-sm",
                    seat.status === "available" || isSelected ? "text-black" : "text-inherit"
                  )}
                >
                  {seat.seatNumber}
                </span>
                {seat.occupiedBy ? (
                  <span
                    className={cn(
                      "text-[10px] text-center leading-tight line-clamp-2",
                      seat.status === "available" ? "text-zinc-700" : "text-muted-foreground"
                    )}
                  >
                    {seat.occupiedBy.name}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeatGrid;
