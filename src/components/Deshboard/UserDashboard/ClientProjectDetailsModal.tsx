import { X, CheckCircle2, Clock, ExternalLink, Package, MapPin, Mail, Phone, Building2, User, Calendar, VideoIcon, Loader2 } from "lucide-react";
import { useGetProjectRequestByIdQuery } from "@/redux/api/adminDashboard/proposalApi";

interface ClientProjectDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
}

export default function ClientProjectDetailsModal({ isOpen, onClose, project: initialProject }: ClientProjectDetailsModalProps) {
    const { data: latestProject, isLoading } = useGetProjectRequestByIdQuery(initialProject?.id, {
        skip: !isOpen || !initialProject?.id,
        refetchOnMountOrArgChange: true,
    });

    const project = latestProject || initialProject;

    if (!isOpen || !project) return null;

    const stages = project.stages || [];
    const completedStages = stages.filter((s: any) => s.status === "COMPLETED");
    const progress = stages.length > 0
        ? Math.round((completedStages.length / stages.length) * 100)
        : 0;

    const meetings = project.meetingLinks || [];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDaysUntil = (dateStr: string) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const deadline = new Date(dateStr);
        deadline.setHours(0, 0, 0, 0);
        const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getDeadlineColor = (dateStr: string) => {
        const days = getDaysUntil(dateStr);
        if (days < 0) return "text-red-600 bg-red-50 border-red-200";
        if (days <= 3) return "text-red-700 bg-red-50 border-red-100";
        if (days <= 7) return "text-amber-700 bg-amber-50 border-amber-100";
        return "text-gray-500 bg-gray-50 border-gray-100";
    };

    const fullClientName = `${project.clientFirstName || ''} ${project.clientMiddleName || ''} ${project.clientLastName || ''}`.trim();
    const projectAddress = [project.projectStreetAddress, project.projectCity, project.projectState, project.projectCountry].filter(Boolean).join(", ");
    const clientAddress = [project.streetAddress, project.city, project.state, project.country].filter(Boolean).join(", ");

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">{project.projectName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-tighter">
                                {(project.serviceType || "").replace(/_/g, " ")}
                            </span>
                            {project.projectCategory && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100 uppercase tracking-tighter">
                                    {project.projectCategory}
                                </span>
                            )}
                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Project Details</span>
                            {isLoading && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full animate-pulse border border-blue-100 flex-shrink-0">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    <span className="text-[9px] font-bold uppercase">Refreshing</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200">

                    {/* Project Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Client Info Card */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" />
                                Client Information
                            </h4>
                            <div className="space-y-3">
                                {fullClientName && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-sm text-gray-900 font-medium">{fullClientName}</span>
                                    </div>
                                )}
                                {project.companyName && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-sm text-gray-700">{project.companyName}</span>
                                    </div>
                                )}
                                {project.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-sm text-gray-700">{project.email}</span>
                                    </div>
                                )}
                                {project.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-sm text-gray-700">{project.phone}</span>
                                    </div>
                                )}
                                {clientAddress && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                        <span className="text-sm text-gray-600">{clientAddress}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Project Details Card */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" />
                                Project Details
                            </h4>
                            <div className="space-y-3">
                                {projectAddress && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Location</span>
                                            <span className="text-sm text-gray-700">{projectAddress}</span>
                                        </div>
                                    </div>
                                )}
                                {project.projectSize && (
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Project Size</span>
                                        <span className="text-sm text-gray-700">{project.projectSize}</span>
                                    </div>
                                )}
                                {project.budgetRange && (
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Budget Range</span>
                                        <span className="text-sm text-orange-600 font-medium">{project.budgetRange}</span>
                                    </div>
                                )}
                                {project.preferredArchitecturalStyle && (
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Architectural Style</span>
                                        <span className="text-sm text-gray-700">{project.preferredArchitecturalStyle}</span>
                                    </div>
                                )}
                                {project.siteConstraints && (
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Site Constraints</span>
                                        <span className="text-sm text-gray-700">{project.siteConstraints}</span>
                                    </div>
                                )}
                                {project.sustainabilityGoals && (
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Sustainability Goals</span>
                                        <span className="text-sm text-gray-700">{project.sustainabilityGoals}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    {(project.specialRequirements || project.additionalComments) && (
                        <div className="mb-8 bg-amber-50/50 border border-amber-100 rounded-xl p-5">
                            {project.specialRequirements && (
                                <div className="mb-3">
                                    <span className="text-[10px] text-amber-600 font-bold uppercase block mb-1">Special Requirements</span>
                                    <p className="text-sm text-gray-700">{project.specialRequirements}</p>
                                </div>
                            )}
                            {project.additionalComments && (
                                <div>
                                    <span className="text-[10px] text-amber-600 font-bold uppercase block mb-1">Additional Comments</span>
                                    <p className="text-sm text-gray-700">{project.additionalComments}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress Overview Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-6 mb-8 border border-blue-100/50 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-1">Current Progress</span>
                                    <span className="text-sm font-medium text-blue-700">Completion rate for all project phases</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-blue-600 block leading-none">{progress}%</span>
                                </div>
                            </div>
                            <div className="h-4 bg-white/60 rounded-full p-0.5 border border-blue-200 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1500 ease-out rounded-full shadow-lg relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                    </div>

                    {/* Project Phases */}
                    <div className="flex items-center gap-3 mb-6">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Project Workflow Phases</h4>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {stages.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-8">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Package className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-semibold mb-1">Phases Pending</p>
                            <p className="text-xs text-gray-400 max-w-[200px] mx-auto italic">
                                Individual project phases will appear here once the contract transition is complete.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5 mb-8">
                            {stages.map((stage: any, idx: number) => {
                                const isCompleted = stage.status === "COMPLETED";
                                return (
                                    <div
                                        key={stage.id}
                                        className={`group relative border rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${isCompleted
                                            ? 'bg-green-50/30 border-green-100 shadow-green-900/5'
                                            : 'bg-white border-gray-200 shadow-gray-200/40'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${isCompleted
                                                    ? 'bg-green-100 text-green-600 border-green-200'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Phase {idx + 1}</span>
                                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${isCompleted ? 'bg-green-100/50 text-green-700 border-green-200/50' : 'bg-amber-100/50 text-amber-700 border-amber-200/50'
                                                            }`}>
                                                            {stage.status}
                                                        </span>
                                                        {stage.externalDeadline && !isCompleted && (
                                                            <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${getDeadlineColor(stage.externalDeadline)}`}>
                                                                <Calendar className="w-2.5 h-2.5" />
                                                                Deadline: {new Date(stage.externalDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                {getDaysUntil(stage.externalDeadline) < 0 && " (OVERDUE)"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h5 className={`font-bold text-base leading-tight ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                                                        {stage.name}
                                                    </h5>
                                                    {stage.description && (
                                                        <p className="text-xs text-gray-500 mt-2 leading-relaxed opacity-80 line-clamp-2">
                                                            {stage.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-tighter">
                                                <span>Work Progress</span>
                                                <span className={isCompleted ? 'text-green-600' : 'text-blue-600'}>{stage.progress || 0}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-in-out ${isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/20' : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20'
                                                        }`}
                                                    style={{ width: `${stage.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Drive Link */}
                                        {stage.driveLink && (
                                            <div className="pt-4 border-t border-gray-100/60 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deliverables Available</span>
                                                </div>
                                                <a
                                                    href={stage.driveLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-800 transition-all hover:gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm active:scale-95"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    VIEW FILES
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Meetings Section */}
                    {meetings.length > 0 && (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Scheduled Meetings</h4>
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="space-y-3 mb-6">
                                {meetings.map((meeting: any) => {
                                    const isRequest = meeting.meetingUrl === "https://pending.request";
                                    return (
                                        <div key={meeting.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isRequest ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                                        <VideoIcon className={`w-5 h-5 ${isRequest ? 'text-amber-600' : 'text-emerald-600'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="text-sm font-bold text-gray-900">{meeting.title}</h5>
                                                            {isRequest && (
                                                                <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-amber-200">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(meeting.scheduledAt)}
                                                            </span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(meeting.scheduledAt)}
                                                            </span>
                                                        </div>
                                                        {meeting.sentByUser && !isRequest && (
                                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                                Organized by {meeting.sentByUser.name}
                                                            </span>
                                                        )}
                                                        {meeting.notes && (
                                                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{meeting.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {!isRequest ? (
                                                    <a
                                                        href={meeting.meetingUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        JOIN
                                                    </a>
                                                ) : (
                                                    <div className="px-3 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-lg uppercase tracking-tight flex-shrink-0">
                                                        Requested
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
                    <div className="hidden sm:flex items-center gap-2 text-gray-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Client Project Dashboard</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-10 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-900/20 active:scale-95 hover:shadow-gray-900/40"
                    >
                        Close View
                    </button>
                </div>
            </div>
        </div>
    );
}
