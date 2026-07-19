import type { CheckedState } from "@lattice-ui/checkbox";
import { Checkbox } from "@lattice-ui/checkbox";
import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type Theme = ReturnType<typeof useTheme>["theme"];

function toCheckedLabel(value: CheckedState) {
  return value === "indeterminate" ? "indeterminate" : value ? "checked" : "unchecked";
}

function indicatorSymbol(value: CheckedState) {
  return value === "indeterminate" ? "-" : "✓";
}

function SectionHeader(props: { theme: Theme; text: string; order: number }) {
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={props.order}
      Size={UDim2.fromOffset(860, 18)}
      Text={props.text}
      TextColor3={props.theme.colors.textSecondary}
      TextSize={props.theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

function CheckRow(props: {
  theme: Theme;
  label: string;
  order: number;
  width?: number;
  disabled?: boolean;
  muted?: boolean;
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  symbol: string;
  onCheckedChange?: (checked: CheckedState) => void;
}) {
  const { theme } = props;
  const width = props.width ?? 610;
  const textColor = props.muted ? theme.colors.textSecondary : theme.colors.textPrimary;

  return (
    <Checkbox.Root
      asChild
      checked={props.checked}
      defaultChecked={props.defaultChecked}
      disabled={props.disabled}
      onCheckedChange={props.onCheckedChange}
    >
      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
          LayoutOrder: props.order,
          Size: UDim2.fromOffset(width, 40),
          Text: "",
        }) as Record<string, unknown>)}
      >
        <frame
          BackgroundColor3={theme.colors.surfaceElevated}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(12, 8)}
          Size={UDim2.fromOffset(24, 24)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
          <Checkbox.Indicator asChild forceMount>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 0)}
              Size={UDim2.fromScale(1, 1)}
              Text={props.symbol}
              TextColor3={props.muted ? theme.colors.textSecondary : theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
            />
          </Checkbox.Indicator>
        </frame>
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(48, 0)}
          Size={UDim2.fromOffset(width - 60, 40)}
          Text={props.label}
          TextColor3={textColor}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </textbutton>
    </Checkbox.Root>
  );
}

const CHILD_LABELS = ["Push notifications", "Email digest", "Product announcements"];

export function CheckboxBasicScene() {
  const { theme } = useTheme();
  const [controlled, setControlled] = React.useState<CheckedState>("indeterminate");
  const [uncontrolled, setUncontrolled] = React.useState<CheckedState>("indeterminate");
  const [children, setChildren] = React.useState<Array<boolean>>([true, false, false]);

  const checkedCount = children.filter((value) => value).size();
  const allChecked = checkedCount === children.size();
  const noneChecked = checkedCount === 0;
  const parentState: CheckedState = allChecked ? true : noneChecked ? false : "indeterminate";

  const toggleAll = React.useCallback(() => {
    setChildren((current) => {
      const shouldCheckAll = current.filter((value) => value).size() !== current.size();
      return current.map(() => shouldCheckAll);
    });
  }, []);

  const setChildAt = React.useCallback((index: number, nextValue: boolean) => {
    setChildren((current) => current.map((value, i) => (i === index ? nextValue : value)));
  }, []);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 640)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(860, 28)}
        Text="Checkbox: controlled/uncontrolled, indeterminate -> checked, tri-state select all, disabled"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(860, 22)}
        Text={`Controlled: ${toCheckedLabel(controlled)} | Uncontrolled: ${toCheckedLabel(uncontrolled)} | Selected ${checkedCount}/${children.size()}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 68)} Size={UDim2.fromOffset(920, 560)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[16])} />

        {/* States */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 1,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(640, 0),
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

          <SectionHeader theme={theme} text="STATES" order={1} />
          <CheckRow
            theme={theme}
            label={`Controlled (${toCheckedLabel(controlled)})`}
            order={2}
            checked={controlled}
            symbol={indicatorSymbol(controlled)}
            onCheckedChange={setControlled}
          />
          <CheckRow
            theme={theme}
            label={`Uncontrolled (${toCheckedLabel(uncontrolled)})`}
            order={3}
            defaultChecked="indeterminate"
            symbol={indicatorSymbol(uncontrolled)}
            onCheckedChange={setUncontrolled}
          />
          <CheckRow theme={theme} label="Disabled checked" order={4} checked={true} disabled muted symbol="✓" />
        </frame>

        {/* Tri-state select all */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 2,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(640, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

          <SectionHeader theme={theme} text="TRI-STATE SELECT ALL" order={1} />

          {/* Parent: indeterminate when only some children are checked */}
          <Checkbox.Root asChild checked={parentState} onCheckedChange={toggleAll}>
            <textbutton
              {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
                LayoutOrder: 2,
                Size: UDim2.fromOffset(610, 40),
                Text: "",
              }) as Record<string, unknown>)}
            >
              <frame
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(12, 8)}
                Size={UDim2.fromOffset(24, 24)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                <Checkbox.Indicator asChild forceMount>
                  <Text
                    BackgroundTransparency={1}
                    Size={UDim2.fromScale(1, 1)}
                    Text={indicatorSymbol(parentState)}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.bodyMd.textSize}
                  />
                </Checkbox.Indicator>
              </frame>
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(48, 0)}
                Size={UDim2.fromOffset(540, 40)}
                Text={`All subscriptions (${toCheckedLabel(parentState)})`}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </textbutton>
          </Checkbox.Root>

          {children.map((childChecked, index) => (
            <CheckRow
              key={`child-${index}`}
              theme={theme}
              label={CHILD_LABELS[index]}
              order={10 + index}
              width={586}
              checked={childChecked}
              symbol="✓"
              onCheckedChange={(nextChecked) => {
                setChildAt(index, nextChecked !== false);
              }}
            />
          ))}
        </frame>
      </frame>

      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
          Position: UDim2.fromOffset(660, 68),
          AutomaticSize: Enum.AutomaticSize.X,
          Size: new UDim2(0, 0, 0, 36),
          Text: "Set Controlled Indeterminate",
          Event: {
            Activated: () => {
              setControlled("indeterminate");
            },
          },
        }) as Record<string, unknown>)}
      >
        <uipadding PaddingLeft={new UDim(0, theme.space[16])} PaddingRight={new UDim(0, theme.space[16])} />
      </textbutton>
    </frame>
  );
}
