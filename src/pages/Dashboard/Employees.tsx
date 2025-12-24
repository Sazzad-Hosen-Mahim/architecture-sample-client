import AddEmployeeModal from "@/components/Modal/AddEmployeeModal";
import { useGetAllUsersQuery } from "@/redux/api/userApi";
import { useState } from "react";

const Employees = () => {
  const { data, isLoading } = useGetAllUsersQuery();
  const [open, setOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-md shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Employees</h2>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-black text-white rounded"
        >
          + Add Employee
        </button>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-left">Role</th>
            <th className="border p-2 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {data?.map((user) => (
            <tr key={user.id}>
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.role}</td>
              <td className="border p-2">
                {user.isActive ? "Active" : "Inactive"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && <AddEmployeeModal onClose={() => setOpen(false)} />}
    </div>
  );
};

export default Employees;
