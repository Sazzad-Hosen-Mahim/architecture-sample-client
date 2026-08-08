import { useState } from "react";
import { X, Building2, CreditCard, Hash, MapPin, Smartphone } from "lucide-react";

interface RefundBankDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (bankDetails: BankDetails) => void;
}

export interface BankDetails {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    branchName: string;
    bankType: string;
}

const BANK_TYPE_OPTIONS = [
    { value: "TRADITIONAL", label: "Traditional Bank (e.g., Chase, Bank of America, Wells Fargo)" },
    { value: "ONLINE", label: "Online Bank / Neobank (e.g., Chime, Ally, Marcus)" },
    { value: "CREDIT_UNION", label: "Credit Union (e.g., SchoolsFirst FCU, Golden 1 CU)" },
    { value: "MOBILE_BANK", label: "Mobile Bank (e.g., Varo, Current, Dave)" },
];

export default function RefundBankDetailsModal({ isOpen, onClose, onSubmit }: RefundBankDetailsModalProps) {
    const [form, setForm] = useState<BankDetails>({
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        branchName: "",
        bankType: "TRADITIONAL",
    });

    const [errors, setErrors] = useState<Partial<BankDetails>>({});

    if (!isOpen) return null;

    const handleChange = (field: keyof BankDetails, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validate = () => {
        const newErrors: Partial<BankDetails> = {};
        if (!form.bankName.trim()) newErrors.bankName = "Bank name is required";
        if (!form.accountNumber.trim()) newErrors.accountNumber = "Account number is required";
        if (!form.routingNumber.trim()) newErrors.routingNumber = "Routing number is required";
        if (form.routingNumber.trim() && form.routingNumber.trim().length !== 9) {
            newErrors.routingNumber = "Routing number must be 9 digits";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(form);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">Bank Account Details</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Required for refund processing</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-300" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Bank Type */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            <Smartphone className="w-3.5 h-3.5 inline mr-1.5" />
                            Bank Type
                        </label>
                        <select
                            value={form.bankType}
                            onChange={(e) => handleChange("bankType", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {BANK_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Bank Name */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
                            Bank Name *
                        </label>
                        <input
                            type="text"
                            value={form.bankName}
                            onChange={(e) => handleChange("bankName", e.target.value)}
                            placeholder="e.g., Chase, Chime, Golden 1 Credit Union"
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.bankName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        />
                        {errors.bankName && <p className="text-xs text-red-500 mt-1 font-medium">{errors.bankName}</p>}
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            <CreditCard className="w-3.5 h-3.5 inline mr-1.5" />
                            Account Number *
                        </label>
                        <input
                            type="text"
                            value={form.accountNumber}
                            onChange={(e) => handleChange("accountNumber", e.target.value)}
                            placeholder="Enter your account number"
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.accountNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        />
                        {errors.accountNumber && <p className="text-xs text-red-500 mt-1 font-medium">{errors.accountNumber}</p>}
                    </div>

                    {/* Routing Number */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            <Hash className="w-3.5 h-3.5 inline mr-1.5" />
                            Routing Number (ABA) *
                        </label>
                        <input
                            type="text"
                            value={form.routingNumber}
                            onChange={(e) => handleChange("routingNumber", e.target.value.replace(/\D/g, '').slice(0, 9))}
                            placeholder="9-digit routing number"
                            maxLength={9}
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.routingNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        />
                        {errors.routingNumber && <p className="text-xs text-red-500 mt-1 font-medium">{errors.routingNumber}</p>}
                    </div>

                    {/* Branch Name */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                            <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
                            Branch Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={form.branchName}
                            onChange={(e) => handleChange("branchName", e.target.value)}
                            placeholder="e.g., Los Angeles Main Branch"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            🔒 Your bank details are securely stored and will be used for processing refund payments. You only need to enter this once — future refund requests will use these saved details.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 cursor-pointer py-3 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 cursor-pointer py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg shadow-gray-900/20 active:scale-95"
                        >
                            Save & Continue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
