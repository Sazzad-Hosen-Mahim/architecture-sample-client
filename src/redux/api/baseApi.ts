import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import Cookies from "js-cookie";
import { isViewOnly } from "@/utils/dashboardAccess";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: "include",

  prepareHeaders: (headers, { getState }) => {
    const token =
      (getState() as RootState).auth.accessToken || Cookies.get("accessToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * Writes a view-only account is still entitled to make: signing in, changing
 * their own password, editing their own profile, clearing their own
 * notifications, and filling in their own timecard. Everything else that
 * changes data belongs to someone with an editing role.
 */
const SELF_SERVICE_WRITES = [
  /^\/auth\//,
  /^\/users\/me$/,
  /^\/contact$/,
  // Their own notifications — but not the project accept/reject decisions
  // those notifications can carry, which are excluded below.
  /^\/notifications\//,
  // Their own timecard: create, edit, submit. Approve/reject are a manager's.
  /^\/financial\/timecards(\/[^/]+(\/submit)?)?$/,
];

/** Carved back out of the patterns above — these are decisions, not upkeep. */
const NEVER_SELF_SERVICE = [
  /^\/notifications\/[^/]+\/(accept|reject)-project$/,
  /^\/financial\/timecards\/[^/]+\/(approve|reject)$/,
  // Look like an id in the pattern above, but are payroll-wide actions.
  /^\/financial\/timecards\/(archive|unarchive)$/,
];

const isSelfServiceWrite = (url: string): boolean =>
  SELF_SERVICE_WRITES.some((p) => p.test(url)) &&
  !NEVER_SELF_SERVICE.some((p) => p.test(url));

/**
 * Drafters and employees read the dashboard; they do not change it.
 *
 * Enforced here rather than only by hiding buttons, because hiding a button
 * leaves the request one devtools call away, and because a single check here
 * covers every mutation in the app — including ones added later — instead of
 * relying on each new screen remembering to ask.
 *
 * The backend's `@Roles` guards remain the real boundary; this is what makes
 * the app behave consistently before a request is ever sent.
 */
const baseQueryWithViewOnlyGuard: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const method = (typeof args === "string" ? "GET" : args.method) ?? "GET";
  const url = typeof args === "string" ? args : args.url;

  if (
    method.toUpperCase() !== "GET" &&
    isViewOnly((api.getState() as RootState).auth.user) &&
    !isSelfServiceWrite(url)
  ) {
    return {
      error: {
        status: 403,
        data: {
          message:
            "Your account has view-only access, so this change wasn't saved.",
        },
      } as FetchBaseQueryError,
    };
  }

  return rawBaseQuery(args, api, extraOptions);
};

// Define a service using a base URL and expected endpoints
export const baseApi = createApi({
  reducerPath: "baseApi", // or just "api" if you prefer
  baseQuery: baseQueryWithViewOnlyGuard,
  endpoints: () => ({}),
  tagTypes: ["User", "Project", "Amendment", "MasterContract", "AmendmentContract", "Media", "Notification", "OverheadExpense", "Timecard", "FinancialOverview", "BillingRate", "Team", "MercuryAccount", "BankDetails", "PaymentStatus", "SiteSettings", "Attachment", "ProjectDocument", "PayrollSettings", "Refund", "Schedule", "Invoice"],
});
