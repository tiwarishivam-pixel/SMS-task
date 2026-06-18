import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import api from "../../api/client";

interface BookingRow {
  _id: string;
  seatNumbers: string[];
  createdAt: string;
  userId: { name: string; email: string };
  eventId: { name: string; venue: string };
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBookings = async () => {
    const response = await api.get("/admin/bookings");
    setBookings(response.data);
  };

  useEffect(() => {
    loadBookings().catch(() => setError("Failed to load bookings."));
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this booking and release seats?")) return;
    setError("");
    try {
      await api.delete(`/admin/bookings/${id}`);
      setMessage("Booking cancelled.");
      await loadBookings();
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Cancel failed.");
    }
  };

  return (
    <div>
      <h1>Bookings</h1>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Event</th>
              <th>Seats</th>
              <th>Booked At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td>
                  {booking.userId?.name}
                  <br />
                  <small>{booking.userId?.email}</small>
                </td>
                <td>{booking.eventId?.name}</td>
                <td>{booking.seatNumbers.join(", ")}</td>
                <td>{new Date(booking.createdAt).toLocaleString()}</td>
                <td>
                  <button type="button" onClick={() => handleCancel(booking._id)}>
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <p>No bookings yet.</p>}
      </div>
    </div>
  );
};

export default AdminBookings;
