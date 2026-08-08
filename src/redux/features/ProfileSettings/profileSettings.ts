import { baseApi } from "@/redux/api/baseApi";

export interface NotificationPreferences {
  emailNotifications: boolean;
  projectUpdates: boolean;
  securityAlerts: boolean;
}

export const profileSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updatedProfileInfo: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/users/profile",
        method: "PATCH",
        body: formData,
      }),
    }),

    updateNotificationPreferences: builder.mutation<
      any,
      Partial<NotificationPreferences>
    >({
      query: (body) => ({
        url: "/users/profile/notifications",
        method: "PATCH",
        // The endpoint validates with @IsBooleanString for multipart parity.
        body: Object.fromEntries(
          Object.entries(body).map(([k, v]) => [k, String(v)])
        ),
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useUpdatedProfileInfoMutation,
  useUpdateNotificationPreferencesMutation,
} = profileSettingsApi;
