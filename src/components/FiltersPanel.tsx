import { AlertTriangle, Calendar, CheckCircle2, Filter, Layers, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RANGE, SECTIONS } from "../config/dashboardConfig";
import type { KPIBundle, ProgressBundle, SectionFilter } from "../types/dashboardTypes";
import { KpiCard } from "./commonBlocks";

interface FiltersPanelProps {
  section: SectionFilter;
  setSection: (value: SectionFilter) => void;
  course: string;
  setCourse: (value: string) => void;
  professor: string;
  setProfessor: (value: string) => void;
  range: (typeof RANGE)[number]["id"];
  setRange: (value: (typeof RANGE)[number]["id"]) => void;
  courses: string[];
  professors: string[];
  kpis: KPIBundle;
  progress: ProgressBundle;
}

export default function FiltersPanel(props: FiltersPanelProps) {
  const {
    section,
    setSection,
    course,
    setCourse,
    professor,
    setProfessor,
    range,
    setRange,
    courses,
    professors,
    kpis,
    progress,
  } = props;

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4.5 w-4.5" /> Filters
        </CardTitle>
        <CardDescription>
          Directors are program-specific. Use filters to view course/professor/section cuts for the current term.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Select value={section} onValueChange={(v) => setSection(v as SectionFilter)}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  Section {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={professor} onValueChange={setProfessor}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Professor" />
            </SelectTrigger>
            <SelectContent>
              {professors.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={(v) => setRange(v as (typeof RANGE)[number]["id"])}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {RANGE.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiCard
            title="Avg rating"
            value={kpis.avgRating.toFixed(2)}
            sub={`Responses: ${kpis.responseTotal}`}
            icon={<Layers className="h-4.5 w-4.5" />}
          />
          <KpiCard
            title="Avg attendance"
            value={`${kpis.avgAttendance.toFixed(1)}%`}
            sub="Weighted by headcount"
            icon={<Users className="h-4.5 w-4.5" />}
          />
          <KpiCard
            title="Delivered"
            value={`${kpis.nSessionsDelivered}`}
            sub={`Planned in view: ${kpis.nSessionsPlanned}`}
            icon={<CheckCircle2 className="h-4.5 w-4.5" />}
          />
          <KpiCard
            title="Term progress"
            value={`${progress.pct}%`}
            sub={`${progress.deliveredCount}/${progress.plannedTotal} sessions`}
            icon={<Calendar className="h-4.5 w-4.5" />}
          />
          <KpiCard
            title="At-risk flags"
            value={`${kpis.lowRating + kpis.lowAttendance}`}
            sub={`${kpis.lowRating} rating - ${kpis.lowAttendance} attendance`}
            icon={<AlertTriangle className="h-4.5 w-4.5" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}
