import { Accordion } from "@lattice-ui/accordion";
import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function AccordionExample() {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState("item-1");

  const items = [
    {
      value: "item-1",
      question: "Can I bring my own styles?",
      answer: "Yes. Every part ships unstyled — style with your own recipes and theme tokens.",
    },
    {
      value: "item-2",
      question: "Does it work with gamepads?",
      answer: "Focus and selection follow Roblox gamepad navigation out of the box.",
    },
    {
      value: "item-3",
      question: "Is motion built in?",
      answer: "Content reveals with a built-in transition from the motion package.",
    },
  ];

  return (
    <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
      <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[8])}
        PaddingLeft={new UDim(0, theme.space[20])}
        PaddingRight={new UDim(0, theme.space[20])}
        PaddingTop={new UDim(0, theme.space[8])}
      />

      <Accordion.Root
        collapsible
        onValueChange={(nextValue) => setOpen(typeIs(nextValue, "string") ? nextValue : "")}
        type="single"
        value={open}
      >
        <frame AutomaticSize={Enum.AutomaticSize.Y} BackgroundTransparency={1} Size={UDim2.fromOffset(320, 0)}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} />
          {items.map((item, index) => (
            <Accordion.Item key={item.value} asChild value={item.value}>
              <frame
                AutomaticSize={Enum.AutomaticSize.Y}
                BackgroundTransparency={1}
                LayoutOrder={index}
                Size={UDim2.fromOffset(320, 0)}
              >
                <uilistlayout FillDirection={Enum.FillDirection.Vertical} />
                <Accordion.Header asChild>
                  <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(320, 48)}>
                    <Accordion.Trigger asChild>
                      <textbutton
                        AutoButtonColor={false}
                        BackgroundTransparency={1}
                        Font={Enum.Font.GothamMedium}
                        Size={UDim2.fromScale(1, 1)}
                        Text={item.question}
                        TextColor3={theme.colors.textPrimary}
                        TextSize={theme.typography.labelSm.textSize}
                        TextXAlignment={Enum.TextXAlignment.Left}
                      >
                        <Text
                          AnchorPoint={new Vector2(1, 0.5)}
                          BackgroundTransparency={1}
                          Position={new UDim2(1, 0, 0.5, 0)}
                          Size={UDim2.fromOffset(16, 16)}
                          Text={open === item.value ? "−" : "+"}
                          TextColor3={theme.colors.textSecondary}
                          TextSize={theme.typography.bodyMd.textSize}
                        />
                      </textbutton>
                    </Accordion.Trigger>
                  </frame>
                </Accordion.Header>
                <Accordion.Content asChild>
                  <Text
                    BackgroundTransparency={1}
                    LayoutOrder={1}
                    Size={UDim2.fromOffset(320, 48)}
                    Text={item.answer}
                    TextColor3={theme.colors.textSecondary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextWrapped
                    TextXAlignment={Enum.TextXAlignment.Left}
                    TextYAlignment={Enum.TextYAlignment.Top}
                  >
                    <uipadding
                      PaddingBottom={new UDim(0, theme.space[12])}
                      PaddingRight={new UDim(0, theme.space[24])}
                    />
                  </Text>
                </Accordion.Content>
                {index < items.size() - 1 ? (
                  <frame
                    BackgroundColor3={theme.colors.border}
                    BackgroundTransparency={0.5}
                    BorderSizePixel={0}
                    LayoutOrder={2}
                    Size={UDim2.fromOffset(320, 1)}
                  />
                ) : undefined}
              </frame>
            </Accordion.Item>
          ))}
        </frame>
      </Accordion.Root>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={210} width={360}>
      <AccordionExample />
    </DocExampleShell>
  ),
  title: "Accordion Example",
} as const;
