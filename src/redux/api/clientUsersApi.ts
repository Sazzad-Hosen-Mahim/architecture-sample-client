import { baseApi } from './baseApi';

export const clientUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all client users with full details (admin/finance only)
    getClientUsers: builder.query({
      query: () => '/users/clients',
    }),
  }),
});

export const {
  useGetClientUsersQuery,
} = clientUsersApi;
