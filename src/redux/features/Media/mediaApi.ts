import { baseApi } from "@/redux/api/baseApi";

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ GET all media
    getAllMedia: builder.query<any, void>({
      query: () => ({
        url: "/media",
        method: "GET",
      }),
    }),

    // ✅ CREATE media (multipart/form-data)
    createMedia: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/media",
        method: "POST",
        body: formData,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetAllMediaQuery, useCreateMediaMutation } = mediaApi;
