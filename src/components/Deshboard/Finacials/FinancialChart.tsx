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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ✅ Fake data added
const data = {
  activeProjects: [
    12000, 14000, 16000, 18000, 15000, 17000, 19000, 21000, 22000, 20000, 23000,
    25000,
  ],
  completedProjects: [
    8000, 9000, 10000, 11000, 9000, 9500, 10500, 12000, 11500, 13000, 13500,
    14500,
  ],
  laborCost: [
    7000, 8000, 7500, 8500, 8000, 8200, 8800, 9000, 9500, 9700, 9900, 10200,
  ],
  overhead: [
    2000, 2200, 2100, 2300, 2500, 2400, 2600, 2700, 2800, 3000, 3100, 3200,
  ],
  utilization: [65, 70, 68, 72, 74, 75, 77, 80, 78, 82, 83, 85],
};

export function FinancialChart() {
  const totalRevenue = data.activeProjects.map(
    (active, index) => active + data.completedProjects[index]
  );
  const totalCost = data.laborCost.map(
    (labor, index) => labor + (data.overhead[index] || 0)
  );
  const profit = totalRevenue.map(
    (revenue, index) => revenue - totalCost[index]
  );

  const chartData = {
    labels: months,
    datasets: [
      {
        label: "Total Revenue",
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
        data: data.utilization,
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.5)",
        yAxisID: "y1",
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: "Financial Performance Overview",
      },
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        stacked: false,
        title: {
          display: true,
          text: "Amount ($)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Utilization (%)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm">Total Revenue</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm">Total Cost</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm">Profit</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-sm">Utilization (%)</span>
        </div>
      </div>

      <div className="h-[400px]">
        <Line
          options={{
            ...options,
            maintainAspectRatio: false,
            plugins: {
              ...options.plugins,
              tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || "";
                    if (label) {
                      label += ": ";
                    }
                    if (context.parsed.y !== null) {
                      if (label.includes("Utilization")) {
                        label += context.parsed.y + "%";
                      } else {
                        label += "$" + context.parsed.y.toLocaleString();
                      }
                    }
                    return label;
                  },
                },
              },
            },
          }}
          data={{
            ...chartData,
            datasets: chartData.datasets.map((dataset) => ({
              ...dataset,
              tension: 0.3,
              pointRadius: 3,
              pointHoverRadius: 5,
              borderWidth: 3,
              fill: dataset.label === "Profit" ? "origin" : false,
              backgroundColor:
                dataset.label === "Profit"
                  ? "rgba(34, 197, 94, 0.1)"
                  : dataset.backgroundColor,
            })),
          }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
          <p className="text-sm text-blue-700 font-medium">
            Avg. Monthly Revenue
          </p>
          <p className="text-xl font-bold">
            ${(totalRevenue[totalRevenue.length - 1] / 12).toLocaleString()}{" "}
            <span className="text-xs font-normal">Total revenue/ 12</span>
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-md border border-red-100">
          <p className="text-sm text-red-700 font-medium">Avg. Monthly Cost</p>
          <p className="text-xl font-bold">
            ${(totalCost[totalCost.length - 1] / 12).toLocaleString()}{" "}
            <span className="text-xs font-normal">
              Total Overhead + Labor / 12
            </span>
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-md border border-green-100">
          <p className="text-sm text-green-700 font-medium">
            Avg. Monthly Profit
          </p>
          <p className="text-xl font-bold">
            ${(profit[profit.length - 1] / 12).toLocaleString()}{" "}
            <span className="text-xs font-normal">Total Profit / 12</span>
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded-md border border-orange-100">
          <p className="text-sm text-orange-700 font-medium">
            Avg. Utilization
          </p>
          <p className="text-xl font-bold">
            {data.utilization.reduce((a, b) => a + b, 0) /
              data.utilization.length}
            %
          </p>
        </div>
      </div>
    </div>
  );
}
