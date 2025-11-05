import { Outlet } from "react-router-dom";
import NavbarAdminDashboard from "./NavbarAdminDashboard";

export default function AdminLayout() {
  return (
    <div>
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
