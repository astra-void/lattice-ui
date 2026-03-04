import { React } from "@lattice-ui/core";
import { ScrollArea } from "@lattice-ui/scroll-area";
import { findFirstDescendant } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

function findFrameByName(root: Instance, name: string) {
  const marker = findFirstDescendant(
    root,
    (instance) => instance.IsA("TextLabel") && instance.Text === name && instance.TextTransparency === 1,
  );
  if (!marker) {
    return undefined;
  }

  const parent = marker.Parent;
  if (!parent || !parent.IsA("Frame")) {
    return undefined;
  }

  return parent;
}

export = () => {
  describe("scroll-area", () => {
    it("mounts viewport and custom scrollbar parts", () => {
      withReactHarness("ScrollAreaParts", (harness) => {
        harness.render(
          <ScrollArea.Root>
            <ScrollArea.Viewport asChild>
              <scrollingframe Size={UDim2.fromOffset(120, 80)}>
                <textlabel BackgroundTransparency={1} Text="scroll-area-viewport" TextTransparency={1} />
                <frame Size={UDim2.fromOffset(240, 180)} />
              </scrollingframe>
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar asChild orientation="vertical">
              <frame Size={UDim2.fromOffset(8, 80)}>
                <textlabel BackgroundTransparency={1} Text="scroll-area-scrollbar-v" TextTransparency={1} />
                <ScrollArea.Thumb asChild orientation="vertical">
                  <frame>
                    <textlabel BackgroundTransparency={1} Text="scroll-area-thumb-v" TextTransparency={1} />
                  </frame>
                </ScrollArea.Thumb>
              </frame>
            </ScrollArea.Scrollbar>

            <ScrollArea.Scrollbar asChild orientation="horizontal">
              <frame Size={UDim2.fromOffset(120, 8)}>
                <textlabel BackgroundTransparency={1} Text="scroll-area-scrollbar-h" TextTransparency={1} />
                <ScrollArea.Thumb asChild orientation="horizontal">
                  <frame>
                    <textlabel BackgroundTransparency={1} Text="scroll-area-thumb-h" TextTransparency={1} />
                  </frame>
                </ScrollArea.Thumb>
              </frame>
            </ScrollArea.Scrollbar>

            <ScrollArea.Corner asChild>
              <frame Size={UDim2.fromOffset(8, 8)}>
                <textlabel BackgroundTransparency={1} Text="scroll-area-corner" TextTransparency={1} />
              </frame>
            </ScrollArea.Corner>
          </ScrollArea.Root>,
        );

        waitForEffects(3);
        const viewport = findFirstDescendant(
          harness.container,
          (instance) => instance.IsA("TextLabel") && instance.Text === "scroll-area-viewport",
        );
        const verticalBar = findFrameByName(harness.container, "scroll-area-scrollbar-v");
        const horizontalBar = findFrameByName(harness.container, "scroll-area-scrollbar-h");
        const corner = findFrameByName(harness.container, "scroll-area-corner");

        assert(viewport !== undefined, "ScrollAreaViewport should mount.");
        assert(verticalBar !== undefined, "Vertical scrollbar should mount.");
        assert(horizontalBar !== undefined, "Horizontal scrollbar should mount.");
        assert(corner !== undefined, "Scroll corner should mount.");
      });
    });
  });
};
