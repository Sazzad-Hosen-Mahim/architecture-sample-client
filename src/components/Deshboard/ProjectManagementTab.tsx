import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ProjectRequest, useGetProjectRequestsQuery, useGetMyProjectRequestsQuery, useArchiveProjectMutation } from "@/redux/api/adminDashboard/proposalApi";
import ProjectDetailsModal from "./ProjectDetailesModal";
import { BsFillClipboard2PlusFill } from "react-icons/bs";
import { toast } from "sonner";
import { Archive, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PROJECTS_PER_PAGE = 10;

export function ProjectManagementTab() {
  const [activeTab, setActiveTab] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<ProjectRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<ProjectRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Fetch ALL project requests (for "All Projects" filter)
  const { data: allProjectsData, isLoading: isLoadingAll, isError: isErrorAll } = useGetProjectRequestsQuery();
  // Fetch only assigned project requests (for "Assigned Projects" filter)
  const { data: myProjectsData, isLoading: isLoadingMy, isError: isErrorMy } = useGetMyProjectRequestsQuery();
  const [archiveProject] = useArchiveProjectMutation();

  // Select the correct data source based on filter
  const data = assignedFilter === "assigned" ? myProjectsData : allProjectsData;
  const isLoading = assignedFilter === "assigned" ? isLoadingMy : isLoadingAll;
  const isError = assignedFilter === "assigned" ? isErrorMy : isErrorAll;

  const handleArchive = async () => {
    if (!projectToArchive) return;
    try {
      await archiveProject(projectToArchive.id).unwrap();
      toast.success("Project archived successfully");
      setArchiveModalOpen(false);
      setProjectToArchive(null);
    } catch (error) {
      console.error("Failed to archive project:", error);
      toast.error("Failed to archive project");
    }
  };

  const openModal = (project: ProjectRequest) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get stage badge color
  const getStageBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-amber-300 rounded-full hover:bg-yellow-100 font-medium text-xs";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800 border-blue-400 rounded-full hover:bg-blue-100 font-medium text-xs";
      case "SCHEDULED":
        return "bg-green-100 text-green-800 border-green-400 rounded-full hover:bg-green-100 font-medium text-xs";
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-400 rounded-full hover:bg-green-100 font-medium text-xs";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 border-purple-300 rounded-full hover:bg-purple-100 font-medium text-xs";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 rounded-full hover:bg-gray-100 font-medium text-xs";
    }
  };

  // Helper function to map API status to user-friendly labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Initial";
      case "REVIEWED": return "Inquiry";
      case "SCHEDULED": return "Bidding";
      case "ACTIVE": return "Active";
      case "COMPLETED": return "Completed";
      default: return status;
    }
  };

  // Helper function to calculate progress based on status
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

  const getFilteredProjects = (stage: string) => {
    if (!data?.data) return [];

    let filtered = data.data.filter((p: ProjectRequest) => !p.isArchived);

    if (stage === "all") return filtered;

    // Inquiry tab shows both PENDING and REVIEWED
    if (stage === "inquiry") {
      return filtered.filter(
        (p: ProjectRequest) => (p.status.toLowerCase() === "pending" || p.status.toLowerCase() === "reviewed")
      );
    }

    return filtered.filter(
      (p: ProjectRequest) => p.status.toLowerCase() === stage.toLowerCase()
    );
  };

  const getStageCount = (stage: string) => {
    if (!data?.data) return 0;
    const nonArchived = data.data.filter((p: ProjectRequest) => !p.isArchived);
    if (stage === "all") return nonArchived.length;
    // Inquiry tab shows both PENDING and REVIEWED
    if (stage === "inquiry") {
      return nonArchived.filter(
        (p) => p.status.toLowerCase() === "pending" || p.status.toLowerCase() === "reviewed"
      ).length;
    }
    return nonArchived.filter((p) => p.status.toLowerCase() === stage.toLowerCase()).length;
  };

  const renderProjectTable = (filteredProjects: ProjectRequest[]) => {
    const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    const paginatedProjects = filteredProjects.slice(
      (currentPage - 1) * PROJECTS_PER_PAGE,
      currentPage * PROJECTS_PER_PAGE
    );

    return (
      <div className="rounded-lg border bg-card border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Project Workflow: Projects progress through stages from Pending to Completed.
            Once a consultation is scheduled, the project moves to Scheduled stage.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Filter:</span>
            <Select value={assignedFilter} onValueChange={(val) => { setAssignedFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                <SelectValue placeholder="Filter projects" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="assigned">Assigned Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading projects...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading projects. Please try again.</div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No projects found.</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold text-gray-600">Project</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Location</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Service Type</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Client</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Assigned Manager</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Appointment Date</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Status</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Progress</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <TableCell>
                      <div>
                        <div className="text-xs font-semibold">{project.projectName}</div>
                        <div className="text-xs text-gray-400">{project.companyName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {project.projectCity}, {project.projectState}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{(project.serviceType || "").replace(/_/g, ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {project.clientFirstName} {project.clientLastName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {project.assignedManager?.name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(project.appointmentDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getStageBadgeClass(project.status)}
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${getProgress(project.status)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{getProgress(project.status)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent text-xs hover:bg-gray-800 hover:text-white cursor-pointer"
                          onClick={() => openModal(project)}
                        >
                          View Details
                        </Button>
                        {project.status === "COMPLETED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent text-xs text-amber-600 border-amber-200 hover:bg-amber-600 hover:text-white cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToArchive(project);
                              setArchiveModalOpen(true);
                            }}
                            title="Archive Project"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination UI */}
            <div className="p-4 border-t flex justify-between items-center bg-gray-50/50">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Page {currentPage} of {totalPages} ({filteredProjects.length} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}

        <ProjectDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          project={selectedProject}
        />

        {/* Archive Confirmation Modal */}
        <Dialog open={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
          <DialogContent className="bg-white border-gray-300">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                Archive Project
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to archive <strong>{projectToArchive?.projectName}</strong>?
                It will be moved to the <strong>Archived Projects</strong> section in Settings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer hover:bg-gray-300 hover:border-gray-300 hover:text-gray-900" onClick={() => setArchiveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="default" className="bg-amber-600 hover:bg-amber-700 cursor-pointer text-white" onClick={handleArchive}>
                Confirm Archive
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 mb-6 bg-gray-100 py-0.5 overflow-x-auto sm:overflow-x-visible">
          <TabsList className="flex-1 cursor-pointer">
            <TabsTrigger
              value="all"
              className={`flex-1 font-medium border-b-2 ${activeTab === "all"
                ? "border-b-gray-800 py-4 cursor-pointer"
                : "border-b-transparent"
                }`}
            >
              All ({getStageCount("all")})
            </TabsTrigger>
            <TabsTrigger
              value="inquiry"
              className={`flex-1 font-medium border-b-2 ${activeTab === "inquiry"
                ? "border-b-gray-800 py-4 cursor-pointer"
                : "border-b-transparent"
                }`}
            >
              Inquiry ({getStageCount("inquiry")})
            </TabsTrigger>
            <TabsTrigger
              value="scheduled"
              className={`flex-1 font-medium border-b-2 ${activeTab === "scheduled"
                ? "border-b-gray-800 py-4 cursor-pointer"
                : "border-b-transparent"
                }`}
            >
              Bidding ({getStageCount("scheduled")})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className={`flex-1 font-medium border-b-2 ${activeTab === "active"
                ? "border-b-gray-800 py-4 cursor-pointer"
                : "border-b-transparent"
                }`}
            >
              Active ({getStageCount("active")})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className={`flex-1 font-medium border-b-2 ${activeTab === "completed"
                ? "border-b-gray-800 py-4 cursor-pointer"
                : "border-b-transparent"
                }`}
            >
              Completed ({getStageCount("completed")})
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={() => navigate("/dashboard/new-inquiries")}
            className="bg-black cursor-pointer text-white hover:bg-gray-800 shrink-0 font-medium"
          >
            <span className="text-white"><BsFillClipboard2PlusFill /></span> New Inquiry
          </Button>
        </div>

        <TabsContent value="all">
          {renderProjectTable(getFilteredProjects("all"))}
        </TabsContent>
        <TabsContent value="inquiry">
          {renderProjectTable(getFilteredProjects("inquiry"))}
        </TabsContent>
        <TabsContent value="scheduled">
          {renderProjectTable(getFilteredProjects("scheduled"))}
        </TabsContent>
        <TabsContent value="active">
          {renderProjectTable(getFilteredProjects("active"))}
        </TabsContent>
        <TabsContent value="completed">
          {renderProjectTable(getFilteredProjects("completed"))}
        </TabsContent>
      </Tabs>
    </div>
  );
}