import { useMemo, useState } from "react";
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
import {
  useGetOverheadExpensesQuery,
  useCreateOverheadExpenseMutation,
  useUpdateOverheadExpenseMutation,
  useDeleteOverheadExpenseMutation,
} from "@/redux/api/financialApi";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

interface OverheadExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const expenseCategories = [
  { id: "1", name: "Rent & Facilities", description: "Office space, utilities, maintenance" },
  { id: "2", name: "Software & Technology", description: "Licenses, subscriptions, IT equipment" },
  { id: "3", name: "Insurance", description: "Professional liability, property insurance" },
  { id: "4", name: "Professional Development", description: "Training, conferences, certifications" },
  { id: "5", name: "Marketing & Business Development", description: "Advertising, website, client acquisition" },
  { id: "6", name: "Office Expenses", description: "Supplies, equipment, miscellaneous" },
];

/** Sentinel for the free-text category option. Never stored — the typed name is. */
const OTHER_CATEGORY = "__OTHER__";

const CATEGORY_NAMES = expenseCategories.map((c) => c.name);

/** Colours cycled through the Category Breakdown bars. */
const BAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-purple-600",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-lime-600",
];

/** How much of a single expense lands in one month. */
const monthlyValue = (expense: any) => {
  const amount = Number(expense.amount) || 0;
  switch (expense.frequency) {
    case "monthly":
      return amount;
    // Legacy rows only - semi-annually is no longer offered when adding.
    case "semi-annually":
      return amount / 6;
    case "yearly":
    case "one-time":
      return amount / 12;
    default:
      return 0;
  }
};

/** How much of a single expense lands in one year. */
const annualValue = (expense: any) => {
  const amount = Number(expense.amount) || 0;
  switch (expense.frequency) {
    case "monthly":
      return amount * 12;
    case "semi-annually":
      return amount * 2;
    case "yearly":
    case "one-time":
      return amount;
    default:
      return 0;
  }
};

const sumBy = (expenses: any[], frequencies: string[]) =>
  expenses
    .filter((e: any) => frequencies.includes(e.frequency))
    .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

export function OverheadExpensesModal({ open, onOpenChange }: OverheadExpensesModalProps) {
  const { data: overheadExpenses = [], isLoading } = useGetOverheadExpensesQuery(undefined, { skip: !open });
  const [createExpense, { isLoading: isCreating }] = useCreateOverheadExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateOverheadExpenseMutation();
  const [deleteExpense] = useDeleteOverheadExpenseMutation();

  const [newExpenseFormOpen, setNewExpenseFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: 0,
    frequency: "monthly" as "monthly" | "semi-annually" | "yearly" | "one-time",
    category: "Rent & Facilities",
  });

  const monthlyEquivalent = overheadExpenses.reduce(
    (sum: number, e: any) => sum + monthlyValue(e),
    0
  );
  const annualTotal = overheadExpenses.reduce((sum: number, e: any) => sum + annualValue(e), 0);

  const monthlyExpenses = sumBy(overheadExpenses, ["monthly"]);
  const semiAnnualExpenses = sumBy(overheadExpenses, ["semi-annually"]);
  const yearlyExpenses = sumBy(overheadExpenses, ["yearly"]);
  const oneTimeExpenses = sumBy(overheadExpenses, ["one-time"]);

  // Derived from the data, so custom "Other" categories appear too.
  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    overheadExpenses.forEach((e: any) => {
      const name = e.category || "Uncategorised";
      totals.set(name, (totals.get(name) || 0) + monthlyValue(e));
    });
    return Array.from(totals.entries())
      .map(([name, monthlyTotal]) => ({
        name,
        monthlyTotal,
        percentage: monthlyEquivalent > 0 ? (monthlyTotal / monthlyEquivalent) * 100 : 0,
      }))
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);
  }, [overheadExpenses, monthlyEquivalent]);

  const isOtherCategory = newExpense.category === OTHER_CATEGORY;

  const resetForm = () => {
    setNewExpense({ name: "", amount: 0, frequency: "monthly", category: "Rent & Facilities" });
    setCustomCategory("");
  };

  const handleAddOrUpdateExpense = async () => {
    const resolvedCategory = isOtherCategory ? customCategory.trim() : newExpense.category;
    if (isOtherCategory && !resolvedCategory) {
      toast.error("Please name the category");
      return;
    }

    try {
      const payload = { ...newExpense, category: resolvedCategory };
      if (editingId) {
        await updateExpense({ id: editingId, ...payload }).unwrap();
        toast.success("Expense updated");
      } else {
        await createExpense(payload).unwrap();
        toast.success("Expense added");
      }
      setNewExpenseFormOpen(false);
      setEditingId(null);
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save expense");
    }
  };

  const handleEditExpense = (expense: any) => {
    // A category outside the preset list was typed in via "Other".
    const isCustom = !CATEGORY_NAMES.includes(expense.category);
    setEditingId(expense.id);
    setNewExpense({
      name: expense.name,
      amount: Number(expense.amount),
      frequency: expense.frequency,
      category: isCustom ? OTHER_CATEGORY : expense.category,
    });
    setCustomCategory(isCustom ? expense.category : "");
    setNewExpenseFormOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId).unwrap();
      toast.success("Expense deleted");
    } catch (err: any) {
      toast.error("Failed to delete expense");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1100px] max-h-[80vh] overflow-y-auto bg-white border-0">
          <DialogHeader>
            <DialogTitle>Overhead Expenses Management</DialogTitle>
            <DialogDescription>
              Track and manage all expenses needed to run your architecture firm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Expense List</h3>
                <p className="text-sm text-muted-foreground">
                  {overheadExpenses.length} expenses totaling $
                  {monthlyEquivalent.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setEditingId(null);
                    resetForm();
                    setNewExpenseFormOpen(true);
                  }}
                  className="bg-gray-800 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Expense
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Loader fullScreen={false} size={8} />
                        </TableCell>
                      </TableRow>
                    ) : overheadExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No expenses added yet. Click "Add New Expense" to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      overheadExpenses.map((expense: any) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.name}</TableCell>
                          <TableCell>${Number(expense.amount).toLocaleString()}</TableCell>
                          <TableCell>{expense.frequency}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal text-nowrap text-center">
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditExpense(expense)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteExpense(expense.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-6">
                <Card className="border-gray-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Expenses:</span>
                        <span className="font-medium">${monthlyExpenses.toLocaleString()}</span>
                      </div>
                      {/* Legacy rows only - the frequency is no longer offered */}
                      {semiAnnualExpenses > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Semi-Annual Expenses:</span>
                          <span className="font-medium">${semiAnnualExpenses.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Yearly Expenses:</span>
                        <span className="font-medium">${yearlyExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">One-Time Expenses:</span>
                        <span className="font-medium">${oneTimeExpenses.toLocaleString()}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm font-medium">
                        <span>Monthly Equivalent:</span>
                        <span className="text-blue-600">${monthlyEquivalent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Annual Total:</span>
                        <span className="text-blue-600">${annualTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No expenses to break down yet.</p>
                    ) : (
                      categoryBreakdown.map((category, i) => (
                        <div key={category.name} className="space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-sm">{category.name}</span>
                            <span className="text-sm font-medium whitespace-nowrap">
                              ${category.monthlyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`${BAR_COLORS[i % BAR_COLORS.length]} h-1.5 rounded-full transition-all`}
                              style={{ width: `${Math.min(100, category.percentage)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {category.percentage.toFixed(1)}% of total expenses
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={newExpenseFormOpen} onOpenChange={setNewExpenseFormOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-0">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the expense details below." : "Enter the details of your new expense."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Expense Name</Label>
              <Input
                id="expense-name"
                placeholder="Enter expense name"
                value={newExpense.name}
                onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
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
                  onChange={(e) => setNewExpense({ ...newExpense, amount: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-frequency">Frequency</Label>
                <Select value={newExpense.frequency} onValueChange={(value) => setNewExpense({ ...newExpense, frequency: value as any })}>
                  <SelectTrigger id="expense-frequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-Time</SelectItem>
                    {/* Semi-annually is retired — kept selectable only while
                        editing a legacy row that already uses it. */}
                    {newExpense.frequency === "semi-annually" && (
                      <SelectItem value="semi-annually">Semi-Annually (legacy)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                <SelectTrigger id="expense-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-white border border-gray-300">
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                  <SelectItem value={OTHER_CATEGORY}>Other</SelectItem>
                </SelectContent>
              </Select>
              {isOtherCategory ? (
                <Input
                  autoFocus
                  placeholder="Type the expense category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2"
                />
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {expenseCategories.find((cat) => cat.name === newExpense.category)?.description}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setNewExpenseFormOpen(false); setEditingId(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAddOrUpdateExpense} className="bg-gray-800 text-white cursor-pointer" disabled={isCreating || isUpdating}>
              {editingId ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
