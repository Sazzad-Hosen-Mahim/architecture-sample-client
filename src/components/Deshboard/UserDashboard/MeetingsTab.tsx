import { useGetMyMeetingsQuery, UserMeeting } from "@/redux/api/meetingApi";
import { CalendarIcon, ClockIcon, VideoIcon, User, CheckCircle2, XCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface MeetingsTabProps {
    searchQuery?: string;
}

const MeetingsTab = ({ searchQuery = "" }: MeetingsTabProps) => {
    // Get user ID from Redux store
    const userId = useSelector((state: RootState) => state.auth.user?.id);

    // Fetch meetings data
    const { data, isLoading, isError } = useGetMyMeetingsQuery(userId || "", {
        skip: !userId,
    });

    // Filter meetings based on search query
    const filteredMeetings = searchQuery && data?.data
        ? data.data.filter((meeting: UserMeeting) =>
            Object.values(meeting).some(value =>
                value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : data?.data || [];

    // Format date helper
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Format time helper
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>Error loading meetings. Please try again.</p>
            </div>
        );
    }

    // Empty state
    if (!filteredMeetings || filteredMeetings.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <VideoIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No meetings found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Meetings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMeetings.map((meeting: UserMeeting) => (
                    <div
                        key={meeting.id}
                        className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <VideoIcon className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900 text-sm">
                                    {meeting.title}
                                </h3>
                            </div>
                            {meeting.emailSent ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-gray-400" />
                            )}
                        </div>

                        {/* Project Info */}
                        <div className="mb-3 pb-3 border-b border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Project</p>
                            <p className="font-medium text-gray-900 text-sm">
                                {meeting.projectRequest.projectName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs font-medium">
                                    {meeting.projectRequest.serviceType}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-xs font-medium">
                                    {meeting.projectRequest.status}
                                </span>
                            </div>
                        </div>

                        {/* Meeting Details */}
                        <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{formatDate(meeting.scheduledAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <ClockIcon className="w-4 h-4" />
                                <span>{formatTime(meeting.scheduledAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="w-4 h-4" />
                                <span>
                                    {meeting.sentByUser.name} ({meeting.sentByUser.role})
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
                        {meeting.notes && (
                            <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">Notes</p>
                                <p className="text-xs text-gray-700 line-clamp-2">
                                    {meeting.notes}
                                </p>
                            </div>
                        )}

                        {/* Action Button */}
                        <a
                            href={meeting.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-black hover:bg-gray-800 text-white text-sm font-medium py-2 rounded-md transition-colors"
                        >
                            Join Meeting
                        </a>
                    </div>
                ))}
            </div>

            {/* Pagination Info */}
            {data?.meta && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        Showing {data.data.length} of {data.meta.total} meetings
                        {data.meta.totalPages > 1 && (
                            <span> • Page {data.meta.page} of {data.meta.totalPages}</span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
};

export default MeetingsTab;
