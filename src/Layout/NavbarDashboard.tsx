import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CalendarClock, LogOut, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
// import { logout } from "@/redux/Slices/AuthSlice/authSlice";
import logo from "@/assets/logo.png";
import TimeCardDialog from "@/components/Deshboard/TimeCardDialog/TimeCardDialog";
import NotificationPopover from "@/components/Deshboard/NotificationPopover";
import AvatarMenu, {
  type AvatarMenuAction,
} from "@/components/Common/AvatarMenu";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { signOut } from "@/redux/features/auth/authActions";
import { sectionsFor, type DashboardSection } from "@/utils/dashboardAccess";

/** The three top-level tabs, in the order they are shown. */
const TABS: { section: DashboardSection; to: string; label: string }[] = [
  { section: "studio", to: "/dashboard", label: "Studio" },
  { section: "media", to: "/dashboard/media", label: "Media" },
  { section: "financials", to: "/dashboard/financials", label: "Financials" },
];

export default function NavbarDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [showTimecardDialog, setShowTimecardDialog] = useState(false); //  for time card dialog
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const user = useAppSelector(selectCurrentUser);

  // Same table the layout guard uses, so a hidden tab is also an unreachable
  // route — rather than a tab that is merely painted out of the way.
  const allowed = sectionsFor(user);
  const tabs = TABS.filter((tab) => allowed.includes(tab.section));

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    dispatch(signOut());
    navigate("/login");
  };

  const avatarActions: AvatarMenuAction[] = [
    {
      key: "timecard",
      icon: CalendarClock,
      label: "Time Card",
      description: "View & submit timesheets",
      onClick: () => setShowTimecardDialog(true),
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
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === "/dashboard"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                    isActive ? "border-b-2 border-black" : ""
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
            {/* <NavLink
              to="/dashboard/teams"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                  isActive ? "border-b-2 border-black" : ""
                }`
              }
            >
              Teams
            </NavLink> */}
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
          <div className="flex  flex-shrink-1 w-1/3 justify-center">
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
            <AvatarMenu actions={avatarActions} />
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
            <AvatarMenu actions={avatarActions} />
          </div>
        </div>
      </div>

      {/* Timesheet dialog — opened from the avatar menu's "Time Card" item */}
      <TimeCardDialog
        open={showTimecardDialog}
        onOpenChange={setShowTimecardDialog}
      />

      {/* Mobile Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="md:hidden bg-gray-50 border-t border-gray-200 pb-2"
        >
          <div className="flex flex-col px-2 pt-2 pb-3 space-y-2 max-w-xs mx-auto">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === "/dashboard"}
                className={({ isActive }) =>
                  `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                    isActive ? "border-b-4 border-black bg-gray-100" : ""
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}

            {/* Shortcuts into pages the tabs above own. Same gate as the
                section they belong to, so they cannot outlive their tab. */}
            {allowed.includes("financials") && (
              <NavLink
                to="/dashboard/adjust-rates"
                className={({ isActive }) =>
                  `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                    isActive ? "border-b-4 border-black bg-gray-100" : ""
                  }`
                }
              >
                Adjust Rates
              </NavLink>
            )}

            {allowed.includes("studio") && (
              <>
                <NavLink
                  to="/dashboard/teams"
                  className={({ isActive }) =>
                    `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                      isActive ? "border-b-4 border-black bg-gray-100" : ""
                    }`
                  }
                >
                  Teams
                </NavLink>

                <NavLink
                  to="/dashboard/new-inquiries-list"
                  className={({ isActive }) =>
                    `block w-full px-3 py-2 rounded-md text-sm font-medium text-black hover:bg-website-color-lightGray hover:text-black ${
                      isActive ? "border-b-4 border-black bg-gray-100" : ""
                    }`
                  }
                >
                  New Inquiries
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
