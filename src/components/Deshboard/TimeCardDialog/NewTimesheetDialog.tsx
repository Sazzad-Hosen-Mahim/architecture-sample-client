import { useState } from "react";
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
import TimesheetEntryFormDialog from "./TimesheetEntryFormDialog";

interface NewTimesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const previousTimesheets = [
  "04/05/25",
  "03/29/25",
  "03/22/25",
  "03/15/25",
  "03/08/25",
  "03/01/25",
];

export default function NewTimesheetDialog({
  open,
  onOpenChange,
}: NewTimesheetDialogProps) {
  //   const [copyFromPrevious, setCopyFromPrevious] = useState(false);
  const [endingDate, setEndingDate] = useState("2025-10-26");
  const [showEntryFormDialog, setShowEntryFormDialog] = useState(false);

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

            {/* Previous Timesheets (always visible) */}
            <div>
              <Label className="text-sm font-normal mb-2">
                Copy timesheet from...
              </Label>
              <ScrollArea className="h-[140px] w-full border border-gray-200 rounded px-3 py-2">
                <div className="space-y-1">
                  {previousTimesheets.map((date, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 py-1 hover:bg-gray-50 cursor-pointer rounded px-1"
                    >
                      {date}
                    </div>
                  ))}
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
              onClick={() => {
                // Close NewTimesheetDialog
                setShowEntryFormDialog(true); // Open TimesheetEntryFormDialog
              }}
              className="h-8 px-4 text-sm bg-black text-white hover:bg-gray-800"
            >
              OK
            </Button>
            <Button variant="outline" className="h-8 px-4 text-sm">
              Help
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* time sheet entry from   Dialog */}
      <TimesheetEntryFormDialog
        open={showEntryFormDialog}
        onOpenChange={setShowEntryFormDialog}
      />
    </>
  );
}
