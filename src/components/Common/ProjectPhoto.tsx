import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  coverVisibleFraction,
  cropForFrame,
  DEFAULT_FOCAL_POINT,
  MIN_VISIBLE_FRACTION,
  projectImageSrcSet,
  projectImageUrl,
  type ProjectImage,
} from "@/utils/projectImage";
import { fitCropToFrame } from "@/utils/cropGeometry";

/**
 * Width requested for the blurred backdrop. It is scaled up over the whole
 * frame and then blurred into mush, so anything larger is bytes spent on
 * detail that the filter destroys.
 */
const BACKDROP_WIDTH = 96;

interface ProjectPhotoProps {
  image: ProjectImage | null | undefined;
  alt: string;
  /**
   * How wide the photo renders, for the browser's `srcset` maths. Defaults to
   * the full viewport, which is what a full-bleed hero is.
   */
  sizes?: string;
  /**
   * `object-position` to use when the image record carries no focal point of
   * its own. Per-image values always win. Only consulted when the photo is
   * being cropped — a photo fitted whole has nothing to position.
   */
  focalPoint?: string;
  /** Set on the first/visible photo so it is fetched ahead of the carousel. */
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

/**
 * A project photograph that fills its container edge to edge.
 *
 * The frame is always filled — that part is not negotiable — but *how* depends
 * on how close the photo's shape is to the frame's:
 *
 *   - Shapes that are near enough are cropped to fill (`object-cover`), which
 *     is the full-bleed look, with `object-position` deciding which part of the
 *     frame survives.
 *   - Shapes that are too far apart — a portrait upload on a wide desktop hero,
 *     a landscape one on a phone — would have to be magnified so far that only
 *     a detail of the picture remains. Those are fitted whole
 *     (`object-contain`) over a blurred enlargement of themselves, so the frame
 *     still fills to the edges but nothing is cut off.
 *
 * MIN_VISIBLE_FRACTION is the line between the two. Until an admin can choose
 * the crop by hand, this is what keeps an oddly shaped upload from arriving on
 * the home page as an unrecognisable close-up.
 *
 * The container is expected to be sized and positioned; this fills it.
 */
export default function ProjectPhoto({
  image,
  alt,
  sizes = "100vw",
  focalPoint,
  priority = false,
  className,
  style,
  onError,
}: ProjectPhotoProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameAspect, setFrameAspect] = useState<number | null>(null);
  /**
   * Fallback for images whose record carries no dimensions — a seeded Unsplash
   * link, a placeholder — read off the decoded file instead.
   */
  const [loadedAspect, setLoadedAspect] = useState<number | null>(null);

  // The frame is responsive: the same hero is ~1.9:1 on a desktop and taller
  // than it is wide on a phone, and both which crop applies and whether the
  // photo is cropped at all flip between the two. Measured in a layout effect
  // so the first painted frame is already the right one — a ResizeObserver's
  // opening callback lands after paint, which would show the wrong crop first.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const { clientWidth, clientHeight } = frame;
      if (clientWidth > 0 && clientHeight > 0) {
        setFrameAspect(clientWidth / clientHeight);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // A carousel reuses this component for the next photo, which must not be
  // judged by the shape of the one before it.
  useEffect(() => {
    setLoadedAspect(null);
  }, [image?.url]);

  if (!image?.url) return null;

  // From the record when it has dimensions, where the crop still has to be
  // applied by hand. `loadedAspect` is measured off the delivered file, which
  // already came out of Cloudinary cropped — applying it again would square it.
  const intrinsicAspect =
    image.width && image.height ? image.width / image.height : null;

  // An editor's choice for this shape of frame, where one was made, reshaped to
  // this particular screen so the browser is left with nothing to crop. It is
  // cut out of the delivered file, so everything below reasons about the region
  // that survives it rather than the whole picture.
  const chosenCrop = frameAspect ? cropForFrame(image.crop, frameAspect) : null;
  const crop =
    chosenCrop && intrinsicAspect && frameAspect
      ? fitCropToFrame(chosenCrop, intrinsicAspect, frameAspect)
      : chosenCrop;

  const croppedAspect = intrinsicAspect
    ? crop
      ? intrinsicAspect * (crop.width / crop.height)
      : intrinsicAspect
    : loadedAspect;

  // Both measurements are needed to make the call. Until they arrive, crop —
  // the behaviour every photo had before, so nothing flickers into place. A
  // crop chosen against the frame's own shape lands at ~1 here and fills it;
  // one deliberately chosen squarer than the frame is fitted whole, since the
  // point of choosing a region is that it is not then cut down again.
  const visibleFraction =
    croppedAspect && frameAspect
      ? coverVisibleFraction(croppedAspect, frameAspect)
      : 1;
  const isCropped = visibleFraction >= MIN_VISIBLE_FRACTION;

  return (
    <div
      ref={frameRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={style}
    >
      {/* Fills the space a fitted photo leaves over, so the frame still reaches
          the edges instead of showing bars. Scaled past the frame because the
          blur samples beyond its own edges and would otherwise fade out. */}
      {!isCropped && (
        <img
          src={projectImageUrl(image.url, BACKDROP_WIDTH, crop)}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          fetchPriority="low"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
        />
      )}

      <img
        src={projectImageUrl(image.url, 1600, crop)}
        srcSet={projectImageSrcSet(image.url, image.width, crop)}
        sizes={sizes}
        alt={image.altText || alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
        onLoad={(event) => {
          if (image.width && image.height) return;
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth > 0 && naturalHeight > 0) {
            setLoadedAspect(naturalWidth / naturalHeight);
          }
        }}
        onError={onError}
        className={cn(
          "relative block h-full w-full",
          isCropped ? "object-cover" : "object-contain",
        )}
        style={{
          // A deliberate crop has already decided the framing, and has been
          // reshaped to this frame besides, so there is nothing left to bias:
          // the house focal point would only pull the picture off the centre
          // the editor chose. It is for photos arriving with no crop at all.
          objectPosition: crop
            ? "center"
            : isCropped
              ? image.focalPoint || focalPoint || DEFAULT_FOCAL_POINT
              : "center",
        }}
      />
    </div>
  );
}
