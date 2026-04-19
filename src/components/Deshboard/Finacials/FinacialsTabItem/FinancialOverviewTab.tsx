import { FinancialChart } from "@/components/Deshboard/Finacials/FinancialChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, DollarSign, Plus, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { OverheadExpensesModal } from "./overheadModal/OverHeadModal";
import { useGetFinancialOverviewQuery } from "@/redux/api/financialApi";
import { useNavigate } from "react-router-dom";

export default function FinancialOverviewTab() {
  const navigate = useNavigate()
  const [overheadModalOpen, setOverheadModalOpen] = useState(false);
  const { data: overview, isLoading } = useGetFinancialOverviewQuery();

  if (isLoading) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        Loading financial overview...
      </div>
    );
  }

  const labor = overview?.labor || { total: 0, totalSalaries: 0, totalTaxes: 0, employeeCount: 0, employees: [] };
  const overhead = overview?.overhead || { total: 0, monthlyExpenses: 0, annualExpenses: 0, timecardCosts: 0, categoryBreakdown: {}, expenseCount: 0 };
  const revenue = overview?.revenue || { total: 0, activeProjectCount: 0 };
  const profit = overview?.profit || { total: 0, margin: 0 };

  const totalCosts = labor.total + overhead.total;

  return (
    <div className="px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-3 border-gray-50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>
                  Live data from employees, expenses & projects
                </CardDescription>
              </div>
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
                  <span className={`text-sm font-bold ${profit.total >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${profit.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Revenue</span>
                    <span className="font-medium">${revenue.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Profit Margin</span>
                    <span className="font-medium">{profit.margin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Projects</span>
                    <span className="font-medium">{revenue.activeProjectCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Costs</span>
                    <span className="font-medium">${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">Cost Breakdown</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Overhead</span>
                      <span>${overhead.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{ width: totalCosts > 0 ? `${(overhead.total / totalCosts) * 100}%` : "0%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Labor</span>
                      <span>${labor.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: totalCosts > 0 ? `${(labor.total / totalCosts) * 100}%` : "0%" }}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOverheadModalOpen(true)}
                      className="flex items-center gap-1 border border-black text-black hover:bg-gray-900 hover:text-white cursor-pointer text-xs font-medium px-2 py-1 rounded-md shadow-sm transition-all duration-200"
                    >
                      <Plus className="h-3 w-3" />
                      Update Overhead
                    </button>
                    <OverheadExpensesModal open={overheadModalOpen} onOpenChange={setOverheadModalOpen} />
                  </div>
                  <span className="text-sm font-bold text-orange-600">
                    ${overhead.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Expenses</span>
                    <span className="font-medium">
                      ${overhead.monthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Annual Expenses</span>
                    <span className="font-medium">
                      ${overhead.annualExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Timecard OH Costs</span>
                    <span className="font-medium">
                      ${overhead.timecardCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expense Items</span>
                    <span className="font-medium">{overhead.expenseCount}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">Overhead Breakdown</div>
                  <div className="space-y-2">
                    {Object.entries(overhead.categoryBreakdown || {}).map(([category, monthly]: [string, any]) => {
                      const pct = overhead.monthlyExpenses > 0 ? (monthly / overhead.monthlyExpenses) * 100 : 0;
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{category}</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(overhead.categoryBreakdown || {}).length === 0 && (
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate("/dashboard/employees")}
                      className="flex items-center gap-1 border border-black text-black hover:bg-gray-900 hover:text-white cursor-pointer text-xs font-medium px-2 py-1 rounded-md shadow-sm transition-all duration-200"
                    >
                      <Plus className="h-3 w-3" />
                      Update Labor
                    </button>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    ${labor.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Salaries</span>
                    <span className="font-medium">${labor.totalSalaries.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Taxes</span>
                    <span className="font-medium">${labor.totalTaxes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Employees</span>
                    <span className="font-medium">{labor.employeeCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>% of Revenue</span>
                    <span className="font-medium">
                      {revenue.total > 0 ? ((labor.total / revenue.total) * 100).toFixed(1) : "0.0"}%
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">Employee Costs</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(labor.employees || []).map((emp: any) => (
                      <div key={emp.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{emp.name}</span>
                          <span>${emp.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: labor.total > 0 ? `${(emp.totalCost / labor.total) * 100}%` : "0%" }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {(labor.employees || []).length === 0 && (
                      <p className="text-xs text-gray-400">No employee profiles with salary data</p>
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
                    {profit.total > 0 ? "Good" : profit.total === 0 ? "Neutral" : "Attention"}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Revenue vs Costs</span>
                      <span className="font-medium">
                        {totalCosts > 0 ? (revenue.total / totalCosts).toFixed(1) : "0.0"}x
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${profit.total > 0 ? "bg-green-500" : "bg-yellow-500"} h-1.5 rounded-full`}
                        style={{ width: `${Math.min(totalCosts > 0 ? (revenue.total / totalCosts / 3) * 100 : 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Revenue to costs ratio</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Profit per Project</span>
                      <span className="font-medium">
                        ${revenue.activeProjectCount > 0 ? Math.round(profit.total / revenue.activeProjectCount).toLocaleString() : "0"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${profit.total > 0 ? "bg-green-500" : "bg-yellow-500"} h-1.5 rounded-full`}
                        style={{ width: `${Math.min(revenue.total > 0 ? (profit.total / revenue.total) * 100 : 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Average profit per active project</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Cash Reserves</span>
                      <span className="font-medium">
                        ${Math.max(0, Math.round(profit.total * 0.3)).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${profit.total > 0 ? "bg-green-500" : "bg-red-500"} h-1.5 rounded-full`}
                        style={{ width: `${Math.min(profit.total > 0 ? 85 : 20, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {profit.total > 0 && overhead.monthlyExpenses > 0
                        ? `${((profit.total * 0.3) / overhead.monthlyExpenses).toFixed(1)} months of expenses`
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
            <CardTitle>Financial Performance</CardTitle>
            <CardDescription>Monthly breakdown of key financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
