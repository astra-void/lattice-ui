import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { Textarea } from "@lattice-ui/react-textarea";

import { panelRecipe } from "../theme/recipes";

type Theme = ReturnType<typeof useTheme>["theme"];

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

function TextareaField(props: {
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
  minRows?: number;
  maxRows?: number;
  description?: string;
  message?: string;
  messageInvalid?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const { theme } = props;
  const width = props.width ?? 860;
  const inputHeight = props.inputHeight ?? 70;
  const labelColor = props.disabled ? theme.colors.textSecondary : theme.colors.textPrimary;

  return (
    <Textarea.Root
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      invalid={props.invalid}
      maxRows={props.maxRows}
      minRows={props.minRows}
      onValueChange={props.onValueChange}
      value={props.value}
    >
      <frame
        BackgroundTransparency={1}
        LayoutOrder={props.order}
        AutomaticSize={Enum.AutomaticSize.Y}
        Size={UDim2.fromOffset(width, 0)}
      >
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

        <Textarea.Label asChild>
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
        </Textarea.Label>

        <Textarea.Input asChild>
          <textbox
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            LayoutOrder={2}
            PlaceholderText={props.placeholder ?? "Write details"}
            Size={UDim2.fromOffset(width, inputHeight)}
            TextColor3={props.disabled ? theme.colors.textSecondary : theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextWrapped
            TextXAlignment={Enum.TextXAlignment.Left}
            TextYAlignment={Enum.TextYAlignment.Top}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke
              Color={props.invalid ? theme.colors.danger : theme.colors.border}
              Thickness={1}
              Transparency={props.invalid ? 0 : 0.4}
            />
            <uipadding
              PaddingBottom={new UDim(0, theme.space[8])}
              PaddingLeft={new UDim(0, theme.space[8])}
              PaddingRight={new UDim(0, theme.space[8])}
              PaddingTop={new UDim(0, theme.space[8])}
            />
          </textbox>
        </Textarea.Input>

        {props.description !== undefined ? (
          <Textarea.Description asChild>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={3}
              Size={UDim2.fromOffset(width, 16)}
              Text={props.description}
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </Textarea.Description>
        ) : undefined}

        {props.message !== undefined ? (
          <Textarea.Message asChild>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={4}
              Size={UDim2.fromOffset(width, 16)}
              Text={props.message}
              TextColor3={props.messageInvalid ? theme.colors.danger : theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </Textarea.Message>
        ) : undefined}
      </frame>
    </Textarea.Root>
  );
}

const NOTE_LIMIT = 80;

export function TextareaBasicScene() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState("line 1\nline 2");
  const [note, setNote] = React.useState("Ship the release notes.");

  const invalid = value.size() < 5;
  const noteRemaining = NOTE_LIMIT - note.size();
  const noteOver = noteRemaining < 0;

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 620)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Textarea: auto-resize (minRows/maxRows), character count, helper/error, disabled"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 22)}
        Text={`Notes length: ${value.size()} | Message chars: ${note.size()}/${NOTE_LIMIT}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 66)} Size={UDim2.fromOffset(940, 540)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[16])} />

        {/* Auto-resize */}
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
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <SectionHeader theme={theme} text="AUTO-RESIZE (minRows 2 · maxRows 6)" order={1} />
          <TextareaField
            theme={theme}
            order={2}
            label="Notes"
            placeholder="Write details — grows as you type"
            value={value}
            invalid={invalid}
            minRows={2}
            maxRows={6}
            description="Grows from 2 rows up to 6, then scrolls internally."
            message={invalid ? "Type at least 5 chars" : "Looks good"}
            messageInvalid={invalid}
            onValueChange={setValue}
          />
        </frame>

        {/* Character count */}
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
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <SectionHeader theme={theme} text="CHARACTER LIMIT" order={1} />
          <TextareaField
            theme={theme}
            order={2}
            label="Commit message"
            placeholder="Describe the change"
            value={note}
            invalid={noteOver}
            minRows={2}
            maxRows={4}
            message={noteOver ? `${-noteRemaining} over limit` : `${noteRemaining} characters left`}
            messageInvalid={noteOver}
            onValueChange={setNote}
          />
        </frame>

        {/* Disabled */}
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
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <SectionHeader theme={theme} text="DISABLED" order={1} />
          <TextareaField
            theme={theme}
            order={2}
            label="Locked notes"
            defaultValue="This content is read-only and cannot be edited."
            disabled
            minRows={2}
            description="disabled blocks editing but preserves the value."
          />
        </frame>
      </frame>
    </frame>
  );
}
