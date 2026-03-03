import type { Theme } from "../theme/types";
import { mergeGuiProps } from "./mergeGuiProps";

type GuiPropRecord = Record<string, unknown>;

export type Sx<Props extends GuiPropRecord> = Partial<Props> | ((theme: Theme) => Partial<Props>) | undefined;

function isSxResolver<Props extends GuiPropRecord>(sx: Sx<Props>): sx is (theme: Theme) => Partial<Props> {
  return typeIs(sx, "function");
}

export function resolveSx<Props extends GuiPropRecord>(sx: Sx<Props>, theme: Theme): Partial<Props> {
  if (!sx) {
    return {};
  }

  if (isSxResolver(sx)) {
    return sx(theme);
  }

  return sx;
}

export function mergeSx<Props extends GuiPropRecord>(...sxList: Array<Sx<Props>>): Sx<Props> {
  return (theme) => {
    let merged: Partial<Props> = {};

    for (const sx of sxList) {
      const resolved = resolveSx(sx, theme);
      merged = mergeGuiProps(merged, resolved);
    }

    return merged;
  };
}
