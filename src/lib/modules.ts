import {
  Home,
  Sparkles,
  CalendarDays,
  BookLock,
  CalendarHeart,
  Rocket,
  ListChecks,
  Orbit,
  Telescope,
  Settings2,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import type { ThemeName } from "./theme";

export type ModuleKey = "home" | "daily" | "timetable" | "diary" | "almanac" | "settings" | "dump";

export type ModuleDef = {
  key: ModuleKey;
  path: string;
  hidden?: boolean;
  names: Record<ThemeName, string>;
  taglines: Record<ThemeName, string>;
  icons: Record<ThemeName, LucideIcon>;
};

export const MODULES: ModuleDef[] = [
  {
    key: "home",
    path: "/",
    names: { pastel: "Nest", scifi: "Dock" },
    taglines: {
      pastel: "Your cozy little landing spot.",
      scifi: "Primary interface. All systems nominal.",
    },
    icons: { pastel: Home, scifi: Rocket },
  },
  {
    key: "daily",
    path: "/daily",
    names: { pastel: "Petal Trail", scifi: "Mission Log" },
    taglines: {
      pastel: "Today's little steps, moods and rhythms.",
      scifi: "Daily objectives, biometrics and duty cycles.",
    },
    icons: { pastel: Sparkles, scifi: ListChecks },
  },
  {
    key: "timetable",
    path: "/timetable",
    names: { pastel: "Bloom Season", scifi: "Orbit" },
    taglines: {
      pastel: "Classes, deadlines and things about to blossom.",
      scifi: "Scheduled trajectories and incoming deadlines.",
    },
    icons: { pastel: CalendarDays, scifi: Orbit },
  },
  {
    key: "diary",
    path: "/diary",
    // JB is never renamed across themes.
    names: { pastel: "JB", scifi: "JB" },
    taglines: {
      pastel: "Locked. Only for you.",
      scifi: "Encrypted. Access restricted.",
    },
    icons: { pastel: BookLock, scifi: BookLock },
  },
  {
    key: "almanac",
    path: "/almanac",
    names: { pastel: "Petal Almanac", scifi: "Chronos" },
    taglines: {
      pastel: "Dates worth remembering, marked in colour.",
      scifi: "Temporal index of significant events.",
    },
    icons: { pastel: CalendarHeart, scifi: Telescope },
  },
  {
    key: "settings",
    path: "/settings",
    hidden: true,
    names: { pastel: "The Potting Shed", scifi: "Control Core" },
    taglines: {
      pastel: "Where you tinker with the pots and soil.",
      scifi: "System configuration and core parameters.",
    },
    icons: { pastel: Settings2, scifi: Cpu },
  },
  {
    key: "dump",
    path: "/dump",
    hidden: true,
    names: { pastel: "Trash Panda", scifi: "Random Crap™" },
    taglines: {
      pastel: "Everything you shoved in here at 2am.",
      scifi: "Unsorted data buffer. No schema, no judgement.",
    },
    icons: { pastel: Sparkles, scifi: Sparkles },
  },
];

export const NAV_MODULES = MODULES.filter((m) => !m.hidden);

export function getModule(key: ModuleKey): ModuleDef {
  return MODULES.find((m) => m.key === key)!;
}
