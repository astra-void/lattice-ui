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
    <frame BackgroundColor3={theme.colors.surface} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
      <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[12])}
        PaddingLeft={new UDim(0, theme.space[12])}
        PaddingRight={new UDim(0, theme.space[12])}
        PaddingTop={new UDim(0, theme.space[12])}
      />

      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(196, 20)}
        Text="Tags"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <ScrollArea.Root>
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 30)} Size={UDim2.fromOffset(196, 202)}>
          <ScrollArea.Viewport asChild>
            <scrollingframe
              AutomaticCanvasSize={Enum.AutomaticSize.None}
              BackgroundTransparency={1}
              BorderSizePixel={0}
              CanvasSize={UDim2.fromOffset(0, 390)}
              ScrollBarImageTransparency={1}
              ScrollBarThickness={0}
              ScrollingDirection={Enum.ScrollingDirection.Y}
              Size={UDim2.fromOffset(184, 202)}
            >
              <uilistlayout FillDirection={Enum.FillDirection.Vertical} />
              {tags.map((tag, index) => (
                <Text
                  key={tag}
                  BackgroundTransparency={1}
                  LayoutOrder={index}
                  Size={UDim2.fromOffset(184, 26)}
                  Text={tag}
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              ))}
            </scrollingframe>
          </ScrollArea.Viewport>

          <ScrollArea.Scrollbar asChild orientation="vertical">
            <frame
              BackgroundColor3={theme.colors.border}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(188, 0)}
              Size={UDim2.fromOffset(8, 202)}
            >
              <ScrollArea.Thumb asChild orientation="vertical">
                <frame BackgroundColor3={theme.colors.textSecondary} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
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
    <DocExampleShell height={256} width={220}>
      <ScrollAreaExample />
    </DocExampleShell>
  ),
  title: "ScrollArea Example",
} as const;
