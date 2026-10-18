# LockIn — Smart Distraction Management for Students

> **Lock distractions. Unlock your potential.**

LockIn is a mobile-responsive web application that helps students run focused study sessions by
deciding, ahead of time, which apps and websites stay out of reach while they work. It is built
with React + TypeScript, keeps everything on the device, and is honest about what a browser
prototype can and cannot do.

---

## ⚠️ Honest scope (please read before the demo)

LockIn **simulates** application blocking inside the browser page. It is a faithful product
prototype, not a device-security tool.

| LockIn does (in this prototype)                                     | LockIn does **not** do                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Blocks a restricted item inside the LockIn session screen            | Stop you closing the browser tab                                   |
| Logs every blocked attempt against the session                      | Clear browser data or use a private window                         |
| Locks the restriction list in Strict Focus                          | Open another installed application on the device                   |
| Keeps essential academic tools reachable in the simulator            | Enforce anything at the operating-system level                     |

Real device-level blocking would require native integration — for example an Android
`AccessibilityService` / `DevicePolicyManager`, an iOS Screen Time API or supervised-device (MDM)
profile. The UI says this in plain language in several places rather than overclaiming.

---

## Feature tour

**Dashboard** — headline stats (today's focus time, completed sessions, current streak, weekly
hours), a seven-day focus chart built from real recorded data, recent sessions and quick access to
app management and settings. Clear empty states when nothing has been logged yet.

**Session setup (`/start`)** — a four-step wizard:
1. *Goal* — study goal with validation, quick-pick suggestions, duration presets (25/45/60/90) and a
   custom duration (1–240 minutes).
2. *Mode* — Flexible Focus vs Strict Focus, each explained before you choose.
3. *Apps* — search, filter by category and set **allowed / restricted / no rule** per app or site.
4. *Review* — a summary of the goal, duration, mode and the exact restriction list.

**Two focus modes**
- *Flexible Focus* — restrictions can be changed while the session runs. Removing a restriction
  always asks for an explicit warning first.
- *Strict Focus* — restrictions are configured before the session and **locked** for its duration.
  There is no in-session button to remove them, essential academic tools (calculator, notes, PDF
  reader, dictionary, Classroom…) stay reachable, and starting requires an explicit confirmation.

**App management (`/apps`)** — a categorised **sample** catalog (Education, Productivity,
Communication, Social Media, Games, Entertainment) with 46 illustrative entries. Search, category
filters, per-app permission rules, time-boxed "temporarily allow" grants for legitimate academic
use, and one-click "use as session defaults".

**Active session (`/session`)** — a large countdown ring, goal, progress, focus-mode indicator,
allowed/restricted summaries, blocked-attempt log, pause/resume and an early-exit confirmation. An
**app simulator** lets you try opening any catalog item: allowed items open a small working
simulation (the calculator really calculates, the PDF reader shows a document, Classroom shows
assignments), while restricted items are intercepted with the message:

> *Stay focused. This activity is restricted during your study session.*

**Report (`/report/:id`)** — goal, planned vs actual elapsed time, completed or ended early, the
number of simulated blocked attempts with timestamps, and a short encouraging message. Any derived
number is explicitly labelled as an *estimate*, and the app states that it does not measure
concentration.

**Progress (`/progress`)** — weekly chart, four-week trend, focus broken down by study goal, and a
Flexible vs Strict comparison. Every figure is calculated from the sessions that were actually
recorded.

**Settings (`/settings`)** — theme (dark / light / system), default duration, default focus mode,
default allowed & restricted apps, in-app notifications, completion chime, load sample sessions and
reset the demo data. Everything persists across refreshes.

---

## Tech stack

- **React 18 + TypeScript** (strict mode, `noUncheckedIndexedAccess`)
- **Vite 5** for dev server and production build
- **react-router-dom 6** for routing
- **lucide-react** for icons
- **Vitest + Testing Library** for unit and workflow tests
- **CSS custom properties** for theming — no UI framework, no paid services, no API keys

State lives in a single `useReducer` store (`src/state/AppProvider.tsx`) and is persisted to
`localStorage` under the `lockin:v1:*` namespace. Every read is sanitised, so a corrupt payload can
never crash the app.

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script              | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                  |
| `npm run build`     | Type-check + production build to `dist/`    |
| `npm run preview`   | Serve the production build                  |
| `npm run test`      | Run the Vitest suite (35 tests)             |
| `npm run lint`      | TypeScript project check                    |

### Demo script (2 minutes)

1. Open the dashboard — the empty states explain what LockIn does.
2. **Settings → Load sample sessions** to populate the charts with realistic data.
3. **Start Focus Session** → name a goal → pick *Flexible* → restrict a few apps → review → start.
4. On the session screen, scroll to **Try opening an app** and click *YouTube* — it is intercepted
   and the attempt is logged.
5. Open the calculator from the same simulator to show an allowed app really opening.
6. End the session early → read the report → check **Progress** and **Session History**.
7. Repeat with *Strict Focus* to show the lock and the confirmation dialog.
8. Refresh mid-session to show that the timer resumes exactly where it was.

---

## Project structure

```
src/
├── components/
│   ├── apps/PermissionEditor.tsx      shared permission table (search, filters, rules)
│   ├── charts/WeeklyFocusChart.tsx    dependency-free SVG chart
│   ├── layout/                        sidebar, top bar, mobile navigation
│   ├── session/                       restriction overlay + app simulator
│   └── ui/                            buttons, modals, toggles, toasts, empty states…
├── data/catalog.ts                    the sample app / website catalog
├── hooks/useNow.ts                    one shared clock for the whole app
├── lib/                               storage, formatting, session maths, sample data
├── pages/                             dashboard, start, session, apps, history, progress, settings
└── state/                             reducer, provider, persistence, hydration
```

---

## Engineering notes

- **One timer, not many.** The provider owns a single `setInterval` that completes a session, and
  `useNow` exposes a single shared ticker for display clocks. A session is timed from wall-clock
  timestamps (`startedAt` + accumulated paused time), so a refresh, a sleeping laptop or a closed
  tab never corrupts the count.
- **Graceful recovery.** On load the persisted session is re-hydrated and reconciled: if the
  planned time passed while the tab was closed, the session is completed and stored with a note
  instead of being lost.
- **Strict Focus is genuinely strict.** The in-session editor is not rendered at all in strict
  mode — there is no button to remove a restriction, and the start flow requires an explicit
  acknowledgement.
- **Honest metrics.** LockIn reports the focus time it measured and the number of blocked attempts
  it counted. The single derived score is labelled *Estimated focus index*, and the UI explains
  exactly how it is calculated and that it is not a measurement of attention.
- **Accessible and responsive.** Semantic landmarks, labelled controls, focus-visible rings,
  `role="dialog"` modals with Escape-to-close, reduced-motion support, a bottom tab bar and a
  drawer on small screens, and a 320 px-wide layout that stays usable.

---

## Limitations

- The app catalog is **sample data** — LockIn does not scan the applications installed on a device.
- Blocking is simulated inside the LockIn page; a determined user can leave the page at any time.
- There is no account system, no sync and no server: everything lives in one browser profile.
