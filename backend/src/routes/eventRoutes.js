const express = require("express");
const Event = require("../models/Event");
const Seat = require("../models/Seat");
const authMiddleware = require("../middleware/authMiddleware");
const { enrichSeatsWithOccupants } = require("../utils/seatOccupants");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (_req, res) => {
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

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const seats = await Seat.find({ eventId: event._id }).sort({ seatNumber: 1 });
    const seatsWithOccupants = await enrichSeatsWithOccupants(event._id, seats);

    return res.status(200).json({
      _id: event._id,
      name: event.name,
      dateTime: event.dateTime,
      venue: event.venue,
      totalSeats: event.totalSeats,
      seats: seatsWithOccupants,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch event details.", error: error.message });
  }
});

module.exports = router;
