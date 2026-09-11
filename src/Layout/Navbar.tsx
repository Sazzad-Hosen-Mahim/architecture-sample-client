import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
// import { logout } from "@/store/Slices/AuthSlice/authSlice";
import logo from "@/assets/logo-3.png";
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
/**
 * Main pages that need a way out anyway, and where it leads.
 *
 * The floating menu is what makes Back unnecessary on a main page — but it
 * hides its own button on the New Project wizard, so once someone is inside
 * that page there is no route out of it at all. Back returns them to the home
 * page with the menu open, which is where they opened the wizard from.
 */
const MAIN_PAGE_BACK: Record<
  string,
  { to: string; label: string; state?: Record<string, unknown> }
> = {
  "/new-project": { to: "/", label: "Back", state: { openMenu: true } },
};

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

  /**
   * A main page normally offers no way back, because the floating menu already
   * reaches it in one tap. But the same page can also be opened from somewhere
   * that does want a way back — the client dashboard's New Project button opens
   * /new-project, and from there the dashboard is otherwise unreachable.
   *
   * Whoever navigates says so, by putting `backTo` in the navigation state.
   * That keeps it to the one route that asked: /new-project reached from the
   * floating menu carries no state and still shows nothing, which is what
   * separates the two ways into the same page.
   */
  const backNav = location.state as {
    backTo?: string;
    backLabel?: string;
  } | null;

  // A caller that asked for a particular destination wins over the page's own
  // rule: the client dashboard sends people into the same wizard and wants them
  // returned to the dashboard rather than to the home page. Failing that, a main
  // page uses its entry above if it has one, and otherwise offers nothing —
  // every ordinary sub-page just steps back through history as before.
  const back: {
    to?: string;
    label: string;
    state?: Record<string, unknown>;
  } | null = backNav?.backTo
    ? { to: backNav.backTo, label: backNav.backLabel ?? "Back" }
    : (MAIN_PAGE_BACK[currentPath] ?? (isMainPage ? null : { label: "Back" }));

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
        {/* Three children, always — one flex row rather than a grid.

            This was a three-column grid holding four cells: one for the logo,
            one for Back, and two more for the right-hand side that swapped on
            `md` via `display`. Which column the visible right-hand cell landed
            in was therefore decided by auto-placement, from whether its sibling
            was being displayed — and a cell that lands short of the last column
            right-aligns to the middle of the bar rather than to its edge, which
            is where Login kept ending up on a phone.

            So the two right-hand cells are now one (they differed only in
            avatar size), and the row holds exactly three children at every
            width, in fixed order. Nothing to auto-place, nothing to mis-place.

            `flex-1 basis-0` on both sides, not `w-1/3`: the two sides stay
            equal to each other — which is what centres the logo, whatever the
            logo measures — while the middle takes only the room it needs. The
            left cell keeps its share even with no Back button, so the logo
            does not jump between pages that have one and pages that do not. */}
        <div className="flex items-center gap-2 h-16">
          {/* Back — its share of the bar is held whether or not it renders */}
          <div className="flex min-w-0 flex-1 basis-0 justify-start">
            {back && (
              <Backbutton to={back.to} label={back.label} state={back.state} />
            )}
          </div>
          <div className="flex shrink-0 justify-center">
            <Link to="/" className="text-black text-2xl">
              <div className="flex items-center gap-2">
                <img src={logo} alt="" className="w-16 h-16" />
                <span className="hidden md:block lg:text-[22px] text-lg font-light tracking-wide">
                  Architecture Simple
                </span>
              </div>
            </Link>
          </div>

          {/* Account — one cell for every width.

              This was two cells swapping on `md`, identical but for the avatar
              being a notch smaller on a phone. That difference is a class, not
              a reason to render the block twice, and the duplicate is what gave
              auto-placement a fourth cell to reason about. */}
          <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-3">
            {/* Notifications sit beside the avatar for signed-in clients */}
            {user && <NotificationPopover />}
            {user ? (
              <AvatarMenu
                actions={avatarActions}
                avatarClassName="h-8 w-8 md:h-9 md:w-9"
              />
            ) : (
              <Button
                onClick={() => navigate("/login")}
                className=" text-black border-2 hover:bg-black transition-all hover:text-white w-fit cursor-pointer rounded-lg text-xs"
              >
                Login
              </Button>
            )}
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
