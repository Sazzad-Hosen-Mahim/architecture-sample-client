import AddEmployeeModal from "@/components/Modal/AddEmployeeModal";
import { useGetAllUsersQuery, useDeleteUserMutation } from "@/redux/api/userApi";
import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Employees = () => {
  const { data, isLoading } = useGetAllUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [open, setOpen] = useState(false);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await deleteUser(id).unwrap();
      toast.success("Employee deleted successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete employee");
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-md shadow font-semibold">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Employees & Staff</h2>
          <p className="text-sm text-gray-500 font-medium">{data?.length || 0} registered team members</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-bold transition-all"
        >
          + Add Team Member
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left font-bold text-gray-900">Name</th>
              <th className="p-4 text-left font-bold text-gray-900">Contact Info</th>
              <th className="p-4 text-left font-bold text-gray-900">Role</th>
              <th className="p-4 text-left font-bold text-gray-900">State</th>
              <th className="p-4 text-left font-bold text-gray-900">Compensation</th>
              <th className="p-4 text-left font-bold text-gray-900">Utilization</th>
              <th className="p-4 text-left font-bold text-gray-900 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {data?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                   <div className="font-bold text-gray-900">{user.name || "—"}</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase">{user.isActive ? "Active" : "Inactive"}</div>
                </td>
                <td className="p-4">
                   <div className="text-gray-700 font-medium">{user.email}</div>
                   <div className="text-xs text-gray-400 font-bold">{user.employeeProfile?.phone || "No phone"}</div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-bold">
                    {user.role?.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-4 text-gray-600 font-medium">{user.employeeProfile?.state || "—"}</td>
                <td className="p-4">
                   <div className="font-bold text-gray-900">
                      {user.employeeProfile?.salary 
                        ? `$${(Number(user.employeeProfile.salary)/1000).toFixed(1)}k/yr` 
                        : "—"}
                   </div>
                   <div className="text-xs text-green-600 font-bold">
                      {user.employeeProfile?.hourlyRate 
                        ? `$${Number(user.employeeProfile.hourlyRate).toFixed(2)}/hr` 
                        : "—"}
                   </div>
                </td>
                <td className="p-4">
                   <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                         <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{width: user.employeeProfile?.utilizationRate || '0%'}}
                         ></div>
                      </div>
                      <span className="text-xs font-bold text-blue-700">{user.employeeProfile?.utilizationRate || "—"}</span>
                   </div>
                </td>
                <td className="p-4 text-center">
                   <div className="flex justify-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-black transition-colors" title="Edit">
                         <Edit size={16} />
                      </button>
                      <button 
                         onClick={() => handleDelete(user.id, user.name)}
                         className="p-2 text-gray-400 hover:text-red-600 transition-colors" 
                         title="Delete"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500 font-medium italic">
                  No employees found in the directory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <AddEmployeeModal onClose={() => setOpen(false)} />}
    </div>
  );
};

export default Employees;
