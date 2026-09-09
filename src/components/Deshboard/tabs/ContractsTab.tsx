import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ProjectRequest,
  Proposal,
  useGetProposalsByProjectRequestQuery,
  useDeleteProposalMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import {
  FileTextIcon,
  Loader2,
  FilterIcon,
  PlusIcon,
  ExternalLinkIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  ReceiptText,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import ContractReviewModal from "../ContractReviewModal";
import NewInvoiceModal from "@/components/Modal/NewInvoiceModal";
import InvoiceList from "./InvoiceList";
import {
  Amendment,
  useGetAmendmentsByProjectQuery,
  useReviewAmendmentMutation,
  useCreateProposalFromAmendmentMutation,
  useCreateAmendmentMutation,
} from "@/redux/api/amendmentApi";
import CreateAmendmentRequestModal, {
  AmendmentRequestForm,
} from "../UserDashboard/CreateAmendmentRequestModal";
import CreateProposalFromAmendmentModal, {
  AmendmentProposalForm,
} from "../CreateProposalFromAmendmentModal";
import { toast } from "sonner";
import { useCanEdit } from "@/hooks/useDashboardAccess";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ContractsTabProps = {
  project: ProjectRequest;
};

type FilterType = "all" | "proposals" | "amendments";

export default function ContractsTab({ project }: ContractsTabProps) {
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const [filter, setFilter] = useState<FilterType>("all");
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractProposalId, setContractProposalId] = useState<string>("");

  // Delete proposal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteProposal, { isLoading: isDeleting }] =
    useDeleteProposalMutation();

  // Fetch proposals related to this project
  const { data: proposalsData, isLoading } =
    useGetProposalsByProjectRequestQuery(project.id);
  const { data: amendmentsData } = useGetAmendmentsByProjectQuery({
    projectId: project.id,
  });

  // Amendment review + proposal creation now happen here rather than on the
  // separate /dashboard/proposals page.
  const [reviewAmendment, { isLoading: isReviewing }] =
    useReviewAmendmentMutation();
  const [createProposalFromAmendment, { isLoading: isCreatingFromAmendment }] =
    useCreateProposalFromAmendmentMutation();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [proposalAmendment, setProposalAmendment] = useState<Amendment | null>(
    null,
  );

  const handleReviewAmendment = async (
    amendment: Amendment,
    action: "APPROVED" | "REJECTED",
  ) => {
    setReviewingId(amendment.id);
    try {
      await reviewAmendment({
        amendmentId: amendment.id,
        action,
        reviewNotes: "",
      }).unwrap();
      toast.success(
        action === "APPROVED"
          ? "Amendment request accepted."
          : "Amendment request rejected.",
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to review amendment request");
    } finally {
      setReviewingId(null);
    }
  };

  // Raising an amendment on the client's behalf, for clients who can't manage
  // it from their own panel. Same form and same endpoint the client uses — the
  // API already accepts a manager as the requester.
  const [isNewAmendmentOpen, setIsNewAmendmentOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [createAmendment, { isLoading: isCreatingAmendment }] =
    useCreateAmendmentMutation();

  const handleCreateAmendmentForClient = async (form: AmendmentRequestForm) => {
    if (!acceptedBaseProposal?.id) {
      toast.error(
        "This project needs an accepted proposal before an amendment can be raised.",
      );
      return;
    }
    try {
      await createAmendment({
        proposalId: acceptedBaseProposal.id,
        projectName: form.projectName,
        description: form.description,
        squareFootage: form.squareFootage || undefined,
        projectSizeUnit: form.projectSizeUnit,
        budgetRange: form.budgetRange || undefined,
      }).unwrap();
      toast.success("Amendment request created on behalf of the client.");
      setIsNewAmendmentOpen(false);
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Failed to create the amendment request",
      );
    }
  };

  const handleCreateProposalFromAmendment = async (
    form: AmendmentProposalForm,
  ) => {
    if (!proposalAmendment) return;
    try {
      const res: any = await createProposalFromAmendment({
        amendmentId: proposalAmendment.id,
        ...form,
      }).unwrap();
      toast.success("Amendment proposal created. Add services to continue.");
      setProposalAmendment(null);

      // Continue in the proposal wizard exactly like a normal draft.
      const newProposalId = res?.data?.id;
      if (newProposalId) {
        navigate(
          `/dashboard/new-proposal/${project.id}?proposalId=${newProposalId}`,
        );
      }
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Failed to create proposal from amendment",
      );
    }
  };

  const allProposals: Proposal[] = proposalsData?.data || [];

  // The Amendment Requests section is a work queue, not a history log. Once a
  // request has run its course — the amendment proposal has been signed and
  // accepted, or the request was rejected — it already appears as a contract
  // card above, so leaving it here duplicates it and makes a settled request
  // look outstanding.
  const openAmendments = (amendmentsData?.data || []).filter(
    (amendment: Amendment) => {
      if (amendment.status === "COMPLETED" || amendment.status === "REJECTED") {
        return false;
      }
      return amendment.amendmentProposal?.status !== "ACCEPTED";
    },
  );

  // Apply filter
  const filteredProposals = allProposals.filter((p) => {
    if (filter === "proposals")
      return p.proposalType === "NORMAL" || !p.proposalType;
    if (filter === "amendments") return p.proposalType === "AMENDMENT";
    return true;
  });

  // Counts
  const proposalCount = allProposals.filter(
    (p) => p.proposalType === "NORMAL" || !p.proposalType,
  ).length;
  const amendmentCount = allProposals.filter(
    (p) => p.proposalType === "AMENDMENT",
  ).length;

  // A project gets exactly one proposal. Once it has reached the client, scope
  // changes go through amendments instead — so the button is locked. A rejected
  // or expired proposal releases the slot again (mirrors the server rule).
  const hasLiveProposal = allProposals.some(
    (p) =>
      (p.proposalType === "NORMAL" || !p.proposalType) &&
      ["SENT", "VIEWED", "ACCEPTED"].includes(p.status),
  );

  // An amendment extends a signed contract, so it needs the accepted base one.
  const acceptedBaseProposal = allProposals.find(
    (p) =>
      (p.proposalType === "NORMAL" || !p.proposalType) &&
      p.status === "ACCEPTED",
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            Sent
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            <FileTextIcon className="w-3 h-3" />
            Draft
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case "VIEWED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
            <ExternalLinkIcon className="w-3 h-3" />
            Viewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (proposal: Proposal) => {
    if (proposal.proposalType === "AMENDMENT") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
          <FileCheck className="w-3 h-3" />
          Amendment
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
        <FileTextIcon className="w-3 h-3" />
        Proposal
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewContract = (proposalId: string) => {
    setContractProposalId(proposalId);
    setIsContractModalOpen(true);
  };

  const handleOpenDeleteConfirm = (proposal: Proposal) => {
    setDeleteTarget(proposal);
    setDeletePassword("");
    setShowDeletePassword(false);
    setDeleteConfirmOpen(true);
  };

  const getAmendmentStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case "UNDER_REVIEW":
        // Set when the amendment proposal has been drafted — the request
        // itself is settled and is waiting on the client, not the PM.
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            Proposal Drafted
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const closeDeleteDialog = () => {
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
    setDeletePassword("");
    setShowDeletePassword(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !deletePassword.trim() || isDeleting) return;

    try {
      await deleteProposal({
        id: deleteTarget.id,
        password: deletePassword,
      }).unwrap();
      toast.success(
        `Proposal "${deleteTarget.proposalNumber}" deleted successfully!`,
      );
      closeDeleteDialog();
    } catch (error: any) {
      // A wrong password comes back as 401 — keep the dialog open so it can be
      // retyped rather than making the PM start over.
      toast.error(error?.data?.message || "Failed to delete proposal.");
      setDeletePassword("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top bar: filters + Make New Proposal button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-gray-400" />
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All ({allProposals.length})
            </button>
            <button
              onClick={() => setFilter("proposals")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === "proposals"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Proposals ({proposalCount})
            </button>
            <button
              onClick={() => setFilter("amendments")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === "amendments"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Amendments ({amendmentCount})
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1">
          {/* Drafters and employees read this tab; the two buttons that start
              paperwork are theirs to see the results of, not to press. */}
          <div className={`flex-wrap items-center gap-2 ${canEdit ? "flex" : "hidden"}`}>
            {/* Raised for a client who can't do it from their own panel. */}
            {/* A bill outside the contract — reimbursed expenses, or work
                beyond the agreed scope. Not gated on an accepted proposal:
                money can be laid out on a client's behalf before anything is
                signed, and that still has to be billed back. */}
            <button
              onClick={() => setIsNewInvoiceOpen(true)}
              title="Raise a bill against this project outside the contract"
              className="inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors cursor-pointer"
            >
              <ReceiptText className="w-4 h-4" />
              New Invoice
            </button>
            <button
              onClick={() => setIsNewAmendmentOpen(true)}
              disabled={!acceptedBaseProposal}
              title={
                acceptedBaseProposal
                  ? "Raise an amendment request on behalf of the client"
                  : "An accepted proposal is required before raising an amendment"
              }
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
            >
              <FileCheck className="w-4 h-4" />
              Make New Amendment
            </button>
            <button
            onClick={() => navigate(`/dashboard/new-proposal/${project.id}`)}
            disabled={hasLiveProposal}
            title={
              hasLiveProposal
                ? "This project already has a proposal. Use an amendment to change its scope."
                : undefined
            }
            className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
          >
            <PlusIcon className="w-4 h-4" />
            Make New Proposal
            </button>
          </div>
          {hasLiveProposal && (
            <p className="text-[11px] text-gray-500 max-w-[260px] sm:text-right">
              One proposal per project. Raise an amendment to extend the scope.
            </p>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-500 text-sm">Loading contracts...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredProposals.length === 0 && (
        <div className="text-center py-16 space-y-3 border border-dashed border-gray-200 rounded-xl">
          <FileTextIcon className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-500 text-sm">
            {filter === "all"
              ? "No proposals or amendments found for this project."
              : filter === "proposals"
                ? "No proposals found for this project."
                : "No amendments found for this project."}
          </p>
        </div>
      )}

      {/* Contract cards */}
      {!isLoading && filteredProposals.length > 0 && (
        <div className="space-y-3">
          {filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeBadge(proposal)}
                    {getStatusBadge(proposal.status)}
                    <span className="text-xs text-gray-400 font-mono">
                      {proposal.proposalNumber}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                    {proposal.title || proposal.projectName}
                  </h4>

                  <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                    {proposal.projectDescription || "No description available"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Created: {formatDate(proposal.createdAt)}</span>
                    {proposal.sentAt && (
                      <span>Sent: {formatDate(proposal.sentAt)}</span>
                    )}
                    <span className="font-medium text-gray-600">
                      ${Number(proposal.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Services preview */}
                  {proposal.services && proposal.services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {proposal.services.map((service) => (
                        <span
                          key={service.id}
                          className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 flex-wrap">
                  {proposal.status === "ACCEPTED" && (
                    <button
                      onClick={() => handleViewContract(proposal.id)}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <FileTextIcon className="w-3.5 h-3.5" />
                      View Contract
                    </button>
                  )}
                  {(proposal.status === "SENT" ||
                    proposal.status === "VIEWED") && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting Response
                    </span>
                  )}
                  {proposal.status === "DRAFT" && (
                    <button
                      onClick={() =>
                        navigate(
                          `/dashboard/new-proposal/${project.id}?proposalId=${proposal.id}`,
                        )
                      }
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FileTextIcon className="w-3.5 h-3.5" />
                      Continue Draft
                    </button>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={() => handleOpenDeleteConfirm(proposal)}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Amendment Requests Section */}
      {!isLoading && openAmendments.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">
              Amendment Requests
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {openAmendments.map((amendment: Amendment) => (
              <div
                key={amendment.id}
                className="border border-amber-100 rounded-xl p-5 bg-amber-50/30 hover:bg-amber-50/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                        Request
                      </span>
                      {getAmendmentStatusBadge(amendment.status)}
                      <span className="text-[10px] font-medium text-gray-400">
                        ID: {amendment.id.slice(0, 8)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 mb-1">
                      {amendment.projectName}
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {amendment.description}
                    </p>

                    <div className="flex flex-col gap-2 bg-white/60 p-3 rounded-lg border border-amber-100/50">
                      {amendment.squareFootage && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider w-24 flex-shrink-0">
                            Area:
                          </span>
                          <p className="text-xs text-gray-700">
                            {amendment.squareFootage}{" "}
                            {amendment.projectSizeUnit === "sqm"
                              ? "sq m"
                              : "sq ft"}
                          </p>
                        </div>
                      )}
                      {amendment.budgetRange && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider w-24 flex-shrink-0">
                            Budget:
                          </span>
                          <p className="text-xs text-gray-700">
                            {amendment.budgetRange}
                          </p>
                        </div>
                      )}
                      {amendment.services && (
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider w-24 flex-shrink-0 pt-0.5">
                            Services:
                          </span>
                          <p className="text-xs text-gray-700">
                            {amendment.services}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-400">
                      <span>Requested: {formatDate(amendment.createdAt)}</span>
                      <span>
                        Original Contract:{" "}
                        {amendment.proposal?.proposalNumber || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Only a request nobody has ruled on yet can be
                                            accepted or rejected — the backend refuses a
                                            second review, so offering the buttons again
                                            once a proposal exists only leads to an error. */}
                    {amendment.status === "PENDING" &&
                      !amendment.amendmentProposalId && (
                        <>
                          <button
                            onClick={() =>
                              handleReviewAmendment(amendment, "APPROVED")
                            }
                            disabled={
                              isReviewing && reviewingId === amendment.id
                            }
                            className="inline-flex cursor-pointer items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          >
                            {isReviewing && reviewingId === amendment.id
                              ? "Working..."
                              : "Accept Request"}
                          </button>
                          <button
                            onClick={() =>
                              handleReviewAmendment(amendment, "REJECTED")
                            }
                            disabled={
                              isReviewing && reviewingId === amendment.id
                            }
                            className="inline-flex cursor-pointer items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    {amendment.status === "APPROVED" &&
                      !amendment.amendmentProposalId && (
                        <button
                          onClick={() => setProposalAmendment(amendment)}
                          className="inline-flex cursor-pointer items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-all active:scale-95 shadow-sm"
                        >
                          Create Proposal
                        </button>
                      )}
                    {amendment.amendmentProposalId &&
                      amendment.amendmentProposal?.status === "DRAFT" && (
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/new-proposal/${project.id}?proposalId=${amendment.amendmentProposalId}`,
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <FileTextIcon className="w-3.5 h-3.5" />
                          Continue Draft
                        </button>
                      )}
                    {amendment.amendmentProposalId && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-green-200 bg-green-50 text-green-700">
                        <FileCheck className="w-3.5 h-3.5" />
                        {amendment.amendmentProposal?.proposalNumber ||
                          "Proposal Linked"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices raised on this project, under the contracts they extend. */}
      <InvoiceList projectId={project.id} canEdit={canEdit} />

      {/* Contract Review Modal */}
      <ContractReviewModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        proposalId={contractProposalId}
      />

      {/* Bills outside the contract, offered the accepted ones to attach to. */}
      <NewInvoiceModal
        open={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        projectId={project.id}
        contracts={allProposals
          .filter((p: any) => p.status === "ACCEPTED")
          .map((p: any) => ({
            id: p.id,
            proposalNumber: p.proposalNumber,
            proposalType: p.proposalType === "AMENDMENT" ? "AMENDMENT" : "NORMAL",
          }))}
      />

      {/* Raise an amendment request for the client */}
      <CreateAmendmentRequestModal
        isOpen={isNewAmendmentOpen}
        isLoading={isCreatingAmendment}
        onClose={() => setIsNewAmendmentOpen(false)}
        onSubmit={handleCreateAmendmentForClient}
      />

      {/* Create a proposal straight from an approved amendment request */}
      <CreateProposalFromAmendmentModal
        isOpen={!!proposalAmendment}
        isLoading={isCreatingFromAmendment}
        amendment={proposalAmendment}
        onClose={() => setProposalAmendment(null)}
        onSubmit={handleCreateProposalFromAmendment}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen && !!deleteTarget}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent className="max-w-md space-y-5 bg-white">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-1">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle>Delete Proposal</DialogTitle>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete proposal{" "}
              <span className="font-semibold text-gray-700">
                {deleteTarget?.proposalNumber}
              </span>
              ? This action cannot be undone.
            </p>
          </DialogHeader>

          {/* A form so Enter submits, matching the delete-project dialog. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmDelete();
            }}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="deleteProposalPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter your{" "}
                <span className="font-bold text-red-600">super admin password</span>{" "}
                to confirm
              </label>
              <div className="relative">
                <input
                  id="deleteProposalPassword"
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={
                    showDeletePassword ? "Hide password" : "Show password"
                  }
                >
                  {showDeletePassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="flex-1 cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!deletePassword.trim() || isDeleting}
                className="flex-1 cursor-pointer px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Proposal"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
