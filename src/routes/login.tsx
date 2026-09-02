import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});

function LoginScreen() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate({ to: "/" });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError("Check your email for the confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: any) {
      // Detect network/fetch failures (misconfigured Supabase key or CORS)
      const msg: string = err?.message || String(err) || "An error occurred";
      if (
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror") ||
        msg.toLowerCase().includes("fetch")
      ) {
        setError(
          "Cannot reach Supabase — this usually means the VITE_SUPABASE_ANON_KEY in your .env is wrong. " +
          "Open your Supabase dashboard → Project Settings → API and copy the 'anon public' key (it starts with eyJ…)."
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm glass-panel p-6 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-3">
          {/* Both mascots side-by-side */}
          <div className="flex items-center justify-center gap-3">
            <MosBear size={56} />
            <MosRobot size={56} />
          </div>
          <h1 className="text-2xl font-bold text-display text-[var(--foreground)]">
            MOS
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {isSignUp ? "Create a new account" : "Log in to your OS"}
          </p>
        </div>

        {error && (
          <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted-foreground)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted-foreground)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSignUp ? "Sign Up" : "Log In")}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {isSignUp ? "Already have an account? Log in" : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pastel bear mascot (inline SVG matching Mascot.tsx) */
function MosBear({ size = 72 }: { size?: number }) {
  const OUT = "var(--mascot-outline)";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <g fill="var(--mascot-body)" stroke={OUT} strokeWidth="3" strokeLinejoin="round">
        <circle cx="27" cy="26" r="12" />
        <circle cx="73" cy="26" r="12" />
        <rect x="14" y="24" width="72" height="64" rx="30" />
      </g>
      <g fill={OUT}>
        <circle cx="37" cy="53" r="5" />
        <circle cx="63" cy="53" r="5" />
      </g>
      <circle cx="26" cy="66" r="6" fill="var(--tint-1)" opacity={0.75} />
      <circle cx="74" cy="66" r="6" fill="var(--tint-1)" opacity={0.75} />
      <g fill="none" stroke={OUT} strokeWidth="3" strokeLinecap="round">
        <path d="M44 68q6 6 12 0" />
      </g>
    </svg>
  );
}

/** Sci-fi robot mascot (inline SVG matching Mascot.tsx) */
function MosRobot({ size = 72 }: { size?: number }) {
  const OUT = "var(--mascot-outline)";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <g stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" fill="none">
        <path d="M50 8v16" strokeLinecap="round" />
        <circle cx="50" cy="8" r="4" fill={OUT} />
        <path d="M50 24 84 43v34L50 96 16 77V43z" fill="var(--mascot-body)" />
      </g>
      <g stroke={OUT} strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M31 58q7-9 14 0" />
        <path d="M55 58q7-9 14 0" />
      </g>
      <g stroke={OUT} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M40 74q10 8 20 0" />
      </g>
    </svg>
  );
}
