import { useState } from "react";
import {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetAssignableMembersQuery,
  Team,
} from "@/redux/api/adminDashboard/proposalApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "@/components/ui/loader";
import { useCanEdit } from "@/hooks/useDashboardAccess";

/** "IN_PROGRESS" -> "In Progress", to match how status reads elsewhere. */
const formatProjectStatus = (status: string) =>
  status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Teams() {
  const canEdit = useCanEdit();
  const { data: teams, isLoading } = useGetTeamsQuery();
  const { data: assignableMembers } = useGetAssignableMembersQuery();

  const [createTeam] = useCreateTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const filteredMembers = assignableMembers?.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  ) || [];

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }
    try {
      await createTeam({ name: teamName, memberIds: selectedMemberIds }).unwrap();
      toast.success("Team created successfully");
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create team");
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !teamName.trim()) return;
    try {
      await updateTeam({ id: selectedTeam.id, name: teamName, memberIds: selectedMemberIds }).unwrap();
      toast.success("Team updated successfully");
      setIsEditModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to update team");
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteTeam(id).unwrap();
      toast.success("Team deleted successfully");
    } catch (error) {
      toast.error("Failed to delete team");
    }
  };

  const resetForm = () => {
    setTeamName("");
    setSelectedMemberIds([]);
    setSelectedTeam(null);
    setMemberSearch("");
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setSelectedMemberIds(team.members.map(m => m.id));
    setIsEditModalOpen(true);
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  if (isLoading) return <Loader />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center w-full justify-start md:justify-between gap-y-4 md:gap-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">Create and manage your drafting teams for project assignments.</p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={(open) => { setIsCreateModalOpen(open); if (!open) resetForm(); }}>
          {canEdit && (
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800 gap-2 shadow-lg hover:shadow-xl transition-all">
                <Plus size={18} />
                Create New Team
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-sm md:max-w-md bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Team Name</label>
                <Input
                  placeholder="e.g. Residential Drafting Team A"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-gray-50/50"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Select Members</label>
                  <span className="text-xs text-gray-500">{selectedMemberIds.length} selected</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <Input
                    placeholder="Search employees..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9 bg-gray-50/50 text-sm h-9"
                  />
                </div>

                <ScrollArea className="h-64 rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                  <div className="space-y-1">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer hover:bg-white border ${selectedMemberIds.includes(member.id) ? 'bg-white border-gray-200 shadow-sm' : 'border-transparent'
                          }`}
                        onClick={() => toggleMember(member.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {member.avatar ? <img src={member.avatar} className="h-full w-full rounded-full object-cover" /> : member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">{member.name}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{member.role}</p>
                          </div>
                        </div>
                        <Checkbox checked={selectedMemberIds.includes(member.id)} onCheckedChange={() => toggleMember(member.id)} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button className="bg-black text-white hover:bg-gray-800" onClick={handleCreateTeam}>Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams?.map((team) => (
          <div key={team.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              {canEdit && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => openEditModal(team)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteTeam(team.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{team.name}</h3>
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none font-semibold">
                {team.members.length} Members
              </Badge>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-none font-semibold">
                {team._count?.projects || 0} Projects
              </Badge>
            </div>

            <div className="space-y-3 mt-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Members</p>
              <div className="flex -space-x-2 overflow-hidden">
                {team.members.map((member) => (
                  <div key={member.id} className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 overflow-hidden" title={member.name}>
                    {member.avatar ? <img src={member.avatar} className="h-full w-full object-cover" /> : member.name.charAt(0)}
                  </div>
                ))}
                {team.members.length === 0 && <p className="text-xs text-gray-400 italic">No members assigned</p>}
              </div>
            </div>

            {/* Assigned work. The Projects badge above gives the number; this
                says which ones, so a manager can see what a team is on without
                opening every project. */}
            <div className="space-y-3 mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Assigned Projects
              </p>
              {team.projects && team.projects.length > 0 ? (
                <ul className="space-y-1.5">
                  {team.projects.map((project) => (
                    <li
                      key={project.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span
                        className="text-sm text-gray-700 truncate"
                        title={project.projectName}
                      >
                        {project.projectName}
                      </span>
                      <Badge
                        variant="secondary"
                        className="shrink-0 border-none bg-gray-100 text-[10px] font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        {formatProjectStatus(project.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No projects assigned
                </p>
              )}
            </div>
          </div>
        ))}

        {teams?.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Users size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No teams created yet</h3>
            <p className="text-gray-500 max-w-xs mt-1">Start by creating a team to organize your drafting staff and assign them to projects.</p>
            {canEdit && (
              <Button variant="outline" className="mt-6 gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} /> Create your first team
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Team Name</label>
              <Input
                placeholder="Team Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-gray-50/50"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Manage Members</label>
                <span className="text-xs text-gray-500">{selectedMemberIds.length} selected</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <Input
                  placeholder="Search employees..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9 bg-gray-50/50 text-sm h-9"
                />
              </div>

              <ScrollArea className="h-64 rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                <div className="space-y-1">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer hover:bg-white border ${selectedMemberIds.includes(member.id) ? 'bg-white border-gray-200 shadow-sm' : 'border-transparent'
                        }`}
                      onClick={() => toggleMember(member.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {member.avatar ? <img src={member.avatar} className="h-full w-full rounded-full object-cover" /> : member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{member.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{member.role}</p>
                        </div>
                      </div>
                      <Checkbox checked={selectedMemberIds.includes(member.id)} onCheckedChange={() => toggleMember(member.id)} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={handleUpdateTeam}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
