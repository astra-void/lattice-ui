import type { Sx } from "@lattice-ui/style";

type GuiPropRecord = Record<string, unknown>;

export type SurfaceToken = "surface" | "elevated" | "sunken" | "overlay";

function asSxProps<Props extends GuiPropRecord>(value: GuiPropRecord): Partial<Props> {
  return value as unknown as Partial<Props>;
}

/**
 * M1 limitation: this helper only returns props for existing instances.
 * It does not create child instances like UICorner/UIStroke/shadow nodes.
 */
export function surface<Props extends GuiPropRecord>(token: SurfaceToken): Sx<Props> {
  return (theme) => {
    switch (token) {
      case "surface":
        return asSxProps<Props>({
          BackgroundColor3: theme.colors.surface,
          BorderColor3: theme.colors.border,
          BorderSizePixel: 1,
        });
      case "elevated":
        return asSxProps<Props>({
          BackgroundColor3: theme.colors.surfaceElevated,
          BorderColor3: theme.colors.border,
          BorderSizePixel: 1,
        });
      case "sunken":
        return asSxProps<Props>({
          BackgroundColor3: theme.colors.background,
          BorderColor3: theme.colors.border,
          BorderSizePixel: 1,
        });
      case "overlay":
        return asSxProps<Props>({
          BackgroundColor3: theme.colors.overlay,
          BackgroundTransparency: 0.35,
          BorderSizePixel: 0,
        });
    }
  };
}
