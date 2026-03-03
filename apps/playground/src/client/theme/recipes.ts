import type { Sx } from "@lattice-ui/style";
import { createRecipe, mergeSx } from "@lattice-ui/style";
import { surface } from "@lattice-ui/system";
import type React from "@rbxts/react";

type StyleProps = React.Attributes & Record<string, unknown>;

type SceneTabVariants = {
  selected: {
    true: Sx<StyleProps>;
    false: Sx<StyleProps>;
  };
};

export const sceneTabRecipe = createRecipe<StyleProps, SceneTabVariants>({
  base: (theme) => ({
    AutoButtonColor: false,
    BorderSizePixel: 0,
    TextSize: theme.typography.bodyMd.textSize,
    TextColor3: theme.colors.textPrimary,
  }),
  variants: {
    selected: {
      true: (theme) => ({
        BackgroundColor3: theme.colors.accent,
        TextColor3: theme.colors.accentContrast,
      }),
      false: mergeSx(surface<StyleProps>("surface"), (theme) => ({
        TextColor3: theme.colors.textPrimary,
      })),
    },
  },
  defaultVariants: {
    selected: "false",
  },
});

type ButtonVariants = {
  intent: {
    primary: Sx<StyleProps>;
    surface: Sx<StyleProps>;
    danger: Sx<StyleProps>;
  };
  size: {
    sm: Sx<StyleProps>;
    md: Sx<StyleProps>;
  };
};

export const buttonRecipe = createRecipe<StyleProps, ButtonVariants>({
  base: (theme) => ({
    AutoButtonColor: false,
    BorderSizePixel: 0,
    TextSize: theme.typography.bodyMd.textSize,
    TextColor3: theme.colors.textPrimary,
  }),
  variants: {
    intent: {
      primary: (theme) => ({
        BackgroundColor3: theme.colors.accent,
        TextColor3: theme.colors.accentContrast,
      }),
      surface: mergeSx(surface<StyleProps>("surface"), (theme) => ({
        TextColor3: theme.colors.textPrimary,
      })),
      danger: (theme) => ({
        BackgroundColor3: theme.colors.danger,
        TextColor3: theme.colors.dangerContrast,
      }),
    },
    size: {
      sm: () => ({
        Size: UDim2.fromOffset(120, 34),
      }),
      md: () => ({
        Size: UDim2.fromOffset(170, 42),
      }),
    },
  },
  defaultVariants: {
    intent: "surface",
    size: "md",
  },
});

type PanelVariants = {
  tone: {
    surface: Sx<StyleProps>;
    elevated: Sx<StyleProps>;
  };
};

export const panelRecipe = createRecipe<StyleProps, PanelVariants>({
  base: () => ({
    BorderSizePixel: 0,
  }),
  variants: {
    tone: {
      surface: surface<StyleProps>("surface"),
      elevated: surface<StyleProps>("elevated"),
    },
  },
  defaultVariants: {
    tone: "surface",
  },
});

type MenuItemVariants = {
  intent: {
    default: Sx<StyleProps>;
    danger: Sx<StyleProps>;
  };
  disabled: {
    true: Sx<StyleProps>;
    false: Sx<StyleProps>;
  };
};

export const menuItemRecipe = createRecipe<StyleProps, MenuItemVariants>({
  base: (theme) => ({
    AutoButtonColor: false,
    BorderSizePixel: 0,
    TextSize: theme.typography.labelSm.textSize,
    TextXAlignment: Enum.TextXAlignment.Left,
  }),
  variants: {
    intent: {
      default: mergeSx(surface<StyleProps>("elevated"), (theme) => ({
        TextColor3: theme.colors.textPrimary,
      })),
      danger: (theme) => ({
        BackgroundColor3: theme.colors.danger,
        TextColor3: theme.colors.dangerContrast,
      }),
    },
    disabled: {
      true: mergeSx(surface<StyleProps>("surface"), (theme) => ({
        Active: false,
        Selectable: false,
        TextColor3: theme.colors.textSecondary,
      })),
      false: () => ({
        Active: true,
        Selectable: true,
      }),
    },
  },
  defaultVariants: {
    intent: "default",
    disabled: "false",
  },
  compoundVariants: [
    {
      variants: {
        intent: "danger",
        disabled: "true",
      },
      sx: mergeSx(surface<StyleProps>("surface"), (theme) => ({
        TextColor3: theme.colors.textSecondary,
      })),
    },
  ],
});
