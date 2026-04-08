import type { MotionProperties } from "../core/types";

type Vector2Like = { X: number; Y: number };
type Vector3Like = { X: number; Y: number; Z: number };
type UDimLike = { Scale: number; Offset: number };
type UDim2Like = { X: UDimLike; Y: UDimLike };
type Color3Like = { R?: number; G?: number; B?: number; Lerp?: (value: unknown, alpha: number) => unknown };
type CFrameLike = { Lerp?: (value: unknown, alpha: number) => unknown };

function asRecord(value: unknown) {
  return value as Record<string, unknown>;
}

function absNumber(value: number) {
  return value < 0 ? -value : value;
}

function isVector2Like(value: unknown): value is Vector2Like {
  if (!typeIs(value, "table")) {
    return false;
  }

  const candidate = asRecord(value);
  return typeIs(candidate.X, "number") && typeIs(candidate.Y, "number") && candidate.Z === undefined;
}

function isVector3Like(value: unknown): value is Vector3Like {
  if (!typeIs(value, "table")) {
    return false;
  }

  const candidate = asRecord(value);
  return typeIs(candidate.X, "number") && typeIs(candidate.Y, "number") && typeIs(candidate.Z, "number");
}

function isUDimLike(value: unknown): value is UDimLike {
  if (!typeIs(value, "table")) {
    return false;
  }

  const candidate = asRecord(value);
  return typeIs(candidate.Scale, "number") && typeIs(candidate.Offset, "number");
}

function isUDim2Like(value: unknown): value is UDim2Like {
  if (!typeIs(value, "table")) {
    return false;
  }

  const candidate = asRecord(value);
  return isUDimLike(candidate.X) && isUDimLike(candidate.Y);
}

function hasLerp(value: unknown): value is Color3Like & CFrameLike {
  if (!typeIs(value, "table")) {
    return false;
  }

  return typeIs(asRecord(value).Lerp, "function");
}

function lerpNumber(from: number, to: number, alpha: number) {
  return from + (to - from) * alpha;
}

function lerpUDim(from: UDimLike, to: UDimLike, alpha: number) {
  return new UDim(lerpNumber(from.Scale, to.Scale, alpha), lerpNumber(from.Offset, to.Offset, alpha));
}

function lerpUDim2(from: UDim2Like, to: UDim2Like, alpha: number) {
  return new UDim2(
    lerpNumber(from.X.Scale, to.X.Scale, alpha),
    lerpNumber(from.X.Offset, to.X.Offset, alpha),
    lerpNumber(from.Y.Scale, to.Y.Scale, alpha),
    lerpNumber(from.Y.Offset, to.Y.Offset, alpha),
  );
}

function lerpVector2(from: Vector2Like, to: Vector2Like, alpha: number) {
  return new Vector2(lerpNumber(from.X, to.X, alpha), lerpNumber(from.Y, to.Y, alpha));
}

function lerpVector3(from: Vector3Like, to: Vector3Like, alpha: number) {
  return new Vector3(lerpNumber(from.X, to.X, alpha), lerpNumber(from.Y, to.Y, alpha), lerpNumber(from.Z, to.Z, alpha));
}

function measureDistance(a: unknown, b: unknown): number | undefined {
  if (typeIs(a, "number") && typeIs(b, "number")) {
    return absNumber(a - b);
  }

  if (isUDimLike(a) && isUDimLike(b)) {
    return math.max(absNumber(a.Scale - b.Scale), absNumber(a.Offset - b.Offset));
  }

  if (isUDim2Like(a) && isUDim2Like(b)) {
    return math.max(
      absNumber(a.X.Scale - b.X.Scale),
      absNumber(a.X.Offset - b.X.Offset),
      absNumber(a.Y.Scale - b.Y.Scale),
      absNumber(a.Y.Offset - b.Y.Offset),
    );
  }

  if (isVector2Like(a) && isVector2Like(b)) {
    return math.max(absNumber(a.X - b.X), absNumber(a.Y - b.Y));
  }

  if (isVector3Like(a) && isVector3Like(b)) {
    return math.max(absNumber(a.X - b.X), absNumber(a.Y - b.Y), absNumber(a.Z - b.Z));
  }

  return undefined;
}

export function readMotionProperty(instance: Instance, key: string) {
  return (instance as unknown as Record<string, unknown>)[key];
}

export function writeMotionProperty(instance: Instance, key: string, value: unknown) {
  try {
    (instance as unknown as Record<string, unknown>)[key] = value;
    return true;
  } catch {
    return false;
  }
}

export function applyMotionProperties(instance: Instance, values?: MotionProperties) {
  if (!values) {
    return;
  }

  for (const [key, value] of pairs(values)) {
    writeMotionProperty(instance, key, value);
  }
}

export function areMotionValuesEqual(a: unknown, b: unknown, precision = 0.0005) {
  if (a === b) {
    return true;
  }

  const distance = measureDistance(a, b);
  if (distance !== undefined) {
    return distance <= precision;
  }

  return false;
}

export function interpolateMotionValue(from: unknown, to: unknown, alpha: number): unknown {
  if (alpha <= 0) {
    return from;
  }

  if (alpha >= 1) {
    return to;
  }

  if (typeIs(from, "number") && typeIs(to, "number")) {
    return lerpNumber(from, to, alpha);
  }

  if (isUDimLike(from) && isUDimLike(to)) {
    return lerpUDim(from, to, alpha);
  }

  if (isUDim2Like(from) && isUDim2Like(to)) {
    return lerpUDim2(from, to, alpha);
  }

  if (isVector2Like(from) && isVector2Like(to)) {
    return lerpVector2(from, to, alpha);
  }

  if (isVector3Like(from) && isVector3Like(to)) {
    return lerpVector3(from, to, alpha);
  }

  if (hasLerp(from)) {
    const lerp = from.Lerp;
    if (lerp) {
      return lerp(to, alpha);
    }
  }

  return alpha >= 1 ? to : from;
}

export function isMotionValueSettled(current: unknown, target: unknown, precision = 0.0005) {
  return areMotionValuesEqual(current, target, precision);
}
