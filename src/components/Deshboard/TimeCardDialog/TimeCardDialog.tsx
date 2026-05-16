import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, FileText } from "lucide-react";
import NewTimesheetDialog from "./NewTimesheetDialog";
import { useState } from "react";
import { useGetMyTimecardsQuery } from "@/redux/api/financialApi";
import TimesheetEntryFormDialog from "./TimesheetEntryFormDialog";

interface TimeCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  DRAFT: "text-gray-600 bg-gray-100",
  SUBMITTED: "text-orange-600 bg-orange-100",
  APPROVED: "text-green-600 bg-green-100",
  REJECTED: "text-red-600 bg-red-100",
};

export default function TimeCardDialog({ open, onOpenChange }: TimeCardDialogProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedTimecardId, setSelectedTimecardId] = useState<string | null>(null);
  const { data: timecards = [], isLoading } = useGetMyTimecardsQuery(undefined, { skip: !open });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <Check className="w-4 h-4 text-green-600" />;
      case "REJECTED": return <X className="w-4 h-4 text-red-500" />;
      case "SUBMITTED": return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto border-gray-300">
          <DialogHeader>
            <DialogTitle>My Last 10 Timesheets</DialogTitle>
            <DialogDescription>
              Select a row to view details below
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-black text-white hover:bg-gray-800"
            >
              + New
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-gray-700 min-w-[500px]">
              <thead className="bg-gray-100 text-gray-900 text-sm font-semibold">
                <tr>
                  <th className="py-2 px-3 text-left">Timesheet Date</th>
                  <th className="py-2 px-3 text-left">Total Hours</th>
                  <th className="py-2 px-3 text-left">Total Cost</th>
                  <th className="py-2 px-3 text-left">Submitted</th>
                  <th className="py-2 px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 px-3 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : timecards.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 px-3 text-center text-gray-500">
                      No timesheets yet. Click "+ New" to create one.
                    </td>
                  </tr>
                ) : (
                  timecards.map((item: any) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedTimecardId(item.id)}
                    >
                      <td className="py-2 px-3">
                        {new Date(item.weekEnding).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3">{Number(item.totalHours).toFixed(2)}</td>
                      <td className="py-2 px-3">${Number(item.totalCost).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        {item.submittedAt ? getStatusIcon("SUBMITTED") : getStatusIcon("DRAFT")}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || ""}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <NewTimesheetDialog open={showNewDialog} onOpenChange={setShowNewDialog} />

      {selectedTimecardId && (
        <TimesheetEntryFormDialog
          open={!!selectedTimecardId}
          onOpenChange={(isOpen) => { if (!isOpen) setSelectedTimecardId(null); }}
          timecardId={selectedTimecardId}
        />
      )}
    </>
  );
}
