import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { TextField } from "@lattice-ui/text-field";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type Theme = ReturnType<typeof useTheme>["theme"];

function SectionHeader(props: { theme: Theme; text: string; order: number }) {
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={props.order}
      Size={UDim2.fromOffset(820, 18)}
      Text={props.text}
      TextColor3={props.theme.colors.textSecondary}
      TextSize={props.theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

function Field(props: {
  theme: Theme;
  order: number;
  label: string;
  placeholder?: string;
  width?: number;
  inputHeight?: number;
  value?: string;
  defaultValue?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  description?: string;
  message?: string;
  messageInvalid?: boolean;
  onValueChange?: (value: string) => void;
  onValueCommit?: (value: string) => void;
}) {
  const { theme } = props;
  const width = props.width ?? 820;
  const inputHeight = props.inputHeight ?? 36;
  const labelColor = props.disabled ? theme.colors.textSecondary : theme.colors.textPrimary;

  // Fixed height: label(22) + gap + input + optional description/message rows.
  let height = 22 + theme.space[4] + inputHeight;
  if (props.description !== undefined) {
    height += theme.space[4] + 16;
  }
  if (props.message !== undefined) {
    height += theme.space[4] + 16;
  }

  return (
    <TextField.Root
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      invalid={props.invalid}
      onValueChange={props.onValueChange}
      onValueCommit={props.onValueCommit}
      readOnly={props.readOnly}
      value={props.value}
    >
      <frame BackgroundTransparency={1} LayoutOrder={props.order} Size={UDim2.fromOffset(width, height)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

        <TextField.Label asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundTransparency={1}
            BorderSizePixel={0}
            LayoutOrder={1}
            Size={UDim2.fromOffset(width, 22)}
            Text={props.label}
            TextColor3={labelColor}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </TextField.Label>

        <TextField.Input asChild>
          <textbox
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            LayoutOrder={2}
            PlaceholderText={props.placeholder ?? "Type..."}
            Size={UDim2.fromOffset(width, inputHeight)}
            TextColor3={props.disabled ? theme.colors.textSecondary : theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke
              Color={props.invalid ? theme.colors.danger : theme.colors.border}
              Thickness={1}
              Transparency={props.invalid ? 0 : 0.4}
            />
            <uipadding PaddingLeft={new UDim(0, theme.space[10])} PaddingRight={new UDim(0, theme.space[10])} />
          </textbox>
        </TextField.Input>

        {props.description !== undefined ? (
          <TextField.Description asChild>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={3}
              Size={UDim2.fromOffset(width, 16)}
              Text={props.description}
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </TextField.Description>
        ) : undefined}

        {props.message !== undefined ? (
          <TextField.Message asChild>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={4}
              Size={UDim2.fromOffset(width, 16)}
              Text={props.message}
              TextColor3={props.messageInvalid ? theme.colors.danger : theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </TextField.Message>
        ) : undefined}
      </frame>
    </TextField.Root>
  );
}

const BIO_LIMIT = 24;

export function TextFieldBasicScene() {
  const { theme } = useTheme();
  const [controlledValue, setControlledValue] = React.useState("hello");
  const [lastCommit, setLastCommit] = React.useState("none");
  const [commitCount, setCommitCount] = React.useState(0);
  const [bio, setBio] = React.useState("Lattice UI");

  const invalid = controlledValue.size() < 3;
  const bioOver = bio.size() > BIO_LIMIT;

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 720)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="TextField: controlled/uncontrolled, commit, validation, char count, compact + disabled"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Controlled: ${controlledValue} | Last commit: ${lastCommit} (${commitCount}) | Invalid: ${invalid ? "true" : "false"}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 68)} Size={UDim2.fromOffset(940, 600)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[16])} />

        {/* Commit + controlled */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 1,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
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

          <SectionHeader theme={theme} text="COMMIT + CONTROLLED" order={1} />
          <Field
            theme={theme}
            order={2}
            label="Controlled field"
            placeholder="Type at least 3 characters"
            value={controlledValue}
            invalid={invalid}
            description="onValueChange fires on text updates, onValueCommit fires on focus loss / Enter."
            message={invalid ? "Must be at least 3 characters." : "Looks good."}
            messageInvalid={invalid}
            onValueChange={setControlledValue}
            onValueCommit={(value) => {
              setLastCommit(value);
              setCommitCount((count) => count + 1);
            }}
          />
        </frame>

        {/* Validation states */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 2,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
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

          <SectionHeader theme={theme} text="VALIDATION" order={1} />
          <Field theme={theme} order={2} label="Valid" defaultValue="jane@lattice.dev" message="Email accepted." />
          <Field
            theme={theme}
            order={3}
            label="Invalid"
            defaultValue="not-an-email"
            invalid
            message="Enter a valid email address."
            messageInvalid
          />
          <Field
            theme={theme}
            order={4}
            label="Read only"
            defaultValue="acct_9f2c14 (locked)"
            readOnly
            description="readOnly keeps the value but blocks edits."
          />
        </frame>

        {/* Character count */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 3,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
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

          <SectionHeader theme={theme} text="CHARACTER COUNT" order={1} />
          <Field
            theme={theme}
            order={2}
            label="Short bio"
            placeholder="Say something short"
            value={bio}
            invalid={bioOver}
            message={`${bio.size()}/${BIO_LIMIT}${bioOver ? " — too long" : ""}`}
            messageInvalid={bioOver}
            onValueChange={setBio}
          />
        </frame>

        {/* Compact + uncontrolled + disabled */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 4,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
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

          <SectionHeader theme={theme} text="COMPACT / UNCONTROLLED / DISABLED" order={1} />
          <Field
            theme={theme}
            order={2}
            label="Compact (28px)"
            defaultValue="compact"
            width={420}
            inputHeight={28}
            description="Smaller control height for dense forms."
          />
          <Field
            theme={theme}
            order={3}
            label="Uncontrolled field"
            defaultValue="uncontrolled value"
            placeholder="Uncontrolled text"
            description="This field keeps internal value state."
          />
          <Field
            theme={theme}
            order={4}
            label="Disabled field"
            defaultValue="disabled value"
            placeholder="Disabled"
            disabled
          />
        </frame>
      </frame>

      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
          Position: UDim2.fromOffset(0, 676),
          Size: UDim2.fromOffset(180, 36),
          Text: "Reset Controlled",
          Event: {
            Activated: () => {
              setControlledValue("hello");
            },
          },
        }) as Record<string, unknown>)}
      />
    </frame>
  );
}
