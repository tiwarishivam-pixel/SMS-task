const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const Seat = require("../models/Seat");
const Reservation = require("../models/Reservation");
const Booking = require("../models/Booking");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { createSeatLabels } = require("../utils/seatLabels");
const { reconcileSeatsFromBookings } = require("../utils/reconcileSeats");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", async (_req, res) => {
  try {
    await reconcileSeatsFromBookings();

    const [events, bookings, reservations, users, available, reserved, booked] = await Promise.all([
      Event.countDocuments(),
      Booking.countDocuments(),
      Reservation.countDocuments(),
      User.countDocuments(),
      Seat.countDocuments({ status: "available" }),
      Seat.countDocuments({ status: "reserved" }),
      Seat.countDocuments({ status: "booked" }),
    ]);

    return res.status(200).json({
      events,
      bookings,
      reservations,
      users,
      seats: { available, reserved, booked },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard.", error: error.message });
  }
});

router.get("/events", async (_req, res) => {
  try {
    const events = await Event.find().sort({ dateTime: 1 });
    const eventIds = events.map((event) => event._id);
    const seatStats = await Seat.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: { eventId: "$eventId", status: "$status" }, count: { $sum: 1 } } },
    ]);

    const statsMap = new Map();
    seatStats.forEach((entry) => {
      const key = entry._id.eventId.toString();
      if (!statsMap.has(key)) {
        statsMap.set(key, { available: 0, reserved: 0, booked: 0 });
      }
      statsMap.get(key)[entry._id.status] = entry.count;
    });

    const payload = events.map((event) => ({
      _id: event._id,
      name: event.name,
      dateTime: event.dateTime,
      venue: event.venue,
      totalSeats: event.totalSeats,
      seatStats: statsMap.get(event._id.toString()) || { available: 0, reserved: 0, booked: 0 },
    }));

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch events.", error: error.message });
  }
});

router.post("/events", async (req, res) => {
  try {
    const { name, dateTime, venue, totalSeats } = req.body;
    if (!name || !dateTime || !venue || !totalSeats) {
      return res.status(400).json({ message: "Name, dateTime, venue and totalSeats are required." });
    }
    if (totalSeats < 1 || totalSeats > 500) {
      return res.status(400).json({ message: "totalSeats must be between 1 and 500." });
    }

    const event = await Event.create({ name, dateTime, venue, totalSeats });
    const seatLabels = createSeatLabels(totalSeats);
    const seats = seatLabels.map((seatNumber) => ({
      eventId: event._id,
      seatNumber,
      status: "available",
    }));
    await Seat.insertMany(seats);

    return res.status(201).json({ message: "Event created.", event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create event.", error: error.message });
  }
});

router.put("/events/:id", async (req, res) => {
  try {
    const { name, dateTime, venue, totalSeats } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (name) event.name = name;
    if (dateTime) event.dateTime = dateTime;
    if (venue) event.venue = venue;

    if (totalSeats !== undefined) {
      if (totalSeats < 1 || totalSeats > 500) {
        return res.status(400).json({ message: "totalSeats must be between 1 and 500." });
      }

      const currentSeats = await Seat.find({ eventId: event._id }).sort({ seatNumber: 1 });
      if (totalSeats > currentSeats.length) {
        const newLabels = createSeatLabels(totalSeats).slice(currentSeats.length);
        await Seat.insertMany(
          newLabels.map((seatNumber) => ({
            eventId: event._id,
            seatNumber,
            status: "available",
          }))
        );
      } else if (totalSeats < currentSeats.length) {
        const seatsToRemove = currentSeats.slice(totalSeats);
        const hasOccupied = seatsToRemove.some((seat) => seat.status !== "available");
        if (hasOccupied) {
          return res.status(409).json({
            message: "Cannot reduce seats below count with reserved or booked seats.",
          });
        }
        await Seat.deleteMany({ _id: { $in: seatsToRemove.map((seat) => seat._id) } });
      }
      event.totalSeats = totalSeats;
    }

    await event.save();
    return res.status(200).json({ message: "Event updated.", event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update event.", error: error.message });
  }
});

router.delete("/events/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findById(req.params.id).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Event not found." });
    }

    await Booking.deleteMany({ eventId: event._id }).session(session);
    await Reservation.deleteMany({ eventId: event._id }).session(session);
    await Seat.deleteMany({ eventId: event._id }).session(session);
    await Event.deleteOne({ _id: event._id }).session(session);

    await session.commitTransaction();
    return res.status(200).json({ message: "Event and related data deleted." });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Failed to delete event.", error: error.message });
  } finally {
    await session.endSession();
  }
});

router.get("/bookings", async (_req, res) => {
  try {
    await reconcileSeatsFromBookings();

    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("eventId", "name venue dateTime")
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch bookings.", error: error.message });
  }
});

router.delete("/bookings/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Booking not found." });
    }

    await Seat.updateMany(
      { eventId: booking.eventId, seatNumber: { $in: booking.seatNumbers } },
      { $set: { status: "available", reservationId: null, reservationExpiresAt: null } },
      { session }
    );
    await Booking.deleteOne({ _id: booking._id }).session(session);

    await session.commitTransaction();
    return res.status(200).json({ message: "Booking cancelled and seats released." });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Failed to cancel booking.", error: error.message });
  } finally {
    await session.endSession();
  }
});

router.get("/reservations", async (_req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("userId", "name email")
      .populate("eventId", "name venue dateTime")
      .sort({ createdAt: -1 });

    return res.status(200).json(reservations);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch reservations.", error: error.message });
  }
});

router.delete("/reservations/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findById(req.params.id).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Reservation not found." });
    }

    await Seat.updateMany(
      { _id: { $in: reservation.seatIds } },
      { $set: { status: "available", reservationId: null, reservationExpiresAt: null } },
      { session }
    );
    await Reservation.deleteOne({ _id: reservation._id }).session(session);

    await session.commitTransaction();
    return res.status(200).json({ message: "Reservation cancelled and seats released." });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Failed to cancel reservation.", error: error.message });
  } finally {
    await session.endSession();
  }
});

router.get("/users", async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { role, name } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (role) {
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Role must be user or admin." });
      }

      if (user.role === "admin" && role === "user") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the last admin." });
        }
      }

      user.role = role;
    }
    if (name) user.name = name;

    await user.save();
    return res.status(200).json({
      message: "User updated.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user.", error: error.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete the last admin." });
      }
    }

    await User.deleteOne({ _id: user._id });
    return res.status(200).json({ message: "User deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user.", error: error.message });
  }
});

router.get("/events/:id/seats", async (req, res) => {
  try {
    const seats = await Seat.find({ eventId: req.params.id }).sort({ seatNumber: 1 });
    return res.status(200).json(seats);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch seats.", error: error.message });
  }
});

router.patch("/seats/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["available", "reserved", "booked"].includes(status)) {
      return res.status(400).json({ message: "Invalid seat status." });
    }

    const seat = await Seat.findById(req.params.id);
    if (!seat) {
      return res.status(404).json({ message: "Seat not found." });
    }

    seat.status = status;
    if (status === "available") {
      seat.reservationId = null;
      seat.reservationExpiresAt = null;
    }

    await seat.save();
    return res.status(200).json({ message: "Seat updated.", seat });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update seat.", error: error.message });
  }
});

module.exports = router;
