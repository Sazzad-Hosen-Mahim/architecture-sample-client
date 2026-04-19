"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { useGetActiveProjectsQuery } from "@/redux/api/financialApi";
import ProjectFinancialDetailsModal from "./ProjectFinancialDetailsModal";

export default function ProjectFinancialTracking() {
  const { data: projects = [], isLoading } = useGetActiveProjectsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((p: any) =>
      p.projectName.toLowerCase().includes(query) ||
      p.clientName.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="px-6 pb-12 font-semibold">
      {/* Project Financial Details Modal */}
      <ProjectFinancialDetailsModal 
        open={!!selectedProjectId} 
        onOpenChange={(open) => !open && setSelectedProjectId(null)} 
        projectId={selectedProjectId || ""} 
      />

      {/* Project Search Section */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-sm font-bold text-gray-600">
          Project Financial Tracking
        </h1>
        <Button className="bg-black hover:bg-gray-800 text-white py-1">
          <Plus className="w-4 h-4 mr-2" />
          Add New Project
        </Button>
      </div>

      <div className=" border p-6 rounded-xl border-gray-200 py-8 mb-8 bg-white shadow-sm">
        {/* Project Search */}
        <div className="mb-10">
          <h2 className="text-sm font-bold text-gray-900 mb-2">
            Project Search
          </h2>
          <p className="text-sm text-gray-500 mb-4 font-medium">
            Find active projects by name or client to review their financial status
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
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Active Projects Summary
          </h2>
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-sm">
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
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 font-medium">
                      Loading projects...
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 font-medium">
                      No active projects found.
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
