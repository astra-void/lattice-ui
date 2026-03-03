import type { Theme } from "@lattice-ui/style";
import type { SpaceValue, StackPadding } from "./types";

type ResolvedPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function spaceTokenValue(theme: Theme, value: number) {
  switch (value) {
    case 0:
      return theme.space[0];
    case 2:
      return theme.space[2];
    case 4:
      return theme.space[4];
    case 6:
      return theme.space[6];
    case 8:
      return theme.space[8];
    case 10:
      return theme.space[10];
    case 12:
      return theme.space[12];
    case 14:
      return theme.space[14];
    case 16:
      return theme.space[16];
    case 20:
      return theme.space[20];
    case 24:
      return theme.space[24];
    case 32:
      return theme.space[32];
    default:
      return undefined;
  }
}

function clampSpace(value: number) {
  return math.max(0, value);
}

export function resolveSpace(theme: Theme, value?: SpaceValue) {
  if (value === undefined) {
    return 0;
  }

  const tokenValue = spaceTokenValue(theme, value);
  if (tokenValue !== undefined) {
    return clampSpace(tokenValue);
  }

  return clampSpace(value);
}

export function resolvePadding(theme: Theme, value: StackPadding): ResolvedPadding {
  const base = resolveSpace(theme, value.padding);

  let top = base;
  let right = base;
  let bottom = base;
  let left = base;

  if (value.paddingX !== undefined) {
    const axis = resolveSpace(theme, value.paddingX);
    left = axis;
    right = axis;
  }

  if (value.paddingY !== undefined) {
    const axis = resolveSpace(theme, value.paddingY);
    top = axis;
    bottom = axis;
  }

  if (value.paddingTop !== undefined) {
    top = resolveSpace(theme, value.paddingTop);
  }

  if (value.paddingRight !== undefined) {
    right = resolveSpace(theme, value.paddingRight);
  }

  if (value.paddingBottom !== undefined) {
    bottom = resolveSpace(theme, value.paddingBottom);
  }

  if (value.paddingLeft !== undefined) {
    left = resolveSpace(theme, value.paddingLeft);
  }

  return {
    top,
    right,
    bottom,
    left,
  };
}
