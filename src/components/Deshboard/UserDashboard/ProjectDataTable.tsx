import { projects } from "@/lib/userProjectData";

interface ProjectDataTableProps {
    searchQuery?: string;
}

const ProjectDataTable = ({ searchQuery = "" }: ProjectDataTableProps) => {
    // Filter projects based on search query if provided
    const filteredProjects = searchQuery
        ? projects.filter(project =>
            Object.values(project).some(value =>
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : projects;

    if (filteredProjects.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No projects found
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-100 text-gray-700">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium">Client</th>
                        <th className="px-4 py-3 text-left font-medium">Company</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Phone</th>
                        <th className="px-4 py-3 text-left font-medium">Country</th>
                        <th className="px-4 py-3 text-left font-medium">Service Type</th>
                        <th className="px-4 py-3 text-left font-medium">Category</th>
                        <th className="px-4 py-3 text-left font-medium">Budget</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-center font-medium">Action</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-300">
                    {filteredProjects.map((project) => (
                        <tr
                            key={`${project.email}-${project.companyName}`}
                            className="hover:bg-gray-50 transition-colors duration-150"
                        >
                            <td className="px-4 py-3 font-medium">
                                {project.clientFirstName}
                            </td>
                            <td className="px-4 py-3">{project.companyName}</td>
                            <td className="px-4 py-3">{project.email}</td>
                            <td className="px-4 py-3">{project.phone}</td>
                            <td className="px-4 py-3">{project.country}</td>
                            <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-medium">
                                    {project.serviceType}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded bg-green-50 text-green-600 text-xs font-medium">
                                    {project.projectCategory}
                                </span>
                            </td>
                            <td className="px-4 py-3">{project.budgetRange}</td>
                            <td className="px-4 py-3">
                                <StatusBadge status={project.status} />
                            </td>
                            <td className="px-4 py-3 text-center">
                                <button className="text-blue-600 hover:text-blue-800 hover:underline mr-3 transition-colors">
                                    View
                                </button>
                                <button className="text-gray-600 hover:text-gray-800 hover:underline transition-colors">
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Helper component for status badges
const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
        active: { bg: "bg-green-100", text: "text-green-800" },
        pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
        completed: { bg: "bg-blue-100", text: "text-blue-800" },
        cancelled: { bg: "bg-red-100", text: "text-red-800" },
    };

    const config = statusConfig[status.toLowerCase()] || {
        bg: "bg-gray-100",
        text: "text-gray-800"
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
            {status}
        </span>
    );
};

export default ProjectDataTable;