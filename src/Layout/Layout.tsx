// import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import FloatingMenu from "@/components/FloatingMenu/FloatingMenu";
import GridpatternBg from "@/components/GridpatternBg/GridpatternBg";
import ScrollToTop from "@/components/Common/ScrollToTop";

const Layout: React.FC = () => {
  return (
    // `svh`, matching the inner column: `min-h-screen` is `100vh`, which iOS
    // measures with the toolbars hidden, so it would hold this wrapper ~65px
    // taller than the column inside it and put a strip of background back
    // under the hero on a phone.
    <div className="relative min-h-svh">
      <ScrollToTop />
      {/*  Background grid pattern */}
      <GridpatternBg />

      {/* Foreground content. The column is at least a viewport tall and `main`
          takes whatever the navbar leaves, so a page that wants to fill the
          screen — the homepage hero — can just say `flex-1` instead of
          subtracting a hard-coded navbar height from 100vh. */}
      <div className="relative z-10 flex min-h-svh flex-col">
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
