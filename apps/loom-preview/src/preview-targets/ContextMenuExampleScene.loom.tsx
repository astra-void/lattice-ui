import { ContextMenu } from "@lattice-ui/react-context-menu";
import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

const actions = ["Rename", "Duplicate", "Move to…"];

function ContextMenuExample() {
  const { theme } = useTheme();

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <textbutton
          {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
            AutoButtonColor: false,
            Size: UDim2.fromOffset(320, 180),
            Text: "",
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uistroke Color={theme.colors.border} Thickness={1} />

          <Text
            AnchorPoint={new Vector2(0.5, 0.5)}
            BackgroundTransparency={1}
            Font={Enum.Font.GothamBold}
            Position={UDim2.fromScale(0.5, 0.42)}
            Size={UDim2.fromOffset(280, 20)}
            Text="Project card"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
          />
          <Text
            AnchorPoint={new Vector2(0.5, 0.5)}
            BackgroundTransparency={1}
            Position={UDim2.fromScale(0.5, 0.58)}
            Size={UDim2.fromOffset(280, 16)}
            Text="Right-click anywhere inside this card"
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
          />
        </textbutton>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content asChild>
          <frame
            {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
              AutomaticSize: Enum.AutomaticSize.Y,
              Size: UDim2.fromOffset(200, 0),
            }) as Record<string, unknown>)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <uipadding
              PaddingBottom={new UDim(0, theme.space[6])}
              PaddingLeft={new UDim(0, theme.space[6])}
              PaddingRight={new UDim(0, theme.space[6])}
              PaddingTop={new UDim(0, theme.space[6])}
            />
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[2])} />

            <ContextMenu.Label asChild>
              <Text
                BackgroundTransparency={1}
                LayoutOrder={0}
                Size={UDim2.fromOffset(188, 24)}
                Text="Card"
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
              </Text>
            </ContextMenu.Label>

            {actions.map((action, index) => (
              // Items stay BackgroundTransparency=1: the primitive drives
              // BackgroundColor3 between fixed dark hover colors, which would
              // fight the light theme. See the Select scene for the same trade.
              <ContextMenu.Item asChild key={action}>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundTransparency={1}
                  BorderSizePixel={0}
                  LayoutOrder={index + 1}
                  Size={UDim2.fromOffset(188, 32)}
                  Text={action}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                  <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
                </textbutton>
              </ContextMenu.Item>
            ))}

            <ContextMenu.Separator asChild>
              <frame
                BackgroundColor3={theme.colors.border}
                BorderSizePixel={0}
                LayoutOrder={actions.size() + 1}
                Size={UDim2.fromOffset(188, 1)}
              />
            </ContextMenu.Separator>

            <ContextMenu.Item asChild>
              <textbutton
                AutoButtonColor={false}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                LayoutOrder={actions.size() + 2}
                Size={UDim2.fromOffset(188, 32)}
                Text="Delete"
                TextColor3={theme.colors.danger}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
              </textbutton>
            </ContextMenu.Item>
          </frame>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={180} width={320}>
      <ContextMenuExample />
    </DocExampleShell>
  ),
  title: "Context Menu Example",
} as const;
