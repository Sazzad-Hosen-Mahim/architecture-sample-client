import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Lock, Video } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { useGetMeetingJoinAccessQuery } from "@/redux/api/meetingApi";

/**
 * Landing page for the "Join Meeting" link in the invitation email.
 *
 * The email never links straight to the video room. This page checks — via the
 * server — that the client has paid the consultation fee, then forwards them to
 * the room. If they haven't paid, it drops them on the payment section of the
 * project card instead.
 */
export default function MeetingJoin() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAppSelector(selectCurrentUser);
    const handled = useRef(false);

    const isLoggedIn = !!user;

    // Not signed in → send to login, come back here afterwards.
    useEffect(() => {
        if (!isLoggedIn && id) {
            navigate(
                `/login?redirect=${encodeURIComponent(`/meetings/${id}/join`)}`,
                { replace: true },
            );
        }
    }, [isLoggedIn, id, navigate]);

    const { data, isLoading, isError, error } = useGetMeetingJoinAccessQuery(
        id as string,
        { skip: !isLoggedIn || !id, refetchOnMountOrArgChange: true },
    );

    useEffect(() => {
        if (handled.current || !data) return;
        handled.current = true;

        if (data.allowed && data.meetingUrl) {
            window.location.replace(data.meetingUrl);
            return;
        }

        if (data.reason === "consultation_unpaid") {
            toast.error(
                "Pay the consultation fee for this project to join the meeting.",
            );
        } else {
            toast.error("This meeting isn't available to join yet.");
        }
        navigate(
            `/user-dashboard?project=${data.projectRequestId}&tab=meetings`,
            { replace: true },
        );
    }, [data, navigate]);

    useEffect(() => {
        if (!isError) return;
        const status = (error as any)?.status;
        if (status === 404) {
            toast.error("Meeting not found.");
        } else if (status === 403) {
            toast.error("This meeting invitation isn't for your account.");
        } else {
            toast.error("Could not open the meeting. Please try again.");
        }
        navigate("/user-dashboard", { replace: true });
    }, [isError, error, navigate]);

    const blocked =
        data && (!data.allowed || !data.meetingUrl);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    {blocked ? (
                        <Lock className="w-6 h-6 text-gray-400" />
                    ) : (
                        <Video className="w-6 h-6 text-gray-500" />
                    )}
                </div>
                <h1 className="text-lg font-bold text-gray-900">
                    {blocked ? "Redirecting to payment…" : "Opening your meeting…"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {!isLoggedIn
                        ? "Taking you to sign in…"
                        : isLoading
                            ? "Checking your access…"
                            : blocked
                                ? "Pay the consultation fee to unlock this meeting."
                                : "One moment."}
                </p>
                <div className="mt-5 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            </div>
        </div>
    );
}
