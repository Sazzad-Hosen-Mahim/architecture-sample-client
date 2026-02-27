import { ProjectRequest, useUpdateProjectRequestStatusMutation } from "@/redux/api/adminDashboard/proposalApi";
import { useSendMeetingLinkMutation } from "@/redux/api/meetingApi";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircle2Icon,
  Building2Icon,
  HomeIcon,
  Loader2,
  VideoIcon,
  SendIcon,
  FileTextIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner"; // or your toast library
import { useNavigate } from "react-router-dom";
import ContractReviewModal from "./ContractReviewModal";

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectRequest | null;
};

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
}: ProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<ProjectRequest["status"] | null>(null);
  const navigate = useNavigate()

  // Contract modal state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractProposalId, setContractProposalId] = useState<string>("");

  // Call the mutation hook at the component level
  const [updateStatus, { isLoading: isUpdating }] = useUpdateProjectRequestStatusMutation();

  // Meeting form state
  const [sendMeetingLink, { isLoading: isSendingMeeting }] = useSendMeetingLinkMutation();
  const [meetingForm, setMeetingForm] = useState({
    meetingUrl: "",
    title: "",
    scheduledAt: "",
    notes: "",
  });

  // Reset selected status and meeting form when modal opens with new project
  useEffect(() => {
    if (project) {
      setSelectedStatus(project.status);
      setMeetingForm({
        meetingUrl: "",
        title: "",
        scheduledAt: "",
        notes: "",
      });
    }
  }, [project]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is on a Select dropdown (rendered in portal)
      const isSelectDropdown = target.closest('[data-radix-select-content]') ||
        target.closest('[data-radix-popper-content-wrapper]');

      if (
        modalRef.current &&
        !modalRef.current.contains(target) &&
        !isSelectDropdown
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const STATUS_OPTIONS = [
    { value: "PENDING", label: "Initial" },
    { value: "REVIEWED", label: "Inquiry" },
    { value: "SCHEDULED", label: "Bidding" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
  ] as const;

  // Handler for status change in dropdown
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as ProjectRequest["status"]);
  };

  // Handler for save changes button
  const handleSaveChanges = async () => {
    if (!selectedStatus || selectedStatus === project.status) {
      toast.info("No changes to save");
      return;
    }

    try {
      await updateStatus({
        id: project.id,
        status: selectedStatus,
        notes: "Status updated from admin panel",
      }).unwrap();

      toast.success("Status updated successfully!");
      // Optional: close modal after successful update
      // onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  // Handler for meeting form submission
  const handleSendMeetingLink = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!meetingForm.meetingUrl || !meetingForm.title || !meetingForm.scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await sendMeetingLink({
        projectRequestId: project.id,
        ...meetingForm,
      }).unwrap();

      toast.success("Meeting link sent successfully!");
      // Reset form
      setMeetingForm({
        meetingUrl: "",
        title: "",
        scheduledAt: "",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to send meeting link:", error);
      toast.error("Failed to send meeting link. Please try again.");
    }
  };

  // Handler for meeting form input changes
  const handleMeetingFormChange = (field: string, value: string) => {
    setMeetingForm(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to get progress based on status
  const getProgress = (status: string) => {
    switch (status) {
      case "PENDING": return 25;
      case "REVIEWED": return 50;
      case "SCHEDULED": return 75;
      case "ACTIVE": return 90;
      case "COMPLETED": return 100;
      default: return 0;
    }
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;
  };

  const progress = getProgress(selectedStatus || project.status);
  const fullClientName = `${project.clientFirstName} ${project.clientMiddleName} ${project.clientLastName}`.trim();
  const fullAddress = `${project.streetAddress}, ${project.city}, ${project.state}, ${project.country}`;
  const projectAddress = `${project.projectStreetAddress}, ${project.projectCity}, ${project.projectState}, ${project.projectCountry}`;

  const acceptedProposal = project.proposals?.find(p => p.status === "ACCEPTED");

  const hasChanges = selectedStatus !== project.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header Section */}
        <div className="px-8 pt-4 pb-2 space-y-2 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {project.projectName}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium rounded-md">
                  {project.projectCategory}
                </span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium rounded-md">
                  {getStatusLabel(selectedStatus || project.status)}
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 text-sm font-medium rounded-md">
                  {project.serviceType.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {acceptedProposal && (
                <button
                  onClick={() => {
                    setContractProposalId(acceptedProposal.id);
                    setIsContractModalOpen(true);
                  }}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 border border-amber-200 transition-colors"
                >
                  <FileTextIcon size={16} />
                  See Contract
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                disabled={isUpdating}
              >
                Delete Inquiry
              </button>

              <Select
                value={selectedStatus || project.status}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[180px] bg-slate-700  text-white border-none hover:bg-slate-900">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>

                <SelectContent className="bg-slate-200 border-gray-200">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-slate-300">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 pb-8 mt-4">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Information */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Project Details</h3>
              <p className="text-sm text-blue-600 font-medium mb-6">
                Information about the project inquiry
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Project Category
                    </h4>
                    <div className="flex items-center gap-2">
                      {project.projectCategory === "RESIDENTIAL" ? (
                        <HomeIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Building2Icon className="w-4 h-4 text-gray-500" />
                      )}
                      <p className="text-sm text-gray-600">{project.projectCategory}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Service Type
                    </h4>
                    <p className="text-sm text-gray-600">
                      {project.serviceType.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Project Size
                    </h4>
                    <p className="text-sm text-gray-600">{project.projectSize}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Budget Range
                    </h4>
                    <p className="text-sm text-orange-600 font-medium">
                      {project.budgetRange || "Not specified"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Project Location
                  </h4>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{projectAddress}</span>
                  </div>
                  {project.projectZipCode && (
                    <p className="text-sm text-gray-500 ml-6 mt-1">
                      Zip Code: {project.projectZipCode}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Architectural Style
                  </h4>
                  <p className="text-sm text-gray-600">
                    {project.preferredArchitecturalStyle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Site Constraints
                    </h4>
                    <p className="text-sm text-gray-600">{project.siteConstraints}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Sustainability Goals
                    </h4>
                    <p className="text-sm text-gray-600">{project.sustainabilityGoals}</p>
                  </div>
                </div>

                {project.specialRequirements && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Special Requirements
                    </h4>
                    <p className="text-sm text-gray-600">{project.specialRequirements}</p>
                  </div>
                )}

                {project.additionalComments && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Additional Comments
                    </h4>
                    <p className="text-sm text-gray-600">{project.additionalComments}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Client Info & Consultation Details */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Client Information</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 font-medium">
                    {fullClientName}
                  </span>
                </div>

                {project.companyName && (
                  <div className="flex items-center gap-3">
                    <Building2Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {project.companyName}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MailIcon className="w-4 h-4 text-gray-400" />
                  <a
                    href={`mailto:${project.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {project.email}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-4 h-4 text-gray-400" />
                  <a
                    href={`tel:${project.phone}`}
                    className="text-sm text-gray-900 hover:underline"
                  >
                    {project.phone}
                  </a>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-600">{fullAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Info */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Consultation Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-900">
                    {formatDate(project.appointmentDate)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {project.appointmentTime}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Appointment type:</span>{" "}
                    <span className="text-orange-600 font-medium">
                      {project.appointmentType}
                    </span>
                  </p>
                </div>

                {project.additionalNotes && (
                  <div className="pt-2 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Additional Notes
                    </h4>
                    <p className="text-sm text-gray-600">{project.additionalNotes}</p>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Status Progress
                    </span>
                    <span className="text-sm text-gray-600">
                      {getStatusLabel(selectedStatus || project.status)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-right">{progress}% Complete</p>
                </div>

                {/* Save Changes Button */}
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || isUpdating}
                  className={`w-full mt-4 border-2 cursor-pointer text-sm font-medium py-2 rounded-md flex items-center justify-center transition-all ${hasChanges && !isUpdating
                    ? "border-teal-700 bg-teal-700 text-white hover:bg-teal-800"
                    : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2Icon className="w-4 h-4 mr-2" />
                      {hasChanges ? "Save Changes" : "No Changes"}
                    </>
                  )}
                </button>

                {/* Mark as Complete Button */}
                {selectedStatus !== "COMPLETED" && (
                  <button
                    onClick={() => { navigate(`/dashboard/new-proposal/${project.id}`) }}
                    disabled={isUpdating}
                    className="w-full mt-2 border-2 border-blue-800 cursor-pointer bg-blue-800 text-white hover:bg-blue-900 text-sm font-medium py-2 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Make New Proposal
                  </button>
                )}

                {/* See Contract Button - Only show if there's an accepted proposal */}
                {project.proposals?.some(p => p.status === "ACCEPTED") && (
                  <button
                    onClick={() => {
                      const acceptedProposal = project.proposals?.find(p => p.status === "ACCEPTED");
                      if (acceptedProposal) {
                        setContractProposalId(acceptedProposal.id);
                        setIsContractModalOpen(true);
                      }
                    }}
                    className="w-full mt-2 border-2 border-amber-600 cursor-pointer bg-amber-600 text-white hover:bg-amber-700 text-sm font-medium py-2 rounded-md flex items-center justify-center transition-colors"
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    See Contract
                  </button>
                )}
              </div>
            </div>

            {/* Meeting Link Form - Only show for Video Consultation */}
            {project.appointmentType === "Video Consultation" && (
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <VideoIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Send Meeting Link
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Schedule and send a video consultation link to the client
                </p>

                <form onSubmit={handleSendMeetingLink} className="space-y-4">
                  {/* Meeting URL */}
                  <div>
                    <label htmlFor="meetingUrl" className="block text-sm font-semibold text-gray-900 mb-1">
                      Meeting URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="meetingUrl"
                      value={meetingForm.meetingUrl}
                      onChange={(e) => handleMeetingFormChange("meetingUrl", e.target.value)}
                      placeholder="https://meet.google.com/abc-def-ghi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSendingMeeting}
                    />
                  </div>

                  {/* Meeting Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-1">
                      Meeting Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={meetingForm.title}
                      onChange={(e) => handleMeetingFormChange("title", e.target.value)}
                      placeholder="Meeting for Architecture Design"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSendingMeeting}
                    />
                  </div>

                  {/* Scheduled At */}
                  <div>
                    <label htmlFor="scheduledAt" className="block text-sm font-semibold text-gray-900 mb-1">
                      Scheduled Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="scheduledAt"
                      value={meetingForm.scheduledAt}
                      onChange={(e) => handleMeetingFormChange("scheduledAt", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSendingMeeting}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-1">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      value={meetingForm.notes}
                      onChange={(e) => handleMeetingFormChange("notes", e.target.value)}
                      placeholder="Please have your project documents ready. We will discuss the timeline and budget."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      disabled={isSendingMeeting}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSendingMeeting}
                    className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-md flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingMeeting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon className="w-4 h-4 mr-2" />
                        Send Meeting Link
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Metadata */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(project.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-6 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          disabled={isUpdating}
        >
          ×
        </button>

        <ContractReviewModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          proposalId={contractProposalId}
        />
      </div>
    </div>
  );
}