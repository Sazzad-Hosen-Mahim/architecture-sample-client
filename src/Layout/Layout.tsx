// import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import FloatingMenu from "@/components/FloatingMenu/FloatingMenu";
import GridpatternBg from "@/components/GridpatternBg/GridpatternBg";
import ScrollToTop from "@/components/Common/ScrollToTop";

/**
 * `lvh` rather than `dvh`: `dvh` is the viewport *above* iOS Safari's address
 * bar, so a page sized to it stops short and leaves the bar sitting on a strip
 * of blank page — which Safari then tints, and that was the white bar under the
 * hero. `lvh` is the same viewport measured with the browser UI retracted, so
 * the page runs the full height of the phone and the photo continues under the
 * bar instead of stopping above it.
 *
 * The two units are identical wherever there is no retractable browser UI, so
 * desktop and Android are unaffected. On iOS the page gains the bar's height,
 * which is what makes it scroll away on the first swipe.
 */
const Layout: React.FC = () => {
  return (
    <div className="relative min-h-lvh">
      <ScrollToTop />
      {/*  Background grid pattern */}
      <GridpatternBg />
      <div className="relative z-10 flex min-h-lvh flex-col">
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
