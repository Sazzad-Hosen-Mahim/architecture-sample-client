import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

// Define a service using a base URL and expected endpoints
export const baseApi = createApi({
  reducerPath: "baseApi", // or just "api" if you prefer
  baseQuery: fetchBaseQuery({
    // baseUrl: "http://localhost:5000/api",
    // baseUrl: "https://api.covermate.org/api/v1",   // Example
    // baseUrl: "https://ericriverra-backend.onrender.com/api/v1",
    baseUrl: "https://ericriverra-backend-1.onrender.com/api/v1",

    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
  tagTypes: ["User", ""],
});
