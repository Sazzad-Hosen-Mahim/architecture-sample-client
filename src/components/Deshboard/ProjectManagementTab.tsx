import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
import {
  ProjectRequest,
  useGetProjectRequestsQuery,
  useGetMyProjectRequestsQuery,
  useArchiveProjectMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import { getProjectProgress } from "@/utils/projectProgress";
import { useProjectDeepLink } from "@/hooks/useProjectDeepLink";
import ProjectDetailsModal from "./ProjectDetailesModal";
import { BsFillClipboard2PlusFill } from "react-icons/bs";
import { toast } from "sonner";
import {
  Archive,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PAGE_SIZE_OPTIONS = ["10", "25", "50", "all"] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function ProjectManagementTab() {
  const [activeTab, setActiveTab] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<PageSize>("10");
  const [selectedProject, setSelectedProject] = useState<ProjectRequest | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] =
    useState<ProjectRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const scrollAmount = 150;
      tabsContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const {
    data: allProjectsData,
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = useGetProjectRequestsQuery();
  const {
    data: myProjectsData,
    isLoading: isLoadingMy,
    isError: isErrorMy,
  } = useGetMyProjectRequestsQuery();
  const [archiveProject] = useArchiveProjectMutation();

  const data = assignedFilter === "assigned" ? myProjectsData : allProjectsData;
  const isLoading = assignedFilter === "assigned" ? isLoadingMy : isLoadingAll;
  const isError = assignedFilter === "assigned" ? isErrorMy : isErrorAll;

  // Memoize non-archived projects base data
  const nonArchivedProjects = useMemo(() => {
    return data?.data?.filter((p: ProjectRequest) => !p.isArchived) || [];
  }, [data]);

  // Search by project name, client name and location. Applied before the stage
  // split so the tab counts describe what the table is actually showing.
  const searchedProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return nonArchivedProjects;

    return nonArchivedProjects.filter((p: ProjectRequest) => {
      const clientName =
        `${p.clientFirstName || ""} ${p.clientLastName || ""}`.trim();
      const location = [p.projectCity, p.projectState, p.projectCountry]
        .filter(Boolean)
        .join(", ");

      return [p.projectName, p.companyName, clientName, location]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [nonArchivedProjects, searchTerm]);

  // Memoize filtered projects by stage
  const projectsByStage = useMemo(() => {
    const stages = ["all", "inquiry", "scheduled", "active", "completed"];
    const result: Record<string, ProjectRequest[]> = {};

    stages.forEach((stage) => {
      if (stage === "all") {
        result[stage] = searchedProjects;
      } else if (stage === "inquiry") {
        result[stage] = searchedProjects.filter(
          (p) =>
            p.status.toLowerCase() === "pending" ||
            p.status.toLowerCase() === "reviewed",
        );
      } else {
        result[stage] = searchedProjects.filter(
          (p) => p.status.toLowerCase() === stage,
        );
      }
    });
    return result;
  }, [searchedProjects]);

  // Any change to what's being listed puts you back on page one, otherwise you
  // can end up stranded on a page that no longer exists.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, assignedFilter, pageSize]);

  const handleArchive = useCallback(async () => {
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
  }, [projectToArchive, archiveProject]);

  const openModal = useCallback((project: ProjectRequest) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  }, []);

  // Notification deep links land here as ?project=&tab=
  const deepLink = useProjectDeepLink();
  useEffect(() => {
    if (!deepLink.projectId || isLoading) return;
    const match = nonArchivedProjects.find((p) => p.id === deepLink.projectId);
    if (match) {
      setSelectedProject(match);
      setIsModalOpen(true);
    } else {
      toast.error("That project is no longer available.");
    }
    // Deliberately not cleared here — the modal still needs the tab this render.
  }, [deepLink, isLoading, nonArchivedProjects]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProject(null);
    // Drop the deep link so the next project opens on its default tab.
    deepLink.clear();
  }, [deepLink]);

  // Helper functions
  // In-person requests carry no appointment date — the studio arranges those
  // after review — so an absent value is normal, not an error.
  const formatDate = useCallback((dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getStageBadgeClass = useCallback((status: string) => {
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
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case "PENDING":
        return "Inquiry";
      case "REVIEWED":
        return "Inquiry";
      case "SCHEDULED":
        return "Bidding";
      case "ACTIVE":
        return "Active";
      case "COMPLETED":
        return "Completed";
      default:
        return status;
    }
  }, []);

  const getProgress = useCallback((project: ProjectRequest) => {
    const stages = project.stages || [];
    const completedPhaseCount = stages.filter(
      (s) => s.status === "COMPLETED",
    ).length;
    return getProjectProgress(
      project.status,
      completedPhaseCount,
      stages.length,
    );
  }, []);

  const renderProjectTable = (filteredProjects: ProjectRequest[]) => {
    // "all" collapses to a single page holding everything.
    const perPage =
      pageSize === "all"
        ? Math.max(filteredProjects.length, 1)
        : Number(pageSize);
    const totalPages = Math.max(
      1,
      Math.ceil(filteredProjects.length / perPage),
    );
    // Guards against a stale page number when the list shrinks under us.
    const safePage = Math.min(currentPage, totalPages);
    const paginatedProjects = filteredProjects.slice(
      (safePage - 1) * perPage,
      safePage * perPage,
    );

    return (
      <div className="rounded-lg border bg-card border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 px-3 border border-gray-300 rounded-lg bg-white">
            <Search className="text-gray-500 shrink-0" size={14} />
            <input
              type="text"
              placeholder="Search by project name, client or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none py-2 bg-transparent text-sm text-gray-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center justify-start lg:justify-end gap-2 shrink-0">
            <span className="text-xs font-medium text-gray-500">Filter:</span>
            <Select
              value={assignedFilter}
              onValueChange={(val) => {
                setAssignedFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                <SelectValue placeholder="Filter projects" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="assigned">Assigned Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading projects...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Error loading projects. Please try again.
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm
              ? `No projects match "${searchTerm}".`
              : "No projects found."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold text-gray-600">
                      Project
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 hidden md:table-cell">
                      Location
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">
                      Service Type
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 hidden md:table-cell">
                      Client
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 hidden md:table-cell">
                      Assigned Manager
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 hidden md:table-cell">
                      Initial Appointment Date
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 hidden md:table-cell">
                      Start Date
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 hidden md:table-cell">
                      End Date
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600 hidden md:table-cell">
                      Progress
                    </TableHead>
                    <TableHead className="text-xs font-bold text-gray-600">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      <TableCell className="whitespace-pre-wrap">
                        <div>
                          <div className="text-xs font-semibold">
                            {project.projectName}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {project.companyName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        {project.projectCity}, {project.projectState}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">
                            {(project.serviceType || "").replace(/_/g, " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        {project.clientFirstName} {project.clientLastName}
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        {project.assignedManager?.name || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        {formatDate(project.appointmentDate)}
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        {project.projectStartedAt
                          ? formatDate(project.projectStartedAt)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        {project.projectCompletedAt
                          ? formatDate(project.projectCompletedAt)
                          : "T.B.D."}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStageBadgeClass(project.status)}
                        >
                          {getStatusLabel(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${getProgress(project)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {getProgress(project)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
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
            </div>

            {/* Pagination UI */}
            <div className="p-4 border-t border-gray-300 flex flex-col sm:flex-row justify-between items-center gap-2 bg-gray-50/50">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Page {safePage} of {totalPages} ({filteredProjects.length} total)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Show:</span>
                <Select
                  value={pageSize}
                  onValueChange={(val) => setPageSize(val as PageSize)}
                >
                  <SelectTrigger className="w-[90px] h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === "all" ? "All" : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                  className="h-8 w-8 p-0 cursor-pointer"
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
          initialTab={deepLink.tab as any}
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
                Are you sure you want to archive{" "}
                <strong>{projectToArchive?.projectName}</strong>? It will be
                moved to the <strong>Archived Projects</strong> page under
                Financials → Accountant's Control.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="cursor-pointer hover:bg-gray-300 hover:border-gray-300 hover:text-gray-900"
                onClick={() => setArchiveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="bg-amber-600 hover:bg-amber-700 cursor-pointer text-white"
                onClick={handleArchive}
              >
                Confirm Archive
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="p-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-gray-100 py-1 px-2 rounded-xl">
          <div className="relative flex items-center w-full flex-1 min-w-0">
            {/* Left Scroll Indicator Button */}
            <button
              onClick={() => scrollTabs("left")}
              className="absolute -left-2 lg:left-0 z-10 p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-black rounded-full border border-gray-200 shadow-sm cursor-pointer active:scale-95 transition-all md:hidden"
              aria-label="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>

            <div
              ref={tabsContainerRef}
              className="flex-1 overflow-x-auto scrollbar-hide w-full px-6 mr-3 md:mr-0 md:px-0"
            >
              <TabsList className="flex items-center justify-start gap-1 md:gap-2 w-full bg-transparent border-none">
                <TabsTrigger
                  value="all"
                  className={`flex-shrink-0 font-medium text-xs md:text-sm border-b-2 whitespace-nowrap px-3 md:px-4 py-2.5 cursor-pointer transition-all ${
                    activeTab === "all"
                      ? "border-b-gray-800 text-gray-900 font-bold"
                      : "border-b-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  All ({projectsByStage["all"]?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="inquiry"
                  className={`flex-shrink-0 font-medium text-xs md:text-sm border-b-2 whitespace-nowrap px-3 md:px-4 py-2.5 cursor-pointer transition-all ${
                    activeTab === "inquiry"
                      ? "border-b-gray-800 text-gray-900 font-bold"
                      : "border-b-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Inquiry ({projectsByStage["inquiry"]?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className={`flex-shrink-0 font-medium text-xs md:text-sm border-b-2 whitespace-nowrap px-3 md:px-4 py-2.5 cursor-pointer transition-all ${
                    activeTab === "scheduled"
                      ? "border-b-gray-800 text-gray-900 font-bold"
                      : "border-b-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Bidding ({projectsByStage["scheduled"]?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className={`flex-shrink-0 font-medium text-xs md:text-sm border-b-2 whitespace-nowrap px-3 md:px-4 py-2.5 cursor-pointer transition-all ${
                    activeTab === "active"
                      ? "border-b-gray-800 text-gray-900 font-bold"
                      : "border-b-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Active ({projectsByStage["active"]?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className={`flex-shrink-0 font-medium text-xs md:text-sm border-b-2 whitespace-nowrap px-3 md:px-4 py-2.5 cursor-pointer transition-all ${
                    activeTab === "completed"
                      ? "border-b-gray-800 text-gray-900 font-bold"
                      : "border-b-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Completed ({projectsByStage["completed"]?.length || 0})
                </TabsTrigger>
                {/* Spacer to prevent scroll layout overlap with absolute right chevron on mobile */}
                <div className="w-16 shrink-0 md:hidden" />
              </TabsList>
            </div>

            {/* Right Scroll Indicator Button */}
            <button
              onClick={() => scrollTabs("right")}
              className="absolute -right-2 lg:right-0 z-10 p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-black rounded-full border border-gray-200 shadow-sm cursor-pointer active:scale-95 transition-all md:hidden"
              aria-label="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <Button
            onClick={() => navigate("/dashboard/new-inquiries")}
            className="bg-black cursor-pointer text-white hover:bg-gray-800 shrink-0 font-medium rounded-lg"
          >
            <span className="text-white">
              <BsFillClipboard2PlusFill />
            </span>{" "}
            New Inquiry
          </Button>
        </div>

        <TabsContent value="all">
          {renderProjectTable(projectsByStage["all"] || [])}
        </TabsContent>
        <TabsContent value="inquiry">
          {renderProjectTable(projectsByStage["inquiry"] || [])}
        </TabsContent>
        <TabsContent value="scheduled">
          {renderProjectTable(projectsByStage["scheduled"] || [])}
        </TabsContent>
        <TabsContent value="active">
          {renderProjectTable(projectsByStage["active"] || [])}
        </TabsContent>
        <TabsContent value="completed">
          {renderProjectTable(projectsByStage["completed"] || [])}
        </TabsContent>
      </Tabs>
    </div>
  );
}
