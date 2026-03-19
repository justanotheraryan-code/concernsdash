import { dashboardConfig } from "../config/dashboardConfig";
import type {
  AnalyticsSnapshot,
  CourseHealthItem,
  CoursePlan,
  FacultyHealthItem,
  KPIBundle,
  ProgressBundle,
  RiskSlice,
  SectionHealthItem,
  Session,
  SliceType,
  Ticket,
  TicketMetrics,
} from "../types/dashboardTypes";
import { clamp, safeAvg, uniq, weightedAvg } from "../utils/aggregationUtils";
import { compact, daysBetween, formatDate, isoToTime } from "../utils/dateUtils";
import { normalizeTo100, percentile } from "../utils/statisticalUtils";
import { detectAcademicAnomalies } from "./anomalyDetection";
import { generateLeadershipInsights } from "./insightGenerator";
import { buildTicketTrendPoints, predictNextSessionMetric, toSessionTrendPoints } from "./trendCalculator";

function deliveredOnly(sessions: Session[]): Session[] {
  return sessions.filter((s) => s.status === "Delivered" && s.ratingAvg !== null && s.attendancePct !== null);
}

function computeRiskScore(input: {
  ratingDrop: number;
  attendanceDrop: number;
  ticketVolume: number;
  commentsSignal: number;
  maxTicketVolume: number;
}): number {
  const ratingDropScore = normalizeTo100(input.ratingDrop, 0, 1.5);
  const attendanceDropScore = normalizeTo100(input.attendanceDrop, 0, 25);
  const ticketVolumeScore = input.maxTicketVolume > 0
    ? normalizeTo100(input.ticketVolume, 0, input.maxTicketVolume)
    : 0;
  const commentsScore = clamp(input.commentsSignal * 100, 0, 100);

  const score =
    ratingDropScore * dashboardConfig.RISK_WEIGHTS.ratingDrop +
    attendanceDropScore * dashboardConfig.RISK_WEIGHTS.attendanceDrop +
    ticketVolumeScore * dashboardConfig.RISK_WEIGHTS.ticketVolume +
    commentsScore * dashboardConfig.RISK_WEIGHTS.commentsSignal;

  return compact(clamp(score, 0, 100), 0);
}

function groupAgg(
  sessions: Session[],
  keyFn: (session: Session) => string,
  type: SliceType
): Array<{
  type: SliceType;
  key: string;
  label: string;
  rating: number;
  attendance: number;
  ratingDelta: number;
  attendanceDelta: number;
  notesSignal: number;
}> {
  const map = new Map<
    string,
    {
      ratingItems: Array<{ value: number; weight: number }>;
      attendanceItems: Array<{ value: number; weight: number }>;
      notesSignal: number;
    }
  >();

  for (const s of sessions) {
    const key = keyFn(s);
    if (!map.has(key)) {
      map.set(key, { ratingItems: [], attendanceItems: [], notesSignal: 0 });
    }

    const row = map.get(key)!;
    if (s.ratingAvg !== null) row.ratingItems.push({ value: s.ratingAvg, weight: Math.max(1, s.responses) });
    if (s.attendancePct !== null) row.attendanceItems.push({ value: s.attendancePct, weight: Math.max(1, s.headcount) });

    const text = `${s.notes || ""} ${(s.comments || []).join(" ")}`.toLowerCase();
    if (/drop|issue|slow|conflict|fatigue|risk/.test(text)) {
      row.notesSignal += 0.2;
    }
  }

  const familyRating = weightedAvg(Array.from(map.values()).flatMap((g) => g.ratingItems));
  const familyAttendance = weightedAvg(Array.from(map.values()).flatMap((g) => g.attendanceItems));

  return Array.from(map.entries()).map(([key, value]) => {
    const rating = weightedAvg(value.ratingItems);
    const attendance = weightedAvg(value.attendanceItems);

    return {
      type,
      key,
      label: key,
      rating,
      attendance,
      ratingDelta: rating - familyRating,
      attendanceDelta: attendance - familyAttendance,
      notesSignal: value.notesSignal,
    };
  });
}

export function calculateKPIs(sessions: Session[]): KPIBundle {
  const delivered = deliveredOnly(sessions);

  const avgRating = weightedAvg(
    delivered.map((s) => ({ value: s.ratingAvg as number, weight: Math.max(1, s.responses) }))
  );

  const avgAttendance = weightedAvg(
    delivered.map((s) => ({ value: s.attendancePct as number, weight: Math.max(1, s.headcount) }))
  );

  return {
    avgRating: compact(avgRating, 2),
    avgAttendance: compact(avgAttendance, 1),
    nSessionsDelivered: sessions.filter((s) => s.status === "Delivered").length,
    nSessionsPlanned: sessions.filter((s) => s.status === "Planned").length,
    responseTotal: delivered.reduce((sum, s) => sum + s.responses, 0),
    lowRating: delivered.filter((s) => (s.ratingAvg as number) < 3.8).length,
    lowAttendance: delivered.filter((s) => (s.attendancePct as number) < 75).length,
  };
}

export function calculateProgress(
  sessions: Session[],
  planRows: CoursePlan[],
  filters: { section: "All" | Session["section"]; course: string; professor: string }
): ProgressBundle {
  const relevantPlan = planRows.filter((row) => {
    const sectionMatch = filters.section === "All" || row.section === filters.section;
    const courseMatch = filters.course === "All" || row.course === filters.course;
    return sectionMatch && courseMatch;
  });

  const plannedTotal = relevantPlan.reduce((sum, row) => sum + row.plannedSessions, 0);

  const deliveredCount = sessions.filter((s) => {
    const sectionMatch = filters.section === "All" || s.section === filters.section;
    const courseMatch = filters.course === "All" || s.course === filters.course;
    const professorMatch = filters.professor === "All" || s.professor === filters.professor;
    return sectionMatch && courseMatch && professorMatch && s.status === "Delivered";
  }).length;

  return {
    plannedTotal,
    deliveredCount,
    pct: compact(clamp(plannedTotal ? (deliveredCount / plannedTotal) * 100 : 0, 0, 100), 0),
  };
}

export function calculateTrends(sessions: Session[], tickets: Ticket[]) {
  const delivered = deliveredOnly(sessions);
  const sessionTrend = toSessionTrendPoints(delivered);
  const ticketTrend = buildTicketTrendPoints(tickets);

  const predictions = [
    predictNextSessionMetric(sessionTrend, "rating"),
    predictNextSessionMetric(sessionTrend, "attendance"),
  ];

  return {
    sessions: sessionTrend,
    tickets: ticketTrend,
    predictions,
  };
}

export function calculateSectionHealth(sessions: Session[], tickets: Ticket[]): SectionHealthItem[] {
  const delivered = deliveredOnly(sessions);
  const sections: Session["section"][] = ["1", "2", "3", "4", "YLC"];
  const maxTicketVolume = Math.max(1, ...sections.map((section) => tickets.filter((t) => t.section === section).length));

  return sections.map((section) => {
    const rows = delivered.filter((s) => s.section === section);
    const rating = weightedAvg(rows.map((s) => ({ value: s.ratingAvg as number, weight: Math.max(1, s.responses) })));
    const attendance = weightedAvg(rows.map((s) => ({ value: s.attendancePct as number, weight: Math.max(1, s.headcount) })));
    const ticketVolume = tickets.filter((t) => t.section === section).length;

    const riskScore = computeRiskScore({
      ratingDrop: Math.max(0, 4.1 - rating),
      attendanceDrop: Math.max(0, 85 - attendance),
      ticketVolume,
      commentsSignal: 0,
      maxTicketVolume,
    });

    return {
      section,
      rating: compact(rating, 2),
      attendance: compact(attendance, 1),
      sessions: rows.length,
      riskScore,
    };
  });
}

export function calculateCourseHealth(sessions: Session[], tickets: Ticket[]): CourseHealthItem[] {
  const delivered = deliveredOnly(sessions);
  const courses = uniq(delivered.map((s) => s.course)).sort();

  const ticketCountByCourse = new Map<string, number>();
  for (const ticket of tickets) {
    const key = ticket.course || "";
    if (!key) continue;
    ticketCountByCourse.set(key, (ticketCountByCourse.get(key) || 0) + 1);
  }

  const maxTicketVolume = Math.max(1, ...courses.map((c) => ticketCountByCourse.get(c) || 0));

  return courses.map((course) => {
    const rows = delivered.filter((s) => s.course === course);

    const rating = weightedAvg(rows.map((s) => ({ value: s.ratingAvg as number, weight: Math.max(1, s.responses) })));
    const attendance = weightedAvg(rows.map((s) => ({ value: s.attendancePct as number, weight: Math.max(1, s.headcount) })));
    const ticketVolume = ticketCountByCourse.get(course) || 0;

    const ratingScore = normalizeTo100(rating, 0, 5);
    const attendanceScore = clamp(attendance, 0, 100);
    const operationalScore = 100 - normalizeTo100(ticketVolume, 0, maxTicketVolume);

    const courseHealthScore =
      ratingScore * dashboardConfig.COURSE_HEALTH_WEIGHTS.rating +
      attendanceScore * dashboardConfig.COURSE_HEALTH_WEIGHTS.attendance +
      operationalScore * dashboardConfig.COURSE_HEALTH_WEIGHTS.operational;

    const status = courseHealthScore >= 80 ? "Green" : courseHealthScore >= 65 ? "Watch" : "At Risk";

    const notesSignal = safeAvg(rows.map((r) => (r.notes && /drop|issue|slow|risk/i.test(r.notes) ? 0.5 : 0)));
    const riskScore = computeRiskScore({
      ratingDrop: Math.max(0, 4.1 - rating),
      attendanceDrop: Math.max(0, 85 - attendance),
      ticketVolume,
      commentsSignal: notesSignal,
      maxTicketVolume,
    });

    return {
      course,
      rating: compact(rating, 2),
      attendance: compact(attendance, 1),
      ticketVolume,
      courseHealthScore: compact(courseHealthScore, 0),
      status,
      riskScore,
    };
  });
}

export function calculateFacultyHealth(sessions: Session[], tickets: Ticket[]) {
  const delivered = deliveredOnly(sessions);
  const professors = uniq(delivered.map((s) => s.professor)).sort();
  const maxTicketVolume = Math.max(1, ...professors.map((p) => tickets.filter((t) => t.professor === p).length));

  const rows: FacultyHealthItem[] = professors.map((professor) => {
    const sessionsForProfessor = delivered
      .filter((s) => s.professor === professor)
      .sort((a, b) => isoToTime(a.dateISO) - isoToTime(b.dateISO));

    const rating = weightedAvg(
      sessionsForProfessor.map((s) => ({ value: s.ratingAvg as number, weight: Math.max(1, s.responses) }))
    );

    const attendance = weightedAvg(
      sessionsForProfessor.map((s) => ({ value: s.attendancePct as number, weight: Math.max(1, s.headcount) }))
    );

    const ticketComplaints = tickets.filter((t) => t.professor === professor).length;

    const first = sessionsForProfessor[0]?.ratingAvg ?? rating;
    const last = sessionsForProfessor[sessionsForProfessor.length - 1]?.ratingAvg ?? rating;
    const deltaRating = compact((last || 0) - (first || 0), 2);

    const notesSignal = safeAvg(
      sessionsForProfessor.map((r) => (r.notes && /drop|issue|slow|risk/i.test(r.notes) ? 0.6 : 0))
    );

    const riskScore = computeRiskScore({
      ratingDrop: Math.max(0, 4.1 - rating),
      attendanceDrop: Math.max(0, 85 - attendance),
      ticketVolume: ticketComplaints,
      commentsSignal: notesSignal,
      maxTicketVolume,
    });

    return {
      professor,
      rating: compact(rating, 2),
      attendance: compact(attendance, 1),
      sessionsDelivered: sessionsForProfessor.length,
      ticketComplaints,
      riskScore,
      deltaRating,
    };
  });

  return {
    rows,
    bestRated: rows.slice().sort((a, b) => b.rating - a.rating).slice(0, 5),
    mostImproved: rows.slice().sort((a, b) => b.deltaRating - a.deltaRating).slice(0, 5),
    highestRisk: rows.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, 5),
  };
}

export function calculateTicketMetrics(tickets: Ticket[]): TicketMetrics {
  const open = tickets.filter((t) => t.status === "Open" || t.status === "In Progress");
  const closed = tickets.filter((t) => (t.status === "Resolved" || t.status === "Closed") && t.resolvedISO);

  const maxISO = tickets.length
    ? tickets.map((t) => t.resolvedISO || t.createdISO).sort((a, b) => isoToTime(b) - isoToTime(a))[0]
    : "2026-01-01";

  const resolutionHours = closed.map((t) => daysBetween(t.createdISO, t.resolvedISO as string) * 24);
  const avgHours = safeAvg(resolutionHours);
  const p50Hours = percentile(resolutionHours, 0.5);
  const p90Hours = percentile(resolutionHours, 0.9);

  const resolvedBreaches = closed.filter(
    (t) => daysBetween(t.createdISO, t.resolvedISO as string) * 24 > t.slaHours
  ).length;

  const openBreaches = open.filter((t) => daysBetween(t.createdISO, maxISO) * 24 > t.slaHours).length;

  const maxTime = isoToTime(maxISO);
  const min7 = maxTime - 7 * 24 * 60 * 60 * 1000;

  const created7 = tickets.filter((t) => isoToTime(t.createdISO) >= min7).length;
  const resolved7 = tickets.filter(
    (t) => (t.status === "Resolved" || t.status === "Closed") && t.resolvedISO && isoToTime(t.resolvedISO) >= min7
  ).length;

  const byCategory = new Map<string, number>();
  for (const ticket of open) {
    byCategory.set(ticket.category, (byCategory.get(ticket.category) || 0) + 1);
  }

  const topCats = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return {
    openCount: open.length,
    inSlaBreaches: openBreaches,
    resolvedBreaches,
    avgHours,
    p50Hours,
    p90Hours,
    created7,
    resolved7,
    maxISO,
    topCats,
    open,
    closed,
  };
}

export function calculateAtRiskSlices(sessions: Session[], tickets: Ticket[]): RiskSlice[] {
  const delivered = deliveredOnly(sessions);
  if (!delivered.length) return [];

  const overallRating = weightedAvg(
    delivered.map((s) => ({ value: s.ratingAvg as number, weight: Math.max(1, s.responses) }))
  );

  const overallAttendance = weightedAvg(
    delivered.map((s) => ({ value: s.attendancePct as number, weight: Math.max(1, s.headcount) }))
  );

  const courseGroups = groupAgg(delivered, (s) => s.course, "Course");
  const professorGroups = groupAgg(delivered, (s) => s.professor, "Professor");
  const sectionGroups = groupAgg(delivered, (s) => s.section, "Section");
  const pairGroups = groupAgg(delivered, (s) => `${s.course} - ${s.professor}`, "CoursexProfessor");

  const all = [...courseGroups, ...professorGroups, ...sectionGroups, ...pairGroups];
  const maxTicketVolume = Math.max(
    1,
    ...all.map((group) => {
      if (group.type === "Course") return tickets.filter((t) => t.course === group.label).length;
      if (group.type === "Professor") return tickets.filter((t) => t.professor === group.label).length;
      if (group.type === "Section") return tickets.filter((t) => t.section === group.label).length;
      return 0;
    })
  );

  const risk: RiskSlice[] = [];

  for (const group of all) {
    const ticketVolume =
      group.type === "Course"
        ? tickets.filter((t) => t.course === group.label).length
        : group.type === "Professor"
          ? tickets.filter((t) => t.professor === group.label).length
          : group.type === "Section"
            ? tickets.filter((t) => t.section === group.label).length
            : 0;

    if (group.rating < 3.8 || group.ratingDelta < -0.25) {
      const riskScore = computeRiskScore({
        ratingDrop: Math.max(0, overallRating - group.rating),
        attendanceDrop: Math.max(0, overallAttendance - group.attendance),
        ticketVolume,
        commentsSignal: group.notesSignal,
        maxTicketVolume,
      });

      const severity = riskScore >= 70 ? "High" : riskScore >= 45 ? "Medium" : "Low";

      risk.push({
        key: `${group.type}:${group.key}:rating`,
        sliceType: group.type,
        label: group.label,
        metric: "Rating",
        current: group.rating,
        baseline: overallRating,
        delta: group.ratingDelta,
        severity,
        riskScore,
        hint:
          group.type === "Professor"
            ? "Check pedagogy fit, pace, and practice depth."
            : group.type === "Course"
              ? "Review curriculum depth and sequencing."
              : group.type === "Section"
                ? "Validate timetable and cohort engagement drivers."
                : "Review course-professor pairing and structure.",
      });
    }

    if (group.attendance < 75 || group.attendanceDelta < -6) {
      const riskScore = computeRiskScore({
        ratingDrop: Math.max(0, overallRating - group.rating),
        attendanceDrop: Math.max(0, overallAttendance - group.attendance),
        ticketVolume,
        commentsSignal: group.notesSignal,
        maxTicketVolume,
      });

      const severity = riskScore >= 70 ? "High" : riskScore >= 45 ? "Medium" : "Low";

      risk.push({
        key: `${group.type}:${group.key}:attendance`,
        sliceType: group.type,
        label: group.label,
        metric: "Attendance",
        current: group.attendance,
        baseline: overallAttendance,
        delta: group.attendanceDelta,
        severity,
        riskScore,
        hint:
          group.type === "Section"
            ? "Check timetable clashes and assignment load."
            : group.type === "Professor"
              ? "Improve perceived in-class value and pacing."
              : group.type === "Course"
                ? "Improve course outcome clarity and relevance."
                : "Validate this faculty-slot-course combination.",
      });
    }
  }

  return risk
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 18);
}

export function buildAnalyticsSnapshot(input: {
  sessions: Session[];
  tickets: Ticket[];
  plan: CoursePlan[];
  filters: { section: "All" | Session["section"]; course: string; professor: string };
}): AnalyticsSnapshot {
  const kpis = calculateKPIs(input.sessions);
  const progress = calculateProgress(input.sessions, input.plan, input.filters);
  const trends = calculateTrends(input.sessions, input.tickets);
  const sectionHealth = calculateSectionHealth(input.sessions, input.tickets);
  const courseHealth = calculateCourseHealth(input.sessions, input.tickets);
  const facultyHealth = calculateFacultyHealth(input.sessions, input.tickets);
  const ticketMetrics = calculateTicketMetrics(input.tickets);
  const atRisk = calculateAtRiskSlices(input.sessions, input.tickets);
  const anomalies = detectAcademicAnomalies({ sessions: input.sessions, tickets: input.tickets });

  const partial = {
    kpis,
    progress,
    trends,
    sectionHealth,
    courseHealth,
    facultyHealth,
    ticketMetrics,
    atRisk,
    anomalies,
  };

  const insights = generateLeadershipInsights(partial);

  return {
    ...partial,
    insights,
  };
}

export function scoreToBadge(score: number) {
  if (score >= 4.2) return { label: "Great", variant: "default" as const };
  if (score >= 3.8) return { label: "Ok", variant: "secondary" as const };
  return { label: "At-risk", variant: "destructive" as const };
}

export function pctToBadge(pct: number) {
  if (pct >= 85) return { label: "Healthy", variant: "default" as const };
  if (pct >= 75) return { label: "Watch", variant: "secondary" as const };
  return { label: "At-risk", variant: "destructive" as const };
}

export function statusBadge(status: Session["status"]) {
  if (status === "Delivered") return { text: "Delivered", variant: "default" as const };
  if (status === "Planned") return { text: "Planned", variant: "secondary" as const };
  return { text: "Cancelled", variant: "outline" as const };
}

export function ticketStatusBadge(status: Ticket["status"]) {
  if (status === "Open") return { text: "Open", variant: "destructive" as const };
  if (status === "In Progress") return { text: "In Progress", variant: "secondary" as const };
  if (status === "Resolved") return { text: "Resolved", variant: "default" as const };
  return { text: "Closed", variant: "outline" as const };
}

export function priorityBadge(priority: Ticket["priority"]) {
  if (priority === "P0") return { label: "P0", variant: "destructive" as const };
  if (priority === "P1") return { label: "P1", variant: "secondary" as const };
  if (priority === "P2") return { label: "P2", variant: "outline" as const };
  return { label: "P3", variant: "outline" as const };
}

export function topAndBottomCourses(courseHealth: CourseHealthItem[]) {
  const sorted = [...courseHealth].sort((a, b) => b.rating - a.rating);
  return {
    best: sorted.slice(0, 3),
    worst: sorted.slice(-3).reverse(),
  };
}

export function ticketSummaryFromMetrics(metrics: TicketMetrics) {
  const topCatText = metrics.topCats.length
    ? metrics.topCats.map(([category, count]) => `${category} (${count})`).join(", ")
    : "No open categories";

  const breachText = (metrics.inSlaBreaches + metrics.resolvedBreaches) > 0
    ? `SLA risk: ${metrics.inSlaBreaches} open breaches, ${metrics.resolvedBreaches} resolved late.`
    : "SLA health looks good in current view.";

  const throughputText = `Last 7 days: ${metrics.created7} created, ${metrics.resolved7} resolved.`;

  const speedText = metrics.closed.length
    ? `Resolution speed: avg ${compact(metrics.avgHours, 0)}h (p50 ${compact(metrics.p50Hours, 0)}h, p90 ${compact(metrics.p90Hours, 0)}h).`
    : "No resolved tickets in current view to compute resolution speed.";

  return {
    headline:
      metrics.openCount > 0
        ? `Backlog is ${metrics.openCount} ticket${metrics.openCount === 1 ? "" : "s"}.`
        : "No open tickets in current view.",
    body: [`Open drivers: ${topCatText}.`, breachText, throughputText, speedText],
    actions: [
      "Triage P0/P1 in a daily 10-minute standup.",
      "Assign clear owner + next update time for each open ticket.",
      "If content tickets repeat, standardize recap pack checklists.",
    ],
  };
}

export function buildCourseSectionMatrix(sessions: Session[]) {
  const delivered = deliveredOnly(sessions);
  const courses = uniq(delivered.map((s) => s.course)).sort();
  const sectionList: Session["section"][] = ["1", "2", "3", "4", "YLC"];

  return courses.map((course) => {
    const row: Record<string, string | number | null> = { course };

    for (const section of sectionList) {
      const rows = delivered.filter((s) => s.course === course && s.section === section);
      const rating = weightedAvg(rows.map((s) => ({ value: s.ratingAvg as number, weight: Math.max(1, s.responses) })));
      const attendance = weightedAvg(rows.map((s) => ({ value: s.attendancePct as number, weight: Math.max(1, s.headcount) })));

      row[`${section}_rating`] = rows.length ? compact(rating, 2) : null;
      row[`${section}_att`] = rows.length ? compact(attendance, 1) : null;
    }

    return row;
  });
}

export function visibleSessionsSlice(sessions: Session[], visibleCount: number) {
  return sessions.slice(0, visibleCount);
}

export function formatTrendDate(iso: string) {
  return formatDate(iso);
}
