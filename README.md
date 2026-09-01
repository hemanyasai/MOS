# MOS - My Operating System

MOS is a highly personalized personal operating system designed to manage your days, deadlines, and diary. Built to run flawlessly across devices, it relies on a pure cloud architecture to keep your desktop and mobile perfectly in sync.

## Features & Philosophy

*   **Cloud-First Sync:** Powered by Supabase. All modules (notes, schedule, metrics, and diary media) sync seamlessly across any device with an internet connection.
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
| **JB** | **JB** | A locked private diary space. Features rich text entries, voice notes, and image attachments safely stored in Supabase Storage. |
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
*   **Database & Auth:** Supabase (PostgreSQL + Storage)
*   **Styling:** Tailwind CSS + `shadcn/ui` + Custom CSS Variables for Theming
*   **Notifications:** Native Web Notifications API + `sonner`
*   **Build Tooling:** Vite + `vite-plugin-pwa`

### Architectural Notes
*   **Data Layer:** Replaced legacy Dexie local storage with a fully remote Supabase architecture. Requires active internet connection to authenticate and fetch user data.
*   **Schema:** The Supabase database tracks `classes`, `deadlines`, `diary_entries`, and user preferences. JB diary attachments use Supabase Storage with signed URLs to securely display user media.

## Local Development

You will need Node.js and npm installed. Ensure your `.env` contains your Supabase credentials:
`VITE_SUPABASE_URL=...`
`VITE_SUPABASE_ANON_KEY=...`

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.
