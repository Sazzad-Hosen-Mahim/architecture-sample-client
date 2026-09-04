import { FinancialChart } from "@/components/Deshboard/Finacials/FinancialChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  DollarSign,
  TrendingUp,
  Users, //Archive, Loader2
  //
} from "lucide-react";
import {
  useGetFinancialOverviewQuery,
  // useArchiveCompletedProjectsMutation,
  // useGetArchivedSummaryQuery
} from "@/redux/api/financialApi";
import { useState } from "react";
// import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import ScopeSelect from "@/components/Deshboard/Finacials/ScopeSelect";
import {
  formatCount,
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from "@/utils/money";

const CURRENT_YEAR = new Date().getFullYear();

export default function FinancialOverviewTab() {
  // "All Time" is the running total for the whole firm; a year shows only the
  // projects that belong to it (completed that year, or still running since).
  const [scope, setScope] = useState<"all" | "year">("year");
  const [scopeYear, setScopeYear] = useState(CURRENT_YEAR);

  const { data: overview, isLoading } = useGetFinancialOverviewQuery({
    scope,
    year: scopeYear,
  });
  // const [archiveCompleted, { isLoading: isArchiving }] = useArchiveCompletedProjectsMutation();
  // const { data: archivedSummary } = useGetArchivedSummaryQuery();
  // const [archiveYear, setArchiveYear] = useState(new Date().getFullYear());

  if (isLoading) return <Loader />;

  const labor = overview?.labor || {
    total: 0,
    totalSalaries: 0,
    totalTaxes: 0,
    totalNetPay: 0,
    employeeCount: 0,
    employees: [],
    utilization: 0,
  };
  const overhead = overview?.overhead || {
    total: 0,
    monthlyExpenses: 0,
    annualExpenses: 0,
    projectOverhead: 0,
    categoryBreakdown: {},
    expenseCount: 0,
  };
  const revenue = overview?.revenue || {
    total: 0,
    activeProjectCount: 0,
    completedProjectCount: 0,
  };
  const projectFinancials = overview?.projectFinancials || {
    totalBurned: 0,
    totalLabor: 0,
    totalProjectOverhead: 0,
    totalStudioOverhead: 0,
    firmBillingRate: 0,
  };
  const profit = overview?.profit || { total: 0, margin: 0 };

  const totalCosts = labor.total + overhead.total;

  return (
    <div className="px-3 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-3 border-gray-50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>
                  Live data from employees, expenses &amp; projects
                </CardDescription>
              </div>
              <ScopeSelect
                scope={scope}
                year={scopeYear}
                startYear={overview?.scope?.firmStartYear}
                onChange={(nextScope, nextYear) => {
                  setScope(nextScope);
                  setScopeYear(nextYear);
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* ─── Profit Section ─── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Profit
                  </h3>
                  <span
                    className={`text-sm font-bold ${profit.total >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatSignedCurrency(profit.total)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gross Revenue</span>
                    <span className="font-medium">
                      {formatCurrency(revenue.grossRevenue || revenue.total)}
                    </span>
                  </div>
                  {(revenue.amendmentRevenue || 0) > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-gray-500 pl-3 border-l-2 border-gray-200">
                        <span>Original Contracts</span>
                        <span className="font-medium">
                          {formatCurrency(revenue.originalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-amber-600 pl-3 border-l-2 border-amber-200">
                        <span>Amendments ({revenue.amendmentCount || 0})</span>
                        <span className="font-medium">
                          +{formatCurrency(revenue.amendmentRevenue)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Approved Refunds</span>
                    <span className="font-medium">
                      -{formatCurrency(revenue.totalRefunds)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100">
                    <span>Net Revenue</span>
                    <span className="font-bold">
                      {formatCurrency(revenue.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span>Profit Margin</span>
                    <span className="font-medium">
                      {formatPercent(profit.margin)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Projects</span>
                    <span className="font-medium">
                      {formatCount(revenue.activeProjectCount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Completed Projects</span>
                    <span className="font-medium">
                      {formatCount(revenue.completedProjectCount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Costs</span>
                    <span className="font-medium">
                      {formatCurrency(totalCosts)}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">Cost Breakdown</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Overhead</span>
                      <span>{formatCurrency(overhead?.total)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{
                          width:
                            (totalCosts || 0) > 0
                              ? `${((overhead?.total || 0) / (totalCosts || 1)) * 100}%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Labor</span>
                      <span>{formatCurrency(labor?.total)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{
                          width:
                            (totalCosts || 0) > 0
                              ? `${((labor?.total || 0) / (totalCosts || 1)) * 100}%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Overhead Section ─── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-orange-600" />
                    Overhead
                  </h3>
                  <span className="text-sm font-bold text-orange-600">
                    {formatCurrency(overhead.total)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Overhead</span>
                    <span className="font-medium">
                      {formatCurrency((overhead?.total || 0) / 12)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Expenses</span>
                    <span className="font-medium">
                      {formatCurrency(overhead?.monthlyExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Annual Expenses</span>
                    <span className="font-medium">
                      {formatCurrency(overhead?.annualExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Labor Overhead</span>
                    <span className="font-medium">
                      {formatCurrency(
                        overhead?.laborOverhead ??
                          projectFinancials?.totalProjectOverhead,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 italic text-[10px] mt-1">
                    <span>
                      * Every project's own overhead cost added together — the
                      wage cost of non-billable hours booked to a project on
                      approved timecards, at each employee's locked rate
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expense Items</span>
                    <span className="font-medium">
                      {formatCount(overhead?.expenseCount)}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">
                    Overhead Breakdown
                  </div>
                  <div className="space-y-2">
                    {Object.entries(overhead.categoryBreakdown || {}).map(
                      ([category, monthly]: [string, any]) => {
                        const pct =
                          overhead.monthlyExpenses > 0
                            ? (monthly / overhead.monthlyExpenses) * 100
                            : 0;
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{category}</span>
                              <span>{formatPercent(pct)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-orange-500 h-1.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      },
                    )}
                    {Object.keys(overhead.categoryBreakdown || {}).length ===
                      0 && (
                      <p className="text-xs text-gray-400">No expenses yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Labor Section ─── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Labor
                  </h3>
                  <span className="text-sm font-bold text-blue-600">
                    {formatCurrency(labor?.total)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Salaries (Gross)</span>
                    <span className="font-medium">
                      {formatCurrency(labor?.totalSalaries)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Taxes</span>
                    <span className="font-medium">
                      {formatCurrency(labor?.totalTaxes)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    {/* Headcount is whoever was paid in this window, so a past
                        year keeps its number after someone leaves. */}
                    <span>Employees</span>
                    <span className="font-medium">
                      {formatCount(labor?.employeeCount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Utilization</span>
                    <span className="font-medium">
                      {formatPercent(labor?.utilization)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>% of Net Revenue</span>
                    <span className="font-medium">
                      {formatPercent(
                        revenue.total > 0
                          ? (labor.total / revenue.total) * 100
                          : 0,
                      )}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">
                    Employee Costs
                    <span className="ml-1 text-[10px] font-normal text-gray-400">
                      (Net Pay)
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(labor.employees || []).map((emp: any) => (
                      <div key={emp.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{emp.name}</span>
                          <span>{formatCurrency(emp.totalCost)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width:
                                labor.total > 0
                                  ? `${(emp.totalCost / labor.total) * 100}%`
                                  : "0%",
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {(labor.employees || []).length === 0 && (
                      <p className="text-xs text-gray-400">
                        No approved timecards in this period
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Financial Health Section ─── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mt-5">
                  <h3 className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                    Financial Health
                  </h3>
                  <span className="text-sm font-bold text-purple-600">
                    {profit.total > 0
                      ? "Good"
                      : profit.total === 0
                        ? "Neutral"
                        : "Attention"}
                  </span>
                </div>

                {/* Project Financials Summary */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Project Financials (Active)
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Burned</span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(projectFinancials?.totalBurned)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Project Labor</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(projectFinancials?.totalLabor)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Revenue vs Costs</span>
                      <span className="font-medium">
                        {(totalCosts > 0
                          ? revenue.total / totalCosts
                          : 0
                        ).toFixed(2)}
                        x
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${profit.total > 0 ? "bg-green-500" : "bg-yellow-500"} h-1.5 rounded-full`}
                        style={{
                          width: `${Math.min(totalCosts > 0 ? (revenue.total / totalCosts / 3) * 100 : 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Revenue to costs ratio
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Profit per Project</span>
                      <span className="font-medium">
                        {formatSignedCurrency(
                          revenue.activeProjectCount > 0
                            ? profit.total / revenue.activeProjectCount
                            : 0,
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${profit.total > 0 ? "bg-green-500" : "bg-yellow-500"} h-1.5 rounded-full`}
                        style={{
                          width: `${Math.min(revenue.total > 0 ? (profit.total / revenue.total) * 100 : 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average profit per active project
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Cash Reserves</span>
                      <span className="font-medium">
                        {formatSignedCurrency(profit.total)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${profit.total > 0 ? "bg-green-500" : "bg-red-500"} h-1.5 rounded-full`}
                        style={{
                          width: `${Math.min(profit.total > 0 ? 85 : 20, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {/* Months of Expenses = (Gross Profit / Total Cost) × 12 */}
                      {totalCosts > 0
                        ? `${((profit.total / totalCosts) * 12).toFixed(2)} months of expenses`
                        : "Insufficient reserves"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <Card className="col-span-1 md:col-span-3 border-gray-50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Financial Performance</CardTitle>
                <CardDescription>
                  Monthly breakdown of key financial metrics
                </CardDescription>
              </div>
              <ScopeSelect
                scope={scope}
                year={scopeYear}
                startYear={overview?.scope?.firmStartYear}
                onChange={(nextScope, nextYear) => {
                  setScope(nextScope);
                  setScopeYear(nextYear);
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Totals come from the summary above so both panels agree */}
            <FinancialChart
              scope={scope}
              year={scopeYear}
              totals={{
                netRevenue: revenue.total || 0,
                totalCosts,
                totalProfit: profit.total || 0,
                utilization: labor.utilization || 0,
              }}
            />
          </CardContent>
        </Card>
      </div>
      {/* Year-End Archive Section */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <Card className="col-span-1 md:col-span-3 border-gray-50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-gray-600" />
                  Year-End Project Archive
                </CardTitle>
                <CardDescription>
                  Completed projects from previous years are automatically archived at midnight daily.
                  Archived projects are excluded from the financial summary above.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</label>
                  <input
                    type="number"
                    value={archiveYear}
                    onChange={(e) => setArchiveYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-center"
                    min={2020}
                    max={2100}
                  />
                </div>
                <button
                  onClick={async () => {
                    try {
                      const result = await archiveCompleted({ year: archiveYear }).unwrap();
                      toast.success(result.message || `Archived ${result.archivedCount} project(s)`);
                    } catch (err: any) {
                      toast.error(err?.data?.message || 'Failed to archive projects');
                    }
                  }}
                  disabled={isArchiving}
                  className="bg-gray-900 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
                >
                  {isArchiving ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                  {isArchiving ? 'Archiving...' : 'Archive Completed'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {archivedSummary && archivedSummary.count > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                  <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500 font-medium">Archived Projects: </span>
                    <span className="font-black text-gray-900">{archivedSummary.count}</span>
                  </div>
                  <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500 font-medium">Archived Revenue: </span>
                    <span className="font-black text-gray-900">
                      ${archivedSummary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Manager</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Archived At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {archivedSummary.projects.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-bold text-gray-900">{p.projectName}</td>
                          <td className="px-4 py-3 text-gray-600">{p.clientName}</td>
                          <td className="px-4 py-3 text-gray-600">{p.assignedManager?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-bold">${p.totalAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-500 text-xs">
                            {p.archivedAt ? new Date(p.archivedAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic py-4">No archived projects yet. Completed projects from previous years will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
