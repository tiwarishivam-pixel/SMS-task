const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Event = require("../models/Event");

const reconcileSeatsFromBookings = async () => {
  const bookings = await Booking.find().select("eventId seatNumbers");
  const orphanedIds = [];

  for (const booking of bookings) {
    const eventExists = await Event.exists({ _id: booking.eventId });
    if (!eventExists) {
      orphanedIds.push(booking._id);
      continue;
    }

    await Seat.updateMany(
      { eventId: booking.eventId, seatNumber: { $in: booking.seatNumbers } },
      { $set: { status: "booked", reservationId: null, reservationExpiresAt: null } }
    );
  }

  if (orphanedIds.length > 0) {
    await Booking.deleteMany({ _id: { $in: orphanedIds } });
  }
};

module.exports = { reconcileSeatsFromBookings };
