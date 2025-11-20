import { useState } from "react";
import { useLocation } from "react-router-dom"; // import this
import HeroSocialMedia from "../homeComponent/HeroSocialMedia";

function FloatingMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation(); // get current route

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // condition to hide on "/new-project"
  const hideFloatingButton = [
    "/new-project",
    "/login",
    "/register",
    "/privacy",
    "/profile-settings",
    "/terms",
    "/about",
    "/signup",
    "/forgotPassword",
    "/resetPassword",
  ].includes(location.pathname);

  return (
    <>
      {!isMenuOpen && !hideFloatingButton && (
        <button
          onClick={toggleMenu}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 text-sm font-extralight rounded-full w-12 h-16 bg-gray-300 cursor-pointer text-black shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          Menu
        </button>
      )}
      {/* Sliding Menu Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white z-99 dark:bg-white text-black shadow-2xl transform transition-transform duration-300 ease-in-out  ${
          isMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col h-full rounded-t-2xl">
          <div className="p-6 overflow-y-auto max-h-[65vh]">
            {/* Close Button */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={toggleMenu}
                className="text-gray-500 cursor-pointer hover:text-gray-700 hover:text-white p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Media Section */}
            <div className="mb-3">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                Media
              </h3>
              <div className="space-y-1">
                <a
                  href="/newsFeed"
                  className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
                >
                  News Feed
                </a>
                <a
                  href="/world-project"
                  className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
                >
                  World Project
                </a>
              </div>
            </div>

            {/* Services Section */}
            <div className="mb-3">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                Services
              </h3>
              <div className="space-y-1">
                <a
                  href="/new-project"
                  className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
                >
                  New Project
                </a>
                <a
                  href="/portfolio"
                  className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
                >
                  View Portfolio
                </a>
              </div>
            </div>

            {/* About Section */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                About
              </h3>
              <a
                href="/about"
                className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
              >
                Learn More
              </a>
              <a
                href="/contact"
                className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
              >
                Get in Touch
              </a>
            </div>

            {/* Login Section */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                Account
              </h3>
              <a
                href="/login"
                className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
              >
                Log In
              </a>
            </div>

            <hr className="border-t border-gray-300 mt-4" />
          </div>

          {/* Social Media Section */}
          <HeroSocialMedia />
        </div>
        {/* wht gap here  */}
      </div>
      {/* Backdrop overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-5" onClick={toggleMenu} />
      )}
    </>
  );
}

export default FloatingMenu;
