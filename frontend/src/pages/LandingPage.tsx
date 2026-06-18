import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
            TicketBook
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            {token ? (
              <Button asChild size="sm" className="rounded-full text-black">
                <Link to="/events">
                  Go to Events
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full text-black">
                <Link to="/signup">Sign Up</Link>
              </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <BackgroundPaths
        title="Book Your Seat"
        subtitle="Discover live events, see who sits where, and reserve your spot with a smooth secure flow."
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {token ? (
            <Button asChild size="lg" className="rounded-2xl px-8 py-6 text-lg text-black transition-all duration-300 hover:-translate-y-0.5">
              <Link to="/events">
                Browse Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="rounded-2xl px-8 py-6 text-lg text-black transition-all duration-300 hover:-translate-y-0.5">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl px-8 py-6 text-lg transition-all duration-300 hover:-translate-y-0.5">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </BackgroundPaths>

      <section className="max-w-6xl mx-auto px-4 pb-16 pt-8 grid md:grid-cols-3 gap-6 relative z-20">
        {[
          { title: "Live Seat Map", desc: "See which seats are taken and by whom before you reserve." },
          { title: "Smart Profiles", desc: "Search people by name, email, or bio to plan together." },
          { title: "Secure Booking", desc: "10-minute holds, atomic reservations, and protected sessions." },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-border bg-card/80 backdrop-blur p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default LandingPage;
