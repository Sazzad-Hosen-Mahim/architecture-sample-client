import { useEffect, useState } from "react";
import { X, Loader2, ShieldCheck } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import StripeConsultationForm from "@/components/New project/StripeConsultationForm";
import { useCreateConsultationIntentMutation } from "@/redux/api/paymentApi";
import { useAttachConsultationPaymentMutation } from "@/redux/api/newInquiryApi";
import { useGetConsultationFeeQuery } from "@/redux/api/adminDashboard/siteSettingsApi";

const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

interface ConsultationFeeModalProps {
    isOpen: boolean;
    projectRequestId: string;
    projectName: string;
    clientEmail: string;
    onClose: () => void;
    /** Fired after the fee is confirmed server-side. */
    onPaid: () => void;
}

/**
 * Clients who came in through the public "new project" form paid the
 * consultation fee at intake. Clients whose inquiry was created for them by a
 * PM never hit that step, so this is where they settle it — the backend
 * refuses meeting requests until `consultationPaymentId` is set.
 */
export default function ConsultationFeeModal({
    isOpen,
    projectRequestId,
    projectName,
    clientEmail,
    onClose,
    onPaid,
}: ConsultationFeeModalProps) {
    const { data: feeData } = useGetConsultationFeeQuery();
    const [createIntent, { isLoading: isCreatingIntent }] = useCreateConsultationIntentMutation();
    const [attachPayment, { isLoading: isAttaching }] = useAttachConsultationPaymentMutation();
    const [clientSecret, setClientSecret] = useState("");

    const fee = feeData?.data?.feeUsd;

    // The PaymentIntent is created for the fee that is current right now, so it
    // is only requested once the client actually opens this modal.
    useEffect(() => {
        if (!isOpen || clientSecret) return;

        let cancelled = false;
        (async () => {
            try {
                const result: any = await createIntent({}).unwrap();
                if (!cancelled) setClientSecret(result?.data?.clientSecret || "");
            } catch {
                if (!cancelled) toast.error("Could not start the payment. Please try again.");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen, clientSecret, createIntent]);

    if (!isOpen) return null;

    const handleSuccess = async (paymentIntentId: string) => {
        try {
            await attachPayment({ projectRequestId, paymentIntentId }).unwrap();
            toast.success("Consultation fee confirmed. You can now request a meeting.");
            setClientSecret("");
            onPaid();
        } catch (error: any) {
            // The charge went through but we could not record it — say so plainly
            // rather than letting the client think the payment failed.
            toast.error(
                error?.data?.message ||
                "Payment succeeded but we could not record it. Please contact your project manager."
            );
        }
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Initial Consultation Fee</h3>
                        <p className="text-xs text-gray-500 mt-1">{projectName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isAttaching}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-4 overflow-y-auto">
                    <div className="flex items-baseline justify-between gap-3 pb-4 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-900">Amount due</span>
                        <span className="text-2xl font-black text-gray-900">
                            {typeof fee === "number" ? `$${fee.toFixed(2)}` : "—"}
                        </span>
                    </div>

                    <p className="text-xs text-gray-500">
                        This one-time fee covers your initial consultation. Once it is paid you can
                        request meetings with your project manager for this project.
                    </p>

                    {isAttaching ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Confirming your payment...
                        </div>
                    ) : isCreatingIntent || !clientSecret ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Preparing secure checkout...
                        </div>
                    ) : (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <StripeConsultationForm
                                onSuccess={handleSuccess}
                                clientEmail={clientEmail}
                            />
                        </Elements>
                    )}

                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Secured by Stripe
                    </p>
                </div>
            </div>
        </div>
    );
}
