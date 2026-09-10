import {
  useGetTimecardsByPayPeriodQuery,
  useGetAllTimecardsQuery,
  useGetBillingRateQuery,
  useGetPayrollStartDateQuery,
  useArchiveTimecardsMutation,
} from "@/redux/api/financialApi";
import { useState, useMemo } from "react";
import {
  Search,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Users,
  Filter,
  Archive,
  ChevronDown,
  ChevronUp,
  FilterX,
} from "lucide-react";
import TimecardReviewDialog from "@/components/Deshboard/TimeCardDialog/TimecardReviewDialog";
import { generatePayrollPDF } from "@/utils/payrollPDFGenerator";
import { generatePayPeriods } from "@/utils/payPeriods";
import { timecardHours } from "@/utils/timecardHours";
import {
  timecardBreakdown,
  timecardHourlyRate,
  formatCurrency,
} from "@/utils/payrollTax";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

const STATUS_FILTERS = ["ALL", "SUBMITTED", "APPROVED", "REJECTED", "DRAFT"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

/** Every employee filter, i.e. no employee filter. */
const ALL_EMPLOYEES = "ALL";

/** The columns the payroll table can be ordered by. */
type SortKey =
  | "employee"
  | "utilization"
  | "hours"
  | "hourlyRate"
  | "gross"
  | "location"
  | "totalTax"
  | "net"
  | "payPeriod"
  | "year"
  | "status";

interface SortState {
  key: SortKey;
  direction: "asc" | "desc";
}

/**
 * The value a column sorts on.
 *
 * Money, hours and percentages return numbers so 0–100% and $0–$9,999 order
 * properly rather than as text, where "$1,046.89" sorts before "$613.05".
 * Everything textual is lowercased so A–Z ignores case.
 */
const sortValue = (item: any, key: SortKey): string | number | null => {
  switch (key) {
    case "employee":
      return (item.employee?.name || item.employee?.email || "").toLowerCase();
    case "utilization":
      return item.utilization;
    case "hours":
      // The column shows billable and overhead together; billable is the one
      // a payroll run is actually read against.
      return item.billableHours;
    case "hourlyRate":
      return item.hourlyRate;
    case "gross":
      return item.breakdown.gross;
    case "location":
      return (item.location || "").toLowerCase();
    case "totalTax":
      return item.breakdown.totalTax;
    case "net":
      return item.breakdown.net;
    case "payPeriod":
      return Number(item.timecard?.payPeriod ?? 0);
    case "year":
      return Number(item.timecard?.payYear ?? 0);
    case "status":
      return String(item.status || "").toLowerCase();
  }
};

/**
 * A column header that sorts the payroll table by its column.
 *
 * Both arrows always show, greyed until the column is the active one, so it
 * reads as "every column can be sorted" rather than only the one in use.
 */
function SortableTh({
  sortKey,
  sort,
  onSort,
  className = "",
  children,
}: {
  sortKey: SortKey;
  sort: SortState | null;
  onSort: (key: SortKey) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const isActive = sort?.key === sortKey;
  const direction = isActive ? sort.direction : null;

  return (
    <th
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : undefined
      }
      className={className}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="group inline-flex items-center gap-1 cursor-pointer hover:text-gray-900 transition-colors"
      >
        {children}
        <span className="flex flex-col leading-none">
          <ChevronUp
            size={10}
            className={
              direction === "asc"
                ? "text-gray-900"
                : "text-gray-300 group-hover:text-gray-400"
            }
          />
          <ChevronDown
            size={10}
            className={
              direction === "desc"
                ? "text-gray-900"
                : "text-gray-300 group-hover:text-gray-400"
            }
          />
        </span>
      </button>
    </th>
  );
}

/**
 * Order a copy of the rows. Rows with no value — an employee with no state on
 * file — sink to the bottom whichever way the column points, so reversing the
 * sort never buries the rows that do have data under a block of blanks.
 */
const sortPayrollItems = <T,>(items: T[], sort: SortState | null): T[] => {
  if (!sort) return items;
  const factor = sort.direction === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    const left = sortValue(a, sort.key);
    const right = sortValue(b, sort.key);

    const leftEmpty = left === null || left === undefined || left === "";
    const rightEmpty = right === null || right === undefined || right === "";
    if (leftEmpty && rightEmpty) return 0;
    if (leftEmpty) return 1;
    if (rightEmpty) return -1;

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * factor;
    }
    return String(left).localeCompare(String(right)) * factor;
  });
};

const TimecardsListTab = () => {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState(-1); // -1 means "All Periods"
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [employeeFilter, setEmployeeFilter] = useState<string>(ALL_EMPLOYEES);
  const [search, setSearch] = useState("");
  // Replaced the old "Sort By Employee" toggle: every column header sorts now,
  // so a single button pinned to one column had nothing left to do.
  const [sort, setSort] = useState<SortState | null>(null);

  /**
   * Click a header to sort by it; click again to reverse; a third click clears
   * back to the natural order, so there is always a way back without a reload.
   */
  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedTaxId, setExpandedTaxId] = useState<string | null>(null);
  const [selectedTimecardId, setSelectedTimecardId] = useState<string | null>(null);

  // Pay periods are anchored to the firm's payroll start date, not to Jan 1.
  const { data: payrollSettings } = useGetPayrollStartDateQuery();
  const periods = useMemo(
    () => generatePayPeriods(selectedYear, payrollSettings?.payrollStartDate),
    [selectedYear, payrollSettings]
  );
  const activePeriod = periods.find((p) => p.period === selectedPeriod);

  const { data: periodTimecards = [], isLoading: isLoadingPeriod } = useGetTimecardsByPayPeriodQuery(
    { year: selectedYear, period: selectedPeriod },
    { skip: selectedPeriod === -1 }
  );

  const { data: allTimecards = [], isLoading: isLoadingAll } = useGetAllTimecardsQuery(undefined, {
    skip: selectedPeriod !== -1,
  });

  const timecards = selectedPeriod === -1 ? allTimecards : periodTimecards;
  const isLoadingTimecards = selectedPeriod === -1 ? isLoadingAll : isLoadingPeriod;

  const { data: billingRateData } = useGetBillingRateQuery();
  const [archiveTimecards, { isLoading: isArchiving }] = useArchiveTimecardsMutation();

  /**
   * The years the table can be filtered to: every year the firm has timecards
   * in, plus the current one. Nothing before the first timecard and nothing
   * after this year, so the dropdown never offers an empty view.
   */
  const yearOptions = useMemo(() => {
    const years = new Set<number>([currentYear]);
    (allTimecards as any[]).forEach((tc) => {
      if (tc?.payYear) years.add(Number(tc.payYear));
    });
    (periodTimecards as any[]).forEach((tc) => {
      if (tc?.payYear) years.add(Number(tc.payYear));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allTimecards, periodTimecards, currentYear]);

  /** One entry per person who has a timecard, for the employee filter. */
  const employeeOptions = useMemo(() => {
    const byId = new Map<string, string>();
    (timecards as any[]).forEach((tc) => {
      if (tc?.user?.id) byId.set(tc.user.id, tc.user.name || tc.user.email || "Unknown");
    });
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [timecards]);

  /** One row per timecard, with all payroll figures resolved up front. */
  const payrollItems = useMemo(() => {
    const query = search.toLowerCase();
    return timecards
      .filter((tc: any) => {
        const matchesSearch =
          (tc.user?.name || "").toLowerCase().includes(query) ||
          (tc.user?.email || "").toLowerCase().includes(query);
        const matchesStatus = statusFilter === "ALL" || tc.status === statusFilter;
        const matchesEmployee =
          employeeFilter === ALL_EMPLOYEES || tc.user?.id === employeeFilter;
        // The year picker only reached the server on a specific pay period;
        // on "All Periods" it read every year at once and changing it did
        // nothing. Filtering here makes it apply in both modes.
        const matchesYear = Number(tc.payYear) === selectedYear;
        return matchesSearch && matchesStatus && matchesEmployee && matchesYear;
      })
      .map((tc: any) => {
        const profile = tc.user?.employeeProfile;
        const hours = timecardHours(tc);
        const breakdown = timecardBreakdown(tc);

        return {
          id: tc.id,
          timecard: tc,
          employee: tc.user,
          status: tc.status,
          billableHours: hours.billable,
          overheadHours: hours.overhead,
          utilization: hours.utilization,
          // An approved card is quoted at the rate it was approved under.
          hourlyRate: timecardHourlyRate(tc),
          salary: Number(profile?.salary || 0),
          location: profile?.state || null,
          breakdown,
        };
      });
  }, [timecards, search, statusFilter, employeeFilter, selectedYear]);

  /** Ordering is applied after filtering, so it covers every matching row. */
  const sortedPayrollItems = useMemo(
    () => sortPayrollItems(payrollItems, sort),
    [payrollItems, sort],
  );

  /** The status tallies follow the year in view, not the whole history. */
  const yearTimecards = useMemo(
    () => (timecards as any[]).filter((tc) => Number(tc.payYear) === selectedYear),
    [timecards, selectedYear],
  );

  /** Whether anything is narrowing the table right now. */
  const hasActiveFilters =
    selectedYear !== currentYear ||
    selectedPeriod !== -1 ||
    statusFilter !== "ALL" ||
    employeeFilter !== ALL_EMPLOYEES ||
    search.trim() !== "";

  const clearFilters = () => {
    setSelectedYear(currentYear);
    setSelectedPeriod(-1);
    setStatusFilter("ALL");
    setEmployeeFilter(ALL_EMPLOYEES);
    setSearch("");
    // Sorting is a view preference rather than a filter, so "Clear filters"
    // leaves the chosen column order alone.
    setSelectedIds(new Set());
  };

  /** Grand totals across every visible row. */
  const grandTotals = useMemo(
    () =>
      payrollItems.reduce(
        (acc, item) => ({
          billableHours: acc.billableHours + item.billableHours,
          overheadHours: acc.overheadHours + item.overheadHours,
          gross: acc.gross + item.breakdown.gross,
          tax: acc.tax + item.breakdown.totalTax,
          net: acc.net + item.breakdown.net,
        }),
        { billableHours: 0, overheadHours: 0, gross: 0, tax: 0, net: 0 }
      ),
    [payrollItems]
  );

  const archivableIds = useMemo(
    () => payrollItems.filter((i) => i.status === "APPROVED").map((i) => i.id),
    [payrollItems]
  );
  const selectedArchivable = useMemo(
    () => archivableIds.filter((id) => selectedIds.has(id)),
    [archivableIds, selectedIds]
  );
  const allArchivableSelected =
    archivableIds.length > 0 && selectedArchivable.length === archivableIds.length;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allArchivableSelected ? new Set() : new Set(archivableIds));
  };

  const handleArchive = async () => {
    if (selectedArchivable.length === 0) return;
    try {
      await archiveTimecards(selectedArchivable).unwrap();
      toast.success(
        `${selectedArchivable.length} timecard${selectedArchivable.length > 1 ? "s" : ""} archived`
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to archive");
    }
  };

  const canProcessPayroll = useMemo(
    () => selectedPeriod !== -1 && timecards.some((tc: any) => tc.status === "APPROVED"),
    [selectedPeriod, timecards]
  );

  const handleProcessPayroll = () => {
    if (!activePeriod) return;
    try {
      generatePayrollPDF({
        payYear: selectedYear,
        payPeriod: selectedPeriod,
        weekStarting: activePeriod.startDate.toISOString(),
        weekEnding: activePeriod.endDate.toISOString(),
        billingRate: billingRateData?.billingRate || 0,
        timecards: timecards.filter((tc: any) => tc.status === "APPROVED"),
      });
      toast.success("Payroll PDF generated successfully");
    } catch {
      toast.error("Failed to generate payroll PDF");
    }
  };

  if (isLoadingTimecards) return <Loader fullScreen={false} />;

  return (
    <div className="space-y-6">
      {/* Filters & Actions Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 sm:space-y-6">
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
            {/* The "Sort By Employee" toggle that used to sit here is gone —
                the Employee column header sorts now, along with every other. */}

            {/* Narrows the run to one person, rather than only grouping them. */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 sm:px-4 py-2 rounded-xl">
              <Users size={14} className="text-gray-400" />
              <select
                className="text-sm bg-transparent outline-none font-bold text-gray-700 max-w-[160px]"
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
              >
                <option value={ALL_EMPLOYEES}>All Employees</option>
                {employeeOptions.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl">
              <Calendar size={14} className="text-gray-400" />
              <select
                className="text-sm bg-transparent outline-none font-bold text-gray-700"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                    {y === currentYear ? " (Current Year)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 sm:px-4 py-2 rounded-xl">
              <Filter size={14} className="text-gray-400" />
              <select
                className="text-sm bg-transparent outline-none font-bold text-gray-700"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All Statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 sm:px-4 py-2 rounded-xl min-w-[160px] sm:min-w-[200px]">
              <Clock size={14} className="text-gray-400" />
              <select
                className="text-sm bg-transparent outline-none font-bold text-gray-700 w-full"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              >
                <option value={-1}>All Periods</option>
                {periods.map((p) => (
                  <option key={p.period} value={p.period}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Puts every filter back to its default in one click. */}
            <Button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              variant="outline"
              className={`font-black uppercase tracking-widest px-5 transition-all active:scale-95 ${
                hasActiveFilters
                  ? "border-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white"
                  : "text-gray-300"
              }`}
            >
              <FilterX size={16} className="mr-2" />
              Clear Filters
            </Button>

            <Button
              onClick={handleArchive}
              disabled={selectedArchivable.length === 0 || isArchiving}
              variant="outline"
              className={`font-black uppercase tracking-widest px-5 transition-all active:scale-95 ${
                selectedArchivable.length > 0
                  ? "border-amber-300 text-amber-700 hover:bg-amber-600 hover:text-white"
                  : "text-gray-300"
              }`}
            >
              <Archive size={16} className="mr-2" />
              Archive{selectedArchivable.length > 0 ? ` (${selectedArchivable.length})` : ""}
            </Button>

            <Button
              onClick={handleProcessPayroll}
              disabled={!canProcessPayroll}
              className={`font-black uppercase tracking-widest px-6 shadow-lg transition-all active:scale-95 ${
                canProcessPayroll
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

          <div className="flex flex-wrap gap-3 sm:gap-6 items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Approved: {yearTimecards.filter((t: any) => t.status === "APPROVED").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Pending: {yearTimecards.filter((t: any) => t.status === "SUBMITTED").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Rejected: {yearTimecards.filter((t: any) => t.status === "REJECTED").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {/* Bounded height rather than growing down the page. `overflow-x-auto`
          alone already made this the scroll container for sticky cells inside
          it, but it had no height to scroll against, so they never moved. */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-auto max-h-[70vh] shadow-sm">
        <table className="w-full text-sm min-w-[1800px]">
          {/* Sticky per `th`, not on the `thead`: support for a sticky thead is
              patchy, and each cell needs its own background or the rows show
              through as they pass beneath it. */}
          <thead className="bg-gray-50 [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-gray-50 [&_th]:border-b [&_th]:border-gray-100">
            <tr className="[&>th]:p-4 [&>th]:text-left [&>th]:font-black [&>th]:text-gray-400 [&>th]:uppercase [&>th]:tracking-widest [&>th]:text-[10px] [&>th]:whitespace-nowrap">
              <th className="w-12">
                <input
                  type="checkbox"
                  checked={allArchivableSelected}
                  onChange={toggleSelectAll}
                  disabled={archivableIds.length === 0}
                  title="Select all approved timecards"
                  className="w-4 h-4 accent-black cursor-pointer disabled:cursor-not-allowed"
                />
              </th>
              <SortableTh sortKey="employee" sort={sort} onSort={toggleSort}>
                Employee
              </SortableTh>
              <SortableTh sortKey="utilization" sort={sort} onSort={toggleSort}>
                Utilization Rate
              </SortableTh>
              <SortableTh sortKey="hours" sort={sort} onSort={toggleSort}>
                Hours Breakdown
              </SortableTh>
              <SortableTh sortKey="hourlyRate" sort={sort} onSort={toggleSort}>
                Hourly / Salary
              </SortableTh>
              <SortableTh sortKey="gross" sort={sort} onSort={toggleSort}>
                Gross Pay
              </SortableTh>
              <SortableTh sortKey="location" sort={sort} onSort={toggleSort}>
                State/Region/Country
              </SortableTh>
              <SortableTh sortKey="totalTax" sort={sort} onSort={toggleSort}>
                Total Taxes
              </SortableTh>
              {/* Not sortable — it holds an expander, not a value. */}
              <th>Taxes Breakdown</th>
              <SortableTh sortKey="net" sort={sort} onSort={toggleSort}>
                Net Pay
              </SortableTh>
              <SortableTh sortKey="payPeriod" sort={sort} onSort={toggleSort}>
                Pay Period
              </SortableTh>
              <SortableTh sortKey="year" sort={sort} onSort={toggleSort}>
                Year
              </SortableTh>
              <SortableTh sortKey="status" sort={sort} onSort={toggleSort}>
                Status
              </SortableTh>
              {/* Not sortable — it holds buttons. */}
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedPayrollItems.map((item) => {
              const tc = item.timecard;
              const emp = item.employee;
              const isExpanded = expandedTaxId === item.id;

              return (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group align-top">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      disabled={item.status !== "APPROVED"}
                      title={
                        item.status === "APPROVED"
                          ? "Select for archiving"
                          : "Only approved timecards can be archived"
                      }
                      className="w-4 h-4 accent-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                    />
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs flex-shrink-0">
                        {emp?.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("") || "?"}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                          {emp?.name || "Unknown User"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {emp?.role?.replace(/_/g, " ") || "Employee"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="text-sm font-black text-blue-600">
                      {item.utilization.toFixed(0)}%
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-4">
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                          Billable
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {item.billableHours.toFixed(1)}h
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                          Overhead
                        </div>
                        <div className="text-sm font-bold text-gray-500">
                          {item.overheadHours.toFixed(1)}h
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(item.hourlyRate)}
                      <span className="text-[10px] text-gray-400">/hr</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold">
                      {item.salary > 0 ? `${formatCurrency(item.salary)}/yr` : "No salary set"}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                      Est. Gross
                    </div>
                    <div className="text-sm font-black text-green-700 whitespace-nowrap">
                      {formatCurrency(item.breakdown.gross)}
                    </div>
                  </td>

                  <td className="p-4 text-xs font-bold text-gray-600 whitespace-nowrap">
                    {item.location ? `${item.location}/United States` : "—"}
                  </td>

                  <td className="p-4">
                    <div className="text-sm font-black text-red-600 whitespace-nowrap">
                      {formatCurrency(item.breakdown.totalTax)}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold">
                      {item.breakdown.totalTaxPercentage.toFixed(2)}%
                    </div>
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => setExpandedTaxId(isExpanded ? null : item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all whitespace-nowrap"
                    >
                      See Breakdown
                      <ChevronDown size={12} className={isExpanded ? "rotate-180" : ""} />
                    </button>
                    {isExpanded && (
                      <div className="mt-2 w-56 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                        {item.breakdown.lines.length === 0 ? (
                          <p className="text-[10px] text-gray-400 italic font-bold">
                            No tax lines on this employee's profile.
                          </p>
                        ) : (
                          item.breakdown.lines.map((line) => (
                            <div
                              key={line.id}
                              className="flex justify-between items-center text-[10px] font-bold"
                            >
                              <span className="text-gray-600">{line.label}</span>
                              <span className="flex gap-2 items-center">
                                <span className="text-gray-400">{line.percentage}%</span>
                                <span className="text-red-600 w-16 text-right">
                                  {formatCurrency(line.amount)}
                                </span>
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                      Net
                    </div>
                    <div className="text-sm font-black text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.breakdown.net)}
                    </div>
                  </td>

                  <td className="p-4 text-xs font-bold text-gray-600 whitespace-nowrap">
                    Period {tc.payPeriod}
                  </td>

                  <td className="p-4 text-xs font-bold text-gray-600">{tc.payYear}</td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {item.status === "APPROVED" ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : item.status === "REJECTED" ? (
                        <AlertCircle size={16} className="text-red-400" />
                      ) : (
                        <Clock size={16} className="text-blue-500" />
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                          item.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : item.status === "SUBMITTED"
                              ? "bg-blue-100 text-blue-700"
                              : item.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    {/* View only — approving happens inside the review dialog */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedTimecardId(item.id)}
                        className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:text-black hover:bg-white hover:shadow-sm transition-all"
                        title="View & review timecard"
                      >
                        <Eye size={18} />
                      </button>
                      {item.status === "APPROVED" && (
                        <button
                          onClick={async () => {
                            try {
                              await archiveTimecards([item.id]).unwrap();
                              toast.success("Timecard archived");
                            } catch (err: any) {
                              toast.error(err?.data?.message || "Failed to archive");
                            }
                          }}
                          disabled={isArchiving}
                          className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all disabled:opacity-50"
                          title="Archive this timecard"
                        >
                          <Archive size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {payrollItems.length === 0 && (
              <tr>
                <td colSpan={14} className="p-12 text-center text-sm text-gray-400 font-medium italic">
                  No timecards match the current filters.
                </td>
              </tr>
            )}
          </tbody>

          {payrollItems.length > 0 && (
            <tfoot className="bg-gray-50 [&_td]:sticky [&_td]:bottom-0 [&_td]:z-20 [&_td]:bg-gray-50 [&_td]:border-t-2 [&_td]:border-gray-200">
              <tr className="[&>td]:p-4 [&>td]:whitespace-nowrap">
                <td />
                <td className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Grand Total ({payrollItems.length})
                </td>
                <td />
                <td>
                  <div className="flex gap-4">
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                        Billable
                      </div>
                      <div className="text-sm font-black text-gray-900">
                        {grandTotals.billableHours.toFixed(1)}h
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                        Overhead
                      </div>
                      <div className="text-sm font-black text-gray-500">
                        {grandTotals.overheadHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                </td>
                <td />
                <td className="text-sm font-black text-green-700">
                  {formatCurrency(grandTotals.gross)}
                </td>
                <td />
                <td className="text-sm font-black text-red-600">{formatCurrency(grandTotals.tax)}</td>
                <td />
                <td className="text-sm font-black text-gray-900">{formatCurrency(grandTotals.net)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {selectedTimecardId && (
        <TimecardReviewDialog
          open={!!selectedTimecardId}
          onOpenChange={(open) => !open && setSelectedTimecardId(null)}
          timecardId={selectedTimecardId}
          canReview
        />
      )}
    </div>
  );
};

export default TimecardsListTab;
