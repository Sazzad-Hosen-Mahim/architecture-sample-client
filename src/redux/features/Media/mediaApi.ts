import { baseApi } from "@/redux/api/baseApi";

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ GET all media
    getAllMedia: builder.query<any, any>({
      query: (params) => ({
        url: "/media",
        method: "GET",
        params,
      }),
    }),

    // ✅ GET single media
    getMediaByIdOrSlug: builder.query<any, string>({
      query: (idOrSlug) => ({
        url: `/media/${idOrSlug}`,
        method: "GET",
      }),
    }),

    // ✅ CREATE media metadata (JSON)
    createMedia: builder.mutation<any, any>({
      query: (data) => ({
        url: "/media",
        method: "POST",
        body: data,
      }),
    }),

    // ✅ UPLOAD assets (multipart/form-data)
    uploadMediaAssets: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/media/${id}/assets`,
        method: "POST",
        body: formData,
      }),
    }),
    // ✅ TOGGLE like/vote
    toggleLike: builder.mutation<any, string>({
      query: (id) => ({
        url: `/media/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Media" as const, id }],
    }),

    // ✅ CREATE comment
    createComment: builder.mutation<any, { id: string; content: string }>({
      query: ({ id, content }) => ({
        url: `/media/${id}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Media" as const, id: `COMMENTS_${id}` }],
    }),

    // ✅ GET comments
    getMediaComments: builder.query<any, { id: string; page?: number; limit?: number }>({
      query: ({ id, ...params }) => ({
        url: `/media/${id}/comments`,
        method: "GET",
        params,
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Media" as const, id: `COMMENTS_${id}` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllMediaQuery,
  useCreateMediaMutation,
  useUploadMediaAssetsMutation,
  useGetMediaByIdOrSlugQuery,
  useToggleLikeMutation,
  useCreateCommentMutation,
  useGetMediaCommentsQuery,
} = mediaApi;
