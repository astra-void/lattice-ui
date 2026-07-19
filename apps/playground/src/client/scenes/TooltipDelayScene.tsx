import { React } from "@lattice-ui/core";
import type { PopperPlacement } from "@lattice-ui/popper";
import type { Theme } from "@lattice-ui/style";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Tooltip } from "@lattice-ui/tooltip";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type SimpleTooltipProps = {
  theme: Theme;
  position: UDim2;
  triggerText: string;
  tipText: string;
  placement: PopperPlacement;
  sideOffset?: number;
  delayDuration?: number;
  onOpenChange?: (open: boolean) => void;
};

function SimpleTooltip(props: SimpleTooltipProps) {
  const { theme } = props;

  return (
    <Tooltip.Root delayDuration={props.delayDuration} onOpenChange={props.onOpenChange}>
      <Tooltip.Trigger asChild>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
            Position: props.position,
            Size: UDim2.fromOffset(180, 40),
            Text: props.triggerText,
          }) as Record<string, unknown>)}
        />
      </Tooltip.Trigger>

      <Tooltip.Portal>
        <Tooltip.Content asChild placement={props.placement} sideOffset={props.sideOffset ?? 8}>
          <frame
            {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
              Size: UDim2.fromOffset(210, 46),
            }) as Record<string, unknown>)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.5} />
            <uipadding
              PaddingBottom={new UDim(0, theme.space[8])}
              PaddingLeft={new UDim(0, theme.space[10])}
              PaddingRight={new UDim(0, theme.space[10])}
              PaddingTop={new UDim(0, theme.space[8])}
            />
            <Text
              BackgroundTransparency={1}
              Size={UDim2.fromScale(1, 1)}
              Text={props.tipText}
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextWrapped={true}
              TextXAlignment={Enum.TextXAlignment.Left}
              TextYAlignment={Enum.TextYAlignment.Top}
            />
          </frame>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function TooltipDelayScene() {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <Tooltip.Provider delayDuration={700} skipDelayDuration={300}>
      <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 0)}
          Size={UDim2.fromOffset(860, 28)}
          Text="Hover/focus trigger: first open 700ms, re-entry within window 300ms."
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.titleMd.textSize - 2}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 34)}
          Size={UDim2.fromOffset(320, 22)}
          Text={`Open (default): ${open ? "true" : "false"}`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        {/* Delay configs */}
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 70)}
          Size={UDim2.fromOffset(400, 20)}
          Text="Delay configs (open delay)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <SimpleTooltip
          delayDuration={0}
          placement="bottom"
          position={UDim2.fromOffset(0, 96)}
          theme={theme}
          tipText="Opens instantly (0ms)."
          triggerText="Instant (0ms)"
        />
        <SimpleTooltip
          onOpenChange={setOpen}
          placement="bottom"
          position={UDim2.fromOffset(196, 96)}
          theme={theme}
          tipText="Uses provider delay (700ms)."
          triggerText="Default (700ms)"
        />
        <SimpleTooltip
          delayDuration={1200}
          placement="bottom"
          position={UDim2.fromOffset(392, 96)}
          theme={theme}
          tipText="Waits 1200ms before opening."
          triggerText="Slow (1200ms)"
        />

        {/* Placements */}
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 168)}
          Size={UDim2.fromOffset(400, 20)}
          Text="Placements"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <SimpleTooltip
          placement="top"
          position={UDim2.fromOffset(0, 260)}
          theme={theme}
          tipText="Placed above the trigger."
          triggerText="Top"
        />
        <SimpleTooltip
          placement="bottom"
          position={UDim2.fromOffset(196, 260)}
          theme={theme}
          tipText="Placed below the trigger."
          triggerText="Bottom"
        />
        <SimpleTooltip
          placement="left"
          position={UDim2.fromOffset(392, 260)}
          theme={theme}
          tipText="Placed left of the trigger."
          triggerText="Left"
        />
        <SimpleTooltip
          placement="right"
          position={UDim2.fromOffset(588, 260)}
          theme={theme}
          tipText="Placed right of the trigger."
          triggerText="Right"
        />

        {/* Rich content */}
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 332)}
          Size={UDim2.fromOffset(400, 20)}
          Text="Rich content (title + description)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <textbutton
              {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
                Position: UDim2.fromOffset(0, 358),
                Size: UDim2.fromOffset(220, 42),
                Text: "Keyboard shortcut",
              }) as Record<string, unknown>)}
            />
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content asChild placement="bottom" sideOffset={8}>
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                  Size: UDim2.fromOffset(260, 92),
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.5} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[10])}
                  PaddingLeft={new UDim(0, theme.space[12])}
                  PaddingRight={new UDim(0, theme.space[12])}
                  PaddingTop={new UDim(0, theme.space[10])}
                />
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 0)}
                  Size={UDim2.fromOffset(236, 20)}
                  Text="Save changes"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 24)}
                  Size={UDim2.fromOffset(236, 44)}
                  Text="Press Ctrl+S to persist the current draft to the server."
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextWrapped={true}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  TextYAlignment={Enum.TextYAlignment.Top}
                />
              </frame>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </frame>
    </Tooltip.Provider>
  );
}
