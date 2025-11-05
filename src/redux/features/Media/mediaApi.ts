import { baseApi } from "../../api/baseApi";

const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createMedia: builder.mutation({
      query: (formData: FormData) => ({
        url: "/media/create",
        method: "POST",
        body: formData,
      }),
    }),
    // get all media
    getAllMedia: builder.query({
      query: () => ({
        url: "/media/me", // your GET endpoint
        method: "GET",
      }),
    }),
  }),
});

export const { useCreateMediaMutation, useGetAllMediaQuery } = mediaApi;
