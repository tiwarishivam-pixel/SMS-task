import { type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const GuestRoute = ({ children }: { children: ReactElement }) => {
  const { token, user } = useAuth();

  if (token) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/events"} replace />;
  }

  return children;
};

export default GuestRoute;
