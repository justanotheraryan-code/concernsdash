import type { Session, Ticket, TicketTrendPoint, TrendPoint } from "../types/dashboardTypes";
import { weightedAvg } from "../utils/aggregationUtils";
import { formatDate, isoToTime } from "../utils/dateUtils";
import { linearTrendSlope } from "../utils/statisticalUtils";

export function toSessionTrendPoints(delivered: Session[]): TrendPoint[] {
  const byDate = new Map<
    string,
    {
      ratingItems: Array<{ value: number; weight: number }>;
      attendanceItems: Array<{ value: number; weight: number }>;
    }
  >();

  for (const row of delivered) {
    if (!byDate.has(row.dateISO)) {
      byDate.set(row.dateISO, { ratingItems: [], attendanceItems: [] });
    }
    const acc = byDate.get(row.dateISO)!;

    if (row.ratingAvg !== null) {
      acc.ratingItems.push({ value: row.ratingAvg, weight: Math.max(1, row.responses) });
    }

    if (row.attendancePct !== null) {
      acc.attendanceItems.push({ value: row.attendancePct, weight: Math.max(1, row.headcount) });
    }
  }

  return Array.from(byDate.entries())
    .map(([dateISO, values]) => ({
      dateISO,
      date: formatDate(dateISO),
      rating: Number(weightedAvg(values.ratingItems).toFixed(2)),
      attendance: Number(weightedAvg(values.attendanceItems).toFixed(1)),
    }))
    .sort((a, b) => isoToTime(a.dateISO) - isoToTime(b.dateISO));
}

export function buildTicketTrendPoints(tickets: Ticket[]): TicketTrendPoint[] {
  const created = new Map<string, number>();
  const resolved = new Map<string, number>();

  for (const ticket of tickets) {
    created.set(ticket.createdISO, (created.get(ticket.createdISO) || 0) + 1);
    if ((ticket.status === "Resolved" || ticket.status === "Closed") && ticket.resolvedISO) {
      resolved.set(ticket.resolvedISO, (resolved.get(ticket.resolvedISO) || 0) + 1);
    }
  }

  const dates = Array.from(new Set([...created.keys(), ...resolved.keys()])).sort(
    (a, b) => isoToTime(a) - isoToTime(b)
  );

  let backlog = 0;
  return dates.map((d) => {
    const createdCount = created.get(d) || 0;
    const resolvedCount = resolved.get(d) || 0;
    backlog = Math.max(0, backlog + createdCount - resolvedCount);

    return {
      dateISO: d,
      date: formatDate(d),
      created: createdCount,
      resolved: resolvedCount,
      backlog,
    };
  });
}

export function predictNextSessionMetric(points: TrendPoint[], metric: "rating" | "attendance") {
  const values = points.map((p) => p[metric]);
  const slope = linearTrendSlope(values);
  const lastValue = values.length ? values[values.length - 1] : 0;
  const predictedNext = Number((lastValue + slope).toFixed(metric === "rating" ? 2 : 1));

  return {
    metric,
    slope,
    predictedNext,
    direction: slope > 0.03 ? "up" : slope < -0.03 ? "down" : "flat",
  } as const;
}
