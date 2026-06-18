const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    seatNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["available", "reserved", "booked"],
      default: "available",
      index: true,
    },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", default: null },
    reservationExpiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
