import { ProjectRequest } from "@/redux/api/adminDashboard/proposalApi";
import {
    UserIcon,
    MailIcon,
    PhoneIcon,
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    CheckCircle2Icon,
    Building2Icon,
    HomeIcon,
    Loader2,
    LinkIcon,
    ExternalLink,
    Pencil,
    Trash2,
    UserCog,
} from "lucide-react";
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
    useUpdateProjectRequestStatusMutation,
    useUpdateProjectDriveLinkMutation,
    useDeleteProjectDriveLinkMutation,
    useGetProjectManagersQuery,
    useAssignProjectManagerMutation,
} from "@/redux/api/adminDashboard/proposalApi";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

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

    const [selectedStatus, setSelectedStatus] = useState<ProjectRequest["status"] | null>(null);
    const [updateStatus, { isLoading: isUpdating }] = useUpdateProjectRequestStatusMutation();
    const [updateDriveLink, { isLoading: isUpdatingDriveLink }] = useUpdateProjectDriveLinkMutation();
    const [deleteDriveLink, { isLoading: isDeletingDriveLink }] = useDeleteProjectDriveLinkMutation();
    const [assignPM, { isLoading: isAssigning }] = useAssignProjectManagerMutation();
    const { data: pmData } = useGetProjectManagersQuery(undefined, { skip: !isSuperAdmin });

    const projectManagers = pmData?.data || [];

    // Drive link state
    const [showDriveLinkInput, setShowDriveLinkInput] = useState(false);
    const [driveLinkValue, setDriveLinkValue] = useState("");
    const [isEditingDriveLink, setIsEditingDriveLink] = useState(false);

    useEffect(() => {
        if (project) {
            setSelectedStatus(project.status);
            setShowDriveLinkInput(false);
            setIsEditingDriveLink(false);
            setDriveLinkValue("");
        }
    }, [project]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value as ProjectRequest["status"]);
    };

    const handleSaveChanges = async () => {
        if (!selectedStatus || selectedStatus === project.status) {
            toast.info("No changes to save");
            return;
        }

        try {
            await updateStatus({
                id: project.id,
                status: selectedStatus,
                notes: "Status updated from admin panel",
            }).unwrap();
            toast.success("Status updated successfully!");
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status. Please try again.");
        }
    };

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
            toast.error("Please enter a Google Drive link");
            return;
        }
        try {
            await updateDriveLink({ id: project.id, driveLink: link }).unwrap();
            toast.success("Google Drive link saved successfully!");
            setShowDriveLinkInput(false);
            setIsEditingDriveLink(false);
            setDriveLinkValue("");
        } catch (error) {
            console.error("Failed to save drive link:", error);
            toast.error("Failed to save Google Drive link.");
        }
    };

    const handleDeleteDriveLink = async () => {
        try {
            await deleteDriveLink(project.id).unwrap();
            toast.success("Google Drive link removed!");
        } catch (error) {
            console.error("Failed to remove drive link:", error);
            toast.error("Failed to remove Google Drive link.");
        }
    };

    const handleEditDriveLink = () => {
        setDriveLinkValue(project.driveLink || "");
        setIsEditingDriveLink(true);
        setShowDriveLinkInput(true);
    };

    const getStatusLabel = (status: string) => {
        return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
    };

    const getProgress = (status: string) => {
        switch (status) {
            case "PENDING": return 25;
            case "REVIEWED": return 50;
            case "SCHEDULED": return 75;
            case "ACTIVE": return 90;
            case "COMPLETED": return 100;
            default: return 0;
        }
    };

    const progress = getProgress(selectedStatus || project.status);
    const hasChanges = selectedStatus !== project.status;
    const fullClientName = `${project.clientFirstName} ${project.clientMiddleName} ${project.clientLastName}`.trim();
    const fullAddress = `${project.streetAddress}, ${project.city}, ${project.state}, ${project.country}`;
    const projectAddress = `${project.projectStreetAddress}, ${project.projectCity}, ${project.projectState}, ${project.projectCountry}`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Project Details */}
            <div className="lg:col-span-2 space-y-6">

                <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-2">
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
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">Sustainability Goals</h4>
                                <p className="text-sm text-gray-600">{project.sustainabilityGoals}</p>
                            </div>
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
                            <h3 className="text-lg font-semibold text-gray-900">Google Drive Folder</h3>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                        Internal Google Drive folder for architects and project managers. Not visible to clients.
                    </p>

                    {/* Show link if exists */}
                    {project.driveLink && !isEditingDriveLink && (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                            <a
                                href={project.driveLink}
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
                            Add Google Drive Link
                        </button>
                    )}

                    {showDriveLinkInput && (
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="url"
                                value={driveLinkValue}
                                onChange={(e) => setDriveLinkValue(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
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
                                <p className="text-sm text-gray-600">{fullAddress}</p>
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
                                    {getStatusLabel(selectedStatus || project.status)}
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

                        {/* Status Dropdown */}
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

                        {/* Save Changes Button */}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
