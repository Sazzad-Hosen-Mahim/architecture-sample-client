import {
  useCreateStaffMutation,
  useUpdateUserMutation,
} from "@/redux/api/userApi";
import {
  CountrySelect,
  StateSelect,
} from "@/components/Common/LocationSelects";
import { useUpdateEmployeeProfileMutation } from "@/redux/api/financialApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, Eye, EyeOff } from "lucide-react";
import type { DashboardSection } from "@/utils/dashboardAccess";

/** The dashboard tabs an employee can be given, in the order they're shown. */
const SECTION_OPTIONS: { value: DashboardSection; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "media", label: "Media" },
  { value: "financials", label: "Financials" },
];

const TAX_TYPES = [
  { value: "FITWH", label: "FITWH (Federal Income Tax)" },
  { value: "MED", label: "MED (Medicare)" },
  { value: "SOC", label: "SOC (Social Security)" },
  { value: "ST", label: "ST (State Tax)" },
  { value: "SDI", label: "SDI (Disability)" },
  { value: "OTHERS", label: "Others (Custom)" },
];

interface AddEmployeeModalProps {
  onClose: () => void;
  /** Existing team member to edit. Omit to create a new one. */
  member?: any;
  /** When true the form renders as a read-only profile view. */
  readOnly?: boolean;
}

/**
 * Group a stored amount for display: "85000" -> "85,000", "21.63" -> "21.63".
 *
 * Only the whole-number part is grouped, and a trailing "." is preserved so a
 * decimal can still be typed. State keeps the raw value, so `Number()` at
 * submit is unaffected.
 */
const formatMoney = (value: string): string => {
  if (!value) return "";
  const [whole, ...rest] = String(value).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return rest.length ? `${grouped}.${rest.join("")}` : grouped;
};

const emptyForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  startingDate: "",
  hourlyRate: "",
  salary: "",
  phone: "",
  streetAddress: "",
  aptSuiteUnit: "",
  city: "",
  stateRegion: "",
  zipCode: "",
  country: "United States",
};

const AddEmployeeModal = ({
  onClose,
  member,
  readOnly = false,
}: AddEmployeeModalProps) => {
  const isEdit = !!member;
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateUser, { isLoading: isSavingUser }] = useUpdateUserMutation();
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateEmployeeProfileMutation();

  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  // Kept beside the form rather than inside it: it's a list, and only ever
  // read when the role is EMPLOYEE.
  const [sections, setSections] = useState<DashboardSection[]>([]);

  const toggleSection = (section: DashboardSection) =>
    setSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : // Kept in the canonical order so the saved value doesn't depend on
          // the order the boxes happened to be ticked in.
          SECTION_OPTIONS.map((o) => o.value).filter(
            (s) => s === section || prev.includes(s),
          ),
    );

  const [taxes, setTaxes] = useState([
    { taxType: "FITWH", percentage: "", customName: "", state: "" },
    { taxType: "MED", percentage: "", customName: "", state: "" },
    { taxType: "SOC", percentage: "", customName: "", state: "" },
    { taxType: "ST", percentage: "", customName: "", state: "" },
    { taxType: "SDI", percentage: "", customName: "", state: "" },
  ]);

  // Prefill from the selected member so the same form doubles as view/edit.
  useEffect(() => {
    if (!member) return;
    const profile = member.employeeProfile;
    setForm({
      name: member.name || "",
      username: member.username || "",
      email: member.email || "",
      password: "",
      role: member.role || "EMPLOYEE",
      startingDate: profile?.startingDate
        ? new Date(profile.startingDate).toISOString().split("T")[0]
        : "",
      hourlyRate: profile?.hourlyRate ? String(profile.hourlyRate) : "",
      salary: profile?.salary ? String(profile.salary) : "",
      phone: member.phoneNumber || profile?.phone || "",
      streetAddress: member.streetAddress || "",
      aptSuiteUnit: member.aptSuiteUnit || "",
      city: member.city || "",
      stateRegion: member.stateRegion || profile?.state || "",
      zipCode: member.zipCode || "",
      country: member.country || "United States",
    });
    setSections(
      Array.isArray(member.dashboardSections)
        ? (member.dashboardSections as DashboardSection[])
        : [],
    );
    if (profile?.taxes?.length) {
      setTaxes(
        profile.taxes.map((t: any) => ({
          // Legacy rows used CA / CASDI for the state taxes.
          taxType:
            t.taxType === "CA"
              ? "ST"
              : t.taxType === "CASDI"
                ? "SDI"
                : t.taxType,
          percentage: String(t.percentage ?? ""),
          customName: t.customName || "",
          state: t.state || "",
        })),
      );
    }
  }, [member]);

  // Auto-calculate hourly rate from salary
  useEffect(() => {
    if (form.salary && !isNaN(Number(form.salary))) {
      const calculatedHourly = (Number(form.salary) / 2080).toFixed(2);
      setForm((prev) => ({ ...prev, hourlyRate: calculatedHourly }));
    } else {
      setForm((prev) => ({ ...prev, hourlyRate: "" }));
    }
  }, [form.salary]);

  const handleAddTax = () => {
    setTaxes([
      ...taxes,
      { taxType: "OTHERS", percentage: "", customName: "", state: "" },
    ]);
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
    if (readOnly) return;

    // Taxes with no percentage entered are treated as unset.
    const formattedTaxes = taxes
      .filter((t) => t.percentage !== "")
      .map((t) => ({
        taxType: t.taxType,
        percentage: Number(t.percentage),
        customName: t.taxType === "OTHERS" ? t.customName : undefined,
        state:
          t.taxType === "ST" || t.taxType === "SDI"
            ? t.state || undefined
            : undefined,
      }));

    const addressFields = {
      streetAddress: form.streetAddress || undefined,
      aptSuiteUnit: form.aptSuiteUnit || undefined,
      city: form.city || undefined,
      stateRegion: form.stateRegion || undefined,
      zipCode: form.zipCode || undefined,
      country: form.country || undefined,
    };

    const profileFields = {
      state: form.stateRegion || undefined,
      startingDate: form.startingDate || undefined,
      hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      salary: form.salary ? Number(form.salary) : undefined,
      taxes: formattedTaxes,
    };

    // Only an employee's access is chosen here; the backend clears it for any
    // other role, and sending [] keeps a demoted account from carrying a stale
    // grant it can no longer see in the form.
    const dashboardSections = form.role === "EMPLOYEE" ? sections : [];

    try {
      if (isEdit) {
        await updateUser({
          id: member.id,
          name: form.name,
          username: form.username.trim() || undefined,
          role: form.role,
          phoneNumber: form.phone || undefined,
          dashboardSections,
          ...addressFields,
        }).unwrap();
        await updateProfile({ userId: member.id, ...profileFields }).unwrap();
        toast.success("Team member updated");
      } else {
        const result = await createStaff({
          name: form.name,
          username: form.username.trim() || undefined,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone || undefined,
          dashboardSections,
          ...addressFields,
        }).unwrap();

        // Two calls, two outcomes. The account exists the moment createStaff
        // resolves, so a failure in the profile call that follows must not be
        // reported as "failed to save team member" — that read as though
        // nothing had happened while the employee had in fact been created,
        // and a second attempt then failed on the duplicate email.
        const userId = result?.data?.user?.id;
        if (userId) {
          try {
            await updateProfile({ userId, ...profileFields }).unwrap();
            toast.success("Employee created successfully");
          } catch (profileErr: any) {
            toast.warning(
              `Employee created, but their compensation details could not be saved: ${
                profileErr?.data?.message || "unknown error"
              }. Edit the member to add them.`,
              { duration: 8000 },
            );
          }
        } else {
          toast.success("Employee created successfully");
        }
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save team member");
    }
  };

  const isLoading = isCreating || isUpdating || isSavingUser;
  const title = readOnly
    ? "Team Member Details"
    : isEdit
      ? "Edit Team Member"
      : "Add Team Member";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* rounded-2xl on the wrapper with the scroll area inside, so every
          corner stays rounded and the scrollbar track never squares one off */}
      <div className="bg-white rounded-2xl w-full max-w-[580px] max-h-[92vh] shadow-xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black p-1 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-6 font-semibold">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest border-l-4 border-black pl-2">
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    placeholder="Full Name"
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    placeholder="Email"
                    type="email"
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    disabled={readOnly || isEdit}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    placeholder="+1 (555) 000-0000"
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    disabled={readOnly}
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

              {/* Employees are the one role whose access is picked per person —
                  every other role's tabs are fixed by the role itself, so the
                  checkboxes only appear here. Nothing ticked means no
                  dashboard, which is the safe default for payroll figures. */}
              {form.role === "EMPLOYEE" && (
                <div className="rounded-md border border-gray-200 bg-gray-50/50 p-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dashboard Access
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2.5">
                    Tick the sections this employee can open. They can view
                    these sections but not make changes.
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {SECTION_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-2 text-sm text-gray-800 ${
                          readOnly ? "" : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 accent-black"
                          checked={sections.includes(option.value)}
                          onChange={() => toggleSection(option.value)}
                          disabled={readOnly}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  {sections.length === 0 && (
                    <p className="mt-2 text-[11px] text-amber-600">
                      With nothing ticked they'll sign in to an empty
                      dashboard.
                    </p>
                  )}
                </div>
              )}

              {/* Home address split into its own fields */}
              <div className="space-y-4">
                {/* Apt/Suite gets its own field rather than being folded into
                    the street line, so the two can be stored and printed apart
                    — the same split the client and project addresses use. */}
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      placeholder="123 Main St"
                      className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                      value={form.streetAddress}
                      onChange={(e) =>
                        setForm({ ...form, streetAddress: e.target.value })
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Apt / Suite / Unit
                    </label>
                    <input
                      placeholder="Apt 4B"
                      className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                      value={form.aptSuiteUnit}
                      onChange={(e) =>
                        setForm({ ...form, aptSuiteUnit: e.target.value })
                      }
                      disabled={readOnly}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      placeholder="City"
                      className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      State / Region
                    </label>
                    <StateSelect
                      country={form.country}
                      value={form.stateRegion}
                      onChange={(value) =>
                        setForm({ ...form, stateRegion: value })
                      }
                      disabled={readOnly}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <input
                      placeholder="90210"
                      className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                      value={form.zipCode}
                      onChange={(e) =>
                        setForm({ ...form, zipCode: e.target.value })
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Country
                    </label>
                    <CountrySelect
                      value={form.country}
                      // A new country invalidates the state chosen under the old one.
                      onChange={(value) =>
                        setForm({
                          ...form,
                          country: value,
                          stateRegion:
                            value === form.country ? form.stateRegion : "",
                        })
                      }
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Username — a second handle the employee can sign in with,
                  alongside their email. Optional: an account works on the email
                  alone, and the server rejects one already taken. */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    placeholder="e.g. ericrivera49"
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    disabled={readOnly}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Optional. They can sign in with this or their email.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Password is only set at creation time */}
                {!isEdit && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Initial Password
                    </label>
                    {/* No capital/number rule here on purpose: this is a
                        throwaway the manager hands over, and the employee is
                        held to the full rule when they set their own. */}
                    <div className="relative">
                      <input
                        placeholder="Min 8 characters"
                        type={showPassword ? "text" : "password"}
                        className="w-full border border-gray-300 rounded-md p-2.5 pr-10 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff size={16} strokeWidth={1.8} />
                        ) : (
                          <Eye size={16} strokeWidth={1.8} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Starting Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                    value={form.startingDate}
                    onChange={(e) =>
                      setForm({ ...form, startingDate: e.target.value })
                    }
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>

            {/* Financials */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest border-l-4 border-blue-500 pl-2">
                Financial & Compensation
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Base Salary (Annual $)
                  </label>
                  {/* `text` rather than `number`: a number input refuses to
                      display grouping separators, so "85,000" could never be
                      shown. The state still holds bare digits, which is what
                      Number() is called on at submit. */}
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      $
                    </span>
                    <input
                      inputMode="numeric"
                      placeholder="85,000"
                      className="w-full border border-gray-300 rounded-md p-2.5 pl-7 pr-12 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none bg-gray-50/50"
                      value={formatMoney(form.salary)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          // Digits and a single decimal point: stripping every
                          // non-digit turned "85000.50" into "8500050".
                          salary: e.target.value
                            .replace(/[^\d.]/g, "")
                            .replace(/(\..*)\./g, "$1"),
                        })
                      }
                      disabled={readOnly}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                      USD
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Hourly Rate ($/hr)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-500">
                      $
                    </span>
                    <input
                      readOnly
                      placeholder="Auto-calculated"
                      className="w-full border border-gray-200 rounded-md p-2.5 pl-7 pr-24 text-sm bg-blue-50/50 text-blue-700 font-bold outline-none cursor-not-allowed"
                      value={formatMoney(form.hourlyRate)}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-500 font-bold">
                      USD · Salary / 2080
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task 5: Dynamic Tax Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest border-l-4 border-orange-500 pl-2">
                  Tax Configurations
                </h4>
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
                  <div
                    key={index}
                    className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100 relative group"
                  >
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                        Tax Type
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-black focus:border-black outline-none bg-white"
                        value={tax.taxType}
                        onChange={(e) =>
                          handleTaxChange(index, "taxType", e.target.value)
                        }
                        disabled={readOnly}
                      >
                        {TAX_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {tax.taxType === "OTHERS" && (
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                          Custom Name
                        </label>
                        <input
                          placeholder="e.g. Local Tax"
                          className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-black focus:border-black outline-none bg-white"
                          value={tax.customName}
                          onChange={(e) =>
                            handleTaxChange(index, "customName", e.target.value)
                          }
                          disabled={readOnly}
                        />
                      </div>
                    )}

                    {(tax.taxType === "ST" || tax.taxType === "SDI") && (
                      <div className="w-44">
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                          State
                        </label>
                        <StateSelect
                          country="United States"
                          value={tax.state}
                          onChange={(value) =>
                            handleTaxChange(index, "state", value)
                          }
                          disabled={readOnly}
                          placeholder="Select state"
                        />
                      </div>
                    )}

                    <div className="w-24">
                      <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-black focus:border-black outline-none bg-white font-bold"
                        value={tax.percentage}
                        onChange={(e) =>
                          handleTaxChange(index, "percentage", e.target.value)
                        }
                        disabled={readOnly}
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
                Utilization rate is automatically computed via approved
                timecards.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {readOnly ? "Close" : "Cancel"}
              </button>
              {!readOnly && (
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
                  ) : isEdit ? (
                    "Save Changes"
                  ) : (
                    "Create Employee"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
