import type { DataSource, SectionId } from "../types/dashboardTypes";

export const PROGRAMS = ["PGP"] as const;
export const TERMS = ["Term 1", "Term 2", "Term 3", "Term 4"] as const;
export const SECTIONS: ReadonlyArray<"All" | SectionId> = ["All", "1", "2", "3", "4", "YLC"];

export const RANGE = [
  { id: "14", label: "Last 14 days" },
  { id: "30", label: "Last 30 days" },
  { id: "all", label: "All term" },
] as const;

export const STORAGE_KEYS = {
  sessions: "dashboard_sessions",
  tickets: "dashboard_tickets",
  plan: "dashboard_plan",
  actions: "dashboard_actions",
} as const;

export const dashboardConfig = {
  DATA_SOURCE: "mock" as DataSource,
  GOOGLE_SHEET_ID: "",
  GOOGLE_REFRESH_MS: 10 * 60 * 1000,
  API_BASE_URL: "/api/dashboard",
  RISK_WEIGHTS: {
    ratingDrop: 0.4,
    attendanceDrop: 0.3,
    ticketVolume: 0.2,
    commentsSignal: 0.1,
  },
  COURSE_HEALTH_WEIGHTS: {
    rating: 0.5,
    attendance: 0.3,
    operational: 0.2,
  },
  TREND_THRESHOLDS: {
    ratingDrop: 0.4,
    attendanceCrash: 10,
    backlogRisePct: 20,
  },
  SESSIONS_PER_CLICK: 10,
};

export type RangeId = (typeof RANGE)[number]["id"];
