import { useState, useReducer, useEffect, useRef } from "react";
import { SettingsScreen, pullFromSupabase, pushToSupabase, subscribeRealtime } from "./BackupSystem";
import { tk, NAV } from "./constants";
import { INIT, reducer } from "./reducer";
import { ThemeCtx, Fonts } from "./ThemeContext";
import { Mono } from "./ui";
import { registerSW, requestPermission, scheduleNotifications, initVisibilityHandler } from "./notifications";

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
  const syncReady = useRef(false);
  const remoteImport = useRef(false);
  const lastPushTs = useRef(0);
  const latestState = useRef(state);
  latestState.current = state;

  const LS_KEY = "lifeos_state";
  const log = (...a) => console.log("[LifeOS sync]", ...a);

  // ── 1. Save every state change to localStorage immediately (zero-delay safety net)
  useEffect(() => {
    if (initialLoad.current) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  // ── 2. Load on mount: localStorage first (instant), then Supabase (merge newer)
  useEffect(() => {
    log("mount — loading localStorage + Supabase…");
    let localState = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) localState = JSON.parse(raw);
    } catch {}
    if (localState) {
      dispatch({ type: "IMPORT_STATE", payload: localState });
      lastPushTs.current = localState._updated_at || 0;
      log("localStorage loaded, _updated_at =", localState._updated_at || "none");
    }

    if (!userId) {
      initialLoad.current = false;
      syncReady.current = true;
      setLoading(false);
      return;
    }

    pullFromSupabase(userId)
      .then(cloudData => {
        if (!cloudData) { log("no cloud data found — will push local to cloud"); return; }
        const cloudTime = cloudData._updated_at || 0;
        const localTime = localState?._updated_at || 0;
        log("cloud _updated_at =", cloudTime, "| local _updated_at =", localTime);
        if (!localState || cloudTime >= localTime) {
          lastPushTs.current = cloudTime;
          dispatch({ type: "IMPORT_STATE", payload: cloudData });
          log("imported cloud data (newer)");
        } else {
          lastPushTs.current = localTime;
          pushToSupabase({ ...localState, _updated_at: localTime }, userId).catch(() => {});
          log("pushed local data to cloud (newer)");
        }
      })
      .catch((e) => log("pull FAILED:", e))
      .finally(() => {
        initialLoad.current = false;
        syncReady.current = true;
        setLoading(false);
        log("sync ready ✓");
      });
  }, [userId]);

  // ── 3. Debounced Supabase push (only for LOCAL user actions, never during init)
  useEffect(() => {
    if (!syncReady.current || !userId) return;
    if (remoteImport.current) { remoteImport.current = false; log("skip push (remote import)"); return; }
    const t = setTimeout(() => {
      const ts = Date.now();
      const withTs = { ...latestState.current, _updated_at: ts };
      lastPushTs.current = ts;
      try { localStorage.setItem(LS_KEY, JSON.stringify(withTs)); } catch {}
      pushToSupabase(withTs, userId)
        .then(() => log("pushed to cloud, ts =", ts))
        .catch((err) => log("push FAILED:", err));
    }, 600);
    return () => clearTimeout(t);
  }, [state, userId]);

  // ── 4. Flush to Supabase when tab hidden / pull fresh data when tab visible
  useEffect(() => {
    if (!userId) return;
    function flushNow() {
      if (!syncReady.current) return;
      const ts = Date.now();
      const s = { ...latestState.current, _updated_at: ts };
      lastPushTs.current = ts;
      try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
      pushToSupabase(s, userId).catch(() => {});
      log("flushed on tab hide, ts =", ts);
    }
    function pullIfNewer() {
      pullFromSupabase(userId)
        .then(cloudData => {
          if (!cloudData) return;
          const cloudTime = cloudData._updated_at || 0;
          if (cloudTime > lastPushTs.current) {
            remoteImport.current = true;
            lastPushTs.current = cloudTime;
            dispatch({ type: "IMPORT_STATE", payload: cloudData });
            try { localStorage.setItem(LS_KEY, JSON.stringify(cloudData)); } catch {}
            log("tab-focus pull: imported cloud data, ts =", cloudTime);
          }
        })
        .catch(() => {});
    }
    function handleVisibility() {
      if (document.visibilityState === "hidden") flushNow();
      else if (document.visibilityState === "visible") pullIfNewer();
    }
    function handleBeforeUnload() {
      const ts = Date.now();
      const s = { ...latestState.current, _updated_at: ts };
      lastPushTs.current = ts;
      try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId]);

  // ── 5. Supabase Realtime — instant sync when another device writes
  useEffect(() => {
    if (!userId) return;
    log("subscribing to Realtime…");
    const unsub = subscribeRealtime(userId, (cloudData) => {
      if (!cloudData) return;
      const cloudTime = cloudData._updated_at || 0;
      if (cloudTime > lastPushTs.current) {
        remoteImport.current = true;
        lastPushTs.current = cloudTime;
        dispatch({ type: "IMPORT_STATE", payload: cloudData });
        try { localStorage.setItem(LS_KEY, JSON.stringify(cloudData)); } catch {}
        log("realtime: imported from another device, ts =", cloudTime);
      }
    });
    return unsub;
  }, [userId]);

  // ── 6. Polling fallback — auto-pull every 15s while tab is visible
  useEffect(() => {
    if (!userId) return;
    log("polling started (every 15s)");
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      pullFromSupabase(userId)
        .then(cloudData => {
          if (!cloudData) return;
          const cloudTime = cloudData._updated_at || 0;
          if (cloudTime > lastPushTs.current) {
            remoteImport.current = true;
            lastPushTs.current = cloudTime;
            dispatch({ type: "IMPORT_STATE", payload: cloudData });
            try { localStorage.setItem(LS_KEY, JSON.stringify(cloudData)); } catch {}
            log("poll: imported newer cloud data, ts =", cloudTime);
          }
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  // Flash "saved" toast
  useEffect(() => { setFlash(true); const t = setTimeout(() => setFlash(false), 1400); return () => clearTimeout(t); }, [state]);

  // Register service worker + schedule notifications
  useEffect(() => {
    registerSW();
    initVisibilityHandler();
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
                  <button key={n.id} onClick={() => { setScreen(n.id); setShowSettings(false); }} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    padding: "5px 6px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: on ? (dark ? "rgba(122,158,126,0.13)" : "rgba(122,158,126,0.1)") : "transparent",
                    opacity: on ? 1 : 0.55, transition: "all 0.2s ease", minWidth: 38,
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
