import FinancialOverviewTab from "@/components/Deshboard/Finacials/FinacialsTabItem/FinancialOverviewTab";
import PayrollManagementTab from "@/components/Deshboard/Finacials/FinacialsTabItem/Payroll Management Tab/PayrollManagementTab";
import ProjectFinancialTracking from "@/components/Deshboard/Finacials/FinacialsTabItem/ProjectFinancialTracking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Financials() {
  return (
    <div className="mt-8">
      <Tabs defaultValue="overview" className="space-y-6 ">
        <TabsList className="grid w-full grid-cols-3 bg-gray-50 ">
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="project-tracking">Project Tracking</TabsTrigger>
          <TabsTrigger value="payroll">Accountant's Control</TabsTrigger>
        </TabsList>

        {/* Financial Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <FinancialOverviewTab />
        </TabsContent>

        {/* Project & Objective Tracking Tab */}
        <TabsContent value="project-tracking" className="space-y-6">
          <ProjectFinancialTracking />
        </TabsContent>

        {/* Accountant's Control Tab (Payroll Management + AccountantDesk) */}
        <TabsContent value="payroll" className="space-y-3">
          <PayrollManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
