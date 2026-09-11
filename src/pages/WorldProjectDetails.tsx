import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Calendar,
  User,
  Camera,
  Earth,
  Sun,
  Building2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useGetMediaByIdOrSlugQuery } from "@/redux/features/Media/mediaApi";
import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";
import ProjectPhoto from "@/components/Common/ProjectPhoto";
import ImageLightbox from "@/components/Common/ImageLightbox";
import {
  projectImageUrl,
  toProjectImages,
  type ProjectImage,
} from "@/utils/projectImage";

/** The gallery sits in a max-w-5xl column, not the full window. */
const GALLERY_SIZES = "(min-width: 1088px) 1024px, calc(100vw - 2rem)";

const PLACEHOLDER: ProjectImage = { url: "/placeholder.svg" };

/**
 * One labelled fact in the Project Details grid.
 *
 * The `min-w-0`s are the load-bearing part. Grid and flex items size to their
 * content by default, so a two-part value like "Los Rios, Ecuador" made its
 * column wider than the share of the row it was given, and the far column was
 * pushed out of the card. The icon needs the opposite treatment: without
 * `shrink-0` the squeeze came out of the circle instead and flattened it into
 * an oval.
 */
const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
      <Icon size={18} className="text-gray-600" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  </div>
);

// "NORTH_AMERICA" -> "North America", "TROPICAL" -> "Tropical"
const toTitleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function WorldProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  // Arrow colour adapts to the brightness of the photo edge behind it.
  const [arrowTone, setArrowTone] = useState<"light" | "dark">("light");

  const { data: response, isLoading } = useGetMediaByIdOrSlugQuery(id || "");

  const item = response?.data;
  const isPortfolio = item?.contentType === "PORTFOLIO";

  const project = useMemo(() => {
    if (!item) return null;

    // Clean location string, no dangling "undefined" / "TBA".
    let locationName = "Global";
    if (item.location) {
      locationName = item.location;
    } else if (item.city && item.country) {
      locationName = `${item.city}, ${item.country}`;
    } else if (item.city || item.country) {
      locationName = item.city || item.country;
    }

    return {
      id: item.id,
      name: item.title,
      PublishedDate: item.publishDate
        ? new Date(item.publishDate).toLocaleDateString()
        : new Date(item.createdAt).toLocaleDateString(),
      Architect: item.architect || "TBA",
      Photographer: item.photographer || "TBA",
      description: item.content,
      locationName,
      continent: item.continent ? toTitleCase(item.continent) : "TBA",
      climate: item.climate ? toTitleCase(item.climate) : "TBA",
      projectType: item.category ? toTitleCase(item.category) : "TBA",
      year: item.projectYear || 2024,
      tags: item.projectTags || [],
      images: toProjectImages(item.assets),
    };
  }, [item]);

  const images = useMemo<ProjectImage[]>(
    () =>
      project && project.images.length > 0 ? project.images : [PLACEHOLDER],
    [project],
  );
  const activeIndex = Math.min(selectedImage, images.length - 1);

  // Sample the current image's left/right edges to pick a contrasting arrow colour.
  useEffect(() => {
    const image = images[activeIndex];
    if (!image?.url || image.url === PLACEHOLDER.url) {
      setArrowTone("dark");
      return;
    }
    // A 64px render is plenty to average the edge brightness, and it keeps
    // this probe off the critical path of the full-size photo.
    const src = projectImageUrl(image.url, 64);
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const w = 48;
        const h = 48;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let total = 0;
        let count = 0;
        for (let y = Math.floor(h * 0.35); y < Math.floor(h * 0.65); y++) {
          for (const x of [1, 2, 3, w - 4, w - 3, w - 2]) {
            const i = (y * w + x) * 4;
            total +=
              0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            count++;
          }
        }
        const avg = count ? total / count : 128;
        setArrowTone(avg < 140 ? "light" : "dark");
      } catch {
        // CORS-tainted canvas — keep the always-visible white + shadow arrows.
        setArrowTone("light");
      }
    };
    img.onerror = () => !cancelled && setArrowTone("light");
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [images, activeIndex]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-xl font-semibold mb-4">Project not found</h2>
        </div>
      </div>
    );
  }

  const goPrev = () =>
    setSelectedImage((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setSelectedImage((i) => (i + 1) % images.length);

  const arrowClass =
    arrowTone === "light"
      ? "bg-black/20 hover:bg-black/40 text-white [filter:drop-shadow(0_0_3px_rgba(0,0,0,0.75))]"
      : "bg-white/30 hover:bg-white/55 text-gray-900 [filter:drop-shadow(0_0_3px_rgba(255,255,255,0.8))]";

  return (
    <div className="max-w-5xl mx-auto mt-4 px-4 pb-20">
      {/* Top bar: content type (left) · title (center) · published date (right).
          On a phone the title takes its own line and the type + date share the
          one below it, justified to the edges. From md the wrapper collapses to
          `contents` so all three are direct flex children again, with explicit
          orders restoring the original left/centre/right row. */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-6">
        <h1 className="min-w-0 flex-1 break-words text-base md:text-lg font-semibold text-center order-first md:order-2">
          {project.name}
        </h1>

        {/* The fixed widths and `shrink-0` below only apply from md. On a
            narrow phone the type and the date together are wider than the
            line, and items that cannot shrink do not wrap — they just run off
            the right edge, which is what clipped "Published". Here they shrink,
            and wrap to their own lines if even that is not enough. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 md:contents">
          <div className="min-w-0 md:w-1/4 md:shrink-0 md:order-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {isPortfolio ? "Portfolio" : "World Project"}
            </p>
          </div>

          <div className="min-w-0 md:w-1/4 md:shrink-0 md:text-right md:order-3">
            <span className="text-xs sm:text-sm text-gray-500">
              Published: {project.PublishedDate}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* `min-w-0`: from lg this is a flex item in a row, where the default
            `min-width: auto` would let wide content set the column's floor
            instead of the column constraining the content. */}
        <div className="min-w-0 flex-1">
          {/* Image gallery */}
          <div className="mb-6">
            <div className="relative w-full h-[300px] md:h-[430px] rounded-xl overflow-hidden mb-4 bg-gray-100">
              {/* The gallery crops to fill its box, so the photo on the page is
                  never the whole frame. Clicking it opens the lightbox, which
                  shows it uncropped. */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                aria-label="View image full screen"
                className="absolute inset-0 h-full w-full cursor-zoom-in"
              >
                <ProjectPhoto
                  image={images[activeIndex]}
                  alt={project.name}
                  sizes={GALLERY_SIZES}
                  priority
                  onError={(e) => {
                    e.currentTarget.srcset = "";
                    e.currentTarget.src = PLACEHOLDER.url;
                  }}
                />
              </button>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous image"
                    className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 rounded-full backdrop-blur-sm transition-colors cursor-pointer ${arrowClass}`}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next image"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 rounded-full backdrop-blur-sm transition-colors cursor-pointer ${arrowClass}`}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails.

                A wrapping grid, not a row that scrolls sideways. As a flex row
                of `w-20` items that were each `flex-shrink-0`, the strip's
                width was the sum of its thumbnails — so it grew with every
                photo added to the project and could not shrink back on a
                narrow screen. That is what was widening the page and pulling
                the navbar off its edges.

                A grid takes its width from the container instead, so the strip
                is always exactly as wide as the photo above it however many
                images there are: four across on a phone, more as the column
                gets wider, wrapping onto new rows once they no longer fit. */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 pb-2">
                {images.map((img: ProjectImage, idx: number) => (
                  <button
                    key={img.url}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square w-full rounded-lg overflow-hidden border-2 transition-all ${
                      activeIndex === idx
                        ? "border-black"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* The box is no longer a fixed 80px — it is a share of the
                        column, up to ~115px on a wide screen — so 160px would
                        now be soft on a retina display. 320 covers that at 3x
                        and is still far short of pulling the full-size photo
                        down for a thumbnail. */}
                    <img
                      src={projectImageUrl(img.url, 320)}
                      alt={`thumb-${idx}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: img.focalPoint || undefined }}
                    />
                  </button>
                ))}
              </div>
            )}

            <ImageLightbox
              images={images}
              index={activeIndex}
              onIndexChange={setSelectedImage}
              open={isLightboxOpen}
              onOpenChange={setIsLightboxOpen}
              alt={project.name}
            />
          </div>

          {/* Project Details + Tags */}
          <div className=" gap-2">
            <div className="md:col-span-2">
              <div className="bg-gray-50 rounded-xl p-3 mb-6">
                <h2 className="text-lg font-semibold mb-4">Project Details</h2>

                {/* One column on the narrowest phones. Two columns of a 40px
                    circle plus a label leaves ~70px for the value there, which
                    is not enough for a name or a two-part location. `sm` is
                    640px and would hold the single column far too long, so the
                    switch is at the width where two columns actually work. */}
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Portfolio has no architect — it shows Project Type in that slot. */}
                  {isPortfolio ? (
                    <DetailItem
                      icon={Building2}
                      label="Project Type"
                      value={project.projectType}
                    />
                  ) : (
                    <DetailItem
                      icon={User}
                      label="Architect"
                      value={project.Architect}
                    />
                  )}

                  <DetailItem
                    icon={Camera}
                    label="Photographer"
                    value={project.Photographer}
                  />

                  <DetailItem
                    icon={Earth}
                    label="Continent"
                    value={project.continent}
                  />

                  <DetailItem
                    icon={MapPin}
                    label="Location"
                    value={project.locationName}
                  />

                  <DetailItem
                    icon={Calendar}
                    label="Year"
                    value={project.year}
                  />

                  <DetailItem
                    icon={Sun}
                    label="Climate"
                    value={project.climate}
                  />

                  {/* World projects still list their type, alongside the architect. */}
                  {!isPortfolio && (
                    <DetailItem
                      icon={Building2}
                      label="Project Type"
                      value={project.projectType}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* <div className="bg-gray-50 rounded-xl p-3 mb-6">
              <h2 className="text-lg font-semibold mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {project.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div> */}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            {/* `break-words` alongside `whitespace-pre-wrap`: the latter keeps
                the author's line breaks but will not break inside a long
                unspaced run, so a pasted URL ran past the right edge. */}
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
              {project.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-22 mt-12">
        <HeroSocialMedia />
      </div>
    </div>
  );
}

export default WorldProjectDetails;
