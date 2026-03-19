import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreToBadge } from "../lib/analyticsEngine";
import type { CourseHealthItem, SectionHealthItem, TrendPoint } from "../types/dashboardTypes";
import { compact } from "../utils/dateUtils";

interface ChartsProps {
  trend: TrendPoint[];
  bySection: SectionHealthItem[];
  topBest: CourseHealthItem[];
  topWorst: CourseHealthItem[];
}

export default function Charts({ trend, bySection, topBest, topWorst }: ChartsProps) {
  const gridStroke = "hsl(var(--chart-grid))";
  const axisStroke = "hsl(var(--chart-axis))";
  const ratingStroke = "hsl(var(--chart-rating))";
  const attendanceStroke = "hsl(var(--chart-attendance))";
  const tooltipStyle = {
    borderRadius: "0.75rem",
    border: "1px solid hsl(var(--chart-tooltip-border))",
    backgroundColor: "hsl(var(--chart-tooltip-bg))",
    color: "hsl(var(--foreground))",
  } as const;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Rating trend (delivered sessions)</CardTitle>
            <CardDescription>Weighted by response count - Spot drops early</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: axisStroke }} stroke={axisStroke} tickMargin={8} />
                <YAxis domain={[3.0, 5.0]} tick={{ fill: axisStroke }} stroke={axisStroke} tickMargin={8} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="rating" stroke={ratingStroke} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Attendance trend (delivered sessions)</CardTitle>
            <CardDescription>Weighted by headcount - Detect timetable clashes</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: axisStroke }} stroke={axisStroke} tickMargin={8} />
                <YAxis domain={[50, 100]} tick={{ fill: axisStroke }} stroke={axisStroke} tickMargin={8} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke={attendanceStroke}
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top / bottom courses (rating)</CardTitle>
            <CardDescription>Across the full term dataset - Quick scan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Best</div>
                {topBest.map((c) => {
                  const badge = scoreToBadge(c.rating);
                  return (
                    <div key={c.course} className="flex items-center justify-between rounded-2xl border p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.course}</div>
                        <div className="text-xs text-muted-foreground">Attendance: {compact(c.attendance, 1)}%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <div className="text-sm font-semibold">{compact(c.rating, 2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Needs attention</div>
                {topWorst.map((c) => {
                  const badge = scoreToBadge(c.rating);
                  return (
                    <div key={c.course} className="flex items-center justify-between rounded-2xl border p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.course}</div>
                        <div className="text-xs text-muted-foreground">Attendance: {compact(c.attendance, 1)}%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <div className="text-sm font-semibold">{compact(c.rating, 2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4" />
                <p>
                  Tip: for any low course rating, check <span className="font-medium">course depth</span>,
                  <span className="font-medium"> practice volume</span>, and <span className="font-medium">link to outcomes</span>
                  (projects / interviews). If the same course has multiple faculty, isolate by <span className="font-medium">CoursexProfessor</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Section snapshot</CardTitle>
            <CardDescription>Compare cohort energy and timetable health</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="section" tick={{ fill: axisStroke }} stroke={axisStroke} tickMargin={8} />
                <YAxis
                  yAxisId="left"
                  domain={[3.0, 5.0]}
                  tick={{ fill: axisStroke }}
                  stroke={axisStroke}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[50, 100]}
                  tick={{ fill: axisStroke }}
                  stroke={axisStroke}
                  tickMargin={8}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="rating"
                  name="Average rating"
                  fill={ratingStroke}
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="attendance"
                  name="Attendance %"
                  fill={attendanceStroke}
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
