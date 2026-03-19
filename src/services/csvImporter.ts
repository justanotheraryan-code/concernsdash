import Papa from "papaparse";
import type { CoursePlan, CsvImportResult, SectionId, Session, Ticket } from "../types/dashboardTypes";

function toISODate(raw: string | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString().slice(0, 10);
}

function toSection(raw: string | undefined): SectionId {
  const normalized = (raw || "").toString().trim().replace(/^S/i, "");
  if (normalized === "1" || normalized === "2" || normalized === "3" || normalized === "4" || normalized === "YLC") {
    return normalized;
  }
  return "1";
}

function toNumber(raw: unknown, fallback = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export async function parseCsvRows(fileOrText: File | string): Promise<Record<string, string>[]> {
  const parseInput = fileOrText;
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(parseInput, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length) {
          reject(new Error(result.errors[0].message));
          return;
        }
        resolve(result.data);
      },
      error: (error) => reject(error),
    });
  });
}

export async function parseSessionFeedbackCsv(fileOrText: File | string): Promise<Session[]> {
  const rows = await parseCsvRows(fileOrText);

  return rows.map((r, idx) => ({
    id: r.id || `CSV-S-${idx + 1}`,
    dateISO: toISODate(r.date),
    startTime: r.startTime,
    program: r.program || "PGP",
    term: r.term || "Term 3",
    course: r.course,
    professor: r.professor,
    section: toSection(r.section),
    topic: r.topic || "Imported session",
    status: (r.status as Session["status"]) || "Delivered",
    ratingAvg: r.rating ? toNumber(r.rating, 0) : null,
    responses: toNumber(r.responses, 0),
    attendancePct: null,
    headcount: toNumber(r.headcount, 0),
    notes: r.notes,
  }));
}

export async function parseAttendanceCsv(fileOrText: File | string): Promise<Array<{
  dateISO: string;
  course: string;
  professor: string;
  section: SectionId;
  attendancePct: number;
  headcount: number;
}>> {
  const rows = await parseCsvRows(fileOrText);
  return rows.map((r) => ({
    dateISO: toISODate(r.date),
    course: r.course,
    professor: r.professor,
    section: toSection(r.section),
    attendancePct: toNumber(r.attendance, 0),
    headcount: toNumber(r.headcount, 0),
  }));
}

export function mergeFeedbackAndAttendance(
  feedback: Session[],
  attendanceRows: Array<{ dateISO: string; course: string; professor: string; section: SectionId; attendancePct: number; headcount: number }>
): Session[] {
  const map = new Map<string, Session>();

  for (const session of feedback) {
    const key = `${session.dateISO}|${session.course}|${session.professor}|${session.section}`;
    map.set(key, session);
  }

  for (const row of attendanceRows) {
    const key = `${row.dateISO}|${row.course}|${row.professor}|${row.section}`;
    const existing = map.get(key);

    if (existing) {
      existing.attendancePct = row.attendancePct;
      existing.headcount = row.headcount;
      map.set(key, existing);
      continue;
    }

    map.set(key, {
      id: `CSV-S-${map.size + 1}`,
      dateISO: row.dateISO,
      program: "PGP",
      term: "Term 3",
      course: row.course,
      professor: row.professor,
      section: row.section,
      topic: "Imported session",
      status: "Delivered",
      ratingAvg: null,
      responses: 0,
      attendancePct: row.attendancePct,
      headcount: row.headcount,
    });
  }

  return Array.from(map.values());
}

export async function parseTicketsCsv(fileOrText: File | string): Promise<Ticket[]> {
  const rows = await parseCsvRows(fileOrText);

  return rows.map((r, idx) => ({
    id: r.id || `CSV-T-${idx + 1}`,
    createdISO: toISODate(r.created),
    resolvedISO: r.resolved ? toISODate(r.resolved) : null,
    program: r.program || "PGP",
    term: r.term || "Term 3",
    category: (r.category as Ticket["category"]) || "Operations",
    priority: (r.priority as Ticket["priority"]) || "P2",
    status: (r.status as Ticket["status"]) || "Open",
    owner: r.owner || "Unassigned",
    title: r.title || "Imported ticket",
    description: r.description,
    slaHours: toNumber(r.slaHours, 48),
    course: r.course,
    professor: r.professor,
    section: r.section ? toSection(r.section) : undefined,
  }));
}

export async function parsePlanCsv(fileOrText: File | string): Promise<CoursePlan[]> {
  const rows = await parseCsvRows(fileOrText);

  return rows.map((r, idx) => ({
    id: r.id || `CSV-P-${idx + 1}`,
    program: r.program || "PGP",
    term: r.term || "Term 3",
    course: r.course,
    section: toSection(r.section),
    plannedSessions: toNumber(r.plannedSessions, 0),
  }));
}

export async function parseBulkCsvImport(input: {
  feedbackCsv?: File | string;
  attendanceCsv?: File | string;
  ticketsCsv?: File | string;
  planCsv?: File | string;
}): Promise<CsvImportResult> {
  const result: CsvImportResult = {};

  if (input.feedbackCsv) {
    const feedback = await parseSessionFeedbackCsv(input.feedbackCsv);
    if (input.attendanceCsv) {
      const attendance = await parseAttendanceCsv(input.attendanceCsv);
      result.sessions = mergeFeedbackAndAttendance(feedback, attendance);
    } else {
      result.sessions = feedback;
    }
  }

  if (input.ticketsCsv) {
    result.tickets = await parseTicketsCsv(input.ticketsCsv);
  }

  if (input.planCsv) {
    result.coursePlan = await parsePlanCsv(input.planCsv);
  }

  return result;
}
