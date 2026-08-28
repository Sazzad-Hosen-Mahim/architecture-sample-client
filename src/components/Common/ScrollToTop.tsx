import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Jump to the top of the page on every route change — including when the user
 * hits the Back button, which otherwise lands them wherever they'd scrolled to
 * on the previous page.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
