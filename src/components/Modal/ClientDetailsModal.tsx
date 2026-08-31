import { useState } from "react";
import {
  User,
  Mail,
  Building2,
  MapPin,
  Briefcase,
  CreditCard,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useDeleteUserMutation } from "@/redux/api/userApi";

interface ClientDetailsModalProps {
  client: any;
  onClose: () => void;
}

const money = (value: number) =>
  `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-50 last:border-0">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0">
      {label}
    </span>
    <span className="text-xs font-bold text-gray-800 text-right break-words">{value || "—"}</span>
  </div>
);

/**
 * Full client record. Closing returns to the Client Directory — it does not
 * navigate anywhere, so the directory keeps its selection and scroll position.
 */
export default function ClientDetailsModal({ client, onClose }: ClientDetailsModalProps) {
  const fullAddress = [
    client.streetAddress,
    client.city,
    client.stateRegion,
    client.zipCode,
    client.country,
  ]
    .filter(Boolean)
    .join(", ");

  const projects = client.projectRequests || [];
  const payments = client.payments || [];

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleDeleteClient = async () => {
    if (!deletePassword.trim() || isDeleting) return;
    try {
      const result: any = await deleteUser({
        id: client.id,
        password: deletePassword,
      }).unwrap();
      toast.success(result?.message || "Client account deleted.");
      setIsDeleteOpen(false);
      onClose();
    } catch (error: any) {
      // A wrong password comes back as 401 — keep the field open to retry.
      toast.error(error?.data?.message || "Failed to delete this client.");
      setDeletePassword("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              {client.avatar ? (
                <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
              ) : (
                <User className="text-gray-400" size={20} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                {client.name || "Unnamed Client"}
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Client since {new Date(client.createdAt).getFullYear()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Deleting a client is destructive, so it is gated the same way
                deleting a project or a team member is: password confirmation. */}
            <button
              onClick={() => {
                setDeletePassword("");
                setIsDeleteOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              Delete Client
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black p-1 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {isDeleteOpen && (
          <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDeleteClient();
              }}
              className="space-y-3"
            >
              <p className="text-xs font-bold text-red-700">
                Delete {client.name || "this client"}'s account? This cannot be undone.
                Enter your password to confirm.
              </p>
              <p className="text-[11px] font-medium text-gray-600">
                Their projects, signed contracts and payment history stay on
                file — the financial reports are unaffected. Only the client
                account itself is removed.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  autoFocus
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  disabled={!deletePassword.trim() || isDeleting}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 py-5 space-y-6">
          {/* Money at a glance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contracted</p>
              <p className="text-base font-black text-gray-900">{money(client.totalOwed)}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid</p>
              <p className="text-base font-black text-green-600">{money(client.totalPaid)}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Balance</p>
              <p className="text-base font-black text-red-600">{money(client.leftToPay)}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Projects</p>
              <p className="text-base font-black text-gray-900">{client.projectCount}</p>
            </div>
          </div>

          {/* Contact */}
          <section className="space-y-1">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Mail size={12} /> Contact
            </h4>
            <Row label="First Name" value={client.firstName} />
            <Row label="Last Name" value={client.lastName} />
            <Row label="Email" value={client.email} />
            <Row label="Phone" value={client.phone || client.phoneNumber} />
            <Row label="Company" value={client.companyName} />
            <Row label="Account Status" value={client.isActive ? "Active" : "Inactive"} />
            <Row
              label="Last Login"
              value={client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleString() : null}
            />
          </section>

          {/* Address */}
          <section className="space-y-1">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <MapPin size={12} /> Address
            </h4>
            <Row label="Street" value={client.streetAddress} />
            <Row label="City" value={client.city} />
            <Row label="State / Region" value={client.stateRegion} />
            <Row label="Zip Code" value={client.zipCode} />
            <Row label="Country" value={client.country} />
            {fullAddress && <Row label="Full" value={fullAddress} />}
          </section>

          {/* Projects and their signed contracts */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Briefcase size={12} /> Projects &amp; Signed Contracts
            </h4>
            {projects.length === 0 ? (
              <p className="text-xs text-gray-400 italic font-medium">No projects yet.</p>
            ) : (
              projects.map((project: any) => {
                const contracts = project.proposals || [];
                const contractTotal = contracts.reduce(
                  (sum: number, p: any) => sum + Number(p.totalAmount || 0),
                  0
                );
                return (
                  <div
                    key={project.id}
                    className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/40"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-sm font-black text-gray-900">{project.projectName}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {project.status} · {project.stages?.length || 0} phases
                        </p>
                      </div>
                      <p className="text-sm font-black text-gray-900 whitespace-nowrap">
                        {money(contractTotal)}
                      </p>
                    </div>
                    {contracts.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {contracts.map((c: any) => (
                          <div
                            key={c.id}
                            className="flex justify-between items-center text-[11px] font-bold"
                          >
                            <span className="text-gray-500 font-mono">
                              {c.proposalNumber}
                              {c.proposalType === "AMENDMENT" && (
                                <span className="ml-2 text-purple-600 uppercase tracking-wider">
                                  Amendment
                                </span>
                              )}
                            </span>
                            <span className="text-gray-700">{money(Number(c.totalAmount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* Payment history */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <CreditCard size={12} /> Payment History
            </h4>
            {payments.length === 0 ? (
              <p className="text-xs text-gray-400 italic font-medium">No payments recorded.</p>
            ) : (
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Phase</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="p-3 text-gray-600 font-medium whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-gray-700 font-bold">{p.stageName || "—"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              p.paymentStatus === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-gray-900 whitespace-nowrap">
                          {money(Number(p.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Banking */}
          {client.bankDetails && (
            <section className="space-y-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Building2 size={12} /> Banking Information
              </h4>
              <div className="p-4 bg-gray-900 rounded-2xl text-white space-y-3 shadow-lg">
                <Row label="Bank" value={client.bankDetails.bankName} />
                <div className="flex justify-between items-start gap-4 py-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Account Number
                  </span>
                  <span className="text-xs font-bold tracking-widest">
                    ****{String(client.bankDetails.accountNumber || "").slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Routing
                  </span>
                  <span className="text-xs font-bold">{client.bankDetails.routingNumber}</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
