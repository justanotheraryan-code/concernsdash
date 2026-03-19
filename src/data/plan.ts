import type { CoursePlan } from "../types/dashboardTypes";

const term3Plan: CoursePlan[] = [
  { program: "PGP", term: "Term 3", course: "Management Strategy", section: "1", plannedSessions: 8 },
  { program: "PGP", term: "Term 3", course: "Management Strategy", section: "2", plannedSessions: 8 },
  { program: "PGP", term: "Term 3", course: "Management Strategy", section: "3", plannedSessions: 8 },
  { program: "PGP", term: "Term 3", course: "Management Strategy", section: "4", plannedSessions: 8 },
  { program: "PGP", term: "Term 3", course: "Management Strategy", section: "YLC", plannedSessions: 6 },
  { program: "PGP", term: "Term 3", course: "Corporate Finance", section: "1", plannedSessions: 6 },
  { program: "PGP", term: "Term 3", course: "Corporate Finance", section: "2", plannedSessions: 6 },
  { program: "PGP", term: "Term 3", course: "Corporate Finance", section: "3", plannedSessions: 6 },
  { program: "PGP", term: "Term 3", course: "Corporate Finance", section: "4", plannedSessions: 6 },
  { program: "PGP", term: "Term 3", course: "Corporate Finance", section: "YLC", plannedSessions: 4 },
  { program: "PGP", term: "Term 3", course: "Before Zero to One", section: "1", plannedSessions: 5 },
  { program: "PGP", term: "Term 3", course: "Before Zero to One", section: "2", plannedSessions: 5 },
  { program: "PGP", term: "Term 3", course: "Before Zero to One", section: "3", plannedSessions: 5 },
  { program: "PGP", term: "Term 3", course: "Before Zero to One", section: "4", plannedSessions: 5 },
  { program: "PGP", term: "Term 3", course: "Before Zero to One", section: "YLC", plannedSessions: 4 },
];

const term4Plan: CoursePlan[] = [
  { program: "PGP", term: "Term 4", course: "Building Strategies with Generative AI", section: "1", plannedSessions: 5 },
  { program: "PGP", term: "Term 4", course: "CEP - Accountability & Mentorship", section: "1", plannedSessions: 3 },
  { program: "PGP", term: "Term 4", course: "Leadership Lessons By CXOs", section: "1", plannedSessions: 7 },
  { program: "PGP", term: "Term 4", course: "Operations Management", section: "1", plannedSessions: 12 },
  { program: "PGP", term: "Term 4", course: "Product Growth", section: "2", plannedSessions: 9 },
  { program: "PGP", term: "Term 4", course: "Investment Banking and Valuation", section: "1", plannedSessions: 16 },
  { program: "PGP", term: "Term 4", course: "Investment Analysis & Portfolio Management", section: "2", plannedSessions: 11 },
  { program: "PGP", term: "Term 4", course: "Organization Theory and Design", section: "1", plannedSessions: 6 },
  { program: "PGP", term: "Term 4", course: "Brand Management", section: "1", plannedSessions: 11 },
  { program: "PGP", term: "Term 4", course: "Sales and Distribution Management", section: "1", plannedSessions: 11 },
  { program: "PGP", term: "Term 4", course: "Decision Science for Managers", section: "3", plannedSessions: 10 },
  { program: "PGP", term: "Term 4", course: "Venture Studio Lab", section: "4", plannedSessions: 10 },
  { program: "PGP", term: "Term 4", course: "Negotiation and Conflict Management", section: "3", plannedSessions: 8 },
  { program: "PGP", term: "Term 4", course: "Consumer Insights & Digital Analytics", section: "2", plannedSessions: 12 },
  { program: "PGP", term: "Term 4", course: "Supply Chain Analytics", section: "4", plannedSessions: 12 },
  { program: "PGP", term: "Term 4", course: "People Analytics", section: "YLC", plannedSessions: 9 },
  { program: "PGP", term: "Term 4", course: "Behavioral Economics", section: "YLC", plannedSessions: 8 },
  { program: "PGP", term: "Term 4", course: "Executive Communication Lab", section: "3", plannedSessions: 10 },
];

export const coursePlan: CoursePlan[] = [...term3Plan, ...term4Plan];
