import { baseApi } from "@/redux/api/baseApi";

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    //   GET all media
    getAllMedia: builder.query<any, any>({
      query: (params) => ({
        url: "/media",
        method: "GET",
        params,
      }),
    }),

    //   GET single media
    getMediaByIdOrSlug: builder.query<any, string>({
      query: (idOrSlug) => ({
        url: `/media/${idOrSlug}`,
        method: "GET",
      }),
      // Without a tag here nothing could invalidate this cache entry, so the
      // edit modal kept showing an image after it had been deleted until the
      // page was reloaded. Tagged by the argument and by the resolved id, since
      // this endpoint accepts either a slug or an id.
      providesTags: (result, _error, idOrSlug) => {
        const tags = [{ type: "Media" as const, id: idOrSlug }];
        const resolvedId = result?.data?.id;
        if (resolvedId && resolvedId !== idOrSlug) {
          tags.push({ type: "Media" as const, id: resolvedId });
        }
        return tags;
      },
    }),

    //   CREATE media metadata (JSON)
    createMedia: builder.mutation<any, any>({
      query: (data) => ({
        url: "/media",
        method: "POST",
        body: data,
      }),
    }),

    //   UPLOAD assets (multipart/form-data)
    uploadMediaAssets: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/media/${id}/assets`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Media" as const, id }],
    }),

    //   DELETE single asset from media
    deleteMediaAsset: builder.mutation<any, { mediaId: string; assetId: string }>({
      query: ({ mediaId, assetId }) => ({
        url: `/media/${mediaId}/assets/${assetId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { mediaId }) => [{ type: "Media" as const, id: mediaId }],
    }),
    //   TOGGLE like/vote
    toggleLike: builder.mutation<any, string>({
      query: (id) => ({
        url: `/media/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Media" as const, id }],
    }),

    //   CREATE comment
    createComment: builder.mutation<any, { id: string; content: string }>({
      query: ({ id, content }) => ({
        url: `/media/${id}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Media" as const, id: `COMMENTS_${id}` }],
    }),

    //   UPDATE media
    updateMedia: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/media/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Media" as const, id }, { type: "Media" as const, id: "LIST" }],
    }),

    //   DELETE media
    deleteMedia: builder.mutation<any, string>({
      query: (id) => ({
        url: `/media/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Media" as const, id: "LIST" }],
    }),

    //   GET all media for admin (including drafts)
    getAllMediaAdmin: builder.query<any, any>({
      query: (params) => ({
        url: "/media/admin/all-statuses",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ id }: { id: string }) => ({ type: "Media" as const, id })),
            { type: "Media" as const, id: "LIST" },
          ]
          : [{ type: "Media" as const, id: "LIST" }],
    }),

    //   GET comments
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
  useGetAllMediaAdminQuery,
  useCreateMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useUploadMediaAssetsMutation,
  useDeleteMediaAssetMutation,
  useGetMediaByIdOrSlugQuery,
  useToggleLikeMutation,
  useCreateCommentMutation,
  useGetMediaCommentsQuery,
} = mediaApi;
