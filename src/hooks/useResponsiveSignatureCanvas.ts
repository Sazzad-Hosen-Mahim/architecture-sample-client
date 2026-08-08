import { useEffect, useRef, type RefObject } from "react";
import type SignatureCanvas from "react-signature-canvas";

/**
 * Keeps a signature pad's bitmap in step with its rendered size.
 *
 * `<canvas>` has two independent sizes: the bitmap (`width`/`height`
 * attributes) and the CSS box. react-signature-canvas maps pointer events onto
 * the *bitmap*, so as soon as CSS stretches the element the ink lands away from
 * the cursor — badly on a wide screen if the bitmap was sized for mobile, and
 * the other way round. Fixed `width: 300` with `style.width: 100%` is exactly
 * that mismatch.
 *
 * This measures the wrapper and resizes the bitmap to match, multiplied by the
 * device pixel ratio so strokes stay sharp on retina displays. Any existing
 * signature is preserved across the resize.
 *
 * Usage — the parent keeps its own ref, so `isEmpty()`, `toDataURL()` and
 * `clear()` all work unchanged:
 *
 *   const sigRef = useRef<SignatureCanvas>(null);
 *   const wrapperRef = useResponsiveSignatureCanvas(sigRef);
 *   <div ref={wrapperRef}><SignatureCanvas ref={sigRef} … /></div>
 */
export function useResponsiveSignatureCanvas(
  signatureRef: RefObject<SignatureCanvas | null>,
  /** CSS height of the pad, in px. */
  height = 120
) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const resize = () => {
      const pad = signatureRef.current;
      const canvas = pad?.getCanvas();
      if (!pad || !canvas) return;

      const width = wrapper.clientWidth;
      // A hidden pad (modal still closed) measures 0 — skip until it is shown,
      // otherwise the bitmap collapses and the saved signature is lost.
      if (width === 0) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      if (canvas.width === width * ratio && canvas.height === height * ratio) {
        return;
      }

      // Resizing a canvas clears it, so stash the strokes and replay them.
      const existing = pad.isEmpty() ? null : pad.toData();

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext("2d")?.scale(ratio, ratio);

      pad.clear();
      if (existing?.length) pad.fromData(existing);
    };

    resize();

    // Covers the modal opening, the viewport changing and orientation flips.
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    window.addEventListener("orientationchange", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", resize);
    };
  }, [signatureRef, height]);

  return wrapperRef;
}
