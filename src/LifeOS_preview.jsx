import { useState, useReducer, useEffect, useRef } from "react";
import { SettingsScreen, pullFromSupabase, pushToSupabase } from "./BackupSystem";
import { tk, NAV } from "./constants";
import { INIT, reducer } from "./reducer";
import { ThemeCtx, Fonts } from "./ThemeContext";
import { Mono } from "./ui";
import { registerSW, requestPermission, scheduleNotifications } from "./notifications";

// ── Screens ──────────────────────────────────────────────────────────────────
import HomeScreen from "./screens/HomeScreen";
import GoalsScreen from "./screens/GoalsScreen";
import HealthScreen from "./screens/HealthScreen";
import FinanceScreen from "./screens/FinanceScreen";
import CycleScreen from "./screens/CycleScreen";
import InsightsScreen from "./screens/InsightsScreen";
import WorkScreen from "./screens/WorkScreen";
import ProfileSetup from "./screens/ProfileSetup";

const SCREENS = {
  home:    HomeScreen,
  goals:   GoalsScreen,
  health:  HealthScreen,
  finance: FinanceScreen,
  cycle:   CycleScreen,
  insights:InsightsScreen,
  work:    WorkScreen,
};

// ── Root Component ───────────────────────────────────────────────────────────
export default function LifeOS({ signOut, userEmail, userId }) {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [screen, setScreen] = useState("home");
  const [flash, setFlash]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const dark = state.dark;
  const initialLoad = useRef(true);

  // Pull from Supabase on first load
  useEffect(() => {
    if (!userId) return;
    pullFromSupabase(userId)
      .then(data => { if (data) dispatch({ type: "IMPORT_STATE", payload: data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // Auto-push to Supabase on state changes (debounced, skip initial load)
  useEffect(() => {
    if (initialLoad.current) { initialLoad.current = false; return; }
    if (loading || !userId) return;
    const t = setTimeout(() => { pushToSupabase(state, userId).catch(() => {}); }, 1500);
    return () => clearTimeout(t);
  }, [state, loading, userId]);

  // Flash "saved" toast
  useEffect(() => { setFlash(true); const t = setTimeout(() => setFlash(false), 1400); return () => clearTimeout(t); }, [state]);

  // Register service worker + schedule notifications
  useEffect(() => {
    registerSW();
    requestPermission().then((granted) => {
      if (granted) {
        const prefs = state.notifications || INIT.notifications;
        scheduleNotifications(prefs);
      }
    });
  }, []);

  // Re-schedule when notification preferences change
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const prefs = state.notifications || INIT.notifications;
      scheduleNotifications(prefs);
    }
  }, [state.notifications]);

  const profile = state.profile || {};
  const showCycle = profile.gender === "female";
  const workEnabled = (state.work || INIT.work).enabled !== false;
  const needsProfile = !profile.name || !profile.gender;

  // Filter nav items based on profile settings
  const visibleNav = NAV.filter(n => {
    if (n.id === "cycle" && !showCycle) return false;
    if (n.id === "work" && !workEnabled) return false;
    return true;
  });

  // Redirect to home if current screen is hidden
  useEffect(() => {
    if (!loading && !needsProfile && !visibleNav.some(n => n.id === screen) && !showSettings) {
      setScreen("home");
    }
  }, [showCycle, workEnabled, loading]);

  const Screen = SCREENS[screen];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ThemeCtx.Provider value={{ d: dark }}>
        <Fonts />
        <div style={{ position: "fixed", inset: 0, background: dark ? tk.d0 : tk.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ color: tk.sage, fontSize: 36, lineHeight: 1, display: "block", animation: "pulse 1.2s ease infinite" }}>☯</span>
            <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dark ? tk.di3 : tk.ink3, marginTop: 16 }}>Loading your data…</p>
          </div>
        </div>
      </ThemeCtx.Provider>
    );
  }

  // ── Profile setup for new users ────────────────────────────────────────────
  if (needsProfile) {
    return (
      <ThemeCtx.Provider value={{ d: dark }}>
        <Fonts />
        <ProfileSetup dp={dispatch} onDone={() => {}} existingProfile={profile} />
      </ThemeCtx.Provider>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <ThemeCtx.Provider value={{ d: dark }}>
      <Fonts />
      <div style={{ position: "fixed", inset: 0, background: dark ? tk.d0 : tk.cream, display: "flex", justifyContent: "center", overflow: "hidden" }}>

        {/* Saved toast */}
        <div style={{
          position: "fixed", top: 16, left: "50%", zIndex: 200,
          background: "#2c2416", color: "#faf7f2", fontFamily: "'DM Mono',monospace",
          fontSize: 11, letterSpacing: "0.09em", padding: "7px 20px", borderRadius: 40,
          boxShadow: "0 4px 24px rgba(0,0,0,0.28)", pointerEvents: "none",
          transition: "all 0.3s ease", opacity: flash ? 1 : 0,
          transform: `translateX(-50%) translateY(${flash ? 0 : -10}px)`,
        }}>☯ saved</div>

        {/* Phone shell */}
        <div style={{ width: "100%", maxWidth: 430, height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>

          {/* Top bar */}
          <div style={{
            padding: "28px 22px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: dark ? tk.d0 : tk.cream, backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 30,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: tk.sage, fontSize: 19, lineHeight: 1 }}>☯</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? tk.di : tk.ink2 }}>LifeOS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => dispatch({ type: "DARK" })} style={{
                width: 34, height: 34, borderRadius: "50%",
                border: `1px solid ${dark ? "rgba(255,255,255,0.09)" : "rgba(44,36,22,0.12)"}`,
                background: dark ? tk.d3 : tk.cream2, cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
              }}>{dark ? "☀" : "☾"}</button>
              <button onClick={() => setShowSettings(true)} style={{
                width: 34, height: 34, borderRadius: "50%",
                border: `1px solid ${dark ? "rgba(255,255,255,0.09)" : "rgba(44,36,22,0.12)"}`,
                background: dark ? tk.d3 : tk.cream2, cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
              }}>⚙</button>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 22px 110px", scrollBehavior: "smooth" }}>
            {showSettings ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8 }}>
                  <button onClick={() => setShowSettings(false)} style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: `1px solid ${dark ? "rgba(255,255,255,0.09)" : "rgba(44,36,22,0.12)"}`,
                    background: dark ? tk.d3 : tk.cream2, cursor: "pointer", fontSize: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'DM Mono',monospace", color: dark ? tk.di : tk.ink2,
                  }}>←</button>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: dark ? tk.di : tk.ink }}>Settings</span>
                </div>

                {/* Account */}
                <div style={{
                  background: dark ? tk.d2 : "#fff", borderRadius: 20, padding: 20,
                  border: `1px solid ${dark ? "rgba(255,255,255,0.045)" : "rgba(44,36,22,0.055)"}`,
                  boxShadow: dark ? "0 2px 16px rgba(0,0,0,0.35)" : "0 2px 20px rgba(44,36,22,0.07)",
                }}>
                  <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: dark ? tk.di3 : tk.ink3, marginBottom: 14 }}>Account</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: dark ? tk.di2 : tk.ink2 }}>{userEmail || "—"}</p>
                  </div>
                  <button onClick={signOut} style={{
                    width: "100%", fontFamily: "'DM Mono',monospace", fontSize: 12, letterSpacing: "0.04em",
                    padding: "12px 20px", borderRadius: 14,
                    border: `1px solid ${dark ? "rgba(196,122,122,0.3)" : "rgba(196,122,122,0.25)"}`,
                    cursor: "pointer", background: "transparent", color: tk.rose, transition: "all 0.15s", textAlign: "center",
                  }}>Sign out</button>
                </div>

                <SettingsScreen state={state} dispatch={dispatch} dark={dark} />
              </div>
            ) : (
              <Screen s={state} dp={dispatch} go={setScreen} />
            )}
          </div>

          {/* Bottom nav */}
          <div style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 430, zIndex: 40,
            background: dark ? "rgba(23,20,15,0.97)" : "rgba(250,247,242,0.97)",
            backdropFilter: "blur(20px)",
            borderTop: `1px solid ${dark ? "rgba(255,255,255,0.055)" : "rgba(44,36,22,0.08)"}`,
            padding: "10px 4px 20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {visibleNav.map(n => {
                const on = screen === n.id;
                return (
                  <button key={n.id} onClick={() => setScreen(n.id)} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    padding: "5px 6px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: on ? (dark ? "rgba(122,158,126,0.13)" : "rgba(122,158,126,0.1)") : "transparent",
                    opacity: on ? 1 : 0.28, transition: "all 0.2s ease", minWidth: 38,
                  }}>
                    <span style={{ fontSize: 16, lineHeight: 1, color: on ? tk.sage : (dark ? tk.di : tk.ink) }}>{n.icon}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: "0.04em", color: on ? tk.sage : (dark ? tk.di3 : tk.ink3) }}>{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
