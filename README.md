# MOS - My Operating System

MOS is a highly personalized, private, offline-first personal operating system designed to manage your days, deadlines, and diary. It is built strictly for the individual—**no accounts, no clouds, no tracking**. Everything lives locally on your device.

## Features & Philosophy

*   **Offline-First & Local:** Uses IndexedDB via Dexie to store all your data locally on your device. Zero backend, zero latency, maximum privacy.
*   **Progressive Web App (PWA):** Installable on both desktop and mobile as a native app, complete with background push notifications and a dedicated splash screen.
*   **Adaptive Dual-Theme System:**
    *   **Pastel:** "My Little Operating System" — A cozy, soft, notebook-like vibe.
    *   **Scifi:** "My Operating System" — A sleek, dark, neon-accented futuristic interface.
*   **Intelligent Notifications:**
    *   Granular deadline nudges (30 min, 5 min, "Due Now").
    *   Untimed reminders spaced throughout the day (09:00, 13:00, 18:00, 21:00).
    *   In-app toasts powered by `sonner` and OS-level browser background popups.
    *   Customizable "Quiet Hours" to pause background nudges.

## Modules

The app is divided into distinct "modules", all dynamically renamed based on your active theme:

| Pastel Theme (Cozy) | Scifi Theme (Sleek) | Purpose |
| :--- | :--- | :--- |
| **Nest** | **Dock** | The home dashboard. Morning digests, quick glances, and the Mo mascot greeting. |
| **Petal Trail** | **Mission Log** | Daily tracking: moods, tiny steps, and rhythms. |
| **Bloom Season** | **Orbit** | Timetable management: Classes, recurring schedules, and impending deadlines. |
| **JB** | **JB** | A locked, encrypted private diary space. Features rich text entries, image attachments, and tag-based search. |
| **Petal Almanac** | **Chronos** | A temporal index of significant dates and events, marked in color. |
| **The Potting Shed** | **Control Core** | Settings. (Hidden by default—see Easter Eggs!) |
| **Trash Panda** | **Random Crap™** | A brain dump module triggered by physical gestures. |

## Easter Eggs & Secrets

MOS contains hidden interactions designed to delight:
1.  **Triple Click Settings:** The settings module is not in the standard navigation. You must *triple-click* the MOS wordmark/logo in the top left to open it.
2.  **Mo Duo Illustration:** *Long-press* the MOS wordmark to reveal a secret "Mo Duo" splash illustration overlay (combining both Scifi and Pastel Mo characters).
3.  **Shake to Dump:** On mobile devices with accelerometer support, physically shaking the device instantly opens the "Trash Panda / Random Crap" brain dump module.
4.  **Dynamic Mascot:** The Mo mascot on the home screen tracks the time of day, deadlines, and overdue tasks to dynamically change its expression (sleeping, panicked, neutral, etc).

## Tech Stack & Architecture

*   **Framework:** React 19 + TanStack Start (SSR/Vite)
*   **Routing:** TanStack Router (File-based routing with loaders)
*   **State Management:** TanStack Query + React Hooks
*   **Database:** IndexedDB (via `dexie` and `dexie-react-hooks`)
*   **Styling:** Tailwind CSS + `shadcn/ui` + Custom CSS Variables for Theming
*   **Notifications:** Native Web Notifications API + `sonner`
*   **Build Tooling:** Vite + `vite-plugin-pwa`

### Architectural Notes
*   **SSR Safety with IndexedDB:** Because TanStack Start runs modules on both server and client, direct instantiation of `Dexie` is abstracted behind a lazy Proxy in `src/lib/db.ts` to prevent server-side crashes where `window.indexedDB` is undefined.
*   **Schema:** The Dexie database (`mos`) tracks `classes`, `deadlines`, `entries` (for JB), `almanac` dates, and key-value `settings` (for notification preferences and theme state).

## Local Development

You will need Node.js and npm installed.

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.
