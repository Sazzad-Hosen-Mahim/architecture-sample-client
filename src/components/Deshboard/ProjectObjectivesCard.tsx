import { useGetProjectStatsQuery } from "@/redux/api/adminDashboard/proposalApi";
import { Loader2 } from "lucide-react";

export default function ProjectObjectivesCard() {
  const { data: statsData, isLoading } = useGetProjectStatsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-400">Loading objectives...</span>
      </div>
    );
  }

  const assigned = statsData?.assigned || {};

  const cards = [
    { title: "Assigned", value: assigned.total || 0, color: "text-orange-800" },
    { title: "Complete", value: assigned.complete || 0, color: "text-pink-800" },
    { title: "In Progress", value: assigned.inProgress || 0, color: "text-yellow-500" },
    { title: "Not Started", value: assigned.notStarted || 0, color: "text-green-800" },
    { title: "Tasks", value: assigned.tasks || 0, color: "text-gray-700" },
  ];

  return (
    <div className="">
      <h1 className="text-md ml-3 mt-2">Your Projects: </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-2 bg-gray-50">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow p-4 flex flex-col items-center justify-center hover:shadow-md transition"
          >
            <p className="text-gray-500 text-sm font-medium">{card.title}</p>
            <h2 className={`text-xl font-bold mt-1 ${card.color}`}>
              {card.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}
