import { ProjectRequest, useGetProposalInfoQuery } from "@/redux/api/adminDashboard/proposalApi";
import { useEffect, useRef, useState } from "react";
import {
  FileTextIcon,
  FolderKanban,
  Info,
  CalendarIcon,
  Loader2,
} from "lucide-react";

// Tab components
import ProjectInformationTab from "./tabs/ProjectInformationTab";
import ContractsTab from "./tabs/ContractsTab";
import ProjectMgmtTab from "./tabs/ProjectMgmtTab";
import MeetingRequestTab from "./tabs/MeetingRequestTab";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectRequest | null;
  readOnly?: boolean;
};

type ModalTab = "information" | "contracts" | "management" | "meeting";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Initial" },
  { value: "REVIEWED", label: "Inquiry" },
  { value: "SCHEDULED", label: "Bidding" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
] as const;

const getStatusLabel = (status: string) => {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
};

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  project: initialProject,
  readOnly,
}: ProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>("information");
  const user = useAppSelector(selectCurrentUser);

  // Fetch fresh project details including meeting links
  const { data: refreshedProject, isLoading } = useGetProposalInfoQuery(initialProject?.id as string, {
    skip: !isOpen || !initialProject?.id,
  });

  const project = refreshedProject || initialProject;
  const meetingLinks = project?.meetingLinks || [];

  // Reset tab when project changes
  useEffect(() => {
    if (initialProject) {
      setActiveTab("information");
    }
  }, [initialProject]);

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
      const isSelectDropdown =
        target.closest("[data-radix-select-content]") ||
        target.closest("[data-radix-popper-content-wrapper]");

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

  const allTabs = [
    {
      key: "information" as ModalTab,
      label: "Project Information",
      icon: <Info className="w-4 h-4" />,
    },
    {
      key: "meeting" as ModalTab,
      label: "Meeting Request",
      icon: <CalendarIcon className="w-4 h-4" />,
    },
    {
      key: "contracts" as ModalTab,
      label: "Contracts",
      icon: <FileTextIcon className="w-4 h-4" />,
    },
    {
      key: "management" as ModalTab,
      label: "Project Management",
      icon: <FolderKanban className="w-4 h-4" />,
    },
  ];

  const isStaff = user?.role === "DRAFTER" || user?.role === "EMPLOYEE";
  const tabs = isStaff ? allTabs.filter(t => t.key === "information" || t.key === "management") : allTabs;

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
      >
        {/* Header Section */}
        <div className="px-8 pt-4 pb-0 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {project.projectName}
                </h2>
                {isLoading && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full animate-pulse border border-blue-100">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Updating...</span>
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
                {project && project.meetingLinks && project.meetingLinks.filter(m => m.meetingUrl === "https://pending.request").length > 0 && (
                  <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg border border-amber-200 font-bold animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    NEW MEETING REQUEST
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                  Delete Inquiry
                </button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === "information" && (
            <ProjectInformationTab project={{ ...project, meetingLinks }} />
          )}
          {activeTab === "meeting" && (
            <MeetingRequestTab project={{ ...project, meetingLinks }} />
          )}
          {activeTab === "contracts" && (
            <ContractsTab project={{ ...project, meetingLinks }} />
          )}
          {activeTab === "management" && (
            <ProjectMgmtTab project={{ ...project, meetingLinks }} readOnly={readOnly} />
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
    </div>
  );
}