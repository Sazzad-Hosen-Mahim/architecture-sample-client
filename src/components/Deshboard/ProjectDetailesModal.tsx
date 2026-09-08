import {
  ProjectRequest,
  useGetProposalInfoQuery,
  useDeleteProjectMutation,
  useDecideInquiryMutation,
  useResendInquiryInviteMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  FolderKanban,
  Info,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Ban,
  RefreshCw,
} from "lucide-react";

// Tab components
const ProjectInformationTab = lazy(
  () => import("./tabs/ProjectInformationTab"),
);
const ContractsTab = lazy(() => import("./tabs/ContractsTab"));
const ProjectMgmtTab = lazy(() => import("./tabs/ProjectMgmtTab"));
const MeetingRequestTab = lazy(() => import("./tabs/MeetingRequestTab"));

import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { Loader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const TabLoader = () => <Loader fullScreen={false} />;

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectRequest | null;
  readOnly?: boolean;
  /** Tab to land on, used by notification deep links. */
  initialTab?: DeepLinkTab | null;
};

/**
 * "client" is Client Management, which holds what used to be two tabs of its
 * own: Contracts first, then Meeting Request beneath it.
 */
type ModalTab = "information" | "client" | "management";

/**
 * Notifications already in circulation deep-link to the two tabs Client
 * Management replaced, so those names are still accepted and land on it.
 */
type DeepLinkTab = ModalTab | "contracts" | "meeting";

const resolveTab = (tab: DeepLinkTab | null | undefined): ModalTab =>
  tab === "contracts" || tab === "meeting" ? "client" : (tab ?? "information");

const STATUS_OPTIONS = [
  { value: "PENDING", label: "PENDING" },
  { value: "REVIEWED", label: "INQUIRY" },
  { value: "SCHEDULED", label: "BIDDING" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "COMPLETED", label: "COMPLETED" },
] as const;

const getStatusLabel = (status: string) => {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
};

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  project: initialProject,
  readOnly,
  initialTab,
}: ProjectModalProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>("information");
  const user = useAppSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [deletePasswordModalOpen, setDeletePasswordModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteProject, { isLoading: isDeletingProject }] =
    useDeleteProjectMutation();

  const [decideInquiry, { isLoading: isDeciding }] = useDecideInquiryMutation();
  const [resendInvite, { isLoading: isResending }] =
    useResendInquiryInviteMutation();
  const [inquiryModal, setInquiryModal] = useState<null | "accept" | "decline">(
    null,
  );

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const scrollAmount = 150;
      tabsContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Fetch fresh project details including meeting links.
  //
  // Use `currentData`, not `data`: `data` lingers on the PREVIOUS project while
  // the newly opened one loads, which flashed the wrong project's details for a
  // second every time you closed one card and opened another.
  const { currentData, isFetching } = useGetProposalInfoQuery(
    initialProject?.id as string,
    {
      skip: !isOpen || !initialProject?.id,
    },
  );

  const detail =
    currentData && currentData.id === initialProject?.id
      ? currentData
      : undefined;

  // First fetch of a project whose full details aren't cached yet — show a
  // spinner rather than the sparse list row. A reopen is instant because
  // `detail` is already populated.
  const isDetailLoading = isFetching && !detail;

  const project = detail || initialProject;
  const meetingLinks = project?.meetingLinks || [];

  // Account-less inquiry that hasn't been converted into a client account yet.
  // Everything but Project Information is locked until the studio decides and
  // the client signs up.
  const inquiryStatus = project?.inquiryStatus ?? null;
  const isGatedInquiry = !!inquiryStatus && inquiryStatus !== "CONVERTED";
  const consultationRefund = project?.consultationRefund ?? null;

  // Reset tab when project changes, honouring a deep-linked tab if given.
  useEffect(() => {
    if (initialProject) {
      setActiveTab(resolveTab(initialTab));
    }
  }, [initialProject, initialTab]);

  useEffect(() => {
    if (isGatedInquiry) setActiveTab("information");
  }, [isGatedInquiry]);

  const handleInquiryDecision = async (decision: "ACCEPT" | "DECLINE") => {
    if (!project) return;
    try {
      const res = await decideInquiry({ id: project.id, decision }).unwrap();
      toast.success(res.message || "Done");
      setInquiryModal(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Action failed");
    }
  };

  const handleResendInvite = async () => {
    if (!project) return;
    try {
      const res = await resendInvite(project.id).unwrap();
      toast.success(res.message || "Invite re-sent");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to resend invite");
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /**
   * Close only when the backdrop itself is pressed.
   *
   * This used to be a document-level mousedown listener that closed whenever
   * the target sat outside the modal box. Radix layers (the assign-manager
   * Select, the nested contract dialog) set `pointer-events: none` on <body>
   * while they are open, so dismissing one made the event target <body> —
   * outside the modal, matching none of the "is this a portal?" escape
   * hatches, and the parent modal closed along with it. Checking the backdrop
   * is the event target instead means portalled content can never reach here.
   */
  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const allTabs = [
    {
      key: "information" as ModalTab,
      label: "Project Information",
      icon: <Info className="w-4 h-4" />,
    },
    {
      key: "client" as ModalTab,
      label: "Client Management",
      icon: <Users className="w-4 h-4" />,
    },
    {
      key: "management" as ModalTab,
      label: "Project Management",
      icon: <FolderKanban className="w-4 h-4" />,
    },
    // The Documents tab is gone: both folders — the internal one and the
    // shared Architect + Client one — now live on Project Information.
  ];

  const isStaff = user?.role === "DRAFTER" || user?.role === "EMPLOYEE";
  const roleTabs = isStaff
    ? allTabs.filter((t) => t.key === "information" || t.key === "management")
    : allTabs;
  const tabs = isGatedInquiry
    ? roleTabs.filter((t) => t.key === "information")
    : roleTabs;

  const handleDeleteProject = async () => {
    if (!project || !deletePassword) return;
    try {
      await deleteProject({
        id: project.id,
        password: deletePassword,
      }).unwrap();
      toast.success("Project permanently deleted");
      setDeletePasswordModalOpen(false);
      setDeletePassword("");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete project");
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-white rounded-none sm:rounded-2xl max-w-6xl w-full h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header Section */}
        <div className="px-4 sm:px-8 pt-4 pb-0 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {project.projectName}
                </h2>
                {isFetching && detail && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full animate-pulse border border-blue-100">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      Updating...
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium rounded-md">
                  {project.projectCategory || "Category"}
                </span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium rounded-md">
                  {getStatusLabel(project.status)}
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 text-sm font-medium rounded-md">
                  {(project.serviceType || "").replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {!readOnly && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {project &&
                  project.meetingLinks &&
                  project.meetingLinks.filter(
                    (m: any) => m.status === "PENDING_CLIENT_REQUEST",
                  ).length > 0 && (
                    <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg border border-amber-200 font-bold animate-pulse flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      NEW MEETING REQUEST
                    </div>
                  )}
                {isSuperAdmin && (
                  <button
                    onClick={() => setDeletePasswordModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                  >
                    Delete Inquiry
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Account-less inquiry gate — Accept / Decline / invite status */}
          {isGatedInquiry && !readOnly && (
            <div
              className={`mb-3 rounded-lg border p-3 ${
                inquiryStatus === "AWAITING_DECISION"
                  ? "border-amber-200 bg-amber-50"
                  : inquiryStatus === "ACCEPTED"
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
              }`}
            >
              {inquiryStatus === "AWAITING_DECISION" && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Awaiting your decision
                    </p>
                    {/* <p className="text-xs text-amber-800">
                      Submitted without an account
                      {project.consultationPaymentId
                        ? " — the consultation fee has been paid"
                        : ""}
                      . Accept to email a signup link, or decline
                      {project.consultationPaymentId
                        ? " to email the client and refund the fee"
                        : ""}
                      .
                    </p> */}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setInquiryModal("accept")}
                      className="inline-flex cursor-pointer items-center gap-1.5 bg-green-500 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button
                      onClick={() => setInquiryModal("decline")}
                      className="inline-flex cursor-pointer items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                    >
                      <Ban className="w-4 h-4" /> Decline
                    </button>
                  </div>
                </div>
              )}

              {inquiryStatus === "ACCEPTED" && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Signup invite sent — awaiting client signup
                    </p>
                    <p className="text-xs text-blue-800">
                      Emailed to {project.email}
                      {project.claimInviteSentAt
                        ? ` · last sent ${new Date(project.claimInviteSentAt).toLocaleDateString()}`
                        : ""}
                      {project.claimInviteCount
                        ? ` · ${project.claimInviteCount}× total`
                        : ""}
                      . The other tabs unlock once they sign up.
                    </p>
                  </div>
                  <button
                    onClick={handleResendInvite}
                    disabled={isResending}
                    className="inline-flex items-center gap-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`}
                    />
                    Resend invite
                  </button>
                </div>
              )}

              {inquiryStatus === "DECLINED" && (
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Inquiry declined
                    {project.inquiryDecidedAt
                      ? ` on ${new Date(project.inquiryDecidedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                  {consultationRefund ? (
                    <p className="text-xs text-gray-600">
                      Consultation refund $
                      {Number(consultationRefund.amount).toLocaleString()} —{" "}
                      {consultationRefund.status === "PROCESSED"
                        ? `refunded${
                            consultationRefund.processedAt
                              ? ` ${new Date(consultationRefund.processedAt).toLocaleDateString()}`
                              : ""
                          }`
                        : "pending in Consultation Refunds"}
                      .
                    </p>
                  ) : project.consultationPaymentId ? (
                    <p className="text-xs text-gray-600">
                      No refund record was raised for the consultation fee.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Tab Navigation Wrapper */}
          <div className="relative flex items-center w-full">
            {/* Left Scroll Indicator Button */}
            <button
              onClick={() => scrollTabs("left")}
              className="absolute left-0 z-10 p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-black rounded-full border border-gray-200 shadow-sm cursor-pointer active:scale-95 transition-all md:hidden"
              aria-label="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Tab Navigation */}
            <div
              ref={tabsContainerRef}
              className="flex-1 flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide px-6 md:px-0"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-gray-900 text-gray-900 font-bold"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right Scroll Indicator Button */}
            <button
              onClick={() => scrollTabs("right")}
              className="absolute right-0 z-10 p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-black rounded-full border border-gray-200 shadow-sm cursor-pointer active:scale-95 transition-all md:hidden"
              aria-label="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {isDetailLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
              <span className="text-xs font-medium">Loading project…</span>
            </div>
          ) : (
            <Suspense fallback={<TabLoader />}>
              {activeTab === "information" && (
                <ProjectInformationTab project={{ ...project, meetingLinks }} />
              )}
              {/* Client Management. The two panels are the same components
                  that had a tab each, rendered one above the other and
                  otherwise untouched — contracts first, meetings below. */}
              {activeTab === "client" && (
                <div className="space-y-8">
                  <ContractsTab project={{ ...project, meetingLinks }} />
                  <MeetingRequestTab project={{ ...project, meetingLinks }} />
                </div>
              )}
              {activeTab === "management" && (
                <ProjectMgmtTab
                  project={{ ...project, meetingLinks }}
                  readOnly={readOnly}
                />
              )}
            </Suspense>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-6 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Accept / Decline confirmation for an account-less inquiry */}
      <Dialog
        open={inquiryModal !== null}
        onOpenChange={(open) => {
          if (!open) setInquiryModal(null);
        }}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {inquiryModal === "accept"
                ? "Accept this inquiry?"
                : "Decline this inquiry?"}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {inquiryModal === "accept" ? (
                <>
                  <span className="font-semibold text-gray-700">
                    {project.email}
                  </span>{" "}
                  will be emailed a one-time link to create their account. Once
                  they sign up they're added to the client list and every tab
                  unlocks.
                </>
              ) : (
                <>
                  <span className="font-semibold text-gray-700">
                    {project.email}
                  </span>{" "}
                  will be emailed that the inquiry can't proceed.
                  {project.consultationPaymentId
                    ? " A full consultation-fee refund will be raised and will appear in Consultation Refunds for finance to process."
                    : ""}{" "}
                  This can't be undone.
                </>
              )}
            </p>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setInquiryModal(null)}
              className="flex-1 px-4 py-2.5 text-sm cursor-pointer font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                handleInquiryDecision(
                  inquiryModal === "accept" ? "ACCEPT" : "DECLINE",
                )
              }
              disabled={isDeciding}
              className={`flex-1 cursor-pointer px-4 py-2.5 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center ${
                inquiryModal === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isDeciding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Working...
                </>
              ) : inquiryModal === "accept" ? (
                "Accept & send invite"
              ) : (
                "Decline inquiry"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Inquiry password confirmation */}
      <Dialog
        open={deletePasswordModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeletePasswordModalOpen(false);
            setDeletePassword("");
          }
        }}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Delete Inquiry</DialogTitle>
            <p className="text-sm text-gray-500">
              This will permanently delete{" "}
              <span className="font-semibold text-gray-700">
                {project.projectName}
              </span>{" "}
              and all related data. This action cannot be undone. Enter your
              password to confirm.
            </p>
          </DialogHeader>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setDeletePasswordModalOpen(false);
                setDeletePassword("");
              }}
              className="flex-1 px-4 py-2.5 text-sm cursor-pointer font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProject}
              disabled={!deletePassword || isDeletingProject}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isDeletingProject ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 cursor-pointer animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Inquiry"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
