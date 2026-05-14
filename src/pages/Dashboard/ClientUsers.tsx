import { useState } from "react";
import {
    useGetClientUsersQuery
} from "@/redux/api/clientUsersApi";
import {
    User,
    Mail,
    Phone,
    Briefcase,
    // DollarSign,
    ArrowLeft,
    Search,
    ChevronRight,
    Building2,
    // Calendar,
    Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import CommonWrapper from "@/common/CommonWrapper";

export default function ClientUsers() {
    const { data: clientsData, isLoading } = useGetClientUsersQuery(undefined);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const clients = clientsData?.data || [];

    const filteredClients = clients.filter((c: any) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="mt-8 flex justify-center items-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <CommonWrapper>
            <div className="mt-8 space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <User size={180} />
                    </div>
                    <div className="relative z-10 space-y-4 max-w-2xl">
                        <Link to="/dashboard/financials" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-xs font-bold transition-colors mb-2">
                            <ArrowLeft size={14} /> Back to Financials
                        </Link>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                            <Building2 size={12} /> Client Management
                        </div>
                        <h1 className="text-4xl font-black tracking-tight leading-tight">
                            Client Directory <br />
                            <span className="text-gray-400">{clients.length} Total Users</span>
                        </h1>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search clients by name or email..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User List */}
                    <div className="lg:col-span-2 space-y-4">
                        {filteredClients.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">No clients found</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredClients.map((client: any) => (
                                    <button
                                        key={client.id}
                                        onClick={() => setSelectedUser(client)}
                                        className={`w-full cursor-pointer text-left bg-white rounded-2xl border transition-all p-5 flex items-center justify-between group ${selectedUser?.id === client.id ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                {client.avatar ? (
                                                    <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="text-gray-400" size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{client.name || "Unnamed Client"}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        <Mail size={10} /> {client.email}
                                                    </div>
                                                    {client.phone && (
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                            <Phone size={10} /> {client.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Projects</p>
                                                <p className="text-sm font-black text-gray-900">{client.projectCount}</p>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                                                <p className="text-sm font-black text-green-600">${client.totalPaid.toLocaleString()}</p>
                                            </div>
                                            <ChevronRight size={18} className={`text-gray-300 group-hover:text-gray-900 transition-all ${selectedUser?.id === client.id ? 'translate-x-1 text-gray-900' : ''}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selection Details */}
                    <div className="lg:col-span-1">
                        {selectedUser ? (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sticky top-24 space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-xl">
                                        {selectedUser.avatar ? (
                                            <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-gray-200" size={48} />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedUser.name || "Unnamed Client"}</h2>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Client Since {new Date(selectedUser.createdAt).getFullYear()}</p>
                                    </div>
                                </div>

                                {/* Financial Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid</p>
                                        <p className="text-lg font-black text-green-600">${selectedUser.totalPaid.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Balance</p>
                                        <p className="text-lg font-black text-red-600">${selectedUser.leftToPay.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Info Rows */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Account Overview</h3>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 font-medium flex items-center gap-2"><Briefcase size={14} /> Total Projects</span>
                                        <span className="text-gray-900 font-black">{selectedUser.projectCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 font-medium flex items-center gap-2"><Clock size={14} /> Running Phases</span>
                                        <span className="text-gray-900 font-black">{selectedUser.runningPhases.length}</span>
                                    </div>
                                </div>

                                {/* Running Phases */}
                                {selectedUser.runningPhases.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Active Work</h3>
                                        {selectedUser.runningPhases.map((phase: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{phase.projectName}</p>
                                                <p className="text-sm font-black text-gray-900">{phase.phaseName}</p>
                                                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${phase.progress}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Bank Details */}
                                {selectedUser.bankDetails && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Banking Information</h3>
                                        <div className="p-4 bg-gray-900 rounded-2xl text-white space-y-3 shadow-lg">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bank Name</p>
                                                    <p className="text-xs font-bold">{selectedUser.bankDetails.bankName}</p>
                                                </div>
                                                <Building2 size={16} className="text-gray-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Account Number</p>
                                                <p className="text-xs font-bold tracking-widest">****{selectedUser.bankDetails.accountNumber.slice(-4)}</p>
                                            </div>
                                            <div className="flex justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Routing</p>
                                                    <p className="text-xs font-bold">{selectedUser.bankDetails.routingNumber}</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</p>
                                                    <p className="text-xs font-bold">{selectedUser.bankDetails.bankType || "REGULAR"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center h-[500px] flex flex-col items-center justify-center space-y-4">
                                <User className="w-12 h-12 text-gray-300" />
                                <div>
                                    <p className="text-gray-500 font-black uppercase text-xs tracking-widest">No Client Selected</p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-1">Select a client from the directory to view detailed financial metrics and account overview.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CommonWrapper>
    );
}
