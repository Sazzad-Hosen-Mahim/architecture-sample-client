import { useGetAllTimecardsQuery } from "@/redux/api/financialApi";
import { useState } from "react";
import { Search, Eye, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";
import TimesheetEntryFormDialog from "@/components/Deshboard/TimeCardDialog/TimesheetEntryFormDialog";

const TimecardsListTab = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const { data: timecards, isLoading } = useGetAllTimecardsQuery(
    statusFilter ? { status: statusFilter } : undefined
  );

  const [selectedTimecardId, setSelectedTimecardId] = useState<string | null>(null);

  const filteredTimecards = timecards?.filter((tc: any) => 
    tc.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
    tc.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading timecards...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by employee name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            <Filter size={14} className="text-gray-400" />
            <select 
              className="text-sm bg-transparent outline-none font-bold text-gray-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left font-bold text-gray-900">Employee</th>
              <th className="p-4 text-left font-bold text-gray-900">Week Ending</th>
              <th className="p-4 text-left font-bold text-gray-900">Status</th>
              <th className="p-4 text-left font-bold text-gray-900">Project Hrs</th>
              <th className="p-4 text-left font-bold text-gray-900">Overhead Hrs</th>
              <th className="p-4 text-left font-bold text-gray-900">Total Cost</th>
              <th className="p-4 text-center font-bold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTimecards?.map((tc: any) => (
              <tr key={tc.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-gray-900">{tc.user?.name}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{tc.user?.role?.replace(/_/g, ' ')}</div>
                </td>
                <td className="p-4">
                   <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <Calendar size={14} className="text-gray-400" />
                      {format(new Date(tc.weekEnding), 'MMM dd, yyyy')}
                   </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    tc.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                    tc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {tc.status}
                  </span>
                </td>
                <td className="p-4 font-bold text-gray-900">
                   {Number(tc.billableHours || 0).toFixed(1)}h
                </td>
                <td className="p-4 font-bold text-gray-700">
                   {Number(tc.totalHours || 0).toFixed(1)}h
                </td>
                <td className="p-4 text-green-700 font-bold">
                  ${Number(tc.totalCost || 0).toLocaleString()}
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => setSelectedTimecardId(tc.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold hover:bg-black hover:text-white transition-all shadow-sm"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {(!filteredTimecards || filteredTimecards.length === 0) && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400 font-medium italic">
                  No timecards found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedTimecardId && (
        <TimesheetEntryFormDialog 
          open={!!selectedTimecardId}
          onOpenChange={(open) => !open && setSelectedTimecardId(null)}
          timecardId={selectedTimecardId}
          isReadOnly={true}
        />
      )}
    </div>
  );
};

export default TimecardsListTab;
