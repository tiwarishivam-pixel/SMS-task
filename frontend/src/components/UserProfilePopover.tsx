import { useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { Pencil, X } from "lucide-react";
import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/types";

interface UserProfileMenuProps {
  profile?: UserProfile | null;
  onClose?: () => void;
}

const UserProfileMenu = ({ profile, onClose }: UserProfileMenuProps) => {
  const { user, updateUser, refreshProfile } = useAuth();
  const isOwnProfile = !profile || profile.id === user?.id;
  const display = isOwnProfile ? user : profile;

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(display?.bio || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOwnProfile) {
      refreshProfile().catch(() => undefined);
    }
  }, [isOwnProfile, refreshProfile]);

  useEffect(() => {
    setBio(display?.bio || "");
  }, [display?.bio]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await api.patch("/users/me", { bio });
      updateUser(response.data.user);
      setEditing(false);
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Failed to save bio.");
    } finally {
      setSaving(false);
    }
  };

  if (!display) return null;

  return (
    <Card className="w-80 shadow-xl border-border/60 animate-in fade-in zoom-in-95 duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-lg">
              {display.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{display.name}</CardTitle>
              <CardDescription>{display.email}</CardDescription>
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide font-semibold px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
            {display.role}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Bio</p>
            {isOwnProfile && !editing && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {isOwnProfile && editing ? (
            <div className="space-y-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tell others a bit about yourself..."
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setBio(display.bio || ""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {display.bio?.trim() ? display.bio : isOwnProfile ? "Add a bio so others can find and know you." : "No bio yet."}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
};

export const UserProfilePopover = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-accent transition-colors duration-200"
      >
        <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold leading-none">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize mt-1">{user.role}</p>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <UserProfileMenu onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
};

export { UserProfileMenu };
export default UserProfilePopover;
