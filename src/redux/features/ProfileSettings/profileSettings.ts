import { baseApi } from "@/redux/api/baseApi";

export const profileSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updatedProfileInfo: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/users/profile",
        method: "PATCH",
        body: formData,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useUpdatedProfileInfoMutation } = profileSettingsApi;
