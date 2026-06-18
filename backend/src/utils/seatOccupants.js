const Reservation = require("../models/Reservation");
const Booking = require("../models/Booking");

const enrichSeatsWithOccupants = async (eventId, seats) => {
  const [reservations, bookings] = await Promise.all([
    Reservation.find({ eventId }).populate("userId", "name email"),
    Booking.find({ eventId }).populate("userId", "name email"),
  ]);

  const reservedBySeat = new Map();
  reservations.forEach((reservation) => {
    if (!reservation.userId) return;
    const occupant = { id: reservation.userId._id, name: reservation.userId.name };
    reservation.seatNumbers.forEach((seatNumber) => {
      reservedBySeat.set(seatNumber, occupant);
    });
  });

  const bookedBySeat = new Map();
  bookings.forEach((booking) => {
    if (!booking.userId) return;
    const occupant = { id: booking.userId._id, name: booking.userId.name };
    booking.seatNumbers.forEach((seatNumber) => {
      bookedBySeat.set(seatNumber, occupant);
    });
  });

  return seats.map((seat) => {
    const payload = {
      _id: seat._id,
      seatNumber: seat.seatNumber,
      status: seat.status,
    };

    if (seat.status === "booked" && bookedBySeat.has(seat.seatNumber)) {
      payload.occupiedBy = bookedBySeat.get(seat.seatNumber);
    } else if (seat.status === "reserved" && reservedBySeat.has(seat.seatNumber)) {
      payload.occupiedBy = reservedBySeat.get(seat.seatNumber);
    }

    return payload;
  });
};

module.exports = { enrichSeatsWithOccupants };
