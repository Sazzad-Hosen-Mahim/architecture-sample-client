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

/**
 * One crop window, stored as fractions of the original rather than pixels, so
 * the same four numbers stay correct against every rendition of the photo.
 */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * An editor's choice of what to show, per shape of frame. `wide` serves
 * desktops and landscape tablets, `tall` serves phones — one rectangle cannot
 * do both, since the two are close to inverses of each other. A missing side
 * leaves that shape to the automatic fit.
 */
export interface AssetCrop {
  wide?: CropRect | null;
  tall?: CropRect | null;
}

/**
 * The `c_crop` step, as its own transformation component.
 *
 * It has to be chained ahead of TRANSFORM rather than merged into it, because
 * `c_crop` and `c_limit` are both crop modes and only one can win per
 * component. Chained, the picture is cut down first and the result is then
 * capped to the requested width — which is the order that makes `w_` mean
 * "this many pixels of the chosen region".
 */
const cropTransform = (crop?: CropRect | null): string | null => {
  if (!crop) return null;

  const { x, y, width, height } = crop;
  if (![x, y, width, height].every(Number.isFinite)) return null;

  // Cloudinary reads a decimal below 1 as a fraction and anything from 1 up as
  // a pixel count, so a full-extent 1.0 would silently ask for a single pixel.
  const w = Math.min(Math.max(width, 0.0001), 0.9999);
  const h = Math.min(Math.max(height, 0.0001), 0.9999);

  return `c_crop,x_${Math.max(x, 0)},y_${Math.max(y, 0)},w_${w},h_${h}`;
};

/**
 * The same photo, delivered at (at most) `width` CSS pixels, optionally cut
 * down to `crop` first. The crop is baked into the URL rather than applied in
 * the browser so the CDN caches the cropped rendition and the bytes that were
 * cropped away are never sent.
 */
export const projectImageUrl = (
  url: string,
  width: number,
  crop?: CropRect | null,
): string => {
  if (!isCloudinaryUrl(url)) return url;

  const cropStep = cropTransform(crop);
  return url.replace(
    CLOUDINARY_UPLOAD,
    (segment) =>
      `${segment}${cropStep ? `${cropStep}/` : ""}${TRANSFORM},w_${width}/`,
  );
};

/**
 * A `srcset` covering phone through 5K.
 *
 * `intrinsicWidth` is the stored file's real width (`MediaAsset.width`). When
 * it is known, candidates stop there and the original is offered as the top
 * entry — no point advertising a 3200w source that would be an upscale of a
 * 1620px file. A crop lowers that ceiling in proportion, since half of a
 * 3000px photo is a 1500px source. Returns `undefined` for non-Cloudinary URLs
 * so the caller can spread it onto an `<img>` and get plain `src` behaviour.
 */
export const projectImageSrcSet = (
  url: string,
  intrinsicWidth?: number | null,
  crop?: CropRect | null,
): string | undefined => {
  if (!isCloudinaryUrl(url)) return undefined;

  const sourceWidth =
    intrinsicWidth && crop?.width
      ? Math.round(intrinsicWidth * crop.width)
      : intrinsicWidth;

  const widths = CANDIDATE_WIDTHS.filter(
    (width) => !sourceWidth || width < sourceWidth,
  );
  if (sourceWidth) widths.push(sourceWidth);

  return widths
    .map((width) => `${projectImageUrl(url, width, crop)} ${width}w`)
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

/**
 * The fraction of a photograph that survives `object-fit: cover` in a box of a
 * given shape: 1 when the two are the same shape, falling towards 0 as they
 * diverge. Symmetric — it makes no difference which of the two is the wider.
 *
 * A 1200×1600 portrait (0.75) in a 1920×850 desktop hero (2.26) scores 0.33,
 * i.e. two thirds of the picture is cut away to fill the box. That number is
 * what decides whether a photo can be cropped to fit or has to be fitted whole.
 */
export const coverVisibleFraction = (
  imageAspect: number,
  frameAspect: number,
): number =>
  Math.min(imageAspect, frameAspect) / Math.max(imageAspect, frameAspect);

/**
 * How much of a photo `cover` may throw away before we stop cropping it.
 *
 * Above this, cropping is what a full-bleed hero is for and the loss is the
 * edges of a frame nobody misses. Below it — a portrait upload on a desktop
 * hero, or a landscape one on a phone — the crop stops being a crop and starts
 * being a magnified detail of the picture, which is not what was uploaded. Such
 * photos are fitted whole against a blurred enlargement of themselves instead,
 * so the frame is still filled edge to edge with nothing lost.
 *
 * 0.65 keeps ordinary 3:2 and 16:9 photography full-bleed on a desktop hero
 * and rescues the shapes that genuinely do not fit. Lower it to crop harder.
 */
export const MIN_VISIBLE_FRACTION = 0.65;

/**
 * The shapes the crop editor works to.
 *
 * A hero has no single aspect ratio — it is whatever the layout leaves below
 * the navbar on the visitor's screen — so these are the representative ones an
 * editor is shown while choosing: a 16:9 desktop viewport less the 4rem navbar
 * (1920×1016), and a phone (390×828, including the hero's mobile overshoot).
 *
 * A visitor on a shape somewhat different from these still sees the chosen
 * region; it is the automatic fit that takes up the remaining slack, which is
 * why a crop is a strong hint rather than a pixel contract.
 */
export const WIDE_FRAME_ASPECT = 1.89;
export const TALL_FRAME_ASPECT = 0.47;

/**
 * The crop that applies to a frame of a given shape. Landscape frames take the
 * wide crop, portrait ones the tall crop; where the applicable side was never
 * set, there is no crop and the automatic fit decides.
 */
export const cropForFrame = (
  crop: AssetCrop | null | undefined,
  frameAspect: number,
): CropRect | null =>
  (frameAspect >= 1 ? crop?.wide : crop?.tall) ?? null;

/** One image as the project pages consume it. */
export interface ProjectImage {
  url: string;
  /** Stored width in pixels, when the asset record carries it. */
  width?: number | null;
  height?: number | null;
  /** Per-image `object-position`, once the CMS can set it. */
  focalPoint?: string | null;
  altText?: string | null;
  /** Editor's chosen region per frame shape, when one has been set. */
  crop?: AssetCrop | null;
}

/**
 * Normalises a `MediaAsset` row into the shape the image components take.
 * Assets arrive as `any` from the API layer, so the mapping lives in one place
 * instead of being repeated at every call site.
 */
/**
 * A crop is a JSON column, so it arrives as whatever was written to it — and
 * this codebase stringifies some JSON columns on the way in. Anything that is
 * not four usable numbers is treated as no crop at all, which falls back to the
 * automatic fit rather than producing a delivery URL the CDN would reject.
 */
const isFinite_ = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toCropRect = (value: unknown): CropRect | null => {
  if (!value || typeof value !== "object") return null;

  const { x, y, width, height } = value as Partial<CropRect>;
  if (!isFinite_(x) || !isFinite_(y) || !isFinite_(width) || !isFinite_(height)) {
    return null;
  }
  if (width <= 0 || height <= 0) return null;

  return { x, y, width, height };
};

export const toAssetCrop = (value: unknown): AssetCrop | null => {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;

  const { wide, tall } = raw as { wide?: unknown; tall?: unknown };
  const wideRect = toCropRect(wide);
  const tallRect = toCropRect(tall);
  return wideRect || tallRect ? { wide: wideRect, tall: tallRect } : null;
};

export const toProjectImage = (asset: any): ProjectImage | null => {
  const url = asset?.cdnUrl;
  if (!url) return null;
  return {
    url,
    width: asset.width ?? null,
    height: asset.height ?? null,
    focalPoint: asset.focalPoint ?? null,
    altText: asset.altText ?? null,
    crop: toAssetCrop(asset.crop),
  };
};

/** Maps a media record's `assets` array, dropping anything without a URL. */
export const toProjectImages = (assets: any): ProjectImage[] =>
  (Array.isArray(assets) ? assets : [])
    .map(toProjectImage)
    .filter((image): image is ProjectImage => image !== null);
