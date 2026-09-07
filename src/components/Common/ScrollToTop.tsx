import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Jump to the top of the page on every route change — including when the user
 * hits the Back button, which otherwise lands them wherever they'd scrolled to
 * on the previous page.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  // Browsers restore the previous scroll offset themselves on a Back/Forward
  // navigation, and they do it *after* React has run its effects — so the jump
  // to the top below was being undone a moment later and Back kept landing
  // mid-page. Taking manual control is what makes that scroll stick.
  //
  // Scoped to this component's lifetime (it is mounted by the public Layout
  // only) so the dashboards keep the browser's native restore behaviour.
  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    // Only scroll if there is somewhere to scroll from. Landing on a new route
    // already at the top and calling scrollTo anyway is not a no-op on iOS:
    // Safari reads any scroll towards the top as the cue to expand its bottom
    // toolbar back to the opaque bar, which is why navigating from the menu
    // produced a grey band that a reload — which never sends that cue — fixed.
    if (window.scrollY === 0) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
