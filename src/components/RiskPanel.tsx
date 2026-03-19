import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskSlice } from "../types/dashboardTypes";
import { Hint } from "./commonBlocks";

function severityPill(severity: RiskSlice["severity"]) {
  if (severity === "High") return "destructive" as const;
  if (severity === "Medium") return "secondary" as const;
  return "outline" as const;
}

export default function RiskPanel({ atRisk }: { atRisk: RiskSlice[] }) {
  return (
    <>
      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">At-risk slices</CardTitle>
          <CardDescription>
            Auto-flagged slices based on rating/attendance thresholds and negative deltas vs baseline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {atRisk.length ? (
              atRisk.map((risk) => (
                <div key={risk.key} className="rounded-3xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-xl">
                          {risk.sliceType}
                        </Badge>
                        <Badge variant={severityPill(risk.severity)} className="rounded-xl">
                          {risk.severity}
                        </Badge>
                        <Badge variant="secondary" className="rounded-xl">
                          {risk.metric}
                        </Badge>
                        <Badge variant="outline" className="rounded-xl">
                          Risk {risk.riskScore}
                        </Badge>
                      </div>
                      <div className="mt-2 truncate text-sm font-semibold">{risk.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{risk.hint}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Current</div>
                      <div className="text-xl font-semibold">
                        {risk.metric === "Rating" ? risk.current.toFixed(2) : `${risk.current.toFixed(0)}%`}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {risk.delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {risk.delta >= 0 ? "+" : ""}
                        {risk.metric === "Rating" ? risk.delta.toFixed(2) : `${risk.delta.toFixed(1)}pp`} vs baseline
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl bg-muted/40 p-3">
                      <div className="text-muted-foreground">Baseline</div>
                      <div className="mt-0.5 font-semibold">
                        {risk.metric === "Rating" ? risk.baseline.toFixed(2) : `${risk.baseline.toFixed(0)}%`}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-3">
                      <div className="text-muted-foreground">Next step</div>
                      <div className="mt-0.5 font-semibold">
                        {risk.sliceType === "Professor"
                          ? "Faculty sync"
                          : risk.sliceType === "Section"
                            ? "Ops check"
                            : risk.sliceType === "Course"
                              ? "Course review"
                              : "Pairing review"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border p-6 text-sm text-muted-foreground">
                No at-risk slices in the current filtered view.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Escalation checklist</CardTitle>
          <CardDescription>Use this when a slice stays red for 2+ sessions</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Hint title="1) Confirm signal" body="Validate sample size: responses >= 20 or attendance headcount >= 25." />
          <Hint title="2) Collect evidence" body="Pull top 5 student comments + 1 TA note + 1 session recording snippet." />
          <Hint title="3) Act fast" body="Decide: pacing fix, more practice, TA support, or faculty swap within 7 days." />
        </CardContent>
      </Card>
    </>
  );
}
