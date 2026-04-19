import { baseApi } from "@/redux/api/baseApi";

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
    getFinancialOverview: builder.query<any, void>({
      query: () => ({ url: "/financial/overview", method: "GET" }),
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

    getAllTimecards: builder.query<any[], { status?: string } | void>({
      query: (params) => ({
        url: "/financial/timecards/all",
        method: "GET",
        params: params || undefined,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Timecard"],
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
} = financialApi;
