import { baseApi } from "@/redux/api/baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET all users (staffs). The endpoint paginates at 20 by default, so the
    // limit is raised to keep the whole directory on one page.
    getAllUsers: builder.query<any[], { limit?: number; role?: string } | void>({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params: { limit: 100, ...(params || {}) },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["User"],
    }),

    /**
     * The signed-in user's own record, straight from the server.
     *
     * Profile Settings used to render from the persisted Redux user, which is
     * only written at login — so any field changed since then (or in another
     * session) showed blank even though the database had it. Reading it here
     * means the form always reflects what is actually stored.
     */
    getMe: builder.query<any, void>({
      query: () => ({ url: "/users/me", method: "GET" }),
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

    /**
     * Attach or clear a staff member's hiring-documents folder.
     *
     * Its own call rather than part of the member's form: the folder is
     * usually created after the person is, so this can be saved on an account
     * that already exists without touching anything else on it.
     */
    updateHiringDocuments: builder.mutation<
      any,
      { id: string; hiringDocumentsUrl: string | null }
    >({
      query: ({ id, hiringDocumentsUrl }) => ({
        url: `/auth/staff/${id}/hiring-documents`,
        method: "PATCH",
        body: { hiringDocumentsUrl },
      }),
      invalidatesTags: ["User"],
    }),

    // A client closing their own account. No id — the server takes the account
    // from the session, so this can only ever close the caller's own.
    deleteOwnAccount: builder.mutation<
      { success: boolean; message: string; deactivated?: boolean },
      { password: string }
    >({
      query: (body) => ({
        url: "/users/me",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // DELETE user - requires the acting admin's own password to confirm
    deleteUser: builder.mutation<any, { id: string; password: string }>({
      query: ({ id, password }) => ({
        url: `/users/${id}`,
        method: "DELETE",
        body: { password },
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
  useGetMeQuery,
  useGetAllUsersQuery,
  useCreateStaffMutation,
  useUpdateHiringDocumentsMutation,
  useDeleteUserMutation,
  useDeleteOwnAccountMutation,
  useUpdateUserMutation
} = userApi;
