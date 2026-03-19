import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ClipboardList,
  GraduationCap,
  Moon,
  RefreshCcw,
  Search,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROGRAMS, RANGE, TERMS, dashboardConfig } from "../config/dashboardConfig";
import {
  buildAnalyticsSnapshot,
  buildCourseSectionMatrix,
  topAndBottomCourses,
  ticketSummaryFromMetrics,
} from "../lib/analyticsEngine";
import { getDashboardData, startLiveDataRefresh } from "../lib/dataProvider";
import {
  addAction,
  getPersistedActions,
  setPersistedPlan,
  setPersistedSessions,
  setPersistedTickets,
  updateAction,
} from "../lib/dataPersistence";
import { parseBulkCsvImport } from "../services/csvImporter";
import type {
  CoursePlan,
  DirectorActionItem,
  SectionFilter,
  Session,
  Ticket,
} from "../types/dashboardTypes";
import { uniq } from "../utils/aggregationUtils";
import { isoToTime } from "../utils/dateUtils";
import Charts from "./Charts";
import CourseMatrix from "./CourseMatrix";
import FiltersPanel from "./FiltersPanel";
import InsightPanel from "./InsightPanel";
import RiskPanel from "./RiskPanel";
import SessionTable from "./SessionTable";
import TicketTable from "./TicketTable";
import { ActionCard } from "./commonBlocks";

const THEME_STORAGE_KEY = "dashboard_theme";
const THEME_TRANSITION_CLASS = "theme-transitioning";

export default function Dashboard() {
  const [sessionsData, setSessionsData] = useState<Session[]>([]);
  const [ticketsData, setTicketsData] = useState<Ticket[]>([]);
  const [planData, setPlanData] = useState<CoursePlan[]>([]);
  const [actions, setActions] = useState<DirectorActionItem[]>(() => getPersistedActions());

  const [program, setProgram] = useState<string>(PROGRAMS[0]);
  const [term, setTerm] = useState<string>(TERMS[2]);
  const [section, setSection] = useState<SectionFilter>("All");
  const [course, setCourse] = useState<string>("All");
  const [professor, setProfessor] = useState<string>("All");
  const [range, setRange] = useState<(typeof RANGE)[number]["id"]>("30");
  const [query, setQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(dashboardConfig.SESSIONS_PER_CLICK);
  const [adminMode, setAdminMode] = useState<boolean>(false);
  const themeToggleRef = useRef<HTMLButtonElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;
    const hasClass = document.documentElement.classList.contains("dark");
    if (hasClass) return true;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    if (typeof document === "undefined") {
      setIsDarkMode((prev) => !prev);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsDarkMode((prev) => !prev);
      return;
    }

    const root = document.documentElement;
    const rect = themeToggleRef.current?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth - 24;
    const originY = rect ? rect.top + rect.height / 2 : 24;
    const maxRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );

    const switchTheme = () => {
      flushSync(() => {
        setIsDarkMode((prev) => !prev);
      });
    };

    const transitionDoc = document as Document & {
      startViewTransition?: (callback: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    if (!transitionDoc.startViewTransition) {
      switchTheme();
      return;
    }

    const transition = transitionDoc.startViewTransition(() => {
      switchTheme();
    });

    root.classList.add(THEME_TRANSITION_CLASS);
    void transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${originX}px ${originY}px)`,
              `circle(${maxRadius}px at ${originX}px ${originY}px)`,
            ],
            opacity: [0.84, 1],
            filter: ["saturate(0.92)", "saturate(1)"],
          },
          {
            duration: 620,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {
        // No-op fallback: native view transition continues without custom keyframes.
      });

    void transition.finished.finally(() => {
      root.classList.remove(THEME_TRANSITION_CLASS);
    });
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const payload = await getDashboardData({ program, term });
      if (cancelled) return;

      setSessionsData(payload.sessions);
      setTicketsData(payload.tickets);
      setPlanData(payload.plan);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [program, term]);

  useEffect(() => {
    const stop = startLiveDataRefresh(
      (payload) => {
        setSessionsData(payload.sessions);
        setTicketsData(payload.tickets);
        setPlanData(payload.plan);
      },
      () => {
        // silent failure fallback keeps the current snapshot
      }
    );

    return () => {
      if (stop) stop();
    };
  }, []);

  const resetVisibleCount = () => {
    setVisibleCount(dashboardConfig.SESSIONS_PER_CLICK);
  };

  const handleProgramChange = (value: string) => {
    setProgram(value);
    resetVisibleCount();
  };

  const handleTermChange = (value: string) => {
    setTerm(value);
    resetVisibleCount();
  };

  const handleSectionChange = (value: SectionFilter) => {
    setSection(value);
    resetVisibleCount();
  };

  const handleCourseChange = (value: string) => {
    setCourse(value);
    resetVisibleCount();
  };

  const handleProfessorChange = (value: string) => {
    setProfessor(value);
    resetVisibleCount();
  };

  const handleRangeChange = (value: (typeof RANGE)[number]["id"]) => {
    setRange(value);
    resetVisibleCount();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    resetVisibleCount();
  };

  const nowLabel = useMemo(() => {
    const dt = new Date();
    return dt.toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const programOptions = useMemo(
    () => uniq([...(PROGRAMS as readonly string[]), ...sessionsData.map((s) => s.program || "PGP")]),
    [sessionsData]
  );

  const termOptions = useMemo(
    () => uniq([...(TERMS as readonly string[]), ...sessionsData.map((s) => s.term || "Term 3")]),
    [sessionsData]
  );

  const scopeSessions = useMemo(
    () =>
      sessionsData.filter((s) => {
        const programMatch = s.program ? s.program === program : true;
        const termMatch = s.term ? s.term === term : true;
        return programMatch && termMatch;
      }),
    [sessionsData, program, term]
  );

  const scopeTickets = useMemo(
    () =>
      ticketsData.filter((t) => {
        const programMatch = t.program ? t.program === program : true;
        const termMatch = t.term ? t.term === term : true;
        return programMatch && termMatch;
      }),
    [ticketsData, program, term]
  );

  const scopePlan = useMemo(
    () =>
      planData.filter((p) => {
        const programMatch = p.program ? p.program === program : true;
        const termMatch = p.term ? p.term === term : true;
        return programMatch && termMatch;
      }),
    [planData, program, term]
  );

  const courses = useMemo(
    () => ["All", ...uniq(scopeSessions.map((s) => s.course)).sort()],
    [scopeSessions]
  );

  const professors = useMemo(
    () => ["All", ...uniq(scopeSessions.map((s) => s.professor)).sort()],
    [scopeSessions]
  );

  const filteredSessions = useMemo(() => {
    let rows = [...scopeSessions];

    if (section !== "All") rows = rows.filter((s) => s.section === section);
    if (course !== "All") rows = rows.filter((s) => s.course === course);
    if (professor !== "All") rows = rows.filter((s) => s.professor === professor);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((s) =>
        [s.course, s.professor, s.section, s.topic, s.id].some((x) => x.toLowerCase().includes(q))
      );
    }

    if (range !== "all" && rows.length) {
      const valid = rows.filter((r) => r.status !== "Cancelled");
      if (valid.length) {
        const maxTime = Math.max(...valid.map((r) => isoToTime(r.dateISO)));
        const days = range === "14" ? 14 : 30;
        const minTime = maxTime - days * 24 * 60 * 60 * 1000;
        rows = rows.filter((r) => isoToTime(r.dateISO) >= minTime);
      }
    }

    rows.sort((a, b) => {
      const ta = isoToTime(a.dateISO);
      const tb = isoToTime(b.dateISO);
      if (a.status === "Planned" && b.status !== "Planned") return -1;
      if (b.status === "Planned" && a.status !== "Planned") return 1;
      return tb - ta;
    });

    return rows;
  }, [scopeSessions, section, course, professor, range, query]);

  const filteredTickets = useMemo(() => {
    let rows = [...scopeTickets];

    if (section !== "All") rows = rows.filter((t) => !t.section || t.section === section);
    if (course !== "All") rows = rows.filter((t) => !t.course || t.course === course);
    if (professor !== "All") rows = rows.filter((t) => !t.professor || t.professor === professor);

    if (range !== "all" && rows.length) {
      const maxTime = Math.max(...rows.map((t) => isoToTime(t.createdISO)));
      const days = range === "14" ? 14 : 30;
      const minTime = maxTime - days * 24 * 60 * 60 * 1000;
      rows = rows.filter((t) => isoToTime(t.createdISO) >= minTime);
    }

    rows.sort((a, b) => isoToTime(b.createdISO) - isoToTime(a.createdISO));
    return rows;
  }, [scopeTickets, section, course, professor, range]);

  const analytics = useMemo(
    () =>
      buildAnalyticsSnapshot({
        sessions: filteredSessions,
        tickets: filteredTickets,
        plan: scopePlan,
        filters: { section, course, professor },
      }),
    [filteredSessions, filteredTickets, scopePlan, section, course, professor]
  );

  const courseHeat = useMemo(() => buildCourseSectionMatrix(filteredSessions), [filteredSessions]);
  const topCourses = useMemo(() => topAndBottomCourses(analytics.courseHealth), [analytics.courseHealth]);
  const ticketSummary = useMemo(
    () => ticketSummaryFromMetrics(analytics.ticketMetrics),
    [analytics.ticketMetrics]
  );

  const visibleSessions = useMemo(
    () => filteredSessions.slice(0, visibleCount),
    [filteredSessions, visibleCount]
  );
  const hasMoreSessions = visibleCount < filteredSessions.length;

  const handleAddSession = (session: Session) => {
    setSessionsData((prev) => {
      const next = [...prev, session];
      setPersistedSessions(next);
      return next;
    });
  };

  const handleAddTicket = (ticket: Ticket) => {
    setTicketsData((prev) => {
      const next = [...prev, ticket];
      setPersistedTickets(next);
      return next;
    });
  };

  const handleAddPlan = (planRow: CoursePlan) => {
    setPlanData((prev) => {
      const next = [...prev, planRow];
      setPersistedPlan(next);
      return next;
    });
  };

  const handleAddAction = (action: DirectorActionItem) => {
    const next = addAction(action);
    setActions(next);
  };

  const handleUpdateActionStatus = (actionId: string, status: DirectorActionItem["status"]) => {
    const next = updateAction(actionId, { status });
    setActions(next);
  };

  const handleCsvImport = async (files: { feedbackCsv?: File; attendanceCsv?: File; ticketsCsv?: File }) => {
    const result = await parseBulkCsvImport(files);

    if (result.sessions?.length) {
      setSessionsData(result.sessions);
      setPersistedSessions(result.sessions);
    }

    if (result.tickets?.length) {
      setTicketsData(result.tickets);
      setPersistedTickets(result.tickets);
    }

    if (result.coursePlan?.length) {
      setPlanData(result.coursePlan);
      setPersistedPlan(result.coursePlan);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300 md:text-3xl">
                  Academics Director - Live Term Tracker
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <RefreshCcw className="h-3.5 w-3.5" /> Last updated: {nowLabel}
              </span>
              <span className="hidden md:inline">-</span>
              <span className="inline-flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5" /> Scope: {program} / {term}
              </span>
              <Badge variant="outline" className="rounded-xl">
                Source: {dashboardConfig.DATA_SOURCE}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:flex md:items-center">
            <Select value={program} onValueChange={handleProgramChange}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                {programOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={term} onValueChange={handleTermChange}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              ref={themeToggleRef}
              variant="outline"
              className="rounded-2xl"
              onClick={handleThemeToggle}
            >
              {isDarkMode ? (
                <>
                  <Sun className="mr-2 h-4 w-4" /> Light
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </>
              )}
            </Button>

            <div className="col-span-3 flex items-center gap-2">
              <div className="relative w-full md:min-w-[460px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 w-full rounded-2xl pl-12 text-[15px]"
                  placeholder="Search course, professor, topic, session ID..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <FiltersPanel
          section={section}
          setSection={handleSectionChange}
          course={course}
          setCourse={handleCourseChange}
          professor={professor}
          setProfessor={handleProfessorChange}
          range={range}
          setRange={handleRangeChange}
          courses={courses}
          professors={professors}
          kpis={analytics.kpis}
          progress={analytics.progress}
        />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid h-12 w-full grid-cols-5 rounded-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="at-risk">At-risk</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Charts
              trend={analytics.trends.sessions}
              bySection={analytics.sectionHealth}
              topBest={topCourses.best}
              topWorst={topCourses.worst}
            />

            <SessionTable
              filteredSessions={filteredSessions}
              visibleSessions={visibleSessions}
              visibleCount={visibleCount}
              hasMoreSessions={hasMoreSessions}
              sessionsPerClick={dashboardConfig.SESSIONS_PER_CLICK}
              onLoadMore={() =>
                setVisibleCount((count) =>
                  Math.min(filteredSessions.length, count + dashboardConfig.SESSIONS_PER_CLICK)
                )
              }
            />

            <InsightPanel
              insights={analytics.insights}
              anomalies={analytics.anomalies}
              actions={actions}
              courses={courses}
              professors={professors}
              onAddAction={handleAddAction}
              onUpdateActionStatus={handleUpdateActionStatus}
              adminMode={adminMode}
              setAdminMode={setAdminMode}
              onAddSession={handleAddSession}
              onAddTicket={handleAddTicket}
              onAddPlan={handleAddPlan}
              onImportCsv={handleCsvImport}
            />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <CourseMatrix courseHeat={courseHeat} sessions={filteredSessions} />

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Course health index</CardTitle>
                <CardDescription>
                  CourseHealthScore = 50% rating + 30% attendance + 20% operational issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Operational tickets</TableHead>
                      <TableHead>Health score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.courseHealth
                      .slice()
                      .sort((a, b) => b.courseHealthScore - a.courseHealthScore)
                      .map((row) => (
                        <TableRow key={row.course}>
                          <TableCell className="font-medium">{row.course}</TableCell>
                          <TableCell>{row.rating.toFixed(2)}</TableCell>
                          <TableCell>{row.attendance.toFixed(1)}%</TableCell>
                          <TableCell>{row.ticketVolume}</TableCell>
                          <TableCell>{row.courseHealthScore.toFixed(0)}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === "Green" ? "default" : row.status === "Watch" ? "secondary" : "destructive"}>
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Section leaderboard</CardTitle>
                  <CardDescription>Where you might need ops / TA / engagement intervention</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Risk score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.sectionHealth
                        .slice()
                        .sort((a, b) => b.rating - a.rating)
                        .map((row) => (
                          <TableRow key={row.section}>
                            <TableCell>
                              <Badge variant="outline">{row.section}</Badge>
                            </TableCell>
                            <TableCell>{row.rating.toFixed(2)}</TableCell>
                            <TableCell>{row.attendance.toFixed(1)}%</TableCell>
                            <TableCell>{row.sessions}</TableCell>
                            <TableCell>{row.riskScore}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Suggested section actions</CardTitle>
                  <CardDescription>Based on common failure modes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ActionCard
                    title="Attendance drop"
                    bullets={[
                      "Verify timetable clashes and transport constraints",
                      "Check if assessments are stacking up (assignment calendar)",
                      "Align session outcomes with interviews/projects to increase perceived value",
                    ]}
                  />
                  <ActionCard
                    title="Rating drop"
                    bullets={[
                      "Add structured practice (problem sets / in-class exercises)",
                      "Tighten delivery: agenda -> examples -> recap",
                      "Collect 3 student quotes per low session to pinpoint root cause",
                    ]}
                  />
                  <ActionCard
                    title="Both drop"
                    bullets={[
                      "Escalate to course owner: redesign content sequencing",
                      "Swap faculty or add TA support / co-teaching",
                      "Run a quick 10-minute section pulse survey mid-term",
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Faculty performance dashboard</CardTitle>
                <CardDescription>
                  Avg rating, attendance, delivered sessions, and ticket complaints.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Best rated</div>
                  {analytics.facultyHealth.bestRated.map((row) => (
                    <div key={`best-${row.professor}`} className="rounded-2xl border p-3 text-sm">
                      <div className="font-medium truncate">{row.professor}</div>
                      <div className="text-xs text-muted-foreground">Rating {row.rating.toFixed(2)} - Attendance {row.attendance.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Most improved</div>
                  {analytics.facultyHealth.mostImproved.map((row) => (
                    <div key={`improved-${row.professor}`} className="rounded-2xl border p-3 text-sm">
                      <div className="font-medium truncate">{row.professor}</div>
                      <div className="text-xs text-muted-foreground">Delta rating {row.deltaRating >= 0 ? "+" : ""}{row.deltaRating.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Highest risk</div>
                  {analytics.facultyHealth.highestRisk.map((row) => (
                    <div key={`risk-${row.professor}`} className="rounded-2xl border p-3 text-sm">
                      <div className="font-medium truncate">{row.professor}</div>
                      <div className="text-xs text-muted-foreground">Risk {row.riskScore} - Ticket complaints {row.ticketComplaints}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="at-risk" className="space-y-6">
            <RiskPanel atRisk={analytics.atRisk} />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <TicketTable
              filteredTickets={filteredTickets}
              ticketMetrics={analytics.ticketMetrics}
              ticketTrend={analytics.trends.tickets}
              ticketSummary={ticketSummary}
            />
          </TabsContent>
        </Tabs>

        <footer className="pt-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Dynamic dashboard - data source: {dashboardConfig.DATA_SOURCE}. Supports mock, CSV, Google Sheets, and API inputs.
            </span>
            <span className="inline-flex items-center gap-2">
              <Badge variant="outline" className="rounded-xl">
                Sections: 1,2,3,4,YLC
              </Badge>
              <Badge variant="outline" className="rounded-xl">
                Cuts: Course - Professor - CoursexProfessor
              </Badge>
              <Badge variant="outline" className="rounded-xl">
                Predictive signals: {analytics.trends.predictions.map((p) => `${p.metric} ${p.direction}`).join(" | ")}
              </Badge>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
