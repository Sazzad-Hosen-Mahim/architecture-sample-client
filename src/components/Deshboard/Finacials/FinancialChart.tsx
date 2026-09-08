import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { useGetFinancialHistoryQuery } from "@/redux/api/financialApi";
import { formatCurrency, formatPercent } from "@/utils/money";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/** Axis colours — each axis is tinted to match the series that reads off it. */
const AMOUNT_AXIS_COLOR = "#4b5563";
const UTILIZATION_COLOR = "rgb(249, 115, 22)";

/**
 * How far the firm-wide amount axis sits above the average monthly net
 * revenue, so the series are not pinned to the top of the plot area.
 */
const FIRM_AXIS_HEADROOM = 100000;

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/**
 * Firm-wide totals, taken straight from the Financial Summary so the stat
 * cards below the chart always agree with the panel above it.
 */
export interface FirmTotals {
  netRevenue: number;
  totalCosts: number;
  totalProfit: number;
  /** All billable hours / all timecard hours, already as a percentage. */
  utilization: number;
}

interface FinancialChartProps {
  projectId?: string;
  /** Firm-wide only: "all" spans the firm's whole history, "year" one year. */
  scope?: "all" | "year";
  year?: number;
  totals?: FirmTotals;
  /**
   * Draw the plot itself. Off leaves the averages below it in place — the
   * project tracking modal wants those figures without the graph, which on a
   * single-month project is one dot and a legend and says nothing the cards
   * don't say better.
   */
  showGraph?: boolean;
}

export function FinancialChart({
  projectId,
  scope,
  year,
  totals,
  showGraph = true,
}: FinancialChartProps) {
  // `currentData` is the history for the project/scope being asked for right
  // now; `data` keeps the previous one alive across an arg change, which drew
  // the last project's chart for a moment after switching.
  const { currentData: data, isFetching, isError } = useGetFinancialHistoryQuery(
    projectId ? { projectId } : { scope, year }
  );
  const history = data?.history;
  const summary = data?.summary ?? null;

  // A failed request falls through to the empty state below rather than
  // spinning forever on data that is never going to arrive.
  if (isFetching || (!data && !isError)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[400px] bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[400px] bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="text-sm text-gray-500 font-medium">No financial data available for the chart.</p>
      </div>
    );
  }

  const months = history.map((h) => h.month);
  const totalRevenue = history.map((h) => h.revenue);
  const totalCost = history.map((h) => h.totalCost);
  const profit = history.map((h) => h.profit);
  const utilization = history.map((h) => h.utilization);

  // Firm-wide cards divide the Financial Summary totals by the months on the
  // chart (12 for a single year), so they always reconcile with the panel
  // above. Project cards keep their own summary. Averaging the monthly buckets
  // - the old behaviour - never matched either.
  const monthCount = history.length || 12;

  const avgRevenue = totals
    ? totals.netRevenue / monthCount
    : summary
      ? summary.avgMonthlyRevenue
      : totalRevenue.reduce((a, b) => a + b, 0) / (totalRevenue.length || 1);
  const avgCost = totals
    ? totals.totalCosts / monthCount
    : summary
      ? summary.avgMonthlyCost
      : totalCost.reduce((a, b) => a + b, 0) / (totalCost.length || 1);
  const avgProfit = totals
    ? totals.totalProfit / monthCount
    : summary
      ? summary.avgMonthlyProfit
      : profit.reduce((a, b) => a + b, 0) / (profit.length || 1);
  const avgUtil = totals
    ? totals.utilization
    : summary
      ? summary.utilization
      : utilization.reduce((a, b) => a + b, 0) / (utilization.length || 1);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: "Total Revenue",
        // Plotted at its true value. This line used to be lifted $10,000 so it
        // stayed clear of Cost/Profit, which meant a $6 contract drew a
        // $12,000 axis and a tooltip that disagreed with the stat cards.
        data: totalRevenue,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        yAxisID: "y",
      },
      {
        label: "Total Cost",
        data: totalCost,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        yAxisID: "y",
      },
      {
        label: "Profit",
        data: profit,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        yAxisID: "y",
      },
      {
        label: "Utilization (%)",
        data: utilization,
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.5)",
        yAxisID: "y1",
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: projectId ? "Project Financial Performance" : "Firm-wide Financial Performance Overview",
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: { bottom: 20 }
      },
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        }
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              if (label.includes("Utilization")) {
                label += formatPercent(context.parsed.y);
              } else {
                label += formatCurrency(context.parsed.y);
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      // Amount on the left, Utilization opposite it on the right. Each axis is
      // tinted to match the series that reads off it, and the utilization line
      // is dashed, so it stays clear which scale a line belongs to.
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        stacked: false,
        title: {
          display: true,
          text: "Amount ($)",
          color: AMOUNT_AXIS_COLOR,
          font: { weight: 'bold' }
        },
        grid: {
          color: '#f3f4f6',
        },
        // Firm-wide: sit $100,000 above the average monthly net revenue.
        // A project scales to its own contract instead, so a $6 project reads
        // in dollars rather than against a fixed five-figure axis.
        beginAtZero: true,
        suggestedMax: projectId ? undefined : avgRevenue + FIRM_AXIS_HEADROOM,
        ticks: {
          color: AMOUNT_AXIS_COLOR,
          callback: (value) => '$' + value.toLocaleString()
        }
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Utilization (%)",
          color: UTILIZATION_COLOR,
          font: { weight: 'bold' }
        },
        grid: {
          // Only the amount axis draws gridlines, otherwise two sets of
          // horizontal rules overlap at different intervals.
          drawOnChartArea: false,
        },
        border: { color: UTILIZATION_COLOR },
        min: 0,
        max: 100,
        ticks: {
          color: UTILIZATION_COLOR,
          callback: (value) => value + '%'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  // For a project the stat cards come straight from the project totals:
  //   Avg Monthly Revenue = Total Contract / Total Project Months
  //   Avg Monthly Cost    = Total Cost Incurred / Total Project Months
  //   Avg Monthly Profit  = Avg Monthly Revenue - Avg Monthly Cost
  //   Avg Utilization     = Billable Hours / (Billable + Non-Billable Hours)
  // The firm-wide chart keeps averaging its 12 monthly buckets.
  // The averages divide by at least one month, so the caption has to name the
  // divisor actually used rather than the elapsed time.
  const divisorMonths = summary
    ? (summary.monthsForAverage ?? Math.max(1, summary.totalMonths))
    : 12;
  const monthsLabel = summary
    ? `${divisorMonths.toFixed(2)} month${divisorMonths === 1 ? "" : "s"}`
    : "12";

  return (
    <div className="space-y-6">
      {summary && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/40 border border-blue-100 rounded-xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</p>
              <p className="text-xs font-bold text-gray-800">{formatShortDate(summary.startDate)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {summary.isCompleted ? "End Date" : "Today"}
              </p>
              <p className="text-xs font-bold text-gray-800">{formatShortDate(summary.endDate)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Project Time</p>
              <p className="text-xs font-bold text-gray-800">
                {summary.totalDays} days &middot; {summary.totalMonths.toFixed(2)} months
              </p>
            </div>
          </div>
          {!summary.isStarted && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-1">
              Timer not started &mdash; measured from project creation
            </span>
          )}
        </div>
      )}
      {/* Legend and plot travel together — a legend with nothing to describe
          is just noise above the averages. */}
      {showGraph && (
      <div className="flex flex-wrap gap-6 justify-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Revenue</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Cost</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Profit</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Dashed swatch mirrors the dashed line — it reads off the % axis */}
          <div className="w-4 h-0 border-t-2 border-dashed border-orange-500"></div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Utilization <span className="text-gray-400">(%)</span>
          </span>
        </div>
      </div>
      )}

      {showGraph && (
      <div className="h-[250px] sm:h-[400px] w-full bg-white p-2">
        <Line
          options={options}
          data={{
            ...chartData,
            datasets: chartData.datasets.map((dataset) => ({
              ...dataset,
              tension: 0.4,
              // Dashed = reads off the Utilization (%) axis, not dollars.
              borderDash: dataset.yAxisID === "y1" ? [6, 4] : undefined,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: dataset.borderColor,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              borderWidth: 3,
              fill: dataset.label === "Profit" ? "origin" : false,
              backgroundColor:
                dataset.label === "Profit"
                  ? "rgba(34, 197, 94, 0.08)"
                  : dataset.backgroundColor,
            })),
          }}
        />
      </div>
      )}

      {/* The averages stay whatever `showGraph` is — they are the point of
          this block, not a caption for the plot. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Avg Monthly Net Revenue',
            value: avgRevenue,
            color: 'blue',
            sub: totals
              ? `Net revenue / ${monthCount}`
              : summary ? `Total contract / ${monthsLabel}` : 'Total revenue / 12',
          },
          {
            label: 'Avg Monthly Cost',
            value: avgCost,
            color: 'red',
            sub: totals
              ? `Total costs / ${monthCount}`
              : summary ? `Total cost incurred / ${monthsLabel}` : 'Total costs / 12',
          },
          {
            label: 'Avg Monthly Profit',
            value: avgProfit,
            color: 'green',
            sub: totals
              ? `Total profit / ${monthCount}`
              : summary ? 'Avg revenue - avg cost' : 'Total profit / 12',
          },
          {
            label: 'Avg Utilization',
            value: avgUtil,
            color: 'amber',
            sub: totals
              ? 'Billable / total timecard hours'
              : summary ? 'Billable / total project hours' : 'Last 12 months avg',
            isPct: true,
          },
        ].map((stat, i) => (
          <div key={i} className={`bg-${stat.color}-50/50 p-4 sm:p-5 rounded-xl border border-${stat.color}-100 transition-all hover:shadow-md hover:shadow-${stat.color}-100/20`}>
            <p className={`text-[10px] font-black uppercase tracking-widest text-${stat.color}-600 mb-1`}>{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 leading-none">
              {stat.isPct ? formatPercent(stat.value) : formatCurrency(stat.value)}
            </p>
            <p className="text-[10px] text-gray-400 mt-2 font-medium italic">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

