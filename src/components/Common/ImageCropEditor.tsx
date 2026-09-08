import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  projectImageUrl,
  TALL_FRAME_ASPECT,
  WIDE_FRAME_ASPECT,
  type AssetCrop,
  type CropRect,
} from "@/utils/projectImage";
import {
  boxRatioFor,
  defaultRect,
  moveRect,
  resizeRect,
  type Corner,
} from "@/utils/cropGeometry";

type Side = "wide" | "tall";

const SIDES: {
  key: Side;
  label: string;
  hint: string;
  frameAspect: number;
  /** Roughly the pixel width this screen asks of the hero. */
  recommendedWidth: number;
}[] = [
  {
    key: "wide",
    label: "Desktop",
    hint: "Laptops, desktops and landscape tablets",
    frameAspect: WIDE_FRAME_ASPECT,
    recommendedWidth: 1920,
  },
  {
    key: "tall",
    label: "Mobile",
    hint: "Phones held upright",
    frameAspect: TALL_FRAME_ASPECT,
    recommendedWidth: 900,
  },
];

/** How tall the editing stage may grow; the width follows the photo's shape. */
const STAGE_MAX_HEIGHT = 360;

interface ImageCropEditorProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  /** Original dimensions, which set the shape of the stage and of the box. */
  imageWidth?: number | null;
  imageHeight?: number | null;
  initialCrop?: AssetCrop | null;
  /** Null clears every crop and hands the photo back to the automatic fit. */
  onSave: (crop: AssetCrop | null) => void | Promise<void>;
  isSaving?: boolean;
}

/**
 * Chooses which part of a photograph the site shows when the photo and the
 * frame it fills are different shapes.
 *
 * Two choices, not one: a hero is wide on a desktop and tall on a phone, and
 * those are near enough inverses that no single rectangle serves both. Each
 * box is locked to the shape of the screen it stands for, so what an editor
 * draws is what a visitor sees — there is no second crop afterwards to
 * second-guess it. A side left unset keeps the automatic behaviour.
 */
export default function ImageCropEditor({
  open,
  onClose,
  imageUrl,
  imageWidth,
  imageHeight,
  initialCrop,
  onSave,
  isSaving = false,
}: ImageCropEditorProps) {
  const [side, setSide] = useState<Side>("wide");
  const [crops, setCrops] = useState<Record<Side, CropRect | null>>(() => ({
    wide: initialCrop?.wide ?? null,
    tall: initialCrop?.tall ?? null,
  }));

  // Falls back to the decoded file for records that never stored dimensions.
  const [loadedAspect, setLoadedAspect] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const imageAspect =
    imageWidth && imageHeight ? imageWidth / imageHeight : loadedAspect;

  const stageRef = useRef<HTMLDivElement | null>(null);

  /**
   * The stage is the photo's own rectangle, so a box drawn on it maps straight
   * onto the image with no letterboxing to subtract first.
   *
   * Sized in CSS rather than from a measurement: `aspect-ratio` fixes the shape
   * and the width is capped both by the dialog and by what would make the box
   * taller than STAGE_MAX_HEIGHT, so the height never needs its own cap to
   * fight with. Nothing here waits on a ResizeObserver, which is what used to
   * leave the editor spinning when the first measurement came back empty.
   */
  const stageAspect = imageAspect ?? 3 / 2;
  const stageStyle = {
    aspectRatio: String(stageAspect),
    width: `min(100%, ${Math.round(STAGE_MAX_HEIGHT * stageAspect)}px)`,
  };

  /**
   * An image restored from cache can finish loading before React attaches
   * `onLoad`, so the shape is also read as the element is attached.
   */
  const captureAspect = (img: HTMLImageElement | null) => {
    if (!img || loadedAspect !== null) return;
    if (imageWidth && imageHeight) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoadedAspect(img.naturalWidth / img.naturalHeight);
    }
  };

  const active = SIDES.find((entry) => entry.key === side)!;
  const rect = crops[side];

  const boxRatio = imageAspect ? boxRatioFor(active.frameAspect, imageAspect) : 1;

  // What the box is actually worth in pixels. A crop cannot invent detail, so a
  // small box on a small photo is enlarged to fill the hero and goes soft —
  // which looks like the crop was ignored, and is worth saying out loud here
  // rather than leaving to be discovered on the live page.
  const deliveredWidth =
    imageWidth && rect ? Math.round(imageWidth * rect.width) : null;
  const deliveredHeight =
    imageHeight && rect ? Math.round(imageHeight * rect.height) : null;
  const isSoft = deliveredWidth !== null && deliveredWidth < active.recommendedWidth;

  const dragRef = useRef<{
    mode: { kind: "move" } | { kind: "resize"; corner: Corner };
    startX: number;
    startY: number;
    start: CropRect;
  } | null>(null);

  const setRect = (next: CropRect) =>
    setCrops((current) => ({ ...current, [side]: next }));

  const beginDrag = (
    event: React.PointerEvent,
    mode: { kind: "move" } | { kind: "resize"; corner: Corner },
  ) => {
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    // Captured on the stage, so one pair of handlers serves the box and every
    // handle, and a fast drag that outruns the pointer still tracks.
    stageRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      start: rect,
    };
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;

    // Read at drag time rather than kept in state, so the maths cannot go stale
    // against a resized dialog and needs no measurement to have arrived first.
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const dx = (event.clientX - drag.startX) / bounds.width;
    const dy = (event.clientY - drag.startY) / bounds.height;

    setRect(
      drag.mode.kind === "move"
        ? moveRect(drag.start, dx, dy)
        : resizeRect(drag.start, drag.mode.corner, dx, dy, boxRatio),
    );
  };

  const endDrag = (event: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    stageRef.current?.releasePointerCapture(event.pointerId);
  };

  const handleSave = () => {
    const next: AssetCrop = {};
    if (crops.wide) next.wide = crops.wide;
    if (crops.tall) next.tall = crops.tall;
    onSave(Object.keys(next).length > 0 ? next : null);
  };

  const handleCornerPointerDown = (corner: Corner) => (event: React.PointerEvent) =>
    beginDrag(event, { kind: "resize", corner });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {/* `sm:` prefixed deliberately: DialogContent's own cap is `sm:max-w-lg`,
          and tailwind-merge keeps a bare `max-w-3xl` alongside it rather than
          replacing it — leaving the wider value losing the cascade on exactly
          the screens where the stage most needs the room. */}
      <DialogContent className="sm:max-w-3xl bg-white p-0">
        <DialogHeader className="border-b border-gray-200 p-5">
          <DialogTitle className="text-base font-bold text-gray-800">
            Choose what the page shows
          </DialogTitle>
          <p className="text-xs text-gray-500">
            A photo rarely matches the shape of the screen. Pick the part that
            matters and it is what visitors see.
          </p>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* Screen shape being edited. Each keeps its own box. */}
          <div className="flex items-center gap-2">
            {SIDES.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setSide(entry.key)}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  side === entry.key
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                {entry.label}
                <span
                  className={cn(
                    "ml-2 rounded px-1.5 py-0.5 text-[9px]",
                    crops[entry.key]
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600",
                  )}
                >
                  {crops[entry.key] ? "Cropped" : "Automatic"}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500">{active.hint}</p>

          <div className="flex justify-center">
              <div
                ref={stageRef}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="relative touch-none overflow-hidden rounded-lg bg-gray-900 select-none"
                style={stageStyle}
              >
                <img
                  ref={captureAspect}
                  src={projectImageUrl(imageUrl, 1200)}
                  alt=""
                  draggable={false}
                  onLoad={(event) => {
                    if (imageWidth && imageHeight) return;
                    const { naturalWidth, naturalHeight } = event.currentTarget;
                    if (naturalWidth > 0 && naturalHeight > 0) {
                      setLoadedAspect(naturalWidth / naturalHeight);
                    }
                  }}
                  onError={() => setFailed(true)}
                  // `contain` while the shape is still unknown, which is the
                  // only time the stage is not already the photo's own shape.
                  className="h-full w-full object-contain"
                />

                {failed && (
                  <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white/80">
                    This photo could not be loaded, so it cannot be cropped.
                  </p>
                )}

                {rect && (
                  <div
                    onPointerDown={(event) => beginDrag(event, { kind: "move" })}
                    className="absolute cursor-move border-2 border-white"
                    style={{
                      left: `${rect.x * 100}%`,
                      top: `${rect.y * 100}%`,
                      width: `${rect.width * 100}%`,
                      height: `${rect.height * 100}%`,
                      // Darkens everything outside the box in one declaration;
                      // the stage clips the overspill.
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
                    }}
                  >
                    {/* Thirds, to compose against. */}
                    <div className="pointer-events-none absolute inset-0 opacity-40">
                      <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white" />
                      <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white" />
                      <div className="absolute top-1/3 right-0 left-0 h-px bg-white" />
                      <div className="absolute top-2/3 right-0 left-0 h-px bg-white" />
                    </div>

                    {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
                      <div
                        key={corner}
                        onPointerDown={handleCornerPointerDown(corner)}
                        className={cn(
                          "absolute h-4 w-4 rounded-sm border-2 border-blue-500 bg-white",
                          corner === "nw" && "-top-2 -left-2 cursor-nwse-resize",
                          corner === "ne" && "-top-2 -right-2 cursor-nesw-resize",
                          corner === "sw" &&
                            "-bottom-2 -left-2 cursor-nesw-resize",
                          corner === "se" &&
                            "-right-2 -bottom-2 cursor-nwse-resize",
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
          </div>

          {deliveredWidth && deliveredHeight && (
            <p className={cn("text-xs", isSoft ? "text-amber-700" : "text-gray-500")}>
              This box delivers{" "}
              <span className="font-semibold">
                {deliveredWidth} × {deliveredHeight} px
              </span>
              {isSoft
                ? `. A ${active.label.toLowerCase()} hero is around ${active.recommendedWidth} px wide, so this will be enlarged to fit and may look soft. Draw a larger box, or upload a higher-resolution photo.`
                : ` — enough for a ${active.label.toLowerCase()} hero.`}
            </p>
          )}

          <div className="flex items-start justify-between gap-4">
            <p className="text-xs text-gray-500">
              {rect
                ? `Drag the box to move it, the corners to resize. Everything inside it is shown; a screen shaped differently from this one sees a little more around it, never less.`
                : `No crop set. ${active.label} visitors see the whole photo, fitted to the screen against a blurred background.`}
            </p>

            {rect ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCrops((current) => ({ ...current, [side]: null }))}
                className="shrink-0 cursor-pointer text-xs"
              >
                Use automatic fit
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!imageAspect || failed}
                onClick={() => setRect(defaultRect(boxRatio))}
                className="shrink-0 cursor-pointer bg-gray-800 text-xs text-white hover:bg-black"
              >
                Set a crop
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="cursor-pointer hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSaving ? "Saving..." : "Save crop"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
