import { dashboardConfig } from "../config/dashboardConfig";
import { coursePlan as mockPlan } from "../data/plan";
import { sessions as mockSessions } from "../data/sessions";
import { tickets as mockTickets } from "../data/tickets";
import type { CoursePlan, DataProviderContext, Session, Ticket } from "../types/dashboardTypes";
import {
  getPersistedPlan,
  getPersistedSessions,
  getPersistedTickets,
  setPersistedPlan,
  setPersistedSessions,
  setPersistedTickets,
} from "./dataPersistence";
import { fetchPlanFromApi, fetchSessionsFromApi, fetchTicketsFromApi } from "../services/apiConnector";
import { loadFromGoogleSheets, startGoogleSheetsAutoRefresh } from "../services/googleSheetsConnector";

function filterByScope<T extends { program?: string; term?: string }>(rows: T[], context?: DataProviderContext): T[] {
  if (!context?.program && !context?.term) return rows;

  return rows.filter((row) => {
    const programMatch = context.program ? !row.program || row.program === context.program : true;
    const termMatch = context.term ? !row.term || row.term === context.term : true;
    return programMatch && termMatch;
  });
}

function mergeByKey<T>(base: T[], persisted: T[], keyFn: (row: T, index: number) => string): T[] {
  const map = new Map<string, T>();

  base.forEach((row, idx) => {
    map.set(keyFn(row, idx), row);
  });

  persisted.forEach((row, idx) => {
    map.set(keyFn(row, idx), row);
  });

  return Array.from(map.values());
}

function persistedOrMockSessions(): Session[] {
  const persisted = getPersistedSessions();
  return mergeByKey(mockSessions, persisted, (row) => row.id);
}

function persistedOrMockTickets(): Ticket[] {
  const persisted = getPersistedTickets();
  return mergeByKey(mockTickets, persisted, (row) => row.id);
}

function persistedOrMockPlan(): CoursePlan[] {
  const persisted = getPersistedPlan();
  return mergeByKey(
    mockPlan,
    persisted,
    (row, idx) => row.id || `${row.program || "PGP"}|${row.term || "Term"}|${row.course}|${row.section}|${idx}`
  );
}

export async function getSessions(context?: DataProviderContext): Promise<Session[]> {
  const source = dashboardConfig.DATA_SOURCE;

  if (source === "mock" || source === "csv") {
    return filterByScope(persistedOrMockSessions(), context);
  }

  if (source === "googleSheets") {
    const payload = await loadFromGoogleSheets();
    const rows = payload.sessions || [];
    if (rows.length) setPersistedSessions(rows);
    return filterByScope(rows.length ? rows : persistedOrMockSessions(), context);
  }

  const apiRows = await fetchSessionsFromApi();
  if (apiRows.length) setPersistedSessions(apiRows);
  return filterByScope(apiRows.length ? apiRows : persistedOrMockSessions(), context);
}

export async function getTickets(context?: DataProviderContext): Promise<Ticket[]> {
  const source = dashboardConfig.DATA_SOURCE;

  if (source === "mock" || source === "csv") {
    return filterByScope(persistedOrMockTickets(), context);
  }

  if (source === "googleSheets") {
    const payload = await loadFromGoogleSheets();
    const rows = payload.tickets || [];
    if (rows.length) setPersistedTickets(rows);
    return filterByScope(rows.length ? rows : persistedOrMockTickets(), context);
  }

  const apiRows = await fetchTicketsFromApi();
  if (apiRows.length) setPersistedTickets(apiRows);
  return filterByScope(apiRows.length ? apiRows : persistedOrMockTickets(), context);
}

export async function getPlan(context?: DataProviderContext): Promise<CoursePlan[]> {
  const source = dashboardConfig.DATA_SOURCE;

  if (source === "mock" || source === "csv") {
    return filterByScope(persistedOrMockPlan(), context);
  }

  if (source === "googleSheets") {
    const payload = await loadFromGoogleSheets();
    const rows = payload.coursePlan || [];
    if (rows.length) setPersistedPlan(rows);
    return filterByScope(rows.length ? rows : persistedOrMockPlan(), context);
  }

  const apiRows = await fetchPlanFromApi();
  if (apiRows.length) setPersistedPlan(apiRows);
  return filterByScope(apiRows.length ? apiRows : persistedOrMockPlan(), context);
}

export async function getDashboardData(context?: DataProviderContext): Promise<{
  sessions: Session[];
  tickets: Ticket[];
  plan: CoursePlan[];
}> {
  const [sessions, tickets, plan] = await Promise.all([
    getSessions(context),
    getTickets(context),
    getPlan(context),
  ]);

  return { sessions, tickets, plan };
}

export function startLiveDataRefresh(
  onData: (payload: { sessions: Session[]; tickets: Ticket[]; plan: CoursePlan[] }) => void,
  onError?: (error: unknown) => void
): (() => void) | null {
  if (dashboardConfig.DATA_SOURCE !== "googleSheets") return null;

  return startGoogleSheetsAutoRefresh(
    (payload) => {
      setPersistedSessions(payload.sessions);
      setPersistedTickets(payload.tickets);
      setPersistedPlan(payload.coursePlan);
      onData({ sessions: payload.sessions, tickets: payload.tickets, plan: payload.coursePlan });
    },
    { onError }
  );
}
