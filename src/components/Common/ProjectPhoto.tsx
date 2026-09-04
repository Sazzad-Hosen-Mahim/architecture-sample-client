import { cn } from "@/lib/utils";
import {
  DEFAULT_FOCAL_POINT,
  projectImageSrcSet,
  projectImageUrl,
  type ProjectImage,
} from "@/utils/projectImage";

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
   * its own. Per-image values always win.
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
 * `object-cover` is what guarantees the "no bars down the sides" rule: the
 * image is scaled until it covers the box in both axes, so the only thing
 * that ever varies is how much of the frame is cropped — never whether the
 * box is filled. Which part survives that crop is `object-position`, taken
 * per image so a photo whose subject sits low can be pinned lower.
 *
 * The container is expected to be sized and `overflow-hidden`; this fills it.
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
  if (!image?.url) return null;

  return (
    <img
      src={projectImageUrl(image.url, 1600)}
      srcSet={projectImageSrcSet(image.url, image.width)}
      sizes={sizes}
      alt={image.altText || alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      onError={onError}
      className={cn("block h-full w-full object-cover", className)}
      style={{
        objectPosition: image.focalPoint || focalPoint || DEFAULT_FOCAL_POINT,
        ...style,
      }}
    />
  );
}
