import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import Cookies from "js-cookie";

// Define a service using a base URL and expected endpoints
export const baseApi = createApi({
  reducerPath: "baseApi", // or just "api" if you prefer
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:3000/v1",
    credentials: "include",
    // baseUrl: "https://eric-architecture.onrender.com/v1",

    prepareHeaders: (headers, { getState }) => {
      const token =
        (getState() as RootState).auth.accessToken ||
        Cookies.get("accessToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
  tagTypes: ["User", "Project", "Amendment", "MasterContract", "AmendmentContract", "Media", "Notification", "OverheadExpense", "Timecard", "FinancialOverview"],
});
