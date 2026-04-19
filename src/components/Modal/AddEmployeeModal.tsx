import { useCreateStaffMutation } from "@/redux/api/userApi";
import { useUpdateEmployeeProfileMutation } from "@/redux/api/financialApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const TAX_TYPES = [
  { value: "FITWH", label: "FITWH (Federal Income Tax)" },
  { value: "MED", label: "MED (Medicare)" },
  { value: "SOC", label: "SOC (Social Security)" },
  { value: "CA", label: "CA (California State Tax)" },
  { value: "CASDI", label: "CASDI (CA Disability)" },
  { value: "OTHERS", label: "Others (Custom)" },
];

const AddEmployeeModal = ({ onClose }: { onClose: () => void }) => {
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateEmployeeProfileMutation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    state: "",
    startingDate: "",
    hourlyRate: "",
    salary: "",
    phone: "",
    address: "",
  });

  const [taxes, setTaxes] = useState([
    { taxType: "FITWH", percentage: "", customName: "" },
    { taxType: "MED", percentage: "", customName: "" },
    { taxType: "SOC", percentage: "", customName: "" },
    { taxType: "CA", percentage: "", customName: "" },
    { taxType: "CASDI", percentage: "", customName: "" },
  ]);

  // Task 4: Auto-calculate hourly rate from salary
  useEffect(() => {
    if (form.salary && !isNaN(Number(form.salary))) {
      const calculatedHourly = (Number(form.salary) / 2080).toFixed(2);
      setForm((prev) => ({ ...prev, hourlyRate: calculatedHourly }));
    } else {
      setForm((prev) => ({ ...prev, hourlyRate: "" }));
    }
  }, [form.salary]);

  const handleAddTax = () => {
    setTaxes([...taxes, { taxType: "OTHERS", percentage: "", customName: "" }]);
  };

  const handleRemoveTax = (index: number) => {
    setTaxes(taxes.filter((_, i) => i !== index));
  };

  const handleTaxChange = (index: number, field: string, value: string) => {
    const newTaxes = [...taxes];
    newTaxes[index] = { ...newTaxes[index], [field]: value };
    setTaxes(newTaxes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createStaff({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
        address: form.address || undefined,
      }).unwrap();

      const userId = result?.data?.user?.id;
      if (userId) {
        // Prepare taxes for submission
        const formattedTaxes = taxes
          .filter(t => t.percentage !== "")
          .map(t => ({
            taxType: t.taxType,
            percentage: Number(t.percentage),
            customName: t.taxType === "OTHERS" ? t.customName : undefined
          }));

        await updateProfile({
          userId,
          state: form.state || undefined,
          startingDate: form.startingDate || undefined,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
          salary: form.salary ? Number(form.salary) : undefined,
          taxes: formattedTaxes
        }).unwrap();
      }
      toast.success("Employee created successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create employee");
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white p-6 rounded-lg w-[580px] max-h-[95vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-5 border-b pb-4">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Add Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black p-1 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 font-semibold">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest border-l-4 border-black pl-2">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                <input
                  placeholder="Full Name"
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  placeholder="Email"
                  type="email"
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Role</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                  <option value="FINANCE">Finance Manager</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="MEDIA_MANAGER">Media Manager</option>
                  <option value="DRAFTER">Drafter</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Home Address</label>
              <input
                placeholder="123 Main St, City, State, ZIP"
                className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Initial Password</label>
                <input
                  placeholder="Min 8 characters"
                  type="password"
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Starting Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                  value={form.startingDate}
                  onChange={(e) => setForm({ ...form, startingDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest border-l-4 border-blue-500 pl-2">Financial & Compensation</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Base Salary (Annual $)</label>
                <input
                  type="number"
                  placeholder="e.g. 85000"
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hourly Rate ($/hr)</label>
                <div className="relative">
                  <input
                    type="number"
                    readOnly
                    placeholder="Auto-calculated"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm bg-blue-50/50 text-blue-700 font-bold outline-none cursor-not-allowed"
                    value={form.hourlyRate}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-500 font-bold">
                    Salary / 2080
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task 5: Dynamic Tax Section */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest border-l-4 border-orange-500 pl-2">Tax Configurations</h4>
              <button 
                type="button" 
                onClick={handleAddTax}
                className="text-[10px] font-black uppercase bg-black text-white px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1 transition-all"
              >
                <Plus size={12} /> Add Tax
              </button>
            </div>
            
            <div className="space-y-3">
              {taxes.map((tax, index) => (
                <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100 relative group">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Tax Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-black focus:border-black outline-none bg-white"
                      value={tax.taxType}
                      onChange={(e) => handleTaxChange(index, "taxType", e.target.value)}
                    >
                      {TAX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  {tax.taxType === "OTHERS" && (
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Custom Name</label>
                      <input
                        placeholder="e.g. Local Tax"
                        className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-black focus:border-black outline-none bg-white"
                        value={tax.customName}
                        onChange={(e) => handleTaxChange(index, "customName", e.target.value)}
                      />
                    </div>
                  )}

                  <div className="w-24">
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-black focus:border-black outline-none bg-white font-bold"
                      value={tax.percentage}
                      onChange={(e) => handleTaxChange(index, "percentage", e.target.value)}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleRemoveTax(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4 shadow-inner">
            <p className="text-[10px] text-blue-900 leading-relaxed font-bold uppercase tracking-wider text-center">
              Utilization rate is automatically computed via approved timecards.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white px-8 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 shadow-lg shadow-black/10 transition-all active:scale-95 flex items-center justify-center min-w-[160px]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                  Saving...
                </>
              ) : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
