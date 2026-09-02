import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
// import { logout } from "@/store/Slices/AuthSlice/authSlice";
import logo from "@/assets/logo.png";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { signOut } from "@/redux/features/auth/authActions";
import NotificationPopover from "@/components/Deshboard/NotificationPopover";
import Backbutton from "@/components/Common/Backbutton";
import AvatarMenu, {
  type AvatarMenuAction,
} from "@/components/Common/AvatarMenu";
// import { logout } from "@/redux/Slices/AuthSlice/authSlice";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";

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

  const dashboardPath =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER" ||
    user?.role === "FINANCE" ||
    user?.role === "DRAFTER" ||
    user?.role === "EMPLOYEE"
      ? "/dashboard"
      : "/user-dashboard";

  const handleLogout = () => {
    dispatch(signOut());
    navigate("/login");
  };

  // Shared avatar dropdown — same menu on desktop and mobile.
  const avatarActions: AvatarMenuAction[] = [
    {
      key: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      description: "Go to your workspace",
      onClick: () => navigate(dashboardPath),
    },
    {
      key: "settings",
      icon: Settings,
      label: "Settings",
      description: "Manage your account",
      onClick: () => navigate("/profile-settings"),
    },
    {
      key: "logout",
      icon: LogOut,
      label: "Logout",
      description: "Sign out of your account",
      onClick: handleLogout,
      danger: true,
    },
  ];

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
              <AvatarMenu actions={avatarActions} />
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
            {user && <AvatarMenu actions={avatarActions} avatarClassName="h-8 w-8" />}

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
