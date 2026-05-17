"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { useGetActiveProjectsQuery } from "@/redux/api/financialApi";
import ProjectFinancialDetailsModal from "./ProjectFinancialDetailsModal";
import { Loader } from "@/components/ui/loader";

export default function ProjectFinancialTracking() {
  const { data: projects = [], isLoading } = useGetActiveProjectsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "IMPLEMENTED">("ALL");

  const filteredProjects = useMemo(() => {
    let result = projects;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p: any) =>
        p.projectName.toLowerCase().includes(query) ||
        p.clientName.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilter === "ACTIVE") {
      // Active: Projects that have stages but not all are completed
      result = result.filter((p: any) =>
        p.phases && p.phases.length > 0 && p.phases.some((ph: any) => ph.status !== "COMPLETED")
      );
    } else if (activeFilter === "IMPLEMENTED") {
      // Implemented: Projects where at least one stage is IN_PROGRESS or COMPLETED
      // (This distinguishes from projects that haven't started any work yet)
      result = result.filter((p: any) =>
        p.phases && p.phases.some((ph: any) => ph.status === "IN_PROGRESS" || ph.status === "COMPLETED")
      );
    }

    return result;
  }, [projects, searchQuery, activeFilter]);

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="px-3 sm:px-6 pb-12 font-semibold">
      {/* Project Financial Details Modal */}
      <ProjectFinancialDetailsModal
        open={!!selectedProjectId}
        onOpenChange={(open) => !open && setSelectedProjectId(null)}
        projectId={selectedProjectId || ""}
      />

      {/* Project Search Section */}
      <div className="flex flex-col gap-3 lg:flex-row items-center justify-between mb-8">
        <h1 className="text-sm font-bold hidden md:block text-gray-600">
          Project Financial Tracking
        </h1>
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === "ALL" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveFilter("ACTIVE")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === "ACTIVE" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Active Projects
          </button>
          <button
            onClick={() => setActiveFilter("IMPLEMENTED")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === "IMPLEMENTED" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Implemented
          </button>
        </div>
      </div>

      <div className="border p-4 sm:p-6 rounded-xl border-gray-200 py-6 sm:py-8 mb-8 bg-white shadow-sm">
        {/* Project Search */}
        <div className="mb-10">
          <h2 className="text-sm font-bold text-gray-900 mb-2">
            Project Search
          </h2>
          <p className="text-sm text-gray-500 mb-4 font-medium">
            Find {activeFilter === "ALL" ? "" : activeFilter.toLowerCase()} projects by name or client to review their financial status
          </p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent h-11"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${activeFilter === "ALL" ? "bg-blue-500" : activeFilter === "ACTIVE" ? "bg-green-500" : "bg-amber-500"}`}></span>
            {activeFilter === "ALL" ? "All" : activeFilter === "ACTIVE" ? "Active" : "Implemented"} Projects Summary
          </h2>
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Phase Running
                  </th>
                  <th className="px-6 py-4  text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5}>
                      <Loader fullScreen={false} size={8} />
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 font-medium">
                      No {activeFilter === "ALL" ? "" : activeFilter.toLowerCase()} projects found.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project: any) => {
                    const currentPhase = project.phases.find((ph: any) => ph.status === "IN_PROGRESS" || ph.status === "ACTIVE") || project.phases[0];
                    return (
                      <tr key={project.id} className="hover:bg-gray-50 bg-white transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">
                          {project.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">
                          {project.projectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 uppercase tracking-tighter font-black text-[10px]">
                            {currentPhase?.name || "Initializing"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="font-bold text-gray-900">
                            {currentPhase?.progress || 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-black hover:text-gray-600 font-bold flex items-center gap-1 ml-auto"
                            onClick={() => setSelectedProjectId(project.id)}
                          >
                            <Eye className="w-4 h-4 " />
                            View Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
