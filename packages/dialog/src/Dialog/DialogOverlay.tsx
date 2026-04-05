import { React, Slot } from "@lattice-ui/core";
import { type MotionTransition } from "@lattice-ui/motion";
import { getMotionTransitionExitFallbackMs, mergeMotionTransition, useMotionTween } from "@lattice-ui/motion";
import { Presence } from "@lattice-ui/layer";
import { useDialogContext } from "./context";
import type { DialogOverlayProps } from "./types";

const OVERLAY_TWEEN_INFO = new TweenInfo(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

function buildDialogOverlayTransition(): MotionTransition {
  return {
    enter: {
      tweenInfo: OVERLAY_TWEEN_INFO,
      from: {
        BackgroundTransparency: 1,
      },
      to: {
        BackgroundTransparency: 0.35,
      },
    },
    exit: {
      tweenInfo: OVERLAY_TWEEN_INFO,
      to: {
        BackgroundTransparency: 1,
      },
    },
  };
}

function useForceMountRenderedState(active: boolean) {
  const [renderedWhileClosed, setRenderedWhileClosed] = React.useState(active);

  React.useLayoutEffect(() => {
    if (active && !renderedWhileClosed) {
      setRenderedWhileClosed(true);
    }
  }, [active, renderedWhileClosed]);

  const handleExitComplete = React.useCallback(() => {
    if (!active) {
      setRenderedWhileClosed(false);
    }
  }, [active]);

  return {
    onExitComplete: handleExitComplete,
    rendered: active || renderedWhileClosed,
  };
}

type DialogOverlayImplProps = {
  active: boolean;
  rendered: boolean;
  interactive?: boolean;
  transition?: MotionTransition | false;
  onDismiss: () => void;
  onExitComplete?: () => void;
  children?: React.ReactElement;
  asChild?: boolean;
};

function DialogOverlayImpl(props: DialogOverlayImplProps) {
  const overlayRef = React.useRef<TextButton>();
  const interactive = props.interactive ?? props.active;

  useMotionTween(overlayRef as React.MutableRefObject<Instance | undefined>, {
    active: props.active,
    onExitComplete: props.onExitComplete,
    transition: props.transition,
  });

  const handleActivated = React.useCallback(() => {
    props.onDismiss();
  }, [props.onDismiss]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[DialogOverlay] `asChild` requires a child element.");
    }

    return (
      <Slot Active={interactive} Event={{ Activated: handleActivated }} Visible={props.rendered} ref={overlayRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={interactive}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(8, 10, 14)}
      BackgroundTransparency={0.35}
      BorderSizePixel={0}
      Event={{ Activated: handleActivated }}
      Position={UDim2.fromScale(0, 0)}
      Selectable={false}
      Size={UDim2.fromScale(1, 1)}
      Text=""
      TextTransparency={1}
      Visible={props.rendered}
      ZIndex={5}
      ref={overlayRef}
    />
  );
}

export function DialogOverlay(props: DialogOverlayProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;
  const forceMountRenderState = useForceMountRenderedState(open);

  const transition = React.useMemo(() => {
    return mergeMotionTransition(buildDialogOverlayTransition(), props.transition);
  }, [props.transition]);

  if (props.forceMount) {
    return (
      <DialogOverlayImpl
        active={open}
        asChild={props.asChild}
        onDismiss={() => dialogContext.setOpen(false)}
        onExitComplete={forceMountRenderState.onExitComplete}
        rendered={forceMountRenderState.rendered}
        transition={transition}
      >
        {props.children}
      </DialogOverlayImpl>
    );
  }

  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={open}
      render={(state) => (
        <DialogOverlayImpl
          active={state.isPresent}
          asChild={props.asChild}
          interactive={state.isPresent}
          onDismiss={() => dialogContext.setOpen(false)}
          onExitComplete={state.onExitComplete}
          rendered={true}
          transition={transition}
        >
          {props.children}
        </DialogOverlayImpl>
      )}
    />
  );
}
