import { Combobox } from "@lattice-ui/combobox";
import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, menuItemRecipe, panelRecipe } from "../theme/recipes";

const DATASET = [
  "apricot",
  "blueberry",
  "cherry",
  "cranberry",
  "grapefruit",
  "kiwi",
  "lemon",
  "lychee",
  "mango",
  "nectarine",
  "papaya",
  "raspberry",
];

function queryMatches(text: string, query: string) {
  if (query === "") {
    return true;
  }
  const [matchStart] = string.find(string.lower(text), string.lower(query), 1, true);
  return matchStart !== undefined;
}

function OptionItem(props: { value: string }) {
  const { theme } = useTheme();
  return (
    <Combobox.Item asChild textValue={props.value} value={props.value}>
      <textbutton
        {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
          Size: UDim2.fromOffset(288, 30),
          Text: props.value,
        }) as Record<string, unknown>)}
      >
        <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
      </textbutton>
    </Combobox.Item>
  );
}

export function ComboboxBasicScene() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState<string | undefined>("apricot");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const matchCount = DATASET.filter((option) => queryMatches(option, query)).size();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 460)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Combobox: type-to-filter + enforced selection"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`open: ${open ? "true" : "false"} | value: ${value ?? "(none)"} | query: "${query}" | matches: ${matchCount}/${DATASET.size()}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 330),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

        <Text
          BackgroundTransparency={1}
          LayoutOrder={0}
          Size={UDim2.fromOffset(860, 18)}
          Text="12-item dataset — filter is case-insensitive substring; Enter/Space commits, empty query clears the filter"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
          truncate
        />

        <Combobox.Root onInputValueChange={setQuery} onOpenChange={setOpen} onValueChange={setValue} value={value}>
          <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(860, 86)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

            <Combobox.Trigger asChild>
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
                  Size: UDim2.fromOffset(320, 40),
                  Text: "",
                }) as Record<string, unknown>)}
              >
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(12, 0)}
                  Size={UDim2.fromOffset(84, 40)}
                  Text="Selected"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <Combobox.Value asChild placeholder="Select fruit">
                  <textlabel
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(88, 0)}
                    Size={UDim2.fromOffset(212, 40)}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.bodyMd.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Combobox.Value>
              </textbutton>
            </Combobox.Trigger>

            <Combobox.Input asChild placeholder="Type to filter (e.g. berry, an, ly)...">
              <textbox
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(320, 34)}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding PaddingLeft={new UDim(0, theme.space[8])} PaddingRight={new UDim(0, theme.space[8])} />
              </textbox>
            </Combobox.Input>
          </frame>

          <Combobox.Portal>
            <Combobox.Content asChild sideOffset={8} placement="bottom">
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                  Size: UDim2.fromOffset(320, 200),
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[8])}
                  PaddingLeft={new UDim(0, theme.space[8])}
                  PaddingRight={new UDim(0, theme.space[8])}
                  PaddingTop={new UDim(0, theme.space[8])}
                />

                {/* Empty state — visible only when the query filters everything out */}
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 0)}
                  Size={UDim2.fromScale(1, 1)}
                  Text={`No results for "${query}"`}
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextWrapped
                  Visible={matchCount === 0}
                />

                <scrollingframe
                  Active
                  AutomaticCanvasSize={Enum.AutomaticSize.Y}
                  BackgroundTransparency={1}
                  BorderSizePixel={0}
                  CanvasSize={new UDim2()}
                  ScrollBarThickness={4}
                  ScrollingDirection={Enum.ScrollingDirection.Y}
                  Size={UDim2.fromScale(1, 1)}
                  Visible={matchCount > 0}
                >
                  <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
                  {DATASET.map((option) => (
                    <OptionItem key={option} value={option} />
                  ))}
                </scrollingframe>
              </frame>
            </Combobox.Content>
          </Combobox.Portal>
        </Combobox.Root>
      </frame>
    </frame>
  );
}
