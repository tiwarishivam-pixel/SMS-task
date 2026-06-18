import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const SessionWatcher = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onSessionExpired = () => {
      logout();
      const isPublic = ["/", "/login", "/signup"].includes(location.pathname);
      if (!isPublic) {
        navigate("/login", { replace: true, state: { from: location.pathname } });
      }
    };

    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => window.removeEventListener("auth:session-expired", onSessionExpired);
  }, [logout, navigate, location.pathname]);

  return null;
};

export default SessionWatcher;
