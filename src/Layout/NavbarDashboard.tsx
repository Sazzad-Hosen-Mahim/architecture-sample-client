import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
// import { logout } from "@/redux/Slices/AuthSlice/authSlice";
import logo from "@/assets/logo.png";
import TimeCardDialog from "@/components/Deshboard/TimeCardDialog/TimeCardDialog";
import NotificationPopover from "@/components/Deshboard/NotificationPopover";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { signOut } from "@/redux/features/auth/authActions";

export default function NavbarDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [showTimecardDialog, setShowTimecardDialog] = useState(false); //  for time card dialog
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const user = useAppSelector(selectCurrentUser);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    dispatch(signOut());
    navigate("/login");
  };

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200 p-4">
      <div className="mx-auto px-2 lg:px-12">
        <div className="flex items-center justify-between h-12 ">
          {/* Left: Desktop menu (hidden on mobile) */}
          <div className="flex md:hidden ">
            <NotificationPopover />
          </div>
          <div className="hidden md:flex space-x-2  w-1/3">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Studio
            </NavLink>

            <NavLink
              to="/dashboard/media"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Media
            </NavLink>

            {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER" || user?.role === "FINANCE") && (
              <>
                <NavLink
                  to="/dashboard/financials"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                    }`
                  }
                >
                  Financials
                </NavLink>

                {/* {(user?.role === "SUPER_ADMIN" || user?.role === "PROJECT_MANAGER" || user?.role === "FINANCE") && (
                  <NavLink
                    to="/dashboard/adjust-rates"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                      }`
                    }
                  >
                    Adjust Rates
                  </NavLink>
                )} */}
              </>
            )}
            <NavLink
              to="/dashboard/teams"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Teams
            </NavLink>
            {/* <NavLink
              to="/dashboard/employees"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Employees
            </NavLink> */}
            {/* <NavLink
              to="/dashboard/proposals"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Proposals
            </NavLink> */}
            {/* <NavLink
              to="/dashboard/new-inquiries-list"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              New Inquiries
            </NavLink> */}
          </div>

          {/* Logo */}
          <div className="flex  flex-shrink-1 w-1/3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="text-xl font-extralight tracking-wide">
                Architecture Simple
              </span>
            </Link>
          </div>

          {/* Right: Desktop User Avatar */}
          <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
            {/* Notification Dropdown */}
            <NotificationPopover />

            {/* User Avatar Dropdown */}
            <Popover>
              <PopoverTrigger className="cursor-pointer">
                {/* <UserAvatar userName="Shaikot mr9" /> */}
                <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
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
              <PopoverContent className="mr-3 bg-white border border-gray-200 space-y-2 text-white">
                <Button
                  onClick={() => setShowTimecardDialog(true)}
                  className=" text-black w-full  cursor-pointer hover:bg-gray-400"
                >
                  Time Card
                </Button>

                {/* Time card  component */}
                <TimeCardDialog
                  open={showTimecardDialog}
                  onOpenChange={setShowTimecardDialog}
                />
                <Button
                  onClick={() => navigate("/profile-settings")}
                  className=" text-black w-full cursor-pointer hover:bg-gray-400"
                >
                  Setting
                </Button>
                <Button
                  onClick={handleLogout}
                  className=" text-black w-full cursor-pointer hover:bg-gray-400"
                >
                  Logout
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Mobile Hamburger and Avatar */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Hamburger */}
            <button
              ref={buttonRef}
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
            <Popover>
              <PopoverTrigger className="cursor-pointer">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
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
              <PopoverContent className="mr-3 bg-white border-none text-white">
                <Button
                  onClick={() => setShowTimecardDialog(true)}
                  className=" text-black w-full  cursor-pointer hover:bg-gray-400"
                >
                  Time Card
                </Button>

                {/* Time card  component */}
                <TimeCardDialog
                  open={showTimecardDialog}
                  onOpenChange={setShowTimecardDialog}
                />
                <Button
                  onClick={() => navigate("/profile-settings")}
                  className=" text-black w-full cursor-pointer hover:bg-gray-400"
                >
                  setting
                </Button>
                <Button
                  onClick={handleLogout}
                  className=" text-black w-full cursor-pointer hover:bg-gray-400"
                >
                  Logout
                </Button>
                {/* <Button
                  onClick={handleLogout}
                  className="bg-website-color-lightGray text-black w-full"
                >
                  Logout
                </Button> */}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="md:hidden bg-gray-50 border-t border-gray-200 pb-2"
        >
          <div className="flex flex-col px-2 pt-2 pb-3 space-y-2 max-w-xs mx-auto">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-4 border-black bg-gray-100" : ""
                }`
              }
            >
              Studio
            </NavLink>
            <NavLink
              to="/dashboard/media"
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-4 border-black bg-gray-100" : ""
                }`
              }
            >
              Media
            </NavLink>
            {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER" || user?.role === "FINANCE") && (
              <>
                <NavLink
                  to="/dashboard/financials"
                  className={({ isActive }) =>
                    `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-4 border-black bg-gray-100" : ""
                    }`
                  }
                >
                  Financials
                </NavLink>

                {(user?.role === "SUPER_ADMIN" || user?.role === "PROJECT_MANAGER" || user?.role === "FINANCE") && (
                  <NavLink
                    to="/dashboard/adjust-rates"
                    className={({ isActive }) =>
                      `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-4 border-black bg-gray-100" : ""
                      }`
                    }
                  >
                    Adjust Rates
                  </NavLink>
                )}

                <NavLink
                  to="/dashboard/teams"
                  className={({ isActive }) =>
                    `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-4 border-black bg-gray-100" : ""
                    }`
                  }
                >
                  Teams
                </NavLink>
              </>
            )}
            <NavLink
              to="/dashboard/new-inquiries-list"
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${isActive ? "border-b-4 border-black bg-gray-100" : ""
                }`
              }
            >
              New Inquiries
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}
