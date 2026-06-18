import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { user: currentUser } = useAuth();

  const loadUsers = async () => {
    const response = await api.get("/admin/users");
    setUsers(response.data);
  };

  useEffect(() => {
    loadUsers().catch(() => setError("Failed to load users."));
  }, []);

  const adminCount = users.filter((user) => user.role === "admin").length;

  const canDemoteAdmin = (user: UserRow) => user.role === "admin" && adminCount > 1;
  const canDeleteUser = (user: UserRow) => {
    if (user._id === currentUser?.id) return false;
    if (user.role === "admin" && adminCount <= 1) return false;
    return true;
  };

  const toggleRole = async (user: UserRow) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setError("");
    try {
      await api.patch(`/admin/users/${user._id}`, { role: nextRole });
      setMessage(`User role updated to ${nextRole}.`);
      await loadUsers();
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Update failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    setError("");
    try {
      await api.delete(`/admin/users/${id}`);
      setMessage("User deleted.");
      await loadUsers();
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div>
      <h1>Users</h1>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="table-actions">
                  {user.role === "user" && (
                    <button type="button" onClick={() => toggleRole(user)}>
                      Make Admin
                    </button>
                  )}
                  {canDemoteAdmin(user) && (
                    <button type="button" onClick={() => toggleRole(user)}>
                      Make User
                    </button>
                  )}
                  {canDeleteUser(user) && (
                    <button type="button" onClick={() => handleDelete(user._id)}>
                      Delete
                    </button>
                  )}
                  {user.role === "admin" && adminCount <= 1 && (
                    <span className="muted">Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
