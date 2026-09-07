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
 *
 * The safe-area inset is added on top because `lvh` does not reliably include
 * the strip around the home indicator: falling ~34px short there left a band of
 * page background below the hero, right at the bottom edge of the phone. Where
 * the inset is already counted the page simply runs that much longer, which
 * costs nothing — the hero grows to fill it either way. The inset is 0 on every
 * device without a cutout.
 */
const Layout: React.FC = () => {
  return (
    <div className="relative min-h-[calc(100lvh_+_env(safe-area-inset-bottom))]">
      <ScrollToTop />
      {/*  Background grid pattern */}
      <GridpatternBg />
      <div className="relative z-10 flex min-h-[calc(100lvh_+_env(safe-area-inset-bottom))] flex-col">
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
