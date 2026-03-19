import { dashboardConfig } from "../config/dashboardConfig";
import type { AnomalyAlert, SectionId, Session, Ticket } from "../types/dashboardTypes";
import { safeAvg } from "../utils/aggregationUtils";
import { isoToTime } from "../utils/dateUtils";
import { buildTicketTrendPoints } from "./trendCalculator";

function severityFromDelta(delta: number, medium: number, high: number): "Low" | "Medium" | "High" {
  const abs = Math.abs(delta);
  if (abs >= high) return "High";
  if (abs >= medium) return "Medium";
  return "Low";
}

export function detectAcademicAnomalies(input: {
  sessions: Session[];
  tickets: Ticket[];
}): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const delivered = input.sessions
    .filter((s) => s.status === "Delivered")
    .sort((a, b) => isoToTime(a.dateISO) - isoToTime(b.dateISO));

  const grouped = new Map<string, Session[]>();
  for (const row of delivered) {
    const key = `${row.course}|${row.section}|${row.professor}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  for (const [key, rows] of grouped.entries()) {
    for (let i = 1; i < rows.length; i += 1) {
      const prev = rows[i - 1];
      const curr = rows[i];

      if (prev.ratingAvg !== null && curr.ratingAvg !== null) {
        const drop = prev.ratingAvg - curr.ratingAvg;
        if (drop > dashboardConfig.TREND_THRESHOLDS.ratingDrop) {
          alerts.push({
            id: `anomaly-rating-${key}-${curr.id}`,
            type: "rating_drop",
            severity: severityFromDelta(drop, 0.4, 0.7),
            title: `${curr.course} rating dropped sharply`,
            detail: `${curr.professor} in Section ${curr.section} dropped by ${drop.toFixed(2)} points.`,
            relatedCourse: curr.course,
            relatedProfessor: curr.professor,
            relatedSection: curr.section,
            metricValue: drop,
            threshold: dashboardConfig.TREND_THRESHOLDS.ratingDrop,
          });
        }
      }

      if (prev.attendancePct !== null && curr.attendancePct !== null) {
        const drop = prev.attendancePct - curr.attendancePct;
        if (drop > dashboardConfig.TREND_THRESHOLDS.attendanceCrash) {
          alerts.push({
            id: `anomaly-att-${key}-${curr.id}`,
            type: "attendance_crash",
            severity: severityFromDelta(drop, 10, 15),
            title: `${curr.course} attendance crashed`,
            detail: `Section ${curr.section} attendance dropped ${drop.toFixed(1)} points for ${curr.professor}.`,
            relatedCourse: curr.course,
            relatedProfessor: curr.professor,
            relatedSection: curr.section,
            metricValue: drop,
            threshold: dashboardConfig.TREND_THRESHOLDS.attendanceCrash,
          });
        }
      }
    }
  }

  const ticketTrend = buildTicketTrendPoints(input.tickets);
  if (ticketTrend.length >= 8) {
    const split = Math.floor(ticketTrend.length / 2);
    const oldBacklog = safeAvg(ticketTrend.slice(0, split).map((p) => p.backlog));
    const newBacklog = safeAvg(ticketTrend.slice(split).map((p) => p.backlog));
    const risePct = oldBacklog > 0 ? ((newBacklog - oldBacklog) / oldBacklog) * 100 : newBacklog > 0 ? 100 : 0;

    if (risePct >= dashboardConfig.TREND_THRESHOLDS.backlogRisePct) {
      alerts.push({
        id: "anomaly-backlog-rise",
        type: "backlog_rise",
        severity: risePct >= 40 ? "High" : "Medium",
        title: "Ticket backlog is rising",
        detail: `Backlog increased by ${risePct.toFixed(0)}% over the recent window.`,
        metricValue: Number(risePct.toFixed(1)),
        threshold: dashboardConfig.TREND_THRESHOLDS.backlogRisePct,
      });
    }
  }

  const facultyIssueCounts = new Map<string, number>();
  for (const ticket of input.tickets) {
    if (!ticket.professor) continue;
    if (ticket.category !== "Faculty") continue;
    const isOpen = ticket.status === "Open" || ticket.status === "In Progress";
    if (!isOpen) continue;
    facultyIssueCounts.set(ticket.professor, (facultyIssueCounts.get(ticket.professor) || 0) + 1);
  }

  for (const [professor, count] of facultyIssueCounts.entries()) {
    if (count < 2) continue;
    alerts.push({
      id: `anomaly-faculty-repeat-${professor}`,
      type: "faculty_repeat_issues",
      severity: count >= 3 ? "High" : "Medium",
      title: `Repeated faculty issues for ${professor}`,
      detail: `${count} open faculty-related issues are currently active.`,
      relatedProfessor: professor,
      metricValue: count,
      threshold: 2,
    });
  }

  const sections: SectionId[] = ["1", "2", "3", "4", "YLC"];
  for (const section of sections) {
    const rows = delivered.filter((s) => s.section === section);
    if (rows.length < 3) continue;

    const avgRating = safeAvg(rows.map((r) => r.ratingAvg ?? 0));
    const avgAttendance = safeAvg(rows.map((r) => r.attendancePct ?? 0));

    if (avgRating < 3.8 || avgAttendance < 75) {
      alerts.push({
        id: `anomaly-section-${section}`,
        type: "section_underperforming",
        severity: avgRating < 3.6 || avgAttendance < 70 ? "High" : "Medium",
        title: `Section ${section} is consistently underperforming`,
        detail: `Average rating ${avgRating.toFixed(2)} and attendance ${avgAttendance.toFixed(1)}%.`,
        relatedSection: section,
      });
    }
  }

  return alerts.slice(0, 20);
}
