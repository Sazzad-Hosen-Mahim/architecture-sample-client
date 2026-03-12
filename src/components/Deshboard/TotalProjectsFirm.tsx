import { useGetProjectStatsQuery } from "@/redux/api/adminDashboard/proposalApi";
import { Loader2 } from "lucide-react";

export default function TotalProjectsFirm() {
  const { data: statsData, isLoading: statsLoading } = useGetProjectStatsQuery();

  const stats = statsData?.global || {};
  const total = stats.total || 0;
  const inquiry = stats.inquiry || 0;
  const bidding = stats.bidding || 0;
  const active = stats.active || 0;
  const done = stats.done || 0;

  const cards = [
    { title: "Total", value: total, color: "text-gray-800", bg: "bg-white" },
    { title: "Inquiry", value: inquiry, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Bidding", value: bidding, color: "text-yellow-600", bg: "bg-yellow-50" },
    { title: "Active", value: active, color: "text-green-600", bg: "bg-green-50" },
    { title: "Done", value: done, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-400">Loading stats...</span>
      </div>
    );
  }

  return (
    <div className="">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-1 bg-gray-50">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${card.bg} rounded-2xl shadow p-4 flex flex-col items-center justify-center hover:shadow-md transition`}
          >
            <p className="text-gray-500 text-sm">{card.title}</p>
            <h2 className={`text-xl font-semibold mt-1 ${card.color}`}>
              {card.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}
