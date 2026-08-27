import { useState } from "react";
import { useLocation, Link } from "react-router-dom"; // Add Link import
import HeroSocialMedia from "../homeComponent/HeroSocialMedia";
import { FaAngleDown } from "react-icons/fa";

function FloatingMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Close menu when navigating
  const handleNavigation = () => {
    setIsMenuOpen(false);
  };

  const hideFloatingButton = [
    "/new-project",
    "/login",
    "/register",
    "/profile-settings",
    "/about",
    "/signup",
    "/forgotPassword",
    "/resetPassword",
    "/user-dashboard",
  ].includes(location.pathname);

  return (
    <>
      {!isMenuOpen && !hideFloatingButton && (
        <button
          onClick={toggleMenu}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 text-sm font-semibold rounded-full w-20 h-24 bg-gray-300 cursor-pointer text-black shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          Menu
        </button>
      )}
      {/* Sliding Menu Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white z-99 dark:bg-white text-black shadow-2xl transform transition-transform duration-300 ease-in-out lg:py-[25px] py-[10px] ${
          isMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col h-[92vh] md:h-[88vh]">
          <div className="p-6">
            {/* Close Button */}
            <div className="flex justify-center items-center mb-4">
              <button
                onClick={toggleMenu}
                className="text-gray-500 cursor-pointer hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <FaAngleDown className="w-6 h-6" />
              </button>
            </div>

            {/* Media Section */}
            <div className="mb-3">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                Media
              </h3>
              <div className="space-y-2">
                <Link
                  to="/newsFeed"
                  onClick={handleNavigation}
                  className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
                >
                  Newsfeed
                </Link>
                <Link
                  to="/world-project"
                  onClick={handleNavigation}
                  className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
                >
                  World Project
                </Link>
              </div>
            </div>

            {/* Services Section */}
            <div className="mb-3">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                Services
              </h3>
              <div className="space-y-2">
                <Link
                  to="/new-project"
                  onClick={handleNavigation}
                  className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
                >
                  New Project
                </Link>
                <Link
                  to="/portfolio"
                  onClick={handleNavigation}
                  className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
                >
                  View Portfolio
                </Link>
              </div>
            </div>

            {/* About Section */}
            <div className="mb-2 space-y-2">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                About
              </h3>
              <Link
                to="/about"
                onClick={handleNavigation}
                className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
              >
                Learn More
              </Link>
              <Link
                to="/contact"
                onClick={handleNavigation}
                className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
              >
                Get in Touch
              </Link>
            </div>

            {/* Login Section */}
            <div className="mb-6 hidden md:block">
              <h3 className="text-base font-semibold mb-2 text-gray-700">
                Account
              </h3>
              <Link
                to="/login"
                onClick={handleNavigation}
                className="block py-1 px-4 rounded-lg text-sm hover:bg-gray-100 hover:text-black font-extralight"
              >
                Log In
              </Link>
            </div>
          </div>

          {/* Social Media Section */}
          <HeroSocialMedia onNavigation={handleNavigation} />
        </div>
      </div>
      {/* Backdrop overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-5" onClick={toggleMenu} />
      )}
    </>
  );
}

export default FloatingMenu;
