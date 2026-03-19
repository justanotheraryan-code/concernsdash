import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AnomalyAlert,
  CoursePlan,
  DirectorActionItem,
  LeadershipInsight,
  SectionId,
  Session,
  Ticket,
} from "../types/dashboardTypes";
import { formatDateWithYear } from "../utils/dateUtils";

interface InsightPanelProps {
  insights: LeadershipInsight[];
  anomalies: AnomalyAlert[];
  actions: DirectorActionItem[];
  courses: string[];
  professors: string[];
  onAddAction: (action: DirectorActionItem) => void;
  onUpdateActionStatus: (actionId: string, status: DirectorActionItem["status"]) => void;
  adminMode: boolean;
  setAdminMode: (value: boolean) => void;
  onAddSession: (session: Session) => void;
  onAddTicket: (ticket: Ticket) => void;
  onAddPlan: (plan: CoursePlan) => void;
  onImportCsv: (files: { feedbackCsv?: File; attendanceCsv?: File; ticketsCsv?: File }) => Promise<void>;
}

const SECTIONS: SectionId[] = ["1", "2", "3", "4", "YLC"];

function impactBadge(impact: LeadershipInsight["impact"]) {
  if (impact === "High") return "destructive" as const;
  if (impact === "Medium") return "secondary" as const;
  return "outline" as const;
}

export default function InsightPanel(props: InsightPanelProps) {
  const {
    insights,
    anomalies,
    actions,
    courses,
    professors,
    onAddAction,
    onUpdateActionStatus,
    adminMode,
    setAdminMode,
    onAddSession,
    onAddTicket,
    onAddPlan,
    onImportCsv,
  } = props;

  const [actionTitle, setActionTitle] = useState("");
  const [actionCourse, setActionCourse] = useState<string>("All");
  const [actionProfessor, setActionProfessor] = useState<string>("All");
  const [actionSection, setActionSection] = useState<SectionId>("1");

  const [feedbackCsv, setFeedbackCsv] = useState<File | undefined>();
  const [attendanceCsv, setAttendanceCsv] = useState<File | undefined>();
  const [ticketCsv, setTicketCsv] = useState<File | undefined>();

  const [sessionCourse, setSessionCourse] = useState("");
  const [sessionProfessor, setSessionProfessor] = useState("");
  const [sessionSection, setSessionSection] = useState<SectionId>("1");
  const [sessionDate, setSessionDate] = useState("");

  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketOwner, setTicketOwner] = useState("");
  const [ticketCategory, setTicketCategory] = useState<Ticket["category"]>("Operations");

  const [planCourse, setPlanCourse] = useState("");
  const [planSection, setPlanSection] = useState<SectionId>("1");
  const [planSessions, setPlanSessions] = useState("0");

  const sortedActions = useMemo(
    () => actions.slice().sort((a, b) => Date.parse(b.createdAtISO) - Date.parse(a.createdAtISO)),
    [actions]
  );

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-base">Director summary panel</CardTitle>
          <CardDescription>
            Leadership insights, anomaly alerts, and actionable interventions.
          </CardDescription>
        </div>
        <Button
          variant={adminMode ? "default" : "outline"}
          className="rounded-2xl"
          onClick={() => setAdminMode(!adminMode)}
        >
          {adminMode ? "Admin mode on" : "Enable admin mode"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {insights.map((insight) => (
            <div key={insight.id} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{insight.headline}</div>
                <Badge variant={impactBadge(insight.impact)}>{insight.impact}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{insight.recommendation}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold">Anomaly feed</div>
          <div className="mt-2 space-y-2">
            {anomalies.length ? (
              anomalies.slice(0, 6).map((alert) => (
                <div key={alert.id} className="rounded-xl bg-muted/40 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{alert.title}</span>
                    <Badge variant={alert.severity === "High" ? "destructive" : alert.severity === "Medium" ? "secondary" : "outline"}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="mt-1 text-muted-foreground">{alert.detail}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">No anomaly alerts in current view.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold">Director action tracker</div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-5">
            <Input
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              placeholder="Action title"
              className="md:col-span-2"
            />
            <Select value={actionCourse} onValueChange={setActionCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All courses</SelectItem>
                {courses.filter((c) => c !== "All").map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionProfessor} onValueChange={setActionProfessor}>
              <SelectTrigger>
                <SelectValue placeholder="Professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All faculty</SelectItem>
                {professors.filter((p) => p !== "All").map((professor) => (
                  <SelectItem key={professor} value={professor}>
                    {professor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={actionSection} onValueChange={(value) => setActionSection(value as SectionId)}>
                <SelectTrigger>
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((section) => (
                    <SelectItem key={section} value={section}>
                      S{section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="rounded-2xl"
                onClick={() => {
                  if (!actionTitle.trim()) return;
                  onAddAction({
                    id: `A-${Date.now()}`,
                    createdAtISO: new Date().toISOString(),
                    title: actionTitle.trim(),
                    course: actionCourse === "All" ? undefined : actionCourse,
                    professor: actionProfessor === "All" ? undefined : actionProfessor,
                    section: actionSection,
                    status: "Open",
                  });
                  setActionTitle("");
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {sortedActions.length ? (
              sortedActions.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-xl border p-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-xs">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted-foreground">
                      {item.course || "Any course"}
                      {item.professor ? ` - ${item.professor}` : ""}
                      {item.section ? ` - S${item.section}` : ""}
                      {` - ${formatDateWithYear(item.createdAtISO.slice(0, 10))}`}
                    </div>
                  </div>
                  <Select value={item.status} onValueChange={(value) => onUpdateActionStatus(item.id, value as DirectorActionItem["status"])}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">No action items yet.</div>
            )}
          </div>
        </div>

        {adminMode ? (
          <div className="space-y-4 rounded-2xl border p-4">
            <div className="text-sm font-semibold">Admin editing mode</div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2 rounded-xl border p-3">
                <div className="text-xs font-medium">Add session</div>
                <Input placeholder="Date (YYYY-MM-DD)" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                <Input placeholder="Course" value={sessionCourse} onChange={(e) => setSessionCourse(e.target.value)} />
                <Input placeholder="Professor" value={sessionProfessor} onChange={(e) => setSessionProfessor(e.target.value)} />
                <Select value={sessionSection} onValueChange={(v) => setSessionSection(v as SectionId)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        S{s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full rounded-2xl"
                  onClick={() => {
                    if (!sessionDate || !sessionCourse || !sessionProfessor) return;
                    onAddSession({
                      id: `S-${Date.now()}`,
                      dateISO: sessionDate,
                      course: sessionCourse,
                      professor: sessionProfessor,
                      section: sessionSection,
                      topic: "Manual entry",
                      status: "Delivered",
                      ratingAvg: null,
                      responses: 0,
                      attendancePct: null,
                      headcount: 0,
                      program: "PGP",
                      term: "Term 3",
                    });
                    setSessionDate("");
                    setSessionCourse("");
                    setSessionProfessor("");
                  }}
                >
                  Add session
                </Button>
              </div>

              <div className="space-y-2 rounded-xl border p-3">
                <div className="text-xs font-medium">Add ticket</div>
                <Input placeholder="Ticket title" value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} />
                <Input placeholder="Owner" value={ticketOwner} onChange={(e) => setTicketOwner(e.target.value)} />
                <Select value={ticketCategory} onValueChange={(v) => setTicketCategory(v as Ticket["category"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Schedule">Schedule</SelectItem>
                    <SelectItem value="Content">Content</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Assessment">Assessment</SelectItem>
                    <SelectItem value="LMS">LMS</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full rounded-2xl"
                  onClick={() => {
                    if (!ticketTitle || !ticketOwner) return;
                    onAddTicket({
                      id: `T-${Date.now()}`,
                      createdISO: new Date().toISOString().slice(0, 10),
                      status: "Open",
                      priority: "P2",
                      category: ticketCategory,
                      owner: ticketOwner,
                      title: ticketTitle,
                      slaHours: 48,
                    });
                    setTicketTitle("");
                    setTicketOwner("");
                  }}
                >
                  Add ticket
                </Button>
              </div>

              <div className="space-y-2 rounded-xl border p-3">
                <div className="text-xs font-medium">Add course plan</div>
                <Input placeholder="Course" value={planCourse} onChange={(e) => setPlanCourse(e.target.value)} />
                <Select value={planSection} onValueChange={(v) => setPlanSection(v as SectionId)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        S{s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Planned sessions"
                  value={planSessions}
                  onChange={(e) => setPlanSessions(e.target.value)}
                />
                <Button
                  className="w-full rounded-2xl"
                  onClick={() => {
                    if (!planCourse) return;
                    onAddPlan({
                      id: `P-${Date.now()}`,
                      course: planCourse,
                      section: planSection,
                      plannedSessions: Number(planSessions) || 0,
                      program: "PGP",
                      term: "Term 3",
                    });
                    setPlanCourse("");
                    setPlanSessions("0");
                  }}
                >
                  Add plan
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border p-3 text-xs">
                <div className="font-medium">Session feedback CSV</div>
                <input type="file" accept=".csv" onChange={(e) => setFeedbackCsv(e.target.files?.[0])} />
              </div>
              <div className="rounded-xl border p-3 text-xs">
                <div className="font-medium">Attendance CSV</div>
                <input type="file" accept=".csv" onChange={(e) => setAttendanceCsv(e.target.files?.[0])} />
              </div>
              <div className="rounded-xl border p-3 text-xs">
                <div className="font-medium">Ticket CSV</div>
                <input type="file" accept=".csv" onChange={(e) => setTicketCsv(e.target.files?.[0])} />
              </div>
            </div>

            <Button
              className="rounded-2xl"
              onClick={async () => {
                await onImportCsv({
                  feedbackCsv,
                  attendanceCsv,
                  ticketsCsv: ticketCsv,
                });
              }}
            >
              Import CSV files
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
