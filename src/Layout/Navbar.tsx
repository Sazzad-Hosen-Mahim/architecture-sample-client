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
import { getUserPhoto } from "@/utils/userPhoto";
// import { logout } from "@/redux/Slices/AuthSlice/authSlice";
import { LayoutDashboard, Settings, LogOut, ChevronRight } from "lucide-react";

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
      <div className=" mx-auto px-4 lg:px-16">
        <div className="grid grid-cols-3 items-center h-16">
          {/* Logo */}
          <div className="">{!isHomePage && <Backbutton />}</div>
          <div className="flex justify-center">
            <Link to="/" className="text-black text-2xl">
              <div className="flex items-center gap-2">
                <img src={logo} alt="" className="w-12 h-12" />
                <span className="hidden md:block lg:text-xl text-lg font-light tracking-wide">
                  Architecture Simple
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center justify-end gap-3">
            {/* Notifications sit beside the avatar for signed-in clients */}
            {user && <NotificationPopover />}
            {user ? (
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                    {getUserPhoto(user) ? (
                      <img
                        src={getUserPhoto(user)}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                </PopoverTrigger>

                <PopoverContent
                  align="end"
                  sideOffset={10}
                  className="
    w-60
    mr-3
    p-2
    rounded-2xl
    border border-white/10
    bg-website-color-darkGray/60
    backdrop-blur-2xl
    shadow-[0_20px_50px_rgba(0,0,2,0.35)]
    text-white
    z-[60]
  "
                >
                  {/* Dashboard */}
                  <button
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
                    className="
      group
      w-full
      flex items-center gap-3
      px-3 py-3
      rounded-xl
      text-left
      transition-all duration-200
      hover:bg-white/10
      cursor-pointer
    "
                  >
                    <div
                      className="
        h-9 w-9
        rounded-lg
        flex items-center justify-center
        bg-white/10
        border border-white/10
        text-white
        transition-all duration-200
        group-hover:bg-white
        group-hover:text-black
      "
                    >
                      <LayoutDashboard size={16} />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Dashboard
                      </p>
                      <p className="text-[11px] text-white/40">
                        Go to your workspace
                      </p>
                    </div>

                    <ChevronRight
                      size={15}
                      className="
        text-white/30
        transition-all duration-200
        group-hover:text-white
        group-hover:translate-x-0.5
      "
                    />
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => navigate("/profile-settings")}
                    className="
      group
      w-full
      flex items-center gap-3
      px-3 py-3
      rounded-xl
      text-left
      transition-all duration-200
      hover:bg-white/10
      cursor-pointer
    "
                  >
                    <div
                      className="
        h-9 w-9
        rounded-lg
        flex items-center justify-center
        bg-white/10
        border border-white/10
        text-white
        transition-all duration-200
        group-hover:bg-white
        group-hover:text-black
      "
                    >
                      <Settings size={16} />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Settings</p>
                      <p className="text-[11px] text-white/40">
                        Manage your account
                      </p>
                    </div>

                    <ChevronRight
                      size={15}
                      className="
        text-white/30
        transition-all duration-200
        group-hover:text-white
        group-hover:translate-x-0.5
      "
                    />
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-white/10 my-1" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="
      group
      w-full
      flex items-center gap-3
      px-3 py-3
      rounded-xl
      text-left
      transition-all duration-200
      hover:bg-red-500/10
      cursor-pointer
    "
                  >
                    <div
                      className="
        h-9 w-9
        rounded-lg
        flex items-center justify-center
        bg-white/10
        border border-white/10
        text-white/80
        transition-all duration-200
        group-hover:bg-red-500
        group-hover:text-white
      "
                    >
                      <LogOut size={16} />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-white group-hover:text-red-400">
                        Logout
                      </p>
                      <p className="text-[11px] text-white/40">
                        Sign out of your account
                      </p>
                    </div>
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <>
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-black text-white hover:bg-gray-800 w-fit cursor-pointer rounded-lg text-xs"
                >
                  Login
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button & Avatar */}
          <div className="md:hidden flex items-center gap-3 justify-end">
            {user && <NotificationPopover />}
            {user && (
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                    {getUserPhoto(user) ? (
                      <img
                        src={getUserPhoto(user)}
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
                className="bg-black text-white hover:bg-gray-800 w-fit cursor-pointer rounded-lg text-xs"
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
