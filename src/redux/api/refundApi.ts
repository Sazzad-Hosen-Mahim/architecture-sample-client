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
    }),

    // Get my refund requests (user)
    getMyRefundRequests: builder.query({
      query: () => '/refunds/my',
    }),

    // Approve a refund
    approveRefund: builder.mutation({
      query: (id) => ({
        url: `/refunds/${id}/approve`,
        method: 'PATCH',
      }),
    }),

    // Reject a refund
    rejectRefund: builder.mutation({
      query: ({ id, rejectionReason }) => ({
        url: `/refunds/${id}/reject`,
        method: 'PATCH',
        body: { rejectionReason },
      }),
    }),
  }),
});

export const {
  useCreateRefundRequestMutation,
  useGetRefundRequestsQuery,
  useGetMyRefundRequestsQuery,
  useGetUserBankDetailsQuery,
  useApproveRefundMutation,
  useRejectRefundMutation,
} = refundApi;
