import { Outlet, useLocation } from "react-router-dom";
import NavbarDashboard from "./NavbarDashboard";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import {
  canAccessSection,
  isViewOnly,
  sectionOfPath,
} from "@/utils/dashboardAccess";
import SectionNotAllowed from "@/components/Common/SectionNotAllowed";
import { Eye } from "lucide-react";

export default function DashboardLayout() {
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);

  // List of routes where Navbar should NOT appear
  const hideNavbarOn = ["/dashboard/new-proposal", "/dashboard/new-inquiries"];

  const shouldHideNavbar = hideNavbarOn.includes(location.pathname);

  // Checked here rather than per route, so a page added later is covered by
  // whichever section owns its path without anyone remembering to guard it.
  // The navbar hides the tabs; this is what makes typing the URL fail too.
  const section = sectionOfPath(location.pathname);
  const blocked = section !== null && !canAccessSection(user, section);
  return (
    // min-h-lvh for the same reason as the public Layout: `lvh` runs the page
    // the full height of the phone so it continues under iOS Safari's address
    // bar, rather than stopping above it and leaving a strip of blank page for
    // the bar to sit on. No effect where there is no retractable browser UI.
    <div className="min-h-lvh">
      <div>
        {/* <NavbarAdminDashboard></NavbarAdminDashboard> */}
        {!shouldHideNavbar && <NavbarDashboard />}

        {/* Said once, up front, so a drafter or employee isn't left guessing
            why a control didn't do anything. */}
        {isViewOnly(user) && !blocked && (
          <div className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            <Eye className="h-3.5 w-3.5 flex-shrink-0" />
            <span>You have view-only access — changes can't be saved.</span>
          </div>
        )}

        <main>
          {blocked && section ? (
            <SectionNotAllowed section={section} user={user} />
          ) : (
            <Outlet />
          )}
        </main>
        {/* Floating menu available on every page */}
        {/* <FloatingMenu /> */}
        {/* <Footer /> */}
      </div>
    </div>
  );
}
