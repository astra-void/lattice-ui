import type { MotionDomain, MotionProperties, MotionTargetContract, MotionTargetRole } from "../core/types";
import { reportMotionDiagnostic, type MotionDiagnosticStage } from "../runtime/diagnostics";

type Vector2Like = { X: number; Y: number };
type Vector3Like = { X: number; Y: number; Z: number };
type UDimLike = { Scale: number; Offset: number };
type UDim2Like = { X: UDimLike; Y: UDimLike };
type Color3Like = { R?: number; G?: number; B?: number; Lerp?: (value: unknown, alpha: number) => unknown };
type CFrameLike = { Lerp?: (value: unknown, alpha: number) => unknown };

export type MotionPropertyContext = {
  domain: MotionDomain;
  phase?: string;
  instance?: Instance;
  target?: MotionTargetContract;
};

const appearanceProperties = new Set<string>([
  "BackgroundColor3",
  "BackgroundTransparency",
  "BorderColor3",
  "GroupTransparency",
  "ImageColor3",
  "ImageTransparency",
  "PlaceholderColor3",
  "ScrollBarImageColor3",
  "ScrollBarImageTransparency",
  "TextColor3",
  "TextStrokeColor3",
  "TextStrokeTransparency",
  "TextTransparency",
]);

const transformProperties = new Set<string>(["Rotation"]);
const offsetWrapperProperties = new Set<string>(["Position"]);
const sizeWrapperProperties = new Set<string>(["Size"]);
const layoutProperties = new Set<string>(["AnchorPoint", "Position", "Size"]);

const reservedProperties = new Set<string>([
  "AbsolutePosition",
  "AbsoluteRotation",
  "AbsoluteSize",
  "AutomaticSize",
  "LayoutOrder",
  "Parent",
  "Visible",
  "ZIndex",
]);

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

function hasExplicitProperty(properties: Array<string> | undefined, key: string) {
  if (!properties) {
    return false;
  }

  for (const property of properties) {
    if (property === key) {
      return true;
    }
  }

  return false;
}

function getTargetRole(target: MotionTargetContract | undefined): MotionTargetRole {
  return target?.role ?? "appearance";
}

function isAppearanceProperty(key: string) {
  return appearanceProperties.has(key) || transformProperties.has(key);
}

function isPropertyAllowedForRole(role: MotionTargetRole, key: string) {
  if (isAppearanceProperty(key)) {
    return true;
  }

  if (role === "offset-wrapper") {
    return offsetWrapperProperties.has(key);
  }

  if (role === "size-wrapper") {
    return sizeWrapperProperties.has(key);
  }

  if (role === "layout") {
    return layoutProperties.has(key);
  }

  return false;
}

function reportPropertyFailure(
  stage: MotionDiagnosticStage,
  instance: Instance,
  key: string,
  context: MotionPropertyContext | undefined,
  detail: string,
) {
  reportMotionDiagnostic({
    domain: context?.domain ?? "presence",
    stage,
    phase: context?.phase,
    propertyKey: key,
    instance,
    target: context?.target,
    detail,
  });
}

function getMotionValueKind(value: unknown) {
  if (typeIs(value, "number")) {
    return "number";
  }

  if (isUDimLike(value)) {
    return "UDim";
  }

  if (isUDim2Like(value)) {
    return "UDim2";
  }

  if (isVector2Like(value)) {
    return "Vector2";
  }

  if (isVector3Like(value)) {
    return "Vector3";
  }

  if (hasLerp(value)) {
    return "lerpable";
  }

  return "unsupported";
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

export function validateMotionProperty(instance: Instance, key: string, context?: MotionPropertyContext) {
  const target = context?.target;

  if (reservedProperties.has(key)) {
    reportPropertyFailure("capability", instance, key, context, "property is reserved for Roblox/layout ownership");
    return false;
  }

  if (hasExplicitProperty(target?.denyProperties, key)) {
    reportPropertyFailure("capability", instance, key, context, "property is explicitly denied by the target contract");
    return false;
  }

  if (hasExplicitProperty(target?.allowProperties, key)) {
    return true;
  }

  const role = getTargetRole(target);
  if (role === "custom") {
    reportPropertyFailure("capability", instance, key, context, "custom targets must list this property in allowProperties");
    return false;
  }

  if (!isPropertyAllowedForRole(role, key)) {
    reportPropertyFailure(
      "capability",
      instance,
      key,
      context,
      `property is not owned by ${role} targets; use an offset/size wrapper or a layout target when motion owns geometry`,
    );
    return false;
  }

  return true;
}

export function readMotionProperty(instance: Instance, key: string, context?: MotionPropertyContext) {
  if (!validateMotionProperty(instance, key, context)) {
    return undefined;
  }

  try {
    const value = (instance as unknown as Record<string, unknown>)[key];
    if (value === undefined) {
      reportPropertyFailure("read", instance, key, context, "property read returned undefined");
    }
    return value;
  } catch (err) {
    reportPropertyFailure("read", instance, key, context, tostring(err));
    return undefined;
  }
}

export function writeMotionProperty(instance: Instance, key: string, value: unknown, context?: MotionPropertyContext) {
  if (!validateMotionProperty(instance, key, context)) {
    return false;
  }

  try {
    (instance as unknown as Record<string, unknown>)[key] = value;
    return true;
  } catch (err) {
    reportPropertyFailure("write", instance, key, context, tostring(err));
    return false;
  }
}

export function applyMotionProperties(instance: Instance, values?: MotionProperties, context?: MotionPropertyContext) {
  if (!values) {
    return;
  }

  for (const [key, value] of pairs(values)) {
    writeMotionProperty(instance, key, value, context);
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

export function canInterpolateMotionValue(from: unknown, to: unknown) {
  if (from === to) {
    return true;
  }

  if (typeIs(from, "number") && typeIs(to, "number")) {
    return true;
  }

  if (isUDimLike(from) && isUDimLike(to)) {
    return true;
  }

  if (isUDim2Like(from) && isUDim2Like(to)) {
    return true;
  }

  if (isVector2Like(from) && isVector2Like(to)) {
    return true;
  }

  if (isVector3Like(from) && isVector3Like(to)) {
    return true;
  }

  return hasLerp(from);
}

export function interpolateMotionValue(
  from: unknown,
  to: unknown,
  alpha: number,
  context?: MotionPropertyContext & { propertyKey?: string },
): unknown {
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
      try {
        return lerp(to, alpha);
      } catch (err) {
        if (context?.instance && context.propertyKey) {
          reportPropertyFailure("interpolation", context.instance, context.propertyKey, context, tostring(err));
        }
        return alpha >= 1 ? to : from;
      }
    }
  }

  if (context?.instance && context.propertyKey) {
    reportPropertyFailure(
      "interpolation",
      context.instance,
      context.propertyKey,
      context,
      `unsupported value types (${getMotionValueKind(from)} -> ${getMotionValueKind(to)})`,
    );
  }

  return alpha >= 1 ? to : from;
}

export function isMotionValueSettled(current: unknown, target: unknown, precision = 0.0005) {
  return areMotionValuesEqual(current, target, precision);
}
