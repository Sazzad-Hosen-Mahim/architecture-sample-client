import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { useAppDispatch } from "@/hooks/useRedux";
// import { logout } from "@/redux/Slices/AuthSlice/authSlice";
import logo from "@/assets/logo.png";
import NotificationPopover from "@/components/Deshboard/NotificationPopover";
import AvatarMenu, {
  type AvatarMenuAction,
} from "@/components/Common/AvatarMenu";
import { signOut } from "@/redux/features/auth/authActions";

export default function NavbarAdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    dispatch(signOut());
    navigate("/login");
  };

  const avatarActions: AvatarMenuAction[] = [
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
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200 px-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex items-center justify-between h-12 ">
          {/* Left: Desktop menu (hidden on mobile) */}
          <div className="hidden md:flex space-x-4">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Studio
            </NavLink>

            <NavLink
              to="/media"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Media
            </NavLink>

            <NavLink
              to="/financials"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Financials
            </NavLink>
          </div>

          <NavLink
            to="/employees"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
              }`
            }
          >
            Employees
          </NavLink>

          {/* Logo */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="text-xl font-extralight tracking-wide">
                Architecture Simple<span className="text-yellow-400">.</span>
              </span>
            </Link>
          </div>

          {/* Right: Desktop User Avatar */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notification Dropdown */}
            <NotificationPopover />

            {/* User Avatar Dropdown */}
            <AvatarMenu actions={avatarActions} />
          </div>

          {/* Mobile Hamburger and Avatar */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Hamburger */}
            <button
              onClick={toggleMenu}
              type="button"
              className="text-black hover:text-gray-700 focus:outline-none"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* User Avatar */}
            <AvatarMenu actions={avatarActions} />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/admin"
              className="block text-black hover:bg-purple-700 px-3 py-2 rounded-md text-base font-medium"
            >
              Studio
            </Link>
            <Link
              to="/media"
              className="block text-black hover:bg-purple-700 px-3 py-2 rounded-md text-base font-medium"
            >
              Media
            </Link>
            <Link
              to="/financials"
              className="block text-black hover:bg-purple-700 px-3 py-2 rounded-md text-base font-medium"
            >
              Financials
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
