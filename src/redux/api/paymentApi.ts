import { baseApi } from './baseApi';

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a Stripe checkout session
    createCheckoutSession: builder.mutation({
      query: (data) => ({
        url: '/payments/checkout',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PaymentStatus'],
    }),
    
    // Create a PaymentIntent for consultation fee
    createConsultationIntent: builder.mutation({
      query: () => ({
        url: '/payments/create-consultation-intent',
        method: 'POST',
      }),
    }),

    // Consultation-fee PaymentIntent for a visitor with no account yet.
    // Bound to the typed email instead of a user id.
    createConsultationIntentPublic: builder.mutation<
      { success: boolean; data: { clientSecret: string; paymentIntentId: string; amount: number } },
      { email: string }
    >({
      query: (body) => ({
        url: '/payments/create-consultation-intent/public',
        method: 'POST',
        body,
      }),
    }),
 
    // Get my payment history
    getMyPayments: builder.query({
      query: () => '/payments/my',
      providesTags: ['PaymentStatus'],
    }),
 
    // Get payment status for a project (per-stage paid/unpaid)
    getPaymentStatus: builder.query({
      query: (projectRequestId: string) => `/payments/status/${projectRequestId}`,
      providesTags: ['PaymentStatus'],
    }),
 
    // Confirm a payment (after redirect from Stripe)
    confirmPayment: builder.mutation({
      query: (paymentId: string) => ({
        url: `/payments/${paymentId}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: ['PaymentStatus'],
    }),
 
    // Get project payments (admin)
    getProjectPayments: builder.query({
      query: (projectRequestId: string) => `/payments/project/${projectRequestId}`,
      providesTags: ['PaymentStatus'],
    }),
  }),
});

export const {
  useCreateCheckoutSessionMutation,
  useCreateConsultationIntentMutation,
  useCreateConsultationIntentPublicMutation,
  useGetMyPaymentsQuery,
  useGetPaymentStatusQuery,
  useConfirmPaymentMutation,
  useGetProjectPaymentsQuery,
} = paymentApi;
