import type * as React from "react";

type UDimLike = {
  Scale?: number;
  Offset?: number;
};

type UDim2Like = {
  X?: UDimLike;
  Y?: UDimLike;
};

type Color3Like = {
  R?: number;
  G?: number;
  B?: number;
};

type RobloxStyleProps = Record<string, unknown> & {
  Size?: UDim2Like;
  BackgroundColor3?: Color3Like;
  BackgroundTransparency?: number;
  Visible?: boolean;
};

function toCalcLength(axis: UDimLike | undefined) {
  if (!axis) {
    return undefined;
  }

  const scale = Number(axis.Scale ?? 0);
  const offset = Number(axis.Offset ?? 0);
  return `calc(${scale * 100}% + ${offset}px)`;
}

function toRgb(color: Color3Like | undefined) {
  if (!color) {
    return undefined;
  }

  const red = Math.round(Number(color.R ?? 0) * 255);
  const green = Math.round(Number(color.G ?? 0) * 255);
  const blue = Math.round(Number(color.B ?? 0) * 255);
  return `rgb(${red}, ${green}, ${blue})`;
}

export function __rbxStyle(props: RobloxStyleProps): React.CSSProperties {
  const style: React.CSSProperties = {};

  const width = toCalcLength(props.Size?.X);
  const height = toCalcLength(props.Size?.Y);

  if (width) {
    style.width = width;
  }
  if (height) {
    style.height = height;
  }

  const backgroundColor = toRgb(props.BackgroundColor3);
  if (backgroundColor) {
    style.backgroundColor = backgroundColor;
  }

  if (typeof props.BackgroundTransparency === "number") {
    style.opacity = 1 - props.BackgroundTransparency;
  }

  if (props.Visible === false) {
    style.display = "none";
  }

  // Unknown Roblox props are ignored for now.
  return style;
}
