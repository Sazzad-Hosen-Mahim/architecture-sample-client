/**
 * Delivery helpers for project photography.
 *
 * Every asset is uploaded through Cloudinary (`MediaAsset.cdnUrl` is the
 * `secure_url` we get back), which means the delivery URL can be rewritten to
 * ask for a specific width. That is what lets a hero serve a 640px file to a
 * phone and a 2400px file to a 5K display from one stored original.
 *
 * Anything that is not a Cloudinary delivery URL — a seeded Unsplash link, a
 * local `/placeholder.svg` — passes through untouched, so callers never need
 * to know where a given image came from.
 */

/** Matches the `/image/upload/` segment that transformations slot in after. */
const CLOUDINARY_UPLOAD = /\/(?:image|video)\/upload\//;

/**
 * Widths we are willing to request, in CSS pixels. Deliberately reaches past
 * what the pipeline stores today: `c_limit` never upscales, so an oversized
 * request just returns the largest file that exists. The day the upload
 * pipeline keeps more pixels, these candidates start paying off on their own.
 */
const CANDIDATE_WIDTHS = [640, 828, 1080, 1280, 1600, 1920, 2400, 3200];

/**
 * `f_auto` picks AVIF/WebP per browser, `q_auto:good` holds detail in the
 * stone/glass gradients that architecture shots live on, and `c_limit` caps
 * the width without ever enlarging or cropping — cropping is the browser's
 * job here, via object-fit/object-position.
 */
const TRANSFORM = "f_auto,q_auto:good,c_limit";

export const isCloudinaryUrl = (url: string): boolean =>
  typeof url === "string" && CLOUDINARY_UPLOAD.test(url);

/** The same photo, delivered at (at most) `width` CSS pixels. */
export const projectImageUrl = (url: string, width: number): string =>
  isCloudinaryUrl(url)
    ? url.replace(CLOUDINARY_UPLOAD, (segment) => `${segment}${TRANSFORM},w_${width}/`)
    : url;

/**
 * A `srcset` covering phone through 5K.
 *
 * `intrinsicWidth` is the stored file's real width (`MediaAsset.width`). When
 * it is known, candidates stop there and the original is offered as the top
 * entry — no point advertising a 3200w source that would be an upscale of a
 * 1620px file. Returns `undefined` for non-Cloudinary URLs so the caller can
 * spread it onto an `<img>` and get plain `src` behaviour.
 */
export const projectImageSrcSet = (
  url: string,
  intrinsicWidth?: number | null,
): string | undefined => {
  if (!isCloudinaryUrl(url)) return undefined;

  const widths = CANDIDATE_WIDTHS.filter(
    (width) => !intrinsicWidth || width < intrinsicWidth,
  );
  if (intrinsicWidth) widths.push(intrinsicWidth);

  return widths
    .map((width) => `${projectImageUrl(url, width)} ${width}w`)
    .join(", ");
};

/**
 * Where the crop should hold when the container is a different shape from the
 * photo — any CSS `object-position` value.
 *
 * `center 60%` is the house default rather than `center center`: architecture
 * photos put the building's base and its approach in the lower third, so
 * biasing the visible window downwards keeps the part of the frame that
 * matters and takes the crop out of the sky instead.
 */
export const DEFAULT_FOCAL_POINT = "center 60%";

/** One image as the project pages consume it. */
export interface ProjectImage {
  url: string;
  /** Stored width in pixels, when the asset record carries it. */
  width?: number | null;
  height?: number | null;
  /** Per-image `object-position`, once the CMS can set it. */
  focalPoint?: string | null;
  altText?: string | null;
}

/**
 * Normalises a `MediaAsset` row into the shape the image components take.
 * Assets arrive as `any` from the API layer, so the mapping lives in one place
 * instead of being repeated at every call site.
 */
export const toProjectImage = (asset: any): ProjectImage | null => {
  const url = asset?.cdnUrl;
  if (!url) return null;
  return {
    url,
    width: asset.width ?? null,
    height: asset.height ?? null,
    focalPoint: asset.focalPoint ?? null,
    altText: asset.altText ?? null,
  };
};

/** Maps a media record's `assets` array, dropping anything without a URL. */
export const toProjectImages = (assets: any): ProjectImage[] =>
  (Array.isArray(assets) ? assets : [])
    .map(toProjectImage)
    .filter((image): image is ProjectImage => image !== null);
