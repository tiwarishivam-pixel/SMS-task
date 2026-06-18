const express = require("express");
const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Seat = require("../models/Seat");
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");
const { releaseExpiredReservationsForEvent } = require("../utils/reservationCleanup");

const router = express.Router();

router.post("/reserve", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, seatNumbers } = req.body;
    if (!eventId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Event ID and seat numbers are required." });
    }

    const uniqueSeatNumbers = [...new Set(seatNumbers.map((seat) => String(seat).trim()))];
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Event not found." });
    }

    await releaseExpiredReservationsForEvent(eventId, session);

    const seats = await Seat.find({
      eventId,
      seatNumber: { $in: uniqueSeatNumbers },
    }).session(session);

    if (seats.length !== uniqueSeatNumbers.length) {
      await session.abortTransaction();
      return res.status(404).json({ message: "One or more seats do not exist." });
    }

    const availableSeats = seats.filter((seat) => seat.status === "available");
    if (availableSeats.length !== uniqueSeatNumbers.length) {
      await session.abortTransaction();
      return res.status(409).json({ message: "One or more selected seats are no longer available." });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const reservation = await Reservation.create(
      [
        {
          userId: req.user.id,
          eventId,
          seatNumbers: uniqueSeatNumbers,
          seatIds: availableSeats.map((seat) => seat._id),
          expiresAt,
        },
      ],
      { session }
    );

    const reservationId = reservation[0]._id;

    const updateResult = await Seat.updateMany(
      {
        _id: { $in: availableSeats.map((seat) => seat._id) },
        status: "available",
      },
      {
        $set: {
          status: "reserved",
          reservationId,
          reservationExpiresAt: expiresAt,
        },
      },
      { session }
    );

    if (updateResult.modifiedCount !== uniqueSeatNumbers.length) {
      await session.abortTransaction();
      return res.status(409).json({ message: "Seat reservation failed due to concurrent change." });
    }

    await session.commitTransaction();

    return res.status(201).json({
      message: "Seats reserved successfully.",
      reservationId,
      expiresAt,
      seatNumbers: uniqueSeatNumbers,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Reservation failed.", error: error.message });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
