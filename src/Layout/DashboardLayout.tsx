import { Outlet, useLocation } from "react-router-dom";
import NavbarDashboard from "./NavbarDashboard";

export default function DashboardLayout() {
  const location = useLocation();

  // List of routes where Navbar should NOT appear
  const hideNavbarOn = ["/dashboard/new-proposal"];

  const shouldHideNavbar = hideNavbarOn.includes(location.pathname);
  return (
    <div>
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
