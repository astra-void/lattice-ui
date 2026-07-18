import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Tooltip } from "@lattice-ui/tooltip";
import { buttonRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function ToolbarTooltip(props: { label: string; layoutOrder: number; shortcut: string }) {
  const { theme } = useTheme();

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
            LayoutOrder: props.layoutOrder,
            Size: UDim2.fromOffset(76, 36),
            Text: props.label,
            TextSize: theme.typography.labelSm.textSize,
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
          <uistroke Color={theme.colors.border} Thickness={1} />
        </textbutton>
      </Tooltip.Trigger>

      <Tooltip.Portal>
        <Tooltip.Content asChild placement="top" sideOffset={8}>
          <frame BackgroundColor3={theme.colors.overlay} BorderSizePixel={0} Size={UDim2.fromOffset(76, 30)}>
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <Text
              BackgroundTransparency={1}
              Size={UDim2.fromScale(1, 1)}
              Text={props.shortcut}
              TextColor3={theme.colors.accentContrast}
              TextSize={theme.typography.labelSm.textSize}
            />
          </frame>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function TooltipExample() {
  const { theme } = useTheme();

  return (
    <Tooltip.Provider delayDuration={300} skipDelayDuration={150}>
      <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
        <uilistlayout
          FillDirection={Enum.FillDirection.Horizontal}
          Padding={new UDim(0, theme.space[8])}
          VerticalAlignment={Enum.VerticalAlignment.Center}
        />
        <ToolbarTooltip label="Cut" layoutOrder={0} shortcut="Ctrl+X" />
        <ToolbarTooltip label="Copy" layoutOrder={1} shortcut="Ctrl+C" />
        <ToolbarTooltip label="Paste" layoutOrder={2} shortcut="Ctrl+V" />
      </frame>
    </Tooltip.Provider>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={36} width={244}>
      <TooltipExample />
    </DocExampleShell>
  ),
  title: "Tooltip Example",
} as const;
