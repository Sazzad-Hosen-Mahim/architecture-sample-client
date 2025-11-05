import { baseApi } from "../../api/baseApi";

const profileSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updatedProfileInfo: builder.mutation({
      query: (formData: FormData) => ({
        url: "/auth/update-profile",
        method: "PATCH",
        body: formData,
      }),
    }),
    // get all media
  }),
});

export const { useUpdatedProfileInfoMutation } = profileSettingsApi;
