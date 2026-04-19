"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import {
  useGetTimecardByIdQuery,
  useUpdateTimecardMutation,
  useSubmitTimecardMutation,
  useDeleteTimecardMutation,
  useGetMyAssignedProjectsQuery
} from "@/redux/api/financialApi";
import { toast } from "sonner";
import { Plus, X, Loader2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface TimesheetEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timecardId: string;
  isReadOnly?: boolean;
}

const OVERHEAD_CATEGORIES = [
  "Bereavement",
  "Client Billing & Invoice Review",
  "Company & Group Meetings",
  "General Office",
  "General research/assembling information (not project-specific)",
  "Holiday",
  "Jury & Witness Duty",
  "PMCS Committee",
  "Professional Training & Development",
  "QA/QC Program development (not project-specific)",
  "Safety Training & Meetings",
  "Sick",
  "Overhead",
];

const DAYS_MAP = {
  Mon: "monday",
  Tue: "tuesday",
  Wed: "wednesday",
  Thu: "thursday",
  Fri: "friday",
  Sat: "saturday",
  Sun: "sunday",
};

const DAYS = Object.keys(DAYS_MAP) as Array<keyof typeof DAYS_MAP>;

export default function TimesheetEntryFormDialog({
  open,
  onOpenChange,
  timecardId,
  isReadOnly = false,
}: TimesheetEntryFormDialogProps) {
  const { data: timecard, isLoading: isFetching } = useGetTimecardByIdQuery(timecardId, { skip: !open });
  const { data: assignedProjects = [] } = useGetMyAssignedProjectsQuery(undefined, { skip: !open });
  const [updateTimecard, { isLoading: isUpdating }] = useUpdateTimecardMutation();
  const [submitTimecard, { isLoading: isSubmitting }] = useSubmitTimecardMutation();
  const [deleteTimecard, { isLoading: isDeleting }] = useDeleteTimecardMutation();

  const [overheadHours, setOverheadHours] = useState<Record<string, Record<string, string>>>({});

  // Task 1: New billable entries state
  const [billableEntries, setBillableEntries] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [entryDescription, setEntryDescription] = useState<string>("");

  const currentProjectPhases = useMemo(() => {
    const proj = assignedProjects.find((p: any) => p.id === selectedProject);
    return proj?.phases || [];
  }, [selectedProject, assignedProjects]);

  // Initialize data when timecard is fetched
  useEffect(() => {
    if (timecard) {
      // Initialize overhead
      const ohHours: Record<string, Record<string, string>> = {};
      OVERHEAD_CATEGORIES.forEach(cat => {
        ohHours[cat] = { Mon: "0", Tue: "0", Wed: "0", Thu: "0", Fri: "0", Sat: "0", Sun: "0" };
      });

      if (timecard.entries) {
        timecard.entries.forEach((entry: any) => {
          if (OVERHEAD_CATEGORIES.includes(entry.category)) {
            ohHours[entry.category] = {
              Mon: String(entry.monday),
              Tue: String(entry.tuesday),
              Wed: String(entry.wednesday),
              Thu: String(entry.thursday),
              Fri: String(entry.friday),
              Sat: String(entry.saturday),
              Sun: String(entry.sunday),
            };
          }
        });
      }
      setOverheadHours(ohHours);

      // Initialize billable entries
      if (timecard.billableEntries) {
        setBillableEntries(timecard.billableEntries.map((be: any) => ({
          ...be,
          hours: {
            Mon: String(be.monday),
            Tue: String(be.tuesday),
            Wed: String(be.wednesday),
            Thu: String(be.thursday),
            Fri: String(be.friday),
            Sat: String(be.saturday),
            Sun: String(be.sunday),
          }
        })));
      } else {
        setBillableEntries([]);
      }
    }
  }, [timecard]);

  const handleHourChange = (category: string, day: string, value: string) => {
    if (isReadOnly) return;
    setOverheadHours((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [day]: value,
      },
    }));
  };

  const handleBillableHourChange = (index: number, day: string, value: string) => {
    if (isReadOnly) return;
    const newEntries = [...billableEntries];
    newEntries[index].hours[day] = value;
    setBillableEntries(newEntries);
  };

  const addBillableEntryRow = () => {
    if (!selectedProject || !selectedPhase) {
      toast.error("Please select a project and phase");
      return;
    }

    const project = assignedProjects.find((p: any) => p.id === selectedProject);

    setBillableEntries([
      ...billableEntries,
      {
        projectRequestId: selectedProject,
        projectName: project?.projectName,
        phaseName: selectedPhase,
        description: entryDescription,
        hours: { Mon: "0", Tue: "0", Wed: "0", Thu: "0", Fri: "0", Sat: "0", Sun: "0" }
      }
    ]);

    // Reset inputs
    setSelectedPhase("");
    setEntryDescription("");
  };

  const removeBillableEntryRow = (index: number) => {
    if (isReadOnly) return;
    setBillableEntries(billableEntries.filter((_, i) => i !== index));
  };

  const calculateRowTotal = (hours: Record<string, string>) => {
    return Object.values(hours).reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
  };

  const totalBillable = useMemo(() => {
    return billableEntries.reduce((sum, entry) => sum + calculateRowTotal(entry.hours), 0);
  }, [billableEntries]);

  const totalOverhead = useMemo(() => {
    return Object.values(overheadHours).reduce((sum, hours) => sum + calculateRowTotal(hours), 0);
  }, [overheadHours]);

  const handleSave = async (isSubmittingAction = false) => {
    try {
      // Prepare entries
      const entries = Object.entries(overheadHours).map(([category, hours]) => ({
        category,
        monday: parseFloat(hours.Mon) || 0,
        tuesday: parseFloat(hours.Tue) || 0,
        wednesday: parseFloat(hours.Wed) || 0,
        thursday: parseFloat(hours.Thu) || 0,
        friday: parseFloat(hours.Fri) || 0,
        saturday: parseFloat(hours.Sat) || 0,
        sunday: parseFloat(hours.Sun) || 0,
      }));

      const preparedBillableEntries = billableEntries.map(be => ({
        projectRequestId: be.projectRequestId,
        projectName: be.projectName,
        phaseName: be.phaseName,
        description: be.description,
        monday: parseFloat(be.hours.Mon) || 0,
        tuesday: parseFloat(be.hours.Tue) || 0,
        wednesday: parseFloat(be.hours.Wed) || 0,
        thursday: parseFloat(be.hours.Thu) || 0,
        friday: parseFloat(be.hours.Fri) || 0,
        saturday: parseFloat(be.hours.Sat) || 0,
        sunday: parseFloat(be.hours.Sun) || 0,
      }));

      await updateTimecard({
        id: timecardId,
        entries,
        billableEntries: preparedBillableEntries,
        billableHours: totalBillable
      }).unwrap();

      if (isSubmittingAction) {
        await submitTimecard(timecardId).unwrap();
        toast.success("Timecard submitted successfully");
        onOpenChange(false);
      } else {
        toast.success("Timecard updated successfully");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "An error occurred");
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this timecard?")) {
      try {
        await deleteTimecard(timecardId).unwrap();
        toast.success("Timecard deleted");
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to delete");
      }
    }
  };

  if (isFetching) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1000px] bg-white text-black p-0 overflow-hidden">
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold tracking-tight">
              Weekly Timesheet Entry
              <span className="ml-3 text-sm font-medium text-gray-400">
                Week Ending: {timecard?.weekEnding ? new Date(timecard.weekEnding).toLocaleDateString() : ""}
              </span>
            </DialogTitle>
            <div className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${timecard?.status === "APPROVED" ? "bg-green-100 text-green-700" :
                timecard?.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
              }`}>
              {timecard?.status || "DRAFT"}
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-8 font-semibold">

          {/* Section: Project Selectors */}
          {!isReadOnly && (
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Billable Project Hours
              </h3>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">Select Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Pick a Project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedProjects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.projectName}</SelectItem>
                      ))}
                      {assignedProjects.length === 0 && <div className="p-2 text-xs text-gray-400 italic">No assigned projects found</div>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">Select Phase</label>
                  <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={!selectedProject}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Pick a Phase..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProjectPhases.map((ph: any) => (
                        <SelectItem key={ph.id} value={ph.name}>{ph.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">Brief Description</label>
                  <Input
                    placeholder="What did you work on?"
                    className="bg-white border-gray-200 text-xs"
                    value={entryDescription}
                    onChange={(e) => setEntryDescription(e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button
                    onClick={addBillableEntryRow}
                    className="w-full bg-black text-white hover:bg-gray-800"
                    disabled={!selectedPhase}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Section: Billable Hours Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 px-1">
              Billable Project Entries
            </h3>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-900 text-white uppercase tracking-wider font-black text-[10px]">
                  <tr>
                    <th className="px-4 py-3 min-w-[200px]">Project & Phase</th>
                    <th className="px-4 py-3 min-w-[150px]">Description</th>
                    {DAYS.map(day => <th key={day} className="px-2 py-3 text-center w-14">{day}</th>)}
                    <th className="px-4 py-3 text-center w-20">Total</th>
                    {!isReadOnly && <th className="px-4 py-3 text-center w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {billableEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900">{entry.projectName}</div>
                        <div className="text-[10px] text-blue-600 uppercase font-black tracking-tight">{entry.phaseName}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-500 italic max-w-xs truncate">
                        {entry.description || "--"}
                      </td>
                      {DAYS.map(day => (
                        <td key={day} className="px-1 py-4">
                          <input
                            type="number"
                            step="0.25"
                            className="w-full h-9 bg-gray-50 border border-gray-200 rounded text-center focus:ring-1 focus:ring-black outline-none disabled:bg-gray-100 disabled:text-gray-400 font-bold"
                            value={entry.hours[day]}
                            min="0"
                            max="24"
                            onChange={(e) => handleBillableHourChange(idx, day, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-4 text-center">
                        <div className="font-black text-black bg-gray-100/50 py-1 rounded w-12 mx-auto">
                          {calculateRowTotal(entry.hours).toFixed(1)}
                        </div>
                      </td>
                      {!isReadOnly && (
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => removeBillableEntryRow(idx)} className="text-gray-300 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {billableEntries.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-gray-400 italic bg-gray-50/30">
                        No billable entries added yet. Use the selector above to log project hours.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-blue-50/50 border-t border-blue-100">
                  <tr className="font-black">
                    <td colSpan={9} className="px-4 py-3 text-right text-blue-900 text-[10px] uppercase">Total Billable Hours:</td>
                    <td className="px-4 py-3 text-center text-blue-900 bg-blue-100/50">{totalBillable.toFixed(1)}</td>
                    {!isReadOnly && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section: Overhead Hours Table */}
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 px-1">
              Studio Overhead (Non-Project)
            </h3>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-500 uppercase tracking-wider font-black text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Expense Category</th>
                    {DAYS.map(day => <th key={day} className="px-2 py-3 text-center w-14">{day}</th>)}
                    <th className="px-4 py-3 text-center w-20">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {OVERHEAD_CATEGORIES.map((cat) => (
                    <tr key={cat} className="hover:bg-gray-50/30">
                      <td className="px-4 py-3 text-gray-700 font-bold">{cat}</td>
                      {DAYS.map(day => (
                        <td key={day} className="px-1 py-3">
                          <input
                            type="number"
                            step="0.25"
                            className="w-full h-8 bg-white border border-gray-200 rounded text-center focus:ring-1 focus:ring-black outline-none disabled:bg-gray-50 disabled:text-gray-400 font-bold"
                            value={overheadHours[cat]?.[day] || "0"}
                            min="0"
                            onChange={(e) => handleHourChange(cat, day, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <div className="text-gray-400 font-bold">
                          {calculateRowTotal(overheadHours[cat] || {}).toFixed(1)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100/80 border-t border-gray-200">
                  <tr className="font-black">
                    <td colSpan={8} className="px-4 py-3 text-right text-gray-500 text-[10px] uppercase">Total Overhead:</td>
                    <td className="px-4 py-3 text-center text-gray-900">{totalOverhead.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="bg-black text-white p-6 rounded-2xl shadow-xl flex justify-between items-center group">
            <div className="flex gap-10">
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Grand Total Time</div>
                <div className="text-3xl font-black">{(totalBillable + totalOverhead).toFixed(1)} <span className="text-sm text-gray-400">Hours</span></div>
              </div>
              <div className="w-[1px] bg-gray-800"></div>
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Utilization Rate</div>
                <div className="text-3xl font-black text-blue-400">
                  {(totalBillable + totalOverhead) > 0 ? ((totalBillable / (totalBillable + totalOverhead)) * 100).toFixed(0) : "0"}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 flex items-center justify-end gap-1">
                <Info size={12} /> Timesheet Policy
              </div>
              <p className="text-[10px] text-gray-400 max-w-[200px] leading-tight group-hover:text-gray-200 transition-colors">
                Please ensure all entries are accurate. Correct project allocation is vital for financial tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center">
          <div className="flex gap-2">
            {!isReadOnly && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold"
              >
                {isDeleting ? "Deleting..." : "Delete Draft"}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-bold px-6"
            >
              Close
            </Button>
            {!isReadOnly && (
              <>
                <Button
                  onClick={() => handleSave(false)}
                  disabled={isUpdating}
                  className="bg-gray-100 text-black hover:bg-gray-200 font-bold px-6 border-none"
                >
                  {isUpdating ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isUpdating || isSubmitting}
                  className="bg-black text-white hover:bg-gray-800 font-black uppercase tracking-widest px-8 shadow-lg shadow-black/10 transition-all active:scale-95"
                >
                  {isSubmitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
