import { useGetMyProjectRequestsQuery } from "@/redux/api/adminDashboard/proposalApi";
import {
    Loader2,
    ExternalLink,
    CheckCircle2,
    Clock,
    LayoutList,
    MoreHorizontal
} from "lucide-react";
import { useState } from "react";
import ClientProjectDetailsModal from "./ClientProjectDetailsModal";
import { Button } from "@/components/ui/button";

interface ProjectDataTableProps {
    searchQuery?: string;
}

const ProjectDataTable = ({ searchQuery = "" }: ProjectDataTableProps) => {
    const { data: response, isLoading } = useGetMyProjectRequestsQuery();

    const projects = response?.data || [];
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredProjects = projects.filter((project) =>
        project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
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
                <p className="text-xs text-gray-400 mt-1">When you sign a contract, your projects will appear here.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                        <th className="px-6 py-4 text-left font-semibold">Project Name</th>
                        <th className="px-6 py-4 text-left font-semibold">Service</th>
                        <th className="px-6 py-4 text-left font-semibold">Overall Progress</th>
                        <th className="px-6 py-4 text-left font-semibold">Latest Phase</th>
                        <th className="px-6 py-4 text-center font-semibold">Deliverables</th>
                        <th className="px-6 py-4 text-center font-semibold">Status</th>
                        <th className="px-6 py-4 text-right font-semibold">Action</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                    {filteredProjects.map((project: any) => {
                        const stages = project.stages || [];
                        const completedStages = stages.filter((s: any) => s.status === "COMPLETED");
                        const progress = stages.length > 0
                            ? Math.round((completedStages.length / stages.length) * 100)
                            : 0;

                        // Get the first incomplete stage or the last completed one
                        const currentStage = stages.find((s: any) => s.status !== "COMPLETED") || stages[stages.length - 1];

                        return (
                            <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{project.projectName}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5 font-mono">
                                        ID: {project.id.split('-')[0]}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                                        {project.serviceType.replace(/_/g, " ")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 min-w-[140px]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-gray-600 w-8">{progress}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {currentStage ? (
                                        <div className="flex items-center gap-2">
                                            {currentStage.status === "COMPLETED" ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                            ) : (
                                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                            )}
                                            <span className="text-xs text-gray-600 font-medium truncate max-w-[120px]">
                                                {currentStage.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 italic text-xs">Waiting for contract...</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {/* Find any stage that has a drive link */}
                                    {stages.some((s: any) => s.driveLink) ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <a
                                                href={stages.find((s: any) => s.driveLink)?.driveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                DRIVE FOLDER
                                            </a>
                                            {stages.filter((s: any) => s.driveLink).length > 1 && (
                                                <span className="text-[9px] text-gray-400 font-medium">
                                                    +{stages.filter((s: any) => s.driveLink).length - 1} more links in details
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-400 italic">No files yet</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={project.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => {
                                            setSelectedProject(project);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <MoreHorizontal className="w-4 h-4 mr-1" />
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
                    }}
                    project={selectedProject}
                />
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, string> = {
        ACTIVE: "bg-green-100 text-green-700 border-green-200",
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
        REVIEWED: "bg-purple-100 text-purple-700 border-purple-200",
        SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
    };

    const style = configs[status] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${style} uppercase tracking-tight`}>
            {status}
        </span>
    );
};

export default ProjectDataTable;