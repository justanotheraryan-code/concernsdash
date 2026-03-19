import { dashboardConfig } from "../config/dashboardConfig";
import type { CoursePlan, CsvImportResult, Session, Ticket } from "../types/dashboardTypes";
import { parsePlanCsv, parseSessionFeedbackCsv, parseTicketsCsv } from "./csvImporter";

const DEFAULT_SHEETS = {
  sessions: "Sessions",
  tickets: "Tickets",
  plan: "Plan",
} as const;

function buildCsvUrl(sheetId: string, sheetName: string): string {
  const encoded = encodeURIComponent(sheetName);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
}

async function fetchCsvText(sheetId: string, sheetName: string): Promise<string> {
  const url = buildCsvUrl(sheetId, sheetName);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet '${sheetName}' (${response.status})`);
  }
  return response.text();
}

export async function loadFromGoogleSheets(sheetId = dashboardConfig.GOOGLE_SHEET_ID): Promise<CsvImportResult> {
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is not configured");
  }

  const [sessionsCsv, ticketsCsv, planCsv] = await Promise.all([
    fetchCsvText(sheetId, DEFAULT_SHEETS.sessions),
    fetchCsvText(sheetId, DEFAULT_SHEETS.tickets),
    fetchCsvText(sheetId, DEFAULT_SHEETS.plan),
  ]);

  const [sessions, tickets, coursePlan] = await Promise.all([
    parseSessionFeedbackCsv(sessionsCsv),
    parseTicketsCsv(ticketsCsv),
    parsePlanCsv(planCsv),
  ]);

  return { sessions, tickets, coursePlan };
}

export function startGoogleSheetsAutoRefresh(
  onData: (payload: { sessions: Session[]; tickets: Ticket[]; coursePlan: CoursePlan[] }) => void,
  options?: {
    sheetId?: string;
    intervalMs?: number;
    onError?: (error: unknown) => void;
  }
): () => void {
  const intervalMs = options?.intervalMs ?? dashboardConfig.GOOGLE_REFRESH_MS;

  const run = async () => {
    try {
      const payload = await loadFromGoogleSheets(options?.sheetId);
      if (!payload.sessions || !payload.tickets || !payload.coursePlan) return;
      onData({
        sessions: payload.sessions,
        tickets: payload.tickets,
        coursePlan: payload.coursePlan,
      });
    } catch (error) {
      if (options?.onError) options.onError(error);
    }
  };

  void run();
  const id = setInterval(run, intervalMs);
  return () => clearInterval(id);
}
