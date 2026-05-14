import {
  useGetTimecardsByPayPeriodQuery,
  useGetAllTimecardsQuery,
  useGetBillingRateQuery,
  useApproveTimecardMutation
} from "@/redux/api/financialApi";
import { useState, useMemo } from "react";
import {
  Search,
  Eye,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Users
} from "lucide-react";
import TimesheetEntryFormDialog from "@/components/Deshboard/TimeCardDialog/TimesheetEntryFormDialog";
import { generatePayrollPDF } from "@/utils/payrollPDFGenerator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Helper to generate 26 periods (same logic as NewTimesheetDialog)
function generatePayPeriods(year: number) {
  const periods: { period: number; startDate: Date; endDate: Date; label: string }[] = [];
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysToFirstMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);

  for (let i = 0; i < 26; i++) {
    const startDate = new Date(firstMonday);
    startDate.setDate(firstMonday.getDate() + i * 14);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 13);
    const label = `Period ${i + 1} (${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
    periods.push({ period: i + 1, startDate, endDate, label });
  }
  return periods;
}

const TimecardsListTab = () => {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState(-1); // -1 means "All Periods"
  const [search, setSearch] = useState("");

  const periods = useMemo(() => generatePayPeriods(selectedYear), [selectedYear]);
  const activePeriod = periods.find(p => p.period === selectedPeriod);

  const { data: periodTimecards = [], isLoading: isLoadingPeriod } = useGetTimecardsByPayPeriodQuery(
    { year: selectedYear, period: selectedPeriod },
    { skip: selectedPeriod === -1 }
  );

  const { data: allTimecards = [], isLoading: isLoadingAll } = useGetAllTimecardsQuery(
    undefined,
    { skip: selectedPeriod !== -1 }
  );

  const timecards = selectedPeriod === -1 ? allTimecards : periodTimecards;
  const isLoadingTimecards = selectedPeriod === -1 ? isLoadingAll : isLoadingPeriod;

  const { data: billingRateData } = useGetBillingRateQuery();
  const [approveTimecard, { isLoading: isApproving }] = useApproveTimecardMutation();

  const [selectedTimecardId, setSelectedTimecardId] = useState<string | null>(null);

  // Map timecards to display items (Only show people who actually have a timecard)
  const payrollItems = useMemo(() => {
    return timecards
      .filter((tc: any) => {
        const userName = tc.user?.name || "";
        const userEmail = tc.user?.email || "";
        return (
          userName.toLowerCase().includes(search.toLowerCase()) ||
          userEmail.toLowerCase().includes(search.toLowerCase())
        );
      })
      .map((tc: any) => ({
        employee: tc.user,
        timecard: tc,
        status: tc.status
      }));
  }, [timecards, search]);

  const canProcessPayroll = useMemo(() => {
    // Payroll can only be processed if a specific period is selected and there are APPROVED timecards
    return selectedPeriod !== -1 && timecards.some((tc: any) => tc.status === "APPROVED");
  }, [selectedPeriod, timecards]);

  const handleProcessPayroll = () => {
    if (!activePeriod) return;
    try {
      generatePayrollPDF({
        payYear: selectedYear,
        payPeriod: selectedPeriod,
        weekStarting: activePeriod.startDate.toISOString(),
        weekEnding: activePeriod.endDate.toISOString(),
        billingRate: billingRateData?.billingRate || 0,
        timecards: timecards.filter((tc: any) => tc.status === "APPROVED")
      });
      toast.success("Payroll PDF generated successfully");
    } catch (err) {
      toast.error("Failed to generate payroll PDF");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveTimecard(id).unwrap();
      toast.success("Timecard approved");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to approve");
    }
  };

  if (isLoadingTimecards) {
    return <div className="p-20 text-center flex flex-col items-center gap-4">
      <RotateCcw className="animate-spin text-gray-300" size={40} />
      <span className="text-gray-500 font-bold tracking-tight">Syncing Payroll Data...</span>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters & Actions Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Payroll Management
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              {selectedPeriod === -1
                ? "Showing All Active & Draft Records"
                : `Bi-Weekly Cycle: Period ${selectedPeriod} · ${selectedYear}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl">
              <Calendar size={14} className="text-gray-400" />
              <select
                className="text-sm bg-transparent outline-none font-bold text-gray-700"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl min-w-[200px]">
              <Clock size={14} className="text-gray-400" />
              <select
                className="text-sm bg-transparent outline-none font-bold text-gray-700 w-full"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              >
                <option value={-1}>All Periods</option>
                {periods.map(p => <option key={p.period} value={p.period}>{p.label}</option>)}
              </select>
            </div>

            <Button
              onClick={handleProcessPayroll}
              disabled={!canProcessPayroll}
              className={`font-black uppercase tracking-widest px-6 shadow-lg transition-all active:scale-95 ${canProcessPayroll
                  ? "bg-black text-white hover:bg-gray-800 shadow-black/10"
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                }`}
            >
              <FileText size={16} className="mr-2" />
              Process Payroll
            </Button>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Filter by employee name..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:ring-1 focus:ring-black outline-none font-medium transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Approved: {timecards.filter(t => t.status === 'APPROVED').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pending: {timecards.filter(t => t.status === 'SUBMITTED').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rejected: {timecards.filter(t => t.status === 'REJECTED').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-5 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Employee</th>
              <th className="p-5 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Hours Breakdown</th>
              <th className="p-5 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Gross Pay</th>
              <th className="p-5 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
              <th className="p-5 text-center font-black text-gray-400 uppercase tracking-widest text-[10px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payrollItems.map((item: any) => {
              const tc = item.timecard;
              const emp = item.employee;
              const hourlyRate = Number(emp.employeeProfile?.hourlyRate || 0);
              const gross = tc ? Number(tc.totalHours || 0) * hourlyRate : 0;

              return (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs">
                        {emp?.name?.split(' ').map((n: string) => n[0]).join('') || "?"}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{emp?.name || "Unknown User"}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{emp?.role?.replace(/_/g, ' ') || "Employee"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    {tc ? (
                      <div className="flex gap-4">
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Billable</div>
                          <div className="text-sm font-bold text-gray-900">{Number(tc.billableHours || 0).toFixed(1)}h</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Overhead</div>
                          <div className="text-sm font-bold text-gray-500">{(Number(tc.totalHours || 0) - Number(tc.billableHours || 0)).toFixed(1)}h</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-300 italic">No record</div>
                    )}
                  </td>
                  <td className="p-5">
                    {tc ? (
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Est. Gross</div>
                        <div className="text-sm font-black text-green-700">${gross.toLocaleString()}</div>
                      </div>
                    ) : (
                      <span className="text-gray-200">--</span>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      {item.status === 'APPROVED' ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : item.status === 'MISSING' ? (
                        <AlertCircle size={16} className="text-red-300" />
                      ) : (
                        <Clock size={16} className="text-blue-500" />
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          item.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                            item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              item.status === 'MISSING' ? 'bg-gray-100 text-gray-400' :
                                'bg-gray-100 text-gray-600'
                        }`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-2">
                      {tc ? (
                        <>
                          <button
                            onClick={() => setSelectedTimecardId(tc.id)}
                            className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:text-black hover:bg-white hover:shadow-sm transition-all"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {tc.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleApprove(tc.id)}
                              disabled={isApproving}
                              className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-gray-800 transition-all active:scale-95"
                            >
                              {isApproving ? "..." : "Approve"}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-[10px] font-black text-gray-300 uppercase italic">Not Created</div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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
