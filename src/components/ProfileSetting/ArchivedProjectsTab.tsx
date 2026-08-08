import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    RotateCcw,
    Trash2,
    Search,
    AlertCircle,
    Archive
} from "lucide-react";
import {
    useGetArchivedProjectsQuery,
    useUnarchiveProjectMutation,
    useDeleteProjectMutation
} from "@/redux/api/adminDashboard/proposalApi";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

export function ArchivedProjectsTab() {
    const currentUser = useAppSelector(selectCurrentUser);
    const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

    const { data: response, isLoading, isError } = useGetArchivedProjectsQuery();
    const [unarchiveProject] = useUnarchiveProjectMutation();
    const [deleteProject] = useDeleteProjectMutation();

    const [searchTerm, setSearchTerm] = useState("");
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
    const [confirmText, setConfirmText] = useState("");
    const [deletePassword, setDeletePassword] = useState("");

    const archivedProjects = response || [];

    const filteredProjects = archivedProjects.filter((p: any) =>
        p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRestore = async (id: string) => {
        try {
            await unarchiveProject(id).unwrap();
            toast.success("Project restored successfully");
        } catch (error) {
            toast.error("Failed to restore project");
        }
    };

    const handleDelete = async () => {
        if (confirmText.toLowerCase() !== "delete") {
            toast.error("Please type 'Delete' to confirm");
            return;
        }
        if (!deletePassword) {
            toast.error("Please enter your password to confirm");
            return;
        }

        try {
            await deleteProject({ id: projectToDelete.id, password: deletePassword }).unwrap();
            toast.success("Project permanently deleted");
            setDeleteConfirmOpen(false);
            setProjectToDelete(null);
            setConfirmText("");
            setDeletePassword("");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete project");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Error loading archived projects</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Archived Projects</h2>
                    <p className="text-sm text-gray-500">Manage projects that have been moved to the archive.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search archives..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="font-bold">Project Name</TableHead>
                            <TableHead className="font-bold">Client</TableHead>
                            <TableHead className="font-bold">Archived On</TableHead>
                            <TableHead className="font-bold">Status When Archived</TableHead>
                            <TableHead className="text-right font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                    <Archive className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                    No archived projects found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProjects.map((project: any) => (
                                <TableRow key={project.id} className="hover:bg-gray-50 transition-colors">
                                    <TableCell className="font-medium text-gray-900">
                                        {project.projectName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {project.clientFirstName} {project.clientLastName}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono tracking-tighter">
                                            {project.email}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {project.archivedAt ? new Date(project.archivedAt).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">
                                            {project.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-green-200 text-green-600 hover:bg-green-50"
                                                onClick={() => handleRestore(project.id)}
                                                title="Restore Project"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-1" />
                                                Restore
                                            </Button>
                                            {isSuperAdmin && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                    onClick={() => {
                                                        setProjectToDelete(project);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Permanent Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6" />
                            Permanent Deletion
                        </DialogTitle>
                        <DialogDescription>
                            You are about to permanently delete <strong>{projectToDelete?.projectName}</strong>. This action cannot be undone. All related data will be lost.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-6 space-y-4">
                        <p className="text-sm text-gray-600">
                            Please type <span className="font-bold text-red-600 px-1.5 py-0.5 bg-red-50 rounded border border-red-100 italic">Delete</span> below to confirm.
                        </p>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type 'Delete' to confirm"
                            className="border-red-200 focus:ring-red-500"
                        />
                        <p className="text-sm text-gray-600">
                            Enter your account password to confirm this permanent deletion.
                        </p>
                        <Input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Your password"
                            className="border-red-200 focus:ring-red-500"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setDeleteConfirmOpen(false);
                            setConfirmText("");
                            setDeletePassword("");
                        }}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleDelete}
                            disabled={confirmText.toLowerCase() !== "delete" || !deletePassword}
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
