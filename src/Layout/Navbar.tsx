import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
// import { logout } from "@/store/Slices/AuthSlice/authSlice";
import logo from "@/assets/logo.png";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { signOut } from "@/redux/features/auth/authActions";
import NotificationPopover from "@/components/Deshboard/NotificationPopover";
import Backbutton from "@/components/Common/Backbutton";
// import { logout } from "@/redux/Slices/AuthSlice/authSlice";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  // never showing back button in home page
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // const toggleMenu = () => {
  //   setIsOpen(!isOpen);
  // };

  const handleLogout = () => {
    dispatch(signOut());
    navigate("/login");
  };

  return (
    <nav className="bg-[#ffffff]  sticky top-0 z-50 border-b border-gray-200">
      <div className=" mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="">{!isHomePage && <Backbutton />}</div>
          <div className="flex shrink w-full justify-center">
            <Link to="/" className="text-black text-2xl ">
              <div className="flex content-center gap-2">
                <img src={logo} alt="" className="w-8 h-8" />
                <span className="text-base mt-1 font-extralight tracking-wide ">
                  Architecture Simple <span className="text-yellow-400">.</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notifications sit beside the avatar for signed-in clients */}
            {user && <NotificationPopover />}
            {user ? (
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                    {user?.imagUrl ? (
                      <img
                        src={user.imagUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                </PopoverTrigger>

                <PopoverContent className="mr-3 bg-website-color-darkGray border-none text-white space-y-2">
                  <Button
                    onClick={() =>
                      navigate(
                        user?.role === "SUPER_ADMIN" ||
                          user?.role === "ADMIN" ||
                          user?.role === "PROJECT_MANAGER" ||
                          user?.role === "FINANCE" ||
                          user?.role === "DRAFTER" ||
                          user?.role === "EMPLOYEE"
                          ? "/dashboard"
                          : "/user-dashboard",
                      )
                    }
                    className="bg-website-color-lightGray text-black w-full cursor-pointer"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate("/profile-settings")}
                    className="bg-website-color-lightGray text-black w-full cursor-pointer"
                  >
                    Settings
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="bg-website-color-lightGray text-black w-full cursor-pointer"
                  >
                    Logout
                  </Button>
                </PopoverContent>
              </Popover>
            ) : (
              <>
                {/* <Button
                onClick={() => navigate("/login")}
                className="bg-website-color-lightGray text-black px-4 py-2 cursor-pointer"
              >
                Login
              </Button> */}
              </>
            )}
          </div>

          {/* Mobile Menu Button & Avatar */}
          <div className="md:hidden flex items-center gap-3">
            {user && <NotificationPopover />}
            {user && (
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                    {user?.imagUrl ? (
                      <img
                        src={user.imagUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                </PopoverTrigger>

                <PopoverContent className="mr-3 bg-white border border-gray-200 shadow-md text-black space-y-2 p-2 rounded-xl z-[60]">
                  <Button
                    onClick={() => {
                      navigate(
                        user?.role === "SUPER_ADMIN" ||
                          user?.role === "ADMIN" ||
                          user?.role === "PROJECT_MANAGER" ||
                          user?.role === "FINANCE" ||
                          user?.role === "DRAFTER" ||
                          user?.role === "EMPLOYEE"
                          ? "/dashboard"
                          : "/user-dashboard",
                      );
                    }}
                    className="bg-black text-white hover:bg-gray-800 w-full cursor-pointer rounded-lg text-xs"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate("/profile-settings")}
                    className="bg-website-color-lightGray text-black w-full cursor-pointer"
                  >
                    Settings
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="bg-gray-100 text-black hover:bg-gray-200 w-full cursor-pointer rounded-lg text-xs"
                  >
                    Logout
                  </Button>
                </PopoverContent>
              </Popover>
            )}

            {!user && (
              <Button
                onClick={() => navigate("/login")}
                className="bg-black text-white hover:bg-gray-800 w-full cursor-pointer rounded-lg text-xs"
              >
                Login
              </Button>
            )}

            {/* <button
              onClick={toggleMenu}
              type="button"
              className="text-black hover:text-gray-600 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button> */}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="text-gray-700 hover:text-black block hover:bg-gray-50 px-3 py-2 rounded-md text-base font-semibold transition-all"
            >
              Home
            </Link>
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="text-gray-700 hover:text-black block hover:bg-gray-50 px-3 py-2 rounded-md text-base font-semibold transition-all"
            >
              About
            </Link>
            <Link
              to="/services"
              onClick={() => setIsOpen(false)}
              className="text-gray-700 hover:text-black block hover:bg-gray-50 px-3 py-2 rounded-md text-base font-semibold transition-all"
            >
              Services
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="text-gray-700 hover:text-black block hover:bg-gray-50 px-3 py-2 rounded-md text-base font-semibold transition-all"
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
