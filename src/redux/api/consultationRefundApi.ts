import { baseApi } from "./baseApi";

export interface ConsultationRefund {
  id: string;
  projectRequestId: string;
  clientName: string;
  email: string;
  projectName: string;
  amount: string;
  consultationPaymentId: string;
  status: "PENDING" | "PROCESSED";
  stripeRefundId: string | null;
  processedAt: string | null;
  notes: string | null;
  createdAt: string;
  requestedBy?: { id: string; name: string | null; email: string } | null;
  processedBy?: { id: string; name: string | null; email: string } | null;
  projectRequest?: {
    id: string;
    inquiryStatus: string | null;
    deletedAt: string | null;
  } | null;
}

interface ConsultationRefundListResponse {
  success: boolean;
  data: ConsultationRefund[];
  pending: number;
}

export const consultationRefundApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConsultationRefunds: builder.query<ConsultationRefundListResponse, void>({
      query: () => "/consultation-refunds",
      providesTags: ["Refund"],
    }),

    // One click: Stripe refund to the card + mark processed.
    processConsultationRefund: builder.mutation<
      { success: boolean; message: string; data: ConsultationRefund },
      string
    >({
      query: (id) => ({
        url: `/consultation-refunds/${id}/process`,
        method: "POST",
      }),
      invalidatesTags: ["Refund"],
    }),
  }),
});

export const {
  useGetConsultationRefundsQuery,
  useProcessConsultationRefundMutation,
} = consultationRefundApi;
