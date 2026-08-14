import { useState } from "react";
import { X, CalendarPlus, Loader2 } from "lucide-react";
import MeetingSlotPicker, {
    EMPTY_SLOT_SELECTION,
    toMeetingWindow,
    type SlotSelection,
} from "@/components/Common/MeetingSlotPicker";

export interface RequestMeetingForm {
    /** ISO start of the requested window. */
    scheduledAt: string;
    /** ISO end of the requested window. */
    endsAt: string;
    notes: string;
    notNecessary: boolean;
}

interface RequestMeetingModalProps {
    isOpen: boolean;
    isLoading?: boolean;
    projectName: string;
    /** Booking is checked against this project's assigned manager's calendar. */
    projectRequestId: string;
    /** Present when booking the progress call for a specific phase. */
    phaseName?: string;
    /** Shown for the initial consultation only. Comes from site settings. */
    consultationFee?: number;
    /** The fee is collected before this modal opens, so it reads as settled. */
    consultationFeePaid?: boolean;
    /** Phase meetings may be waived by the client; the initial one may not. */
    allowBypass?: boolean;
    onClose: () => void;
    onSubmit: (form: RequestMeetingForm) => Promise<void> | void;
}

export default function RequestMeetingModal({
    isOpen,
    isLoading,
    projectName,
    projectRequestId,
    phaseName,
    consultationFee,
    consultationFeePaid,
    allowBypass,
    onClose,
    onSubmit,
}: RequestMeetingModalProps) {
    const [slot, setSlot] = useState<SlotSelection>(EMPTY_SLOT_SELECTION);
    const [notes, setNotes] = useState("");
    const [notNecessary, setNotNecessary] = useState(false);

    if (!isOpen) return null;

    const reset = () => {
        setSlot(EMPTY_SLOT_SELECTION);
        setNotes("");
        setNotNecessary(false);
    };

    const close = () => {
        reset();
        onClose();
    };

    const handleSubmit = () => {
        const window = toMeetingWindow(slot);
        onSubmit({
            scheduledAt: window?.scheduledAt ?? "",
            endsAt: window?.endsAt ?? "",
            notes,
            notNecessary,
        });
    };

    const heading = phaseName ? `${phaseName} Meeting` : "Initial Consultation Meeting";

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Request a Meeting</h3>
                        <p className="text-xs text-gray-500 mt-1">{projectName}</p>
                    </div>
                    <button onClick={close} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-4 overflow-y-auto">
                    {allowBypass && (
                        <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
                            <span className="text-sm font-semibold text-gray-900">Meeting Not Necessary</span>
                            <input
                                type="checkbox"
                                checked={notNecessary}
                                onChange={(e) => setNotNecessary(e.target.checked)}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                            />
                        </label>
                    )}

                    <p className="text-sm font-bold text-gray-900">{heading}</p>

                    {/* Times already taken on the assigned manager's calendar — or
                        blocked off while they're away — are greyed out here. */}
                    {!notNecessary && (
                        <MeetingSlotPicker
                            value={slot}
                            onChange={setSlot}
                            projectRequestId={projectRequestId}
                            disabled={isLoading}
                            accent="emerald"
                        />
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Notes (optional)</label>
                        <textarea
                            value={notes}
                            disabled={notNecessary}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="What would you like to discuss?"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:bg-gray-100 disabled:text-gray-400"
                        />
                    </div>

                    {typeof consultationFee === "number" && (
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900">
                                    Initial Consultation Fee
                                </p>
                                {consultationFeePaid && (
                                    <span className="text-[9px] font-black bg-green-50 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-green-100">
                                        Paid
                                    </span>
                                )}
                            </div>
                            <p className="text-lg font-black text-gray-900 mt-1">
                                ${consultationFee.toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <button
                        onClick={close}
                        className="flex-1 cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 px-4 cursor-pointer py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                            </>
                        ) : (
                            <>
                                <CalendarPlus className="w-4 h-4 mr-2" />
                                {notNecessary ? "Confirm Skip" : "Send Request"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
