import type { AnalyticsSnapshot, LeadershipInsight } from "../types/dashboardTypes";

function makeInsight(id: string, headline: string, impact: "High" | "Medium" | "Low", recommendation: string): LeadershipInsight {
  return { id, headline, impact, recommendation };
}

export function generateLeadershipInsights(analytics: Omit<AnalyticsSnapshot, "insights">): LeadershipInsight[] {
  const insights: LeadershipInsight[] = [];

  const riskyCourse = analytics.courseHealth
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)[0];

  if (riskyCourse) {
    insights.push(
      makeInsight(
        `course-risk-${riskyCourse.course}`,
        `${riskyCourse.course} health score is ${riskyCourse.courseHealthScore.toFixed(0)} (${riskyCourse.status}).`,
        riskyCourse.status === "At Risk" ? "High" : "Medium",
        `Prioritize targeted intervention for ${riskyCourse.course}: reinforce practice depth and tighten pacing.`
      )
    );
  }

  const sectionTwo = analytics.sectionHealth.find((row) => row.section === "2");
  if (sectionTwo && (sectionTwo.riskScore >= 60 || sectionTwo.rating < 3.8 || sectionTwo.attendance < 75)) {
    insights.push(
      makeInsight(
        "section-2-red-zone",
        `Section 2 is in a red zone: rating ${sectionTwo.rating.toFixed(2)}, attendance ${sectionTwo.attendance.toFixed(1)}%, risk ${sectionTwo.riskScore}.`,
        "High",
        "Deploy a 2-week intervention: faculty pacing calibration, extra problem clinics, and section-specific TA support."
      )
    );
  }

  const ylcSection = analytics.sectionHealth.find((row) => row.section === "YLC");
  if (ylcSection && ylcSection.rating >= 3.45 && ylcSection.attendance >= 66) {
    insights.push(
      makeInsight(
        "ylc-recovery-signal",
        `YLC is showing recovery with rating ${ylcSection.rating.toFixed(2)} and attendance ${ylcSection.attendance.toFixed(1)}%.`,
        "Medium",
        "Sustain momentum with weekly reinforcement clinics and protect the improved slot timings."
      )
    );
  }

  const facultyLow = analytics.facultyHealth.highestRisk[0];
  if (facultyLow) {
    insights.push(
      makeInsight(
        `faculty-risk-${facultyLow.professor}`,
        `${facultyLow.professor} has the highest faculty risk score (${facultyLow.riskScore}).`,
        "High",
        "Run a faculty coaching check-in and pair with TA support for the next two sessions."
      )
    );
  }

  const topImproved = analytics.facultyHealth.mostImproved.filter((row) => row.deltaRating > 0).slice(0, 3);
  if (topImproved.length) {
    insights.push(
      makeInsight(
        "top-faculty-improvements",
        `Top faculty improvements: ${topImproved
          .map((row) => `${row.professor} (${row.deltaRating >= 0 ? "+" : ""}${row.deltaRating.toFixed(2)})`)
          .join(", ")}.`,
        "Medium",
        "Capture these teaching patterns and replicate them across at-risk course-section combinations."
      )
    );
  }

  const ratingPrediction = analytics.trends.predictions.find((p) => p.metric === "rating");
  if (ratingPrediction && ratingPrediction.direction === "down") {
    insights.push(
      makeInsight(
        "prediction-rating-down",
        `Rating trend is declining (slope ${ratingPrediction.slope.toFixed(3)}), next expected rating ${ratingPrediction.predictedNext.toFixed(2)}.`,
        "Medium",
        "Intervene before the next delivery with session redesign and tighter learning outcomes."
      )
    );
  }

  const attendancePrediction = analytics.trends.predictions.find((p) => p.metric === "attendance");
  if (attendancePrediction && attendancePrediction.direction === "down") {
    insights.push(
      makeInsight(
        "prediction-attendance-down",
        `Attendance trend is declining, next expected attendance ${attendancePrediction.predictedNext.toFixed(1)}%.`,
        "Medium",
        "Validate timetable conflicts and communicate session value for upcoming classes."
      )
    );
  }

  if (analytics.ticketMetrics.openCount > 0) {
    const backlogRisk = analytics.ticketMetrics.inSlaBreaches > 0 ? "High" : "Medium";
    insights.push(
      makeInsight(
        "tickets-backlog",
        `Ticket backlog is ${analytics.ticketMetrics.openCount} with ${analytics.ticketMetrics.inSlaBreaches} open SLA breaches.`,
        backlogRisk,
        "Run a daily 10-minute triage for P0/P1 and assign explicit next-update timestamps."
      )
    );
  }

  for (const anomaly of analytics.anomalies.slice(0, 3)) {
    insights.push(
      makeInsight(
        `anomaly-${anomaly.id}`,
        anomaly.title,
        anomaly.severity,
        anomaly.type === "rating_drop"
          ? "Add practice content and a structured recap in the immediate next session."
          : anomaly.type === "attendance_crash"
            ? "Coordinate with operations on scheduling clashes and communication gaps."
            : anomaly.type === "backlog_rise"
              ? "Increase operational bandwidth for ticket resolution this week."
              : anomaly.type === "faculty_repeat_issues"
                ? "Escalate to academic leadership with a focused faculty improvement plan."
                : "Review section support plan and TA engagement cadence."
      )
    );
  }

  if (!insights.find((item) => item.id === "baseline-strength")) {
    insights.push(
      makeInsight(
        "baseline-strength",
        `Current weighted rating is ${analytics.kpis.avgRating.toFixed(2)} with attendance ${analytics.kpis.avgAttendance.toFixed(1)}%.`,
        "Low",
        "Sustain the baseline with weekly course-owner check-ins and rapid feedback loops."
      )
    );
  }

  const fallbackPool: LeadershipInsight[] = [
    makeInsight(
      "fallback-term-progress",
      `Term progress is ${analytics.progress.pct.toFixed(0)}% (${analytics.progress.deliveredCount}/${analytics.progress.plannedTotal}).`,
      "Medium",
      "Review coverage gaps by section and rebalance the session calendar where needed."
    ),
    makeInsight(
      "fallback-ticket-throughput",
      `Weekly ticket throughput is ${analytics.ticketMetrics.created7} created vs ${analytics.ticketMetrics.resolved7} resolved.`,
      "Medium",
      "Maintain throughput parity to prevent operational drag on course delivery."
    ),
    makeInsight(
      "fallback-at-risk-count",
      `${analytics.atRisk.length} at-risk slices are currently flagged in this view.`,
      "Medium",
      "Prioritize high-severity slices first and assign clear owners for each intervention."
    ),
    makeInsight(
      "fallback-faculty-coverage",
      `${analytics.facultyHealth.rows.length} faculty members are active in the selected scope.`,
      "Low",
      "Use faculty-level scorecards to improve consistency across sections."
    ),
  ];

  for (const item of fallbackPool) {
    if (insights.length >= 8) break;
    if (insights.find((existing) => existing.id === item.id)) continue;
    insights.push(item);
    if (insights.length >= 5) break;
  }

  return insights.slice(0, 8);
}
