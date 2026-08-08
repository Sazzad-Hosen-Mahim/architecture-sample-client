import { baseApi } from './baseApi';

export const refundApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get user bank details
    getUserBankDetails: builder.query({
      query: () => '/refunds/bank-details',
      providesTags: ['BankDetails'],
    }),

    // Create a refund request
    createRefundRequest: builder.mutation({
      query: (data) => ({
        url: '/refunds',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BankDetails'],
    }),
    // Get all refund requests (admin/finance)
    getRefundRequests: builder.query({
      query: () => '/refunds',
      providesTags: ['Refund'],
    }),

    // Client bank details behind a specific refund, for actioning the payout
    getRefundBankDetails: builder.query({
      query: (id: string) => `/refunds/${id}/bank-details`,
      providesTags: ['Refund'],
    }),

    // Confirm the approved refund has actually been paid out
    markRefundProcessed: builder.mutation({
      query: (id: string) => ({
        url: `/refunds/${id}/processed`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Refund', 'Notification'],
    }),

    // Get my refund requests (user)
    getMyRefundRequests: builder.query({
      query: () => '/refunds/my',
      providesTags: ['Refund'],
    }),

    // Approve a refund
    approveRefund: builder.mutation({
      query: (id) => ({
        url: `/refunds/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Refund'],
    }),

    // Reject a refund
    rejectRefund: builder.mutation({
      query: ({ id, rejectionReason }) => ({
        url: `/refunds/${id}/reject`,
        method: 'PATCH',
        body: { rejectionReason },
      }),
      invalidatesTags: ['Refund'],
    }),
  }),
});

export const {
  useCreateRefundRequestMutation,
  useGetRefundRequestsQuery,
  useGetMyRefundRequestsQuery,
  useGetUserBankDetailsQuery,
  useApproveRefundMutation,
  useGetRefundBankDetailsQuery,
  useMarkRefundProcessedMutation,
  useRejectRefundMutation,
} = refundApi;
