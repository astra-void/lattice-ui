import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { ToggleGroup } from "@lattice-ui/react-toggle-group";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

function formatSingleValue(value: string | undefined) {
  return value ?? "none";
}

function formatMultipleValue(value: string[]) {
  return value.size() > 0 ? value.join(", ") : "none";
}

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

export function ToggleGroupBasicScene() {
  const { theme } = useTheme();

  const [singleControlled, setSingleControlled] = React.useState<string | undefined>("alpha");
  const [singleUncontrolledMirror, setSingleUncontrolledMirror] = React.useState<string | undefined>("beta");

  const [multipleControlled, setMultipleControlled] = React.useState<Array<string>>(["bold"]);
  const [multipleUncontrolledMirror, setMultipleUncontrolledMirror] = React.useState<Array<string>>(["left"]);

  const [toolbarAlign, setToolbarAlign] = React.useState<string | undefined>("left");
  const [toolbarFormat, setToolbarFormat] = React.useState<Array<string>>(["bold"]);

  function renderIconToggle(itemValue: string, glyph: string, active: boolean, disabled: boolean) {
    const overrides: Record<string, unknown> = {
      Size: UDim2.fromOffset(46, 34),
      Text: glyph,
    };
    if (disabled) {
      overrides.Active = false;
      overrides.Selectable = false;
      overrides.TextColor3 = theme.colors.textSecondary;
    }
    return (
      <ToggleGroup.Item asChild disabled={disabled} value={itemValue}>
        <textbutton
          {...(mergeGuiProps(
            buttonRecipe({ intent: active ? "primary" : "surface", size: "sm" }, theme),
            overrides,
          ) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
        </textbutton>
      </ToggleGroup.Item>
    );
  }

  return (
    <frame AutomaticSize={Enum.AutomaticSize.Y} BackgroundTransparency={1} Size={UDim2.fromOffset(960, 0)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(930, 28)}
        Text="ToggleGroup: icon toolbar, single/multiple controlled + uncontrolled, single re-click clears selection."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(930, 22)}
        Text={`toolbar align=${formatSingleValue(toolbarAlign)} | format=${formatMultipleValue(toolbarFormat)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={3}
        Size={UDim2.fromOffset(930, 22)}
        Text={`single(controlled)=${formatSingleValue(singleControlled)} | single(uncontrolled)=${formatSingleValue(singleUncontrolledMirror)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={4}
        Size={UDim2.fromOffset(930, 22)}
        Text={`multiple(controlled)=${formatMultipleValue(multipleControlled)} | multiple(uncontrolled)=${formatMultipleValue(multipleUncontrolledMirror)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      {/* Icon-style toolbar: alignment (single, with a disabled item) + formatting (multiple) */}
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
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

        <SectionHeader order={1} text="Toolbar - alignment (single) + formatting (multiple), 'Justify' is disabled" />

        <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(880, 34)}>
          <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[10])} />

          <ToggleGroup.Root onValueChange={setToolbarAlign} type="single" value={toolbarAlign}>
            <frame BackgroundTransparency={1} Size={UDim2.fromOffset(214, 34)}>
              <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[6])} />
              {renderIconToggle("left", "L", toolbarAlign === "left", false)}
              {renderIconToggle("center", "C", toolbarAlign === "center", false)}
              {renderIconToggle("right", "R", toolbarAlign === "right", false)}
              {renderIconToggle("justify", "J", toolbarAlign === "justify", true)}
            </frame>
          </ToggleGroup.Root>

          <ToggleGroup.Root onValueChange={setToolbarFormat} type="multiple" value={toolbarFormat}>
            <frame BackgroundTransparency={1} Size={UDim2.fromOffset(162, 34)}>
              <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[6])} />
              {renderIconToggle("bold", "B", toolbarFormat.includes("bold"), false)}
              {renderIconToggle("italic", "I", toolbarFormat.includes("italic"), false)}
              {renderIconToggle("underline", "U", toolbarFormat.includes("underline"), false)}
            </frame>
          </ToggleGroup.Root>
        </frame>
      </frame>

      {/* Single + multiple, controlled and uncontrolled parity */}
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          AutomaticSize: Enum.AutomaticSize.Y,
          LayoutOrder: 6,
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
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

        <SectionHeader order={1} text="Single - controlled (click selected again to clear to none)" />

        <ToggleGroup.Root onValueChange={setSingleControlled} type="single" value={singleControlled}>
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(860, 38)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroup.Item asChild value="alpha">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: singleControlled === "alpha" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Alpha",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="beta">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: singleControlled === "beta" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Beta",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="gamma">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: singleControlled === "gamma" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Gamma",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>
          </frame>
        </ToggleGroup.Root>

        <SectionHeader order={3} text="Single - uncontrolled" />

        <ToggleGroup.Root defaultValue="beta" onValueChange={setSingleUncontrolledMirror} type="single">
          <frame BackgroundTransparency={1} LayoutOrder={4} Size={UDim2.fromOffset(860, 38)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroup.Item asChild value="alpha">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: singleUncontrolledMirror === "alpha" ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Alpha",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="beta">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: singleUncontrolledMirror === "beta" ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Beta",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="gamma">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: singleUncontrolledMirror === "gamma" ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Gamma",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>
          </frame>
        </ToggleGroup.Root>

        <SectionHeader order={5} text="Multiple - controlled" />

        <ToggleGroup.Root onValueChange={setMultipleControlled} type="multiple" value={multipleControlled}>
          <frame BackgroundTransparency={1} LayoutOrder={6} Size={UDim2.fromOffset(860, 38)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroup.Item asChild value="bold">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleControlled.includes("bold") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Bold",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="italic">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleControlled.includes("italic") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Italic",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="underline">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleControlled.includes("underline") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Underline",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>
          </frame>
        </ToggleGroup.Root>

        <SectionHeader order={7} text="Multiple - uncontrolled" />

        <ToggleGroup.Root defaultValue={["left"]} onValueChange={setMultipleUncontrolledMirror} type="multiple">
          <frame BackgroundTransparency={1} LayoutOrder={8} Size={UDim2.fromOffset(860, 38)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroup.Item asChild value="left">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleUncontrolledMirror.includes("left") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Left",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="center">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleUncontrolledMirror.includes("center") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Center",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="right">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleUncontrolledMirror.includes("right") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Right",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>
          </frame>
        </ToggleGroup.Root>
      </frame>
    </frame>
  );
}
