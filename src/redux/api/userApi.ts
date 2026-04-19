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

    // DELETE user
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // UPDATE user
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const { 
  useGetAllUsersQuery, 
  useCreateStaffMutation, 
  useDeleteUserMutation, 
  useUpdateUserMutation 
} = userApi;
