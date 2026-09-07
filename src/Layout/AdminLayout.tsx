import { Outlet } from "react-router-dom";
import NavbarAdminDashboard from "./NavbarAdminDashboard";

export default function AdminLayout() {
  return (
    // min-h-lvh for the same reason as the public Layout: `lvh` runs the page
    // the full height of the phone so it continues under iOS Safari's address
    // bar, rather than stopping above it and leaving a strip of blank page for
    // the bar to sit on. No effect where there is no retractable browser UI.
    <div className="min-h-lvh">
      <div>
        <NavbarAdminDashboard></NavbarAdminDashboard>
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
