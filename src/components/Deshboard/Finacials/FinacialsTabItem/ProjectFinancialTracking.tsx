import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Plus, Search } from "lucide-react";
import { useState } from "react";

export default function ProjectFinancialTracking() {
  // Fake data

  const [searchQuery, setSearchQuery] = useState("");

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="px-6">
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

      <div className=" border p-4 rounded-xl border-gray-200 py-8 mb-8">
        {/* Header */}

        {/* Project Search */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-600 mb-2">
            Project Search
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Search for projects by name, number, client, or status
          </p>
          <Input placeholder="Search for projects..." className="w-full" />
        </div>

        {/* Active Projects */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">
            Active Projects from Studio
          </h2>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Project #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Phase
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No active projects found in the studio
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Completed Projects */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">
            Completed Projects from Studio
          </h2>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Project #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Final Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Completion Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No completed projects found in the studio
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Search Projects */}
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-4">
            Search Projects t
          </h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleClear}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Card className="col-span-1 md:col-span-3 border-gray-200">
          <CardHeader>
            <CardTitle>Top Performing Projects</CardTitle>
            <CardDescription>By profit margin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "City Center Tower",
                  client: "Metropolis Development",
                  margin: 32,
                  revenue: 450000,
                },
                {
                  name: "Riverside Residences",
                  client: "Waterfront Properties",
                  margin: 28,
                  revenue: 380000,
                },
                {
                  name: "Tech Campus Expansion",
                  client: "InnoTech Inc.",
                  margin: 25,
                  revenue: 520000,
                },
                {
                  name: "Harborview Hotel",
                  client: "Coastal Resorts",
                  margin: 23,
                  revenue: 290000,
                },
                {
                  name: "Downtown Revitalization",
                  client: "City of Oakridge",
                  margin: 21,
                  revenue: 410000,
                },
              ].map((project, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-medium">
                    {i + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {project.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.client}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {project.margin}% margin
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${project.revenue.toLocaleString()} revenue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
