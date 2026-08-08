"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import {
  useGetTimecardByIdQuery,
  useApproveTimecardMutation,
  useRejectTimecardMutation,
} from "@/redux/api/financialApi";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { downloadTimesheetPDF, timesheetFileName } from "@/utils/timesheetPdf";
import { timecardBreakdown, formatCurrency } from "@/utils/payrollTax";

interface TimecardReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timecardId: string;
  /** Show the Approve / Deny footer. Only acts on SUBMITTED timecards. */
  canReview?: boolean;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DAY_FIELDS: Record<(typeof DAYS)[number], string> = {
  Mon: "monday",
  Tue: "tuesday",
  Wed: "wednesday",
  Thu: "thursday",
  Fri: "friday",
  Sat: "saturday",
  Sun: "sunday",
};

const rowTotal = (row: any) =>
  DAYS.reduce((sum, day) => sum + (Number(row?.[DAY_FIELDS[day]]) || 0), 0);

/**
 * Read-only view of a timecard exactly as the employee submitted it, with
 * Approve / Deny at the bottom. Unlike the entry form there is no project or
 * phase picker: the reviewer isn't logging time, so non-billable hours are
 * aggregated across every phase instead of being scoped to a selection.
 */
export default function TimecardReviewDialog({
  open,
  onOpenChange,
  timecardId,
  canReview = false,
}: TimecardReviewDialogProps) {
  const { data: timecard, isLoading } = useGetTimecardByIdQuery(timecardId, { skip: !open });
  const [approveTimecard, { isLoading: isApproving }] = useApproveTimecardMutation();
  const [rejectTimecard, { isLoading: isRejecting }] = useRejectTimecardMutation();

  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const billableEntries = useMemo(
    () => (timecard?.billableEntries || []).filter((e: any) => (e.entryWeek || 1) === activeWeek),
    [timecard, activeWeek]
  );

  /**
   * Non-billable hours summed per category across every project/phase for the
   * active week. The entry form scopes these rows to the selected phase, which
   * is why its rows read 0 while the week total read the real number.
   */
  const overheadRows = useMemo(() => {
    const byCategory = new Map<string, { category: string; days: Record<string, number>; total: number }>();

    (timecard?.entries || [])
      .filter((entry: any) => (entry.entryWeek || 1) === activeWeek)
      .forEach((entry: any) => {
        const existing =
          byCategory.get(entry.category) || {
            category: entry.category,
            days: DAYS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {} as Record<string, number>),
            total: 0,
          };
        DAYS.forEach((day) => {
          existing.days[day] += Number(entry[DAY_FIELDS[day]]) || 0;
        });
        existing.total += rowTotal(entry);
        byCategory.set(entry.category, existing);
      });

    return Array.from(byCategory.values()).sort((a, b) => a.category.localeCompare(b.category));
  }, [timecard, activeWeek]);

  const weekBillableTotal = useMemo(
    () => billableEntries.reduce((sum: number, e: any) => sum + rowTotal(e), 0),
    [billableEntries]
  );
  const weekOverheadTotal = useMemo(
    () => overheadRows.reduce((sum, row) => sum + row.total, 0),
    [overheadRows]
  );

  const totalBillable = Number(timecard?.billableHours || 0);
  const totalHours = Number(timecard?.totalHours || 0);
  const totalOverhead = totalHours - totalBillable;
  const utilization = totalHours > 0 ? (totalBillable / totalHours) * 100 : 0;

  const hourlyRate = Number(timecard?.user?.employeeProfile?.hourlyRate || 0);
  const breakdown = useMemo(() => timecardBreakdown(timecard), [timecard]);

  const isSubmitted = timecard?.status === "SUBMITTED";
  const showActions = canReview && isSubmitted;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await downloadTimesheetPDF("timecard-review-content", timesheetFileName(timecard));
    } catch (err: any) {
      toast.error(`PDF Error: ${err?.message || "Unknown error"}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveTimecard(timecardId).unwrap();
      toast.success("Timecard approved — the employee has been notified");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Approval failed");
    }
  };

  const handleDeny = async () => {
    const reason = denyReason.trim();
    if (!reason) {
      toast.error("Please provide a reason for the denial");
      return;
    }
    try {
      await rejectTimecard({ id: timecardId, rejectionNote: reason }).unwrap();
      toast.success("Timecard denied — sent back to the employee for correction");
      setDenyOpen(false);
      setDenyReason("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Denial failed");
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:w-full max-w-[95vw] sm:max-w-[1100px] bg-white text-black p-0 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:w-full max-w-[95vw] sm:max-w-[1100px] max-h-[90vh] flex flex-col bg-white text-black p-0 overflow-hidden rounded-2xl">
          <div id="timecard-review-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
              <div className="flex justify-between items-start gap-4">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Bi-Weekly Timesheet
                  <span className="ml-3 flex flex-col sm:flex-row text-sm font-medium text-gray-400">
                    {timecard?.weekStarting ? new Date(timecard.weekStarting).toLocaleDateString() : ""} —{" "}
                    {timecard?.weekEnding ? new Date(timecard.weekEnding).toLocaleDateString() : ""}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">{timecard?.user?.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-black">
                      {timecard?.user?.role?.replace(/_/g, " ")}
                    </span>
                    {timecard?.payPeriod && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Period {timecard.payPeriod} · {timecard.payYear}
                      </span>
                    )}
                  </span>
                </DialogTitle>
                <div
                  className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest flex-shrink-0 ${
                    timecard?.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : timecard?.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-700"
                        : timecard?.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {timecard?.status || "DRAFT"}
                </div>
              </div>
            </DialogHeader>

            <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-6 sm:space-y-8 font-semibold">
              {timecard?.status === "REJECTED" && timecard?.rejectionNote && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                      Denied — reason
                    </p>
                    <p className="text-xs text-red-800 mt-1 whitespace-pre-wrap">{timecard.rejectionNote}</p>
                  </div>
                </div>
              )}

              {/* Week switcher */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0">
                {([1, 2] as const).map((week) => (
                  <button
                    key={week}
                    onClick={() => setActiveWeek(week)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activeWeek === week
                        ? "bg-black text-white shadow-md"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    Entry {week} — Week {week}
                  </button>
                ))}
              </div>

              {/* Billable entries */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest px-1">
                  Billable Project Entries
                </h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <div className="overflow-x-auto w-full max-w-full scrollbar-hide">
                    <table className="w-full text-xs text-left min-w-[800px]">
                      <thead className="bg-gray-900 text-white uppercase tracking-wider font-black text-[10px]">
                        <tr>
                          <th className="px-4 py-3 min-w-[200px]">Project &amp; Phase</th>
                          <th className="px-4 py-3 min-w-[150px]">Description</th>
                          {DAYS.map((day) => (
                            <th key={day} className="px-2 py-3 text-center w-14">
                              {day}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center w-20">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {billableEntries.map((entry: any) => (
                          <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="font-bold text-gray-900">{entry.projectName}</div>
                              <div className="text-[10px] text-blue-600 uppercase font-black tracking-tight">
                                {entry.phaseName}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-500 italic max-w-xs truncate">
                              {entry.description || "--"}
                            </td>
                            {DAYS.map((day) => (
                              <td key={day} className="px-1 py-4 text-center">
                                <span className="inline-block w-full h-9 leading-9 bg-gray-50 border border-gray-200 rounded text-center font-bold">
                                  {Number(entry[DAY_FIELDS[day]]) || 0}
                                </span>
                              </td>
                            ))}
                            <td className="px-4 py-4 text-center">
                              <div className="font-black text-black bg-gray-100/50 py-1 rounded w-12 mx-auto">
                                {rowTotal(entry).toFixed(1)}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {billableEntries.length === 0 && (
                          <tr>
                            <td colSpan={10} className="px-4 py-10 text-center text-gray-400 italic bg-gray-50/30">
                              No billable entries logged for Week {activeWeek}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-blue-50/50 border-t border-blue-100">
                        <tr className="font-black">
                          <td colSpan={9} className="px-4 py-3 text-right text-blue-900 text-[10px] uppercase">
                            Week {activeWeek} Billable:
                          </td>
                          <td className="px-4 py-3 text-center text-blue-900 bg-blue-100/50">
                            {weekBillableTotal.toFixed(1)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Non-billable hours, aggregated across every phase */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between mb-2 gap-4">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">
                      Non-Billable Hours (Labor Overhead)
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                      Totalled across all projects and phases
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Week {activeWeek} Non-Billable Total:
                    </div>
                    <div className="text-sm font-black text-gray-900 bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100">
                      {weekOverheadTotal.toFixed(1)}h
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto w-full max-w-full scrollbar-hide">
                    <table className="w-full text-xs text-left min-w-[800px]">
                      <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-black text-[9px]">
                        <tr>
                          <th className="px-6 py-4 w-1/3">Category</th>
                          {DAYS.map((day) => (
                            <th key={day} className="px-2 py-4 text-center">
                              {day}
                            </th>
                          ))}
                          <th className="px-4 py-4 text-right pr-6">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {overheadRows.map((row) => (
                          <tr key={row.category} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-3 font-bold text-gray-600 group-hover:text-black transition-colors">
                              {row.category}
                            </td>
                            {DAYS.map((day) => (
                              <td key={day} className="px-2 py-3 text-center">
                                <span className="inline-block h-9 w-12 leading-9 mx-auto text-center font-bold bg-white border border-gray-200 rounded-lg text-xs">
                                  {row.days[day]}
                                </span>
                              </td>
                            ))}
                            <td className="px-4 py-3 text-right font-black text-gray-900 pr-6">
                              <span className="bg-gray-100/50 px-2.5 py-1 rounded-lg">{row.total.toFixed(1)}</span>
                            </td>
                          </tr>
                        ))}
                        {overheadRows.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-10 text-center text-gray-400 italic bg-gray-50/30">
                              No non-billable hours logged for Week {activeWeek}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Payroll summary */}
              <div className="bg-black text-white p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Utilization Rate
                    </div>
                    <div className="text-2xl font-black text-blue-400">{utilization.toFixed(0)}%</div>
                  </div>
                  <div className="w-px self-stretch bg-gray-800" />
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Grand Total Time
                    </div>
                    <div className="text-2xl font-black">
                      {totalHours.toFixed(1)} <span className="text-xs text-gray-400">Hours</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {totalBillable.toFixed(1)}h billable · {totalOverhead.toFixed(1)}h overhead
                    </div>
                  </div>
                  <div className="text-gray-600 font-black">&times;</div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Employee's Hourly Rate
                    </div>
                    <div className="text-2xl font-black">{formatCurrency(hourlyRate)}</div>
                  </div>
                  <div className="text-gray-600 font-black">&minus;</div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Total Taxes Owed
                    </div>
                    <button
                      onClick={() => setShowTaxBreakdown((v) => !v)}
                      className="flex items-center gap-1.5 text-2xl font-black text-red-300 hover:text-red-200 transition-colors"
                    >
                      {formatCurrency(breakdown.totalTax)}
                      <ChevronDown
                        size={18}
                        className={`transition-transform ${showTaxBreakdown ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                  <div className="text-gray-600 font-black">=</div>
                  <div className="space-y-1 ml-auto text-right">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Total Cost (Net)
                    </div>
                    <div className="text-2xl font-black text-green-400">{formatCurrency(breakdown.net)}</div>
                    <div className="text-[10px] text-gray-500">
                      Gross {formatCurrency(breakdown.gross)}
                    </div>
                  </div>
                </div>

                {showTaxBreakdown && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 pb-2 border-b border-white/10">
                      <span>Tax Line</span>
                      <span className="flex gap-8">
                        <span>Rate</span>
                        <span className="w-24 text-right">Amount</span>
                      </span>
                    </div>
                    {breakdown.lines.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">
                        No tax lines configured on this employee's profile.
                      </p>
                    ) : (
                      breakdown.lines.map((line) => (
                        <div key={line.id} className="flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-200">{line.label}</span>
                          <span className="flex gap-8 items-center">
                            <span className="text-gray-400">{line.percentage}%</span>
                            <span className="w-24 text-right text-red-300">{formatCurrency(line.amount)}</span>
                          </span>
                        </div>
                      ))
                    )}
                    <div className="flex items-center justify-between text-xs font-black pt-2 border-t border-white/10">
                      <span className="text-gray-300 uppercase tracking-widest text-[10px]">Total</span>
                      <span className="flex gap-8 items-center">
                        <span className="text-gray-400">{breakdown.totalTaxPercentage.toFixed(2)}%</span>
                        <span className="w-24 text-right text-red-300">
                          {formatCurrency(breakdown.totalTax)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center no-pdf"
              data-html2canvas-ignore="true"
            >
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="font-bold flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>

              {showActions ? (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => setDenyOpen(true)}
                    disabled={isApproving || isRejecting}
                    className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white font-black uppercase tracking-widest px-8 transition-all active:scale-95 w-full sm:w-auto"
                  >
                    <XCircle size={16} className="mr-2" />
                    Deny
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="bg-green-600 text-white hover:bg-green-700 font-black uppercase tracking-widest px-8 shadow-lg shadow-green-600/20 transition-all active:scale-95 w-full sm:w-auto"
                  >
                    {isApproving ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} className="mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              ) : (
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {canReview
                    ? `Already ${timecard?.status?.toLowerCase()} — no action available`
                    : "View only"}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deny confirmation — a reason is required and is sent to the employee */}
      <Dialog open={denyOpen} onOpenChange={(o) => !o && setDenyOpen(false)}>
        <DialogContent className="max-w-md bg-white text-black rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Deny this timecard?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium">
              The timecard goes back to {timecard?.user?.name || "the employee"} to correct and resubmit —
              their entries are kept. They'll be notified with the reason below.
            </p>
            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              rows={4}
              autoFocus
              placeholder="What needs to be corrected?"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDenyOpen(false)} className="font-bold">
              Cancel
            </Button>
            <Button
              onClick={handleDeny}
              disabled={isRejecting || !denyReason.trim()}
              className="bg-red-600 text-white hover:bg-red-700 font-black uppercase tracking-widest px-6"
            >
              {isRejecting ? <Loader2 size={16} className="animate-spin" /> : "Confirm Denial"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
