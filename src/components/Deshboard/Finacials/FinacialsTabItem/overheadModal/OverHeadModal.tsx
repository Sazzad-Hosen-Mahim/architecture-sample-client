// import React from "react";

// export default function OverHeadModal() {
//   return <div>OverHeadModal</div>;
// }

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "semi-annually" | "yearly";
  category: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
}

interface OverheadExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const expenseCategories: ExpenseCategory[] = [
  {
    id: "1",
    name: "Rent & Facilities",
    description: "Office space, utilities, maintenance",
  },
  {
    id: "2",
    name: "Software & Technology",
    description: "Licenses, subscriptions, IT equipment",
  },
  {
    id: "3",
    name: "Insurance",
    description: "Professional liability, property insurance",
  },
  {
    id: "4",
    name: "Professional Development",
    description: "Training, conferences, certifications",
  },
  {
    id: "5",
    name: "Marketing & Business Development",
    description: "Advertising, website, client acquisition",
  },
  {
    id: "6",
    name: "Office Expenses",
    description: "Supplies, equipment, miscellaneous",
  },
];

const initialExpenses: Expense[] = [
  {
    id: "1",
    name: "Office Rent",
    amount: 8500,
    frequency: "monthly",
    category: "Rent & Facilities",
  },
  {
    id: "2",
    name: "Revit Licenses",
    amount: 2400,
    frequency: "monthly",
    category: "Software & Technology",
  },
  {
    id: "3",
    name: "Professional Liability Insurance",
    amount: 12000,
    frequency: "yearly",
    category: "Insurance",
  },
  {
    id: "4",
    name: "Office Utilities",
    amount: 1200,
    frequency: "monthly",
    category: "Rent & Facilities",
  },
  {
    id: "5",
    name: "Adobe Creative Cloud",
    amount: 600,
    frequency: "monthly",
    category: "Software & Technology",
  },
  {
    id: "6",
    name: "Staff Training",
    amount: 5000,
    frequency: "yearly",
    category: "Professional Development",
  },
  {
    id: "7",
    name: "Marketing Materials",
    amount: 800,
    frequency: "monthly",
    category: "Marketing & Business Development",
  },
  {
    id: "8",
    name: "Office Supplies",
    amount: 350,
    frequency: "monthly",
    category: "Office Expenses",
  },
];

export function OverheadExpensesModal({
  open,
  onOpenChange,
}: OverheadExpensesModalProps) {
  const [overheadExpenses, setOverheadExpenses] =
    useState<Expense[]>(initialExpenses);
  const [newExpenseFormOpen, setNewExpenseFormOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Omit<Expense, "id">>({
    name: "",
    amount: 0,
    frequency: "monthly",
    category: "Rent & Facilities",
  });

  const calculateMonthlyEquivalent = (expenses: Expense[]) => {
    return (
      expenses
        .filter((e) => e.frequency === "monthly")
        .reduce((sum, e) => sum + e.amount, 0) +
      expenses
        .filter((e) => e.frequency === "semi-annually")
        .reduce((sum, e) => sum + e.amount / 6, 0) +
      expenses
        .filter((e) => e.frequency === "yearly")
        .reduce((sum, e) => sum + e.amount / 12, 0)
    );
  };

  const calculateAnnualTotal = (expenses: Expense[]) => {
    return (
      expenses
        .filter((e) => e.frequency === "monthly")
        .reduce((sum, e) => sum + e.amount * 12, 0) +
      expenses
        .filter((e) => e.frequency === "semi-annually")
        .reduce((sum, e) => sum + e.amount * 2, 0) +
      expenses
        .filter((e) => e.frequency === "yearly")
        .reduce((sum, e) => sum + e.amount, 0)
    );
  };

  const monthlyEquivalent = calculateMonthlyEquivalent(overheadExpenses);
  const annualTotal = calculateAnnualTotal(overheadExpenses);

  const handleAddOrUpdateExpense = () => {
    setNewExpenseFormOpen(false);
    setNewExpense({
      name: "",
      amount: 0,
      frequency: "monthly",
      category: "Rent & Facilities",
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setNewExpense(expense);
    setNewExpenseFormOpen(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    // const expense = overheadExpenses.find((e) => e.id === expenseId);
    setOverheadExpenses(overheadExpenses.filter((e) => e.id !== expenseId));
  };

  const handleSaveChanges = () => {
    onOpenChange(false);
  };

  return (
    <>
      {/* Overhead Update Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1100px] max-h-[80vh] overflow-y-auto bg-white border-0">
          <DialogHeader>
            <DialogTitle>Overhead Expenses Management gg</DialogTitle>
            <DialogDescription>
              Track and manage all expenses needed to run your architecture
              firm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Top Controls */}
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Expense List</h3>
                <p className="text-sm text-muted-foreground">
                  {overheadExpenses.length} expenses totaling $
                  {monthlyEquivalent.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                  /month
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenseCategories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.name}
                        className="cursor-pointer"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setNewExpenseFormOpen(true)}
                  className="bg-gray-800 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Expense
                </Button>
              </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Expense List - Takes 2/3 of the space */}
              <div className="lg:col-span-2 border border-gray-300 rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Expense</TableHead>
                      <TableHead className="w-[15%]">Amount</TableHead>
                      <TableHead className="w-[15%]">Frequency</TableHead>
                      <TableHead className="w-[15%]">Category</TableHead>
                      <TableHead className="w-[15%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overheadExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {expense.name}
                        </TableCell>
                        <TableCell>
                          ${expense.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{expense.frequency}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-normal text-nowrap text-center"
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-pencil"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-trash-2"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {overheadExpenses.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No expenses added yet. Click "Add New Expense" to get
                          started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Section - Takes 1/3 of the space */}
              <div className="space-y-6">
                {/* Financial Summary Card */}
                <Card className="border-gray-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Monthly Expenses:
                        </span>
                        <span className="font-medium">
                          $
                          {overheadExpenses
                            .filter((e) => e.frequency === "monthly")
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Semi-Annual Expenses:
                        </span>
                        <span className="font-medium">
                          $
                          {overheadExpenses
                            .filter((e) => e.frequency === "semi-annually")
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Yearly Expenses:
                        </span>
                        <span className="font-medium">
                          $
                          {overheadExpenses
                            .filter((e) => e.frequency === "yearly")
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm font-medium">
                        <span>Monthly Equivalent:</span>
                        <span className="text-primary">
                          $
                          {monthlyEquivalent.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Annual Total:</span>
                        <span className="text-primary">
                          ${annualTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown Card */}
                <Card className="border-gray-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Category Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {expenseCategories.map((category) => {
                      const categoryExpenses = overheadExpenses.filter(
                        (e) => e.category === category.name
                      );
                      if (categoryExpenses.length === 0) return null;

                      const monthlyTotal =
                        categoryExpenses
                          .filter((e) => e.frequency === "monthly")
                          .reduce((sum, e) => sum + e.amount, 0) +
                        categoryExpenses
                          .filter((e) => e.frequency === "semi-annually")
                          .reduce((sum, e) => sum + e.amount / 6, 0) +
                        categoryExpenses
                          .filter((e) => e.frequency === "yearly")
                          .reduce((sum, e) => sum + e.amount / 12, 0);

                      // Calculate percentage of total
                      const percentage =
                        monthlyEquivalent > 0
                          ? (monthlyTotal / monthlyEquivalent) * 100
                          : 0;

                      return (
                        <div key={category.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{category.name}</span>
                            <span className="text-sm font-medium">
                              $
                              {monthlyTotal.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                              /mo
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}% of total expenses
                          </p>
                        </div>
                      );
                    })}
                    {!expenseCategories.some((category) =>
                      overheadExpenses.some((e) => e.category === category.name)
                    ) && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No expenses added yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-black text-white cursor-pointer"
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Expense Dialog */}
      <Dialog open={newExpenseFormOpen} onOpenChange={setNewExpenseFormOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-0">
          <DialogHeader>
            <DialogTitle>
              {(newExpense as any).id ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
            <DialogDescription>
              {(newExpense as any).id
                ? "Update the expense details below."
                : "Enter the details of your new expense."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Expense Name</Label>
              <Input
                id="expense-name"
                placeholder="Enter expense name"
                value={newExpense.name}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount ($)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  placeholder="0"
                  value={newExpense.amount || ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      amount: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-frequency">Frequency</Label>
                <Select
                  value={newExpense.frequency}
                  onValueChange={(value) =>
                    setNewExpense({
                      ...newExpense,
                      frequency: value as
                        | "monthly"
                        | "semi-annually"
                        | "yearly",
                    })
                  }
                >
                  <SelectTrigger id="expense-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select
                value={newExpense.category}
                onValueChange={(value) =>
                  setNewExpense({ ...newExpense, category: value })
                }
              >
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300">
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {
                  expenseCategories.find(
                    (cat) => cat.name === newExpense.category
                  )?.description
                }
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setNewExpenseFormOpen(false);
                setNewExpense({
                  name: "",
                  amount: 0,
                  frequency: "monthly",
                  category: "Rent & Facilities",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddOrUpdateExpense}
              className="bg-gray-800 text-white cursor-pointer"
            >
              {(newExpense as any).id ? "Update Expense" : "Save Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
