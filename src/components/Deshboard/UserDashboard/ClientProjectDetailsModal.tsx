import { X, Loader2, Info, FileText, Paperclip } from "lucide-react";
import { useGetAmendmentsByProjectQuery } from "@/redux/api/amendmentApi";
import { useGetProjectRequestByIdQuery } from "@/redux/api/adminDashboard/proposalApi";
import {
  useGetPaymentStatusQuery,
  useCreateCheckoutSessionMutation,
} from "@/redux/api/paymentApi";
import {
  useGetUserBankDetailsQuery,
  useCreateRefundRequestMutation,
  useGetMyRefundRequestsQuery,
} from "@/redux/api/refundApi";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import RefundBankDetailsModal, { BankDetails } from "./RefundBankDetailsModal";
import RefundCauseModal from "./RefundCauseModal";
import RefundPhaseSelectModal, {
  RefundablePhase,
} from "./RefundPhaseSelectModal";
import { useSearchParams } from "react-router-dom";
import { useGetAttachmentsQuery } from "@/redux/api/adminDashboard/attachmentApi";
import ContractReviewModal from "@/components/Deshboard/ContractReviewModal";

import ClientProjectInfoTab from "./tabs/ClientProjectInfoTab";
import ClientProposalsTab from "./tabs/ClientProposalsTab";
import ClientMeetingPaymentTab from "./tabs/ClientMeetingPaymentTab";
import ClientAttachmentsTab from "./tabs/ClientAttachmentsTab";

interface ClientProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  /** Tab to land on, used by notification deep links. */
  initialTab?: string | null;
  /** Contract to open for signing straight away. */
  initialProposalId?: string | null;
}

type ClientTab = "details" | "contracts" | "attachments";

const TABS: { key: ClientTab; label: string; icon: any }[] = [
  { key: "details", label: "Project Details", icon: Info },
  { key: "contracts", label: "Contracts and Meetings", icon: FileText },
  { key: "attachments", label: "Documents", icon: Paperclip },
];

/** Older deep links point at the now-merged Proposals / Meetings tabs. */
const resolveTab = (tab?: string | null): ClientTab =>
  tab === "proposals" || tab === "meetings"
    ? "contracts"
    : tab === "details" || tab === "contracts" || tab === "attachments"
      ? tab
      : "details";

export default function ClientProjectDetailsModal({
  isOpen,
  onClose,
  project: initialProject,
  initialTab,
  initialProposalId,
}: ClientProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>("details");

  const {
    data: latestProject,
    isLoading,
    refetch: refetchProject,
  } = useGetProjectRequestByIdQuery(initialProject?.id, {
    skip: !isOpen || !initialProject?.id,
    refetchOnMountOrArgChange: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const paymentResult = searchParams.get("payment");

  const { data: paymentData, refetch: refetchPayment } =
    useGetPaymentStatusQuery(initialProject?.id, {
      skip: !isOpen || !initialProject?.id,
    });

  const { data: amendmentsData } = useGetAmendmentsByProjectQuery(
    { projectId: initialProject?.id },
    { skip: !isOpen || !initialProject?.id },
  );

  const { data: bankData } = useGetUserBankDetailsQuery(undefined, {
    skip: !isOpen,
  });

  // Once a refund is approved the client no longer owns that phase, so it is
  // dropped from the project view entirely - no progress row, no payment row,
  // and it cannot be refunded a second time.
  const { data: myRefunds } = useGetMyRefundRequestsQuery(undefined, {
    skip: !isOpen,
  });
  const refundedStageIds = useMemo(() => {
    const ids = new Set<string>();
    (myRefunds?.data || []).forEach((refund: any) => {
      if (
        refund.refundStatus === "APPROVED" &&
        refund.projectRequestId === initialProject?.id &&
        refund.stageId
      ) {
        ids.add(refund.stageId);
      }
    });
    return ids;
  }, [myRefunds, initialProject?.id]);

  const { data: attachments } = useGetAttachmentsQuery(initialProject?.id, {
    skip: !isOpen || !initialProject?.id,
  });

  const [createCheckout, { isLoading: isCreatingCheckout }] =
    useCreateCheckoutSessionMutation();
  const [createRefund, { isLoading: isSubmittingRefund }] =
    useCreateRefundRequestMutation();

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [pendingBankDetails, setPendingBankDetails] =
    useState<BankDetails | null>(null);

  // Refund flow: contract -> pick phases -> bank details (first time) -> reason.
  // Each selected phase becomes its own refund request.
  const [refundContract, setRefundContract] = useState<any>(null);
  const [phaseSelectOpen, setPhaseSelectOpen] = useState(false);
  const [selectedPhasesForRefund, setSelectedPhasesForRefund] = useState<
    RefundablePhase[]
  >([]);
  // Lets the payments tab open an unsigned amendment's contract for signing.
  const [contractProposalId, setContractProposalId] = useState<string>("");

  const project = latestProject || initialProject;

  // Reset to the first tab whenever a different project is opened, unless a
  // notification deep link named the tab to land on.
  useEffect(() => {
    if (initialProject?.id) setActiveTab(resolveTab(initialTab));
  }, [initialProject?.id, initialTab]);

  // A deep link may also name a contract to open for signing straight away.
  useEffect(() => {
    if (isOpen && initialProposalId) setContractProposalId(initialProposalId);
  }, [isOpen, initialProposalId]);

  useEffect(() => {
    if (paymentResult === "success") {
      toast.success("Payment successful! Files are now accessible.");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("payment");
      newParams.delete("paymentId");
      setSearchParams(newParams);
      refetchPayment();
    } else if (paymentResult === "cancelled") {
      toast.error("Payment was cancelled.");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("payment");
      setSearchParams(newParams);
    }
  }, [paymentResult]);

  const handlePay = async (
    stageId?: string,
    stageName?: string,
    amount?: number,
  ) => {
    try {
      const proposal = paymentData?.data?.proposal;
      if (!proposal) {
        toast.error("Proposal information not found");
        return;
      }

      const res = await createCheckout({
        projectRequestId: project.id,
        proposalId: proposal.id,
        stageId: stageId || undefined,
        stageName: stageName || undefined,
        amount: amount || paymentData?.data?.totalAmount || 0,
        paymentType: paymentData?.data?.paymentMethod || "LUMP_SUM",
        projectName: project.projectName,
      }).unwrap();

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to initiate payment");
    }
  };

  const handlePayAmendment = async (
    amendmentProposalId: string,
    amount: number,
    title: string,
    serviceId?: string,
    serviceName?: string,
  ) => {
    try {
      const res = await createCheckout({
        projectRequestId: project.id,
        proposalId: amendmentProposalId,
        // A by-phase amendment bills one service at a time.
        stageId: serviceId || undefined,
        stageName: serviceName || undefined,
        amount,
        paymentType: serviceId ? "INSTALLMENT" : "LUMP_SUM",
        projectName: `${project.projectName} — Amendment: ${title}`,
      }).unwrap();

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to initiate amendment payment");
    }
  };

  // Opened from a contract header — the client then picks which of that
  // contract's paid phases the refund covers.
  const handleRequestRefundClick = (contract: any) => {
    setRefundContract(contract);
    setPhaseSelectOpen(true);
  };

  const handlePhasesSelected = (phases: RefundablePhase[]) => {
    setSelectedPhasesForRefund(phases);
    setPhaseSelectOpen(false);
    if (!bankData?.data) {
      setBankModalOpen(true);
    } else {
      setRefundModalOpen(true);
    }
  };

  const handleBankDetailsSubmit = async (details: BankDetails) => {
    setPendingBankDetails(details);
    setBankModalOpen(false);
    setRefundModalOpen(true);
  };

  const resetRefundFlow = () => {
    setRefundModalOpen(false);
    setPhaseSelectOpen(false);
    setRefundContract(null);
    setSelectedPhasesForRefund([]);
    setPendingBankDetails(null);
  };

  const handleRefundSubmit = async (refundDetails: {
    refundCause: string;
    refundDescription: string;
  }) => {
    if (selectedPhasesForRefund.length === 0) return;

    try {
      // One request per phase so each can be approved or denied on its own.
      // Bank details only need sending once.
      for (const [index, phase] of selectedPhasesForRefund.entries()) {
        await createRefund({
          projectRequestId: project.id,
          stageId: phase.id,
          stageName: phase.name,
          refundCause: refundDetails.refundCause,
          refundDescription: refundDetails.refundDescription,
          amount: phase.amount,
          bankDetails:
            index === 0 ? pendingBankDetails || undefined : undefined,
        }).unwrap();
      }

      toast.success(
        selectedPhasesForRefund.length === 1
          ? "Refund request submitted successfully"
          : `${selectedPhasesForRefund.length} refund requests submitted`,
      );
      resetRefundFlow();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit refund request");
    }
  };

  if (!isOpen || !project) return null;

  const paymentInfo = paymentData?.data;
  const amendments = amendmentsData?.data || [];

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
        <div className="bg-white md:rounded-2xl w-full max-w-full md:max-w-6xl max-h-[100vh] md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 pt-5 border-b border-gray-100 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  {project.projectName}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-tighter">
                    {(project.serviceType || "").replace(/_/g, " ")}
                  </span>
                  {project.projectCategory && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100 uppercase tracking-tighter">
                      {project.projectCategory}
                    </span>
                  )}
                  {isLoading && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full animate-pulse border border-blue-100 flex-shrink-0">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span className="text-[9px] font-bold uppercase">
                        Refreshing
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? "border-gray-900 text-gray-900 font-bold"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200">
            {activeTab === "details" && (
              <ClientProjectInfoTab
                project={project}
                paymentInfo={paymentInfo}
                onGoToPayments={() => setActiveTab("contracts")}
                onRequestRefund={handleRequestRefundClick}
                refundedStageIds={refundedStageIds}
              />
            )}

            {/* Merged tab: contracts first, then meetings & payment below. */}
            {activeTab === "contracts" && (
              <div className="space-y-10">
                <ClientProposalsTab project={project} amendments={amendments} />
                <div className="border-t border-gray-100" />
                <ClientMeetingPaymentTab
                  project={project}
                  paymentInfo={paymentInfo}
                  amendments={amendments}
                  isCreatingCheckout={isCreatingCheckout}
                  onPay={handlePay}
                  onPayAmendment={handlePayAmendment}
                  onRequestRefund={handleRequestRefundClick}
                  refundedStageIds={refundedStageIds}
                  onViewAmendmentContract={setContractProposalId}
                  onConsultationPaid={() => {
                    refetchProject();
                    refetchPayment();
                  }}
                />
              </div>
            )}

            {activeTab === "attachments" && (
              <ClientAttachmentsTab
                project={project}
                attachments={attachments}
                paymentInfo={paymentInfo}
                onGoToPayments={() => setActiveTab("contracts")}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end">
            <button
              onClick={onClose}
              className="w-full cursor-pointer sm:w-auto px-10 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-900/20 active:scale-95 hover:shadow-gray-900/40"
            >
              Close View
            </button>
          </div>
        </div>
      </div>

      {/* Sign an amendment contract straight from the payments tab */}
      {contractProposalId && (
        <ContractReviewModal
          isOpen={!!contractProposalId}
          proposalId={contractProposalId}
          onClose={() => setContractProposalId("")}
          onContractSigned={() => {
            setContractProposalId("");
            refetchPayment();
          }}
        />
      )}

      {/* Refund Flow Modals: pick phases -> bank details -> reason */}
      <RefundPhaseSelectModal
        isOpen={phaseSelectOpen}
        onClose={resetRefundFlow}
        contractTitle={
          refundContract?.title || project?.projectName || "Contract"
        }
        contractNumber={refundContract?.proposalNumber}
        phases={refundContract?.refundablePhases || []}
        onConfirm={handlePhasesSelected}
      />

      <RefundBankDetailsModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        onSubmit={handleBankDetailsSubmit}
      />

      <RefundCauseModal
        isOpen={refundModalOpen}
        onClose={resetRefundFlow}
        stageName={
          selectedPhasesForRefund.length === 1
            ? selectedPhasesForRefund[0].name
            : `${selectedPhasesForRefund.length} phases · ${refundContract?.title || ""}`
        }
        isLoading={isSubmittingRefund}
        onSubmit={handleRefundSubmit}
      />
    </>
  );
}
