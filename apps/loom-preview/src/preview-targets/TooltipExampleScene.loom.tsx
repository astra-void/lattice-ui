import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Tooltip } from "@lattice-ui/tooltip";
import { buttonRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function TooltipExample() {
  const { theme } = useTheme();

  return (
    <Tooltip.Provider delayDuration={300} skipDelayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
              Size: UDim2.fromOffset(120, 40),
              Text: "Hover",
            }) as Record<string, unknown>)}
          />
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content asChild placement="top" sideOffset={8}>
            <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromOffset(128, 32)}>
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <uistroke Color={theme.colors.border} Thickness={1} />
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromScale(1, 1)}
                Text="Add to library"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
              />
            </frame>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={40} width={120}>
      <TooltipExample />
    </DocExampleShell>
  ),
  title: "Tooltip Example",
} as const;
