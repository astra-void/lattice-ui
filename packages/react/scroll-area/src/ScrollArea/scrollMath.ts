export function resolveThumbSize(viewportSize: number, contentSize: number, trackSize: number, minimumThumbSize = 18) {
  if (viewportSize <= 0 || contentSize <= 0 || trackSize <= 0) {
    return minimumThumbSize;
  }

  if (contentSize <= viewportSize) {
    return trackSize;
  }

  const proportionalSize = (viewportSize / contentSize) * trackSize;
  // A track shorter than the minimum caps the thumb at the track; Luau's math.clamp errors when min > max.
  return math.clamp(proportionalSize, math.min(minimumThumbSize, trackSize), trackSize);
}

export function resolveThumbOffset(
  scrollPosition: number,
  viewportSize: number,
  contentSize: number,
  trackSize: number,
  thumbSize: number,
) {
  if (contentSize <= viewportSize || trackSize <= thumbSize) {
    return 0;
  }

  const maxScroll = math.max(1, contentSize - viewportSize);
  const maxThumbOffset = trackSize - thumbSize;
  return math.clamp((scrollPosition / maxScroll) * maxThumbOffset, 0, maxThumbOffset);
}

export function resolveCanvasPositionFromThumbOffset(
  thumbOffset: number,
  viewportSize: number,
  contentSize: number,
  trackSize: number,
  thumbSize: number,
) {
  if (contentSize <= viewportSize || trackSize <= thumbSize) {
    return 0;
  }

  const maxScroll = math.max(1, contentSize - viewportSize);
  const maxThumbOffset = trackSize - thumbSize;
  const ratio = math.clamp(thumbOffset / maxThumbOffset, 0, 1);
  return ratio * maxScroll;
}

export function resolveThumbOffsetFromTrackPosition(trackPosition: number, trackSize: number, thumbSize: number) {
  const maxThumbOffset = math.max(0, trackSize - thumbSize);
  return math.clamp(trackPosition - thumbSize / 2, 0, maxThumbOffset);
}

export function resolveThumbOffsetFromPointerDelta(
  initialThumbOffset: number,
  pointerDelta: number,
  trackSize: number,
  thumbSize: number,
) {
  const maxThumbOffset = math.max(0, trackSize - thumbSize);
  return math.clamp(initialThumbOffset + pointerDelta, 0, maxThumbOffset);
}

export function resolveCanvasPositionFromTrackPosition(
  trackPosition: number,
  viewportSize: number,
  contentSize: number,
  trackSize: number,
  thumbSize: number,
) {
  const thumbOffset = resolveThumbOffsetFromTrackPosition(trackPosition, trackSize, thumbSize);
  return resolveCanvasPositionFromThumbOffset(thumbOffset, viewportSize, contentSize, trackSize, thumbSize);
}

/**
 * Whether a scrollbar axis is shown: "always" regardless of overflow, "scroll" only while the axis
 * overflows and the user is scrolling, "auto" whenever the axis overflows.
 */
export function resolveScrollbarVisible(
  scrollType: "auto" | "always" | "scroll",
  hasOverflow: boolean,
  scrolling: boolean,
) {
  if (scrollType === "always") {
    return true;
  }

  if (scrollType === "scroll") {
    return hasOverflow && scrolling;
  }

  return hasOverflow;
}
