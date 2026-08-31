import { baseApi } from './baseApi';

export const clientUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all client users with full details (admin/finance only)
    getClientUsers: builder.query({
      query: () => '/users/clients',
      // So the directory refetches after a client is deleted (deleteUser
      // invalidates "User").
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetClientUsersQuery,
} = clientUsersApi;
