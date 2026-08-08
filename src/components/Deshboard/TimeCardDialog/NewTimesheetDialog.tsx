"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useCreateTimecardMutation,
  useGetMyTimecardsQuery,
  useGetPayrollStartDateQuery,
} from "@/redux/api/financialApi";
import { generatePayPeriods, getCurrentPayPeriodIndex } from "@/utils/payPeriods";
import { toast } from "sonner";
import TimesheetEntryFormDialog from "./TimesheetEntryFormDialog";
import { Info } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

interface NewTimesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Pay periods are anchored to the firm's payroll start date - see
// @/utils/payPeriods, shared with the payroll management table.

export default function NewTimesheetDialog({ open, onOpenChange }: NewTimesheetDialogProps) {
  const user = useSelector(selectCurrentUser);
  const canAccessPastPeriods = user?.role === "SUPER_ADMIN" || user?.role === "FINANCE";

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [periods, setPeriods] = useState(() => generatePayPeriods(currentYear));
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const [showEntryFormDialog, setShowEntryFormDialog] = useState(false);
  const [newTimecardId, setNewTimecardId] = useState<string | null>(null);

  const { data: timecards = [] } = useGetMyTimecardsQuery(undefined, { skip: !open });
  const { data: payrollSettings } = useGetPayrollStartDateQuery();
  const [createTimecard, { isLoading: isCreating }] = useCreateTimecardMutation();
  const approvedTimecards = timecards.filter((tc: any) => tc.status === "APPROVED");

  useEffect(() => {
    if (open) {
      const newPeriods = generatePayPeriods(selectedYear, payrollSettings?.payrollStartDate);
      setPeriods(newPeriods);
      setSelectedPeriodIdx(getCurrentPayPeriodIndex(newPeriods));
    }
  }, [open, selectedYear, payrollSettings]);

  const selectedPeriod = periods[selectedPeriodIdx];

  const handleCreate = async () => {
    if (!selectedPeriod) return;
    try {
      const result = await createTimecard({
        weekStarting: selectedPeriod.startDate.toISOString().split("T")[0],
        payPeriod: selectedPeriod.period,
        payYear: selectedYear,
      }).unwrap();
      setNewTimecardId(result.data.id);
      toast.success("New bi-weekly timecard created");
      onOpenChange(false);
      setShowEntryFormDialog(true);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create timecard");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] bg-white border-gray-200 p-0 rounded">
          <DialogHeader className="px-6 pt-5 pb-4 bg-[#F3F4F6]">
            <DialogTitle className="text-base font-semibold">New Bi-Weekly Timecard</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-5">
            {/* Info Banner */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                Each timecard covers a <strong>2-week pay period</strong>. You'll enter hours for <strong>Week 1 (Entry 1)</strong> and <strong>Week 2 (Entry 2)</strong> separately inside the timecard.
              </p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Year</Label>
              <select
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium bg-white"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[currentYear].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Pay Period Selector */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Select Pay Period</Label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium bg-white"
                value={selectedPeriodIdx}
                onChange={(e) => setSelectedPeriodIdx(Number(e.target.value))}
              >
                {periods.map((p, idx) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPassed = today > p.endDate;
                  const isDisabled = isPassed && !canAccessPastPeriods;
                  return (
                    <option key={idx} value={idx} disabled={isDisabled}>
                      {p.label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Previous Timecards */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Previous Timecards</Label>
              <div className="h-[120px] max-h-[120px] overflow-y-auto w-full border border-gray-200 rounded px-3 py-2">
                <div className="space-y-1">
                  {approvedTimecards.map((tc: any) => (
                    <div key={tc.id} className="text-xs text-gray-600 py-1 hover:bg-gray-50 cursor-pointer rounded px-1">
                      Pay Period {tc.payPeriod || "—"} · {tc.weekStarting ? new Date(tc.weekStarting).toLocaleDateString() : new Date(tc.weekEnding).toLocaleDateString()} ({tc.status})
                    </div>
                  ))}
                  {approvedTimecards.length === 0 && (
                    <div className="text-xs text-gray-400 py-1 italic">No previous timecards</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 px-6 py-4 bg-gray-50">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8 px-4 text-sm">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="h-8 px-4 text-sm bg-black text-white hover:bg-gray-800"
            >
              {isCreating ? "Creating..." : "Create Timecard"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {newTimecardId && (
        <TimesheetEntryFormDialog
          open={showEntryFormDialog}
          onOpenChange={setShowEntryFormDialog}
          timecardId={newTimecardId}
        />
      )}
    </>
  );
}
