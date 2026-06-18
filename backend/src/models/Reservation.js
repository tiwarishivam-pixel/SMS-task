const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    seatNumbers: [{ type: String, required: true }],
    seatIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seat", required: true }],
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
