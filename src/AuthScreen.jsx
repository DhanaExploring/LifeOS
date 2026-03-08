import { useState, useEffect } from "react";
import { supabase } from "./BackupSystem";

/* ══════════════════════════════════════════════════════════
   LIFEOS — AUTH SCREEN
   Warm organic minimalism · Playfair + DM Mono
══════════════════════════════════════════════════════════ */

const tk = {
  cream:"#faf7f2", cream2:"#f4efe6", cream3:"#e8e0d4",
  ink:"#2c2416", ink2:"#5c5040", ink3:"#9c8c78",
  d0:"#17140f", d1:"#1f1c16", d2:"#27231c", d3:"#312d24",
  di:"#f0e8d8", di2:"#c8bfaa", di3:"#7a7060",
  sage:"#7a9e7e", sageL:"#d4e8d6", sageD:"#4a6e4e",
  rose:"#c47a7a",
};

const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .auth-su { animation: slideUp 0.32s cubic-bezier(0.16,1,0.3,1) both; }
  `}</style>
);

// ── Hook: manage Supabase auth session ──
export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = no user

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, signOut };
}

// ── Login / Sign-up screen ──
export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage("Password reset link sent to your email.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for a confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange will handle the rest
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
    setLoading(false);
  }

  const d = false; // login is always light mode
  const bg = tk.cream;
  const cardBg = "#fff";
  const borderClr = "rgba(44,36,22,0.055)";

  const inputStyle = {
    width: "100%",
    fontFamily: "'DM Mono',monospace",
    fontSize: 13,
    padding: "14px 16px",
    borderRadius: 14,
    border: `1px solid rgba(44,36,22,0.1)`,
    background: tk.cream,
    color: tk.ink,
    outline: "none",
    transition: "border-color 0.2s",
  };

  const btnStyle = {
    width: "100%",
    fontFamily: "'DM Mono',monospace",
    fontSize: 13,
    letterSpacing: "0.06em",
    padding: "14px 20px",
    borderRadius: 14,
    border: "none",
    cursor: loading ? "wait" : "pointer",
    background: tk.sage,
    color: "#fff",
    boxShadow: `0 3px 12px ${tk.sage}55`,
    transition: "all 0.15s",
    opacity: loading ? 0.7 : 1,
  };

  return (
    <>
      <Fonts />
      <div style={{
        position: "fixed", inset: 0, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
        <div className="auth-su" style={{
          width: "100%", maxWidth: 380,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ color: tk.sage, fontSize: 36, lineHeight: 1, display: "block" }}>✦</span>
            <p style={{
              fontFamily: "'Playfair Display',serif", fontSize: 32,
              color: tk.ink, marginTop: 12, lineHeight: 1.2,
            }}>LifeOS</p>
            <p style={{
              fontFamily: "'DM Mono',monospace", fontSize: 11,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: tk.ink3, marginTop: 8,
            }}>
              {mode === "forgot" ? "Reset your password" : mode === "signup" ? "Create your account" : "Welcome back"}
            </p>
          </div>

          {/* Card */}
          <div style={{
            width: "100%", background: cardBg, borderRadius: 20, padding: 28,
            border: `1px solid ${borderClr}`,
            boxShadow: "0 2px 20px rgba(44,36,22,0.07)",
          }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Email */}
              <div>
                <label style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 10,
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  color: tk.ink3, marginBottom: 8, display: "block",
                }}>Email</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              {/* Password (hide on forgot) */}
              {mode !== "forgot" && (
                <div>
                  <label style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 10,
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    color: tk.ink3, marginBottom: 8, display: "block",
                  }}>Password</label>
                  <input
                    type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <p style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 11,
                  color: tk.rose, background: "#fdf0f0",
                  padding: "10px 14px", borderRadius: 12, lineHeight: 1.5,
                }}>
                  {error}
                </p>
              )}

              {/* Success message */}
              {message && (
                <p style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 11,
                  color: tk.sage, background: tk.sageL,
                  padding: "10px 14px", borderRadius: 12, lineHeight: 1.5,
                }}>
                  {message}
                </p>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? "⏳" : mode === "forgot" ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            {/* Footer links */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 10,
              alignItems: "center", marginTop: 18,
            }}>
              {mode === "login" && (
                <>
                  <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 11, color: tk.ink3, textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Forgot password?
                  </button>
                  <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: tk.ink3 }}>
                    No account?{" "}
                    <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 11, color: tk.sage, fontWeight: 500 }}>
                      Sign up
                    </button>
                  </p>
                </>
              )}
              {mode === "signup" && (
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: tk.ink3 }}>
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 11, color: tk.sage, fontWeight: 500 }}>
                    Sign in
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <button onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 11, color: tk.sage, fontWeight: 500 }}>
                  ← Back to sign in
                </button>
              )}
            </div>
          </div>

          {/* Bottom note */}
          <p style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            color: tk.ink3, marginTop: 24, textAlign: "center",
            letterSpacing: "0.04em", lineHeight: 1.6,
          }}>
            Your data is encrypted and synced via Supabase.
          </p>
        </div>
      </div>
    </>
  );
}
