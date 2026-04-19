import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useCreateTimecardMutation, useGetMyTimecardsQuery } from "@/redux/api/financialApi";
import { toast } from "sonner";
import TimesheetEntryFormDialog from "./TimesheetEntryFormDialog";

interface NewTimesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewTimesheetDialog({
  open,
  onOpenChange,
}: NewTimesheetDialogProps) {
  const [endingDate, setEndingDate] = useState("");
  const [showEntryFormDialog, setShowEntryFormDialog] = useState(false);
  const [newTimecardId, setNewTimecardId] = useState<string | null>(null);

  const { data: timecards = [] } = useGetMyTimecardsQuery(undefined, { skip: !open });
  const [createTimecard, { isLoading: isCreating }] = useCreateTimecardMutation();

  // Calculate the next Sunday
  useEffect(() => {
    if (open) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 is Sunday
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + daysUntilSunday);
      setEndingDate(nextSunday.toISOString().split("T")[0]);
    }
  }, [open]);

  const handleCreate = async () => {
    try {
      const result = await createTimecard({ weekEnding: endingDate }).unwrap();
      setNewTimecardId(result.data.id);
      toast.success("New timesheet created");
      onOpenChange(false);
      setShowEntryFormDialog(true);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create timesheet");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px] bg-white border-gray-200 p-0 rounded">
          <DialogHeader className="px-6 pt-5 pb-4  bg-[#F3F4F6]">
            <DialogTitle className="text-base font-normal">
              New Timesheet
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Ending Date */}
            <div className="flex items-center justify-between space-x-4">
              <Label
                htmlFor="ending-date"
                className="text-sm font-normal text-blue-600 min-w-[120px]"
              >
                Timesheet ending date
              </Label>

              <Input
                id="ending-date"
                type="date"
                value={endingDate}
                onChange={(e) => setEndingDate(e.target.value)}
                className="w-[40%] h-9 text-sm"
              />
            </div>

            {/* Previous Timesheets */}
            <div>
              <Label className="text-sm font-normal mb-2">
                Previous Timesheets
              </Label>
              <ScrollArea className="h-[140px] w-full border border-gray-200 rounded px-3 py-2">
                <div className="space-y-1">
                  {timecards.map((tc: any) => (
                    <div
                      key={tc.id}
                      className="text-sm text-gray-600 py-1 hover:bg-gray-50 cursor-pointer rounded px-1"
                    >
                      {new Date(tc.weekEnding).toLocaleDateString()} ({tc.status})
                    </div>
                  ))}
                  {timecards.length === 0 && (
                    <div className="text-sm text-gray-400 py-1">No previous timesheets</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-2 px-6 py-4 bg-gray-50 ">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 px-4 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="h-8 px-4 text-sm bg-black text-white hover:bg-gray-800"
            >
              {isCreating ? "Creating..." : "OK"}
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
