import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProjectDetailesModal from "./ProjectDetailesModal";
import { useNavigate } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  code: string;
  location: string;
  projectType: string;
  client: string;
  consultationDate: string;
  stage: string;
  progress: number;
  progressText: string;
  action: string;
};

const projects: Project[] = [
  {
    id: "1",
    name: "Mountain View Residence",
    code: "INQ-2023-001",
    location: "Sarah & Mark Johnson",
    projectType: "Not Assigned",
    client: "Tom", // Updated to individual client name
    consultationDate: "Initial Contact",
    stage: "Inquiry",
    progress: 25,
    progressText: "1/4",
    action: "dcfc",
  },
  {
    id: "2",
    name: "Downtown Boutique Hotel",
    code: "INQ-2023-002",
    location: "Urban Hospitality Group",
    projectType: "Not Assigned",
    client: "Shaikot", // Updated to individual client name
    consultationDate: "Site Visit Scheduled",
    stage: "Inquiry",
    progress: 50,
    progressText: "2/4",
    action: "dcfc",
  },
  {
    id: "3",
    name: "Lakeside Restaurant",
    code: "INQ-2023-003",
    location: "Fresh Bites, LLC",
    projectType: "Not Assigned",
    client: "Piuw", // Updated to individual client name
    consultationDate: "Requirements Gathering",
    stage: "Inquiry",
    progress: 75,
    progressText: "3/4",
    action: "dcfc",
  },
  {
    id: "4",
    name: "Tech Innovation Campus",
    code: "BID-2023-001",
    location: "FutureTech Ventures",
    projectType: "Elena Rodriguez",
    client: "Tom", // Updated to individual client name
    consultationDate: "Proposal Development",
    stage: "Bidding",
    progress: 33,
    progressText: "2/4",
    action: "dcfc",
  },
  {
    id: "5",
    name: "Oceanfront Condominiums",
    code: "BID-2023-002",
    location: "Coastal Development Corp",
    projectType: "Not Assigned",
    client: "Shaikot", // Updated to individual client name
    consultationDate: "Cost Estimation",
    stage: "Bidding",
    progress: 50,
    progressText: "3/4",
    action: "dcfc",
  },
  {
    id: "6",
    name: "University Research Facility",
    code: "BID-2023-003",
    location: "State University Foundation",
    projectType: "David Chen",
    client: "Piuw", // Updated to individual client name
    consultationDate: "Final Proposal",
    stage: "Bidding",
    progress: 83,
    progressText: "4/4",
    action: "dcfc",
  },
  {
    id: "7",
    name: "City Center Mixed-Use Development",
    code: "PRJ-2023-001",
    location: "Metropolitan Builders",
    projectType: "Michael Johnson",
    client: "Tom", // Updated to individual client name
    consultationDate: "Schematic Design",
    stage: "Active",
    progress: 24,
    progressText: "3/4",
    action: "dcfc",
  },
  {
    id: "8",
    name: "Green Valley Elementary School",
    code: "PRJ-2023-002",
    location: "Green Valley School District",
    projectType: "Samantha Lee",
    client: "Shaikot", // Updated to individual client name
    consultationDate: "Design Development",
    stage: "Active",
    progress: 42,
    progressText: "4/4",
    action: "dcfc",
  },
  {
    id: "9",
    name: "Riverside Office Complex",
    code: "CMP-2022-015",
    location: "Corporate Realty Partners",
    projectType: "Jennifer Martinez",
    client: "Piuw", // Updated to individual client name
    consultationDate: "Project Handover",
    stage: "Completed",
    progress: 100,
    progressText: "3/4",
    action: "dcfc",
  },
  {
    id: "10",
    name: "Heritage Museum Renovation",
    code: "CMP-2022-018",
    location: "City Cultural Foundation",
    projectType: "Robert Kim",
    client: "Tom", // Updated to individual client name
    consultationDate: "Final Inspection",
    stage: "Completed",
    progress: 100,
    progressText: "4/4",
    action: "dcfc",
  },
  {
    id: "11",
    name: "Sunset Plaza Shopping Center",
    code: "CMP-2023-004",
    location: "Retail Development Group",
    projectType: "Amanda Foster",
    client: "Shaikot", // Updated to individual client name
    consultationDate: "Certificate of Occupancy",
    stage: "Completed",
    progress: 100,
    progressText: "4/4",
    action: "dcfc",
  },
  {
    id: "12",
    name: "Parkside Medical Center",
    code: "CMP-2023-007",
    location: "Healthcare Properties Inc",
    projectType: "Dr. James Wilson",
    client: "Piuw", // Updated to individual client name
    consultationDate: "Project Closeout",
    stage: "Completed",
    progress: 100,
    progressText: "4/4",
    action: "dcfc",
  },
  {
    id: "13",
    name: "Maple Street Apartments",
    code: "CMP-2023-009",
    location: "Urban Living Developers",
    projectType: "Lisa Thompson",
    client: "Tom", // Updated to individual client name
    consultationDate: "Final Walkthrough",
    stage: "Completed",
    progress: 100,
    progressText: "4/4",
    action: "dcfc",
  },
];

// No imports or project data changed
export function ProjectManagementTab() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const openModal = (project: any) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };
  const getFilteredProjects = (stage: string) => {
    if (stage === "all") return projects;
    return projects.filter(
      (p) => p.stage.toLowerCase() === stage.toLowerCase()
    );
  };

  const getStageCount = (stage: string) => {
    if (stage === "all") return projects.length;
    return projects.filter((p) => p.stage.toLowerCase() === stage.toLowerCase())
      .length;
  };

  const renderProjectTable = (filteredProjects: Project[]) => (
    <div className="rounded-lg border bg-card border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Project Workflow: Projects progress through stages from Inquiry to
          Completed. Once a contract is signed, the scope of services is locked
          and the project moves to Active stage.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className=" text-xs font-bold text-gray-600">
              Project
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-600">
              Project location
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-600">
              Project Type
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-600">
              Client
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-600">
              Consultation Date
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-600">
              Stage
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-600">
              Progress
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-600">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.map((project) => (
            <TableRow
              key={project.id}
              className="hover:bg-gray-100 cursor-pointer"
            >
              <TableCell>
                <div>
                  <div className="text-xs font-semibold">{project.name}</div>
                  <div className="text-xs  text-gray-400">{project.code}</div>
                </div>
              </TableCell>
              <TableCell className="text-xs">{project.location}</TableCell>
              <TableCell>
                {project.projectType === "Not Assigned" ? (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 border-amber-400 rounded-full hover:bg-yellow-100  text-xs"
                  >
                    {project.projectType}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">👤</span>
                    <span className="text-xs">{project.projectType}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-xs ">{project.client}</TableCell>
              <TableCell className="text-xs">
                {project.consultationDate}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    project.stage === "Inquiry"
                      ? "bg-yellow-100 text-yellow-800 border-amber-300 rounded-full hover:bg-yellow-100 font-medium text-xs"
                      : project.stage === "Bidding"
                      ? "bg-blue-100 text-blue-800 border-blue-400 rounded-full hover:bg-blue-100 font-medium text-xs"
                      : project.stage === "Active"
                      ? "bg-green-100 text-green-800 border-green-400 rounded-full hover:bg-green-100 font-medium text-xs"
                      : "bg-purple-100 text-purple-800 border-purple-300 rounded-full hover:bg-purple-100 font-medium text-xs"
                  }
                >
                  {project.stage}
                </Badge>
              </TableCell>
              {/* <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={project.progress} className="w-20 " />
                  <span className="text-sm text-muted-foreground font-medium">
                    {project.progressText}
                  </span>
                </div>
              </TableCell> */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-text-xs ">{project.progressText}</span>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  className=" bg-transparent text-xs hover:bg-gray-800 hover:text-white cursor-pointer"
                  onClick={() => openModal(project)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* project detailes modal  */}
      <ProjectDetailesModal
        isOpen={isModalOpen}
        onClose={closeModal}
        project={selectedProject}
      />
    </div>
  );

  return (
    <div className=" p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full ">
        <div className="flex items-center justify-between gap-4 mb-6 bg-gray-100 py-0.5  overflow-x-auto sm:overflow-x-visible ">
          <TabsList className="flex-1 cursor-pointer">
            <TabsTrigger
              value="all"
              className={`flex-1 font-medium border-b-2 ${
                activeTab === "all"
                  ? "border-b-gray-800 py-4 cursor-pointer"
                  : "border-b-transparent"
              }`}
            >
              All ({getStageCount("all")})
            </TabsTrigger>
            <TabsTrigger
              value="inquiry"
              className={`flex-1 font-medium border-b-2 ${
                activeTab === "inquiry"
                  ? "border-b-gray-800 py-4 cursor-pointer"
                  : "border-b-transparent"
              }`}
            >
              Inquiry ({getStageCount("inquiry")})
            </TabsTrigger>
            <TabsTrigger
              value="bidding"
              className={`flex-1 font-medium border-b-2 ${
                activeTab === "bidding"
                  ? "border-b-gray-800 py-4 cursor-pointer"
                  : "border-b-transparent"
              }`}
            >
              Bidding ({getStageCount("bidding")})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className={`flex-1 font-medium border-b-2 ${
                activeTab === "active"
                  ? "border-b-gray-800 py-4 cursor-pointer"
                  : "border-b-transparent"
              }`}
            >
              Active ({getStageCount("active")})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className={`flex-1 font-medium border-b-2 ${
                activeTab === "completed"
                  ? "border-b-gray-800 py-4 cursor-pointer"
                  : "border-b-transparent"
              }`}
            >
              Completed ({getStageCount("completed")})
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={() => navigate("/dashboard/new-proposal")}
            className="bg-black text-white hover:bg-black/90 shrink-0 font-medium"
          >
            ✨ New Proposal
          </Button>
        </div>

        <TabsContent value="all">
          {renderProjectTable(getFilteredProjects("all"))}
        </TabsContent>
        <TabsContent value="inquiry">
          {renderProjectTable(getFilteredProjects("inquiry"))}
        </TabsContent>
        <TabsContent value="bidding">
          {renderProjectTable(getFilteredProjects("bidding"))}
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
