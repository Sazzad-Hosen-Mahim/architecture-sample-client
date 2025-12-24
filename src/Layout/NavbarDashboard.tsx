import UserAvatar from "@/ui/UserAvatar";
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
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TimeCardDialog from "@/components/Deshboard/TimeCardDialog/TimeCardDialog";
import { logout, selectCurrentUser } from "@/redux/features/auth/authSlice";

export default function NavbarDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [showTimecardDialog, setShowTimecardDialog] = useState(false); //  for time card dialog
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector(selectCurrentUser);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200 px-6">
      <div className="mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex items-center justify-between h-12 ">
          {/* Left: Desktop menu (hidden on mobile) */}
          <div className="hidden md:flex space-x-4">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                  isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Studio
            </NavLink>

            <NavLink
              to="/dashboard/media"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                  isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Media
            </NavLink>

            <NavLink
              to="/dashboard/financials"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                  isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Financials
            </NavLink>
            <NavLink
              to="/dashboard/employees"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                  isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Employees
            </NavLink>
          </div>

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative cursor-pointer ">
                  <Bell className="w-5 h-5" />
                  {/* Optional notification badge */}
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg"
              >
                <div className="p-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Notifications
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 max-h-60 overflow-y-auto">
                    <div className="hover:bg-gray-100 p-2 rounded-md cursor-pointer">
                      📨 New message from client
                    </div>
                    <div className="hover:bg-gray-100 p-2 rounded-md cursor-pointer">
                      ✅ Project “Modern Villa” approved
                    </div>
                    <div className="hover:bg-gray-100 p-2 rounded-md cursor-pointer">
                      💰 Payment received – $1200
                    </div>
                  </div>
                  <button className="mt-2 w-full text-center text-blue-500 text-sm font-medium hover:underline">
                    Mark all as read
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
                  setting
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
                <UserAvatar userName="Shaikot mr9" />
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
                `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                  isActive ? "border-b-4 border-black bg-gray-100" : ""
                }`
              }
            >
              Studio
            </NavLink>
            <NavLink
              to="/dashboard/media"
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                  isActive ? "border-b-4 border-black bg-gray-100" : ""
                }`
              }
            >
              Media
            </NavLink>
            <NavLink
              to="/dashboard/financials"
              className={({ isActive }) =>
                `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                  isActive ? "border-b-4 border-black bg-gray-100" : ""
                }`
              }
            >
              Financials
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}
