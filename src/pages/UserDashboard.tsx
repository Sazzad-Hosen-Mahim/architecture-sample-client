import { projects } from "@/lib/userProjectData";

const UserDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Projects</h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Service Type</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Budget</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-300">
            {projects.map((project, index) => (
              <tr key={index} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium">
                  {project.clientFirstName}
                </td>
                <td className="px-4 py-3">{project.companyName}</td>
                <td className="px-4 py-3">{project.email}</td>
                <td className="px-4 py-3">{project.phone}</td>
                <td className="px-4 py-3">{project.country}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs">
                    {project.serviceType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-green-50 text-green-600 text-xs">
                    {project.projectCategory}
                  </span>
                </td>
                <td className="px-4 py-3">{project.budgetRange}</td>
                <td className="px-4 py-3">{project.status}</td>
                <td className="px-4 py-3 text-center">
                  <button className="text-blue-600 hover:underline mr-3">
                    View
                  </button>
                  <button className="text-gray-600 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserDashboard;
