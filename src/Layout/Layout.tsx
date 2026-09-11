// import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import FloatingMenu from "@/components/FloatingMenu/FloatingMenu";
import GridpatternBg from "@/components/GridpatternBg/GridpatternBg";
import ScrollToTop from "@/components/Common/ScrollToTop";

/**
 * `lvh` rather than `dvh`: `dvh` is the viewport *above* iOS Safari's address
 * bar, so a page sized to it stops short and leaves the bar sitting on a strip
 * of blank page — which Safari then paints from the document canvas, and that
 * is the band under the hero. `lvh` is the same viewport measured with the
 * browser UI retracted, so the page runs the full height of the phone and the
 * photo continues under the bar instead of stopping above it.
 *
 * The extra height is also the point, not a side effect. Safari only retracts
 * that bar once the page can scroll, and only then does content reach the strip
 * it was covering — so a page sized to exactly what is visible can never get
 * there, whatever units or positioning it uses. The overshoot buys the scroll;
 * the scroll buys the retraction; the retraction is what fills the band.
 *
 * The two units are identical wherever there is no retractable browser UI, so
 * desktop and Android are unaffected. The scrollbar this creates is hidden on
 * the home page, which is the only page with nothing below the fold — see
 * `hero-no-scrollbar` in index.css.
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
      <div className="relative z-10 flex min-h-[calc(100lvh_+_env(safe-area-inset-bottom))] flex-col">
        {/* Background grid pattern.

            It used to sit outside this wrapper at z-50. The wrapper is z-10 and
            the outer div sets no z-index, so both landed in the root stacking
            context and the grid — black lines at 10% and dots at 20% — painted
            over the entire app, the navbar included. The floating menu escaped
            it only because its slide `transform` promotes it to its own
            compositing layer, which is why the navbar read as the darker white
            of the two despite both being #fff.

            Inside the wrapper at z-0 it still covers the page content below it,
            but the navbar (z-50) and the menu panel (z-99) now sit above it, so
            both render as plain white on every browser. */}
        <GridpatternBg />
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
