// ============================================================
// LifeOS — Complete Backup System
// Drop this file into your project as: src/BackupSystem.jsx
// Then import it in your App.jsx SettingsScreen
// ============================================================
//
// WHAT'S INCLUDED:
//   1. Auto-export reminder    — pops up every N days
//   2. Google Drive backup     — saves JSON silently to Drive
//   3. Supabase sync           — real-time cross-device sync
//
// SETUP INSTRUCTIONS are inline as comments above each section.
// ============================================================

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "lifeos_data_v1";
const BACKUP_META_KEY = "lifeos_backup_meta";
const today = new Date().toISOString().split("T")[0];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMeta() {
  try { return JSON.parse(localStorage.getItem(BACKUP_META_KEY) || "{}"); } catch { return {}; }
}
function setMeta(meta) {
  localStorage.setItem(BACKUP_META_KEY, JSON.stringify(meta));
}
function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ============================================================
// ① AUTO-EXPORT REMINDER
// No setup needed. Works out of the box.
// Shows a reminder banner if backup is overdue.
// ============================================================

export function useBackupReminder(intervalDays = 3) {
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const meta = getMeta();
    if (daysSince(meta.lastLocalBackup) >= intervalDays) {
      // Small delay so it doesn't flash on first load
      const t = setTimeout(() => setShowReminder(true), 2000);
      return () => clearTimeout(t);
    }
  }, [intervalDays]);

  function dismiss() { setShowReminder(false); }
  function markDone() {
    setMeta({ ...getMeta(), lastLocalBackup: today });
    setShowReminder(false);
  }

  return { showReminder, dismiss, markDone };
}

export function BackupReminderBanner({ onExport, onDismiss, dark }) {
  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:50,width:"calc(100% - 2rem)",maxWidth:380,borderRadius:20,padding:16,background:dark?"#27231c":"#fff",border:`1px solid ${dark?"rgba(255,255,255,0.045)":"rgba(44,36,22,0.055)"}`,boxShadow:dark?"0 8px 32px rgba(0,0,0,0.35)":"0 8px 32px rgba(44,36,22,0.15)"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
        <span style={{fontSize:22}}>🔔</span>
        <div style={{flex:1}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:500,color:dark?"#f0e8d8":"#2c2416"}}>Time to back up</p>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:dark?"#7a7060":"#9c8c78",marginTop:2}}>You haven't backed up your LifeOS data recently. Takes 2 seconds.</p>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={onExport} style={{flex:1,padding:"9px 14px",borderRadius:14,border:"none",cursor:"pointer",background:"#7a9e7e",color:"#fff",fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:500,letterSpacing:"0.04em"}}>⬇ Export now</button>
            <button onClick={onDismiss} style={{padding:"9px 16px",borderRadius:14,border:"none",cursor:"pointer",background:dark?"#312d24":"#f4efe6",color:dark?"#c8bfaa":"#5c5040",fontFamily:"'DM Mono',monospace",fontSize:11}}>Later</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ② GOOGLE DRIVE BACKUP
//
// SETUP (one-time, ~10 minutes):
//
// Step 1: Go to https://console.cloud.google.com
// Step 2: Create a new project called "LifeOS"
// Step 3: Enable "Google Drive API"
//   → APIs & Services → Enable APIs → search "Drive API" → Enable
// Step 4: Create OAuth credentials
//   → APIs & Services → Credentials → Create Credentials → OAuth Client ID
//   → Application type: Web application
//   → Authorized JavaScript origins: http://localhost:5173
//     (add your Netlify URL too, e.g. https://my-lifeos.netlify.app)
//   → Copy the CLIENT ID
// Step 5: Paste your CLIENT ID below:
//
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com";
const DRIVE_FOLDER_NAME = "LifeOS Backups";
const DRIVE_FILE_NAME   = "lifeos-backup.json";
//
// That's it! The code below handles everything else automatically.
// ============================================================

export function useGoogleDriveBackup() {
  const [status, setStatus] = useState("idle"); // idle | signing-in | uploading | success | error
  const [lastDriveBackup, setLastDriveBackup] = useState(getMeta().lastDriveBackup || null);
  const [isConfigured] = useState(GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com");

  // Load Google Identity Services script
  useEffect(() => {
    if (!isConfigured) return;
    if (document.getElementById("google-gsi")) return;
    const s = document.createElement("script");
    s.id = "google-gsi";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    document.head.appendChild(s);
  }, [isConfigured]);

  const backupToDrive = useCallback(async () => {
    if (!isConfigured) { alert("Add your Google Client ID first. See BackupSystem.jsx setup instructions."); return; }
    setStatus("signing-in");

    try {
      // Get OAuth token
      const token = await new Promise((resolve, reject) => {
        window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/drive.file",
          callback: (resp) => resp.error ? reject(resp) : resolve(resp.access_token),
        }).requestAccessToken();
      });

      setStatus("uploading");

      // Get or create backup folder
      const folderSearch = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json());

      let folderId;
      if (folderSearch.files?.length > 0) {
        folderId = folderSearch.files[0].id;
      } else {
        const folder = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
        }).then(r => r.json());
        folderId = folder.id;
      }

      // Check if backup file exists
      const fileSearch = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json());

      const data = localStorage.getItem(STORAGE_KEY) || "{}";
      const blob = new Blob([data], { type: "application/json" });

      if (fileSearch.files?.length > 0) {
        // Update existing file
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileSearch.files[0].id}?uploadType=media`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: blob,
        });
      } else {
        // Create new file
        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify({ name: DRIVE_FILE_NAME, parents: [folderId] })], { type: "application/json" }));
        form.append("file", blob);
        await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
      }

      const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      setLastDriveBackup(now);
      setMeta({ ...getMeta(), lastDriveBackup: now });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);

    } catch (err) {
      console.error("Drive backup failed:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [isConfigured]);

  const restoreFromDrive = useCallback(async () => {
    if (!isConfigured) { alert("Add your Google Client ID first."); return; }
    setStatus("signing-in");

    try {
      const token = await new Promise((resolve, reject) => {
        window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/drive.file",
          callback: (resp) => resp.error ? reject(resp) : resolve(resp.access_token),
        }).requestAccessToken();
      });

      setStatus("uploading"); // Reusing for "loading"

      const folderSearch = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json());

      if (!folderSearch.files?.length) { alert("No backup found on Google Drive."); setStatus("idle"); return; }

      const fileSearch = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and '${folderSearch.files[0].id}' in parents`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json());

      if (!fileSearch.files?.length) { alert("No backup file found."); setStatus("idle"); return; }

      const content = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileSearch.files[0].id}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.text());

      localStorage.setItem(STORAGE_KEY, content);
      setStatus("success");
      setTimeout(() => { setStatus("idle"); window.location.reload(); }, 1500);

    } catch (err) {
      console.error("Drive restore failed:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [isConfigured]);

  return { status, lastDriveBackup, isConfigured, backupToDrive, restoreFromDrive };
}

// ============================================================
// ③ SUPABASE REAL-TIME SYNC
//
// SETUP (one-time, ~15 minutes):
//
// Step 1: Go to https://supabase.com → sign up free
// Step 2: Create a new project called "lifeos"
// Step 3: Go to SQL Editor → run this SQL to create your table:
//
//   create table lifeos_data (
//     id text primary key default 'main',
//     data jsonb not null,
//     updated_at timestamptz default now()
//   );
//   alter table lifeos_data enable row level security;
//   create policy "Allow all" on lifeos_data for all using (true);
//
// Step 4: Go to Project Settings → API
//   → Copy "Project URL" and "anon public" key
// Step 5: Paste them below:
//
const SUPABASE_URL = "https://stbioajckgqnetbqzqll.supabase.co"; // e.g. https://xyzabc.supabase.co
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YmlvYWpja2dxbmV0YnF6cWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQxODMsImV4cCI6MjA4ODUzMDE4M30.n87-xH6Tti86_n0vyl3sHx7oEJgS3QE5T6noTIRJPgs"; // long string starting with eyJ...
//
// Step 6: Install supabase client in your project:
//   npm install @supabase/supabase-js
//
// Step 7: Uncomment the import below (line starts with //#UNCOMMENT)
//
//#UNCOMMENT: import { createClient } from "@supabase/supabase-js";
//
// That's it! Data syncs across all your devices automatically.
// ============================================================

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function pushToSupabase(state, userId) {
  if (!userId) throw new Error("No user ID");
  const { error } = await supabase
    .from("lifeos_data")
    .upsert({ id: userId, data: state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function pullFromSupabase(userId) {
  if (!userId) throw new Error("No user ID");
  const { data, error } = await supabase
    .from("lifeos_data")
    .select("data")
    .eq("id", userId)
    .single();
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data.data;
}

export function useSupabaseSync(appState, dispatch, userId) {
  const [syncStatus, setSyncStatus] = useState("idle");
  const [lastSynced, setLastSynced] = useState(getMeta().lastSupabaseSync || null);
  const [isConfigured] = useState(
    SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_KEY !== "YOUR_SUPABASE_ANON_KEY"
  );

  const pushToCloud = useCallback(async () => {
    if (!isConfigured) { alert("Add your Supabase URL and key first. See BackupSystem.jsx setup instructions."); return; }
    setSyncStatus("syncing");
    try {
      await pushToSupabase(appState, userId);
      const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setLastSynced(now);
      setMeta({ ...getMeta(), lastSupabaseSync: now });
      setSyncStatus("synced");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  }, [isConfigured, appState, userId]);

  const pullFromCloud = useCallback(async () => {
    if (!isConfigured) { alert("Add your Supabase URL and key first."); return; }
    setSyncStatus("syncing");
    try {
      const cloudData = await pullFromSupabase(userId);
      if (cloudData) {
        dispatch({ type: "IMPORT_STATE", payload: cloudData });
      }
      const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setLastSynced(now);
      setMeta({ ...getMeta(), lastSupabaseSync: now });
      setSyncStatus("synced");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  }, [isConfigured, dispatch]);

  // Auto-sync every 5 minutes when configured
  useEffect(() => {
    if (!isConfigured) return;
    const interval = setInterval(pushToCloud, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isConfigured, pushToCloud]);

  return { syncStatus, lastSynced, isConfigured, pushToCloud, pullFromCloud };
}

// ============================================================
// SETTINGS SCREEN
// Replace your existing SettingsScreen with this component.
// Pass in: state, dispatch, onExport, onImport
// ============================================================

export function SettingsScreen({ state, dispatch, dark }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [backupInterval, setBackupInterval] = useState(getMeta().backupInterval || 3);

  // ① Auto-reminder
  const { showReminder, dismiss, markDone } = useBackupReminder(backupInterval);

  // ② Google Drive
  const drive = useGoogleDriveBackup();

  // ③ Supabase
  const supabase = useSupabaseSync(state, dispatch);

  const dataSize = (() => {
    try { return (new Blob([localStorage.getItem(STORAGE_KEY) || ""]).size / 1024).toFixed(1); } catch { return "0"; }
  })();

  function exportLocal() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMeta({ ...getMeta(), lastLocalBackup: today });
    markDone();
  }

  function importLocal(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try { dispatch({ type: "IMPORT_STATE", payload: JSON.parse(evt.target.result) }); }
      catch { alert("Invalid backup file."); }
    };
    reader.readAsText(file);
  }

  const meta = getMeta();

  const statusLabel = (s) => ({
    idle: null, syncing: "⏳ Working…", uploading: "⏳ Uploading…",
    "signing-in": "🔐 Signing in…", success: "✓ Done!", error: "✗ Failed",
  })[s];

  // ── Design tokens (matching LifeOS_preview) ──
  const t = {
    cream:"#faf7f2", cream2:"#f4efe6", cream3:"#e8e0d4",
    ink:"#2c2416", ink2:"#5c5040", ink3:"#9c8c78",
    d0:"#17140f", d1:"#1f1c16", d2:"#27231c", d3:"#312d24",
    di:"#f0e8d8", di2:"#c8bfaa", di3:"#7a7060",
    sage:"#7a9e7e", sageL:"#d4e8d6",
    gold:"#c4974a", goldL:"#f5e4c0",
    sky:"#6b9ab8", rose:"#c47a7a", roseL:"#fdf0f0",
    plum:"#9b7fa8", plumL:"#ede0f4",
  };

  const d = dark;
  const cardStyle = {
    background: d ? t.d2 : "#fff",
    borderRadius: 20,
    padding: 20,
    border: `1px solid ${d?"rgba(255,255,255,0.045)":"rgba(44,36,22,0.055)"}`,
    boxShadow: d ? "0 2px 16px rgba(0,0,0,0.35)" : "0 2px 20px rgba(44,36,22,0.07)",
  };
  const lblStyle = {
    fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:d?t.di3:t.ink3,marginBottom:14,margin:0,marginBottom:14,
  };
  const monoStyle = (size=13, color=null) => ({
    fontFamily:"'DM Mono',monospace",fontSize:size,color:color||(d?t.di2:t.ink2),lineHeight:1.6,margin:0,
  });
  const btnFill = (bg=t.sage) => ({
    fontFamily:"'DM Mono',monospace",fontSize:12,letterSpacing:"0.04em",padding:"11px 20px",borderRadius:14,border:"none",cursor:"pointer",background:bg,color:"#fff",boxShadow:`0 3px 12px ${bg}55`,transition:"all 0.15s",
  });
  const btnGhost = {
    fontFamily:"'DM Mono',monospace",fontSize:12,letterSpacing:"0.04em",padding:"11px 20px",borderRadius:14,border:"none",cursor:"pointer",background:d?t.d3:t.cream2,color:d?t.di2:t.ink2,transition:"all 0.15s",
  };
  const btnOutline = {
    fontFamily:"'DM Mono',monospace",fontSize:12,letterSpacing:"0.04em",padding:"11px 20px",borderRadius:14,cursor:"pointer",background:"transparent",border:`1px solid ${d?"rgba(255,255,255,0.1)":"rgba(44,36,22,0.12)"}`,color:d?t.di3:t.ink3,transition:"all 0.15s",
  };
  const chipStyle = (active, bg) => ({
    width:32,height:32,borderRadius:"50%",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",
    background:active?bg:(d?t.d3:t.cream2),color:active?"#fff":(d?t.di3:t.ink3),
  });
  const badgeStyle = (configured) => ({
    fontFamily:"'DM Mono',monospace",fontSize:10,padding:"4px 10px",borderRadius:20,whiteSpace:"nowrap",
    background:configured?t.sageL:t.goldL,color:configured?t.sage:t.gold,
  });
  const divider = { height:1, background:d?"rgba(255,255,255,0.06)":"rgba(44,36,22,0.08)", margin:"4px 0" };
  const infoBox = (variant="warn") => ({
    borderRadius:14,padding:12,fontSize:11,lineHeight:1.7,fontFamily:"'DM Mono',monospace",
    background: variant==="warn" ? (d?t.d3:t.goldL) : (d?t.d3:t.sageL),
    color: variant==="warn" ? (d?t.di3:t.gold) : (d?t.di3:t.sage),
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      {/* Backup reminder banner */}
      {showReminder && (
        <BackupReminderBanner onExport={exportLocal} onDismiss={dismiss} dark={dark} />
      )}

      {/* Storage info */}
      <div style={cardStyle}>
        <p style={lblStyle}>Storage info</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            { label: "Goals", val: state.goals?.length || 0 },
            { label: "Habits", val: state.habits?.length || 0 },
            { label: "Journal entries", val: Object.keys(state.moods || {}).length },
            { label: "Health logs", val: Object.keys(state.health || state.healthLogs || {}).length },
            { label: "Storage used", val: `~${dataSize} KB` },
          ].map(r => (
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={monoStyle(12)}>{r.label}</span>
              <span style={monoStyle(12, d?t.di:t.ink)}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ① Auto-reminder */}
      <div style={cardStyle}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:15}}>🔔</span>
          <p style={{...lblStyle,marginBottom:0,flex:1}}>Auto-reminder</p>
          <span style={badgeStyle(true)}>Active</span>
        </div>
        <p style={{...monoStyle(11),color:d?t.di3:t.ink3,marginBottom:16}}>Reminds you to back up every few days</p>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <span style={monoStyle(12, d?t.di2:t.ink2)}>Remind every</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {[1, 3, 7, 14].map(v => (
              <button key={v} onClick={() => { setBackupInterval(v); setMeta({ ...getMeta(), backupInterval: v }); }}
                style={chipStyle(backupInterval === v, t.sage)}>{v}d</button>
            ))}
          </div>
        </div>

        {meta.lastLocalBackup && (
          <p style={{...monoStyle(11),color:d?t.di3:t.ink3,marginBottom:12}}>
            Last local backup: <span style={{fontWeight:500}}>{meta.lastLocalBackup}</span>
            {" "}({daysSince(meta.lastLocalBackup) === 0 ? "today" : `${daysSince(meta.lastLocalBackup)}d ago`})
          </p>
        )}

        <div style={{display:"flex",gap:8}}>
          <button onClick={exportLocal} style={{...btnFill(),flex:1,textAlign:"center"}}>⬇ Export JSON</button>
          <label style={{...btnGhost,flex:1,textAlign:"center",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            ⬆ Import JSON
            <input type="file" accept=".json" style={{display:"none"}} onChange={importLocal} />
          </label>
        </div>
      </div>

      {/* ② Google Drive — hidden for now */}

      {/* ③ Supabase Cloud Sync */}
      <div style={cardStyle}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:15}}>☁️</span>
          <p style={{...lblStyle,marginBottom:0,flex:1}}>Supabase Cloud Sync</p>
          <span style={badgeStyle(supabase.isConfigured)}>{supabase.isConfigured ? "Live" : "Setup needed"}</span>
        </div>
        <p style={{...monoStyle(11),color:d?t.di3:t.ink3,marginBottom:16}}>Real-time sync across all your devices</p>

        {!supabase.isConfigured && (
          <div style={{...infoBox("warn"),marginBottom:14}}>
            <strong>Setup required:</strong> Add your Supabase URL + key to BackupSystem.jsx line ~145. Run the SQL in comments to create the table. Takes ~15 minutes at supabase.com (free).
          </div>
        )}

        {supabase.isConfigured && (
          <div style={{...infoBox("ok"),marginBottom:14}}>
            ✓ Auto-syncing every 5 minutes. Last sync: {supabase.lastSynced || "not yet"}
          </div>
        )}

        <div style={{display:"flex",gap:8}}>
          <button onClick={supabase.pushToCloud} disabled={supabase.syncStatus !== "idle"}
            style={{...btnFill("#3ecf8e"),flex:1,textAlign:"center",opacity:supabase.syncStatus!=="idle"?0.6:1}}>
            {statusLabel(supabase.syncStatus) || "⬆ Push to cloud"}
          </button>
          <button onClick={supabase.pullFromCloud} disabled={supabase.syncStatus !== "idle"}
            style={{...btnGhost,flex:1,textAlign:"center",opacity:supabase.syncStatus!=="idle"?0.6:1}}>
            {supabase.syncStatus !== "idle" ? "…" : "⬇ Pull from cloud"}
          </button>
        </div>
      </div>

      {/* How it all works */}
      <div style={cardStyle}>
        <p style={lblStyle}>How it all works</p>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[
            { icon: "💾", title: "localStorage", desc: "Always on. Saves every change instantly to your browser." },
            { icon: "🔔", title: "Auto-reminder", desc: "Nudges you to export a JSON backup every few days." },
            { icon: "🗂", title: "Google Drive", desc: "One-click backup to your Drive. Restore on any device." },
            { icon: "☁️", title: "Supabase sync", desc: "Real-time database. All devices stay in sync automatically." },
          ].map(item => (
            <div key={item.title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:16,marginTop:2}}>{item.icon}</span>
              <div>
                <p style={monoStyle(12, d?t.di:t.ink)}>{item.title}</p>
                <p style={{...monoStyle(11),color:d?t.di3:t.ink3,marginTop:2}}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div style={cardStyle}>
        <p style={lblStyle}>Danger zone</p>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} style={{...btnOutline,width:"100%",textAlign:"center",color:t.rose,borderColor:d?"rgba(196,122,122,0.3)":"rgba(196,122,122,0.25)"}}>
            Reset all data
          </button>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <p style={{...monoStyle(12),textAlign:"center",color:d?t.di2:t.ink2}}>This wipes everything locally. Are you sure?</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={() => setConfirmReset(false)} style={{...btnGhost,textAlign:"center"}}>Cancel</button>
              <button onClick={() => { dispatch({ type: "RESET_ALL" }); setConfirmReset(false); }} style={{...btnFill(t.rose),textAlign:"center"}}>Yes, reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
