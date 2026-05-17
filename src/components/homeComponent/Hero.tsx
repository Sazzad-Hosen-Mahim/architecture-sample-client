import { useEffect, useState } from "react";
import HeroSocialMedia from "./HeroSocialMedia";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { HashLoader } from "react-spinners";
import { useGetAllMediaQuery } from "@/redux/features/Media/mediaApi";

function Hero() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = useAppSelector(selectCurrentUser);
  console.log("ami user from g", user);

  const { data, isLoading } = useGetAllMediaQuery({ type: "HOME_HERO" as any });
  console.log("i am data for media", data);

  // Get active home hero media (featured first, then latest)
  const latestMedia: any = data?.data?.length
    ? [...data.data].sort((a: any, b: any) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })[0]
    : null;

  console.log("i am the ", latestMedia);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
  return (
    <div
      className="relative h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: latestMedia?.assets?.[0]?.cdnUrl
          ? `url(${latestMedia.assets[0].cdnUrl})`
          : "url('https://images.unsplash.com/photo-1449034446853-66c86144b0ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
      }}
    >
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center text-white max-w-4xl">
          <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight uppercase">
            {latestMedia?.title || "Architecture"}
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-80 leading-relaxed max-w-2xl mx-auto font-light">
            {latestMedia?.content || "Innovative design solutions for the modern world."}
          </p>
        </div>

        {/* Bottom Details Section */}
        <div className="absolute bottom-6 sm:bottom-12 left-0 right-0 px-4 sm:px-12 flex justify-between items-end text-white/70 text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium">
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
        </div>
      </div>

      {/* Floating Menu Button */}

      {/* Sliding Menu Panel */}
      <div
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
      </div>

      {/* Backdrop overlay when menu is open */}
      {/* {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-5" onClick={toggleMenu} />
      )} */}
    </div>
  );
}

export default Hero;
