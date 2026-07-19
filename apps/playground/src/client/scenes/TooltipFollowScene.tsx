import type { PopperPlacement } from "@lattice-ui/react-popper";
import { React } from "@lattice-ui/react-runtime";
import type { Theme } from "@lattice-ui/react-style";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { Tooltip } from "@lattice-ui/react-tooltip";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type DemoTooltipProps = {
  theme: Theme;
  position: UDim2;
  triggerText: string;
  tipTitle: string;
  tipText: string;
  placement: PopperPlacement;
  sideOffset: number;
};

function DemoTooltip(props: DemoTooltipProps) {
  const { theme } = props;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "md" }, theme), {
            Position: props.position,
            Size: UDim2.fromOffset(180, 42),
            Text: props.triggerText,
          }) as Record<string, unknown>)}
        />
      </Tooltip.Trigger>

      <Tooltip.Portal>
        <Tooltip.Content asChild placement={props.placement} sideOffset={props.sideOffset}>
          <frame
            {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
              Size: UDim2.fromOffset(230, 84),
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
              Size={UDim2.fromOffset(206, 20)}
              Text={props.tipTitle}
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 24)}
              Size={UDim2.fromOffset(206, 40)}
              Text={props.tipText}
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
  );
}

export function TooltipFollowScene() {
  const { theme } = useTheme();
  const [anchorX, setAnchorX] = React.useState(120);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(860, 28)}
        Text="Move the anchor button while its tooltip is open to verify follow updates."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(320, 22)}
        Text={`Anchor X: ${anchorX}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
          Event: {
            Activated: () => {
              const nextX = anchorX >= 600 ? 120 : anchorX + 120;
              setAnchorX(nextX);
            },
          },
          Position: UDim2.fromOffset(0, 66),
          Size: UDim2.fromOffset(180, 40),
          Text: "Move Anchor",
        }) as Record<string, unknown>)}
      />

      {/* Following: trigger moves, tooltip repositions with it */}
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 128)}
        Size={UDim2.fromOffset(400, 20)}
        Text="Following (trigger moves)"
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <DemoTooltip
        placement="top"
        position={UDim2.fromOffset(anchorX, 154)}
        sideOffset={8}
        theme={theme}
        tipText="Anchor movement should reposition this tooltip."
        tipTitle="Follows anchor"
        triggerText="Hover / Focus me"
      />

      {/* Anchored comparison: fixed trigger, tooltip stays put */}
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 300)}
        Size={UDim2.fromOffset(400, 20)}
        Text="Anchored (trigger fixed)"
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <DemoTooltip
        placement="bottom"
        position={UDim2.fromOffset(0, 326)}
        sideOffset={8}
        theme={theme}
        tipText="This trigger never moves, so its tooltip stays put."
        tipTitle="Stays put"
        triggerText="Hover / Focus me"
      />
    </frame>
  );
}
