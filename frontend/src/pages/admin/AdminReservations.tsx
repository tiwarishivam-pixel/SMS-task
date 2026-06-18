import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import api from "../../api/client";

interface ReservationRow {
  _id: string;
  seatNumbers: string[];
  expiresAt: string;
  createdAt: string;
  userId: { name: string; email: string };
  eventId: { name: string; venue: string };
}

const AdminReservations = () => {
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReservations = async () => {
    const response = await api.get("/admin/reservations");
    setReservations(response.data);
  };

  useEffect(() => {
    loadReservations().catch(() => setError("Failed to load reservations."));
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this reservation and release seats?")) return;
    setError("");
    try {
      await api.delete(`/admin/reservations/${id}`);
      setMessage("Reservation cancelled.");
      await loadReservations();
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Cancel failed.");
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) <= new Date();

  return (
    <div>
      <h1>Reservations</h1>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Event</th>
              <th>Seats</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation._id}>
                <td>
                  {reservation.userId?.name}
                  <br />
                  <small>{reservation.userId?.email}</small>
                </td>
                <td>{reservation.eventId?.name}</td>
                <td>{reservation.seatNumbers.join(", ")}</td>
                <td>{new Date(reservation.expiresAt).toLocaleString()}</td>
                <td>{isExpired(reservation.expiresAt) ? "Expired" : "Active"}</td>
                <td>
                  <button type="button" onClick={() => handleCancel(reservation._id)}>
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservations.length === 0 && <p>No reservations yet.</p>}
      </div>
    </div>
  );
};

export default AdminReservations;
