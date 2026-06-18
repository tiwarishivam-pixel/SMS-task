export type SeatStatus = "available" | "reserved" | "booked";

export interface SeatOccupant {
  id: string;
  name: string;
}

export interface EventSummary {
  _id: string;
  name: string;
  dateTime: string;
  venue: string;
  totalSeats: number;
  seatStats: Record<SeatStatus, number>;
}

export interface Seat {
  _id: string;
  seatNumber: string;
  status: SeatStatus;
  occupiedBy?: SeatOccupant;
}

export interface EventDetail {
  _id: string;
  name: string;
  dateTime: string;
  venue: string;
  totalSeats: number;
  seats: Seat[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  bio?: string;
  joinedAt: string;
}

export interface UserBooking {
  _id: string;
  seatNumbers: string[];
  createdAt: string;
  eventId: { name: string; venue: string; dateTime: string };
}
