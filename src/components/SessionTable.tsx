import { AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pctToBadge, scoreToBadge } from "../lib/analyticsEngine";
import type { Session } from "../types/dashboardTypes";
import { formatDate } from "../utils/dateUtils";
import { SessionDialog } from "./commonBlocks";

function statusBadge(status: Session["status"]) {
  if (status === "Delivered") return { text: "Delivered", variant: "default" as const, icon: CheckCircle2 };
  if (status === "Planned") return { text: "Planned", variant: "secondary" as const, icon: Calendar };
  return { text: "Cancelled", variant: "outline" as const, icon: AlertTriangle };
}

interface SessionTableProps {
  filteredSessions: Session[];
  visibleSessions: Session[];
  visibleCount: number;
  hasMoreSessions: boolean;
  sessionsPerClick: number;
  onLoadMore: () => void;
}

export default function SessionTable({
  filteredSessions,
  visibleSessions,
  visibleCount,
  hasMoreSessions,
  sessionsPerClick,
  onLoadMore,
}: SessionTableProps) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Session log (live)</CardTitle>
          <CardDescription>
            Showing {Math.min(visibleCount, filteredSessions.length)} of {filteredSessions.length} sessions - Sort: planned first, then recent delivered
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {hasMoreSessions ? (
            <Button variant="secondary" className="rounded-2xl" onClick={onLoadMore}>
              Load {sessionsPerClick} more
            </Button>
          ) : (
            <Badge variant="outline" className="rounded-xl">
              All loaded
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Course</TableHead>
              <TableHead className="hidden md:table-cell">Professor</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead className="hidden md:table-cell">Responses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleSessions.map((session) => {
              const stat = statusBadge(session.status);
              const StatIcon = stat.icon;
              const rating = session.ratingAvg ?? 0;
              const attendance = session.attendancePct ?? 0;
              const ratingBadge = session.ratingAvg === null ? null : scoreToBadge(rating);
              const attendanceBadge = session.attendancePct === null ? null : pctToBadge(attendance);

              return (
                <TableRow key={session.id} className="align-middle">
                  <TableCell className="whitespace-nowrap">{formatDate(session.dateISO)}</TableCell>
                  <TableCell className="min-w-[220px]">
                    <div className="space-y-0.5">
                      <div className="truncate font-medium">{session.course}</div>
                      <div className="truncate text-xs text-muted-foreground">{session.topic}</div>
                      <div className="md:hidden truncate text-xs text-muted-foreground">{session.professor}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-[220px]">
                    <div className="truncate">{session.professor}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{session.section}</Badge>
                  </TableCell>
                  <TableCell>
                    {session.ratingAvg === null ? (
                      <span className="text-xs text-muted-foreground">-</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant={ratingBadge!.variant}>{ratingBadge!.label}</Badge>
                        <span className="font-semibold">{rating.toFixed(1)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {session.attendancePct === null ? (
                      <span className="text-xs text-muted-foreground">-</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant={attendanceBadge!.variant}>{attendanceBadge!.label}</Badge>
                        <span className="font-semibold">{attendance.toFixed(0)}%</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{session.responses || "-"}</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2">
                      <Badge variant={stat.variant} className="rounded-xl">
                        <span className="inline-flex items-center gap-1">
                          <StatIcon className="h-3.5 w-3.5" /> {stat.text}
                        </span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <SessionDialog session={session} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableCaption className="text-xs">
            Mock dataset - Replace with live feeds (attendance + ratings) for true tracking.
          </TableCaption>
        </Table>
      </CardContent>
    </Card>
  );
}
