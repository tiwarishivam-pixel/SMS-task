const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    seatNumbers: [{ type: String, required: true }],
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
