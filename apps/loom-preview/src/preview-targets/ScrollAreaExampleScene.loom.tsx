import { React } from "@lattice-ui/core";
import { ScrollArea } from "@lattice-ui/scroll-area";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function ScrollAreaExample() {
  const { theme } = useTheme();

  const tags: Array<string> = [];
  for (let index = 0; index < 15; index++) {
    tags.push(`v1.2.0-beta.${50 - index}`);
  }

  return (
    <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
      <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[8])}
        PaddingLeft={new UDim(0, theme.space[16])}
        PaddingRight={new UDim(0, theme.space[16])}
        PaddingTop={new UDim(0, theme.space[16])}
      />

      <Text
        BackgroundTransparency={1}
        Font={Enum.Font.GothamBold}
        Size={UDim2.fromOffset(160, 18)}
        Text="Tags"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(158, 0)}
        Size={UDim2.fromOffset(50, 18)}
        Text="48"
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Right}
      />

      <ScrollArea.Root>
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 30)} Size={UDim2.fromOffset(208, 210)}>
          <ScrollArea.Viewport asChild>
            <scrollingframe
              AutomaticCanvasSize={Enum.AutomaticSize.None}
              BackgroundTransparency={1}
              BorderSizePixel={0}
              CanvasSize={UDim2.fromOffset(0, 435)}
              ScrollBarImageTransparency={1}
              ScrollBarThickness={0}
              ScrollingDirection={Enum.ScrollingDirection.Y}
              Size={UDim2.fromOffset(194, 210)}
            >
              <uilistlayout FillDirection={Enum.FillDirection.Vertical} />
              {tags.map((tag, index) => (
                <frame BackgroundTransparency={1} key={tag} LayoutOrder={index} Size={UDim2.fromOffset(194, 29)}>
                  <Text
                    BackgroundTransparency={1}
                    Size={UDim2.fromOffset(194, 28)}
                    Text={tag}
                    TextColor3={theme.colors.textSecondary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                  {index < tags.size() - 1 ? (
                    <frame
                      BackgroundColor3={theme.colors.border}
                      BackgroundTransparency={0.6}
                      BorderSizePixel={0}
                      Position={UDim2.fromOffset(0, 28)}
                      Size={UDim2.fromOffset(186, 1)}
                    />
                  ) : undefined}
                </frame>
              ))}
            </scrollingframe>
          </ScrollArea.Viewport>

          <ScrollArea.Scrollbar asChild orientation="vertical">
            <frame
              BackgroundTransparency={1}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(202, 0)}
              Size={UDim2.fromOffset(6, 210)}
            >
              <ScrollArea.Thumb asChild orientation="vertical">
                <frame BackgroundColor3={theme.colors.border} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
              </ScrollArea.Thumb>
            </frame>
          </ScrollArea.Scrollbar>
        </frame>
      </ScrollArea.Root>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={264} width={240}>
      <ScrollAreaExample />
    </DocExampleShell>
  ),
  title: "ScrollArea Example",
} as const;
