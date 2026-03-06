export type Color3Value = {
  r: number;
  g: number;
  b: number;
};

export class UDim {
  readonly Scale: number;
  readonly Offset: number;

  constructor(scale: number, offset: number) {
    this.Scale = scale;
    this.Offset = offset;
  }
}

export class Vector2 {
  readonly X: number;
  readonly Y: number;

  constructor(x: number, y: number) {
    this.X = x;
    this.Y = y;
  }
}

export type UDim2Value = {
  X: UDim;
  Y: UDim;
};

export const Color3 = {
  fromRGB(r: number, g: number, b: number): Color3Value {
    return { r, g, b };
  },
} as const;

export const UDim2 = {
  fromOffset(x: number, y: number): UDim2Value {
    return {
      X: new UDim(0, x),
      Y: new UDim(0, y),
    };
  },
  fromScale(x: number, y: number): UDim2Value {
    return {
      X: new UDim(x, 0),
      Y: new UDim(y, 0),
    };
  },
} as const;

export function typeIs(value: unknown, typeName: "string" | "number" | "boolean" | "function" | "table") {
  if (typeName === "table") {
    return typeof value === "object" && value !== null;
  }

  return typeof value === typeName;
}

export function* pairs(value: unknown) {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      yield [index, item] as const;
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const entry of Object.entries(value)) {
      yield entry;
    }
  }
}

export function error(message: string): never {
  throw new Error(message);
}

export function isPreviewElement(value: unknown, typeName: string): value is HTMLElement {
  if (typeof HTMLElement === "undefined" || !(value instanceof HTMLElement)) {
    return false;
  }

  if (typeName === "GuiObject" || typeName === "Instance") {
    return true;
  }

  const previewHost = value.dataset.previewHost;
  switch (typeName) {
    case "Frame":
      return previewHost === "frame";
    case "ScreenGui":
      return previewHost === "screengui";
    case "TextButton":
      return previewHost === "textbutton";
    case "TextLabel":
      return previewHost === "textlabel";
    case "TextBox":
      return previewHost === "textbox";
    case "ImageLabel":
      return previewHost === "imagelabel";
    case "ScrollingFrame":
      return previewHost === "scrollingframe";
    default:
      return true;
  }
}

function toChannel(channel: number) {
  return Math.max(0, Math.min(255, Math.round(channel)));
}

function clampAlpha(value: number | undefined) {
  if (value === undefined) {
    return 1;
  }

  return Math.max(0, Math.min(1, value));
}

export function toCssLength(dimension: UDim) {
  if (dimension.Scale === 0) {
    return `${dimension.Offset}px`;
  }

  if (dimension.Offset === 0) {
    return `${dimension.Scale * 100}%`;
  }

  return `calc(${dimension.Scale * 100}% + ${dimension.Offset}px)`;
}

export function toCssColor(color: Color3Value, backgroundTransparency?: number) {
  const alpha = clampAlpha(backgroundTransparency === undefined ? undefined : 1 - backgroundTransparency);
  return `rgba(${toChannel(color.r)}, ${toChannel(color.g)}, ${toChannel(color.b)}, ${alpha})`;
}
