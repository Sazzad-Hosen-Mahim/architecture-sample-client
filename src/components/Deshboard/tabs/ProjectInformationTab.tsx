import { ProjectRequest } from "@/redux/api/adminDashboard/proposalApi";
import { toExternalUrl } from "@/utils/externalUrl";
import {
    UserIcon,
    MailIcon,
    PhoneIcon,
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    // CheckCircle2Icon, // used by the commented-out manual status control
    Building2Icon,
    HomeIcon,
    Loader2,
    LinkIcon,
    ExternalLink,
    Trash2,
    UserCog,
    Users,
    X,
    Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SharedFolderCard from "@/components/Deshboard/Common/SharedFolderCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    // useUpdateProjectRequestStatusMutation, // manual status control (commented out below)
    useUpdateProjectDriveLinkMutation,
    useDeleteProjectDriveLinkMutation,
    useGetProjectManagersQuery,
    useAssignProjectManagerMutation,
    useGetTeamsQuery,
    useAssignProjectTeamsMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { getProjectProgress } from "@/utils/projectProgress";

type ProjectInformationTabProps = {
    project: ProjectRequest;
};

const STATUS_OPTIONS = [
    { value: "PENDING", label: "Initial" },
    { value: "REVIEWED", label: "Inquiry" },
    { value: "SCHEDULED", label: "Bidding" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
] as const;

export default function ProjectInformationTab({ project }: ProjectInformationTabProps) {
    const currentUser = useAppSelector(selectCurrentUser);
    const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

    // const [selectedStatus, setSelectedStatus] = useState<ProjectRequest["status"] | null>(null);
    // Manual status mutation — retained for the commented-out control below.
    // const [updateStatus, { isLoading: isUpdating }] = useUpdateProjectRequestStatusMutation();
    const [updateDriveLink, { isLoading: isUpdatingDriveLink }] = useUpdateProjectDriveLinkMutation();
    const [deleteDriveLink, { isLoading: isDeletingDriveLink }] = useDeleteProjectDriveLinkMutation();
    const [assignPM, { isLoading: isAssigning }] = useAssignProjectManagerMutation();
    const [assignTeams] = useAssignProjectTeamsMutation();
    const { data: pmData } = useGetProjectManagersQuery(undefined, { skip: !isSuperAdmin });
    const { data: teamsData } = useGetTeamsQuery();

    const projectManagers = pmData?.data || [];
    const allTeams = teamsData || [];

    // Drive link state
    const [showDriveLinkInput, setShowDriveLinkInput] = useState(false);
    const [driveLinkValue, setDriveLinkValue] = useState("");
    const [isEditingDriveLink, setIsEditingDriveLink] = useState(false);

    useEffect(() => {
        if (project) {
            // setSelectedStatus(project.status); // manual status control (commented out)
            setShowDriveLinkInput(false);
            setIsEditingDriveLink(false);
            setDriveLinkValue("");
        }
    }, [project]);

    // In-person requests carry no appointment date — the studio arranges those
    // after review — so an absent value is normal, not an error.
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // const handleStatusChange = (value: string) => {
    //     setSelectedStatus(value as ProjectRequest["status"]);
    // };

    // const handleSaveChanges = async () => {
    // if (!selectedStatus || selectedStatus === project.status) {
    // toast.info("No changes to save");
    // return;
    // }
    //
    // try {
    // await updateStatus({
    // id: project.id,
    // status: selectedStatus,
    // notes: "Status updated from admin panel",
    // }).unwrap();
    // toast.success("Status updated successfully!");
    // } catch (error) {
    // console.error("Failed to update status:", error);
    // toast.error("Failed to update status. Please try again.");
    // }
    // };

    const handleAssignPM = async (managerId: string) => {
        try {
            await assignPM({ projectId: project.id, managerId }).unwrap();
            toast.success("Project Manager assigned successfully!");
        } catch (error: any) {
            console.error("Failed to assign PM:", error);
            toast.error(error?.data?.message || "Failed to assign Project Manager.");
        }
    };



    const handleSaveDriveLink = async () => {
        const link = driveLinkValue.trim();
        if (!link) {
            toast.error("Please enter a Project Drive link");
            return;
        }
        try {
            await updateDriveLink({ id: project.id, driveLink: link }).unwrap();
            toast.success("Project Drive link saved successfully!");
            setShowDriveLinkInput(false);
            setIsEditingDriveLink(false);
            setDriveLinkValue("");
        } catch (error) {
            console.error("Failed to save drive link:", error);
            toast.error("Failed to save Project Drive link.");
        }
    };

    const handleDeleteDriveLink = async () => {
        try {
            await deleteDriveLink(project.id).unwrap();
            toast.success("Project Drive link removed!");
        } catch (error) {
            console.error("Failed to remove drive link:", error);
            toast.error("Failed to remove Project Drive link.");
        }
    };

    const handleEditDriveLink = () => {
        setDriveLinkValue(project.driveLink || "");
        setIsEditingDriveLink(true);
        setShowDriveLinkInput(true);
    };

    const handleAssignTeam = async (teamId: string) => {
        const currentTeams = project.teams || [];
        const isAssigned = currentTeams.some(t => t.id === teamId);

        let newTeamIds: string[];
        if (isAssigned) {
            newTeamIds = currentTeams.filter(t => t.id !== teamId).map(t => t.id);
        } else {
            newTeamIds = [...currentTeams.map(t => t.id), teamId];
        }

        try {
            await assignTeams({ projectId: project.id, teamIds: newTeamIds }).unwrap();
            toast.success(isAssigned ? "Team removed" : "Team assigned");
        } catch (error) {
            toast.error("Failed to update teams");
        }
    };

    const getStatusLabel = (status: string) => {
        return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
    };

    const acceptedProposals = project.proposals?.filter((p) => p.status === "ACCEPTED") || [];
    // Phases live on the project request itself; the accepted proposals are a
    // fallback for payloads that only carry projectStages. Reading only the
    // latter left this empty, so a fully-completed project still showed the
    // 15% "no phases" floor.
    const allPhases = (project as any).stages?.length
        ? (project as any).stages
        : acceptedProposals.flatMap((p) => p.projectStages || []);
    const completedPhaseCount = allPhases.filter((s: any) => s.status === "COMPLETED").length;
    // Driven entirely by phase completion — no manual status change needed.
    const progress = getProjectProgress(project.status, completedPhaseCount, allPhases.length);
    // const hasChanges = selectedStatus !== project.status;
    const fullClientName = [project.clientFirstName, project.clientMiddleName, project.clientLastName]
        .filter(Boolean)
        .join(" ");
    const fullAddress = `${project.streetAddress}, ${project.city}, ${project.state}, ${project.country}`;
    const projectAddress = `${project.projectStreetAddress}, ${project.projectCity}, ${project.projectState}, ${project.projectCountry}`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Project Details */}
            <div className="lg:col-span-2 space-y-6">

                <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex flex-col gap-3 md:flex-row items-start justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-semibold">Project Details</h3>
                            <p className="text-sm text-blue-600 font-medium">
                                Information about the project inquiry
                            </p>
                        </div>

                        {/* Assign Project Manager - Top Right */}
                        <div className="flex-shrink-0">
                            {isSuperAdmin ? (
                                <div className="flex items-center gap-2">
                                    <UserCog className="w-4 h-4 text-gray-500" />
                                    <Select
                                        value={project.assignedManagerId || "unassigned"}
                                        onValueChange={(value) => handleAssignPM(value === "unassigned" ? "" : value)}
                                        disabled={isAssigning}
                                    >
                                        <SelectTrigger className="w-[200px] h-8 text-xs border-blue-200 bg-blue-50 text-blue-800 font-medium">
                                            <SelectValue placeholder="Assign PM" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200">
                                            <SelectItem value="unassigned" className="cursor-pointer text-xs text-gray-400">
                                                Unassigned
                                            </SelectItem>
                                            {projectManagers.map((pm) => (
                                                <SelectItem key={pm.id} value={pm.id} className="cursor-pointer text-xs">
                                                    {pm.name || pm.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {isAssigning && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                                </div>
                            ) : project.assignedManager ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                                    <UserCog className="w-3.5 h-3.5 text-green-600" />
                                    <span className="text-xs font-medium text-green-700">
                                        PM: {project.assignedManager.name || project.assignedManager.email}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                    No PM assigned
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 mt-4">

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Project Category</h4>
                                <div className="flex items-center gap-2">
                                    {project.projectCategory === "RESIDENTIAL" ? (
                                        <HomeIcon className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <Building2Icon className="w-4 h-4 text-gray-500" />
                                    )}
                                    <p className="text-sm text-gray-600">{project.projectCategory}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Service Type</h4>
                                <p className="text-sm text-gray-600">{(project.serviceType || "").replace(/_/g, " ")}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Project Size</h4>
                                <p className="text-sm text-gray-600">{project.projectSize}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Budget Range</h4>
                                <p className="text-sm text-orange-600 font-medium">
                                    {project.budgetRange || "Not specified"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Project Location</h4>
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                <span>{projectAddress}</span>
                            </div>
                            {project.projectAptSuiteUnit && (
                                <p className="text-sm text-gray-500 ml-6 mt-1">
                                    Apt/Suite/Unit: {project.projectAptSuiteUnit}
                                </p>
                            )}
                            {project.projectZipCode && (
                                <p className="text-sm text-gray-500 ml-6 mt-1">
                                    Zip Code: {project.projectZipCode}
                                </p>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Architectural Style</h4>
                            <p className="text-sm text-gray-600">{project.preferredArchitecturalStyle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Site Constraints</h4>
                                <p className="text-sm text-gray-600">{project.siteConstraints}</p>
                            </div>
                            {/* <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Sustainability Goals</h4>
                                <p className="text-sm text-gray-600">{project.sustainabilityGoals}</p>
                            </div> */}
                        </div>

                        {project.specialRequirements && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Special Requirements</h4>
                                <p className="text-sm text-gray-600">{project.specialRequirements}</p>
                            </div>
                        )}

                        {project.additionalComments && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Additional Comments</h4>
                                <p className="text-sm text-gray-600">{project.additionalComments}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Google Drive Link Card */}
                <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900"> Project Folder</h3>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                        Internal project folder for architects and project managers. Not visible to clients.
                    </p>

                    {/* Show link if exists */}
                    {project.driveLink && !isEditingDriveLink && (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                            <a
                                href={toExternalUrl(project.driveLink) ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium truncate max-w-[70%]"
                            >
                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{project.driveLink}</span>
                            </a>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={handleEditDriveLink}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Pencil className="w-3 h-3" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleDeleteDriveLink}
                                    disabled={isDeletingDriveLink}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    {isDeletingDriveLink ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3 h-3" />
                                    )}
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add/Edit Drive Link */}
                    {(!project.driveLink && !showDriveLinkInput) && (
                        <button
                            onClick={() => { setShowDriveLinkInput(true); setDriveLinkValue(""); }}
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 rounded-lg px-4 py-3 w-full justify-center hover:bg-blue-50 transition-colors"
                        >
                            <LinkIcon className="w-4 h-4" />
                            Add Project Folder Link
                        </button>
                    )}

                    {showDriveLinkInput && (
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="url"
                                value={driveLinkValue}
                                onChange={(e) => setDriveLinkValue(e.target.value)}
                                placeholder="Project Folder Link"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSaveDriveLink}
                                disabled={isUpdatingDriveLink}
                                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isUpdatingDriveLink ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                            </button>
                            <button
                                onClick={() => { setShowDriveLinkInput(false); setIsEditingDriveLink(false); setDriveLinkValue(""); }}
                                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* The external folder, shared with the client. Sits directly
                    below the internal one so the two are read together: above
                    is architect-only, below is what the client can see. */}
                <SharedFolderCard projectId={project.id} side="ARCHITECT" />

            </div>

            {/* Right Column */}
            <div className="space-y-6">
                {/* Client Info */}
                <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 font-medium">{fullClientName}</span>
                        </div>
                        {project.companyName && (
                            <div className="flex items-center gap-3">
                                <Building2Icon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">{project.companyName}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <MailIcon className="w-4 h-4 text-gray-400" />
                            <a href={`mailto:${project.email}`} className="text-sm text-blue-600 hover:underline">
                                {project.email}
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            <a href={`tel:${project.phone}`} className="text-sm text-gray-900 hover:underline">
                                {project.phone}
                            </a>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-start gap-2">
                                <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600">{fullAddress}</p>
                                    {project.aptSuiteUnit && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Apt/Suite/Unit: {project.aptSuiteUnit}
                                        </p>
                                    )}
                                    {project.zipCode && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Zipcode: {project.zipCode}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consultation Info */}
                <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Consultation Details</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-sm text-gray-900">{formatDate(project.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{project.appointmentTime}</span>
                        </div>
                        <div className="pt-2">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Appointment type:</span>{" "}
                                <span className="text-orange-600 font-medium">{project.appointmentType}</span>
                            </p>
                        </div>
                        {project.additionalNotes && (
                            <div className="pt-2 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Additional Notes</h4>
                                <p className="text-sm text-gray-600">{project.additionalNotes}</p>
                            </div>
                        )}

                        {/* Status & Progress */}
                        <div className="pt-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">Status Progress</span>
                                <span className="text-sm text-gray-600">
                                    {progress >= 100 ? "Completed" : getStatusLabel(project.status)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 text-right">{progress}% Complete</p>
                        </div>

                        {/* Manual status control — superseded by the automatic
                            phase-driven progress above. Kept for reference.

                        <Select
                            value={selectedStatus || project.status}
                            onValueChange={handleStatusChange}
                            disabled={isUpdating}
                        >
                            <SelectTrigger className="w-full bg-slate-700 text-white border-none hover:bg-slate-900">
                                <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-200 border-gray-200">
                                {STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-slate-300">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <button
                            onClick={handleSaveChanges}
                            disabled={!hasChanges || isUpdating}
                            className={`w-full mt-4 border-2 cursor-pointer text-sm font-medium py-2 rounded-md flex items-center justify-center transition-all ${hasChanges && !isUpdating
                                ? "border-teal-700 bg-teal-700 text-white hover:bg-teal-800"
                                : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2Icon className="w-4 h-4 mr-2" />
                                    {hasChanges ? "Save Changes" : "No Changes"}
                                </>
                            )}
                        </button>
                        */}
                    </div>
                </div>

                {/* Team Assignment Card */}
                {(isSuperAdmin || currentUser?.role === "PROJECT_MANAGER") && (
                    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Project Teams</h3>
                            </div>

                            <Select onValueChange={handleAssignTeam}>
                                <SelectTrigger className="w-[180px] h-8 text-xs border-purple-200 bg-purple-50 text-purple-800 font-medium">
                                    <SelectValue placeholder="Add/Remove Team" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200">
                                    {allTeams.map((team) => (
                                        <SelectItem key={team.id} value={team.id} className="cursor-pointer text-xs">
                                            {project.teams?.some(t => t.id === team.id) ? "✓ " : "+ "}{team.name}
                                        </SelectItem>
                                    ))}
                                    {allTeams.length === 0 && (
                                        <div className="p-2 text-xs text-gray-400 italic">No teams available</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {project.teams?.map((team) => (
                                    <Badge key={team.id} variant="secondary" className="bg-purple-100 text-purple-700 py-1 px-3 border-none flex items-center gap-2">
                                        {team.name}
                                        <button onClick={() => handleAssignTeam(team.id)} className="hover:text-purple-900">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {(!project.teams || project.teams.length === 0) && (
                                    <p className="text-xs text-gray-400 italic">No teams assigned yet.</p>
                                )}
                            </div>

                            {project.teams && project.teams.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">All Assigned Staff</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {project.teams.flatMap(t => t.members).reduce((acc: any[], curr) => {
                                            if (!acc.find(m => m.id === curr.id)) acc.push(curr);
                                            return acc;
                                        }, []).map((member) => (
                                            <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                                                    {member.avatar ? <img src={member.avatar} className="h-full w-full rounded-full object-cover" /> : member.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-medium text-gray-900 truncate">{member.name}</p>
                                                    <p className="text-[8px] text-gray-500 truncate">{member.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
