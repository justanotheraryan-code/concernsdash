import { STORAGE_KEYS } from "../config/dashboardConfig";
import type { CoursePlan, DirectorActionItem, Session, Ticket } from "../types/dashboardTypes";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getPersistedSessions(): Session[] {
  return readJson<Session[]>(STORAGE_KEYS.sessions, []);
}

export function getPersistedTickets(): Ticket[] {
  return readJson<Ticket[]>(STORAGE_KEYS.tickets, []);
}

export function getPersistedPlan(): CoursePlan[] {
  return readJson<CoursePlan[]>(STORAGE_KEYS.plan, []);
}

export function getPersistedActions(): DirectorActionItem[] {
  return readJson<DirectorActionItem[]>(STORAGE_KEYS.actions, []);
}

export function setPersistedSessions(value: Session[]): void {
  writeJson(STORAGE_KEYS.sessions, value);
}

export function setPersistedTickets(value: Ticket[]): void {
  writeJson(STORAGE_KEYS.tickets, value);
}

export function setPersistedPlan(value: CoursePlan[]): void {
  writeJson(STORAGE_KEYS.plan, value);
}

export function setPersistedActions(value: DirectorActionItem[]): void {
  writeJson(STORAGE_KEYS.actions, value);
}

export function addSession(session: Session): Session[] {
  const next = [...getPersistedSessions(), session];
  setPersistedSessions(next);
  return next;
}

export function updateSession(sessionId: string, updates: Partial<Session>): Session[] {
  const next = getPersistedSessions().map((session) =>
    session.id === sessionId ? { ...session, ...updates } : session
  );
  setPersistedSessions(next);
  return next;
}

export function deleteSession(sessionId: string): Session[] {
  const next = getPersistedSessions().filter((session) => session.id !== sessionId);
  setPersistedSessions(next);
  return next;
}

export function addTicket(ticket: Ticket): Ticket[] {
  const next = [...getPersistedTickets(), ticket];
  setPersistedTickets(next);
  return next;
}

export function updateTicket(ticketId: string, updates: Partial<Ticket>): Ticket[] {
  const next = getPersistedTickets().map((ticket) =>
    ticket.id === ticketId ? { ...ticket, ...updates } : ticket
  );
  setPersistedTickets(next);
  return next;
}

export function deleteTicket(ticketId: string): Ticket[] {
  const next = getPersistedTickets().filter((ticket) => ticket.id !== ticketId);
  setPersistedTickets(next);
  return next;
}

export function addPlan(planRow: CoursePlan): CoursePlan[] {
  const next = [...getPersistedPlan(), planRow];
  setPersistedPlan(next);
  return next;
}

export function updatePlan(planKey: string, updates: Partial<CoursePlan>): CoursePlan[] {
  const next = getPersistedPlan().map((row, idx) => {
    const key = row.id || `${row.course}|${row.section}|${idx}`;
    return key === planKey ? { ...row, ...updates } : row;
  });
  setPersistedPlan(next);
  return next;
}

export function deletePlan(planKey: string): CoursePlan[] {
  const next = getPersistedPlan().filter((row, idx) => {
    const key = row.id || `${row.course}|${row.section}|${idx}`;
    return key !== planKey;
  });
  setPersistedPlan(next);
  return next;
}

export function addAction(item: DirectorActionItem): DirectorActionItem[] {
  const next = [...getPersistedActions(), item];
  setPersistedActions(next);
  return next;
}

export function updateAction(actionId: string, updates: Partial<DirectorActionItem>): DirectorActionItem[] {
  const next = getPersistedActions().map((row) => (row.id === actionId ? { ...row, ...updates } : row));
  setPersistedActions(next);
  return next;
}
