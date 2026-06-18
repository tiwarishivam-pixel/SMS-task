import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AuthPage = () => {
  const location = useLocation();
  const isSignupRoute = location.pathname === "/signup";
  const [isLogin, setIsLogin] = useState(!isSignupRoute);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const redirectTo = (location.state as { from?: string })?.from || "/events";

  useEffect(() => {
    setIsLogin(!isSignupRoute);
  }, [isSignupRoute]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const response = await api.post("/auth/login", { email, password });
        login(response.data.token, response.data.user);
        const target = response.data.user.role === "admin" ? "/admin" : redirectTo;
        navigate(target, { replace: true });
      } else {
        await api.post("/auth/register", { name, email, password });
        navigate("/login", { replace: true, state: { registered: true } });
      }
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      setError(typedError.response?.data?.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black">
      <Link to="/" className="mb-6 text-sm text-primary hover:underline transition-colors">
        ← Back to home
      </Link>
      <Card className="w-full max-w-md shadow-2xl border-border/60 bg-card/90 backdrop-blur animate-in fade-in zoom-in-95 duration-300">
        <CardHeader>
          <CardTitle>{isLogin ? "Welcome back" : "Create account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to browse and book events." : "Register to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Name"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              minLength={6}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full text-black" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
            </Button>
            <div className="flex justify-center gap-4 text-sm">
              {isLogin ? (
                <Link to="/signup" className="text-primary hover:underline">
                  New here? Sign up
                </Link>
              ) : (
                <Link to="/login" className="text-primary hover:underline">
                  Already registered? Login
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
