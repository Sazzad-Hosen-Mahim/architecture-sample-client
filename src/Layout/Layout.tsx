// import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import FloatingMenu from "@/components/FloatingMenu/FloatingMenu";
import GridpatternBg from "@/components/GridpatternBg/GridpatternBg";
import ScrollToTop from "@/components/Common/ScrollToTop";

const Layout: React.FC = () => {
  return (
    <div className="relative min-h-dvh">
      <ScrollToTop />
      {/*  Background grid pattern */}
      <GridpatternBg />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
        <FloatingMenu />
        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default Layout;
