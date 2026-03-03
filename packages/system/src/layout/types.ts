import type { Sx, Theme } from "@lattice-ui/style";
import type React from "@rbxts/react";

export type LayoutDirection = "vertical" | "horizontal";
export type StackAlign = "start" | "center" | "end";
export type StackJustify = "start" | "center" | "end";
export type StackAutoSize = boolean | "x" | "y" | "xy";
export type SpaceToken = keyof Theme["space"];
export type SpaceValue = SpaceToken | number;

export type StackPadding = {
  padding?: SpaceValue;
  paddingX?: SpaceValue;
  paddingY?: SpaceValue;
  paddingTop?: SpaceValue;
  paddingRight?: SpaceValue;
  paddingBottom?: SpaceValue;
  paddingLeft?: SpaceValue;
};

type StyleProps = React.Attributes & Record<string, unknown>;

export type StackProps = {
  direction?: LayoutDirection;
  gap?: SpaceValue;
  align?: StackAlign;
  justify?: StackJustify;
  autoSize?: StackAutoSize;
  sx?: Sx<StyleProps>;
  children?: React.ReactNode;
} & StackPadding &
  StyleProps;

export type RowProps = Omit<StackProps, "direction">;
