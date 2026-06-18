import { FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import api from "../../api/client";
import type { EventSummary } from "../../types";

const emptyForm = { name: "", dateTime: "", venue: "", totalSeats: 50 };

const AdminEvents = () => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadEvents = async () => {
    const response = await api.get("/admin/events");
    setEvents(response.data);
  };

  useEffect(() => {
    loadEvents().catch(() => setError("Failed to load events."));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        totalSeats: Number(form.totalSeats),
        dateTime: new Date(form.dateTime).toISOString(),
      };
      if (editingId) {
        await api.put(`/admin/events/${editingId}`, payload);
        setMessage("Event updated.");
      } else {
        await api.post("/admin/events", payload);
        setMessage("Event created.");
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadEvents();
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Operation failed.");
    }
  };

  const startEdit = (eventItem: EventSummary) => {
    setEditingId(eventItem._id);
    setForm({
      name: eventItem.name,
      dateTime: new Date(eventItem.dateTime).toISOString().slice(0, 16),
      venue: eventItem.venue,
      totalSeats: eventItem.totalSeats,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this event and all related data?")) return;
    setError("");
    try {
      await api.delete(`/admin/events/${id}`);
      setMessage("Event deleted.");
      await loadEvents();
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div>
      <h1>Manage Events</h1>

      <form className="card admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit Event" : "Create Event"}</h3>
        <input
          placeholder="Event name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="datetime-local"
          value={form.dateTime}
          onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
          required
        />
        <input
          placeholder="Venue"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
          required
        />
        <input
          type="number"
          min={1}
          max={500}
          value={form.totalSeats}
          onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })}
          required
        />
        <div className="actions">
          <button className="primary" type="submit">
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Venue</th>
              <th>Seats</th>
              <th>Stats</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((eventItem) => (
              <tr key={eventItem._id}>
                <td>{eventItem.name}</td>
                <td>{new Date(eventItem.dateTime).toLocaleString()}</td>
                <td>{eventItem.venue}</td>
                <td>{eventItem.totalSeats}</td>
                <td>
                  A:{eventItem.seatStats.available} R:{eventItem.seatStats.reserved} B:
                  {eventItem.seatStats.booked}
                </td>
                <td className="table-actions">
                  <button type="button" onClick={() => startEdit(eventItem)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(eventItem._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEvents;
