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
import { Loader2 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function FinancialChart({ projectId }: { projectId?: string }) {
  const { data: history, isLoading } = useGetFinancialHistoryQuery(projectId);

  console.log(history, "historyyy")

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[400px] bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-sm text-gray-500 font-medium">Loading financial history...</p>
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
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        stacked: false,
        title: {
          display: true,
          text: "Amount ($)",
          font: { weight: 'bold' }
        },
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
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
          font: { weight: 'bold' }
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        max: 100,
        ticks: {
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

  console.log(totalRevenue, "totalRevenue")

  const avgRevenue = totalRevenue.reduce((a, b) => a + b, 0) / (totalRevenue.length || 1);
  const avgCost = totalCost.reduce((a, b) => a + b, 0) / (totalCost.length || 1);
  const avgProfit = profit.reduce((a, b) => a + b, 0) / (profit.length || 1);
  const avgUtil = utilization.reduce((a, b) => a + b, 0) / (utilization.length || 1);

  return (
    <div className="space-y-6">
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
          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-200"></div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Utilization</span>
        </div>
      </div>

      <div className="h-[400px] w-full bg-white p-2">
        <Line
          options={options}
          data={{
            ...chartData,
            datasets: chartData.datasets.map((dataset) => ({
              ...dataset,
              tension: 0.4,
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Monthly Revenue', value: avgRevenue, color: 'blue', sub: 'Total revenue / 12' },
          { label: 'Avg Monthly Cost', value: avgCost, color: 'red', sub: 'Total costs / 12' },
          { label: 'Avg Monthly Profit', value: avgProfit, color: 'green', sub: 'Total profit / 12' },
          { label: 'Avg Utilization', value: avgUtil, color: 'orange', sub: 'Last 12 months avg', isPct: true },
        ].map((stat, i) => (
          <div key={i} className={`bg-${stat.color}-50/50 p-4 rounded-xl border border-${stat.color}-100 transition-all hover:shadow-md hover:shadow-${stat.color}-100/20`}>
            <p className={`text-[10px] font-black uppercase tracking-widest text-${stat.color}-600 mb-1`}>{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 leading-none">
              {stat.isPct ? `${stat.value.toFixed(1)}%` : `$${Math.round(stat.value).toLocaleString()}`}
            </p>
            <p className="text-[10px] text-gray-400 mt-2 font-medium italic">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

