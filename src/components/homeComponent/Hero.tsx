import { useEffect, useState, useCallback } from "react";
// import HeroSocialMedia from "./HeroSocialMedia";
import { HashLoader } from "react-spinners";
import { useGetAllMediaQuery } from "@/redux/features/Media/mediaApi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Detail route for a featured media item, by its content type. Portfolio
 * entries share the world-project detail page (it loads any media by id or
 * slug), which is how the Portfolio listing already links them. HOME_HERO is
 * a banner with nothing behind it, so it stays unclickable.
 */
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
  const [isMenuOpen,] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading } = useGetAllMediaQuery({});

  // Get active home hero media — any type with isFeatured=true, fallback to HOME_HERO
  const latestMedia: any = data?.data?.length
    ? [...data.data]
      .filter((item: any) => item.isFeatured)
      .sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0] || null
    : null;

  // Carousel state for multi-image projects
  const images: string[] = latestMedia?.assets?.map((a: any) => a.cdnUrl).filter(Boolean) || [];
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

  const currentImage = images.length > 0
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat cursor-pointer"
          style={{
            backgroundImage: `url(${currentImage})`,
          }}
        />
      )}

      {/* Background overlay for better text readability */}
      {/* <div className="absolute inset-0 bg-black/30 z-[2]" /> */}

      {/* Clicking the image opens the featured project. It sits above the
          backgrounds but below the carousel arrows (z-5), the hero text and
          the floating Menu button (z-20), so those keep their own behaviour. */}
      {detailPath && (
        <button
          type="button"
          onClick={() => navigate(detailPath)}
          aria-label={`View details for ${latestMedia?.title || "this project"}`}
          className="absolute inset-0 z-[2] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
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

          {/* Dot indicators */}
          {/* <div className="absolute bottom-28 md:bottom-20 left-1/2 -translate-x-1/2 z-[5] flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${index === currentSlide
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/70"
                  }`}
              />
            ))}
          </div> */}
        </>
      )}

      {/* Hero content. The wrapper spans the screen, so it is made
          click-through — only the title line below re-enables pointer events,
          leaving the rest of the image to open the project. */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 md:px-6 pointer-events-none">
        <div className="text-center text-white max-w-4xl">
          <div className="absolute top-0 left-0 right-0 h-48
                bg-gradient-to-b
                from-black/60
                to-transparent" />
          <h1 className="mt-5 text-md uppercase mix-blend-difference text-white pointer-events-auto">
            Project Name: {latestMedia?.title || ""}
            <span className="block sm:inline sm:ml-5">
              Architect: {latestMedia?.architect || ""}
            </span>
            <span className="block sm:inline sm:ml-5">
              Location: {latestMedia?.location || ""}
            </span>
            <span className="block sm:inline sm:ml-5">
              Year: {latestMedia?.projectYear || ""}
            </span>
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-80 leading-relaxed max-w-2xl mx-auto font-light">
            {/* {latestMedia?.content || "Innovative design solutions for the modern world."} */}
          </p>
        </div>

        {/* Bottom Details Section */}
        {/* <div className="absolute bottom-6 sm:bottom-12 left-0 right-0 px-4 sm:px-12 flex justify-between items-end text-white/70 text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium">
          <div className="mb-12 md:mb-5 flex flex-col space-y-1 sm:space-y-2 text-left max-w-[45%] backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-2 md:px-5 py-4 
                   text-white/70 text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium">
            <div className="flex flex-col md:flex-row gap-2">
              <p className="text-white/30 mr-2">Architect:</p>
              <p className="truncate"> {latestMedia?.architect || "N/A"}</p>
            </div>
            <div className="flex flex-col md:flex-row  gap-2">
              <p className="text-white/30 mr-2">Photographer:</p>
              <p className="truncate"> {latestMedia?.photographer || "N/A"}</p>
            </div>
          </div>

          <div className="mb-16 md:mb-5 space-y-1 sm:space-y-2 text-right backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-2 md:px-5 py-4 
                  max-w-[50%] text-white/70 text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium">
            <p className="truncate">{latestMedia?.location || "Earth"}</p>
            <p className="text-white/50 truncate">{latestMedia?.projectYear || "2024"}</p>
          </div>
        </div> */}
      </div>

      {/* <FloatingMenu /> */}
      {/* <div
        className={`fixed bottom-0 left-0 h-[550px] right-0 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-10 ${isMenuOpen ? "translate-y-0" : "translate-y-full"
          }`}
      >
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Menu</h3>
            <button
              onClick={toggleMenu}
              className="text-gray-500 cursor-pointer hover:text-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <a
              href="#"
              className="block py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Home
            </a>
            <a
              href="/newsFeed"
              className="block py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              News feed
            </a>
            <a
              href="#"
              className="block py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Services
            </a>
            <a
              href="#"
              className="block py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Contact
            </a>
            <a
              href="login"
              className="block py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Log in
            </a>
          </div>
          <hr className="border-t-1 mt-4 border-gray-300" />
        </div>
        <HeroSocialMedia />
      </div> */}

      {/* Backdrop overlay when menu is open */}
      {/* {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-5" onClick={toggleMenu} />
      )} */}
    </div>
  );
}

export default Hero;
