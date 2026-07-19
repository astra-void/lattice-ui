import { React } from "@lattice-ui/core";
import { RadioGroup } from "@lattice-ui/radio-group";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

type DensityOption = {
  value: string;
  label: string;
  description: string;
};

const DENSITY_OPTIONS: Array<DensityOption> = [
  { value: "comfortable", label: "Comfortable", description: "Balanced spacing for everyday reading." },
  { value: "compact", label: "Compact", description: "Denser rows to fit more on screen." },
  { value: "spacious", label: "Spacious", description: "Extra breathing room between items." },
];

function SectionHeader(props: { text: string; order: number }) {
  const { theme } = useTheme();
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={props.order}
      Size={UDim2.fromOffset(860, 20)}
      Text={props.text}
      TextColor3={theme.colors.textSecondary}
      TextSize={theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

export function RadioGroupDisabledScene() {
  const { theme } = useTheme();
  const [density, setDensity] = React.useState("comfortable");
  const [horizontal, setHorizontal] = React.useState("list");
  const [vertical, setVertical] = React.useState("newest");
  const [value, setValue] = React.useState("file");

  function renderPillItem(itemValue: string, label: string, selected: boolean) {
    return (
      <RadioGroup.Item asChild value={itemValue}>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: selected ? "primary" : "surface", size: "sm" }, theme), {
            Size: UDim2.fromOffset(150, 34),
            Text: label,
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
        </textbutton>
      </RadioGroup.Item>
    );
  }

  return (
    <frame AutomaticSize={Enum.AutomaticSize.Y} BackgroundTransparency={1} Size={UDim2.fromOffset(940, 0)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="RadioGroup: card options, orientation, controlled readout, and disabled edge cases"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(920, 22)}
        Text={`density=${density}  |  layout=${horizontal}  |  sort=${vertical}  |  edge=${value}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      {/* Card-style options with label + description, controlled */}
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          AutomaticSize: Enum.AutomaticSize.Y,
          LayoutOrder: 3,
          Size: UDim2.fromOffset(920, 0),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

        <SectionHeader order={1} text="Card options (controlled value drives the readout above)" />

        <RadioGroup.Root onValueChange={setDensity} value={density}>
          <frame
            AutomaticSize={Enum.AutomaticSize.Y}
            BackgroundTransparency={1}
            LayoutOrder={2}
            Size={UDim2.fromOffset(880, 0)}
          >
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

            {DENSITY_OPTIONS.map((option, index) => {
              const selected = density === option.value;
              return (
                <RadioGroup.Item key={option.value} asChild value={option.value}>
                  <textbutton
                    {...(mergeGuiProps(buttonRecipe({ intent: selected ? "primary" : "surface", size: "sm" }, theme), {
                      LayoutOrder: index,
                      Size: UDim2.fromOffset(420, 56),
                      Text: "",
                    }) as Record<string, unknown>)}
                  >
                    <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                    <uipadding
                      PaddingBottom={new UDim(0, theme.space[8])}
                      PaddingLeft={new UDim(0, theme.space[10])}
                      PaddingRight={new UDim(0, theme.space[10])}
                      PaddingTop={new UDim(0, theme.space[8])}
                    />
                    <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[2])} />
                    <Text
                      BackgroundTransparency={1}
                      LayoutOrder={1}
                      Size={UDim2.fromOffset(400, 18)}
                      Text={option.label}
                      TextColor3={selected ? theme.colors.accentContrast : theme.colors.textPrimary}
                      TextSize={theme.typography.bodyMd.textSize}
                      TextXAlignment={Enum.TextXAlignment.Left}
                    />
                    <Text
                      BackgroundTransparency={1}
                      LayoutOrder={2}
                      Size={UDim2.fromOffset(400, 16)}
                      Text={option.description}
                      TextColor3={selected ? theme.colors.accentContrast : theme.colors.textSecondary}
                      TextSize={theme.typography.labelSm.textSize}
                      TextXAlignment={Enum.TextXAlignment.Left}
                    />
                  </textbutton>
                </RadioGroup.Item>
              );
            })}
          </frame>
        </RadioGroup.Root>
      </frame>

      {/* Orientation: horizontal vs vertical */}
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          AutomaticSize: Enum.AutomaticSize.Y,
          LayoutOrder: 4,
          Size: UDim2.fromOffset(920, 0),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

        <SectionHeader order={1} text="Horizontal orientation (arrow keys move left/right)" />

        <RadioGroup.Root onValueChange={setHorizontal} orientation="horizontal" value={horizontal}>
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(880, 34)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[6])} />
            {renderPillItem("list", "List", horizontal === "list")}
            {renderPillItem("grid", "Grid", horizontal === "grid")}
            {renderPillItem("board", "Board", horizontal === "board")}
          </frame>
        </RadioGroup.Root>

        <SectionHeader order={3} text="Vertical orientation (arrow keys move up/down)" />

        <RadioGroup.Root onValueChange={setVertical} orientation="vertical" value={vertical}>
          <frame BackgroundTransparency={1} LayoutOrder={4} Size={UDim2.fromOffset(180, 116)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />
            {renderPillItem("newest", "Newest first", vertical === "newest")}
            {renderPillItem("oldest", "Oldest first", vertical === "oldest")}
            {renderPillItem("az", "Alphabetical", vertical === "az")}
          </frame>
        </RadioGroup.Root>
      </frame>

      {/* Edge cases: partial disabled skip + group disabled */}
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          AutomaticSize: Enum.AutomaticSize.Y,
          LayoutOrder: 5,
          Size: UDim2.fromOffset(920, 0),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

        <SectionHeader order={1} text="Partial disabled (middle item is disabled and should be skipped)" />

        <RadioGroup.Root onValueChange={setValue} value={value}>
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(580, 124)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

            <RadioGroup.Item asChild value="file">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: value === "file" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(300, 34),
                    Text: "File",
                  },
                ) as Record<string, unknown>)}
              />
            </RadioGroup.Item>

            <RadioGroup.Item asChild disabled value="edit">
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Active: false,
                  Selectable: false,
                  Size: UDim2.fromOffset(300, 34),
                  Text: "Edit (Disabled)",
                  TextColor3: theme.colors.textSecondary,
                }) as Record<string, unknown>)}
              />
            </RadioGroup.Item>

            <RadioGroup.Item asChild value="view">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: value === "view" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(300, 34),
                    Text: "View",
                  },
                ) as Record<string, unknown>)}
              />
            </RadioGroup.Item>
          </frame>
        </RadioGroup.Root>

        <SectionHeader order={3} text="Group disabled (selection stays fixed)" />

        <RadioGroup.Root defaultValue="fixed" disabled orientation="horizontal">
          <frame BackgroundTransparency={1} LayoutOrder={4} Size={UDim2.fromOffset(580, 34)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[6])} />

            <RadioGroup.Item asChild value="fixed">
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Active: false,
                  Selectable: false,
                  Size: UDim2.fromOffset(150, 34),
                  Text: "Fixed",
                  TextColor3: theme.colors.textSecondary,
                }) as Record<string, unknown>)}
              />
            </RadioGroup.Item>

            <RadioGroup.Item asChild value="other">
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Active: false,
                  Selectable: false,
                  Size: UDim2.fromOffset(150, 34),
                  Text: "Other",
                  TextColor3: theme.colors.textSecondary,
                }) as Record<string, unknown>)}
              />
            </RadioGroup.Item>
          </frame>
        </RadioGroup.Root>
      </frame>
    </frame>
  );
}
