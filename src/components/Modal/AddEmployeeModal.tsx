import { useCreateStaffMutation } from "@/redux/api/userApi";
import { useState } from "react";

const AddEmployeeModal = ({ onClose }: { onClose: () => void }) => {
  const [createStaff, { isLoading }] = useCreateStaffMutation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStaff(form).unwrap();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center scroll-y-auto">
      <div className="bg-white p-6 rounded w-[400px]">
        <h3 className="text-lg font-semibold mb-4">Add Employee</h3>

        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            placeholder="Name"
            className="w-full border p-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Email"
            className="w-full border p-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            placeholder="Password"
            type="password"
            className="w-full border p-2"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <select
            className="w-full border p-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MEDIA_MANAGER">MEDIA_MANAGER</option>
            <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
          </select>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
