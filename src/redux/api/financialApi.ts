import { baseApi } from "@/redux/api/baseApi";

export interface FinancialHistoryPoint {
  month: string;
  revenue: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  profit: number;
  utilization: number;
}

/**
 * Project-scoped totals behind the chart's stat cards. `null` for the
 * firm-wide chart, which still shows a rolling 12 calendar months.
 */
export interface FinancialHistorySummary {
  startDate: string;
  endDate: string;
  isStarted: boolean;
  isCompleted: boolean;
  totalDays: number;
  totalMonths: number;
  monthCount: number;
  totalContract: number;
  laborCost: number;
  projectOverhead: number;
  totalCost: number;
  billableHours: number;
  nonBillableHours: number;
  avgMonthlyRevenue: number;
  avgMonthlyCost: number;
  avgMonthlyProfit: number;
  utilization: number;
}

export interface FinancialHistoryResponse {
  history: FinancialHistoryPoint[];
  summary: FinancialHistorySummary | null;
}

export const financialApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ═══════════════════════════════════════
    // EMPLOYEE PROFILE
    // ═══════════════════════════════════════
    updateEmployeeProfile: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/financial/employee-profile/${userId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User", "FinancialOverview"],
    }),

    // ═══════════════════════════════════════
    // OVERHEAD EXPENSES
    // ═══════════════════════════════════════
    getOverheadExpenses: builder.query<any[], void>({
      query: () => ({ url: "/financial/overhead-expenses", method: "GET" }),
      transformResponse: (response: any) => response.data,
      providesTags: ["OverheadExpense"],
    }),

    createOverheadExpense: builder.mutation({
      query: (data) => ({
        url: "/financial/overhead-expenses",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["OverheadExpense", "FinancialOverview"],
    }),

    updateOverheadExpense: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/financial/overhead-expenses/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["OverheadExpense", "FinancialOverview"],
    }),

    deleteOverheadExpense: builder.mutation({
      query: (id: string) => ({
        url: `/financial/overhead-expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OverheadExpense", "FinancialOverview"],
    }),

    // ═══════════════════════════════════════
    // FINANCIAL OVERVIEW
    // ═══════════════════════════════════════
    getFinancialOverview: builder.query<any, { scope?: "all" | "year"; year?: number } | void>({
      query: (params) => ({
        url: "/financial/overview",
        method: "GET",
        params: params || undefined,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["FinancialOverview"],
    }),

    // ═══════════════════════════════════════
    // ACTIVE PROJECTS
    // ═══════════════════════════════════════
    getActiveProjects: builder.query<any[], void>({
      query: () => ({ url: "/financial/active-projects", method: "GET" }),
      transformResponse: (response: any) => response.data,
    }),

    getProjectFinancialDetails: builder.query<any, string>({
      query: (id) => ({ url: `/financial/active-projects/${id}/details`, method: "GET" }),
      transformResponse: (response: any) => response.data,
      providesTags: ["FinancialOverview"],
    }),

    getMyAssignedProjects: builder.query<any[], void>({
      query: () => ({ url: "/financial/my-assigned-projects", method: "GET" }),
      transformResponse: (response: any) => response.data,
    }),

    // ═══════════════════════════════════════
    // TIMECARDS
    // ═══════════════════════════════════════
    createTimecard: builder.mutation({
      query: (data) => ({
        url: "/financial/timecards",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Timecard"],
    }),

    getMyTimecards: builder.query<any[], void>({
      query: () => ({ url: "/financial/timecards/my", method: "GET" }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Timecard"],
    }),

    getTimecardById: builder.query<any, string>({
      query: (id) => ({ url: `/financial/timecards/${id}`, method: "GET" }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Timecard"],
    }),

    updateTimecard: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/financial/timecards/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Timecard"],
    }),

    submitTimecard: builder.mutation({
      query: (id: string) => ({
        url: `/financial/timecards/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["Timecard", "FinancialOverview"],
    }),

    getPendingTimecards: builder.query<any[], void>({
      query: () => ({ url: "/financial/timecards/pending", method: "GET" }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Timecard"],
    }),

    approveTimecard: builder.mutation({
      query: (id: string) => ({
        url: `/financial/timecards/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Timecard", "FinancialOverview"],
    }),

    rejectTimecard: builder.mutation({
      query: ({ id, rejectionNote }: { id: string; rejectionNote?: string }) => ({
        url: `/financial/timecards/${id}/reject`,
        method: "POST",
        body: { rejectionNote },
      }),
      invalidatesTags: ["Timecard"],
    }),

    deleteTimecard: builder.mutation({
      query: (id: string) => ({
        url: `/financial/timecards/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Timecard"],
    }),

    getAllTimecards: builder.query<any[], { status?: string; includeArchived?: boolean } | void>({
      query: (params) => ({
        url: "/financial/timecards/all",
        method: "GET",
        params: params || undefined,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Timecard"],
    }),

    archiveTimecards: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: "/financial/timecards/archive",
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: ["Timecard", "FinancialOverview"],
    }),

    unarchiveTimecards: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: "/financial/timecards/unarchive",
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: ["Timecard", "FinancialOverview"],
    }),

    // Anchor date for the bi-weekly pay period calendar.
    getPayrollStartDate: builder.query<{ payrollStartDate: string }, void>({
      query: () => ({ url: "/financial/payroll-start-date", method: "GET" }),
      transformResponse: (response: any) => response.data,
      providesTags: ["PayrollSettings"],
    }),

    setPayrollStartDate: builder.mutation<any, string>({
      query: (payrollStartDate) => ({
        url: "/financial/payroll-start-date",
        method: "PATCH",
        body: { payrollStartDate },
      }),
      invalidatesTags: ["PayrollSettings", "Timecard"],
    }),

    // Pay-period timecards (bi-weekly, 26 periods per year)
    getTimecardsByPayPeriod: builder.query<any[], { year: number; period: number }>({
      query: ({ year, period }) => ({
        url: "/financial/timecards/pay-period",
        method: "GET",
        params: { year, period },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Timecard"],
    }),

    getFinancialHistory: builder.query<
      FinancialHistoryResponse,
      { projectId?: string; scope?: "all" | "year"; year?: number } | void
    >({
      query: (args) => ({
        url: "/financial/history",
        method: "GET",
        params: args || undefined,
      }),
      transformResponse: (response: any): FinancialHistoryResponse => {
        const data = response?.data;
        // Older deployments returned a bare array with no summary.
        if (Array.isArray(data)) return { history: data, summary: null };
        return { history: data?.history || [], summary: data?.summary || null };
      },
      providesTags: ["FinancialOverview"],
    }),

    // ═══════════════════════════════════════
    // BILLING RATE
    // ═══════════════════════════════════════
    getBillingRate: builder.query<{ billingRate: number }, void>({
      query: () => ({ url: "/financial/billing-rate", method: "GET" }),
      transformResponse: (response: any) => response.data,
      providesTags: ["BillingRate" as any],
    }),

    setBillingRate: builder.mutation({
      query: (billingRate: number) => ({
        url: "/financial/billing-rate",
        method: "PATCH",
        body: { billingRate },
      }),
      invalidatesTags: ["BillingRate" as any, "FinancialOverview"],
    }),

    // ═══════════════════════════════════════
    // MERCURY BANKING
    // ═══════════════════════════════════════
    getMercuryAccounts: builder.query<any, void>({
      query: () => ({ url: "/financial/mercury/accounts", method: "GET" }),
      transformResponse: (response: any) => response.data,
      providesTags: ["MercuryAccount"],
    }),

    getMercuryTransactions: builder.query<any, { accountId: string; limit?: number; offset?: number }>({
      query: ({ accountId, limit = 10, offset = 0 }) => ({
        url: `/financial/mercury/accounts/${accountId}/transactions`,
        method: "GET",
        params: { limit, offset },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["MercuryAccount"],
    }),

    // ═══════════════════════════════════════
    // YEAR-END ARCHIVE
    // ═══════════════════════════════════════
    archiveCompletedProjects: builder.mutation<any, { year?: number }>({
      query: (body) => ({
        url: "/financial/archive-completed",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FinancialOverview"],
    }),

    getArchivedSummary: builder.query<any, void>({
      query: () => ({ url: "/financial/archived-summary", method: "GET" }),
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useUpdateEmployeeProfileMutation,
  useGetOverheadExpensesQuery,
  useCreateOverheadExpenseMutation,
  useUpdateOverheadExpenseMutation,
  useDeleteOverheadExpenseMutation,
  useGetFinancialOverviewQuery,
  useGetActiveProjectsQuery,
  useGetProjectFinancialDetailsQuery,
  useGetMyAssignedProjectsQuery,
  useCreateTimecardMutation,
  useGetMyTimecardsQuery,
  useGetTimecardByIdQuery,
  useUpdateTimecardMutation,
  useSubmitTimecardMutation,
  useGetPendingTimecardsQuery,
  useApproveTimecardMutation,
  useRejectTimecardMutation,
  useDeleteTimecardMutation,
  useGetAllTimecardsQuery,
  useArchiveTimecardsMutation,
  useUnarchiveTimecardsMutation,
  useGetPayrollStartDateQuery,
  useSetPayrollStartDateMutation,
  useGetTimecardsByPayPeriodQuery,
  useGetFinancialHistoryQuery,
  useGetBillingRateQuery,
  useSetBillingRateMutation,
  useGetMercuryAccountsQuery,
  useGetMercuryTransactionsQuery,
  useArchiveCompletedProjectsMutation,
  useGetArchivedSummaryQuery,
} = financialApi;
