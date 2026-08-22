import { useEffect, useState, useCallback } from "react";
// import HeroSocialMedia from "./HeroSocialMedia";
import { HashLoader } from "react-spinners";
import { useGetAllMediaQuery } from "@/redux/features/Media/mediaApi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

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
  const images: string[] =
    latestMedia?.assets?.map((a: any) => a.cdnUrl).filter(Boolean) || [];
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

  useEffect(() => {
    // when Hero mounts — disable scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // cleanup when leaving the page — restore scroll
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HashLoader size={50} color="#000" />
      </div>
    );
  }

  const currentImage =
    images.length > 0
      ? images[currentSlide]
      : "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";

  const detailPath = detailPathFor(latestMedia);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Images with transition */}
      {images.length > 0 ? (
        images.map((img, index) => (
          <div
            key={index}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${img})`,
              opacity: index === currentSlide ? 1 : 0,
              zIndex: index === currentSlide ? 1 : 0,
            }}
          />
        ))
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${currentImage})`,
          }}
        />
      )}

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
      <div className="relative z-10 flex justify-center min-h-screen px-4 md:px-6 pointer-events-none">
        <div className="text-center text-white max-w-4xl">
          <div
            className="absolute top-0 left-0 right-0 h-48
                bg-gradient-to-b
                from-black/60
                to-transparent"
          />
          <h1 className="mt-4 text-md uppercase mix-blend-difference text-white pointer-events-auto">
            Project Name: {latestMedia?.title || ""}
            <span className="block sm:inline sm:ml-5">
              Architect: {latestMedia?.architect || ""}
            </span>
            {/* <span className="block sm:inline sm:ml-5">
              Location: {latestMedia?.location || ""}
            </span>
            <span className="block sm:inline sm:ml-5">
              Year: {latestMedia?.projectYear || ""}
            </span> */}
          </h1>
          {detailPath && (
            <Button
              type="button"
              onClick={() => navigate(detailPath)}
              aria-label={`Read more about ${latestMedia?.title || "this project"}`}
              className="absolute top-[42px] md:top-[12px] right-4 md:right-12 pointer-events-auto cursor-pointer"
            >
              Read more
            </Button>
          )}
        </div>
      </div>

      {/* Photographer credit. On mobile it sits in its own gradient bar at the
          foot of the hero, mirroring the darkened strip at the top. */}
      {latestMedia?.photographer && (
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none md:hidden">
          <div className="bg-gradient-to-t from-black/70 to-transparent pt-10 pb-3 px-4">
            <p className="text-center text-xs uppercase tracking-wide text-white">
              Photographer: {latestMedia.photographer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hero;
