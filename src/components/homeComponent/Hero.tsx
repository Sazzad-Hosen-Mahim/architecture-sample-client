import { useEffect, useState } from "react";
import HeroSocialMedia from "./HeroSocialMedia";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { useGetAllMediaQuery } from "@/redux/features/Media/mediaApi";
import { HashLoader } from "react-spinners";

function Hero() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = useAppSelector(selectCurrentUser);
  console.log("ami user from g", user);

  const { data, isLoading } = useGetAllMediaQuery(undefined);
  console.log("i am data for media", data);

  // Get latest media
  const latestMedia: any = data?.data?.length
    ? data.data.reduce((latest: any, current: any) =>
        new Date(current.createdAt) > new Date(latest.createdAt)
          ? current
          : latest
      )
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
      className="relative  h-screen bg-cover bg-center bg-no-repeat overflow-hidden "
      // style={{
      //   backgroundImage:
      //     "url('https://images.unsplash.com/photo-1449034446853-66c86144b0ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
      // }}

      style={{
        backgroundImage: latestMedia
          ? `url(${latestMedia.fileUrl})`
          : "url('https://images.unsplash.com/photo-1449034446853-66c86144b0ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
      }}
    >
      {/* Background overlay for better text readability */}
      <div className="absolute  inset-0 bg-black/30" />

      {/* Hero content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {latestMedia?.title || ""}
          </h1>
          {/* <h2>ami use:{user?.name}</h2> */}
          <p className="text-lg md:text-xl mb-8 w-[90%] md:w-1/2 mx-auto">
            {latestMedia?.description || ""}
          </p>
        </div>
      </div>

      {/* Floating Menu Button */}

      {/* Sliding Menu Panel */}
      <div
        className={`fixed bottom-0 left-0 h-[550px] right-0 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-10 ${
          isMenuOpen ? "translate-y-0" : "translate-y-full"
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
