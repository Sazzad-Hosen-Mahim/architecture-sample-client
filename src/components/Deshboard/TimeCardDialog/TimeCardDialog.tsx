import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import NewTimesheetDialog from "./NewTimesheetDialog";
import { useState } from "react";

interface TimeCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TimeCardDialog({
  open,
  onOpenChange,
}: TimeCardDialogProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);

  const timesheetData = [
    { date: "3/30/2025", total: "0.00", status: "Open" },
    { date: "3/23/2025", total: "41.00", status: "Open" },
    { date: "3/16/2025", total: "42.00", status: "Open" },
    { date: "3/9/2025", total: "42.00", status: "Open" },
    { date: "3/2/2025", total: "41.00", status: "Open" },
    { date: "2/23/2025", total: "47.00", status: "Open" },
  ];

  // Randomly return a Lucide icon
  const getRandomIcon = () =>
    Math.random() > 0.5 ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <X className="w-4 h-4 text-red-500" />
    );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto border-gray-300">
          <DialogHeader>
            <DialogTitle>My Last 10 Timesheets</DialogTitle>
            <DialogDescription>
              Select a row to view details below
            </DialogDescription>
          </DialogHeader>

          {/* New Button */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-black text-white hover:bg-gray-800"
            >
              + New
            </Button>
          </div>

          {/* Timesheet Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-gray-100 text-gray-900 text-sm font-semibold">
                <tr>
                  <th className="py-2 px-3 text-left">Timesheet Date</th>
                  <th className="py-2 px-3 text-left">Timesheet Total</th>
                  <th className="py-2 px-3 text-left">Submitted</th>
                  <th className="py-2 px-3 text-left">Accounting</th>
                  <th className="py-2 px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {timesheetData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-2 px-3">{item.date}</td>
                    <td className="py-2 px-3">{item.total}</td>
                    <td className="py-2 px-3">{getRandomIcon()}</td>
                    <td className="py-2 px-3">{getRandomIcon()}</td>
                    <td className="py-2 px-3 text-gray-700">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Buttons */}
        </DialogContent>
      </Dialog>
      {/* New Timesheet Dialog */}
      <NewTimesheetDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </>
  );
}
