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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

type SortOption = "newest" | "oldest" | "manager" | "status";
import { Loader } from "@/components/ui/loader";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

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
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Memoised so the grouping below isn't recomputed on every render.
  const proposals = React.useMemo(
    () => proposalsData?.data ?? [],
    [proposalsData],
  );

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

    return (
      originals
        .map((p: any) => ({
          ...p,
          amendments: (amendmentsByParent.get(p.id) || []).sort(
            (a: any, b: any) =>
              (a.proposalNumber || "").localeCompare(b.proposalNumber || ""),
          ),
        }))
        // Keep a contract when it matches, or when any of its amendments do.
        .filter((p: any) => matches(p) || p.amendments.some(matches))
        .sort((a: any, b: any) => {
          switch (sortBy) {
            case "manager":
              return managerNameOf(a).localeCompare(managerNameOf(b));
            case "status":
              return (a.status || "").localeCompare(b.status || "");
            case "oldest":
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            case "newest":
            default:
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
          }
        })
    );
  }, [proposals, search, sortBy]);

  // Pagination — rows per page is user-selectable (default 25).
  const totalPages = Math.max(
    1,
    Math.ceil(groupedProposals.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const pageProposals = groupedProposals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, pageSize]);

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

        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
          <ArrowUpDown size={14} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm bg-transparent outline-none font-bold text-gray-700 cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="manager">Project Manager</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No proposals found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Proposal #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Amendment Total #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Project Manager
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageProposals.map((proposal: any) => {
                const hasAmendments = proposal.amendments.length > 0;
                const isExpanded = expandedIds.has(proposal.id);

                return (
                  <React.Fragment key={proposal.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {hasAmendments ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold">
                            {proposal.amendments.length}
                          </span>
                        ) : (
                          <span className="text-gray-300">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {proposal.clientName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {proposal.projectName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {locationOf(proposal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {managerNameOf(proposal) || (
                          <span className="text-gray-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}
                        >
                          {proposal.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        ${proposal.totalAmount || "0"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(proposal.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 pl-12">
                            <span className="text-purple-700">
                              {amendment.proposalNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-bold uppercase tracking-tighter">
                              Amendment
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {amendment.clientName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {amendment.projectName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {locationOf(amendment)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {managerNameOf(amendment) ||
                              managerNameOf(proposal) || (
                                <span className="text-gray-400 italic">
                                  Unassigned
                                </span>
                              )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(amendment.status)}`}
                            >
                              {amendment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            ${amendment.totalAmount || "0"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(amendment.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
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
  const { data: allProposalsData, isLoading: isLoadingAllProposals } =
    useGetAllProposalsForProposalQuery(proposal.id);

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
  const [proposalForm, setProposalForm] = useState({
    name: "",
    description: "",
    budgetRange: "",
    expectedTimeline: "",
    taxRate: 8,
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
  const amendmentProposals = Array.isArray(
    allProposalsData?.data?.amendmentProposals,
  )
    ? allProposalsData.data.amendmentProposals
    : [];

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
      taxRate: 8,
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
                    <InfoField label="Project City" value={projectReq.projectCity} />
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

            {/* Services */}
            {proposal.services && proposal.services.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Services
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proposal.services.map((service: any) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 mx-1 py-1 rounded">
                            #{service.order}
                          </span>{" "}
                          {service.name}
                        </h4>
                        <p
                          className={`text-xs px-2 py-1 rounded ${service?.approvalStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
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
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <h1 className="text-lg font-semibold ">
                          Price:{" "}
                          <span className="text-green-600 font-bold">
                            ${service.amount}
                          </span>
                        </h1>
                      </div>
                    </div>
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
                {proposal.taxRate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Rate:</span>
                    <span className="font-medium">{proposal.taxRate}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Amount:</span>
                  <span className="font-medium">
                    ${proposal.taxAmount || "0"}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-green-600">
                    ${proposal.totalAmount}
                  </span>
                </div>
                {proposal.paymentMethod && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {toTitleCase(proposal.paymentMethod)}
                    </span>
                  </div>
                )}
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
            <section>
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
            </section>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={proposalForm.taxRate}
                  onChange={(e) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      taxRate: Number(e.target.value),
                    }))
                  }
                  placeholder="e.g. 8"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
