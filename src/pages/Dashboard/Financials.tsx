import { Suspense, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Loader2 } from "lucide-react";
import CommonWrapper from "@/common/CommonWrapper";
import { Loader } from "@/components/ui/loader";

const FinancialOverviewTab = lazy(() => import("@/components/Deshboard/Finacials/FinacialsTabItem/FinancialOverviewTab"));
const PayrollManagementTab = lazy(() => import("@/components/Deshboard/Finacials/FinacialsTabItem/Payroll Management Tab/PayrollManagementTab"));
const ProjectFinancialTracking = lazy(() => import("@/components/Deshboard/Finacials/FinacialsTabItem/ProjectFinancialTracking"));

const TabLoader = () => <Loader fullScreen={false} />;

const TAB_VALUES = ["overview", "project-tracking", "payroll"] as const;

export default function Financials() {
  // The sub-pages that live off Accountant's Control (Employees, Client
  // Directory, All Proposals, Adjust Rates) link back with ?tab=payroll so they
  // return to the tab they came from rather than dumping you on the overview.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TAB_VALUES.includes(requestedTab as any)
    ? (requestedTab as string)
    : "overview";

  return (
    <CommonWrapper>
      <div className="mt-8">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setSearchParams(value === "overview" ? {} : { tab: value }, {
              replace: true,
            })
          }
          className="space-y-18 md:space-y-4 lg:space-y-2 "
        >
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-gray-50 gap-2">
            <TabsTrigger value="overview">Financial Overview</TabsTrigger>
            <TabsTrigger value="project-tracking">Project Tracking</TabsTrigger>
            <TabsTrigger value="payroll">Accountant's Control</TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
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
          </Suspense>
        </Tabs>
      </div>
    </CommonWrapper>
  );
}
