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

export default function FinancialOverviewTab() {
  const [selectedEmployee] = useState<string>("firm");
  const [selectedYear] = useState("2023");
  const [overheadModalOpen, setOverheadModalOpen] = useState(false);

  // Mock projects data
  const projects = [
    {
      id: 1,
      name: "City Center Tower",
      stage: "active",
      status: "active",
      contractAmount: 500000,
    },
    {
      id: 2,
      name: "Riverside Residences",
      stage: "active",
      status: "active",
      contractAmount: 350000,
    },
    {
      id: 3,
      name: "Tech Campus Expansion",
      stage: "completed",
      status: "completed",
      contractAmount: 280000,
    },
    {
      id: 4,
      name: "Greenfield Hospital",
      stage: "active",
      status: "active",
      contractAmount: 420000,
    },
    {
      id: 5,
      name: "Mountain View Condos",
      stage: "completed",
      status: "completed",
      contractAmount: 190000,
    },
    {
      id: 6,
      name: "Urban Renewal Project",
      stage: "active",
      status: "active",
      contractAmount: 310000,
    },
  ];

  const averageUtilization = 85;

  // Mock financial data for firm overview
  const financialData = {
    firm: {
      2023: {
        activeProjects: [
          500000, 550000, 600000, 650000, 700000, 750000, 800000, 850000,
          900000, 950000, 1000000, 1050000,
        ],
        completedProjects: [
          100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000,
          260000, 280000, 300000, 320000,
        ],
        laborCost: [
          50000, 52000, 51000, 53000, 54000, 55000, 56000, 57000, 58000, 59000,
          60000, 61000,
        ],
        profit: [
          20000, 22000, 23000, 25000, 26000, 27000, 28000, 29000, 30000, 31000,
          32000, 33000,
        ],
        overhead: [
          15000, 15500, 15200, 15800, 16000, 16200, 16500, 16800, 17000, 17200,
          17500, 17800,
        ],
        utilization: [75, 78, 80, 82, 85, 87, 88, 90, 92, 93, 95, 96],
      },
      2022: {
        activeProjects: [
          450000, 500000, 550000, 600000, 650000, 700000, 750000, 800000,
          850000, 900000, 950000, 1000000,
        ],
        completedProjects: [
          90000, 110000, 130000, 150000, 170000, 190000, 210000, 230000, 250000,
          270000, 290000, 310000,
        ],
        laborCost: [
          48000, 49000, 50000, 51000, 52000, 53000, 54000, 55000, 56000, 57000,
          58000, 59000,
        ],
        profit: [
          18000, 19000, 20000, 21000, 22000, 23000, 24000, 25000, 26000, 27000,
          28000, 29000,
        ],
        overhead: [
          14000, 14200, 14500, 14800, 15000, 15200, 15500, 15800, 16000, 16200,
          16500, 16800,
        ],
        utilization: [70, 72, 75, 78, 80, 82, 85, 87, 88, 90, 92, 93],
      },
      2021: {
        activeProjects: [
          400000, 450000, 500000, 550000, 600000, 650000, 700000, 750000,
          800000, 850000, 900000, 950000,
        ],
        completedProjects: [
          80000, 100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000,
          260000, 280000, 300000,
        ],
        laborCost: [
          45000, 46000, 47000, 48000, 49000, 50000, 51000, 52000, 53000, 54000,
          55000, 56000,
        ],
        profit: [
          15000, 16000, 17000, 18000, 19000, 20000, 21000, 22000, 23000, 24000,
          25000, 26000,
        ],
        overhead: [
          13000, 13200, 13500, 13800, 14000, 14200, 14500, 14800, 15000, 15200,
          15500, 15800,
        ],
        utilization: [65, 68, 70, 72, 75, 78, 80, 82, 85, 87, 88, 90],
      },
    },
    employees: {
      emp1: {
        name: "John Doe",
        role: "Principal",
        2023: {
          activeProjects: [
            200000, 220000, 240000, 260000, 280000, 300000, 320000, 340000,
            360000, 380000, 400000, 420000,
          ],
          completedProjects: [
            40000, 48000, 56000, 64000, 72000, 80000, 88000, 96000, 104000,
            112000, 120000, 128000,
          ],
          laborCost: [
            10000, 10500, 10200, 10800, 11000, 11200, 11500, 11800, 12000,
            12200, 12500, 12800,
          ],
          utilization: [80, 82, 85, 87, 90, 92, 95, 97, 98, 99, 100, 100],
        },
        2022: {
          activeProjects: [
            180000, 200000, 220000, 240000, 260000, 280000, 300000, 320000,
            340000, 360000, 380000, 400000,
          ],
          completedProjects: [
            36000, 44000, 52000, 60000, 68000, 76000, 84000, 92000, 100000,
            108000, 116000, 124000,
          ],
          laborCost: [
            9000, 9200, 9500, 9800, 10000, 10200, 10500, 10800, 11000, 11200,
            11500, 11800,
          ],
          utilization: [75, 78, 80, 82, 85, 87, 90, 92, 95, 97, 98, 99],
        },
        2021: {
          activeProjects: [
            160000, 180000, 200000, 220000, 240000, 260000, 280000, 300000,
            320000, 340000, 360000, 380000,
          ],
          completedProjects: [
            32000, 40000, 48000, 56000, 64000, 72000, 80000, 88000, 96000,
            104000, 112000, 120000,
          ],
          laborCost: [
            8000, 8200, 8500, 8800, 9000, 9200, 9500, 9800, 10000, 10200, 10500,
            10800,
          ],
          utilization: [70, 72, 75, 78, 80, 82, 85, 87, 90, 92, 95, 97],
        },
      },
      emp2: {
        name: "Jane Smith",
        role: "Project Manager",
        2023: {
          activeProjects: [
            160000, 176000, 192000, 208000, 224000, 240000, 256000, 272000,
            288000, 304000, 320000, 336000,
          ],
          completedProjects: [
            32000, 38400, 44800, 51200, 57600, 64000, 70400, 76800, 83200,
            89600, 96000, 102400,
          ],
          laborCost: [
            8000, 8200, 8500, 8800, 9000, 9200, 9500, 9800, 10000, 10200, 10500,
            10800,
          ],
          utilization: [75, 78, 80, 82, 85, 87, 90, 92, 95, 97, 98, 99],
        },
        2022: {
          activeProjects: [
            140000, 156000, 172000, 188000, 204000, 220000, 236000, 252000,
            268000, 284000, 300000, 316000,
          ],
          completedProjects: [
            28000, 34400, 40800, 47200, 53600, 60000, 66400, 72800, 79200,
            85600, 92000, 98400,
          ],
          laborCost: [
            7000, 7200, 7500, 7800, 8000, 8200, 8500, 8800, 9000, 9200, 9500,
            9800,
          ],
          utilization: [70, 72, 75, 78, 80, 82, 85, 87, 90, 92, 95, 97],
        },
        2021: {
          activeProjects: [
            120000, 136000, 152000, 168000, 184000, 200000, 216000, 232000,
            248000, 264000, 280000, 296000,
          ],
          completedProjects: [
            24000, 30400, 36800, 43200, 49600, 56000, 62400, 68800, 75200,
            81600, 88000, 94400,
          ],
          laborCost: [
            6000, 6200, 6500, 6800, 7000, 7200, 7500, 7800, 8000, 8200, 8500,
            8800,
          ],
          utilization: [65, 68, 70, 72, 75, 78, 80, 82, 85, 87, 90, 92],
        },
      },
    },
  };

  // Mock data calculations

  //   const data = financialData.firm[selectedYear];
  return (
    <div className="px-6">
      {selectedEmployee === "firm" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-3  border-gray-50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Financial Summary </CardTitle>
                    <CardDescription>
                      {selectedYear} Overview for{" "}
                      {selectedEmployee === "firm"
                        ? "Entire Firm"
                        : financialData.employees[selectedEmployee]}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2"></div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calculate actual financial metrics from projects */}
                {(() => {
                  // Get active and completed projects
                  const activeProjects = projects.filter(
                    (p) => p.stage === "active" || p.status === "active"
                  );
                  const completedProjects = projects.filter(
                    (p) => p.stage === "completed" || p.status === "completed"
                  );

                  // Calculate total revenue from contract amounts
                  const activeProjectsRevenue = activeProjects.reduce(
                    (sum, project) => sum + (project.contractAmount || 0),
                    0
                  );
                  const completedProjectsRevenue = completedProjects.reduce(
                    (sum, project) => sum + (project.contractAmount || 0),
                    0
                  );
                  const actualTotalRevenue =
                    activeProjectsRevenue + completedProjectsRevenue;

                  // Calculate labor costs (estimated as 45% of revenue for active projects)
                  const actualLaborCost = Math.round(
                    activeProjectsRevenue * 0.45
                  );

                  // Calculate overhead (estimated as 20% of revenue)
                  const actualOverhead = Math.round(actualTotalRevenue * 0.2);

                  // Calculate profit
                  const actualProfit =
                    actualTotalRevenue - actualLaborCost - actualOverhead;

                  // Calculate profit margin
                  const profitMargin =
                    actualTotalRevenue > 0
                      ? ((actualProfit / actualTotalRevenue) * 100).toFixed(1)
                      : "0.0";

                  // Calculate monthly averages
                  const monthlyOverhead = Math.round(actualOverhead / 12);

                  // Calculate overhead percentage
                  const overheadPercentage =
                    actualTotalRevenue > 0
                      ? ((actualOverhead / actualTotalRevenue) * 100).toFixed(1)
                      : "0.0";

                  // Calculate labor percentage
                  const laborPercentage =
                    actualTotalRevenue > 0
                      ? ((actualLaborCost / actualTotalRevenue) * 100).toFixed(
                          1
                        )
                      : "0.0";

                  // Calculate billable ratio
                  const billableRatio =
                    actualLaborCost > 0
                      ? (actualTotalRevenue / actualLaborCost).toFixed(2)
                      : "0.00";

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 ">
                      {/* Profit Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                            Profit
                          </h3>
                          <span className="text-sm font-bold text-green-600">
                            ${actualProfit.toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Revenue</span>
                            <span className="font-medium">
                              ${actualTotalRevenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Profit Margin</span>
                            <span className="font-medium">{profitMargin}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Active Projects</span>
                            <span className="font-medium">
                              {activeProjects.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Completed Projects</span>
                            <span className="font-medium">
                              {completedProjects.length}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <div className="text-sm font-medium mb-1">
                            Revenue Breakdown
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Active Projects</span>
                              <span>
                                ${activeProjectsRevenue.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{
                                  width:
                                    actualTotalRevenue > 0
                                      ? `${
                                          (activeProjectsRevenue /
                                            actualTotalRevenue) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Completed Projects</span>
                              <span>
                                ${completedProjectsRevenue.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{
                                  width:
                                    actualTotalRevenue > 0
                                      ? `${
                                          (completedProjectsRevenue /
                                            actualTotalRevenue) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Overhead Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center">
                            <BarChart className="h-5 w-5 mr-2 text-orange-600" />
                            Overhead
                          </h3>
                          <div className="flex items-center gap-2">
                            {/* <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              //   onClick={() => setOverheadModalOpen(true)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Update Overhead
                            </Button> */}

                            <button
                              onClick={() => setOverheadModalOpen(true)}
                              className="flex items-center gap-1 border border-black text-black hover:bg-gray-900 hover:text-white cursor-pointer  text-xs font-medium px-2 py-1 rounded-md shadow-sm transition-all duration-200"
                            >
                              <Plus className="h-3 w-3" />
                              Update Overhead
                            </button>
                            <OverheadExpensesModal
                              open={overheadModalOpen}
                              onOpenChange={setOverheadModalOpen}
                            />
                          </div>
                          <span className="text-sm font-bold text-orange-600">
                            ${actualOverhead.toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>% of Revenue</span>
                            <span className="font-medium">
                              {overheadPercentage}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Monthly Average</span>
                            <span className="font-medium">
                              ${monthlyOverhead.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Per Project (Avg)</span>
                            <span className="font-medium">
                              $
                              {activeProjects.length > 0
                                ? Math.round(
                                    actualOverhead / activeProjects.length
                                  ).toLocaleString()
                                : "0"}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <div className="text-sm font-medium mb-1">
                            Overhead Breakdown
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Rent & Utilities</span>
                                <span>42%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-orange-500 h-1.5 rounded-full"
                                  style={{ width: "42%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Software & Equipment</span>
                                <span>28%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-orange-500 h-1.5 rounded-full"
                                  style={{ width: "28%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Insurance & Benefits</span>
                                <span>18%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-orange-500 h-1.5 rounded-full"
                                  style={{ width: "18%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Other</span>
                                <span>12%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-orange-500 h-1.5 rounded-full"
                                  style={{ width: "12%" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Labor Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center">
                            <Users className="h-5 w-5 mr-2 text-blue-600" />
                            Labor
                          </h3>
                          <span className="text-sm font-bold text-blue-600">
                            ${actualLaborCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>% of Revenue</span>
                            <span className="font-medium">
                              {laborPercentage}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Utilization Rate</span>
                            <span className="font-medium">
                              {averageUtilization}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Billable Ratio</span>
                            <span className="font-medium">
                              {billableRatio}x
                            </span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <div className="text-sm font-medium mb-1">
                            Labor by Role
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Principals</span>
                                <span>25%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: "25%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Project Architects</span>
                                <span>35%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: "35%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Designers</span>
                                <span>30%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: "30%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Support Staff</span>
                                <span>10%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: "10%" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Health Section */}
                      <div className="space-y-4">
                        <div className="flex justify-end gap-4 mb-4">
                          <button className="flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-lg bg-black text-white text-xs  shadow-md hover:bg-neutral-800 hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-200">
                            <Plus size={12} className="stroke-[2]" />
                            Upload Overhead
                          </button>
                          <button className="flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-lg bg-black text-white text-xs  shadow-md hover:bg-neutral-800 hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-200">
                            <Plus size={12} /> Updated Labor
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-5">
                          <h3 className="text-lg flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                            Financial Health
                          </h3>
                          <span className="text-sm font-bold  text-purple-600">
                            {actualProfit > 0
                              ? "Good"
                              : actualProfit === 0
                              ? "Neutral"
                              : "Attention"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Current Ratio</span>
                              <span className="font-medium">
                                {(
                                  actualTotalRevenue /
                                  (actualLaborCost + actualOverhead)
                                ).toFixed(1)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`${
                                  actualProfit > 0
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                } h-1.5 rounded-full`}
                                style={{
                                  width: `${Math.min(
                                    (actualTotalRevenue /
                                      (actualLaborCost + actualOverhead) /
                                      3) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Assets to liabilities ratio
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Profit per Project</span>
                              <span className="font-medium">
                                $
                                {activeProjects.length > 0
                                  ? Math.round(
                                      actualProfit / activeProjects.length
                                    ).toLocaleString()
                                  : "0"}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`${
                                  actualProfit > 0
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                } h-1.5 rounded-full`}
                                style={{
                                  width: `${Math.min(
                                    (actualProfit / (actualTotalRevenue || 1)) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Average profit per active project
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Project Completion</span>
                              <span className="font-medium">
                                {completedProjects.length}/
                                {activeProjects.length +
                                  completedProjects.length}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{
                                  width:
                                    activeProjects.length +
                                      completedProjects.length >
                                    0
                                      ? `${
                                          (completedProjects.length /
                                            (activeProjects.length +
                                              completedProjects.length)) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Completed vs. total projects
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Cash Reserves</span>
                              <span className="font-medium">
                                $
                                {Math.round(
                                  actualProfit * 0.3
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`${
                                  actualProfit > 0
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                } h-1.5 rounded-full`}
                                style={{
                                  width: `${Math.min(
                                    actualProfit > 0 ? 85 : 20,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {actualProfit > 0
                                ? `${(
                                    (actualProfit * 0.3) /
                                    monthlyOverhead
                                  ).toFixed(1)} months of expenses`
                                : "Insufficient reserves"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <Card className="col-span-1 md:col-span-3 border-gray-50">
              <CardHeader>
                <CardTitle>Financial Performance</CardTitle>
                <CardDescription>
                  Monthly breakdown of key financial metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinancialChart />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
