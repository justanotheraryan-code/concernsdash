import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreToBadge } from "../lib/analyticsEngine";
import type { Session } from "../types/dashboardTypes";
import { uniq } from "../utils/aggregationUtils";
import { Hint } from "./commonBlocks";

interface CourseMatrixProps {
  courseHeat: Array<Record<string, string | number | null>>;
  sessions: Session[];
}

export default function CourseMatrix({ courseHeat, sessions }: CourseMatrixProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Course x Section matrix</CardTitle>
            <CardDescription>Avg rating / attendance per course per section</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Course</th>
                    {["1", "2", "3", "4", "YLC"].map((sec) => (
                      <th key={sec} className="px-3 py-2 text-left">
                        S{sec}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courseHeat.map((row) => (
                    <tr key={String(row.course)} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.course}</td>
                      {["1", "2", "3", "4", "YLC"].map((sec) => {
                        const rating = row[`${sec}_rating`] as number | null;
                        const attendance = row[`${sec}_att`] as number | null;
                        const badge = rating === null ? null : scoreToBadge(rating);

                        return (
                          <td key={sec} className="px-3 py-2">
                            {rating === null ? (
                              <span className="text-xs text-muted-foreground">-</span>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={badge!.variant} className="rounded-xl">
                                    {badge!.label}
                                  </Badge>
                                  <span className="font-semibold">{rating.toFixed(1)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{attendance?.toFixed(0)}% attendance</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Faculty distribution</CardTitle>
            <CardDescription>Same course across multiple professors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uniq(sessions.map((s) => s.course))
              .sort()
              .map((course) => {
                const professors = uniq(
                  sessions.filter((s) => s.course === course).map((s) => s.professor)
                );

                return (
                  <div key={course} className="rounded-2xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{course}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {professors.map((professor) => (
                            <Badge key={professor} variant="secondary" className="rounded-xl">
                              {professor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{professors.length} faculty</div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">What to watch (course health)</CardTitle>
          <CardDescription>Quick heuristics for a live tracker</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Hint
            title="Depth risk"
            body="If rating is okay but comments mention 'surface-level', add problem sets, rubrics, and recap notes."
          />
          <Hint
            title="Slot risk"
            body="If attendance dips without rating dip, suspect timetable clashes, fatigue slots, or overlapping assignments."
          />
          <Hint
            title="Faculty-fit risk"
            body="If only one professor's sessions drop, isolate CoursexProfessor and intervene with coaching/structure."
          />
        </CardContent>
      </Card>
    </>
  );
}
