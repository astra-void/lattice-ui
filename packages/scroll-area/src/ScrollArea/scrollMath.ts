export function resolveThumbSize(viewportSize: number, contentSize: number, trackSize: number, minimumThumbSize = 18) {
  if (viewportSize <= 0 || contentSize <= 0 || trackSize <= 0) {
    return minimumThumbSize;
  }

  if (contentSize <= viewportSize) {
    return trackSize;
  }

  const proportionalSize = (viewportSize / contentSize) * trackSize;
  return math.clamp(proportionalSize, minimumThumbSize, trackSize);
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
