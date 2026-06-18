require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const Event = require("./models/Event");
const Seat = require("./models/Seat");
const Booking = require("./models/Booking");
const Reservation = require("./models/Reservation");
const User = require("./models/User");
const { createSeatLabels } = require("./utils/seatLabels");

const seed = async () => {
  await connectDB();

  await Booking.deleteMany({});
  await Reservation.deleteMany({});
  await Seat.deleteMany({});
  await Event.deleteMany({});

  const events = await Event.insertMany([
    {
      name: "Indie Music Night",
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      venue: "Open Arena, Mumbai",
      totalSeats: 50,
    },
    {
      name: "Tech Leadership Summit",
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      venue: "Convention Hall, Bangalore",
      totalSeats: 60,
    },
  ]);

  const seats = events.flatMap((event) =>
    createSeatLabels(event.totalSeats).map((seatNumber) => ({
      eventId: event._id,
      seatNumber,
      status: "available",
    }))
  );

  await Seat.insertMany(seats);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@ticketbooking.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await User.findOneAndUpdate(
    { email: adminEmail },
    { name: "Admin", email: adminEmail, password: hashedPassword, role: "admin" },
    { upsert: true, new: true }
  );

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
