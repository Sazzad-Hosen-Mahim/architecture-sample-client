/**
 * The geometry behind the crop editor's box.
 *
 * Everything here works in normalized image space — 0..1 of the original photo
 * on each axis — which is also how a crop is stored, so nothing has to be
 * converted on the way to the database or the delivery URL.
 *
 * Note that normalized space is not square: one unit across is the photo's full
 * width and one unit down is its full height, so a box that *looks* 16:9 on
 * screen has normalized sides in some other proportion entirely. `boxRatio`
 * carries that conversion, and every function that shapes a box takes it.
 */
import type { CropRect } from "./projectImage";

export type Corner = "nw" | "ne" | "sw" | "se";

/** Stops a box from being dragged down to nothing. */
export const MIN_BOX_WIDTH = 0.08;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Normalized width per unit of normalized height that makes a box's real
 * proportions match `frameAspect`. Without dividing through by the image's own
 * shape, a box on a portrait photo would come out the wrong shape entirely.
 */
export const boxRatioFor = (frameAspect: number, imageAspect: number): number =>
  frameAspect / imageAspect;

/**
 * The largest box of the required shape that fits inside the picture, centred.
 * The starting point when an editor first sets a crop: the most of the photo
 * that this shape of screen can show without letterboxing.
 */
export const defaultRect = (boxRatio: number): CropRect => {
  let width = 1;
  let height = 1 / boxRatio;

  if (height > 1) {
    height = 1;
    width = boxRatio;
  }

  // 1.0 exactly is a pixel count to Cloudinary, not the whole frame.
  width = Math.min(width, 0.9999);
  height = Math.min(height, 0.9999);

  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
};

export const moveRect = (
  start: CropRect,
  dx: number,
  dy: number,
): CropRect => ({
  ...start,
  x: clamp(start.x + dx, 0, 1 - start.width),
  y: clamp(start.y + dy, 0, 1 - start.height),
});

/**
 * Resize from one corner with the shape held fixed.
 *
 * The corner opposite the one being dragged stays where it is, and the box
 * grows or shrinks towards the pointer. Because the shape is locked the two
 * axes disagree about the new size, so the axis the pointer pushed further
 * wins — which is what makes a diagonal drag track the hand.
 */
/**
 * Reshapes a stored crop to the exact proportions of the frame it has to fill.
 *
 * A crop is chosen against a representative screen, but visitors arrive on all
 * sorts — a 2.11:1 window against a box drawn for 1.89:1, say. Left alone, the
 * browser makes up the difference with `object-fit: cover`, which quietly cuts
 * a further slice off the editor's choice and, because it obeys the house focal
 * point, cuts it off-centre.
 *
 * So the difference is settled here instead, in the photo rather than in the
 * frame: the box grows outwards into the surrounding picture until it is the
 * frame's shape. Nothing the editor drew is lost, and a wider screen simply
 * sees a little more of the photograph. Only where the picture runs out — a box
 * already spanning the full width, needing to be wider still — does the box
 * give up the difference, and then symmetrically about its own centre.
 *
 * The result is the frame's own shape, so `cover` has nothing left to crop.
 */
export const fitCropToFrame = (
  crop: CropRect,
  imageAspect: number,
  frameAspect: number,
): CropRect => {
  const boxRatio = boxRatioFor(frameAspect, imageAspect);
  if (!Number.isFinite(boxRatio) || boxRatio <= 0) return crop;

  let width = crop.width;
  let height = crop.height;

  if (width / height < boxRatio) {
    // Taller than the frame wants: widen, and only trim height if the photo
    // has no more width to give.
    width = Math.min(height * boxRatio, 0.9999);
    height = Math.min(width / boxRatio, 0.9999);
  } else {
    height = Math.min(width / boxRatio, 0.9999);
    width = Math.min(height * boxRatio, 0.9999);
  }

  // Grow about the editor's own centre, then slide back inside the picture.
  const centreX = crop.x + crop.width / 2;
  const centreY = crop.y + crop.height / 2;

  return {
    x: clamp(centreX - width / 2, 0, 1 - width),
    y: clamp(centreY - height / 2, 0, 1 - height),
    width,
    height,
  };
};

export const resizeRect = (
  start: CropRect,
  corner: Corner,
  dx: number,
  dy: number,
  boxRatio: number,
): CropRect => {
  const east = corner === "ne" || corner === "se";
  const south = corner === "se" || corner === "sw";

  const fixedX = east ? start.x : start.x + start.width;
  const fixedY = south ? start.y : start.y + start.height;

  const cornerX = (east ? start.x + start.width : start.x) + dx;
  const cornerY = (south ? start.y + start.height : start.y) + dy;

  // How much room the fixed corner leaves in each direction.
  const roomX = east ? 1 - fixedX : fixedX;
  const roomY = south ? 1 - fixedY : fixedY;
  const maxWidth = Math.min(roomX, roomY * boxRatio);

  let width = Math.max(
    Math.abs(cornerX - fixedX),
    Math.abs(cornerY - fixedY) * boxRatio,
  );
  width = clamp(width, Math.min(MIN_BOX_WIDTH, maxWidth), maxWidth);

  const height = width / boxRatio;

  return {
    x: east ? fixedX : fixedX - width,
    y: south ? fixedY : fixedY - height,
    width,
    height,
  };
};
