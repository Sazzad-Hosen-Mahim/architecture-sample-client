import { Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import TimecardsListTab from "@/components/Deshboard/Finacials/FinacialsTabItem/TimecardsListTab";

export default function TimecardsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/financials"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Financials
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <h1 className="text-sm font-bold text-gray-900">Timecards</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <TimecardsListTab />
      </div>
    </div>
  );
}
