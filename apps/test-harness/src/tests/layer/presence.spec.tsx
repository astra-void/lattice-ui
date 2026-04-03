import { React } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { createReactHarness, waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

type PresenceRenderState = {
  isPresent: boolean;
  onExitComplete: () => void;
};

type PresenceController = {
  Component: () => React.ReactElement;
  setPresent: (present: boolean) => void;
  getExitCompleteCount: () => number;
  getLatestState: () => PresenceRenderState | undefined;
};

function createPresenceController(exitFallbackMs = 100): PresenceController {
  let setPresentState: React.Dispatch<React.SetStateAction<boolean>> | undefined;
  let exitCompleteCount = 0;
  let latestState: PresenceRenderState | undefined;

  function Component() {
    const [present, setPresent] = React.useState(true);

    React.useEffect(() => {
      setPresentState = setPresent;
      return () => {
        if (setPresentState === setPresent) {
          setPresentState = undefined;
        }
      };
    }, [setPresent]);

    return (
      <Presence
        exitFallbackMs={exitFallbackMs}
        onExitComplete={() => {
          exitCompleteCount += 1;
        }}
        present={present}
        render={(state) => {
          latestState = state;
          return <textlabel Text={state.isPresent ? "presence-present" : "presence-exiting"} />;
        }}
      />
    );
  }

  return {
    Component,
    setPresent: (present) => {
      assert(setPresentState !== undefined, "Presence controller should be ready before updates run.");
      setPresentState(present);
    },
    getExitCompleteCount: () => exitCompleteCount,
    getLatestState: () => latestState,
  };
}

export = () => {
  describe("presence", () => {
    it("does not throw during rapid present toggles", () => {
      withReactHarness("PresenceRapidToggle", (harness) => {
        const controller = createPresenceController(100);
        harness.render(<controller.Component />);
        waitForEffects(3);

        controller.setPresent(false);
        waitForEffects(2);
        controller.setPresent(true);
        waitForEffects(2);
        controller.setPresent(false);
        waitForEffects(2);

        assert(
          controller.getExitCompleteCount() === 0,
          "Rapid toggles should not complete exit early or throw while a fallback is pending.",
        );
      });
    });

    it("does not throw when unmounted while an exit fallback is pending", () => {
      const harness = createReactHarness("PresenceUnmountPending");
      let cleanedUp = false;

      try {
        const controller = createPresenceController(100);
        harness.render(<controller.Component />);
        waitForEffects(3);

        controller.setPresent(false);
        waitForEffects(2);

        harness.cleanup();
        cleanedUp = true;
      } finally {
        if (!cleanedUp) {
          harness.cleanup();
        }
      }
    });

    it("cancels a pending fallback when reopened and only completes the latest exit", () => {
      withReactHarness("PresenceReopenPending", (harness) => {
        const controller = createPresenceController(60);
        harness.render(<controller.Component />);
        waitForEffects(3);

        controller.setPresent(false);
        waitForEffects(2);
        controller.setPresent(true);
        waitForEffects(2);

        task.wait(0.08);
        waitForEffects(2);

        assert(
          controller.getExitCompleteCount() === 0,
          "Reopening should cancel the pending fallback so no stale exit completion fires.",
        );
        assert(
          findTextLabelByText(harness.container, "presence-present") !== undefined,
          "Presence should still render the present state after reopening.",
        );

        controller.setPresent(false);
        waitForEffects(2);
        task.wait(0.08);
        waitForEffects(2);

        assert(controller.getExitCompleteCount() === 1, "Only the latest exit should complete after reopening.");
        assert(
          findTextLabelByText(harness.container, "presence-present") === undefined &&
            findTextLabelByText(harness.container, "presence-exiting") === undefined,
          "Presence should unmount after the latest exit completes.",
        );
      });
    });

    it("keeps manual exit completion idempotent against the fallback task", () => {
      withReactHarness("PresenceManualExitComplete", (harness) => {
        const controller = createPresenceController(60);
        harness.render(<controller.Component />);
        waitForEffects(3);

        controller.setPresent(false);
        waitForEffects(2);

        const state = controller.getLatestState();
        assert(state?.isPresent === false, "Presence should be in exit state before manual completion.");

        state?.onExitComplete();
        waitForEffects(2);
        task.wait(0.08);
        waitForEffects(2);

        assert(
          controller.getExitCompleteCount() === 1,
          "Manual exit completion should only fire onExitComplete once even when the fallback delay elapses later.",
        );
        assert(
          findTextLabelByText(harness.container, "presence-present") === undefined &&
            findTextLabelByText(harness.container, "presence-exiting") === undefined,
          "Presence should stay unmounted after manual exit completion.",
        );
      });
    });
  });
};
