import React from "react";
import { AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  pctToBadge,
  priorityBadge,
  scoreToBadge,
  ticketStatusBadge,
} from "../lib/analyticsEngine";
import type { Session, Ticket } from "../types/dashboardTypes";
import { compact, daysBetween, formatDate, formatDateWithYear } from "../utils/dateUtils";

function sessionStatusBadge(status: Session["status"]) {
  if (status === "Delivered") {
    return { text: "Delivered", variant: "default" as const, icon: CheckCircle2 };
  }
  if (status === "Planned") {
    return { text: "Planned", variant: "secondary" as const, icon: Calendar };
  }
  return { text: "Cancelled", variant: "outline" as const, icon: AlertTriangle };
}

export function KpiCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-background shadow-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MiniKpi({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-xl font-semibold tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border bg-background shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function Hint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{body}</div>
    </div>
  );
}

export function ActionCard({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <div className="rounded-3xl border p-4">
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        {bullets.map((bullet, idx) => (
          <li key={`${title}-${idx}`}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}

export function SessionDialog({ session }: { session: Session }) {
  const stat = sessionStatusBadge(session.status);
  const StatIcon = stat.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-2xl">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-xl">
              {session.id}
            </Badge>
            <span className="truncate">{session.course}</span>
          </DialogTitle>
          <DialogDescription>
            {formatDate(session.dateISO)}
            {session.startTime ? ` - ${session.startTime}` : ""} - Section {session.section} - {session.professor}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-1 inline-flex items-center gap-2">
                <Badge variant={stat.variant} className="rounded-xl">
                  <span className="inline-flex items-center gap-1">
                    <StatIcon className="h-3.5 w-3.5" /> {stat.text}
                  </span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Rating</div>
              <div className="mt-1 text-xl font-semibold">
                {session.ratingAvg === null ? "-" : session.ratingAvg.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Responses: {session.responses || "-"}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Attendance</div>
              <div className="mt-1 text-xl font-semibold">
                {session.attendancePct === null ? "-" : `${session.attendancePct.toFixed(0)}%`}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Headcount: {session.headcount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Topic</CardTitle>
            <CardDescription>What was covered in this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border p-3 text-sm">{session.topic}</div>
            {session.notes ? (
              <div className="mt-3 rounded-2xl bg-muted/40 p-3 text-sm">
                <div className="text-xs font-medium text-muted-foreground">Notes</div>
                <div className="mt-1">{session.notes}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <Button className="rounded-2xl" variant="secondary">
            Add internal note
          </Button>
          <Button className="rounded-2xl">Create follow-up action</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TicketDialog({ ticket, referenceISO }: { ticket: Ticket; referenceISO: string }) {
  const pb = priorityBadge(ticket.priority);
  const sb = ticketStatusBadge(ticket.status);

  const endISO =
    (ticket.status === "Resolved" || ticket.status === "Closed") && ticket.resolvedISO
      ? ticket.resolvedISO
      : referenceISO;
  const ageH = daysBetween(ticket.createdISO, endISO) * 24;
  const breached = ageH > ticket.slaHours;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-2xl">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-xl">
              {ticket.id}
            </Badge>
            <span className="truncate">{ticket.title}</span>
          </DialogTitle>
          <DialogDescription>
            Created {formatDateWithYear(ticket.createdISO)}
            {ticket.resolvedISO ? ` - Resolved ${formatDateWithYear(ticket.resolvedISO)}` : ""}
            {ticket.course ? ` - ${ticket.course}` : ""}
            {ticket.section ? ` - S${ticket.section}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Priority</div>
              <div className="mt-1">
                <Badge variant={pb.variant} className="rounded-xl">
                  {pb.label}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Category: {ticket.category}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-1">
                <Badge variant={sb.variant} className="rounded-xl">
                  {sb.text}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Owner: {ticket.owner}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">SLA</div>
              <div className="mt-1 text-xl font-semibold">{ticket.slaHours}h</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Age: <span className={breached ? "font-semibold" : ""}>{compact(ageH, 0)}h</span>
                {breached ? " - breached" : ""}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Details</CardTitle>
            <CardDescription>What was raised and what needs to happen next</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border p-3 text-sm">{ticket.description || "-"}</div>
            <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
              <div className="rounded-2xl bg-muted/40 p-3">
                <div className="text-muted-foreground">Linked professor</div>
                <div className="mt-0.5 font-semibold">{ticket.professor || "-"}</div>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                <div className="text-muted-foreground">Linked course</div>
                <div className="mt-0.5 font-semibold">{ticket.course || "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <Button className="rounded-2xl" variant="secondary">
            Add update
          </Button>
          <Button className="rounded-2xl">Assign owner</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RatingBadge({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const badge = scoreToBadge(rating);
  return (
    <div className="flex items-center gap-2">
      <Badge variant={badge.variant}>{badge.label}</Badge>
      <span className="font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}

export function AttendanceBadge({ attendance }: { attendance: number | null }) {
  if (attendance === null) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const badge = pctToBadge(attendance);
  return (
    <div className="flex items-center gap-2">
      <Badge variant={badge.variant}>{badge.label}</Badge>
      <span className="font-semibold">{attendance.toFixed(0)}%</span>
    </div>
  );
}
