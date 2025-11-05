import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface PayrollReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPayPeriodId: string | undefined;
  payPeriodAlerts: {
    missedPayPeriods: Array<{
      id: string;
      startDate: string;
      endDate: string;
      payDate: string;
      daysOverdue: number;
      accumulatedHours: {
        approved: number;
        pending: number;
      };
    }>;
    nextPayPeriod: {
      startDate: string;
      endDate: string;
      payDate: string;
      accumulatedHours: {
        approved: number;
        pending: number;
      };
    };
  };
}

const PayrollReviewDialog: React.FC<PayrollReviewDialogProps> = ({
  open,
  onOpenChange,
  currentPayPeriodId,
  payPeriodAlerts,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Payroll Review</DialogTitle>
          <DialogDescription>
            Review payroll details carefully before processing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 pr-1">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <Info className="h-4 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                You are about to process payroll for{" "}
                {currentPayPeriodId
                  ? "a missed pay period"
                  : "the upcoming pay period"}
                . This will initiate payments for all employees.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-white border-gray-300">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Pay Period Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {currentPayPeriodId ? (
                  (() => {
                    const missedPeriod = payPeriodAlerts.missedPayPeriods.find(
                      (p) => p.id === currentPayPeriodId
                    );
                    return missedPeriod ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Period:</div>
                        <div>
                          {new Date(
                            missedPeriod.startDate
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(missedPeriod.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground">Pay Date:</div>
                        <div>
                          {new Date(missedPeriod.payDate).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground">
                          <h2>Status:</h2>
                        </div>
                        <div className="text-red-600">
                          {missedPeriod.daysOverdue} days overdue
                        </div>
                        <div className="text-muted-foreground">
                          Approved Hours:
                        </div>
                        <div>
                          {missedPeriod.accumulatedHours.approved} hours
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">
                        Pay period details not found
                      </p>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Period:</div>
                    <div>
                      {new Date(
                        payPeriodAlerts.nextPayPeriod.startDate
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        payPeriodAlerts.nextPayPeriod.endDate
                      ).toLocaleDateString()}
                    </div>
                    <div className="text-muted-foreground">Pay Date:</div>
                    <div>
                      {new Date(
                        payPeriodAlerts.nextPayPeriod.payDate
                      ).toLocaleDateString()}
                    </div>
                    <div className="text-muted-foreground">Employees:</div>
                    <div>
                      {/* {
                        mockEmployees.filter((e) => e.status !== "inactive")
                          .length
                      } */}
                    </div>
                    <div className="text-muted-foreground">Hours:</div>
                    <div>
                      <span className="text-green-600">
                        {
                          payPeriodAlerts.nextPayPeriod.accumulatedHours
                            .approved
                        }
                      </span>
                      {payPeriodAlerts.nextPayPeriod.accumulatedHours.pending >
                        0 && (
                        <span className="text-amber-600">
                          {" "}
                          /{" "}
                          {
                            payPeriodAlerts.nextPayPeriod.accumulatedHours
                              .pending
                          }
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Gross Payroll:</div>
                    <div className="font-medium">$24,750.00</div>
                    <div className="text-muted-foreground">Employee Taxes:</div>
                    <div className="font-medium">$5,940.00</div>
                    <div className="text-muted-foreground">Employer Taxes:</div>
                    <div className="font-medium">$1,980.00</div>
                    <div className="text-muted-foreground">Deductions:</div>
                    <div className="font-medium">$2,475.00</div>
                    <div className="text-muted-foreground">Net Payroll:</div>
                    <div className="font-medium">$16,335.00</div>
                    <div className="text-muted-foreground">Total Cost:</div>
                    <div className="font-bold">$26,730.00</div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">From Account:</div>
                    <div>Business Checking (•••••••1234)</div>
                    <div className="text-muted-foreground">
                      Available Balance:
                    </div>
                    <div className="font-medium">$125,000.00</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Employee Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Employee</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>John Doe</TableCell>
                      <TableCell>$4,615.38</TableCell>
                      <TableCell>$3,230.77</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jane Smith</TableCell>
                      <TableCell>$3,653.85</TableCell>
                      <TableCell>$2,557.69</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bob Johnson</TableCell>
                      <TableCell>$3,825.00</TableCell>
                      <TableCell>$2,677.50</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Alice Brown</TableCell>
                      <TableCell>$2,800.00</TableCell>
                      <TableCell>$1,960.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Charlie Davis</TableCell>
                      <TableCell>$3,200.00</TableCell>
                      <TableCell>$2,240.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-2 mt-8">
              <div className="flex items-center space-x-2">
                <Checkbox id="confirmPayrollDetails" required />
                <label
                  htmlFor="confirmPayrollDetails"
                  className="text-sm text-gray-600  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have reviewed and confirm these payroll details are correct
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="authorizePayrollPayment" required />
                <label
                  htmlFor="authorizePayrollPayment"
                  className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I authorize these payments to be processed from the selected
                  account
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 ">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            // onClick={confirmProcessPayroll}
            className="bg-green-600 text-white cursor-pointer hover:bg-green-700"
          >
            Process Payroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollReviewDialog;
