import { Outlet, useLocation } from "react-router-dom";
import NavbarDashboard from "./NavbarDashboard";

export default function DashboardLayout() {
  const location = useLocation();

  // List of routes where Navbar should NOT appear
  const hideNavbarOn = ["/dashboard/new-proposal", "/dashboard/new-inquiries"];

  const shouldHideNavbar = hideNavbarOn.includes(location.pathname);
  return (
    // min-h-lvh for the same reason as the public Layout: `lvh` runs the page
    // the full height of the phone so it continues under iOS Safari's address
    // bar, rather than stopping above it and leaving a strip of blank page for
    // the bar to sit on. No effect where there is no retractable browser UI.
    <div className="min-h-lvh">
      <div>
        {/* <NavbarAdminDashboard></NavbarAdminDashboard> */}
        {!shouldHideNavbar && <NavbarDashboard />}

        <main>
          <Outlet />
        </main>
        {/* Floating menu available on every page */}
        {/* <FloatingMenu /> */}
        {/* <Footer /> */}
      </div>
    </div>
  );
}
