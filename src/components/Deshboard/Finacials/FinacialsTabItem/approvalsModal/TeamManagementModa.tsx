"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetAllUsersQuery } from "@/redux/api/userApi";

interface TeamManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EmployeeList({ employees }: { employees: any[] }) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-bold text-gray-900">Name</TableHead>
            <TableHead className="font-bold text-gray-900">Role</TableHead>
            <TableHead className="font-bold text-gray-900">Email</TableHead>
            <TableHead className="font-bold text-gray-900">State</TableHead>
            <TableHead className="font-bold text-gray-900">Start Date</TableHead>
            <TableHead className="font-bold text-gray-900">Hourly Rate</TableHead>
            <TableHead className="font-bold text-gray-900">Salary</TableHead>
            <TableHead className="text-right font-bold text-gray-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((user) => (
            <TableRow key={user.id} className="hover:bg-gray-50/50">
              <TableCell className="font-semibold text-gray-900">{user.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs font-bold">
                  {user.role?.replace(/_/g, ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs font-bold">
                  {user.employeeProfile?.state || "N/A"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(user.employeeProfile?.startingDate)}
              </TableCell>
              <TableCell className="font-bold text-green-700">
                {user.employeeProfile?.hourlyRate ? `$${Number(user.employeeProfile.hourlyRate).toFixed(2)}` : "—"}
              </TableCell>
              <TableCell className="font-bold text-gray-900">
                {user.employeeProfile?.salary ? `$${Number(user.employeeProfile.salary).toLocaleString()}` : "—"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-gray-200">
                    <DropdownMenuItem className="font-medium cursor-pointer">Edit Profile</DropdownMenuItem>
                    <DropdownMenuItem className="font-medium cursor-pointer">View Timesheets</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 font-medium cursor-pointer">Deactivate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-gray-500 font-medium">
                No team members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function TeamManagementModa({
  open,
  onOpenChange,
}: TeamManagementModalProps) {
  const { data: users = [], isLoading } = useGetAllUsersQuery(undefined, { skip: !open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white shadow-2xl p-8 font-semibold">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Team Registry & Financial Profiles</DialogTitle>
          <DialogDescription className="text-gray-500 font-medium">
            Manage team members and their associated financial data for payroll and overhead calculations.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full mt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-gray-900">Employee Profiles</h3>
              <p className="text-sm text-gray-500 font-medium">{users.length} total members registered</p>
            </div>
            <Button
              className="bg-black text-white hover:bg-gray-800 h-10 px-6 font-bold"
              onClick={() => {
                onOpenChange(false);
                // In a real app, this might navigate or open the add modal
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-500 font-medium italic">
              Loading team directory...
            </div>
          ) : (
            <EmployeeList employees={users} />
          )}
        </div>

        <DialogFooter className="mt-10 pt-6 border-t font-bold">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-8">
            Close Registry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
