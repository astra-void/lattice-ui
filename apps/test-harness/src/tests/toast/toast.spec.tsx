import { React } from "@lattice-ui/core";
import { Toast } from "@lattice-ui/toast";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

export = () => {
  describe("toast", () => {
    it("renders composed title and description", () => {
      withReactHarness("ToastComposed", (harness) => {
        harness.render(
          <Toast.Root>
            <Toast.Title asChild>
              <textlabel Text="toast-title" />
            </Toast.Title>
            <Toast.Description asChild>
              <textlabel Text="toast-description" />
            </Toast.Description>
          </Toast.Root>,
        );

        waitForEffects(2);
        const title = findTextLabelByText(harness.container, "toast-title");
        const description = findTextLabelByText(harness.container, "toast-description");
        assert(title !== undefined, "ToastTitle should mount in composed toast root.");
        assert(description !== undefined, "ToastDescription should mount in composed toast root.");
      });
    });

    it("hides root when visible is false", () => {
      withReactHarness("ToastHidden", (harness) => {
        harness.render(
          <Toast.Root asChild visible={false}>
            <frame>
              <textlabel Text="toast-hidden-marker" />
            </frame>
          </Toast.Root>,
        );

        waitForEffects(2);
        const marker = findTextLabelByText(harness.container, "toast-hidden-marker");
        assert(marker !== undefined, "Marker should mount inside hidden toast root.");

        const markerParent = marker.Parent;
        assert(markerParent !== undefined && markerParent.IsA("GuiObject"), "Marker parent should be a GuiObject.");
        assert(markerParent.Visible === false, "ToastRoot should apply visible=false to composed root.");
      });
    });
  });
};
