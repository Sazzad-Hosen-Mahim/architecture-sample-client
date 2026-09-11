import React, { useState, useRef, useEffect } from "react";
import {
  useGetAdminViewAllProposalsQuery,
  Proposal,
  useSendProposalToClientMutation,
  useAddServiceMutation,
  useDeleteProposalMutation,
  // useSignProposalMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import {
  useGetAmendmentsQuery,
  useReviewAmendmentMutation,
  useCreateProposalFromAmendmentMutation,
  useCompleteAmendmentMutation,
  useGetAllProposalsForProposalQuery,
  Amendment,
} from "@/redux/api/amendmentApi";
import ContractReviewModal from "@/components/Deshboard/ContractReviewModal";
import {
  FileTextIcon,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  CalendarRange,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { formatCurrency } from "@/utils/money";
import { projectRun, runDaysLabel, shareOfYear } from "@/utils/contractYears";

/**
 * Which proposals the table shows. Purely a filter now — everything that used
 * to be a sort here (Newest, Oldest, Project Manager, Status) is an arrow on
 * the column itself, so one control no longer does two unrelated jobs.
 */
type StatusFilter = "all" | "active" | "accepted";

/** Columns the table can be ordered by. */
type SortKey =
  | "client"
  | "manager"
  | "status"
  | "startDate"
  | "endDate"
  | "originalTotal"
  | "originalPaid"
  | "amendmentTotal"
  | "amendmentPaid"
  | "contractedTotal"
  | "created";

type SortDir = "asc" | "desc";
import { Loader } from "@/components/ui/loader";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

/** The year filter's "no year" option — every year's amounts in full. */
const ALL_TIME = "all";

/** "LUMP_SUM" -> "Lump Sum", "RESIDENTIAL" -> "Residential" */
const toTitleCase = (value?: string | null) =>
  (value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const Proposals = () => {
  const {
    data: proposalsData,
    isLoading,
    isError,
  } = useGetAdminViewAllProposalsQuery();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  // Opens on everything. It used to default to active projects only, which
  // quietly hid most of the archive — and the totals underneath along with it.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  /** Click a column to sort by it; click it again to flip the direction. */
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Money and dates are nearly always wanted largest/newest first.
      setSortDir(key === "client" || key === "status" ? "asc" : "desc");
    }
    setPage(1);
  };
  const [amendmentsOnly, setAmendmentsOnly] = useState(false);
  // "All Time" shows each contract in full; a year shows only the slice of it
  // that belongs to that year, so the column totals reconcile with the
  // Financial Dashboard's yearly figures.
  const [yearFilter, setYearFilter] = useState<string>(ALL_TIME);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Memoised so the grouping below isn't recomputed on every render.
  const proposals = React.useMemo(
    () => proposalsData?.data ?? [],
    [proposalsData],
  );

  /**
   * A column header that can be ordered by. Shows a faint neutral arrow until
   * it is the active column, then the direction it is actually sorted in — so
   * the table always says which column is driving the order.
   */
  const SortableTh = ({
    label,
    group,
    sortKey: key,
    align = "left",
  }: {
    label: string;
    /**
     * Which contract the column belongs to, set on its own line above the
     * label. Four headers otherwise read as four unrelated phrases that each
     * have to be parsed to the end before it is clear which pair they are —
     * stacked, the eye reads "Original" once and then the two measures under
     * it.
     */
    group?: string;
    sortKey: SortKey;
    align?: "left" | "center" | "right";
  }) => {
    const active = sortKey === key;

    // Written out rather than interpolated into `text-${align}`. Tailwind
    // finds classes by scanning the source for whole names, so a template
    // hole generates no CSS at all — the old form only rendered because
    // `text-right` happened to be written literally somewhere else in the app.
    const cellAlign =
      align === "right"
        ? "text-right"
        : align === "center"
          ? "text-center"
          : "text-left";

    // The stacked group and label line up with each other, and the button as a
    // whole lines up with the column beneath it — a header centred over
    // right-aligned figures reads as crooked whichever of the two moved.
    const stackAlign =
      align === "right"
        ? "items-end"
        : align === "center"
          ? "items-center"
          : "items-start";

    return (
      <th
        className={`px-2 py-2 ${cellAlign} text-[10px] font-semibold text-gray-700 uppercase tracking-tight`}
      >
        <button
          type="button"
          onClick={() => toggleSort(key)}
          title={`Sort by ${group ? `${group} ${label}` : label}`}
          className={`inline-flex items-center gap-1 uppercase tracking-tight cursor-pointer hover:text-blue-600 ${
            align === "right" ? "flex-row-reverse" : ""
          } ${active ? "text-blue-600" : ""}`}
        >
          <span className={`flex flex-col leading-tight ${stackAlign}`}>
            {group && (
              <span className="text-[9px] font-bold text-gray-400">
                {group}
              </span>
            )}
            <span>{label}</span>
          </span>
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp size={11} />
            ) : (
              <ArrowDown size={11} />
            )
          ) : (
            <ArrowUpDown size={11} className="text-gray-300" />
          )}
        </button>
      </th>
    );
  };

  /** "City, State, Country" for the Location column. */
  const locationOf = (proposal: any) => {
    const pr = proposal.projectRequest;
    const parts = [
      pr?.projectCity,
      pr?.projectState,
      pr?.projectCountry,
    ].filter(Boolean);
    return parts.length > 0
      ? parts.join(", ")
      : proposal.projectLocation || "—";
  };

  /**
   * Amendments hang off their original contract rather than sitting at the
   * top level, so each project reads as one contract with its revisions.
   */
  /** The PM assigned to the proposal's project, however the API shapes it. */
  const managerNameOf = (p: any): string =>
    p?.assignedManager?.name ||
    p?.projectRequest?.assignedManager?.name ||
    p?.assignedTo?.name ||
    "";

  const groupedProposals = React.useMemo(() => {
    const all: any[] = proposals as any[];
    const amendmentsByParent = new Map<string, any[]>();
    const originals: any[] = [];

    all.forEach((p: any) => {
      if (p.proposalType === "AMENDMENT" && p.parentProposalId) {
        const list = amendmentsByParent.get(p.parentProposalId) || [];
        list.push(p);
        amendmentsByParent.set(p.parentProposalId, list);
      } else {
        originals.push(p);
      }
    });

    // An amendment whose parent isn't in the list still needs showing.
    const originalIds = new Set(originals.map((p) => p.id));
    amendmentsByParent.forEach((list, parentId) => {
      if (!originalIds.has(parentId)) originals.push(...list);
    });

    const query = search.trim().toLowerCase();
    const matches = (p: any) =>
      !query ||
      (p.proposalNumber || "").toLowerCase().includes(query) ||
      (p.clientName || "").toLowerCase().includes(query) ||
      (p.projectName || "").toLowerCase().includes(query) ||
      managerNameOf(p).toLowerCase().includes(query) ||
      locationOf(p).toLowerCase().includes(query);

    const selectedYear = yearFilter === ALL_TIME ? null : Number(yearFilter);

    return (
      originals
        .map((p: any) => {
          const amendments = (amendmentsByParent.get(p.id) || []).sort(
            (a: any, b: any) =>
              (a.proposalNumber || "").localeCompare(b.proposalNumber || ""),
          );

          // The project's run drives both the date columns and the year split.
          const pr = p.projectRequest;
          const run = projectRun(pr?.projectStartedAt, pr?.projectCompletedAt);

          const originalTotal = Number(p.totalAmount || 0);
          const amendmentTotal = amendments.reduce(
            (sum: number, a: any) => sum + Number(a.totalAmount || 0),
            0,
          );

          // What of the above is actually under contract.
          //
          // A DRAFT has not been sent to anyone and a SENT one has not been
          // signed: both are quotes, and the Financial Overview counts neither
          // — it reads only ACCEPTED proposals. Summing every row here
          // regardless is what put the two screens $9 apart on amendments,
          // which was three draft amendments ($5 + $4 + $0) being totalled as
          // though the clients had agreed to them.
          //
          // The rows still show their own figures, quoted or signed. It is the
          // grand total that is contracted, and it says so.
          const isSigned = (x: { status?: string } | null | undefined) =>
            x?.status === "ACCEPTED";
          const contractedOriginal = isSigned(p) ? originalTotal : 0;
          const contractedAmendment = amendments
            .filter(isSigned)
            .reduce((sum: number, a) => sum + Number(a.totalAmount || 0), 0);

          // What the client has actually handed over, against what they signed
          // for. `paidAmount` is the sum of that contract's completed payments,
          // the same basis as the Financial Summary's Client Paid — so a row
          // here can be reconciled against the dashboard.
          const originalPaid = Number(p.paidAmount || 0);
          const amendmentPaid = amendments.reduce(
            (sum: number, a: any) => sum + Number(a.paidAmount || 0),
            0,
          );

          // On a year, a contract contributes only the portion earned in that
          // year. A project with no run yet has no year to attribute to.
          const share =
            selectedYear === null ? 1 : shareOfYear(run, selectedYear);

          return {
            ...p,
            amendments,
            run,
            share,
            originalTotal: originalTotal * share,
            amendmentTotal: amendmentTotal * share,
            // Paid rides the same year share as the contract it settles, so a
            // project spanning two years splits both columns the same way and
            // the pair stays comparable.
            originalPaid: originalPaid * share,
            amendmentPaid: amendmentPaid * share,
            contractedOriginal: contractedOriginal * share,
            contractedAmendment: contractedAmendment * share,
            // The Contracted Total column, and what the grand total sums. A row
            // with nothing signed contributes nothing and shows a dash.
            rowTotal: (contractedOriginal + contractedAmendment) * share,
            isContracted: isSigned(p) || amendments.some(isSigned),
          };
        })
        // Keep a contract when it matches, or when any of its amendments do.
        .filter((p: any) => matches(p) || p.amendments.some(matches))
        // Only projects that were actually running in the selected year.
        .filter((p: any) => selectedYear === null || p.share > 0)
        .filter((p: any) => !amendmentsOnly || p.amendments.length > 0)
        .filter((p) => {
          if (statusFilter === "active")
            return p.projectRequest?.status === "ACTIVE";
          if (statusFilter === "accepted") return p.status === "ACCEPTED";
          return true;
        })
        .sort((a: any, b: any) => {
          const dir = sortDir === "asc" ? 1 : -1;
          const time = (v: string | number | Date | null | undefined) =>
            v ? new Date(v).getTime() : 0;

          switch (sortKey) {
            case "client":
              return (
                dir * (a.clientName || "").localeCompare(b.clientName || "")
              );
            // `managerNameOf` reads the PM from whichever shape the API
            // returned it in, and gives "" for an unassigned project — so
            // those gather at one end instead of scattering through the list.
            case "manager":
              return dir * managerNameOf(a).localeCompare(managerNameOf(b));
            case "status":
              return dir * (a.status || "").localeCompare(b.status || "");
            // A project with no start or end date sorts as 0, which parks the
            // not-yet-started ones together at one end rather than scattering
            // them through the list.
            case "startDate":
              return dir * (time(a.run?.start) - time(b.run?.start));
            case "endDate":
              return dir * (time(a.run?.end) - time(b.run?.end));
            case "originalTotal":
              return dir * (a.originalTotal - b.originalTotal);
            case "originalPaid":
              return dir * (a.originalPaid - b.originalPaid);
            // The signed figure, because that is the one the column shows.
            case "amendmentTotal":
              return dir * (a.contractedAmendment - b.contractedAmendment);
            case "amendmentPaid":
              return dir * (a.amendmentPaid - b.amendmentPaid);
            case "contractedTotal":
              return dir * (a.rowTotal - b.rowTotal);
            case "created":
            default:
              return dir * (time(a.createdAt) - time(b.createdAt));
          }
        })
    );
  }, [
    proposals,
    search,
    statusFilter,
    sortKey,
    sortDir,
    amendmentsOnly,
    yearFilter,
  ]);

  /**
   * The years the filter offers: every year any project has run through, plus
   * the current one. Nothing before the firm's first project.
   */
  const yearOptions = React.useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    (proposals as any[]).forEach((p) => {
      const pr = p.projectRequest;
      projectRun(pr?.projectStartedAt, pr?.projectCompletedAt).slices.forEach(
        (s) => years.add(s.year),
      );
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [proposals]);

  /**
   * Column sums over every filtered row.
   *
   * The two *total* columns count signed contracts only, which is what makes
   * this row reconcile with the Financial Overview — see the note where
   * `contractedOriginal` is worked out.
   *
   * The two *paid* columns are not filtered the same way, and deliberately:
   * money received is money received whatever state the paperwork is in, and
   * the dashboard counts every completed payment regardless of its contract's
   * status. Filtering here would reintroduce the gap at the other end.
   */
  const columnTotals = React.useMemo(
    () =>
      groupedProposals.reduce(
        (acc: any, p: any) => ({
          original: acc.original + p.contractedOriginal,
          originalPaid: acc.originalPaid + p.originalPaid,
          amendment: acc.amendment + p.contractedAmendment,
          amendmentPaid: acc.amendmentPaid + p.amendmentPaid,
          total: acc.total + p.rowTotal,
        }),
        {
          original: 0,
          originalPaid: 0,
          amendment: 0,
          amendmentPaid: 0,
          total: 0,
        },
      ),
    [groupedProposals],
  );

  // Pagination — rows per page is user-selectable (default 25).
  const totalPages = Math.max(1, Math.ceil(groupedProposals.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageProposals = groupedProposals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
    // Sorting is not here: reordering the same rows should not throw you back
    // to page one. The filters change which rows exist, so they do.
  }, [search, statusFilter, pageSize, amendmentsOnly, yearFilter]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "VIEWED":
        return "bg-purple-100 text-purple-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "REVISED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) return <Loader />;

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load proposals.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Proposals</h1>
          <span className="text-sm text-gray-500">
            {proposals.length} total proposals
          </span>
        </div>
        <Link
          to="/dashboard/financials?tab=payroll"
          title="Back to Accountant's Controls"
          className="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <X size={20} />
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by proposal #, client, project, project manager or location..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* A filter, not a sort. Ordering lives on the column headers now, so
            this only decides which proposals are in the table — and it opens on
            All, rather than silently showing active projects alone. */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
          <Filter size={14} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="text-sm bg-transparent outline-none font-bold text-gray-700 cursor-pointer"
          >
            <option value="all">All Proposals</option>
            <option value="accepted">Accepted</option>
            <option value="active">Active Projects</option>
          </select>
        </div>

        {/* On a year, each contract shows only the portion earned in that
            year, so the column totals match the Financial Dashboard. */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
          <CalendarRange size={14} className="text-gray-400" />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-sm bg-transparent outline-none font-bold text-gray-700 cursor-pointer"
          >
            <option value={ALL_TIME}>All Time (All Years)</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
                {y === new Date().getFullYear() ? " (Current Year)" : ""}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2.5 rounded-xl cursor-pointer select-none">
          <input
            type="checkbox"
            checked={amendmentsOnly}
            onChange={(e) => setAmendmentsOnly(e.target.checked)}
            className="w-4 h-4 accent-black cursor-pointer"
          />
          <span className="text-sm font-bold text-gray-700">
            Projects with Amendments
          </span>
        </label>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No proposals found.</p>
        </div>
      ) : (
        // Bounded height rather than growing down the page. `overflow-x-auto`
        // alone already made this the scroll container for sticky cells inside
        // it, but it had no height to scroll against, so they never moved.
        <div className="overflow-auto max-h-[70vh] bg-white rounded-lg shadow">
          {/* `w-full` rather than `min-w-full`: with the wide columns free to
              wrap, the table should settle into the container instead of being
              pushed out to whatever its widest row demands. `overflow-x-auto`
              on the wrapper stays as the fallback for very narrow screens. */}
          <table className="w-full table-auto divide-y divide-gray-200">
            {/* Sticky on each `th`, not on the `thead`: browser support for a
                sticky thead is patchy, and every cell needs its own background
                anyway or the rows show through as they scroll beneath it. */}
            <thead className="bg-gray-50 [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-gray-50 [&_th]:border-b [&_th]:border-gray-200">
              <tr>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Proposal #
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Amendment Total #
                </th>
                <SortableTh label="Client" sortKey="client" />
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Project
                </th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Location
                </th>
                <SortableTh label="Project Manager" sortKey="manager" />
                <SortableTh label="Status" sortKey="status" />
                <SortableTh label="Start Date" sortKey="startDate" />
                <SortableTh label="End Date" sortKey="endDate" />
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Total Days
                </th>
                {/* Centred, not right-aligned: every figure in these five
                    columns — rows, amendment sub-rows and the totals row — is
                    `text-center`, so a right-aligned header sat off to one side
                    of its own numbers. */}
                <SortableTh
                  group="Original"
                  label="Contract Total"
                  sortKey="originalTotal"
                  align="center"
                />
                <SortableTh
                  group="Original"
                  label="Contract Paid"
                  sortKey="originalPaid"
                  align="center"
                />
                <SortableTh
                  group="Amendment"
                  label="Contract Total"
                  sortKey="amendmentTotal"
                  align="center"
                />
                <SortableTh
                  group="Amendment"
                  label="Contract Paid"
                  sortKey="amendmentPaid"
                  align="center"
                />
                <SortableTh
                  group="Contracted"
                  label="Total"
                  sortKey="contractedTotal"
                  align="center"
                />
                <SortableTh label="Created" sortKey="created" />
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageProposals.length === 0 && (
                <tr>
                  <td
                    colSpan={17}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    No proposals match these filters.
                  </td>
                </tr>
              )}
              {pageProposals.map((proposal: any) => {
                const hasAmendments = proposal.amendments.length > 0;
                const isExpanded = expandedIds.has(proposal.id);

                return (
                  <React.Fragment key={proposal.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {hasAmendments ? (
                            <button
                              onClick={() => toggleExpanded(proposal.id)}
                              className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                              title={
                                isExpanded
                                  ? "Hide amendments"
                                  : "Show amendments"
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </button>
                          ) : (
                            <span className="w-[22px]" />
                          )}
                          {proposal.proposalNumber}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs">
                        {hasAmendments ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold">
                            {proposal.amendments.length}
                          </span>
                        ) : (
                          <span className="text-gray-300">0</span>
                        )}
                      </td>
                      {/* The free-text columns wrap rather than `nowrap`. A
                          location like "Oklahoma City, Calfiornia, United
                          States" held on one line is what pushed the last
                          columns off the screen; wrapping lets these four give
                          back the width the fixed columns need. */}
                      <td className="px-2 py-2 text-xs text-gray-600">
                        {proposal.clientName}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-600">
                        {proposal.projectName}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-600 min-w-[7rem]">
                        {locationOf(proposal)}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-600">
                        {managerNameOf(proposal) || (
                          <span className="text-gray-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-[10px] leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}
                        >
                          {proposal.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                        {proposal.run.start ? (
                          formatDate(proposal.run.start.toISOString())
                        ) : (
                          <span className="text-gray-400 italic">
                            Not started
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                        {!proposal.run.start ? (
                          <span className="text-gray-400 italic">—</span>
                        ) : proposal.run.ongoing ? (
                          <span className="text-gray-400 italic">
                            In progress
                          </span>
                        ) : (
                          formatDate(proposal.run.end.toISOString())
                        )}
                      </td>
                      <td
                        className="px-2 py-2 whitespace-nowrap text-xs text-gray-600"
                        title={
                          proposal.run.slices.length > 1
                            ? proposal.run.slices
                                .map((s: any) => `${s.year}: ${s.days} days`)
                                .join(" · ")
                            : undefined
                        }
                      >
                        {/* "50/365/23 = 438" once a project spans more than
                            one year, so the split is readable at a glance. */}
                        {runDaysLabel(proposal.run)}
                        {proposal.run.slices.length > 1 && (
                          <span className="text-gray-400">
                            {" "}
                            = {proposal.run.totalDays}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-center font-semibold text-gray-700">
                        {formatCurrency(proposal.originalTotal)}
                      </td>
                      {/* Green once the contract is settled in full, so a row
                          that still owes money is visible at a glance rather
                          than needing the two figures compared. */}
                      <td
                        className={`px-2 py-2 whitespace-nowrap text-xs text-center font-semibold ${
                          proposal.originalPaid >= proposal.originalTotal &&
                          proposal.originalTotal > 0
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {formatCurrency(proposal.originalPaid)}
                      </td>
                      {/* Signed amendments only, matching the totals row and
                          the dashboard. Counting drafts here was what made a
                          project read $9 collapsed but $5 + a draft expanded —
                          the number claimed more was agreed than had been. */}
                      <td
                        className="px-2 py-2 whitespace-nowrap text-xs text-center font-semibold text-purple-700"
                        title={
                          proposal.amendmentTotal !== proposal.contractedAmendment
                            ? `${formatCurrency(proposal.amendmentTotal - proposal.contractedAmendment)} more is quoted on unsigned amendments, and is not counted`
                            : undefined
                        }
                      >
                        {formatCurrency(proposal.contractedAmendment)}
                      </td>
                      <td
                        className={`px-2 py-2 whitespace-nowrap text-xs text-center font-semibold ${
                          proposal.amendmentPaid >=
                            proposal.contractedAmendment &&
                          proposal.contractedAmendment > 0
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {formatCurrency(proposal.amendmentPaid)}
                      </td>
                      {/* Original + amendment, counting only what is signed.
                          A row with nothing accepted shows a dash rather than
                          $0.00 — the figures to its left are real quotes, and
                          zero would read as one of them being wrong. */}
                      <td
                        className="px-2 py-2 whitespace-nowrap text-xs text-center font-bold text-gray-900"
                        title={
                          proposal.isContracted
                            ? undefined
                            : "Nothing signed on this project yet, so it adds nothing to the contracted total"
                        }
                      >
                        {proposal.isContracted ? (
                          formatCurrency(proposal.rowTotal)
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                        {formatDate(proposal.createdAt)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs">
                        <button
                          onClick={() => handleViewDetails(proposal)}
                          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>

                    {/* Amendments belonging to this contract */}
                    {isExpanded &&
                      proposal.amendments.map((amendment: any) => (
                        <tr
                          key={amendment.id}
                          className="bg-purple-50/30 hover:bg-purple-50/60 transition-colors"
                        >
                          <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-700 pl-7">
                            <span className="text-purple-700">
                              {amendment.proposalNumber}
                            </span>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-bold uppercase tracking-tighter">
                              Amendment
                            </span>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                            {amendment.clientName}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                            {amendment.projectName}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                            {locationOf(amendment)}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                            {managerNameOf(amendment) ||
                              managerNameOf(proposal) || (
                                <span className="text-gray-400 italic">
                                  Unassigned
                                </span>
                              )}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(amendment.status)}`}
                            >
                              {amendment.status}
                            </span>
                          </td>
                          {/* An amendment inherits its project's run, so the
                              date columns belong to the parent row only. */}
                          <td className="px-2 py-2" colSpan={3} />
                          {/* The two original-contract columns belong to the
                              parent row; an amendment has no share of them.

                              Centred like every other cell in these columns —
                              these four were right-aligned, so a sub-row's
                              figures did not line up under the parent's. */}
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-center text-gray-400">
                            —
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-center text-gray-400">
                            —
                          </td>
                          {/* An unsigned amendment shows its quote greyed and
                              struck through rather than as a plain figure: the
                              value is still worth seeing, but reading down the
                              column it must not look like something to add. */}
                          <td
                            className={`px-2 py-2 whitespace-nowrap text-xs text-center font-semibold ${
                              amendment.status === "ACCEPTED"
                                ? "text-purple-700"
                                : "text-gray-300 line-through"
                            }`}
                            title={
                              amendment.status === "ACCEPTED"
                                ? undefined
                                : "Not signed, so it is not counted in the amendment total"
                            }
                          >
                            {formatCurrency(
                              Number(amendment.totalAmount || 0) *
                                proposal.share,
                            )}
                          </td>
                          <td
                            className={`px-2 py-2 whitespace-nowrap text-xs text-center font-semibold ${
                              Number(amendment.paidAmount || 0) >=
                                Number(amendment.totalAmount || 0) &&
                              Number(amendment.totalAmount || 0) > 0
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {formatCurrency(
                              Number(amendment.paidAmount || 0) *
                                proposal.share,
                            )}
                          </td>
                          {/* The contracted total is struck at project level on
                              the parent row; a sub-row has no separate one. */}
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-center text-gray-300">
                            —
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                            {formatDate(amendment.createdAt)}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs">
                            <button
                              onClick={() => handleViewDetails(amendment)}
                              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
            {/* Column sums over every filtered row — not just this page — so
                the figures line up with the Financial Dashboard's year.

                The two contract totals count signed contracts only, which is
                what makes this row reconcile with the Financial Overview's
                Original Contracts and Amendments. The paid columns count every
                completed payment, on the same basis the dashboard uses. */}
            <tfoot className="bg-gray-900 text-white [&_td]:sticky [&_td]:bottom-0 [&_td]:z-20 [&_td]:bg-gray-900">
              <tr>
                <td
                  colSpan={10}
                  className="px-2 py-2 text-[10px] font-bold uppercase tracking-tight"
                  title="Signed contracts only. Drafts and unsigned proposals are quotes, and are left out of the totals — the rows still show what they are quoted at."
                >
                  Contracted Grand Total · {groupedProposals.length} project
                  {groupedProposals.length === 1 ? "" : "s"}
                  {yearFilter !== ALL_TIME && ` · ${yearFilter} portion`}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-center font-bold">
                  {formatCurrency(columnTotals.original)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-center font-bold text-green-300">
                  {formatCurrency(columnTotals.originalPaid)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-center font-bold text-purple-300">
                  {formatCurrency(columnTotals.amendment)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-center font-bold text-green-300">
                  {formatCurrency(columnTotals.amendmentPaid)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-center font-bold">
                  {formatCurrency(columnTotals.total)}
                </td>
                <td className="px-2 py-2" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {groupedProposals.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 font-medium text-gray-700 outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, groupedProposals.length)} of{" "}
              {groupedProposals.length}
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <span className="text-gray-600 px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && selectedProposal && (
        <ProposalDetailsModal
          proposal={selectedProposal}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProposal(null);
          }}
        />
      )}
    </div>
  );
};

interface ProposalDetailsModalProps {
  proposal: Proposal;
  onClose: () => void;
}

/**
 * One contract's worth of services — the original scope, or one amendment.
 *
 * The accent colour is the whole point: amendments are purple here and purple
 * in the proposals table, so the same work reads the same way in both places.
 */
const ServiceGroup = ({
  title,
  proposalNumber,
  total,
  services,
  isAmendment,
}: {
  title: string;
  proposalNumber?: string;
  total?: number | string;
  services: any[];
  isAmendment: boolean;
}) => {
  const accent = isAmendment
    ? {
        bar: "bg-purple-500",
        chip: "bg-purple-50 text-purple-700 border-purple-100",
        order: "bg-purple-100 text-purple-800",
        card: "border-purple-100",
      }
    : {
        bar: "bg-blue-500",
        chip: "bg-blue-50 text-blue-700 border-blue-100",
        order: "bg-blue-100 text-blue-800",
        card: "border-gray-200",
      };

  // What the client has settled on this contract: the value of the phases
  // marked paid, not the receipts. Read this way it cannot run past the
  // contract total however many times a phase was charged.
  const paidTotal = services.reduce(
    (sum: number, s) => sum + (s.paid ? Number(s.amount || 0) : 0),
    0,
  );
  const paidCount = services.filter((s) => s.paid).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`h-4 w-1 rounded-full ${accent.bar}`} />
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        {proposalNumber && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${accent.chip}`}
          >
            {proposalNumber}
          </span>
        )}
        <span className="text-xs text-gray-400">
          {services.length} service{services.length === 1 ? "" : "s"}
        </span>
        {paidCount > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-100">
            {paidCount === services.length
              ? "Paid in full"
              : `${paidCount} of ${services.length} paid`}
          </span>
        )}
        {total !== undefined && total !== null && (
          <span className="ml-auto text-sm font-semibold text-gray-700 text-right">
            ${total}
            {/* The signed value against what has actually come in, so the two
                figures the client's statement has to reconcile sit together. */}
            <span className="block text-xs font-medium text-green-600">
              Client paid ${paidTotal.toLocaleString()}
            </span>
          </span>
        )}
      </div>

      {services.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-3">
          No services on this contract.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service: any) => (
            <div
              key={service.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${accent.card}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-900 text-sm">
                  <span
                    className={`text-xs px-2 mx-1 py-1 rounded ${accent.order}`}
                  >
                    #{service.order}
                  </span>{" "}
                  {service.name}
                </h4>
                <p
                  className={`text-xs px-2 py-1 rounded whitespace-nowrap ${service?.approvalStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                >
                  {service?.approvalStatus === "PENDING"
                    ? "Pending"
                    : "Approved"}
                </p>
              </div>
              {service.description && (
                <p className="text-xs text-gray-600 mb-2">
                  {service.description}
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                <h1 className="text-lg font-semibold ">
                  Price:{" "}
                  <span className="text-green-600 font-bold">
                    ${service.amount}
                  </span>
                </h1>
                {/* Both states are shown, not just the paid one: an absent
                    badge would read the same as a phase nobody has billed
                    yet. */}
                <span
                  className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap border ${
                    service.paid
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {service.paid ? "Paid" : "Unpaid"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProposalDetailsModal = ({
  proposal,
  onClose,
}: ProposalDetailsModalProps) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser) as any;
  // Only the Super Admin / Finance may delete a draft; Super Admin continues it.
  const canManageDrafts =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FINANCE";
  const canContinueDraft = currentUser?.role === "SUPER_ADMIN";

  const [deleteProposal, { isLoading: isDeleting }] =
    useDeleteProposalMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const projectReq = (proposal as any).projectRequest as any;

  const handleContinueDraft = () => {
    onClose();
    navigate(
      `/dashboard/new-proposal/${proposal.projectRequestId}?proposalId=${proposal.id}`,
    );
  };

  const handleDeleteProposal = async () => {
    if (!deletePassword.trim()) {
      toast.error("Enter your password to confirm.");
      return;
    }
    try {
      await deleteProposal({
        id: proposal.id,
        password: deletePassword,
      }).unwrap();
      toast.success("Proposal deleted.");
      setIsDeleteOpen(false);
      setDeletePassword("");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete proposal.");
    }
  };

  // Amendment state
  const { data: amendmentsData, isLoading: isLoadingAmendments } =
    useGetAmendmentsQuery({ proposalId: proposal.id });
  const [reviewAmendment, { isLoading: isReviewing }] =
    useReviewAmendmentMutation();
  const [createProposalFromAmendment, { isLoading: isCreatingProposal }] =
    useCreateProposalFromAmendmentMutation();
  const [completeAmendment, { isLoading: isCompleting }] =
    useCompleteAmendmentMutation();
  const [sendProposalToClient, { isLoading: isSending }] =
    useSendProposalToClientMutation();
  const [addService, { isLoading: isAddingService }] = useAddServiceMutation();
  const { data: allProposalsData } = useGetAllProposalsForProposalQuery(
    proposal.id,
  );

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingAmendment, setReviewingAmendment] =
    useState<Amendment | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">(
    "APPROVED",
  );
  const [reviewNotes, setReviewNotes] = useState("");

  // Create proposal modal state
  const [isCreateProposalModalOpen, setIsCreateProposalModalOpen] =
    useState(false);
  const [creatingForAmendment, setCreatingForAmendment] =
    useState<Amendment | null>(null);
  // No taxRate. It defaulted to 8 here and nowhere else — the New Proposal
  // wizard never sends one — so whether a client was charged 8% on identical
  // work depended only on which screen the proposal happened to be raised
  // from. The tax was then added to the contract total while every Pay button
  // charged the untaxed service lines, so it was quoted but never collected.
  const [proposalForm, setProposalForm] = useState({
    name: "",
    description: "",
    budgetRange: "",
    expectedTimeline: "",
    notes: "",
  });

  // Add service modal state
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [targetProposalId, setTargetProposalId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    cost: 0,
    timelineWeeks: 1,
  });

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Signature Modal State
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signingProposalId, setSigningProposalId] = useState<string | null>(
    null,
  );
  const architectSigCanvas = useRef<SignatureCanvas>(null);

  const amendmentsRaw = amendmentsData?.data;
  const amendments = Array.isArray(amendmentsRaw) ? amendmentsRaw : [];

  // Backend returns { normalProposal, amendmentProposals, totalProposals }
  // const amendmentProposals = Array.isArray(
  //   allProposalsData?.data?.amendmentProposals,
  // )
  //   ? allProposalsData.data.amendmentProposals
  //   : [];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "VIEWED":
        return "bg-purple-100 text-purple-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "REVISED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAmendmentStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> =
      {
        PENDING: {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Pending",
        },
        APPROVED: {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Approved",
        },
        REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
        UNDER_REVIEW: {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "Under Review",
        },
        COMPLETED: {
          bg: "bg-teal-100",
          text: "text-teal-800",
          label: "Completed",
        },
      };
    const c = config[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}
      >
        {c.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      LOW: { bg: "bg-gray-100", text: "text-gray-700" },
      MEDIUM: { bg: "bg-blue-100", text: "text-blue-700" },
      HIGH: { bg: "bg-orange-100", text: "text-orange-700" },
      URGENT: { bg: "bg-red-100", text: "text-red-700" },
    };
    const c = config[urgency] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}
      >
        {urgency}
      </span>
    );
  };

  // Review handlers
  const handleOpenReview = (
    amendment: Amendment,
    action: "APPROVED" | "REJECTED",
  ) => {
    setReviewingAmendment(amendment);
    setReviewAction(action);
    setReviewNotes("");
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingAmendment || !reviewNotes.trim()) return;
    try {
      await reviewAmendment({
        amendmentId: reviewingAmendment.id,
        action: reviewAction,
        reviewNotes: reviewNotes.trim(),
      }).unwrap();
      setIsReviewModalOpen(false);
      setReviewingAmendment(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Failed to review amendment:", error);
    }
  };

  // Create proposal handlers
  const handleOpenCreateProposal = (amendment: Amendment) => {
    setCreatingForAmendment(amendment);
    setProposalForm({
      name: "",
      description: "",
      budgetRange: "",
      expectedTimeline: "",
      notes: "",
    });
    setIsCreateProposalModalOpen(true);
  };

  const handleSubmitCreateProposal = async () => {
    if (!creatingForAmendment) return;
    try {
      await createProposalFromAmendment({
        amendmentId: creatingForAmendment.id,
        ...proposalForm,
      }).unwrap();
      setIsCreateProposalModalOpen(false);
      setCreatingForAmendment(null);
      toast.success("Proposal created successfully from amendment!");
    } catch (error) {
      console.error("Failed to create proposal:", error);
      toast.error("Failed to create proposal.");
    }
  };

  // Send amendment proposal to client (requires signature first)
  const handleOpenSignatureModal = (proposalId: string) => {
    setSigningProposalId(proposalId);
    setIsSignatureModalOpen(true);
  };

  const handleConfirmSendWithSignature = async () => {
    if (!signingProposalId || !architectSigCanvas.current) return;

    if (architectSigCanvas.current.isEmpty()) {
      toast.error("Please provide your signature.");
      return;
    }

    const signature = architectSigCanvas.current.toDataURL("image/png");

    try {
      const result: any = await sendProposalToClient({
        id: signingProposalId,
        architectSignature: signature,
      }).unwrap();

      if (result?.data?.emailSent === false) {
        toast.warning(
          result?.message || "Sent, but the email could not be delivered.",
        );
      } else {
        toast.success("Amendment proposal signed and sent to client!");
      }
      setIsSignatureModalOpen(false);
      setSigningProposalId(null);
    } catch (error: any) {
      console.error("Failed to sign/send proposal:", error);
      toast.error(error?.data?.message || "Failed to sign/send proposal.");
    }
  };

  // Complete handler — only when amendment proposal is ACCEPTED by client
  const handleComplete = async (amendmentId: string) => {
    if (!confirm("Are you sure you want to mark this amendment as completed?"))
      return;
    try {
      await completeAmendment(amendmentId).unwrap();
      toast.success("Amendment marked as completed!");
    } catch (error: any) {
      console.error("Failed to complete amendment:", error);
      const msg = error?.data?.message || "Failed to complete amendment.";
      toast.error(msg);
    }
  };

  const handleOpenAddService = (proposalId: string) => {
    setTargetProposalId(proposalId);
    setServiceForm({
      name: "",
      description: "",
      cost: 0,
      timelineWeeks: 1,
    });
    setIsAddServiceModalOpen(true);
  };

  const handleAddService = async () => {
    if (!targetProposalId || !serviceForm.name.trim()) return;
    try {
      await addService({
        id: targetProposalId,
        name: serviceForm.name,
        description: serviceForm.description,
        cost: Number(serviceForm.cost),
        timelineWeeks: Number(serviceForm.timelineWeeks),
      }).unwrap();
      setIsAddServiceModalOpen(false);
      setTargetProposalId(null);
      toast.success("Service added successfully!");
    } catch (error) {
      console.error("Failed to add service:", error);
      toast.error("Failed to add service.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Proposal Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {proposal.proposalNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Proposal Information */}
            <section>
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Proposal Information
                </h3>
                <div className="flex items-center gap-2">
                  {proposal.status === "DRAFT" && canContinueDraft && (
                    <button
                      onClick={handleContinueDraft}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <FileTextIcon size={14} />
                      Continue Draft
                    </button>
                  )}
                  {proposal.status === "DRAFT" && canManageDrafts && (
                    <button
                      onClick={() => {
                        setDeletePassword("");
                        setIsDeleteOpen(true);
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 border border-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Delete Proposal
                    </button>
                  )}
                  {proposal.status === "ACCEPTED" && (
                    <button
                      onClick={() => setIsContractModalOpen(true)}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1 border border-amber-600 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                    >
                      <FileTextIcon size={14} />
                      Review Contract
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Title" value={proposal.title} />
                <InfoField
                  label="Status"
                  value={
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}
                    >
                      {proposal.status}
                    </span>
                  }
                />
                <InfoField
                  label="Created At"
                  value={formatDate(proposal.createdAt)}
                />
                <InfoField
                  label="Sent At"
                  value={formatDate(proposal.sentAt)}
                />
                {/* <InfoField label="Viewed At" value={formatDate(proposal.viewedAt)} /> */}
                <InfoField
                  label="Responded At"
                  value={formatDate(
                    proposal.respondedAt ||
                      (proposal as any).clientContractSignedAt,
                  )}
                />
              </div>
            </section>

            {/* Client Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                Client Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Client Name" value={proposal.clientName} />
                <InfoField
                  label="Company"
                  value={proposal.clientCompany || projectReq?.companyName}
                />
                <InfoField label="Email" value={proposal.clientEmail} />
                <InfoField label="Phone" value={proposal.clientPhone} />
                {projectReq && (
                  <>
                    <InfoField
                      label="Street Address"
                      value={projectReq.streetAddress}
                    />
                    <InfoField
                      label="Apt / Suite / Unit"
                      value={projectReq.aptSuiteUnit}
                    />
                    <InfoField label="City" value={projectReq.city} />
                    <InfoField label="State" value={projectReq.state} />
                    <InfoField label="Zip Code" value={projectReq.zipCode} />
                    <InfoField label="Country" value={projectReq.country} />
                    {projectReq.additionalComments && (
                      <InfoField
                        label="Additional Comments"
                        value={projectReq.additionalComments}
                        fullWidth
                      />
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Project Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                Project Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Project Name" value={proposal.projectName} />
                <InfoField label="Location" value={proposal.projectLocation} />
                <InfoField
                  label="Service Type"
                  value={toTitleCase(proposal.serviceType)}
                />
                <InfoField
                  label="Category"
                  value={toTitleCase(proposal.projectCategory)}
                />
                <InfoField
                  label="Project Size"
                  value={projectReq?.projectSize || proposal.squareFootage}
                />
                <InfoField label="Budget Range" value={proposal.budgetRange} />
                <InfoField
                  label="Expected Timeline"
                  value={proposal.expectedTimeline}
                />
                {projectReq && (
                  <>
                    <InfoField
                      label="Project Street Address"
                      value={projectReq.projectStreetAddress}
                    />
                    <InfoField
                      label="Project Apt / Suite / Unit"
                      value={projectReq.projectAptSuiteUnit}
                    />
                    <InfoField
                      label="Project City"
                      value={projectReq.projectCity}
                    />
                    <InfoField
                      label="Project State"
                      value={projectReq.projectState}
                    />
                    <InfoField
                      label="Project Zip Code"
                      value={projectReq.projectZipCode}
                    />
                    <InfoField
                      label="Project Country"
                      value={projectReq.projectCountry}
                    />
                    {projectReq.siteConstraints && (
                      <InfoField
                        label="Site Constraints & Notes"
                        value={projectReq.siteConstraints}
                        fullWidth
                      />
                    )}
                    {projectReq.specialRequirements && (
                      <InfoField
                        label="Additional Notes / Contextual Requirements"
                        value={projectReq.specialRequirements}
                        fullWidth
                      />
                    )}
                  </>
                )}
              </div>
              {proposal.projectDescription && (
                <div className="mt-4">
                  <InfoField
                    label="Project Description"
                    value={proposal.projectDescription}
                    fullWidth
                  />
                </div>
              )}
              {proposal.additionalContext && (
                <div className="mt-4">
                  <InfoField
                    label="Additional Context"
                    value={proposal.additionalContext}
                    fullWidth
                  />
                </div>
              )}
            </section>

            {/* Services, split by contract.
                Amendment work is priced and approved separately from the
                original scope, so running the two together as one flat grid
                hid which line items the client actually signed up for first.
                Purple marks amendments, matching the badge in the table. */}
            {((proposal.services?.length ?? 0) > 0 ||
              (proposal.amendments?.length ?? 0) > 0) && (
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Services
                </h3>

                <div className="space-y-6">
                  {proposal.services?.length > 0 && (
                    <ServiceGroup
                      title={
                        proposal.proposalType === "AMENDMENT"
                          ? "Amendment Contract"
                          : "Original Contract"
                      }
                      proposalNumber={proposal.proposalNumber}
                      total={proposal.totalAmount}
                      services={proposal.services}
                      isAmendment={proposal.proposalType === "AMENDMENT"}
                    />
                  )}

                  {proposal.amendments?.map((amendment: any) => (
                    <ServiceGroup
                      key={amendment.id}
                      title="Amendment Contract"
                      proposalNumber={amendment.proposalNumber}
                      total={amendment.totalAmount}
                      services={amendment.services || []}
                      isAmendment
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Financial Summary */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                Financial Summary
              </h3>
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${proposal.subtotal}</span>
                </div>
                {/* No tax rows. Nothing charges tax — every Pay button bills
                    the service lines — so quoting a rate and an amount that are
                    never collected made this page disagree with what the client
                    is actually billed.

                    Proposals raised before this still carry a stored taxAmount,
                    so it is taken back off the total rather than trusted. Doing
                    it this way round keeps any credits intact, which subtotal
                    alone would drop. */}
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-green-600">
                    $
                    {(
                      Number(proposal.totalAmount || 0) -
                      Number(proposal.taxAmount || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                {/* {proposal.paymentMethod && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {toTitleCase(proposal.paymentMethod)}
                    </span>
                  </div>
                )} */}
                {proposal.paymentType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Type:</span>
                    <span className="font-medium">
                      {toTitleCase(proposal.paymentType)}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Created By */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                Created By
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Name" value={proposal.createdBy?.name} />
                <InfoField label="Email" value={proposal.createdBy?.email} />
              </div>
            </section>

            {/* Notes and Terms */}
            {(proposal.notes || proposal.termsAndConditions) && (
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Additional Information
                </h3>
                {proposal.notes && (
                  <div className="mb-4">
                    <InfoField label="Notes" value={proposal.notes} fullWidth />
                  </div>
                )}
                {proposal.termsAndConditions && (
                  <div>
                    <InfoField
                      label="Terms & Conditions"
                      value={proposal.termsAndConditions}
                      fullWidth
                    />
                  </div>
                )}
              </section>
            )}

            {/* ─── Amendments Section ─── */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                Amendments
              </h3>
              {isLoadingAmendments ? (
                <Loader fullScreen={false} />
              ) : amendments.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  No amendments found for this proposal.
                </div>
              ) : (
                <div className="space-y-4">
                  {amendments.map((amendment: Amendment) => {
                    const amdProposal = amendment.amendmentProposal;
                    const amdProposalStatus = amdProposal?.status;

                    return (
                      <div
                        key={amendment.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {amendment.projectName}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {amendment.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {amendment.urgency &&
                              getUrgencyBadge(amendment.urgency)}
                            {getAmendmentStatusBadge(amendment.status)}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          <span className="font-medium text-gray-700">
                            Services:
                          </span>{" "}
                          {amendment.services}
                        </div>

                        {amendment.reviewNotes && (
                          <div className="text-sm text-gray-600 mb-3 bg-white p-2 rounded border border-gray-100">
                            <span className="font-medium text-gray-700">
                              Review Notes:
                            </span>{" "}
                            {amendment.reviewNotes}
                          </div>
                        )}

                        {/* Show linked amendment proposal info */}
                        {amdProposal && (
                          <div className="text-sm mb-3 bg-blue-50 p-3 rounded border border-blue-100">
                            <span className="font-medium text-blue-800">
                              Amendment Proposal:
                            </span>{" "}
                            <span className="text-blue-700">
                              {amdProposal.proposalNumber}
                            </span>
                            <span
                              className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                amdProposalStatus === "ACCEPTED"
                                  ? "bg-green-100 text-green-800"
                                  : amdProposalStatus === "SENT"
                                    ? "bg-blue-100 text-blue-800"
                                    : amdProposalStatus === "DRAFT"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {amdProposalStatus}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 mb-3">
                          Created: {formatDate(amendment.createdAt)}
                        </div>

                        {/* Amendment Proposal Services (if DRAFT) */}
                        {amdProposalStatus === "DRAFT" && (
                          <div className="mb-4 bg-white p-3 rounded border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Services
                              </h5>
                              <button
                                onClick={() =>
                                  handleOpenAddService(amdProposal?.id || "")
                                }
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                              >
                                + Add Service
                              </button>
                            </div>
                            {allProposalsData?.data?.amendmentProposals?.find(
                              (p: any) => p.id === amdProposal?.id,
                            )?.services?.length > 0 ? (
                              <div className="space-y-2">
                                {(
                                  allProposalsData?.data?.amendmentProposals ||
                                  []
                                )
                                  .find((p: any) => p.id === amdProposal?.id)
                                  ?.services?.map((s: any) => (
                                    <div
                                      key={s.id}
                                      className="flex items-center justify-between text-xs border-b border-gray-50 pb-1"
                                    >
                                      <span className="font-medium">
                                        {s.name}
                                      </span>
                                      <span className="text-gray-500">
                                        ${s.amount}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-xs text-red-500 italic">
                                No services added yet. Add at least one to send.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action buttons based on correct flow */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Step 2: PM approves/rejects (PENDING → APPROVED/REJECTED) */}
                          {amendment.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleOpenReview(amendment, "APPROVED")
                                }
                                disabled={isReviewing}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleOpenReview(amendment, "REJECTED")
                                }
                                disabled={isReviewing}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Step 3: PM creates proposal (APPROVED → UNDER_REVIEW, only if no proposal yet) */}
                          {amendment.status === "APPROVED" &&
                            !amendment.amendmentProposalId && (
                              <button
                                onClick={() =>
                                  handleOpenCreateProposal(amendment)
                                }
                                disabled={isCreatingProposal}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Create Proposal
                              </button>
                            )}

                          {/* Step 3b: PM sends the created proposal to client (UNDER_REVIEW + proposal is DRAFT) */}
                          {amendment.status === "UNDER_REVIEW" &&
                            amdProposal &&
                            amdProposalStatus === "DRAFT" && (
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() =>
                                    handleOpenSignatureModal(amdProposal.id)
                                  }
                                  disabled={
                                    isSending ||
                                    (allProposalsData?.data?.amendmentProposals?.find(
                                      (p: any) => p.id === amdProposal.id,
                                    )?.services?.length || 0) === 0
                                  }
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {isSending
                                    ? "Sending..."
                                    : "Send Proposal to Client"}
                                </button>
                                {(allProposalsData?.data?.amendmentProposals?.find(
                                  (p: any) => p.id === amdProposal.id,
                                )?.services?.length || 0) === 0 && (
                                  <span className="text-[10px] text-red-500">
                                    Requires at least 1 service
                                  </span>
                                )}
                              </div>
                            )}

                          {/* Step 3c: Waiting for client — proposal has been SENT / VIEWED */}
                          {amendment.status === "UNDER_REVIEW" &&
                            amdProposal &&
                            (amdProposalStatus === "SENT" ||
                              amdProposalStatus === "VIEWED") && (
                              <span className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded">
                                Waiting for client response...
                              </span>
                            )}

                          {/* Step 6: PM completes (UNDER_REVIEW + proposal is ACCEPTED) */}
                          {amendment.status === "UNDER_REVIEW" &&
                            amdProposal &&
                            amdProposalStatus === "ACCEPTED" && (
                              <button
                                onClick={() => handleComplete(amendment.id)}
                                disabled={isCompleting}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {isCompleting
                                  ? "Completing..."
                                  : "Mark as Completed"}
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ─── Amendment Proposals Section ─── */}
            {/* <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                Amendment Proposals
              </h3>
              {isLoadingAllProposals ? (
                <Loader fullScreen={false} />
              ) : amendmentProposals.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  No amendment proposals found.
                </div>
              ) : (
                <div className="space-y-3">
                  {amendmentProposals.map((p: any) => (
                    <div
                      key={p.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {p.title || p.projectName}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {p.proposalNumber}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {p.projectDescription || "No description"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            p.status === "ACCEPTED"
                              ? "bg-green-100 text-green-800"
                              : p.status === "SENT"
                                ? "bg-blue-100 text-blue-800"
                                : p.status === "DRAFT"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Budget:</span>{" "}
                          <span className="font-medium">
                            {p.budgetRange || p.totalAmount || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Timeline:</span>{" "}
                          <span className="font-medium">
                            {p.expectedTimeline || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>{" "}
                          <span className="font-medium">
                            {formatDate(p.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section> */}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-300 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Review Amendment Modal */}
      {isReviewModalOpen && reviewingAmendment && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {reviewAction === "APPROVED" ? "Approve" : "Reject"} Amendment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Amendment:{" "}
                <span className="font-medium text-gray-700">
                  {reviewingAmendment.projectName}
                </span>
              </p>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Provide your review notes..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewingAmendment(null);
                  setReviewNotes("");
                }}
                disabled={isReviewing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isReviewing || !reviewNotes.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  reviewAction === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700 border border-green-600"
                    : "bg-red-600 hover:bg-red-700 border border-red-600"
                }`}
              >
                {isReviewing
                  ? "Processing..."
                  : reviewAction === "APPROVED"
                    ? "Confirm Approve"
                    : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Proposal From Amendment Modal */}
      {isCreateProposalModalOpen && creatingForAmendment && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Create Proposal from Amendment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Amendment:{" "}
                <span className="font-medium text-gray-700">
                  {creatingForAmendment.projectName}
                </span>
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proposal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={proposalForm.name}
                  onChange={(e) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Garage Extension Amendment"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={proposalForm.description}
                  onChange={(e) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the proposal..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Range <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={proposalForm.budgetRange}
                  onChange={(e) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      budgetRange: e.target.value,
                    }))
                  }
                  placeholder="e.g. 35,000 - 50,000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Timeline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={proposalForm.expectedTimeline}
                  onChange={(e) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      expectedTimeline: e.target.value,
                    }))
                  }
                  placeholder="e.g. 6-8 weeks"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Tax Rate removed with the 8% default above. Nothing charges
                  tax — every Pay button bills the service lines — so a rate
                  entered here would have been added to the quoted total and
                  then never collected. Offering the field would invite exactly
                  the mismatch this change removes. */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={proposalForm.notes}
                  onChange={(e) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="sticky bottom-0 px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => {
                  setIsCreateProposalModalOpen(false);
                  setCreatingForAmendment(null);
                }}
                disabled={isCreatingProposal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCreateProposal}
                disabled={
                  isCreatingProposal ||
                  !proposalForm.name.trim() ||
                  !proposalForm.description.trim() ||
                  !proposalForm.budgetRange.trim()
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingProposal ? "Creating..." : "Create Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Add Service to Proposal
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Structural Engineering Review"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost ($) *
                  </label>
                  <input
                    type="number"
                    value={serviceForm.cost}
                    onChange={(e) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        cost: Number(e.target.value),
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeline (Weeks)
                  </label>
                  <input
                    type="number"
                    value={serviceForm.timelineWeeks}
                    onChange={(e) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        timelineWeeks: Number(e.target.value),
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setIsAddServiceModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={isAddingService || !serviceForm.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isAddingService ? "Adding..." : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ContractReviewModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        proposalId={proposal.id}
      />

      {/* Delete Draft Proposal — password required */}
      {isDeleteOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Delete Proposal
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {proposal.proposalNumber} — this removes its services, phases
                and contract. This cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to confirm{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDeleteProposal();
                }}
                placeholder="Your account password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeletePassword("");
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProposal}
                disabled={isDeleting || !deletePassword.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Architect Signature Modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Sign Amendment Proposal
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Please provide your architect signature to confirm this
                proposal.
              </p>
            </div>
            <div className="p-6">
              <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                <SignatureCanvas
                  ref={architectSigCanvas}
                  canvasProps={{
                    className: "w-full h-48 bg-white cursor-crosshair",
                    width: 500,
                    height: 200,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                <span>Sign above using your mouse or touch screen</span>
                <button
                  onClick={() => architectSigCanvas.current?.clear()}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Clear Signature
                </button>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 italic text-sm text-gray-600">
                "I, Eric Rivera, AIA, hereby sign this amendment proposal as the
                architect of record."
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => {
                  setIsSignatureModalOpen(false);
                  setSigningProposalId(null);
                }}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendWithSignature}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSending ? "Processing..." : "Sign & Send Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

const InfoField = ({ label, value, fullWidth = false }: InfoFieldProps) => {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <dt className="text-xs font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value || "N/A"}</dd>
    </div>
  );
};

export default Proposals;
