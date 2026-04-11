import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { Select } from "@lattice-ui/select";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const Workspace = game.GetService("Workspace");

function getViewportSize() {
  const camera = Workspace.CurrentCamera;
  assert(camera !== undefined, "CurrentCamera is required for viewport assertions.");
  return camera.ViewportSize;
}

type SelectRenderOptions = {
  open?: boolean;
  defaultOpen?: boolean;
  value?: string;
  defaultValue?: string;
  forceMount?: boolean;
  disableBeta?: boolean;
  markerText: string;
};

function renderSelectTree(options: SelectRenderOptions, playerGui: PlayerGui) {
  return (
    <PortalProvider container={playerGui}>
      <Select.Root
        defaultOpen={options.defaultOpen}
        defaultValue={options.defaultValue}
        open={options.open}
        value={options.value}
      >
        <Select.Trigger asChild>
          <textbutton Selectable={true} Text="select-trigger" />
        </Select.Trigger>
        <Select.Value asChild placeholder="Pick one">
          <textlabel />
        </Select.Value>

        <Select.Portal>
          <Select.Content asChild forceMount={options.forceMount === true}>
            <frame>
              <Select.Item asChild textValue="Alpha Option" value="alpha">
                <textbutton Text="select-item-alpha" />
              </Select.Item>
              <Select.Item asChild disabled={options.disableBeta === true} textValue="Beta Option" value="beta">
                <textbutton Text="select-item-beta" />
              </Select.Item>
              <textlabel Text={options.markerText} />
            </frame>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </PortalProvider>
  );
}

export = () => {
  describe("select", () => {
    it("does not enter an update loop when items mount", () => {
      withReactHarness("SelectMountLoop", (harness) => {
        let renderCount = 0;

        function Tracker() {
          renderCount++;
          return <textlabel Text="tracker" />;
        }

        harness.render(
          <PortalProvider container={harness.playerGui}>
            <Select.Root defaultOpen={true}>
              <Select.Trigger asChild>
                <textbutton Selectable={true} Text="select-trigger" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content>
                  <Tracker />
                  <Select.Item value="a" textValue="A" />
                  <Select.Item value="b" textValue="B" />
                  <Select.Item value="c" textValue="C" />
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </PortalProvider>,
        );

        waitForEffects(10);
        assert(renderCount < 20, "Select should not re-render infinitely when items mount.");
      });
    });

    it("mounts into portal and becomes visible when open=true", () => {
      withReactHarness("SelectOpenVisible", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: true,
              forceMount: false,
              markerText: "select-marker-open-visible",
            },
            harness.playerGui,
          ),
        );

        waitForEffects();
        const marker = findTextLabelByText(harness.playerGui, "select-marker-open-visible");
        assert(marker !== undefined, "Select content should mount when open is true.");

        const contentFrame = marker.Parent;
        assert(contentFrame !== undefined && contentFrame.IsA("GuiObject"), "Marker parent should be a GuiObject.");
        assert(contentFrame.Visible === true, "SelectContent should be visible when open is true.");
      });
    });

    it("mounts content after transitioning from closed to open", () => {
      withReactHarness("SelectOpenTransitionVisible", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              forceMount: false,
              markerText: "select-marker-transition",
            },
            harness.playerGui,
          ),
        );

        waitForEffects();
        assert(
          findTextLabelByText(harness.playerGui, "select-marker-transition") === undefined,
          "Closed SelectContent should start unmounted before the open transition.",
        );

        harness.render(
          renderSelectTree(
            {
              open: true,
              forceMount: false,
              markerText: "select-marker-transition",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(4);
        const marker = findTextLabelByText(harness.playerGui, "select-marker-transition");
        assert(marker !== undefined, "Select content should mount after open becomes true.");

        const contentFrame = marker.Parent;
        assert(
          contentFrame !== undefined && contentFrame.IsA("GuiObject"),
          "Transitioned SelectContent marker parent should be a GuiObject.",
        );
        assert(contentFrame.Visible === true, "Transitioned SelectContent should become visible after opening.");
      });
    });

    it("does not mount content while closed without forceMount", () => {
      withReactHarness("SelectClosed", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              forceMount: false,
              markerText: "select-marker-closed",
            },
            harness.playerGui,
          ),
        );

        waitForEffects();
        const marker = findTextLabelByText(harness.playerGui, "select-marker-closed");
        assert(marker === undefined, "Closed SelectContent should not mount when forceMount is false.");
      });
    });

    it("keeps forced content mounted but hidden while closed", () => {
      withReactHarness("SelectForceMount", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              forceMount: true,
              markerText: "select-marker-force",
            },
            harness.playerGui,
          ),
        );

        waitForEffects();
        const marker = findTextLabelByText(harness.playerGui, "select-marker-force");
        assert(marker !== undefined, "Forced SelectContent should mount marker while closed.");

        const markerParent = marker.Parent;
        assert(markerParent !== undefined && markerParent.IsA("GuiObject"), "Marker parent should be a GuiObject.");
        assert(markerParent.Visible === false, "Forced SelectContent should be hidden while open=false.");
      });
    });

    it("renders selected item text in SelectValue", () => {
      withReactHarness("SelectValueText", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              value: "beta",
              forceMount: true,
              markerText: "select-marker-value",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(3);
        const valueLabel = findTextLabelByText(harness.container, "Beta Option");
        assert(valueLabel !== undefined, "SelectValue should resolve and render selected item textValue.");
      });
    });

    it("falls back from disabled default value to first enabled item", () => {
      withReactHarness("SelectDisabledFallback", (harness) => {
        harness.render(
          renderSelectTree(
            {
              open: false,
              defaultValue: "beta",
              disableBeta: true,
              forceMount: true,
              markerText: "select-marker-fallback",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(4);
        const fallbackValueLabel = findTextLabelByText(harness.container, "Alpha Option");
        assert(
          fallbackValueLabel !== undefined,
          "Select should fall back to first enabled item when default value is disabled.",
        );

        const disabledItem = findTextButtonByText(harness.playerGui, "select-item-beta");
        assert(disabledItem !== undefined, "Disabled beta item should still mount in forced content tree.");
        assert(disabledItem.Active === false, "Disabled SelectItem should not be active.");
      });
    });

    it("keeps trigger and items out of native Roblox selection", () => {
      withReactHarness("SelectNoNativeSelection", (harness) => {
        harness.render(
          renderSelectTree(
            {
              defaultOpen: true,
              defaultValue: "beta",
              forceMount: true,
              markerText: "select-marker-open-focus",
            },
            harness.playerGui,
          ),
        );

        waitForEffects(4);
        const trigger = findTextButtonByText(harness.container, "select-trigger");
        assert(trigger !== undefined, "Select trigger should mount for selection coverage.");
        assert(trigger.Selectable === false, "Select trigger should not participate in native selection navigation.");

        const alphaItem = findTextButtonByText(harness.playerGui, "select-item-alpha");
        assert(alphaItem !== undefined, "Select item should mount while content is open.");
        assert(alphaItem.Selectable === false, "Select items should not participate in native selection navigation.");

        const betaItem = findTextButtonByText(harness.playerGui, "select-item-beta");
        assert(betaItem !== undefined, "Selected SelectItem should mount when content is open.");
        assert(betaItem.Selectable === false, "Selected items should also stay out of native selection.");
      });
    });

    it("keeps collision-adjusted placement while animating open", () => {
      withReactHarness("SelectOpenMotionPlacement", (harness) => {
        const triggerRef = React.createRef<TextButton>();
        const contentRef = React.createRef<Frame>();
        const viewportSize = getViewportSize();

        harness.render(
          <PortalProvider container={harness.playerGui}>
            <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
              <Select.Root open={true}>
                <Select.Trigger asChild>
                  <textbutton
                    Selectable={true}
                    Position={UDim2.fromOffset(viewportSize.X - 52, viewportSize.Y - 34)}
                    Size={UDim2.fromOffset(44, 24)}
                    Text="select-motion-trigger"
                    ref={triggerRef}
                  />
                </Select.Trigger>
                <Select.Value asChild placeholder="Pick one">
                  <textlabel />
                </Select.Value>
                <Select.Portal>
                  <Select.Content asChild padding={8} placement="bottom">
                    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(140, 80)} ref={contentRef}>
                      <textlabel Text="select-motion-content" />
                    </frame>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </frame>
          </PortalProvider>,
        );

        waitForEffects(4);

        const trigger = triggerRef.current;
        const content = contentRef.current;
        const wrapper = content?.Parent;
        assert(trigger !== undefined, "Select trigger should mount for motion placement coverage.");
        assert(content !== undefined, "Select content should mount for motion placement coverage.");
        assert(
          wrapper !== undefined && wrapper.IsA("GuiObject"),
          "Select content should render inside a positioned wrapper.",
        );
        assert(
          wrapper.AbsolutePosition.Y <= trigger.AbsolutePosition.Y + 1,
          "Bottom-requested select content should flip upward when there is not enough room below.",
        );
        assert(
          content.Position.Y.Offset < 0,
          "Flipped select content should animate along the resolved top placement.",
        );
        assert(
          content.AbsolutePosition.X >= 8 && content.AbsolutePosition.X + content.AbsoluteSize.X <= viewportSize.X - 8,
          "Collision-adjusted select content should stay clamped within the viewport while animating.",
        );
        assert(
          content.AbsolutePosition.Y >= 8 && content.AbsolutePosition.Y + content.AbsoluteSize.Y <= viewportSize.Y - 8,
          "Flipped select content should remain within viewport bounds while animating.",
        );

        task.wait(0.2);
        waitForEffects(2);

        assert(
          contentRef.current?.Position.Y.Offset === 0,
          "Select content should settle back onto the resolved popper coordinates.",
        );
      });
    });
  });
};
