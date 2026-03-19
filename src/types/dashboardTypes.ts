export type SectionId = "1" | "2" | "3" | "4" | "YLC";
export type SectionFilter = "All" | SectionId;

export type SessionStatus = "Delivered" | "Planned" | "Cancelled";

export interface Session {
  id: string;
  dateISO: string;
  startTime?: string;
  program?: string;
  term?: string;
  course: string;
  professor: string;
  section: SectionId;
  topic: string;
  status: SessionStatus;
  ratingAvg: number | null;
  responses: number;
  attendancePct: number | null;
  headcount: number;
  comments?: string[];
  notes?: string;
}

export interface CoursePlan {
  id?: string;
  program?: string;
  term?: string;
  course: string;
  section: SectionId;
  plannedSessions: number;
}

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "P0" | "P1" | "P2" | "P3";

export type TicketCategory =
  | "Schedule"
  | "Content"
  | "Faculty"
  | "Assessment"
  | "LMS"
  | "Operations";

export interface Ticket {
  id: string;
  createdISO: string;
  resolvedISO?: string | null;
  program?: string;
  term?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  owner: string;
  title: string;
  description?: string;
  slaHours: number;
  course?: string;
  professor?: string;
  section?: SectionId;
}

export type DataSource = "mock" | "csv" | "googleSheets" | "api";

export interface DashboardFilters {
  program: string;
  term: string;
  section: SectionFilter;
  course: string;
  professor: string;
  range: "14" | "30" | "all";
  query: string;
}

export interface TrendPoint {
  dateISO: string;
  date: string;
  rating: number;
  attendance: number;
}

export interface TicketTrendPoint {
  dateISO: string;
  date: string;
  created: number;
  resolved: number;
  backlog: number;
}

export type SliceType = "Course" | "Professor" | "Section" | "CoursexProfessor";
export type SliceMetric = "Rating" | "Attendance";
export type RiskSeverity = "Low" | "Medium" | "High";

export interface RiskSlice {
  key: string;
  sliceType: SliceType;
  label: string;
  metric: SliceMetric;
  current: number;
  baseline: number;
  delta: number;
  severity: RiskSeverity;
  riskScore: number;
  hint: string;
}

export interface KPIBundle {
  avgRating: number;
  avgAttendance: number;
  nSessionsDelivered: number;
  nSessionsPlanned: number;
  responseTotal: number;
  lowRating: number;
  lowAttendance: number;
}

export interface ProgressBundle {
  plannedTotal: number;
  deliveredCount: number;
  pct: number;
}

export interface SectionHealthItem {
  section: SectionId;
  rating: number;
  attendance: number;
  sessions: number;
  riskScore: number;
}

export interface CourseHealthItem {
  course: string;
  rating: number;
  attendance: number;
  ticketVolume: number;
  courseHealthScore: number;
  status: "Green" | "Watch" | "At Risk";
  riskScore: number;
}

export interface FacultyHealthItem {
  professor: string;
  rating: number;
  attendance: number;
  sessionsDelivered: number;
  ticketComplaints: number;
  riskScore: number;
  deltaRating: number;
}

export interface TicketMetrics {
  openCount: number;
  inSlaBreaches: number;
  resolvedBreaches: number;
  avgHours: number;
  p50Hours: number;
  p90Hours: number;
  created7: number;
  resolved7: number;
  maxISO: string;
  topCats: Array<[string, number]>;
  open: Ticket[];
  closed: Ticket[];
}

export interface PredictiveSignal {
  metric: "rating" | "attendance";
  slope: number;
  predictedNext: number;
  direction: "up" | "down" | "flat";
}

export interface AnomalyAlert {
  id: string;
  type:
    | "rating_drop"
    | "attendance_crash"
    | "backlog_rise"
    | "faculty_repeat_issues"
    | "section_underperforming";
  severity: RiskSeverity;
  title: string;
  detail: string;
  relatedCourse?: string;
  relatedProfessor?: string;
  relatedSection?: SectionId;
  metricValue?: number;
  threshold?: number;
}

export interface LeadershipInsight {
  id: string;
  headline: string;
  impact: "High" | "Medium" | "Low";
  recommendation: string;
}

export interface DirectorActionItem {
  id: string;
  createdAtISO: string;
  title: string;
  course?: string;
  professor?: string;
  section?: SectionId;
  owner?: string;
  status: "Open" | "In Progress" | "Done";
  notes?: string;
}

export interface AnalyticsSnapshot {
  kpis: KPIBundle;
  progress: ProgressBundle;
  trends: {
    sessions: TrendPoint[];
    tickets: TicketTrendPoint[];
    predictions: PredictiveSignal[];
  };
  sectionHealth: SectionHealthItem[];
  courseHealth: CourseHealthItem[];
  facultyHealth: {
    rows: FacultyHealthItem[];
    bestRated: FacultyHealthItem[];
    mostImproved: FacultyHealthItem[];
    highestRisk: FacultyHealthItem[];
  };
  ticketMetrics: TicketMetrics;
  atRisk: RiskSlice[];
  anomalies: AnomalyAlert[];
  insights: LeadershipInsight[];
}

export interface DataProviderContext {
  program?: string;
  term?: string;
}

export interface CsvImportResult {
  sessions?: Session[];
  tickets?: Ticket[];
  coursePlan?: CoursePlan[];
}
