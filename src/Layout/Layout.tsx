// import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import FloatingMenu from "@/components/FloatingMenu/FloatingMenu";
import GridpatternBg from "@/components/GridpatternBg/GridpatternBg";

const Layout: React.FC = () => {
  return (
    // <div>
    //   <Navbar />
    //   <main>
    //     <Outlet />
    //   </main>
    //   {/* Floating menu available on every page */}
    //   <FloatingMenu />
    //   {/* <Footer /> */}
    // </div>

    <div className="relative min-h-screen">
      {/*  Background grid pattern */}
      <GridpatternBg />

      {/* Foreground content */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <Outlet />
        </main>
        <FloatingMenu />
        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default Layout;
