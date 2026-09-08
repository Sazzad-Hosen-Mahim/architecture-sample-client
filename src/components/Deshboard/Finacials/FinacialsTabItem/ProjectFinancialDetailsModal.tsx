"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetProjectFinancialDetailsQuery } from "@/redux/api/financialApi";
import {
  Loader2,
  Clock,
  Users,
  BarChart3,
  Info,
  Download,
  CalendarRange,
  AlertCircle,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { formatCurrency, formatHours, formatPercent } from "@/utils/money";

interface ProjectFinancialDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

const formatHrs = formatHours;

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

/** "Totals" reports every year at once; a year narrows the time-based figures. */
const ALL_YEARS = "all";

const CURRENT_YEAR = new Date().getFullYear();

import { FinancialChart } from "../FinancialChart";

export default function ProjectFinancialDetailsModal({
  open,
  onOpenChange,
  projectId,
}: ProjectFinancialDetailsModalProps) {
  // Which year the burn, cost and labor breakdown are scoped to. Overhead is
  // booked to the year of the timecard it arrived on, so this is what keeps a
  // project that runs across New Year readable one year at a time.
  const [yearFilter, setYearFilter] = useState<string>(ALL_YEARS);

  // A different project starts on its running totals rather than inheriting
  // the year the last one was left on.
  useEffect(() => {
    setYearFilter(ALL_YEARS);
  }, [projectId]);

  // `currentData` — not `data` — is the card for the project currently asked
  // for. `data` deliberately holds the last successful result for the whole
  // endpoint, so reading it flashed the previous project's money for a second
  // after opening a different one.
  const {
    currentData: details,
    isFetching,
    isError,
    error,
  } = useGetProjectFinancialDetailsQuery(
    {
      id: projectId,
      year: yearFilter === ALL_YEARS ? undefined : Number(yearFilter),
    },
    { skip: !open || !projectId },
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("project-financial-content");
    if (!element) return;

    setIsGeneratingPDF(true);

    // Temporarily hide no-pdf elements
    const noPdfElements = element.querySelectorAll<HTMLElement>(
      ".no-pdf, [data-html2canvas-ignore]",
    );
    noPdfElements.forEach((el) => {
      el.style.display = "none";
    });

    // Expand scroll-clipped containers so full content renders
    const clipped = element.querySelectorAll<HTMLElement>(
      '[class*="overflow"], [class*="max-h"]',
    );
    const savedStyles: {
      el: HTMLElement;
      overflow: string;
      maxHeight: string;
      height: string;
    }[] = [];
    clipped.forEach((el) => {
      savedStyles.push({
        el,
        overflow: el.style.overflow,
        maxHeight: el.style.maxHeight,
        height: el.style.height,
      });
      el.style.overflow = "visible";
      el.style.maxHeight = "none";
      el.style.height = "auto";
    });

    try {
      // html-to-image uses SVG foreignObject — browser handles oklab() natively, no parse errors
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => {
        img.onload = res;
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = pdfW / img.width;
      const scaledH = img.height * ratio;

      let remaining = scaledH;
      let page = 0;
      while (remaining > 0) {
        pdf.addImage(
          dataUrl,
          "PNG",
          0,
          page === 0 ? 0 : -(scaledH - remaining),
          pdfW,
          scaledH,
        );
        remaining -= pdfH;
        if (remaining > 0) pdf.addPage();
        page++;
      }

      const fileName = `Project-Financial-${details?.projectName?.replace(/\s+/g, "-") || "Report"}-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (err: any) {
      const msg = err?.message || String(err) || "Unknown error";
      console.error("PDF generation failed:", err);
      toast.error(`PDF Error: ${msg}`);
    } finally {
      noPdfElements.forEach((el) => {
        el.style.display = "";
      });
      savedStyles.forEach(({ el, overflow, maxHeight, height }) => {
        el.style.overflow = overflow;
        el.style.maxHeight = maxHeight;
        el.style.height = height;
      });
      setIsGeneratingPDF(false);
    }
  };

  // Show the ring while a request is in flight, and whenever there is no card
  // for this exact project/year yet — never the last project's figures.
  if (isFetching || (!details && !isError)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] p-20 bg-white">
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // A failed fetch used to render nothing at all, which made View Detail look
  // like a dead button. Say what went wrong instead.
  if (isError || !details) {
    const message =
      (error as any)?.data?.message ||
      "This project's financial details could not be loaded.";
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <AlertCircle size={18} className="text-red-500" />
              Financial details unavailable
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 font-medium">{message}</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="bg-black cursor-pointer text-white px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const yearOptions: number[] = details.availableYears || [];
  const runYears = (details.yearlyBreakdown || []) as any[];

  // The amendment total in the header is tax-inclusive; the work it paid for
  // is not. Split out so the header can show both instead of only the sum.
  const amendmentRows = (details.amendments || []) as any[];
  const amendmentWorkTotal = amendmentRows.reduce(
    (sum, a) => sum + Number(a.servicesSubtotal || 0),
    0,
  );
  const amendmentTaxTotal = amendmentRows.reduce(
    (sum, a) => sum + Number(a.taxAmount || 0),
    0,
  );

  //   const profitMargin =
  //     details.projectCost > 0 ? (details.profit / details.projectCost) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-[100vw] sm:max-w-[1000px] max-h-[90vh] flex flex-col bg-white text-black p-0 border-none overflow-hidden font-semibold">
        <div
          id="project-financial-content"
          className="w-full max-w-full overflow-x-hidden flex flex-col flex-1 min-h-0"
        >
          <DialogHeader className="px-4 lg:px-8 py-4 sm:py-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mt-5">
              <div className="space-y-1 w-full sm:w-auto">
                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 break-words">
                  {details.projectName}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider break-words">
                  Client: {details.clientName}
                </p>
              </div>
              <div className="text-left sm:text-right space-y-1 w-full sm:w-auto bg-gray-100/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">
                  Project Valuation
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-500">
                    Original:{" "}
                    {formatCurrency(
                      details.grossOriginalCost ||
                        details.grossProjectCost ||
                        details.projectCost,
                    )}
                  </div>
                  {(details.totalAmendmentAmount || 0) > 0 && (
                    <div className="text-xs font-bold text-amber-600">
                      Amendments: +
                      {formatCurrency(details.totalAmendmentAmount)}
                      {/* Where that figure comes from, said here rather than
                          left to be pieced together from the amendments table
                          further down: the amendment work and the tax on it
                          are different numbers, and showing only the sum makes
                          a $6,500 amendment read as $7,020 for no visible
                          reason. */}
                      {amendmentTaxTotal > 0 && (
                        <div className="text-[10px] font-bold text-amber-500/80 normal-case">
                          {formatCurrency(amendmentWorkTotal)} work +{" "}
                          {formatCurrency(amendmentTaxTotal)} tax
                        </div>
                      )}
                    </div>
                  )}
                  {details.totalProjectRefunds > 0 && (
                    <div className="text-xs font-bold text-red-500">
                      Refunds: -{formatCurrency(details.totalProjectRefunds)}
                    </div>
                  )}
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 pt-1 border-t border-gray-100">
                    {formatCurrency(details.projectCost)}
                    <span className="text-[10px] ml-1 text-gray-400 uppercase font-black tracking-tighter">
                      Net
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-8 overflow-y-auto overflow-x-hidden w-full max-w-full space-y-6 sm:space-y-10 flex-1 min-h-0">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 cursor-crosshair gap-3 sm:gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 group hover:bg-black hover:text-white transition-all duration-300 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500">
                  <Clock size={14} className="group-hover:text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Amount Burned
                  </span>
                </div>
                <div className="text-xl font-black">
                  {formatCurrency(
                    details.amountBurned ??
                      details.burnedFee + (details.totalOverheadBurned || 0),
                  )}
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                  Labor burned {formatCurrency(details.burnedFee)} + Overhead
                  burned{" "}
                  {formatCurrency(
                    details.totalOverheadBurned ||
                      details.projectOverheadAllocation ||
                      0,
                  )}{" "}
                  · {formatCurrency(details.firmBillingRate)}/hr
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 group hover:bg-black hover:text-white transition-all duration-300 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500">
                  <BarChart3 size={14} className="group-hover:text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Remaining Budget
                  </span>
                </div>
                <div
                  className={`text-xl font-black ${details.remainingBudget < 0 ? "text-red-500" : ""}`}
                >
                  {formatCurrency(details.remainingBudget)}
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                  Contract fee{" "}
                  {formatCurrency(
                    details.totalContractFee ?? details.grandTotals?.price ?? 0,
                  )}{" "}
                  − cost incurred
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 group hover:bg-black hover:text-white transition-all duration-300 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500">
                  <Users size={14} className="group-hover:text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Project Cost
                  </span>
                </div>
                <div className="text-xl font-black">
                  {formatCurrency(
                    details.totalCostIncurred ?? details.totalLaborCost,
                  )}
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                  Total cost incurred · pay + overhead
                </p>
              </div>
              {/* <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 group hover:bg-black hover:text-white transition-all duration-300 shadow-sm">
                                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500">
                                        <BarChart3 size={14} className="group-hover:text-amber-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Project Overhead</span>
                                    </div>
                                <div className="text-xl font-black">{formatCurrency(details.projectOverheadAllocation)}</div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Non-Billable × ${details.firmBillingRate}/hr</p>
                            </div> */}
              {(details.totalAmendmentAmount || 0) > 0 && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-2 group hover:bg-amber-900 hover:text-white transition-all duration-300 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-500 group-hover:text-amber-300">
                    <BarChart3 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Amendment Revenue
                    </span>
                  </div>
                  <div className="text-xl font-black text-amber-700 group-hover:text-white">
                    {formatCurrency(details.totalAmendmentAmount)}
                  </div>
                  <p className="text-[9px] text-amber-500 group-hover:text-amber-300 font-bold uppercase tracking-tight">
                    {details.amendments?.length || 0} Amendment
                    {(details.amendments?.length || 0) !== 1 ? "s" : ""} •{" "}
                    {formatCurrency(details.totalAmendmentPaid || 0)} Collected
                  </p>
                </div>
              )}
            </div>

            {/* Contract split across the years the project runs.
                The contract is earned over the days the project is actually
                running, so one that rolls into the next year is shared between
                them by day count — which is what keeps each year's total on
                the Financial Dashboard right. */}
            {runYears.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                  Contract Split By Year
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Start Date
                    </div>
                    <div className="text-sm font-black mt-1">
                      {formatDate(details.projectStartedAt)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      End Date
                    </div>
                    <div className="text-sm font-black mt-1">
                      {details.projectCompletedAt
                        ? formatDate(details.projectCompletedAt)
                        : "In Progress"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Total Days
                    </div>
                    <div className="text-sm font-black mt-1">
                      {runYears.map((r) => r.days).join("/")}
                      {runYears.length > 1 && (
                        <span className="text-gray-400 font-bold">
                          {" "}
                          = {details.totalRunDays}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="border border-gray-100 rounded-2xl overflow-x-auto shadow-sm">
                  <table className="w-full text-[11px] text-left min-w-[520px]">
                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-black text-[9px]">
                      <tr>
                        <th className="px-4 py-4">Year</th>
                        <th className="px-4 py-4">Days</th>
                        <th className="px-4 py-4">Share</th>
                        <th className="px-4 py-4">Original Contract</th>
                        <th className="px-4 py-4">Amendment Contract</th>
                        <th className="px-4 py-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {runYears.map((row) => (
                        <tr key={row.year} className="hover:bg-gray-50/50">
                          <td className="px-4 py-4 font-black text-gray-900">
                            {row.year}
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-700">
                            {row.days}
                          </td>
                          <td className="px-4 py-4 text-gray-600 font-bold">
                            {formatPercent((row.share || 0) * 100)}
                          </td>
                          <td className="px-4 py-4 text-blue-600 font-black">
                            {formatCurrency(row.originalAmount)}
                          </td>
                          <td className="px-4 py-4 text-amber-600 font-black">
                            {formatCurrency(row.amendmentAmount)}
                          </td>
                          <td className="px-4 py-4 text-right font-black text-gray-900">
                            {formatCurrency(row.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-900 text-white">
                      <tr>
                        <td className="px-4 py-4 font-black uppercase tracking-wider">
                          Total
                        </td>
                        <td className="px-4 py-4 font-black text-gray-100">
                          {details.totalRunDays}
                        </td>
                        <td className="px-4 py-4 font-black text-gray-300">
                          {formatPercent(100)}
                        </td>
                        <td className="px-4 py-4 font-black text-blue-300">
                          {formatCurrency(details.grossOriginalCost)}
                        </td>
                        <td className="px-4 py-4 font-black text-amber-300">
                          {formatCurrency(details.totalAmendmentAmount)}
                        </td>
                        <td className="px-4 py-4 text-right font-black text-gray-100">
                          {formatCurrency(details.grossProjectCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Phases Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                Real-Time Project Phase Profit Tracking
              </h4>
              <div className="border border-gray-100 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-[11px] text-left min-w-[760px]">
                  <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-black text-[9px]">
                    <tr>
                      <th className="px-4 py-4">Phase Name</th>
                      <th className="px-4 py-4">Contract Fee</th>
                      <th className="px-4 py-4">Billable Hrs</th>
                      <th className="px-4 py-4">Labor Burned</th>
                      <th className="px-4 py-4">Non-Billable Hrs</th>
                      <th className="px-4 py-4">Overhead Burned</th>
                      <th className="px-4 py-4 text-right">Profit / Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(() => {
                      const hasAmendmentPhases = details.phases.some(
                        (p: any) => p.isAmendment,
                      );
                      let lastLabel: string | null = null;
                      return details.phases.map((phase: any) => {
                        const showGroup =
                          hasAmendmentPhases &&
                          phase.contractLabel &&
                          phase.contractLabel !== lastLabel;
                        lastLabel = phase.contractLabel || lastLabel;
                        return (
                          <Fragment key={phase.id}>
                            {showGroup && (
                              <tr className="bg-gray-50/80">
                                <td
                                  colSpan={7}
                                  className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${
                                    phase.isAmendment
                                      ? "text-amber-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {phase.contractLabel}
                                </td>
                              </tr>
                            )}
                            <tr className="hover:bg-gray-50/50">
                              <td className="px-4 py-4">
                                <div className="font-bold text-gray-900">
                                  {phase.name}
                                </div>
                                <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5">
                                  <Clock size={10} />{" "}
                                  {formatDuration(phase.accumulatedTime)}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-blue-600 font-black">
                                {formatCurrency(phase.price)}
                              </td>
                              <td className="px-4 py-4 font-bold text-gray-900">
                                {formatHrs(phase.billableHours)}
                              </td>
                              <td className="px-4 py-4 font-bold text-gray-700">
                                {formatCurrency(phase.laborBurned)}
                              </td>
                              <td className="px-4 py-4 text-gray-600">
                                {formatHrs(phase.nonBillableHours)}
                              </td>
                              <td className="px-4 py-4 text-gray-600">
                                {formatCurrency(phase.overheadBurned)}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div
                                  className={`font-black ${phase.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatCurrency(phase.profit)}
                                </div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">
                                  {formatPercent(phase.profitMargin)} Margin
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        );
                      });
                    })()}

                    {/* Hours logged against a phase that is no longer on the
                        contract. They are already inside the Grand Total, so
                        showing them here is what makes the columns add up —
                        previously they were counted but never displayed, and
                        the rows looked as though they were missing time. */}
                    {details.unassignedPhaseRow && (
                      <>
                        <tr className="bg-amber-50/70">
                          <td
                            colSpan={7}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700"
                          >
                            Unassigned
                          </td>
                        </tr>
                        <tr className="bg-amber-50/30">
                          <td className="px-4 py-4">
                            <div className="font-bold text-sm text-gray-900">
                              {details.unassignedPhaseRow.name}
                            </div>
                            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                              {details.unassignedPhaseRow.note}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-400">—</td>
                          <td className="px-4 py-4 font-bold text-gray-900">
                            {formatHrs(
                              details.unassignedPhaseRow.billableHours,
                            )}
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-900">
                            {formatCurrency(
                              details.unassignedPhaseRow.laborBurned,
                            )}
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-900">
                            {formatHrs(
                              details.unassignedPhaseRow.nonBillableHours,
                            )}
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-900">
                            {formatCurrency(
                              details.unassignedPhaseRow.overheadBurned,
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="font-black text-sm text-red-600">
                              {formatCurrency(
                                details.unassignedPhaseRow.profit,
                              )}
                            </div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase">
                              No fee
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                  {details.grandTotals && (
                    <tfoot className="bg-gray-900 text-white">
                      <tr>
                        <td className="px-4 py-4">
                          <div className="font-black text-sm uppercase tracking-wider">
                            Grand Totall
                          </div>
                          <div className="text-[9px] text-gray-400 font-bold mt-0.5">
                            {(details.grandTotals.amendmentBillableHours || 0) >
                              0 ||
                            (details.grandTotals.amendmentNonBillableHours ||
                              0) > 0 ? (
                              <>
                                {(
                                  details.grandTotals.originalBillableHours || 0
                                ).toFixed(2)}{" "}
                                orig +{" "}
                                {(
                                  details.grandTotals.amendmentBillableHours ||
                                  0
                                ).toFixed(2)}{" "}
                                amend. billable ·{" "}
                                {(
                                  details.grandTotals
                                    .originalNonBillableHours || 0
                                ).toFixed(2)}{" "}
                                orig +{" "}
                                {(
                                  details.grandTotals
                                    .amendmentNonBillableHours || 0
                                ).toFixed(2)}{" "}
                                amend. non-billable
                              </>
                            ) : (
                              <>
                                {(
                                  details.grandTotals.billableHours ||
                                  details.grandTotals.actualHours ||
                                  0
                                ).toFixed(2)}{" "}
                                billable hrs /{" "}
                                {(
                                  details.grandTotals.nonBillableHours || 0
                                ).toFixed(2)}{" "}
                                non-billable hrs
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-black text-blue-300">
                          {formatCurrency(details.grandTotals.price)}
                        </td>
                        <td className="px-4 py-4 font-black text-gray-100">
                          {formatHrs(
                            details.grandTotals.billableHours ??
                              details.grandTotals.actualHours,
                          )}
                        </td>

                        <td className="px-4 py-4 font-black text-amber-300">
                          {formatCurrency(
                            details.grandTotals.laborBurned ??
                              details.grandTotals.burned,
                          )}
                        </td>
                        <td className="px-4 py-4 font-black text-gray-300">
                          {formatHrs(details.grandTotals.nonBillableHours)}
                        </td>
                        <td className="px-4 py-4 font-black text-gray-300">
                          {formatCurrency(
                            details.grandTotals.overheadBurned ??
                              details.grandTotals.overhead,
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div
                            className={`font-black text-sm ${details.grandTotals.profit >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            {formatCurrency(details.grandTotals.profit)}
                          </div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">
                            {formatPercent(details.grandTotals.profitMargin)}{" "}
                            Margin
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Why the Contract Fee column doesn't equal the valuation at the
                  top of the card: phase fees are net of tax, the valuation is
                  tax-inclusive and net of refunds. Shown rather than left for
                  the reader to work out — a $6,500 amendment displayed as
                  "+$7,020" up top reads as an arithmetic error otherwise. */}
              {details.feeReconciliation &&
                (details.feeReconciliation.contractTaxAmount > 0 ||
                  details.feeReconciliation.approvedRefunds > 0) && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                      Contract fee reconciliation
                    </p>
                    <dl className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">
                          Phase fees (net of tax)
                        </dt>
                        <dd className="font-bold text-gray-900">
                          {formatCurrency(
                            details.feeReconciliation.phaseFeeTotal,
                          )}
                        </dd>
                      </div>
                      {details.feeReconciliation.contractTaxAmount > 0 && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Contract tax</dt>
                          <dd className="font-bold text-gray-900">
                            +{" "}
                            {formatCurrency(
                              details.feeReconciliation.contractTaxAmount,
                            )}
                          </dd>
                        </div>
                      )}
                      {details.feeReconciliation.approvedRefunds > 0 && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Approved refunds</dt>
                          <dd className="font-bold text-red-600">
                            −{" "}
                            {formatCurrency(
                              details.feeReconciliation.approvedRefunds,
                            )}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                        <dt className="font-bold text-gray-900">
                          Net project valuation
                        </dt>
                        <dd className="font-black text-gray-900">
                          {formatCurrency(
                            details.feeReconciliation.netValuation,
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
            </div>

            {/* Employee Labor Breakdown */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-l-4 border-black pl-3">
                  Direct Labor Breakdown
                </h4>
                {/* Overhead is booked to the year of the timecard it arrived
                    on, so this keeps a project that runs across New Year
                    readable one year at a time. */}
                <div
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl no-pdf"
                  data-html2canvas-ignore="true"
                >
                  <CalendarRange size={14} className="text-gray-400" />
                  <select
                    className="text-xs bg-transparent outline-none font-bold text-gray-700 cursor-pointer"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <option value={ALL_YEARS}>Total(s)</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                        {y === CURRENT_YEAR
                          ? " (Current Year)"
                          : y === CURRENT_YEAR - 1
                            ? " (Previous Year)"
                            : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {yearFilter !== ALL_YEARS && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  Showing hours and cost from timecards submitted in{" "}
                  {yearFilter}. Contract figures above cover the whole project.
                </p>
              )}
              <div className="border border-gray-100 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-xs text-left min-w-[720px]">
                  <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-black text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-4 py-4">Hourly Rate</th>
                      <th className="px-4 py-4">Billable Hrs</th>
                      <th className="px-4 py-4">Labor Cost</th>
                      <th className="px-4 py-4">Non-Billable Hrs</th>
                      <th className="px-4 py-4">Overhead Cost</th>
                      <th className="px-4 py-4 text-right">Cost Incurred</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {details.employees.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-gray-900">
                              {emp.name}
                            </div>
                            {emp.role && (
                              <span
                                className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                                  emp.role === "PROJECT_MANAGER"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : emp.role === "DRAFTER"
                                      ? "bg-purple-50 text-purple-600 border-purple-200"
                                      : emp.role === "SUPER_ADMIN" ||
                                          emp.role === "ADMIN"
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                }`}
                              >
                                {emp.role.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 lowercase">
                            {emp.email}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600 font-bold">
                          {formatCurrency(emp.hourlyRate)}/hr
                        </td>
                        <td className="px-4 py-4 font-black">
                          {formatHrs(emp.totalBillableHours)}
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-bold">
                          {formatCurrency(emp.laborCost ?? emp.cost)}
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {formatHrs(emp.nonBillableHours)}
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {formatCurrency(emp.overheadCost)}
                        </td>
                        <td className="px-4 py-4 text-right font-black text-red-600">
                          {formatCurrency(emp.costIncurred ?? emp.cost)}
                        </td>
                      </tr>
                    ))}
                    {details.employees.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-gray-400 italic font-medium"
                        >
                          No billable labor recorded for this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {details.laborBreakdownTotals &&
                    details.employees.length > 0 && (
                      <tfoot className="bg-gray-900 text-white">
                        <tr>
                          <td className="px-6 py-4">
                            <div className="font-black text-sm uppercase tracking-wider">
                              Total
                            </div>
                            {(details.laborBreakdownTotals
                              .billableHoursAmendment || 0) > 0 ||
                            (details.laborBreakdownTotals
                              .nonBillableHoursAmendment || 0) > 0 ? (
                              <div className="text-[9px] text-gray-400 font-bold mt-0.5">
                                {(
                                  details.laborBreakdownTotals
                                    .billableHoursOriginal || 0
                                ).toFixed(2)}{" "}
                                orig +{" "}
                                {(
                                  details.laborBreakdownTotals
                                    .billableHoursAmendment || 0
                                ).toFixed(2)}{" "}
                                amend. billable ·{" "}
                                {(
                                  details.laborBreakdownTotals
                                    .nonBillableHoursOriginal || 0
                                ).toFixed(2)}{" "}
                                orig +{" "}
                                {(
                                  details.laborBreakdownTotals
                                    .nonBillableHoursAmendment || 0
                                ).toFixed(2)}{" "}
                                amend. non-billable
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-4" />
                          <td className="px-4 py-4 font-black text-gray-100">
                            {formatHrs(
                              details.laborBreakdownTotals.billableHours,
                            )}
                          </td>
                          <td className="px-4 py-4 font-black text-gray-100">
                            {formatCurrency(
                              details.laborBreakdownTotals.laborCost,
                            )}
                          </td>
                          <td className="px-4 py-4 font-black text-gray-300">
                            {formatHrs(
                              details.laborBreakdownTotals.nonBillableHours,
                            )}
                          </td>
                          <td className="px-4 py-4 font-black text-gray-300">
                            {formatCurrency(
                              details.laborBreakdownTotals.overheadCost,
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-black text-red-400">
                            {formatCurrency(
                              details.laborBreakdownTotals.costIncurred,
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                </table>
              </div>
            </div>

            {/* Amendment Proposals Breakdown */}
            {details.amendments && details.amendments.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                  Amendment Proposals
                </h4>
                <div className="border border-gray-100 rounded-2xl overflow-x-auto shadow-sm">
                  <table className="w-full text-[11px] text-left min-w-[500px]">
                    <thead className="bg-amber-50 text-gray-400 uppercase tracking-wider font-black text-[9px]">
                      <tr>
                        <th className="px-4 py-4">Amendment</th>
                        <th className="px-4 py-4">Services</th>
                        <th className="px-4 py-4">Amount</th>
                        <th className="px-4 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {details.amendments.map((amendment: any) => (
                        <tr key={amendment.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-4">
                            <div className="font-bold text-gray-900">
                              {amendment.title}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              {amendment.proposalNumber}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {amendment.services.map((s: any) => (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between gap-4"
                                >
                                  <span className="text-gray-600 truncate max-w-[140px]">
                                    {s.name}
                                  </span>
                                  <span className="text-gray-900 font-bold whitespace-nowrap">
                                    {formatCurrency(s.amount)}
                                  </span>
                                </div>
                              ))}

                              {/* The service lines are net of tax. Without
                                  these two rows they simply don't add up to
                                  the amount beside them, which reads as a
                                  miscalculation rather than as tax. */}
                              {amendment.taxAmount > 0 && (
                                <>
                                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-200">
                                    <span className="text-gray-500">
                                      Subtotal
                                    </span>
                                    <span className="text-gray-700 font-bold whitespace-nowrap">
                                      {formatCurrency(
                                        amendment.servicesSubtotal,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-gray-500">Tax</span>
                                    <span className="text-gray-700 font-bold whitespace-nowrap">
                                      + {formatCurrency(amendment.taxAmount)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-amber-600 font-black">
                              {formatCurrency(amendment.amount)}
                            </div>
                            {amendment.taxAmount > 0 && (
                              <div className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                                incl. tax
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {amendment.paid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black rounded-full border border-green-200 uppercase tracking-wider">
                                ✓ Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-full border border-red-200 uppercase tracking-wider">
                                Unpaid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-amber-900 text-white">
                      <tr>
                        <td
                          className="px-4 py-3 font-black uppercase tracking-wider"
                          colSpan={2}
                        >
                          Total Amendments
                          {details.amendments.some(
                            (a: any) => a.taxAmount > 0,
                          ) && (
                            <div className="text-[9px] font-bold text-amber-200/70 normal-case tracking-normal mt-0.5">
                              {formatCurrency(
                                details.amendments.reduce(
                                  (s: number, a: any) =>
                                    s + Number(a.servicesSubtotal || 0),
                                  0,
                                ),
                              )}{" "}
                              of work +{" "}
                              {formatCurrency(
                                details.amendments.reduce(
                                  (s: number, a: any) =>
                                    s + Number(a.taxAmount || 0),
                                  0,
                                ),
                              )}{" "}
                              tax
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-black text-amber-200">
                          {formatCurrency(details.totalAmendmentAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-200">
                          {formatCurrency(details.totalAmendmentPaid || 0)}{" "}
                          Collected
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Profitability Analysis */}
            {/* <div className="bg-black text-white p-4 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all duration-700 group-hover:bg-blue-500/20"></div>
                            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
                                        <BarChart3 size={14} className="text-blue-500" />
                                        Profitability Analysis
                                    </h4>
                                    <div className="space-y-1">
                                        <div className="text-2xl sm:text-4xl font-black tracking-tight flex items-baseline gap-3">
                                            {profitMargin.toFixed(1)}%
                                            <span className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-widest">Profit Margin</span>
                                        </div>
                                        <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                                            Calculated based on contract value vs. total labor and overhead allocation.
                                            {profitMargin > 20 ? " Exceptional project performance." : " Monitor labor efficiency carefully."}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right space-y-1 w-full sm:w-auto border-t border-gray-800 sm:border-none pt-4 sm:pt-0">
                                    <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Net Gain</div>
                                    <div className={`text-2xl sm:text-4xl font-black ${details.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {formatCurrency(details.profit)}
                                    </div>
                                </div>
                            </div>
                        </div> */}

            {/* Project averages. The plot itself is off here — see
                `showGraph` — so the heading names what is actually shown
                rather than promising a history chart that isn't there. */}
            <div className="space-y-4 no-pdf" data-html2canvas-ignore="true">
              <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                Financial Performance Summary
              </h4>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <FinancialChart projectId={projectId} showGraph={false} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
              <Info size={16} className="text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-wider leading-relaxed">
                Overhead burned is each timecard's locked billing rate
                (currently {formatCurrency(details.firmBillingRate)}/hr) × its
                non-billable hours (
                {formatHours(details.totalProjectNonBillableHours)} in total). A
                rate change only applies to timecards approved after it.
              </p>
            </div>
          </div>
        </div>

        <div
          className="px-4 sm:px-8 py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 no-pdf flex-shrink-0"
          data-html2canvas-ignore="true"
        >
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-gray-100 w-full cursor-pointer sm:w-auto text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="bg-black cursor-pointer w-full sm:w-auto text-white px-10 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
          >
            Close Summary
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
