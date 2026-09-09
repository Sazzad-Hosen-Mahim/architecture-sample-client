"use client";

import { Button } from "@/components/ui/button";
import { Suspense, lazy, useState, useCallback, useMemo } from "react";
import { BsFillClipboard2PlusFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import {
  useGetMyProjectRequestsQuery,
  useGetMyProposalsQuery,
} from "@/redux/api/adminDashboard/proposalApi";
import { getProjectProgress } from "@/utils/projectProgress";

// Lazy load tab components for code splitting
const ProjectDataTable = lazy(
  () => import("@/components/Deshboard/UserDashboard/ProjectDataTable"),
);

type TabType = "projects";

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>("projects");
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  // Stat cards read from the same data the Projects table renders, so the
  // numbers can never drift from the list underneath them.
  const { data: projectsResponse, isLoading: isLoadingProjects } =
    useGetMyProjectRequestsQuery();
  const { data: proposalsResponse, isLoading: isLoadingProposals } =
    useGetMyProposalsQuery();

  const stats = useMemo(() => {
    const projects: any[] = projectsResponse?.data || [];
    const proposals: any[] = proposalsResponse?.data || [];

    // "Active" = still awaiting the client's decision.
    const activeProposals = proposals.filter((p) =>
      ["SENT", "VIEWED"].includes(p?.status),
    ).length;

    const activeProjects = projects.filter((p) => p?.status === "ACTIVE");

    // Completion rate = average progress across the client's active projects.
    const completionRate = activeProjects.length
      ? Math.round(
          activeProjects.reduce((sum, project) => {
            const stages: any[] = project.stages || [];
            const completed = stages.filter(
              (s: any) => s.status === "COMPLETED",
            ).length;
            return (
              sum + getProjectProgress(project.status, completed, stages.length)
            );
          }, 0) / activeProjects.length,
        )
      : 0;

    return {
      totalProjects: projects.length,
      activeProposals,
      activeProjectCount: activeProjects.length,
      completionRate,
    };
  }, [projectsResponse, proposalsResponse]);

  const isLoadingStats = isLoadingProjects || isLoadingProposals;

  // Everything a client needs now lives inside a project's details modal.
  const tabs = useMemo(() => [{ id: "projects", label: "Projects" }], []);

  // Handle tab change
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
  }, []);

  // Search handler
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const ActiveTabComponent = ProjectDataTable;

  return (
    <div className="p-3 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your projects, meetings, and proposals
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* stat cards */}
      <div className="mt-2 mb-5 pt-3 border-t border-gray-200">
        {/* Three across even on a phone — stacking them pushed the project
            list below the fold on every visit. */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <div className="text-[11px] sm:text-sm text-blue-600 font-medium leading-tight">
              Total Projects
            </div>
            <div className="text-xl sm:text-2xl font-semibold mt-1">
              {isLoadingStats ? "—" : stats.totalProjects}
            </div>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <div className="text-[11px] sm:text-sm text-green-600 font-medium leading-tight">
              Active Proposals
            </div>
            <div className="text-xl sm:text-2xl font-semibold mt-1">
              {isLoadingStats ? "—" : stats.activeProposals}
            </div>
          </div>
          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
            <div className="text-[11px] sm:text-sm text-purple-600 font-medium leading-tight">
              Completion Rate
            </div>
            <div className="text-xl sm:text-2xl font-semibold mt-1">
              {isLoadingStats ? "—" : `${stats.completionRate}%`}
            </div>
            <div className="hidden sm:block text-xs text-purple-500 mt-0.5">
              {isLoadingStats
                ? " "
                : stats.activeProjectCount > 0
                  ? `Average across ${stats.activeProjectCount} active project${stats.activeProjectCount === 1 ? "" : "s"}`
                  : "No active projects yet"}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6 flex items-center justify-between">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`
                px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "bg-white border-t border-l border-r border-gray-200 text-blue-600 -mb-px"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* `backTo` asks the navbar for a way back to this dashboard, which
            /new-project has none of on its own — it is a main page, so Back is
            normally hidden there. Carried in the navigation state rather than
            set on the route, so the same page opened from the floating menu
            stays as it was. */}
        <Button
          onClick={() =>
            navigate("/new-project", {
              state: { backTo: "/user-dashboard", backLabel: "Back to dashboard" },
            })
          }
          className="bg-black cursor-pointer my-2 text-white hover:bg-gray-800 shrink-0 font-medium rounded-lg"
        >
          <span className="text-white">
            <BsFillClipboard2PlusFill />
          </span>{" "}
          New Project
        </Button>
      </div>

      {/* Tab Content with Suspense for lazy loading */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <ActiveTabComponent searchQuery={searchQuery} />
      </Suspense>

      {/* Stats Footer */}
    </div>
  );
};

export default UserDashboard;
