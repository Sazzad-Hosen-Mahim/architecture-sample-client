import { useEffect, useState, useCallback } from "react";
// import HeroSocialMedia from "./HeroSocialMedia";
// import { HashLoader } from "react-spinners";
import { useGetAllMediaQuery } from "@/redux/features/Media/mediaApi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import ProjectPhoto from "@/components/Common/ProjectPhoto";
import { toProjectImages, type ProjectImage } from "@/utils/projectImage";

/**
 * The hero takes exactly the height the layout has left below the navbar —
 * no viewport arithmetic, so it stays flush whatever the navbar does and
 * leaves no band of background under the photo.
 *
 * Which part of the frame survives that shape is not decided here: it is
 * `object-position` per photo (see DEFAULT_FOCAL_POINT), which is the lever
 * that actually controls how much of a building's base gets cropped.
 */
const HERO_FILL = "flex-1 w-full";

/** Shown only until the first featured project is published. */
const FALLBACK_IMAGE: ProjectImage = {
  url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=80",
};

const detailPathFor = (media: any): string | null => {
  if (!media?.id) return null;
  switch (media.contentType) {
    case "NEWS":
    case "ARTICLE":
      return `/newsFeed/${media.id}`;
    case "WORLD_PROJECT":
    case "PORTFOLIO":
      return `/world-project/${media.id}`;
    default:
      return null;
  }
};

function Hero() {
  const [isMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading } = useGetAllMediaQuery({});

  // Get active home hero media — any type with isFeatured=true, fallback to HOME_HERO
  const latestMedia: any = data?.data?.length
    ? [...data.data]
        .filter((item: any) => item.isFeatured)
        .sort((a: any, b: any) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        })[0] || null
    : null;

  // Carousel state for multi-image projects
  const images: ProjectImage[] = toProjectImages(latestMedia?.assets);
  const hasMultipleImages = images.length > 1;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (!hasMultipleImages) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasMultipleImages, images.length]);

  // Reset slide when media changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [latestMedia?.id]);

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // const toggleMenu = () => {
  //   setIsMenuOpen(!isMenuOpen);
  // };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"; // stop scrolling
    } else {
      document.body.style.overflow = ""; // allow scrolling
    }

    // cleanup when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // The hero used to lock body scroll on mount. The layout now sizes the page
  // to the viewport on its own, so the lock earned nothing and only risked
  // stranding content out of reach — e.g. on a short landscape phone.

  if (isLoading) {
    return (
      // <div className="flex items-center justify-center min-h-screen">
      //   <HashLoader size={50} color="#000" />
      // </div>
      <div className={`flex justify-center items-center ${HERO_FILL}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const slides: ProjectImage[] = images.length > 0 ? images : [FALLBACK_IMAGE];

  const detailPath = detailPathFor(latestMedia);

  return (
    <div className={`relative overflow-hidden ${HERO_FILL}`}>
      {/* Background photos with transition. Real <img> elements rather than
          CSS `background-image` so each one carries a `srcset` — a background
          can only ever name a single file, which is what left the hero
          upscaling one mid-size render on large displays. */}
      {slides.map((image, index) => (
        <ProjectPhoto
          key={image.url}
          image={image}
          alt={latestMedia?.title || "Featured project"}
          sizes="100vw"
          priority={index === 0}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: index === currentSlide ? 1 : 0,
            zIndex: index === currentSlide ? 1 : 0,
          }}
        />
      ))}

      {/* Carousel Controls */}
      {hasMultipleImages && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[5] bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[5] bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Hero content. The wrapper spans the screen, so it is made
          click-through — only the title line below re-enables pointer events,
          leaving the rest of the image to open the project. */}
      <div className="relative z-10 flex h-full justify-center md:justify-start px-4 md:px-6 pointer-events-none">
        <div className="text-left text-white max-w-4xl w-full">
          <div
            className="absolute top-0 left-0 right-0 h-48
        bg-gradient-to-b
        from-black/60
        to-transparent"
          />

          <h1 className="mt-3 text-[14px] md:text-base mix-blend-difference text-white pointer-events-auto">
            Project Name: {latestMedia?.title || ""}
          </h1>

          <p className="text-[14px] md:text-base mix-blend-difference text-white">
            Architect: {latestMedia?.architect || ""}
          </p>

          <p className="text-[14px] md:text-base mix-blend-difference text-white">
            Photographer: {latestMedia?.photographer}
          </p>

          {detailPath && (
            <Button
              type="button"
              onClick={() => navigate(detailPath)}
              aria-label={`Read more about ${latestMedia?.title || "this project"}`}
              className="absolute top-[4px] right-2 md:right-12 text-[14px] md:text-base pointer-events-auto cursor-pointer"
            >
              Read more
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Hero;
