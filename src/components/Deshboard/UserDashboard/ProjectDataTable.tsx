import { useGetMyProjectRequestsQuery } from "@/redux/api/adminDashboard/proposalApi";
import {
  Loader2,
  // ExternalLink,
  CheckCircle2,
  Clock,
  LayoutList,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ClientProjectDetailsModal from "./ClientProjectDetailsModal";
import { Button } from "@/components/ui/button";
import { getProjectProgress } from "@/utils/projectProgress";
import { useProjectDeepLink } from "@/hooks/useProjectDeepLink";
import { toast } from "sonner";

interface ProjectDataTableProps {
  searchQuery?: string;
}

const ProjectDataTable = ({ searchQuery = "" }: ProjectDataTableProps) => {
  const { data: response, isLoading } = useGetMyProjectRequestsQuery();

  const projects = useMemo(() => response?.data || [], [response]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Notification deep links land here as ?project=&tab=&proposal=
  const deepLink = useProjectDeepLink();
  useEffect(() => {
    if (!deepLink.projectId || isLoading) return;
    const match = projects.find((p: any) => p.id === deepLink.projectId);
    if (match) {
      setSelectedProject(match);
      setIsModalOpen(true);
    } else {
      toast.error("That project is no longer available.");
    }
    // Not cleared here — the modal still needs tab/proposal on this render.
  }, [deepLink, isLoading, projects]);

  const filteredProjects = projects.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.serviceType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 animate-pulse">Fetching your projects...</p>
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <LayoutList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No projects found</p>
        <p className="text-xs text-gray-400 mt-1">
          When you sign a contract, your projects will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* `table-fixed` plus fractional widths keeps every visible column the
          same width. The fractions step with the breakpoints so they always add
          up to a whole: 3 columns on a phone, 4 from sm, 5 from md, 6 from lg —
          matching exactly which columns are revealed below. */}
      <table className="w-full table-fixed text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
          <tr>
            <th className="w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-3 sm:px-4 py-4 text-left font-semibold">
              Project Name
            </th>
            <th className="hidden md:table-cell md:w-1/5 lg:w-1/6 px-3 sm:px-4 py-4 text-center font-semibold">
              Service
            </th>
            <th className="hidden sm:table-cell sm:w-1/4 md:w-1/5 lg:w-1/6 px-3 sm:px-4 py-4 text-center font-semibold">
              Overall Progress
            </th>
            <th className="hidden lg:table-cell lg:w-1/6 px-3 sm:px-4 py-4 text-center font-semibold">
              Latest Phase
            </th>
            {/* <th className="px-6 py-4 text-center font-semibold">Deliverables</th> */}
            {/* Status takes the middle slot on a phone (where Progress is hidden). */}
            <th className="w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-3 sm:px-4 py-4 text-center font-semibold">
              Status
            </th>
            <th className="w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-3 sm:px-4 py-4 text-center font-semibold">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {filteredProjects.map((project: any) => {
            const stages = project.stages || [];
            const completedStages = stages.filter(
              (s: any) => s.status === "COMPLETED",
            );
            const progress = getProjectProgress(
              project.status,
              completedStages.length,
              stages.length,
            );

            const currentStage =
              stages.find((s: any) => s.status !== "COMPLETED") ||
              stages[stages.length - 1];

            return (
              <tr
                key={project.id}
                className="hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-3 sm:px-4 py-4 align-middle">
                  <div className="font-semibold text-xs md:text-sm text-gray-900 break-words">
                    {project.projectName}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5 font-mono">
                    ID: {project.id.split("-")[0]}
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 sm:px-4 py-4 text-center align-middle">
                  <span className="inline-block max-w-full truncate px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                    {(project.serviceType || "").replace(/_/g, " ")}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-4 py-4 align-middle">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 shrink-0">
                      {progress}%
                    </span>
                  </div>
                </td>
                <td className="hidden lg:table-cell px-3 sm:px-4 py-4 align-middle">
                  {currentStage ? (
                    <div className="flex items-center justify-center gap-2 min-w-0">
                      {currentStage.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      )}
                      <span className="text-xs text-gray-600 font-medium truncate">
                        {currentStage.name}
                      </span>
                    </div>
                  ) : (
                    <span className="block text-center text-gray-300 italic text-xs">
                      Waiting for contract...
                    </span>
                  )}
                </td>
                <td className="px-3 sm:px-4 py-4 text-center align-middle">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-3 sm:px-4 py-4 text-center align-middle">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-blue-600 cursor-pointer hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedProject(project);
                      setIsModalOpen(true);
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4 mr-1 shrink-0" />
                    <span className="text-xs font-bold uppercase">Details</span>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedProject && (
        <ClientProjectDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
            // Drop the deep link so the next project opens normally.
            deepLink.clear();
          }}
          project={selectedProject}
          initialTab={deepLink.tab}
          initialProposalId={deepLink.proposalId}
        />
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; style: string }> = {
    ACTIVE: {
      label: "Active",
      style: "bg-green-100 text-green-700 border-green-200",
    },
    // PENDING and REVIEWED are the same "Inquiry" stage — show them identically.
    PENDING: {
      label: "Inquiry",
      style: "bg-blue-100 text-blue-700 border-blue-200",
    },
    COMPLETED: {
      label: "Completed",
      style: "bg-purple-100 text-purple-700 border-purple-200",
    },
    REVIEWED: {
      label: "Inquiry",
      style: "bg-blue-100 text-blue-700 border-blue-200",
    },
    SCHEDULED: {
      label: "Bidding",
      style: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
  };

  const config = configs[status] || {
    label: status,
    style: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.style} uppercase tracking-tight shadow-sm`}
    >
      {config.label}
    </span>
  );
};

export default ProjectDataTable;
