import { React } from "@lattice-ui/core";
import { ScrollArea } from "@lattice-ui/scroll-area";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { panelRecipe } from "../theme/recipes";

function SectionHeader(props: { title: string; hint: string; layoutOrder: number }) {
  const { theme } = useTheme();
  return (
    <frame
      AutomaticSize={Enum.AutomaticSize.Y}
      BackgroundTransparency={1}
      LayoutOrder={props.layoutOrder}
      Size={UDim2.fromOffset(900, 0)}
    >
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[2])} />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(900, 18)}
        Text={props.title}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(900, 18)}
        Text={props.hint}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize - 1}
        TextTransparency={0.25}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
    </frame>
  );
}

function ContentTile(props: { label: string; size: UDim2; position: UDim2; layoutOrder?: number; danger?: boolean }) {
  const { theme } = useTheme();
  return (
    <frame
      BackgroundColor3={props.danger ? theme.colors.danger : theme.colors.accent}
      BorderSizePixel={0}
      LayoutOrder={props.layoutOrder}
      Position={props.position}
      Size={props.size}
    >
      <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
      <Text
        AnchorPoint={new Vector2(0.5, 0.5)}
        BackgroundTransparency={1}
        Position={UDim2.fromScale(0.5, 0.5)}
        Size={UDim2.fromScale(1, 1)}
        Text={props.label}
        TextColor3={props.danger ? theme.colors.dangerContrast : theme.colors.accentContrast}
        TextSize={theme.typography.labelSm.textSize}
      />
    </frame>
  );
}

const VERTICAL_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const HORIZONTAL_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BIG_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const BIG_COLUMNS = 6;
const BIG_TILE_W = 160;
const BIG_TILE_H = 110;
const BIG_GAP = 12;
const BIG_PAD = 16;

export function ScrollAreaBasicScene() {
  const { theme } = useTheme();

  const bigCanvasWidth = BIG_PAD * 2 + BIG_COLUMNS * BIG_TILE_W + (BIG_COLUMNS - 1) * BIG_GAP;
  const bigRows = math.ceil(BIG_ITEMS.size() / BIG_COLUMNS);
  const bigCanvasHeight = BIG_PAD * 2 + bigRows * BIG_TILE_H + (bigRows - 1) * BIG_GAP;

  return (
    <frame AutomaticSize={Enum.AutomaticSize.Y} BackgroundTransparency={1} Size={UDim2.fromOffset(940, 0)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

      <frame
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(920, 0)}
      >
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
        <Text
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(920, 28)}
          Text="ScrollArea: custom viewport + composable horizontal/vertical scrollbars and thumbs."
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.titleMd.textSize - 2}
          TextXAlignment={Enum.TextXAlignment.Left}
          truncate
        />
        <Text
          BackgroundTransparency={1}
          LayoutOrder={2}
          Size={UDim2.fromOffset(920, 20)}
          Text="Scrollbars auto-hide when content fits their axis, so a viewport shows only the bars it needs."
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      {/* VERTICAL ONLY */}
      <SectionHeader
        hint="Content overflows the Y axis only; the horizontal bar stays hidden."
        layoutOrder={2}
        title="VERTICAL ONLY"
      />
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          LayoutOrder: 3,
          Size: UDim2.fromOffset(900, 236),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <ScrollArea.Root>
          <frame BackgroundTransparency={1} Size={UDim2.fromOffset(420, 200)}>
            <ScrollArea.Viewport asChild>
              <scrollingframe
                AutomaticCanvasSize={Enum.AutomaticSize.Y}
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                CanvasSize={UDim2.fromScale(0, 0)}
                ScrollBarImageTransparency={1}
                ScrollBarThickness={0}
                ScrollingDirection={Enum.ScrollingDirection.Y}
                Size={UDim2.fromOffset(408, 200)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[8])}
                  PaddingLeft={new UDim(0, theme.space[8])}
                  PaddingRight={new UDim(0, theme.space[8])}
                  PaddingTop={new UDim(0, theme.space[8])}
                />
                <uilistlayout
                  FillDirection={Enum.FillDirection.Vertical}
                  Padding={new UDim(0, theme.space[8])}
                  SortOrder={Enum.SortOrder.LayoutOrder}
                />
                {VERTICAL_ITEMS.map((index) => (
                  <ContentTile
                    key={`v-${index}`}
                    label={`Row ${index}`}
                    layoutOrder={index}
                    position={UDim2.fromScale(0, 0)}
                    size={new UDim2(1, 0, 0, 40)}
                  />
                ))}
              </scrollingframe>
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar asChild orientation="vertical">
              <frame
                BackgroundColor3={theme.colors.border}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(412, 0)}
                Size={UDim2.fromOffset(8, 200)}
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

      {/* HORIZONTAL ONLY */}
      <SectionHeader
        hint="Content overflows the X axis only; the vertical bar stays hidden."
        layoutOrder={4}
        title="HORIZONTAL ONLY"
      />
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          LayoutOrder: 5,
          Size: UDim2.fromOffset(900, 190),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <ScrollArea.Root>
          <frame BackgroundTransparency={1} Size={UDim2.fromOffset(860, 150)}>
            <ScrollArea.Viewport asChild>
              <scrollingframe
                AutomaticCanvasSize={Enum.AutomaticSize.X}
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                CanvasSize={UDim2.fromScale(0, 0)}
                ScrollBarImageTransparency={1}
                ScrollBarThickness={0}
                ScrollingDirection={Enum.ScrollingDirection.X}
                Size={UDim2.fromOffset(860, 130)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[10])}
                  PaddingLeft={new UDim(0, theme.space[10])}
                  PaddingRight={new UDim(0, theme.space[10])}
                  PaddingTop={new UDim(0, theme.space[10])}
                />
                <uilistlayout
                  FillDirection={Enum.FillDirection.Horizontal}
                  Padding={new UDim(0, theme.space[10])}
                  SortOrder={Enum.SortOrder.LayoutOrder}
                />
                {HORIZONTAL_ITEMS.map((index) => (
                  <ContentTile
                    key={`h-${index}`}
                    label={`Col ${index}`}
                    layoutOrder={index}
                    position={UDim2.fromScale(0, 0)}
                    size={new UDim2(0, 150, 1, 0)}
                  />
                ))}
              </scrollingframe>
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar asChild orientation="horizontal">
              <frame
                BackgroundColor3={theme.colors.border}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(0, 134)}
                Size={UDim2.fromOffset(860, 8)}
              >
                <ScrollArea.Thumb asChild orientation="horizontal">
                  <frame BackgroundColor3={theme.colors.textSecondary} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                    <uicorner CornerRadius={new UDim(1, 0)} />
                  </frame>
                </ScrollArea.Thumb>
              </frame>
            </ScrollArea.Scrollbar>
          </frame>
        </ScrollArea.Root>
      </frame>

      {/* BOTH AXES — LARGE CONTENT */}
      <SectionHeader
        hint="A large canvas that overflows both axes: vertical bar, horizontal bar, and the corner square between them."
        layoutOrder={6}
        title="BOTH AXES — LARGE CONTENT"
      />
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          LayoutOrder: 7,
          Size: UDim2.fromOffset(900, 320),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <ScrollArea.Root>
          <frame BackgroundTransparency={1} Size={UDim2.fromOffset(860, 280)}>
            <ScrollArea.Viewport asChild>
              <scrollingframe
                AutomaticCanvasSize={Enum.AutomaticSize.None}
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                CanvasSize={UDim2.fromOffset(bigCanvasWidth, bigCanvasHeight)}
                ScrollBarImageTransparency={1}
                ScrollBarThickness={0}
                ScrollingDirection={Enum.ScrollingDirection.XY}
                Size={UDim2.fromOffset(848, 268)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                {BIG_ITEMS.map((index) => {
                  const column = index % BIG_COLUMNS;
                  const row = math.floor(index / BIG_COLUMNS);
                  return (
                    <ContentTile
                      key={`b-${index}`}
                      danger={index % 7 === 0}
                      label={`${index + 1}`}
                      position={UDim2.fromOffset(
                        BIG_PAD + column * (BIG_TILE_W + BIG_GAP),
                        BIG_PAD + row * (BIG_TILE_H + BIG_GAP),
                      )}
                      size={UDim2.fromOffset(BIG_TILE_W, BIG_TILE_H)}
                    />
                  );
                })}
              </scrollingframe>
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar asChild orientation="vertical">
              <frame
                BackgroundColor3={theme.colors.border}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(852, 0)}
                Size={UDim2.fromOffset(8, 268)}
              >
                <ScrollArea.Thumb asChild orientation="vertical">
                  <frame BackgroundColor3={theme.colors.textSecondary} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                    <uicorner CornerRadius={new UDim(1, 0)} />
                  </frame>
                </ScrollArea.Thumb>
              </frame>
            </ScrollArea.Scrollbar>

            <ScrollArea.Scrollbar asChild orientation="horizontal">
              <frame
                BackgroundColor3={theme.colors.border}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(0, 272)}
                Size={UDim2.fromOffset(848, 8)}
              >
                <ScrollArea.Thumb asChild orientation="horizontal">
                  <frame BackgroundColor3={theme.colors.textSecondary} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                    <uicorner CornerRadius={new UDim(1, 0)} />
                  </frame>
                </ScrollArea.Thumb>
              </frame>
            </ScrollArea.Scrollbar>

            <ScrollArea.Corner asChild>
              <frame
                BackgroundColor3={theme.colors.border}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(852, 272)}
                Size={UDim2.fromOffset(8, 8)}
              />
            </ScrollArea.Corner>
          </frame>
        </ScrollArea.Root>
      </frame>
    </frame>
  );
}
