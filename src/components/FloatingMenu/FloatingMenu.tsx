import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom"; // Add Link import
import HeroSocialMedia from "../homeComponent/HeroSocialMedia";
import { IoChevronDownSharp } from "react-icons/io5";

function FloatingMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Only true after the user actually clicks the down-arrow button — starts at 0°.
  const [isCloseArrowRotated, setIsCloseArrowRotated] = useState(false);
  const location = useLocation();

  // Close the panel on any route change — e.g. clicking "Login" in the navbar,
  // which navigates without touching this component's handlers.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const openMenu = () => {
    setIsCloseArrowRotated(false);
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Rotate the arrow, then close the panel.
  const handleCloseArrowClick = () => {
    setIsCloseArrowRotated(true);
    setIsMenuOpen(false);
  };

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
          onClick={openMenu}
          // Offset by the safe-area inset as well as the 2rem: the page now
          // renders edge to edge (viewport-fit=cover), so bottom-8 alone would
          // measure from the physical edge and drop the button into the home
          // indicator. The inset is 0 everywhere that has no cutout.
          className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 transform -translate-x-1/2 z-20 text-sm font-semibold rounded-full w-20 h-24 bg-gray-300 cursor-pointer text-black shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          Menu
        </button>
      )}
      {/* Sliding Menu Panel — anchored to the bottom of the sticky navbar (h-14)
          so it sits flush under it with no gap at any viewport height / zoom. */}
      <div
        className={`fixed top-14 left-0 right-0 bottom-0 bg-white z-99 dark:bg-white text-black shadow-2xl transform transition-transform duration-300 ease-in-out lg:py-[15px] py-[10px] ${
          isMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col justify-between h-full overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <div className="px-6 py-2">
            {/* Close Button */}
            <div className="flex justify-center items-center">
              <button
                onClick={handleCloseArrowClick}
                className="text-gray-500 cursor-pointer hover:text-white mr-[4px] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <IoChevronDownSharp
                  className={`w-10 h-10 transition-transform duration-300 hover:rotate-180 ${
                    isCloseArrowRotated ? "rotate-180" : ""
                  }`}
                />
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
                  World Projects
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
                  Portfolio
                </Link>
              </div>
            </div>

            {/* About Section */}
            <div className="space-y-2">
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
            {/* <div className="mb-6 hidden md:block">
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
            </div> */}
          </div>

          {/* Social Media Section */}
          <HeroSocialMedia onNavigation={handleNavigation} />
        </div>
      </div>
      {/* Backdrop overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-5" onClick={closeMenu} />
      )}
    </>
  );
}

export default FloatingMenu;
