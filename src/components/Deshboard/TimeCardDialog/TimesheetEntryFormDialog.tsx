// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";

// interface TimesheetEntryFormDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export default function TimesheetEntryFormDialog({
//   open,
//   onOpenChange,
// }: TimesheetEntryFormDialogProps) {
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[400px] bg-white p-6 rounded">
//         <DialogHeader>
//           <DialogTitle>Timesheet Entry</DialogTitle>
//           <DialogDescription>
//             Fill in the details for your new timesheet entry.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="mt-4 flex justify-end">
//           <Button
//             className="bg-black text-white hover:bg-gray-800"
//             onClick={() => onOpenChange(false)}
//           >
//             Close
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TimesheetEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TimesheetEntryFormDialog({
  open,
  onOpenChange,
}: TimesheetEntryFormDialogProps) {
  const [overheadHours, setOverheadHours] = useState<
    Record<string, Record<string, string>>
  >({});

  const handleHourChange = (category: string, day: string, value: string) => {
    setOverheadHours((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [day]: value,
      },
    }));
  };

  const calculateCategoryTotal = (category: string) => {
    const hours = overheadHours[category] || {};
    return DAYS.reduce((sum, day) => {
      const value = Number.parseFloat(hours[day] || "0");
      return sum + (isNaN(value) ? 0 : value);
    }, 0).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] lg:max-w-[90vw] xl:max-w-[60vw] max-h-[90vh] overflow-y-auto bg-white p-8 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Timesheet for Eric Rivera for 10/26/2025
          </DialogTitle>
        </DialogHeader>

        <div className="mt-8 space-y-8">
          {/* Direct Time Entry Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">Direct</h3>
              <span className="text-base font-medium">0.00</span>
            </div>
            <div className="flex gap-2 mb-4">
              <button className="text-blue-600 text-base hover:underline">
                + Add time entry
              </button>
            </div>
          </div>

          {/* Overhead Section */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-base mb-6">Overhead</h3>

            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold min-w-40">
                      Category
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="text-center p-4 font-semibold min-w-28"
                      >
                        {day}
                      </th>
                    ))}
                    <th className="text-center p-4 font-semibold min-w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {OVERHEAD_CATEGORIES.map((category, idx) => (
                    <tr
                      key={category}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-4 text-left font-medium">{category}</td>
                      {DAYS.map((day) => (
                        <td
                          key={`${category}-${day}`}
                          className="p-4 text-center"
                        >
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-center text-base"
                            value={overheadHours[category]?.[day] || ""}
                            onChange={(e) =>
                              handleHourChange(category, day, e.target.value)
                            }
                          />
                        </td>
                      ))}
                      <td className="p-4 text-center font-semibold">
                        {calculateCategoryTotal(category)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Row */}
          <div className="border-t pt-6 bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Timesheet Total</span>
              <span className="font-semibold text-lg">0.00</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline">Save</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="outline">Delete</Button>
          <Button className="bg-black text-white hover:bg-gray-800">
            Submit
          </Button>
          <Button variant="outline">Print</Button>
          <Button variant="outline">Help</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
