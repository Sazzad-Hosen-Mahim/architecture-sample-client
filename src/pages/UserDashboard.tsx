"use client";

import { Suspense, lazy, useState, useCallback, useMemo } from "react";

// Lazy load tab components for code splitting
const ProjectDataTable = lazy(() => import("@/components/Deshboard/UserDashboard/ProjectDataTable"));
const ProposalsTab = lazy(() => import("@/components/Deshboard/UserDashboard/ProposalsTab"));
const MeetingsTab = lazy(() => import("@/components/Deshboard/UserDashboard/MeetingsTab"));

type TabType = "projects" | "proposals" | "meetings";

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>("projects");
  const [searchQuery, setSearchQuery] = useState("");

  // Memoize tab configuration
  const tabs = useMemo(() => [
    { id: "projects", label: "Projects", count: 12 },
    { id: "proposals", label: "Proposals", count: 5 },
    { id: "meetings", label: "Meetings", count: 0 },
  ], []);

  // Handle tab change
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
  }, []);

  // Debounced search handler (optional)
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Active tab component
  const ActiveTabComponent =
    activeTab === "projects" ? ProjectDataTable :
      activeTab === "proposals" ? ProposalsTab :
        MeetingsTab;

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your projects and proposals</p>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* stat cards  */}
      <div className="mt-8 mb-5 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Projects</div>
            <div className="text-2xl font-semibold mt-1">12</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Active Proposals</div>
            <div className="text-2xl font-semibold mt-1">5</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Completion Rate</div>
            <div className="text-2xl font-semibold mt-1">85%</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`
                px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-all duration-200
                ${activeTab === tab.id
                  ? "bg-white border-t border-l border-r border-gray-200 text-blue-600 -mb-px"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
            >
              {tab.label}
              <span className={`
                ml-2 px-1.5 py-0.5 text-xs rounded-full
                ${activeTab === tab.id
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600"
                }
              `}>
                {tab?.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content with Suspense for lazy loading */}
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <ActiveTabComponent searchQuery={searchQuery} />
      </Suspense>

      {/* Stats Footer */}

    </div>
  );
};

export default UserDashboard;