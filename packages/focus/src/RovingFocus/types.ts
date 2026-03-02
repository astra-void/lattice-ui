import type React from "@rbxts/react";

export type RovingDirection = "next" | "prev";

export type RovingFocusGroupProps = {
  loop?: boolean;
  orientation?: "horizontal" | "vertical" | "both";
  children?: React.ReactNode;
};
