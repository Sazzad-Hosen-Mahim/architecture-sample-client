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
      {/* Floating Menu Button */}
      {!isMenuOpen && !hideFloatingButton && (
        <button
          onClick={toggleMenu}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 text-xs rounded-full  w-10 h-16 bg-white cursor-pointer text-black shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          Menu
        </button>
      )}

      {/* Sliding Menu Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white z-99 dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out  ${
          isMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6  overflow-y-auto ">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Menu</h3>
              <button
                onClick={toggleMenu}
                className="text-gray-500 cursor-pointer hover:text-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              {/* <a
              href="/"
              className="block py-1 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Home
            </a> */}
              <a
                href="/newsFeed"
                className="block py-1 px-4 rounded-lg text-sm  font-extralight  hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                News feed
              </a>
              <a
                href="/world-project"
                className="block py-1 px-4 text-sm font-extralight rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                World Project
              </a>
              <a
                href="/new-project"
                className="block py-1 px-4 text-sm rounded-lg font-extralight hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                New project
              </a>

              <a
                href="/portfolio"
                className="block py-1 px-4 text-sm rounded-lg font-extralight hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Portfolio
              </a>
              <a
                href="/about"
                className="block py-1 px-4 text-sm rounded-lg font-extralight hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                About
              </a>
              <a
                href="/contact"
                className="block py-1 px-4 text-sm rounded-lg font-extralight hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Contact
              </a>
              <a
                href="/login"
                className="block py-1 px-4 text-sm rounded-lg font-extralight hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Log in
              </a>
            </div>

            <hr className="border-t-1 mt-4 border-gray-300" />
          </div>
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
