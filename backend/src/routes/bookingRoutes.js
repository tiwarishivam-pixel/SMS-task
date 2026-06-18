const express = require("express");
const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/authMiddleware");
const { releaseExpiredReservationsForEvent } = require("../utils/reservationCleanup");
const { reconcileSeatsFromBookings } = require("../utils/reconcileSeats");

const router = express.Router();

router.post("/bookings", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservationId } = req.body;
    if (!reservationId) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Reservation ID is required." });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      userId: req.user.id,
    }).session(session);

    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Reservation not found." });
    }

    await releaseExpiredReservationsForEvent(reservation.eventId, session);

    const freshReservation = await Reservation.findById(reservationId).session(session);
    if (!freshReservation || freshReservation.expiresAt <= new Date()) {
      await session.abortTransaction();
      return res.status(410).json({ message: "Reservation expired. Please reserve seats again." });
    }

    const updateResult = await Seat.updateMany(
      {
        _id: { $in: freshReservation.seatIds },
        status: "reserved",
        reservationId: freshReservation._id,
      },
      {
        $set: {
          status: "booked",
          reservationId: null,
          reservationExpiresAt: null,
        },
      },
      { session }
    );

    if (updateResult.modifiedCount !== freshReservation.seatIds.length) {
      await session.abortTransaction();
      return res.status(409).json({ message: "Some seats are no longer reservable. Try again." });
    }

    const booking = await Booking.create(
      [
        {
          userId: req.user.id,
          eventId: freshReservation.eventId,
          seatNumbers: freshReservation.seatNumbers,
          reservationId: freshReservation._id,
        },
      ],
      { session }
    );

    await Reservation.deleteOne({ _id: freshReservation._id }).session(session);

    await session.commitTransaction();
    await reconcileSeatsFromBookings();
    return res.status(201).json({
      message: "Booking confirmed successfully.",
      booking: booking[0],
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Booking failed.", error: error.message });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
