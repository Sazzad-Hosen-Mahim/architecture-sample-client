import { X, CheckCircle2, Clock, ExternalLink, Package } from "lucide-react";

interface ClientProjectDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
}

export default function ClientProjectDetailsModal({ isOpen, onClose, project }: ClientProjectDetailsModalProps) {
    if (!isOpen || !project) return null;

    const stages = project.stages || [];
    const completedStages = stages.filter((s: any) => s.status === "COMPLETED");
    const progress = stages.length > 0
        ? Math.round((completedStages.length / stages.length) * 100)
        : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">{project.projectName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-tighter">
                                {project.serviceType.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">Project Progress Details</span>
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
                        {/* Decorative background element */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Project Workflow Phases</h4>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {stages.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Package className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-semibold mb-1">Phases Pending</p>
                            <p className="text-xs text-gray-400 max-w-[200px] mx-auto italic">
                                Individual project phases will appear here once the contract transition is complete.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
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

                                        {/* Progress Bar for the stage */}
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

                                        {/* Drive Link - Deliverables Section */}
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
