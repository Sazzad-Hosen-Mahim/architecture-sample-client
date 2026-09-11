import { baseApi } from "@/redux/api/baseApi";

export type InvoiceType = "REIMBURSABLE_EXPENSE" | "ADDITIONAL_SERVICE";
export type InvoiceStatus = "SENT" | "PAID" | "CANCELLED";

export interface Invoice {
  id: string;
  projectRequestId: string;
  proposalId: string | null;
  name: string;
  description: string | null;
  type: InvoiceType;
  amount: string;
  status: InvoiceStatus;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string | null; email: string } | null;
  cancelledBy?: { id: string; name: string | null; email: string } | null;
  proposal?: {
    id: string;
    proposalNumber: string;
    title: string;
    proposalType: "NORMAL" | "AMENDMENT";
  } | null;
}

/**
 * Bills raised against a project outside its contract.
 *
 * Tagged "Invoice" by project so raising or cancelling one refreshes the list
 * it came from, and "Financial" so the dashboard totals follow — an invoice
 * moves Gross Revenue and the reimbursable cost line, and leaving those stale
 * is how the two panels end up disagreeing.
 */
export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjectInvoices: builder.query<Invoice[], string>({
      query: (projectId) => ({
        url: `/projects/${projectId}/invoices`,
        method: "GET",
      }),
      transformResponse: (response: { data: Invoice[] }) => response.data ?? [],
      providesTags: (_result, _error, projectId) => [
        { type: "Invoice" as const, id: projectId },
      ],
    }),

    createInvoice: builder.mutation<
      Invoice,
      {
        projectId: string;
        name: string;
        type: InvoiceType;
        amount: number;
        description?: string;
        proposalId?: string;
      }
    >({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/invoices`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: Invoice }) => response.data,
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Invoice" as const, id: projectId },
        "FinancialOverview",
      ],
    }),

    cancelInvoice: builder.mutation<
      Invoice,
      { projectId: string; invoiceId: string; reason?: string }
    >({
      query: ({ projectId, invoiceId, reason }) => ({
        url: `/projects/${projectId}/invoices/${invoiceId}/cancel`,
        method: "PATCH",
        body: { reason },
      }),
      transformResponse: (response: { data: Invoice }) => response.data,
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Invoice" as const, id: projectId },
        "FinancialOverview",
      ],
    }),

    /** Opens Stripe checkout; the caller sends the client to `checkoutUrl`. */
    payInvoice: builder.mutation<
      { sessionId: string; checkoutUrl: string },
      { projectId: string; invoiceId: string }
    >({
      query: ({ projectId, invoiceId }) => ({
        url: `/projects/${projectId}/invoices/${invoiceId}/checkout`,
        method: "POST",
      }),
      transformResponse: (response: {
        data: { sessionId: string; checkoutUrl: string };
      }) => response.data,
    }),

    /**
     * Settles an invoice the client has just paid, on their return from Stripe.
     *
     * The webhook is the primary path, but it is a call into the API server —
     * it is late sometimes and, on a machine Stripe cannot reach, never comes
     * at all. This asks Stripe directly, and settling is idempotent, so
     * whichever arrives second changes nothing.
     */
    confirmInvoicePayment: builder.mutation<
      Invoice,
      { projectId: string; invoiceId: string }
    >({
      query: ({ projectId, invoiceId }) => ({
        url: `/projects/${projectId}/invoices/${invoiceId}/confirm`,
        method: "POST",
      }),
      transformResponse: (response: { data: Invoice }) => response.data,
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Invoice" as const, id: projectId },
        "FinancialOverview",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProjectInvoicesQuery,
  useCreateInvoiceMutation,
  useCancelInvoiceMutation,
  usePayInvoiceMutation,
  useConfirmInvoicePaymentMutation,
} = invoiceApi;
