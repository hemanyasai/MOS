import Dexie, { type EntityTable } from "dexie";

/**
 * Local-only storage for MOS. No backend, no accounts.
 * Tables are declared now so follow-up modules can fill them in.
 */
export interface Note {
  id: number;
  body: string;
  createdAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
}

/** A menstrual cycle. `endDate` is null while the period is still active. */
export interface Cycle {
  id: number;
  /** ISO date yyyy-mm-dd */
  startDate: string;
  endDate: string | null;
  /** Period length in days, set when the cycle is closed. */
  lengthDays: number | null;
}

export type Flow = "light" | "medium" | "heavy";
export const SYMPTOMS = ["cramps", "headache", "fatigue", "mood swings", "bloating"] as const;
export type Symptom = (typeof SYMPTOMS)[number];

/** One logged day inside a cycle. */
export interface CycleDay {
  id: number;
  cycleId: number;
  /** ISO date yyyy-mm-dd */
  date: string;
  flow: Flow | null;
  symptoms: Symptom[];
}

export type MetricType = "counter" | "duration" | "text_log";

export interface MetricCategory {
  id: number;
  name: string;
  /** Lucide icon key, see lib/metric-icons.ts */
  icon: string;
  type: MetricType;
  unit: string;
  dailyGoal: number | null;
  archived: boolean;
  createdAt: number;
}

/** One logged entry for a category on a given day. */
export interface MetricEntry {
  id: number;
  categoryId: number;
  /** ISO date yyyy-mm-dd */
  date: string;
  /** counter: units; duration: minutes; text_log: 0 */
  value: number;
  text: string | null;
  createdAt: number;
}

export type ClassImportance = "normal" | "important" | "extra";
export type DeadlineImportance = "normal" | "important";
export type PendingStatus = "date unknown" | "date confirmed";

/** A recurring weekly class. */
export interface ClassItem {
  id: number;
  subject: string;
  /** 0 = Sunday .. 6 = Saturday */
  dayOfWeek: number;
  /** HH:mm */
  startTime: string;
  endTime: string;
  location: string | null;
  importance: ClassImportance;
  createdAt: number;
}

export interface Deadline {
  id: number;
  title: string;
  /** ISO yyyy-mm-dd */
  dueDate: string;
  /** HH:mm or null */
  dueTime: string | null;
  category: string | null;
  importance: DeadlineImportance;
  doneAt: number | null;
  createdAt: number;
}

export interface PendingEvent {
  id: number;
  title: string;
  note: string | null;
  status: PendingStatus;
  /** ISO yyyy-mm-dd once confirmed */
  date: string | null;
  createdAt: number;
}

/** A one-off manually added holiday / special date. */
export interface Holiday {
  id: number;
  title: string;
  /** ISO yyyy-mm-dd */
  date: string;
  createdAt: number;
}

/** A file attachment kept inline with the diary entry. */
export interface DiaryAttachment {
  blob: Blob;
  filename: string;
}

/** One JB diary entry. All media lives locally as Blobs. */
export interface DiaryEntry {
  id: number;
  timestamp: number;
  text: string;
  images: Blob[];
  voiceNotes: Blob[];
  attachments: DiaryAttachment[];
  tags: string[];
  sticker: string | null;
}

export type MosDb = Dexie & {
  notes: EntityTable<Note, "id">;
  settings: EntityTable<Setting, "key">;
  cycles: EntityTable<Cycle, "id">;
  cycleDays: EntityTable<CycleDay, "id">;
  metricCategories: EntityTable<MetricCategory, "id">;
  metricEntries: EntityTable<MetricEntry, "id">;
  classes: EntityTable<ClassItem, "id">;
  deadlines: EntityTable<Deadline, "id">;
  pendingEvents: EntityTable<PendingEvent, "id">;
  diaryEntries: EntityTable<DiaryEntry, "id">;
  holidays: EntityTable<Holiday, "id">;
};

function createDb(): MosDb {
  const instance = new Dexie("mos") as MosDb;

  instance.version(1).stores({
    notes: "++id, createdAt",
    settings: "key",
  });

  instance.version(2).stores({
    notes: "++id, createdAt",
    settings: "key",
    cycles: "++id, startDate, endDate",
    cycleDays: "++id, cycleId, date, [cycleId+date]",
    metricCategories: "++id, archived, createdAt",
    metricEntries: "++id, categoryId, date, [categoryId+date]",
  });

  instance.version(3).stores({
    notes: "++id, createdAt",
    settings: "key",
    cycles: "++id, startDate, endDate",
    cycleDays: "++id, cycleId, date, [cycleId+date]",
    metricCategories: "++id, archived, createdAt",
    metricEntries: "++id, categoryId, date, [categoryId+date]",
    classes: "++id, dayOfWeek, startTime, createdAt",
    deadlines: "++id, dueDate, doneAt, createdAt",
    pendingEvents: "++id, status, date, createdAt",
  });

  instance.version(4).stores({
    notes: "++id, createdAt",
    settings: "key",
    cycles: "++id, startDate, endDate",
    cycleDays: "++id, cycleId, date, [cycleId+date]",
    metricCategories: "++id, archived, createdAt",
    metricEntries: "++id, categoryId, date, [categoryId+date]",
    classes: "++id, dayOfWeek, startTime, createdAt",
    deadlines: "++id, dueDate, doneAt, createdAt",
    pendingEvents: "++id, status, date, createdAt",
    diaryEntries: "++id, timestamp",
  });

  instance.version(5).stores({
    notes: "++id, createdAt",
    settings: "key",
    cycles: "++id, startDate, endDate",
    cycleDays: "++id, cycleId, date, [cycleId+date]",
    metricCategories: "++id, archived, createdAt",
    metricEntries: "++id, categoryId, date, [categoryId+date]",
    classes: "++id, dayOfWeek, startTime, createdAt",
    deadlines: "++id, dueDate, doneAt, createdAt",
    pendingEvents: "++id, status, date, createdAt",
    diaryEntries: "++id, timestamp",
    holidays: "++id, date, createdAt",
  });

  return instance;
}

// Only instantiate Dexie in the browser — IndexedDB does not exist on the server.
// A lazy singleton ensures SSR never creates a broken db instance that could
// interfere with the real client-side database on hydration.
let _db: MosDb | null = null;

function getDb(): MosDb {
  if (!_db) {
    if (typeof window === "undefined") {
      // Return a dummy object during SSR — no data ops will actually run server-side.
      return {} as MosDb;
    }
    _db = createDb();
  }
  return _db;
}

// Proxy so all existing callers (`import { db }`) keep working without change.
export const db = new Proxy({} as MosDb, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
