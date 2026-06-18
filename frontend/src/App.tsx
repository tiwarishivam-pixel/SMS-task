import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import AdminRoute from "@/components/AdminRoute";
import GuestRoute from "@/components/GuestRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import SessionWatcher from "@/components/SessionWatcher";
import UserLayout from "@/components/UserLayout";
import AuthPage from "@/pages/AuthPage";
import EventDetailsPage from "@/pages/EventDetailsPage";
import EventsPage from "@/pages/EventsPage";
import LandingPage from "@/pages/LandingPage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import ProfileSearchPage from "@/pages/ProfileSearchPage";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminReservations from "@/pages/admin/AdminReservations";
import AdminUsers from "@/pages/admin/AdminUsers";

const App = () => {
  return (
    <>
      <SessionWatcher />
      <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <AuthPage />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <AuthPage />
          </GuestRoute>
        }
      />
      <Route path="/auth" element={<Navigate to="/login" replace />} />

      <Route
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/profiles" element={<ProfileSearchPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
    </Routes>
    </>
  );
};

export default App;
