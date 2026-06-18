import { useEffect, useState } from "react";
import api from "../../api/client";

interface DashboardStats {
  events: number;
  bookings: number;
  reservations: number;
  users: number;
  seats: { available: number; reserved: number; booked: number };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => setError("Failed to load dashboard stats."));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="card stat-card">
          <h3>Events</h3>
          <p>{stats.events}</p>
        </div>
        <div className="card stat-card">
          <h3>Bookings</h3>
          <p>{stats.bookings}</p>
        </div>
        <div className="card stat-card">
          <h3>Reservations</h3>
          <p>{stats.reservations}</p>
        </div>
        <div className="card stat-card">
          <h3>Users</h3>
          <p>{stats.users}</p>
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Seat Overview</h3>
        <p className="muted">Counts individual seats by status across all events.</p>
        <div className="legend">
          <span className="available">Available: {stats.seats.available}</span>
          <span className="reserved">Reserved: {stats.seats.reserved}</span>
          <span className="booked">Booked: {stats.seats.booked}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
