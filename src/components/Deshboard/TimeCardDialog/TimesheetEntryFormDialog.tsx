"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { downloadTimesheetPDF, timesheetFileName } from "@/utils/timesheetPdf";
import {
  useGetTimecardByIdQuery,
  useUpdateTimecardMutation,
  useSubmitTimecardMutation,
  useDeleteTimecardMutation,
  useGetMyAssignedProjectsQuery
} from "@/redux/api/financialApi";
import { toast } from "sonner";
import { Plus, X, Loader2, Info, Download, AlertTriangle } from "lucide-react";
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

  // Bi-weekly: activeWeek controls which week tab is shown (1 or 2)
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);

  // Overhead hours keyed by "projectRequestId::phaseName::weekNum"
  // Each value is Record<category, Record<day, value>>
  const [overheadMap, setOverheadMap] = useState<Record<string, Record<string, Record<string, string>>>>({});

  // Billable entries state — each entry has entryWeek
  const [billableEntries, setBillableEntries] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  /** The contract the phase belongs to — the original proposal or an amendment. */
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [entryDescription, setEntryDescription] = useState<string>("");

  /** Contracts (original + amendments) on the selected project. */
  const currentProjectContracts = useMemo(() => {
    const proj = assignedProjects.find((p: any) => p.id === selectedProject);
    return proj?.contracts || [];
  }, [selectedProject, assignedProjects]);

  const currentContract = useMemo(
    () =>
      currentProjectContracts.find(
        (c: any) => (c.id ?? "unassigned") === selectedContract,
      ),
    [currentProjectContracts, selectedContract],
  );

  /** Phases belonging to the chosen contract only. */
  const currentProjectPhases = useMemo(() => {
    if (currentContract) return currentContract.phases || [];
    // Older payloads have no contract grouping — fall back to the flat list.
    const proj = assignedProjects.find((p: any) => p.id === selectedProject);
    return proj?.phases || [];
  }, [currentContract, selectedProject, assignedProjects]);

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    setSelectedContract("");
    setSelectedPhase("");
  };

  const handleContractChange = (value: string) => {
    setSelectedContract(value);
    setSelectedPhase("");
  };

  // Helper to get empty hours for a week
  const getEmptyHours = () => ({
    Mon: "0", Tue: "0", Wed: "0", Thu: "0", Fri: "0", Sat: "0", Sun: "0"
  });

  // Helper to get empty overhead set for a phase
  const getEmptyOverhead = () => {
    const oh: Record<string, Record<string, string>> = {};
    OVERHEAD_CATEGORIES.forEach(cat => {
      oh[cat] = getEmptyHours();
    });
    return oh;
  };

  // Initialize data when timecard is fetched
  useEffect(() => {
    if (timecard) {
      const newMap: Record<string, Record<string, Record<string, string>>> = {};

      if (timecard.entries) {
        timecard.entries.forEach((entry: any) => {
          const projId = entry.projectRequestId || "GENERAL";
          const phase = entry.phaseName || "GENERAL";
          const week = entry.entryWeek || 1;
          const key = `${projId}::${phase}::${week}`;

          if (!newMap[key]) {
            newMap[key] = getEmptyOverhead();
          }

          if (OVERHEAD_CATEGORIES.includes(entry.category)) {
            newMap[key][entry.category] = {
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
      setOverheadMap(newMap);

      // Initialize billable entries
      if (timecard.billableEntries) {
        setBillableEntries(timecard.billableEntries.map((be: any) => ({
          ...be,
          entryWeek: be.entryWeek || 1,
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
    if (!selectedProject || !selectedPhase) {
      toast.error("Select a project and phase first to enter non-billable hours");
      return;
    }

    const key = `${selectedProject}::${selectedPhase}::${activeWeek}`;
    setOverheadMap((prev) => {
      const currentPhaseOH = prev[key] || getEmptyOverhead();
      return {
        ...prev,
        [key]: {
          ...currentPhaseOH,
          [category]: {
            ...currentPhaseOH[category],
            [day]: value,
          },
        },
      };
    });
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
        // Records which contract the hours belong to, so a phase name shared by
        // the original contract and an amendment stays unambiguous.
        proposalId: currentContract?.id || undefined,
        proposalNumber: currentContract?.proposalNumber || undefined,
        stageId:
          currentProjectPhases.find((ph: any) => ph.name === selectedPhase)?.id ||
          undefined,
        phaseName: selectedPhase,
        description: entryDescription,
        entryWeek: activeWeek,
        hours: { Mon: "0", Tue: "0", Wed: "0", Thu: "0", Fri: "0", Sat: "0", Sun: "0" }
      }
    ]);

    // Only reset description — keep project/phase selected so non-billable section stays active
    setEntryDescription("");
  };

  const removeBillableEntryRow = (index: number) => {
    if (isReadOnly) return;
    setBillableEntries(billableEntries.filter((_, i) => i !== index));
  };

  const calculateRowTotal = (hours: Record<string, string>) => {
    return Object.values(hours).reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
  };

  // Filtered entries for current week tab
  const weekBillableEntries = useMemo(() => {
    return billableEntries.filter(e => (e.entryWeek || 1) === activeWeek);
  }, [billableEntries, activeWeek]);

  // Indices mapping: map filtered index to actual index in billableEntries
  const weekBillableIndices = useMemo(() => {
    return billableEntries.reduce<number[]>((acc, e, idx) => {
      if ((e.entryWeek || 1) === activeWeek) acc.push(idx);
      return acc;
    }, []);
  }, [billableEntries, activeWeek]);

  const totalBillable = useMemo(() => {
    return billableEntries.reduce((sum, entry) => sum + calculateRowTotal(entry.hours), 0);
  }, [billableEntries]);

  const totalOverhead = useMemo(() => {
    let sum = 0;
    Object.values(overheadMap).forEach(phaseOH => {
      Object.values(phaseOH).forEach(catHours => {
        sum += calculateRowTotal(catHours);
      });
    });
    return sum;
  }, [overheadMap]);

  const weekBillableTotal = useMemo(() => {
    return weekBillableEntries.reduce((sum, e) => sum + calculateRowTotal(e.hours), 0);
  }, [weekBillableEntries]);

  const weekOverheadTotal = useMemo(() => {
    let sum = 0;
    const currentKeyPart = `::${activeWeek}`;
    Object.entries(overheadMap).forEach(([key, phaseOH]) => {
      if (key.endsWith(currentKeyPart)) {
        Object.values(phaseOH).forEach(catHours => {
          sum += calculateRowTotal(catHours);
        });
      }
    });
    return sum;
  }, [overheadMap, activeWeek]);

  // Derive a summary of all phases that have any hours logged for the active week
  const loggedPhasesSummary = useMemo(() => {
    const phasesMap = new Map<string, { projId: string; projectName: string; phase: string; proposalId?: string; total: number }>();

    // Add billable phases
    billableEntries.forEach(be => {
      if ((be.entryWeek || 1) === activeWeek) {
        const key = `${be.projectRequestId}::${be.phaseName}`;
        const existing = phasesMap.get(key) || {
          projId: be.projectRequestId,
          projectName: be.projectName || "Unknown",
          phase: be.phaseName,
          proposalId: be.proposalId,
          total: 0
        };
        existing.total += calculateRowTotal(be.hours);
        phasesMap.set(key, existing);
      }
    });

    // Add non-billable phases from overheadMap
    Object.entries(overheadMap).forEach(([key, phaseOH]) => {
      const [projId, phase, weekStr] = key.split("::");
      if (parseInt(weekStr) === activeWeek) {
        const ohKey = `${projId}::${phase}`;
        const existing = phasesMap.get(ohKey) || {
          projId: projId,
          projectName: assignedProjects.find((p: any) => p.id === projId)?.projectName || "Unknown",
          phase: phase,
          total: 0
        };
        Object.values(phaseOH).forEach(catHours => {
          existing.total += calculateRowTotal(catHours);
        });
        phasesMap.set(ohKey, existing);
      }
    });

    return Array.from(phasesMap.values());
  }, [billableEntries, overheadMap, activeWeek, assignedProjects]);

  const handleSave = async (isSubmittingAction = false) => {
    try {
      // Prepare overhead entries (Flatten the map)
      const entries: any[] = [];
      Object.entries(overheadMap).forEach(([key, phaseOH]) => {
        const [projId, phase, weekStr] = key.split("::");
        Object.entries(phaseOH).forEach(([category, hours]) => {
          const rowTotal = calculateRowTotal(hours);
          if (rowTotal === 0) return; // Skip empty rows

          // Overhead is entered against the same project/phase selection as the
          // billable rows, so it inherits that line's contract.
          const owningEntry = billableEntries.find(
            (be) => be.projectRequestId === projId && be.phaseName === phase,
          );

          entries.push({
            category,
            projectRequestId: projId === "GENERAL" ? null : projId,
            proposalId: owningEntry?.proposalId || undefined,
            proposalNumber: owningEntry?.proposalNumber || undefined,
            stageId: owningEntry?.stageId || undefined,
            phaseName: phase === "GENERAL" ? null : phase,
            entryWeek: parseInt(weekStr) || 1,
            monday: parseFloat(hours.Mon) || 0,
            tuesday: parseFloat(hours.Tue) || 0,
            wednesday: parseFloat(hours.Wed) || 0,
            thursday: parseFloat(hours.Thu) || 0,
            friday: parseFloat(hours.Fri) || 0,
            saturday: parseFloat(hours.Sat) || 0,
            sunday: parseFloat(hours.Sun) || 0,
          });
        });
      });

      const preparedBillableEntries = billableEntries.map(be => ({
        projectRequestId: be.projectRequestId,
        projectName: be.projectName,
        proposalId: be.proposalId || undefined,
        proposalNumber: be.proposalNumber || undefined,
        stageId: be.stageId || undefined,
        phaseName: be.phaseName,
        description: be.description,
        entryWeek: be.entryWeek || 1,
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

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await downloadTimesheetPDF('timesheet-modal-content', timesheetFileName(timecard));
    } catch (err: any) {
      const msg = err?.message || String(err) || 'Unknown error';
      console.error('PDF generation failed:', err);
      toast.error(`PDF Error: ${msg}`);
    } finally {
      setIsGeneratingPDF(false);
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
        <DialogContent className="w-[95vw] sm:w-full max-w-[95vw] sm:max-w-[1100px] bg-white text-black p-0 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-[95vw] sm:max-w-[1100px] max-h-[90vh] flex flex-col bg-white text-black p-0 overflow-hidden rounded-2xl">
        <div id="timesheet-modal-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-bold tracking-tight">
                Bi-Weekly Timesheet
                <span className="ml-3 flex flex-col sm:flex-row text-sm font-medium text-gray-400">
                  {timecard?.weekStarting ? new Date(timecard.weekStarting).toLocaleDateString() : ""} — {timecard?.weekEnding ? new Date(timecard.weekEnding).toLocaleDateString() : ""}
                </span>
                {timecard?.payPeriod && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Period {timecard.payPeriod}</span>}
              </DialogTitle>
              <div className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${timecard?.status === "APPROVED" ? "bg-green-100 text-green-700" :
                timecard?.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                }`}>
                {timecard?.status || "DRAFT"}
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-6 sm:space-y-8 font-semibold">

            {/* A denied timecard comes back here with its entries intact —
                correct against the reason below and resubmit. */}
            {timecard?.status === "REJECTED" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                    Denied — correction needed
                  </p>
                  <p className="text-xs text-red-800 mt-1 whitespace-pre-wrap">
                    {timecard.rejectionNote || "No reason was provided."}
                  </p>
                  <p className="text-[10px] text-red-400 mt-1.5 font-bold italic">
                    Your entries were kept. Fix them below and resubmit for approval.
                  </p>
                </div>
              </div>
            )}

            {/* Bi-Weekly Tab Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0">
              {([1, 2] as const).map((week) => (
                <button
                  key={week}
                  onClick={() => setActiveWeek(week)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeWeek === week
                    ? "bg-black text-white shadow-md"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                >
                  Entry {week} — Week {week}
                </button>
              ))}
            </div>

            {/* Section: Project Selectors (Always visible to allow switching context for non-billable view) */}
            <div className="bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Plus className="h-4 w-4" /> Select Project & Phase
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">Select Project</label>
                  <Select value={selectedProject} onValueChange={handleProjectChange}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Pick a Project..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {assignedProjects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.projectName}</SelectItem>
                      ))}
                      {assignedProjects.length === 0 && <div className="p-2 text-xs text-gray-400 italic">No assigned projects found</div>}
                    </SelectContent>
                  </Select>
                </div>
                {/* The original contract and every amendment on the project.
                    Phases are scoped to whichever is picked here. */}
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">Select Contract</label>
                  <Select
                    value={selectedContract}
                    onValueChange={handleContractChange}
                    disabled={!selectedProject}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Pick a Contract" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {currentProjectContracts.map((c: any) => (
                        <SelectItem key={c.id ?? "unassigned"} value={c.id ?? "unassigned"}>
                          <span className="flex items-center gap-2">
                            {c.proposalNumber || c.title}
                            {c.isAmendment && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                                Amendment
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                      {currentProjectContracts.length === 0 && (
                        <div className="p-2 text-xs text-gray-400 italic">No contracts on this project</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-2">
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">Select Phase</label>
                  <Select
                    value={selectedPhase}
                    onValueChange={setSelectedPhase}
                    disabled={!selectedContract}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Pick a Phase" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {currentProjectPhases.map((ph: any) => (
                        <SelectItem key={ph.id} value={ph.name}>{ph.name}</SelectItem>
                      ))}
                      {currentProjectPhases.length === 0 && (
                        <div className="p-2 text-xs text-gray-400 italic">No phases on this contract</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {!isReadOnly && (
                  <>
                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">Brief Description</label>
                      <Input
                        placeholder="What did you work on?"
                        className="bg-white border-gray-200 text-xs"
                        value={entryDescription}
                        onChange={(e) => setEntryDescription(e.target.value)}
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex items-end">
                      <Button
                        onClick={addBillableEntryRow}
                        className="w-full bg-black text-white hover:bg-gray-800"
                        disabled={!selectedPhase}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Logged Phases Quick Switcher */}
            {loggedPhasesSummary.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {loggedPhasesSummary.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedProject(item.projId);
                      setSelectedContract(item.proposalId ?? "unassigned");
                      setSelectedPhase(item.phase);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all border ${selectedProject === item.projId && selectedPhase === item.phase
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                      }`}
                  >
                    {item.projectName} - {item.phase} ({item.total.toFixed(1)}h)
                  </button>
                ))}
              </div>
            )}

            {/* Section: Billable Hours Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 px-1">
                Billable Project Entries
              </h3>
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto w-full max-w-full scrollbar-hide">
                  <table className="w-full text-xs text-left min-w-[800px]">
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
                      {weekBillableEntries.map((entry, filteredIdx) => {
                        const actualIdx = weekBillableIndices[filteredIdx];
                        return (
                          <tr key={actualIdx} className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedProject === entry.projectRequestId && selectedPhase === entry.phaseName ? "bg-blue-50/50" : ""}`}
                            onClick={() => {
                              setSelectedProject(entry.projectRequestId);
                              setSelectedContract(entry.proposalId ?? "unassigned");
                              setSelectedPhase(entry.phaseName);
                            }}
                          >
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
                                  onChange={(e) => handleBillableHourChange(actualIdx, day, e.target.value)}
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
                                <button onClick={() => removeBillableEntryRow(actualIdx)} className="text-gray-300 hover:text-red-500">
                                  <X size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {weekBillableEntries.length === 0 && (
                        <tr>
                          <td colSpan={11} className="px-4 py-10 text-center text-gray-400 italic bg-gray-50/30">
                            No billable entries for Week {activeWeek} yet. Use the selector above to log project hours.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-blue-50/50 border-t border-blue-100">
                      <tr className="font-black">
                        <td colSpan={9} className="px-4 py-3 text-right text-blue-900 text-[10px] uppercase">Week {activeWeek} Billable:</td>
                        <td className="px-4 py-3 text-center text-blue-900 bg-blue-100/50">{weekBillableTotal.toFixed(1)}</td>
                        {!isReadOnly && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Section: Overhead Hours Table */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">Non-Billable Hours (Labor Overhead)</h3>
                  {selectedProject && selectedPhase ? (
                    <p className="text-[10px] text-blue-600 font-bold mt-1">
                      Currently editing for: {assignedProjects.find(p => p.id === selectedProject)?.projectName} - {selectedPhase}
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-wider">
                      * Select a project and phase above to enter overhead for that phase
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Week {activeWeek} Non-Billable Total:</div>
                  <div className="text-sm font-black text-gray-900 bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100">
                    {weekOverheadTotal.toFixed(1)}h
                  </div>
                </div>
              </div>

              <div className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto w-full max-w-full scrollbar-hide">
                  <table className="w-full text-xs text-left min-w-[800px]">
                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-black text-[9px]">
                      <tr>
                        <th className="px-6 py-4 w-1/3">Category</th>
                        {DAYS.map(day => <th key={day} className="px-2 py-4 text-center">{day}</th>)}
                        <th className="px-4 py-4 text-right pr-6">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {OVERHEAD_CATEGORIES.map((category) => {
                        const key = `${selectedProject}::${selectedPhase}::${activeWeek}`;
                        const currentPhaseOH = overheadMap[key] || getEmptyOverhead();
                        const days = currentPhaseOH[category] || getEmptyHours();

                        return (
                          <tr key={category} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-3 font-bold text-gray-600 group-hover:text-black transition-colors">
                              {category}
                            </td>
                            {DAYS.map((day) => (
                              <td key={day} className="px-2 py-3">
                                <input
                                  type="number"
                                  step="0.25"
                                  value={days[day]}
                                  onChange={(e) => handleHourChange(category, day, e.target.value)}
                                  disabled={isReadOnly || !selectedProject || !selectedPhase}
                                  className={`h-9 w-12 mx-auto text-center font-bold bg-white border border-gray-200 rounded-lg text-xs outline-none transition-all ${!selectedProject || !selectedPhase
                                    ? "bg-gray-50 text-gray-200 cursor-not-allowed opacity-50"
                                    : "focus:ring-1 focus:ring-black focus:border-black"
                                    }`}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3 text-right font-black text-gray-900 pr-6">
                              <span className="bg-gray-100/50 px-2.5 py-1 rounded-lg">
                                {calculateRowTotal(days).toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-black text-white p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 group">
              <div className="flex flex-row justify-between w-full md:w-auto gap-6 sm:gap-10">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Grand Total Time</div>
                  <div className="text-2xl sm:text-3xl font-black">{(totalBillable + totalOverhead).toFixed(1)} <span className="text-xs sm:text-sm text-gray-400">Hours</span></div>
                </div>
                <div className="w-[1px] bg-gray-800"></div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Utilization Rate</div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400">
                    {(totalBillable + totalOverhead) > 0 ? ((totalBillable / (totalBillable + totalOverhead)) * 100).toFixed(0) : "0"}%
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right w-full md:w-auto">
                <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 flex items-center md:justify-end gap-1">
                  <Info size={12} /> Timesheet Policy
                </div>
                <p className="text-[10px] text-gray-400 max-w-full md:max-w-[200px] leading-tight group-hover:text-gray-200 transition-colors">
                  Please ensure all entries are accurate. Correct project allocation is vital for financial tracking.
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center no-pdf" data-html2canvas-ignore="true">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Only drafts are deletable — a denied card has to be corrected */}
              {!isReadOnly && timecard?.status === "DRAFT" && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold w-full sm:w-auto"
                >
                  {isDeleting ? "Deleting..." : "Delete Draft"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-bold px-6 w-full sm:w-auto"
              >
                Close
              </Button>
              {!isReadOnly && (
                <>
                  <Button
                    onClick={() => handleSave(false)}
                    disabled={isUpdating}
                    className="bg-gray-100 text-black hover:bg-gray-200 font-bold px-6 border-none w-full sm:w-auto"
                  >
                    {isUpdating ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={isUpdating || isSubmitting}
                    className="bg-black text-white hover:bg-gray-800 font-black uppercase tracking-widest px-8 shadow-lg shadow-black/10 transition-all active:scale-95 w-full sm:w-auto"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : timecard?.status === "REJECTED"
                        ? "Resubmit for Approval"
                        : "Submit for Approval"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
