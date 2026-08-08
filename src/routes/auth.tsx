import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to NEXUS — Campus Multi-Agent Console" },
      {
        name: "description",
        content:
          "Sign in or create your NEXUS account to open your personal multi-agent campus workspace.",
      },
      { property: "og:title", content: "Sign in to NEXUS" },
      {
        property: "og:description",
        content: "Secure access to your personal NEXUS campus agent workspace.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/workspace" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      navigate({ to: "/workspace" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/workspace" });
  };

  return (
    <main className="grid-bg grid min-h-dvh place-items-center overflow-y-auto px-6 py-8">
      <div className="panel w-full max-w-sm p-5">

        <Link to="/" className="inline-flex items-center gap-2 text-primary">
          <Network className="size-4" />
          <span className="text-sm font-semibold tracking-tight">NEXUS</span>
        </Link>

        {sent ? (
          <div className="mt-6">
            <h1 className="text-lg font-semibold">Check your email</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              We sent a confirmation link to {email}. Confirm it, then sign in.
            </p>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => {
                setSent(false);
                setMode("signin");
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            <h1 className="mt-5 text-xl font-semibold tracking-tight">
              {mode === "signin" ? "Sign in to your workspace" : "Create your NEXUS account"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Your campus profile and agent history are private to your account.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <Input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu"
                className="bg-surface-2"
              />
              <Input
                type="password"
                value={password}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-surface-2"
              />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full border-border" onClick={google} disabled={busy}>
              Continue with Google
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "signin"
                ? "No account yet? Create one"
                : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
