import { useCallback, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
    projectImageSrcSet,
    projectImageUrl,
    type ProjectImage,
} from "@/utils/projectImage";

interface ImageLightboxProps {
    images: ProjectImage[];
    /** Index of the photo on show. Controlled, so the page and the lightbox agree. */
    index: number;
    onIndexChange: (index: number) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Used to build each photo's alt text, e.g. "Dinner House — image 2 of 5". */
    alt?: string;
}

/**
 * Full-screen viewer for a set of project photographs.
 *
 * Built on the Radix dialog primitives rather than the styled `DialogContent`
 * wrapper: that wrapper bakes in a card look — centred, `max-w-lg`, padded,
 * bordered — which is the opposite of what a lightbox wants, and unpicking it
 * through class overrides is more fragile than composing the primitives. Using
 * them directly still gets the focus trap, the scroll lock and Escape.
 *
 * The photo is shown `contain`: the point of opening it is to see the whole
 * frame, so nothing is cropped here even though the thumbnails and page
 * galleries crop to fill their boxes.
 */
export default function ImageLightbox({
    images,
    index,
    onIndexChange,
    open,
    onOpenChange,
    alt = "Image",
}: ImageLightboxProps) {
    const count = images.length;
    const hasMultiple = count > 1;

    const goPrev = useCallback(
        () => onIndexChange((index - 1 + count) % count),
        [index, count, onIndexChange],
    );
    const goNext = useCallback(
        () => onIndexChange((index + 1) % count),
        [index, count, onIndexChange],
    );

    // Radix handles Escape; the arrows are ours. Bound while open only, so the
    // page's own keyboard shortcuts are untouched the rest of the time.
    useEffect(() => {
        if (!open || !hasMultiple) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft") goPrev();
            if (event.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, hasMultiple, goPrev, goNext]);

    const current = images[index];
    if (!current) return null;

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed inset-0 z-[100] flex flex-col focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                >
                    {/* Radix requires an accessible name; it is for screen readers
                        rather than the design, so it is visually hidden. */}
                    <DialogPrimitive.Title className="sr-only">
                        {alt}
                    </DialogPrimitive.Title>

                    <div className="flex items-center justify-between px-4 py-3 text-white">
                        <span className="text-sm font-medium tabular-nums">
                            {hasMultiple ? `${index + 1} / ${count}` : ""}
                        </span>
                        <DialogPrimitive.Close
                            aria-label="Close full view"
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </DialogPrimitive.Close>
                    </div>

                    {/* The photo. `min-h-0` lets this flex child actually shrink,
                        without which the thumbnail strip gets pushed off-screen. */}
                    <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
                        <img
                            key={current.url}
                            src={projectImageUrl(current.url, 1920)}
                            srcSet={projectImageSrcSet(current.url, current.width)}
                            sizes="100vw"
                            alt={
                                current.altText ||
                                (hasMultiple ? `${alt} — image ${index + 1} of ${count}` : alt)
                            }
                            className="max-h-full max-w-full object-contain select-none"
                            draggable={false}
                        />

                        {hasMultiple && (
                            <>
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    aria-label="Previous image"
                                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 cursor-pointer"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    aria-label="Next image"
                                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 cursor-pointer"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}
                    </div>

                    {hasMultiple && (
                        <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-4">
                            {images.map((image, thumbIndex) => (
                                <button
                                    key={image.url}
                                    type="button"
                                    onClick={() => onIndexChange(thumbIndex)}
                                    aria-label={`Show image ${thumbIndex + 1}`}
                                    aria-current={thumbIndex === index}
                                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                                        thumbIndex === index
                                            ? "border-white"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    {/* 160px covers a 64px box past 2x — no reason to
                                        pull full-size photos down for the strip. */}
                                    <img
                                        src={projectImageUrl(image.url, 160)}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover"
                                        style={{ objectPosition: image.focalPoint || undefined }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
