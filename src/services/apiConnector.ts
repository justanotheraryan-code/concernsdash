import { dashboardConfig } from "../config/dashboardConfig";
import type { CoursePlan, Session, Ticket } from "../types/dashboardTypes";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${dashboardConfig.API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchSessionsFromApi(): Promise<Session[]> {
  return fetchJson<Session[]>("/sessions");
}

export async function fetchTicketsFromApi(): Promise<Ticket[]> {
  return fetchJson<Ticket[]>("/tickets");
}

export async function fetchPlanFromApi(): Promise<CoursePlan[]> {
  return fetchJson<CoursePlan[]>("/plan");
}
