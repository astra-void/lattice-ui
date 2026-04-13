import type { MotionDomain, MotionProperties, MotionTargetContract, MotionTargetRole } from "../core/types";
import { type MotionDiagnosticStage, reportMotionDiagnostic } from "../runtime/diagnostics";

type MotionValueKind = "number" | "UDim" | "UDim2" | "Vector2" | "Vector3" | "Color3" | "CFrame" | "unknown";

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

function absNumber(value: number) {
  return value < 0 ? -value : value;
}

function lerpNumber(from: number, to: number, alpha: number) {
  return from + (to - from) * alpha;
}

function lerpUDim(from: UDim, to: UDim, alpha: number) {
  return new UDim(lerpNumber(from.Scale, to.Scale, alpha), lerpNumber(from.Offset, to.Offset, alpha));
}

function lerpUDim2(from: UDim2, to: UDim2, alpha: number) {
  return new UDim2(
    lerpNumber(from.X.Scale, to.X.Scale, alpha),
    lerpNumber(from.X.Offset, to.X.Offset, alpha),
    lerpNumber(from.Y.Scale, to.Y.Scale, alpha),
    lerpNumber(from.Y.Offset, to.Y.Offset, alpha),
  );
}

function lerpVector2(from: Vector2, to: Vector2, alpha: number) {
  return new Vector2(lerpNumber(from.X, to.X, alpha), lerpNumber(from.Y, to.Y, alpha));
}

function lerpVector3(from: Vector3, to: Vector3, alpha: number) {
  return new Vector3(lerpNumber(from.X, to.X, alpha), lerpNumber(from.Y, to.Y, alpha), lerpNumber(from.Z, to.Z, alpha));
}

function lerpColor3(from: Color3, to: Color3, alpha: number) {
  return new Color3(lerpNumber(from.R, to.R, alpha), lerpNumber(from.G, to.G, alpha), lerpNumber(from.B, to.B, alpha));
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

function resolveMotionValueKind(value: unknown): MotionValueKind {
  switch (typeOf(value)) {
    case "number":
      return "number";
    case "UDim":
      return "UDim";
    case "UDim2":
      return "UDim2";
    case "Vector2":
      return "Vector2";
    case "Vector3":
      return "Vector3";
    case "Color3":
      return "Color3";
    case "CFrame":
      return "CFrame";
    default:
      return "unknown";
  }
}

function resolveCompatibleMotionValueKind(from: unknown, to: unknown): MotionValueKind | undefined {
  const fromKind = resolveMotionValueKind(from);
  const toKind = resolveMotionValueKind(to);

  if (fromKind === "unknown" || fromKind !== toKind) {
    return undefined;
  }

  return fromKind;
}

function getMotionValueKind(value: unknown) {
  return resolveMotionValueKind(value);
}

function measureDistance(a: unknown, b: unknown): number | undefined {
  switch (resolveCompatibleMotionValueKind(a, b)) {
    case "number": {
      const from = a as number;
      const to = b as number;
      return absNumber(from - to);
    }
    case "UDim": {
      const from = a as UDim;
      const to = b as UDim;
      return math.max(absNumber(from.Scale - to.Scale), absNumber(from.Offset - to.Offset));
    }
    case "UDim2": {
      const from = a as UDim2;
      const to = b as UDim2;
      return math.max(
        absNumber(from.X.Scale - to.X.Scale),
        absNumber(from.X.Offset - to.X.Offset),
        absNumber(from.Y.Scale - to.Y.Scale),
        absNumber(from.Y.Offset - to.Y.Offset),
      );
    }
    case "Vector2": {
      const from = a as Vector2;
      const to = b as Vector2;
      return math.max(absNumber(from.X - to.X), absNumber(from.Y - to.Y));
    }
    case "Vector3": {
      const from = a as Vector3;
      const to = b as Vector3;
      return math.max(absNumber(from.X - to.X), absNumber(from.Y - to.Y), absNumber(from.Z - to.Z));
    }
    case "Color3": {
      const from = a as Color3;
      const to = b as Color3;
      return math.max(absNumber(from.R - to.R), absNumber(from.G - to.G), absNumber(from.B - to.B));
    }
    default:
      return undefined;
  }
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
    reportPropertyFailure(
      "capability",
      instance,
      key,
      context,
      "custom targets must list this property in allowProperties",
    );
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

  const kind = resolveCompatibleMotionValueKind(a, b);
  if (kind === "CFrame") {
    return (a as CFrame).FuzzyEq(b as CFrame, precision);
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

  return resolveCompatibleMotionValueKind(from, to) !== undefined;
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

  const kind = resolveCompatibleMotionValueKind(from, to);
  switch (kind) {
    case "number":
      return lerpNumber(from as number, to as number, alpha);
    case "UDim":
      return lerpUDim(from as UDim, to as UDim, alpha);
    case "UDim2":
      return lerpUDim2(from as UDim2, to as UDim2, alpha);
    case "Vector2":
      return lerpVector2(from as Vector2, to as Vector2, alpha);
    case "Vector3":
      return lerpVector3(from as Vector3, to as Vector3, alpha);
    case "Color3":
      return lerpColor3(from as Color3, to as Color3, alpha);
    case "CFrame":
      return (from as CFrame).Lerp(to as CFrame, alpha);
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
