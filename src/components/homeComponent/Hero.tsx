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
 * How a photo meets that shape is not decided here either: ProjectPhoto
 * compares the two and either crops to fill or fits the photo whole against a
 * blurred enlargement of itself, so an upload that is nothing like the hero's
 * shape does not arrive as a magnified detail of itself.
 */
const HERO_FILL = "flex-1 w-full";

/**
 * On a phone the hero is pushed 3rem past the height the layout gives it, so
 * the photo runs beyond the bottom edge of the screen rather than ending level
 * with it. Anything of that bottom strip that belongs to the page — as opposed
 * to Safari's own toolbar chrome — is then covered by the picture.
 *
 * The overshoot also leaves the page slightly scrollable, and a scroll is what
 * makes Safari collapse its toolbar, so the photo gets the taller viewport too.
 *
 * `max-md:` keeps it to small screens; a desktop hero still ends exactly at the
 * fold with no scrollbar. The 4rem is the navbar (`h-16`).
 */
const HERO_MOBILE_OVERSHOOT = "max-md:min-h-[calc(100lvh_-_4rem_+_3rem)]";

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

  /**
   * The white sliver along the bottom edge on iPhone.
   *
   * It is not a gap in the page. The hero already runs past the bottom of the
   * screen (see HERO_MOBILE_OVERSHOOT), so the photograph is behind that strip
   * — Safari just doesn't draw it there. The band around the home indicator,
   * and the ground behind Safari's own toolbar, are painted from the
   * *document's* background colour rather than from whatever the page rendered
   * at that position, and with none set that colour is white. Android has no
   * such chrome, which is why it never showed the band.
   *
   * So the photo itself cannot reach it, only a colour can. Black is the one
   * that disappears against a full-bleed photograph, the way a letterbox does.
   *
   * Set on the element and undone on the way out rather than written into the
   * stylesheet: every other page is a white document, where the default is
   * already right and a black canvas would be the bug.
   */
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.backgroundColor;
    root.style.backgroundColor = "#000000";
    return () => {
      root.style.backgroundColor = previous;
    };
  }, []);

  // const toggleMenu = () => {
  //   setIsMenuOpen(!isMenuOpen);
  // };

  // A body-scroll lock keyed to a local `isMenuOpen` used to live here, but the
  // state had no setter — it was permanently false, so the effect only ever
  // wrote an empty overflow to `document.body` on each mount and unmount of the
  // home page. Touching global document state on every navigation for no gain
  // is worth not doing, so it is gone; the menu that needs the lock owns it.

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
    <div
      className={`relative overflow-hidden ${HERO_FILL} ${HERO_MOBILE_OVERSHOOT}`}
    >
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

          {/* A portfolio entry has no architect field at all, so the label
              would sit over the photo with nothing after it. Same for a missing
              photo credit — an unanswered label reads as a mistake. The lines
              below simply close up when one is absent. */}
          {latestMedia?.architect?.trim() && (
            <p className="text-[14px] md:text-base mix-blend-difference text-white">
              Architect: {latestMedia.architect}
            </p>
          )}

          {latestMedia?.photographer?.trim() && (
            <p className="text-[14px] md:text-base mix-blend-difference text-white">
              Photographer: {latestMedia.photographer}
            </p>
          )}

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
