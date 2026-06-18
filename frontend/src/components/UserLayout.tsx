import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Calendar, LogOut, Ticket, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserProfilePopover } from "@/components/UserProfilePopover";
import { cn } from "@/lib/utils";

const crumbs = [
  { label: "Events", path: "/events" },
  { label: "Bookings", path: "/bookings" },
  { label: "Profiles", path: "/profiles" },
];

const UserLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-[72px] border-r bg-card/80 backdrop-blur-sm flex flex-col items-center py-5 gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary text-black font-bold flex items-center justify-center text-sm">
          TB
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <NavLink
            to="/events"
            title="Events"
            className={({ isActive }) =>
              cn(
                "h-11 w-11 rounded-xl flex items-center justify-center border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                isActive ? "bg-primary text-black border-primary" : "bg-card border-border text-foreground"
              )
            }
          >
            <Calendar className="h-5 w-5" />
          </NavLink>
          <NavLink
            to="/bookings"
            title="My Bookings"
            className={({ isActive }) =>
              cn(
                "h-11 w-11 rounded-xl flex items-center justify-center border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                isActive ? "bg-primary text-black border-primary" : "bg-card border-border text-foreground"
              )
            }
          >
            <Ticket className="h-5 w-5" />
          </NavLink>
          <NavLink
            to="/profiles"
            title="Find People"
            className={({ isActive }) =>
              cn(
                "h-11 w-11 rounded-xl flex items-center justify-center border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                isActive ? "bg-primary text-black border-primary" : "bg-card border-border text-foreground"
              )
            }
          >
            <Users className="h-5 w-5" />
          </NavLink>
        </nav>
        <button
          type="button"
          title="Logout"
          onClick={handleLogout}
          className="mt-auto h-11 w-11 rounded-xl flex items-center justify-center border border-border bg-card text-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-card/70 backdrop-blur-md px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <nav className="flex flex-wrap gap-2">
            {crumbs.map((crumb) => (
              <NavLink
                key={crumb.path}
                to={crumb.path}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all duration-200",
                  location.pathname.startsWith(crumb.path)
                    ? "bg-primary text-black font-medium shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                {crumb.label}
              </NavLink>
            ))}
          </nav>
          <UserProfilePopover />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
