import { useState } from "react";
import { toExternalUrl } from "@/utils/externalUrl";
import {
  ProjectRequest,
  Proposal,
  useGetProposalsByProjectRequestQuery,
  useGetStagesByProposalQuery,
} from "@/redux/api/adminDashboard/proposalApi";
import { useGetProjectPaymentsQuery } from "@/redux/api/paymentApi";
import { useSendMeetingLinkMutation } from "@/redux/api/meetingApi";
import { Loader2, CalendarPlus, Lock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

/**
 * Per-phase meetings are switched off — the architect arranges every meeting
 * beyond the initial consultation and the project kick-off, both of which live
 * on the Meeting Request tab. The component is kept (and still compiles) so the
 * behaviour can be brought back by flipping this flag and re-mounting it.
 */
const PHASE_MEETINGS_ENABLED = false;

type PhaseMeetingCardsProps = {
  project: ProjectRequest;
};

export default function PhaseMeetingCards({ project }: PhaseMeetingCardsProps) {
  const { data: proposalsData } = useGetProposalsByProjectRequestQuery(
    project.id,
  );
  const { data: paymentsData } = useGetProjectPaymentsQuery(project.id);

  const acceptedProposals = (proposalsData?.data || []).filter(
    (p) => p.status === "ACCEPTED",
  );
  const payments: any[] = (paymentsData as any)?.data || [];

  if (!PHASE_MEETINGS_ENABLED) return null;
  if (acceptedProposals.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
        Phase Meetings
      </h3>
      {acceptedProposals.map((proposal) => (
        <ProposalPhaseMeetings
          key={proposal.id}
          project={project}
          proposal={proposal}
          payments={payments}
        />
      ))}
    </div>
  );
}

function ProposalPhaseMeetings({
  project,
  proposal,
  payments,
}: {
  project: ProjectRequest;
  proposal: Proposal;
  payments: any[];
}) {
  const { data: stages, isLoading } = useGetStagesByProposalQuery(proposal.id);
  const isInstallment =
    proposal.paymentType === "INSTALLMENT" ||
    proposal.paymentMethod === "INSTALLMENT" ||
    proposal.paymentMethod === "installments";

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading phases...
      </div>
    );
  }

  if (!stages || stages.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500">
        {proposal.title || proposal.projectName}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stages.map((stage: any) => {
          const stageMeeting = project.meetingLinks?.find(
            (m: any) => m.stageId === stage.id,
          );
          const paid = payments.some(
            (p) => p.stageId === stage.id && p.paymentStatus === "COMPLETED",
          );
          const canSchedule = !isInstallment || paid;
          return (
            <PhaseMeetingCard
              key={stage.id}
              project={project}
              stage={stage}
              meeting={stageMeeting}
              canSchedule={canSchedule}
            />
          );
        })}
      </div>
    </div>
  );
}

function PhaseMeetingCard({
  project,
  stage,
  meeting,
  canSchedule,
}: {
  project: ProjectRequest;
  stage: any;
  meeting: any;
  canSchedule: boolean;
}) {
  const [sendMeetingLink, { isLoading }] = useSendMeetingLinkMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    meetingUrl: "",
    title: `Meeting for ${stage.name}`,
    scheduledAt: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meetingUrl || !form.scheduledAt) {
      toast.error("Please provide a meeting URL and date");
      return;
    }
    try {
      await sendMeetingLink({
        projectRequestId: project.id,
        stageId: stage.id,
        ...form,
      }).unwrap();
      toast.success("Phase meeting scheduled!");
      setShowForm(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to schedule phase meeting");
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white">
      <p className="text-sm font-semibold text-gray-900">{stage.name}</p>

      {meeting ? (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 inline-flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            {meeting.status === "ACCEPTED"
              ? "Confirmed"
              : meeting.status === "PENDING_RESPONSE"
                ? "Awaiting Client"
                : meeting.status}
          </span>
          {meeting.meetingUrl && (
            <a
              href={toExternalUrl(meeting.meetingUrl) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ) : !canSchedule ? (
        <p className="text-[10px] text-amber-600 mt-2">
          Client must pay this phase before a meeting can be scheduled.
        </p>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <input
            type="url"
            required
            placeholder="Meeting URL"
            value={form.meetingUrl}
            onChange={(e) =>
              setForm((p) => ({ ...p, meetingUrl: e.target.value }))
            }
            className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded"
          />
          <input
            type="datetime-local"
            required
            value={form.scheduledAt}
            onChange={(e) =>
              setForm((p) => ({ ...p, scheduledAt: e.target.value }))
            }
            className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 text-xs py-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 text-xs py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Schedule Meeting
        </button>
      )}
    </div>
  );
}
