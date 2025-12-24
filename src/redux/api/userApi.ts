import { baseApi } from "@/redux/api/baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET all users (staffs)
    getAllUsers: builder.query<any[], void>({
      query: () => ({
        url: "/users",
        method: "GET",
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["User"],
    }),

    // CREATE staff/admin
    createStaff: builder.mutation({
      query: (data) => ({
        url: "/auth/staff/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useGetAllUsersQuery, useCreateStaffMutation } = userApi;
