import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, MoreVertical } from "lucide-react";
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

// Mock data for employees using the exact data provided
const mockEmployees = [
  {
    id: "1",
    name: "Alice Brown",
    role: "Designer",
    email: "alice@architecturesimple.com",
    state: "N/A",
    startDate: "2022-06-20",
    utilizationRate: "80%",
    hourlyRate: "$75.00",
    salary: "$156,000",
    status: "active",
  },
  {
    id: "2",
    name: "Bob Johnson",
    role: "Architect",
    email: "bob@architecturesimple.com",
    state: "N/A",
    startDate: "2019-11-10",
    utilizationRate: "92%",
    hourlyRate: "$85.00",
    salary: "$176,800",
    status: "active",
  },
  {
    id: "3",
    name: "Charlie Davis",
    role: "Engineer",
    email: "charlie@architecturesimple.com",
    state: "N/A",
    startDate: "2021-09-05",
    utilizationRate: "88%",
    hourlyRate: "$80.00",
    salary: "$166,400",
    status: "active",
  },
  {
    id: "4",
    name: "Jane Smith",
    role: "Project Manager",
    email: "jane@architecturesimple.com",
    state: "N/A",
    startDate: "2021-03-01",
    utilizationRate: "78%",
    hourlyRate: "$95.00",
    salary: "$197,600",
    status: "active",
  },
  {
    id: "5",
    name: "John Doe",
    role: "Principal",
    email: "john@architecturesimple.com",
    state: "N/A",
    startDate: "2020-01-15",
    utilizationRate: "85%",
    hourlyRate: "$120.00",
    salary: "$249,600",
    status: "active",
  },
];

interface TeamManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// EmployeeList Component
function EmployeeList({
  employees,
  onUpdateEmployee,
}: {
  employees: any[];
  onUpdateEmployee: (id: string, updates: any) => void;
}) {
  const handleEdit = (employee: any) => {
    console.log("Editing employee:", employee);
    // In real app, this would open an edit form/modal
  };

  const handleDelete = (employeeId: string) => {
    console.log("Deleting employee:", employeeId);
    // In real app, this would show confirmation and call API
  };

  const handleStatusChange = (employeeId: string, newStatus: string) => {
    onUpdateEmployee(employeeId, { status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Utilization Rate</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>Salary</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {employee.role}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{employee.email}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {employee.state}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(employee.startDate)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: employee.utilizationRate }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {employee.utilizationRate}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium text-green-600">
                {employee.hourlyRate}
              </TableCell>
              <TableCell className="font-medium">{employee.salary}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white border-0 "
                  >
                    <DropdownMenuItem onClick={() => handleEdit(employee)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusChange(
                          employee.id,
                          employee.status === "active" ? "inactive" : "active"
                        )
                      }
                    >
                      {employee.status === "active" ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function TeamManagementModa({
  open,
  onOpenChange,
}: TeamManagementModalProps) {
  // Handle update employee function
  const handleUpdateEmployee = (employeeId: string, updates: any) => {
    console.log("Updating employee:", employeeId, updates);
    // In a real application, you would make an API call here
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto rounded-2xl border-0 bg-white">
        <DialogHeader>
          <DialogTitle>Team & Payroll Management</DialogTitle>
          <DialogDescription>
            Manage your team members, payroll, and connected bank accounts.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="employees" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="employees">Employees</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Employee List</h3>
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </div>
            <EmployeeList
              employees={mockEmployees}
              onUpdateEmployee={handleUpdateEmployee}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
