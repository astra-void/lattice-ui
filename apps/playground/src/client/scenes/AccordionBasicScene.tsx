import { Accordion } from "@lattice-ui/react-accordion";
import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";

import { panelRecipe } from "../theme/recipes";

type AccordionEntry = {
  value: string;
  title: string;
  body: string;
  disabled?: boolean;
};

const SINGLE_ITEMS: Array<AccordionEntry> = [
  {
    value: "account",
    title: "Account",
    body:
      "Manage your profile, display name, and linked identities. Only one section can be open at a " +
      "time in single mode, so opening another panel collapses this one with the reveal animation.",
  },
  {
    value: "billing",
    title: "Billing",
    body:
      "Review invoices, update your payment method, and change plans. This longer body demonstrates the " +
      "wrapped, multi-line disclosure content growing the item as it expands.",
  },
  {
    value: "security",
    title: "Security",
    body: "This item is disabled and cannot be expanded.",
    disabled: true,
  },
];

const MULTIPLE_ITEMS: Array<AccordionEntry> = [
  {
    value: "general",
    title: "General",
    body:
      "Language, timezone, and appearance preferences. In multiple mode any number of panels can stay " +
      "open at once, and each one animates independently as you toggle it.",
  },
  {
    value: "privacy",
    title: "Privacy",
    body: "Control who can see your activity and how your data is shared across the workspace.",
  },
  {
    value: "notifications",
    title: "Notifications",
    body: "Choose which events send email, push, and in-app alerts, and set quiet hours.",
  },
];

function AccordionEntryView(props: { entry: AccordionEntry }) {
  const { theme } = useTheme();
  const entry = props.entry;
  return (
    <Accordion.Item asChild disabled={entry.disabled} value={entry.value}>
      <frame AutomaticSize={Enum.AutomaticSize.Y} BackgroundTransparency={1} Size={UDim2.fromOffset(860, 0)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

        <Accordion.Header asChild>
          <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(860, 32)}>
            <Accordion.Trigger asChild>
              <textbutton
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(860, 32)}
                Text={entry.disabled === true ? `${entry.title} (Disabled)` : entry.title}
                TextColor3={entry.disabled === true ? theme.colors.textSecondary : theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
              </textbutton>
            </Accordion.Trigger>
          </frame>
        </Accordion.Header>

        <Accordion.Content asChild>
          <Text
            AutomaticSize={Enum.AutomaticSize.Y}
            BackgroundTransparency={1}
            LayoutOrder={2}
            Size={UDim2.fromOffset(840, 0)}
            Text={entry.body}
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.bodyMd.textSize}
            TextWrapped
            TextXAlignment={Enum.TextXAlignment.Left}
            TextYAlignment={Enum.TextYAlignment.Top}
          >
            <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
          </Text>
        </Accordion.Content>
      </frame>
    </Accordion.Item>
  );
}

export function AccordionBasicScene() {
  const { theme } = useTheme();
  const [singleOpen, setSingleOpen] = React.useState<string>("account");
  const [multiOpen, setMultiOpen] = React.useState<Array<string>>(["general"]);

  return (
    <frame AutomaticSize={Enum.AutomaticSize.Y} BackgroundTransparency={1} Size={UDim2.fromOffset(940, 0)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Accordion: single vs multiple, default-open, disabled item, and animated long-content disclosure"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(920, 22)}
        Text={`single open=${singleOpen === "" ? "none" : singleOpen} | multiple open=${
          multiOpen.size() > 0 ? multiOpen.join(", ") : "none"
        }`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      {/* Single mode: one panel at a time, "Account" open by default, "Security" disabled */}
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          AutomaticSize: Enum.AutomaticSize.Y,
          LayoutOrder: 3,
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
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

        <Text
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(860, 20)}
          Text="Single (collapsible) - default open: Account"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Accordion.Root
          collapsible
          defaultValue="account"
          onValueChange={(value) => setSingleOpen(typeIs(value, "string") ? value : (value[0] ?? ""))}
          type="single"
        >
          <frame
            AutomaticSize={Enum.AutomaticSize.Y}
            BackgroundTransparency={1}
            LayoutOrder={2}
            Size={UDim2.fromOffset(860, 0)}
          >
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />
            {SINGLE_ITEMS.map((entry) => (
              <AccordionEntryView key={entry.value} entry={entry} />
            ))}
          </frame>
        </Accordion.Root>
      </frame>

      {/* Multiple mode: any number of panels open at once */}
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          AutomaticSize: Enum.AutomaticSize.Y,
          LayoutOrder: 4,
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
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

        <Text
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(860, 20)}
          Text="Multiple (collapsible) - default open: General"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Accordion.Root
          collapsible
          defaultValue={["general"]}
          onValueChange={(value) => setMultiOpen(typeIs(value, "string") ? [value] : value)}
          type="multiple"
        >
          <frame
            AutomaticSize={Enum.AutomaticSize.Y}
            BackgroundTransparency={1}
            LayoutOrder={2}
            Size={UDim2.fromOffset(860, 0)}
          >
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />
            {MULTIPLE_ITEMS.map((entry) => (
              <AccordionEntryView key={entry.value} entry={entry} />
            ))}
          </frame>
        </Accordion.Root>
      </frame>
    </frame>
  );
}
