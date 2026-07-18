import { Accordion } from "@lattice-ui/accordion";
import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function AccordionExample() {
  const { theme } = useTheme();

  const items = [
    {
      value: "item-1",
      question: "Is it accessible?",
      answer: "Yes. It follows the WAI-ARIA disclosure pattern for accordions.",
    },
    {
      value: "item-2",
      question: "Is it styled?",
      answer: "No. It ships unstyled, so you bring your own recipes and tokens.",
    },
    {
      value: "item-3",
      question: "Is it animated?",
      answer: "Yes. Content reveals with a built-in motion transition.",
    },
  ];

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <Accordion.Root collapsible defaultValue="item-1" type="single">
        <frame AutomaticSize={Enum.AutomaticSize.Y} BackgroundTransparency={1} Size={UDim2.fromOffset(340, 0)}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />
          {items.map((item, index) => (
            <Accordion.Item key={item.value} asChild value={item.value}>
              <frame
                AutomaticSize={Enum.AutomaticSize.Y}
                BackgroundTransparency={1}
                LayoutOrder={index}
                Size={UDim2.fromOffset(340, 0)}
              >
                <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
                <Accordion.Header asChild>
                  <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(340, 36)}>
                    <Accordion.Trigger asChild>
                      <textbutton
                        AutoButtonColor={false}
                        BackgroundColor3={theme.colors.surfaceElevated}
                        BorderSizePixel={0}
                        Size={UDim2.fromScale(1, 1)}
                        Text={item.question}
                        TextColor3={theme.colors.textPrimary}
                        TextSize={theme.typography.labelSm.textSize}
                        TextXAlignment={Enum.TextXAlignment.Left}
                      >
                        <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                        <uipadding
                          PaddingLeft={new UDim(0, theme.space[10])}
                          PaddingRight={new UDim(0, theme.space[10])}
                        />
                      </textbutton>
                    </Accordion.Trigger>
                  </frame>
                </Accordion.Header>
                <Accordion.Content asChild>
                  <Text
                    BackgroundTransparency={1}
                    LayoutOrder={2}
                    Size={UDim2.fromOffset(340, 34)}
                    Text={item.answer}
                    TextColor3={theme.colors.textSecondary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextWrapped
                    TextXAlignment={Enum.TextXAlignment.Left}
                    TextYAlignment={Enum.TextYAlignment.Top}
                  >
                    <uipadding PaddingLeft={new UDim(0, theme.space[10])} PaddingRight={new UDim(0, theme.space[10])} />
                  </Text>
                </Accordion.Content>
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
    <DocExampleShell height={162} width={340}>
      <AccordionExample />
    </DocExampleShell>
  ),
  title: "Accordion Example",
} as const;
