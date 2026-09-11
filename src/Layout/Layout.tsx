// import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import FloatingMenu from "@/components/FloatingMenu/FloatingMenu";
import GridpatternBg from "@/components/GridpatternBg/GridpatternBg";
import ScrollToTop from "@/components/Common/ScrollToTop";

/**
 * `dvh` is the viewport as it currently stands — between the top of the screen
 * and the browser's own bar — so a page with nothing to scroll ends exactly
 * where the visible area does, and no scrollbar appears.
 *
 * This was `100lvh` plus the bottom safe-area inset. `lvh` measures the
 * viewport with the browser UI *retracted*, so on a phone it is taller than
 * what you can actually see by the height of the address bar, and the inset
 * added ~34px more. Both were there to push the hero under Safari's chrome
 * rather than stopping above it and leaving a strip of page for Safari to
 * tint. The cost was that every page was taller than the screen by design —
 * the home page scrolled, and showed a scrollbar, with nothing below the fold
 * to scroll to.
 *
 * That strip no longer needs page content to cover it: the hero paints the
 * document canvas behind the chrome instead (see Hero), which reaches where
 * page content cannot. So the page can size to what is visible.
 *
 * `min-h`, not `h`: a page with real content still grows past the fold and
 * scrolls normally. It is only the pages that fit that now stop cleanly.
 */
const Layout: React.FC = () => {
  return (
    <div className="relative min-h-[100dvh]">
      <ScrollToTop />
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
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
