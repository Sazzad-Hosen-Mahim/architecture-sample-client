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

/**
 * Top-level destinations. Every one of these is one tap away in the floating
 * menu, so "Back" has nothing useful to offer on them — it would only ever
 * bounce the visitor out of the section they just chose. Sub-pages beneath
 * them (`/world-project/:id`, `/newsFeed/:id`, …) still get the button, and so
 * does the client dashboard, which is reached from the avatar menu rather than
 * the floating one.
 */
const MAIN_PAGES = new Set([
  "/",
  "/world-project",
  "/portfolio",
  "/new-project",
  "/newsFeed",
  "/about",
  "/contact",
]);

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  // Back is for sub-pages only — see MAIN_PAGES. Trailing slashes are trimmed
  // so "/portfolio/" is recognised as the same top-level page as "/portfolio".
  const location = useLocation();
  const currentPath = location.pathname.replace(/\/+$/, "") || "/";
  const isMainPage = MAIN_PAGES.has(currentPath);

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
    // dot-grid-surface rather than bg-white: white alone made the bar read as a
    // solid slab against the dotted page. See index.css.
    //
    // The translateZ is not a visual effect — it is here to match how the
    // floating menu is drawn. Both surfaces carry byte-identical CSS, yet the
    // bar kept reading a shade darker, because the menu's slide `transform`
    // puts it on its own compositing layer and the navbar had nothing to do the
    // same. The grid is built from a 0.5px stroke and a 0.5px-radius dot, so
    // every tile is decided by anti-aliasing, and a composited layer resolves
    // that sub-pixel coverage differently from an uncomposited one — enough to
    // shift the tone. Promoting the bar too puts both on the same footing.
    //
    // Safe on this element: a transform makes it a containing block for fixed
    // descendants, and the two popovers it holds both render through a Radix
    // portal into <body>, so neither is a descendant to re-anchor.
    <nav className="dot-grid-surface sticky top-0 z-100 [transform:translateZ(0)]">
      <div className=" mx-auto px-4 lg:px-16">
        <div className="grid grid-cols-3 items-center h-16">
          {/* Logo */}
          <div className="">{!isMainPage && <Backbutton />}</div>
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
                  className=" text-black border-2 hover:bg-black transition-all hover:text-white w-fit cursor-pointer rounded-lg text-xs"
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
              <AvatarMenu actions={avatarActions} avatarClassName="h-8 w-8" />
            )}

            {!user && (
              <Button
                onClick={() => navigate("/login")}
                className=" text-black border-2 hover:bg-black transition-all hover:text-white w-fit cursor-pointer rounded-lg text-xs"
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
        // Part of the bar, so it carries the same surface — otherwise opening
        // the hamburger drops a flat white slab under a dotted navbar.
        <div className="md:hidden dot-grid-surface border-b border-gray-200 shadow-sm">
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
