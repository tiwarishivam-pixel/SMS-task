import { useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import api from "@/api/client";
import { UserProfileMenu } from "@/components/UserProfilePopover";
import type { UserProfile } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ProfileSearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setError("");
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/users/search", { params: { q: query.trim() } });
        setResults(response.data);
      } catch {
        setError("Search failed. Try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Find People</h1>
        <p className="text-muted-foreground mt-1">
          Smart search across name, email, and bio. Booking history stays private.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try a name, email, or keyword from someone's bio..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Searching...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {query.trim().length > 0 && !loading && results.length === 0 && !error && (
            <p className="text-muted-foreground col-span-full">No users found.</p>
          )}
          {results.map((profile, index) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfile(profile)}
              className={cn(
                "text-left rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                selectedProfile?.id === profile.id && "ring-2 ring-primary border-primary"
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-zinc-700 text-white flex items-center justify-center font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {profile.bio?.trim() || "No bio yet."}
              </p>
              <span className="inline-block mt-2 text-xs uppercase font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                {profile.role}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {selectedProfile ? (
            <UserProfileMenu profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select a profile to view details and bio.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSearchPage;
