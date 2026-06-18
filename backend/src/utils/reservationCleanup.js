const Reservation = require("../models/Reservation");
const Seat = require("../models/Seat");

const releaseExpiredReservationsForEvent = async (eventId, session) => {
  const now = new Date();

  const expiredReservations = await Reservation.find({
    eventId,
    expiresAt: { $lte: now },
  })
    .session(session)
    .select("_id");

  const expiredReservationIds = expiredReservations.map((reservation) => reservation._id);
  if (expiredReservationIds.length === 0) {
    return;
  }

  await Seat.updateMany(
    {
      eventId,
      reservationId: { $in: expiredReservationIds },
      status: "reserved",
    },
    {
      $set: {
        status: "available",
        reservationId: null,
        reservationExpiresAt: null,
      },
    },
    { session }
  );

  await Reservation.deleteMany({ _id: { $in: expiredReservationIds } }).session(session);
};

module.exports = { releaseExpiredReservationsForEvent };
