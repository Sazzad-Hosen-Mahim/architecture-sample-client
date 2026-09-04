import AddEmployeeModal from "@/components/Modal/AddEmployeeModal";
import {
  useGetAllUsersQuery,
  useDeleteUserMutation,
} from "@/redux/api/userApi";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpDown, Edit, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

/**
 * This directory is staff only — clients (the USER role) are listed under
 * Show Users / Client Directory instead.
 */
const STAFF_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "HIGHER_MANAGER",
  "PROJECT_MANAGER",
  "FINANCE",
  "MEDIA_MANAGER",
  "DRAFTER",
  "EMPLOYEE",
];

/** The Super Admin is the firm's owner — that's how the roster labels them. */
const roleLabel = (role?: string) =>
  role === "SUPER_ADMIN" ? "OWNER" : (role || "").replace(/_/g, " ");

const SORT_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "role", label: "Role" },
  { value: "utilization", label: "Utilization (high → low)" },
  { value: "compensation", label: "Compensation (high → low)" },
  { value: "timeWorked", label: "Time Worked (longest first)" },
  { value: "startDate", label: "Start Date (newest first)" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole years + months since the start date, e.g. "2y 3m". */
const formatTimeWorked = (startingDate?: string | null) => {
  if (!startingDate) return null;
  const start = new Date(startingDate);
  if (Number.isNaN(start.getTime())) return null;
  const days = Math.max(
    0,
    Math.floor((Date.now() - start.getTime()) / MS_PER_DAY),
  );
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30.44);
  if (years === 0 && months === 0) return `${days}d`;
  return years === 0 ? `${months}m` : `${years}y ${months}m`;
};

const daysWorked = (startingDate?: string | null) => {
  if (!startingDate) return -1;
  const start = new Date(startingDate);
  if (Number.isNaN(start.getTime())) return -1;
  return Math.floor((Date.now() - start.getTime()) / MS_PER_DAY);
};

const Employees = () => {
  const { data, isLoading } = useGetAllUsersQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [open, setOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [viewingMember, setViewingMember] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const staff = useMemo(() => {
    const rows = (data || []).filter((u: any) => STAFF_ROLES.includes(u.role));

    const compensation = (u: any) => Number(u.employeeProfile?.salary || 0);
    const utilization = (u: any) =>
      Number(u.employeeProfile?.utilizationRate || 0);

    return [...rows].sort((a: any, b: any) => {
      switch (sortBy) {
        case "role":
          return (a.role || "").localeCompare(b.role || "");
        case "utilization":
          return utilization(b) - utilization(a);
        case "compensation":
          return compensation(b) - compensation(a);
        case "timeWorked":
          return (
            daysWorked(b.employeeProfile?.startingDate) -
            daysWorked(a.employeeProfile?.startingDate)
          );
        case "startDate":
          return (
            daysWorked(a.employeeProfile?.startingDate) -
            daysWorked(b.employeeProfile?.startingDate)
          );
        default:
          return (a.firstName || a.name || "").localeCompare(
            b.firstName || b.name || "",
          );
      }
    });
  }, [data, sortBy]);

  const handleDelete = async () => {
    if (!deleteTarget || !deletePassword.trim()) return;
    try {
      const result = await deleteUser({
        id: deleteTarget.id,
        password: deletePassword,
      }).unwrap();
      toast.success(result?.message || "Team member deleted");
      setDeleteTarget(null);
      setDeletePassword("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete team member");
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-md shadow font-semibold">
      <Link
        to="/dashboard/financials?tab=payroll"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accountant Controls
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Employees &amp; Staff</h2>
          <p className="text-sm text-gray-500 font-medium">
            {staff.length} registered team members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
            <ArrowUpDown size={14} className="text-gray-400" />
            <select
              className="text-sm bg-transparent outline-none font-bold text-gray-700"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-bold transition-all"
          >
            + Add Team Member
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm min-w-[1400px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="[&>th]:p-4 [&>th]:text-left [&>th]:font-bold [&>th]:text-gray-900 [&>th]:whitespace-nowrap">
              <th>First Name</th>
              <th>Last Name</th>
              <th>Contact Info</th>
              <th>Role</th>
              <th>Home Address</th>
              <th>State/Region</th>
              <th>Country</th>
              <th>Start Date / Time Worked</th>
              <th>Compensation</th>
              <th>Utilization</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {staff.map((user: any) => {
              const profile = user.employeeProfile;
              const utilization = Number(profile?.utilizationRate || 0);
              const timeWorked = formatTimeWorked(profile?.startingDate);

              return (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/50 transition-colors align-top"
                >
                  <td className="p-4">
                    <div className="font-bold text-gray-900">
                      {user.firstName || user.name?.split(" ")[0] || "—"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">
                      {user.isActive ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {user.lastName ||
                      user.name?.split(" ").slice(1).join(" ") ||
                      "—"}
                  </td>
                  <td className="p-4">
                    <div className="text-gray-700 font-medium">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-400 font-bold">
                      {user.phoneNumber || profile?.phone || "No phone"}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-bold whitespace-nowrap">
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 font-medium max-w-[220px]">
                    {user.streetAddress ? (
                      <>
                        <div>{user.streetAddress}</div>
                        {user.city && (
                          <div className="text-xs text-gray-400">
                            {user.city}
                            {user.zipCode ? ` ${user.zipCode}` : ""}
                          </div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4 text-gray-600 font-medium">
                    {user.stateRegion || profile?.state || "—"}
                  </td>
                  <td className="p-4 text-gray-600 font-medium">
                    {user.country || "—"}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900">
                      {profile?.startingDate
                        ? new Date(profile.startingDate).toLocaleDateString()
                        : "—"}
                    </div>
                    <div className="text-xs text-blue-600 font-bold">
                      {timeWorked || "—"}
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900">
                      {profile?.salary
                        ? `$${(Number(profile.salary) / 1000).toFixed(1)}k/yr`
                        : "—"}
                    </div>
                    <div className="text-xs text-green-600 font-bold">
                      {profile?.hourlyRate
                        ? `$${Number(profile.hourlyRate).toFixed(2)}/hr`
                        : "—"}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, utilization)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-blue-700 whitespace-nowrap">
                        {utilization > 0 ? `${utilization.toFixed(0)}%` : "—"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setEditingMember(user)}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="View & edit details"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="p-12 text-center text-gray-500 font-medium italic"
                >
                  No employees found in the directory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <AddEmployeeModal onClose={() => setOpen(false)} />}
      {editingMember && (
        <AddEmployeeModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}
      {viewingMember && (
        <AddEmployeeModal
          member={viewingMember}
          readOnly
          onClose={() => setViewingMember(null)}
        />
      )}

      {/* Deleting a team member requires the acting admin's own password */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Delete {deleteTarget.name || "this team member"}?
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              This cannot be undone. Enter <strong>your own</strong> password to
              confirm. If this member has project history their account is
              deactivated instead, so the records stay intact.
            </p>
            <input
              type="password"
              autoFocus
              placeholder="Your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeletePassword("");
                }}
                className="px-5 py-2 text-sm font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || !deletePassword.trim()}
                className="px-5 py-2 text-sm font-black uppercase tracking-widest bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
