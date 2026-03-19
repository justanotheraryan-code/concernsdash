import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Info,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
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
import { priorityBadge, ticketStatusBadge } from "../lib/analyticsEngine";
import type { Ticket, TicketMetrics, TicketTrendPoint } from "../types/dashboardTypes";
import { compact, daysBetween, formatDateWithYear } from "../utils/dateUtils";
import { Hint, MiniKpi, TicketDialog } from "./commonBlocks";

interface TicketTableProps {
  filteredTickets: Ticket[];
  ticketMetrics: TicketMetrics;
  ticketTrend: TicketTrendPoint[];
  ticketSummary: {
    headline: string;
    body: string[];
    actions: string[];
  };
}

export default function TicketTable({
  filteredTickets,
  ticketMetrics,
  ticketTrend,
  ticketSummary,
}: TicketTableProps) {
  const gridStroke = "hsl(var(--chart-grid))";
  const axisStroke = "hsl(var(--chart-axis))";
  const createdStroke = "hsl(var(--chart-1))";
  const resolvedStroke = "hsl(var(--chart-2))";
  const backlogStroke = "hsl(var(--chart-5))";
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
            <CardTitle className="text-base">Tickets health</CardTitle>
            <CardDescription>
              Raised for the academics team + ops/LMS - Speed + SLA - Inherits current filters
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <MiniKpi
              title="Open backlog"
              value={`${ticketMetrics.openCount}`}
              sub="Open + In progress"
              icon={<ClipboardList className="h-4 w-4" />}
            />
            <MiniKpi
              title="SLA breaches"
              value={`${ticketMetrics.inSlaBreaches + ticketMetrics.resolvedBreaches}`}
              sub={`${ticketMetrics.inSlaBreaches} open - ${ticketMetrics.resolvedBreaches} late`}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <MiniKpi
              title="Avg resolve"
              value={ticketMetrics.closed.length ? `${compact(ticketMetrics.avgHours, 0)}h` : "-"}
              sub={ticketMetrics.closed.length ? `p90 ${compact(ticketMetrics.p90Hours, 0)}h` : "No resolved in view"}
              icon={<Clock className="h-4 w-4" />}
            />
            <MiniKpi
              title="Created (7d)"
              value={`${ticketMetrics.created7}`}
              sub="Last 7 days"
              icon={<ArrowUpRight className="h-4 w-4" />}
            />
            <MiniKpi
              title="Resolved (7d)"
              value={`${ticketMetrics.resolved7}`}
              sub="Last 7 days"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <MiniKpi
              title="Top drivers"
              value={ticketMetrics.topCats.length ? ticketMetrics.topCats[0][0] : "-"}
              sub={ticketMetrics.topCats.length ? `${ticketMetrics.topCats[0][1]} open` : "No open"}
              icon={<Info className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Flow (created vs resolved)</CardTitle>
            <CardDescription>Backlog stability - Daily view in current range</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ticketTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: axisStroke }} stroke={axisStroke} tickMargin={8} />
                <YAxis allowDecimals={false} tick={{ fill: axisStroke }} stroke={axisStroke} tickMargin={8} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke={createdStroke}
                  strokeWidth={2}
                  dot={false}
                  name="Created"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke={resolvedStroke}
                  strokeWidth={2}
                  dot={false}
                  name="Resolved"
                />
                <Line
                  type="monotone"
                  dataKey="backlog"
                  stroke={backlogStroke}
                  strokeWidth={2}
                  dot={false}
                  name="Backlog"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Tickets summary (AI-style)</CardTitle>
          <CardDescription>
            Auto-generated from ticket data. In production this can be enhanced with LLM summarization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-semibold">{ticketSummary.headline}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {ticketSummary.body.map((bodyText, idx) => (
                <li key={`tb-${idx}`}>{bodyText}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {ticketSummary.actions.map((action, idx) => (
              <Hint key={`ta-${idx}`} title={`Action ${idx + 1}`} body={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Ticket list</CardTitle>
          <CardDescription>
            Open tickets first - Click to view details - Reference date: {formatDateWithYear(ticketMetrics.maxISO)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Course</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Owner</TableHead>
                <TableHead className="hidden md:table-cell">Age</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...filteredTickets]
                .sort((a, b) => {
                  const aOpen = a.status === "Open" || a.status === "In Progress";
                  const bOpen = b.status === "Open" || b.status === "In Progress";
                  if (aOpen !== bOpen) return aOpen ? -1 : 1;
                  return Date.parse(b.createdISO) - Date.parse(a.createdISO);
                })
                .map((ticket) => {
                  const priority = priorityBadge(ticket.priority);
                  const status = ticketStatusBadge(ticket.status);
                  const endISO =
                    (ticket.status === "Resolved" || ticket.status === "Closed") && ticket.resolvedISO
                      ? ticket.resolvedISO
                      : ticketMetrics.maxISO;
                  const ageH = daysBetween(ticket.createdISO, endISO) * 24;
                  const breached = ageH > ticket.slaHours;

                  return (
                    <TableRow key={ticket.id} className="align-middle">
                      <TableCell className="whitespace-nowrap font-medium">{ticket.id}</TableCell>
                      <TableCell className="min-w-[260px]">
                        <div className="space-y-0.5">
                          <div className="truncate font-medium">{ticket.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.category}
                            {ticket.section ? ` - S${ticket.section}` : ""}
                            {breached ? " - SLA risk" : ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{ticket.course || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={priority.variant} className="rounded-xl">
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="rounded-xl">
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{ticket.owner}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={breached ? "font-semibold" : ""}>{compact(ageH, 0)}h</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <TicketDialog ticket={ticket} referenceISO={ticketMetrics.maxISO} />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
            <TableCaption className="text-xs">
              Dynamic ticket source supported via mock, CSV, Google Sheets, or API connectors.
            </TableCaption>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
