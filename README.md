# LifeOS

A personal life-management app built with **React 18 + Vite**. Track goals, health, finances, journal entries, menstrual cycle, and more — all in one place, synced to **Supabase**.

## Tech Stack

- **React 18** — `useReducer` for state, no external state library
- **Vite** — dev server & build
- **Supabase** — auth + cloud persistence
- **Recharts** — charts & visualisations
- **Inline styles** — custom design-token system (`tk`)

## Project Structure

```text
src/
├── constants.js          # Design tokens, colors, moods, cycle phases, nav config
├── reducer.js            # Initial state (INIT) & reducer with all action types
├── ThemeContext.jsx       # ThemeCtx context, useT() hook, global Fonts component
├── ui.jsx                # Shared UI atoms — Card, Btn, Toggle, Chip, PBar, Ring, etc.
├── screens/
│   ├── HomeScreen.jsx    # Dashboard with clickable stat tiles
│   ├── GoalsScreen.jsx   # Goals CRUD with category filter pills
│   ├── HealthScreen.jsx  # Water, sleep, steps, workout, habits, weekly chart
│   ├── FinanceScreen.jsx # Monthly budgeting — recurring/one-time expenses, investments
│   ├── CycleScreen.jsx   # Menstrual cycle tracker with phase calendar & symptoms
│   └── InsightsScreen.jsx# Cross-section analytics & charts
├── LifeOS_preview.jsx    # Root shell — wires reducer, Supabase sync, nav, layout
├── App.jsx               # Auth gate — renders LifeOS or AuthScreen
├── AuthScreen.jsx        # Sign-in / sign-up flow
├── BackupSystem.jsx      # Supabase push/pull, SettingsScreen, backup reminders
└── main.jsx              # Vite entry point
```

## Getting Started

```bash
npm install
npm run dev
```

## Architecture Notes

- **Single reducer** — all app state lives in one `useReducer` in the root shell; screens receive `(s, dp, go)` props (state, dispatch, navigate).
- **No routing library** — navigation is a simple `screen` string state; the bottom nav and tile clicks call `go("screenId")`.
- **Supabase sync** — state is pulled on login, then auto-pushed with a 1.5 s debounce on every change.
- **Theming** — dark / light mode toggled via `dispatch({ type: "DARK" })`; all components read from `ThemeCtx`.
