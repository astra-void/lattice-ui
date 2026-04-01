import {
  getMotionTransitionExitFallbackMs,
  type MotionTransition,
  mergeMotionTransition,
  React,
  useMotionTween,
} from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { useDialogContext } from "./context";
import type { DialogContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.14, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In);

function buildDialogContentTransition(): MotionTransition {
  return {
    enter: {
      tweenInfo: CONTENT_TWEEN_INFO,
      from: {
        Position: UDim2.fromOffset(0, 8),
      },
      to: {
        Position: UDim2.fromOffset(0, 0),
      },
    },
    exit: {
      tweenInfo: CONTENT_EXIT_TWEEN_INFO,
      to: {
        Position: UDim2.fromOffset(0, 8),
      },
    },
  };
}

type DialogContentImplProps = {
  enabled: boolean;
  visible: boolean;
  modal: boolean;
  trapFocus: boolean;
  restoreFocus: boolean;
  onDismiss: () => void;
  onExitComplete?: () => void;
  transition?: MotionTransition | false;
} & Pick<DialogContentProps, "children" | "onInteractOutside" | "onPointerDownOutside">;

function DialogContentImpl(props: DialogContentImplProps) {
  const contentRef = React.useRef<Frame>();

  useMotionTween(contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: props.transition,
  });

  return (
    <DismissableLayer
      enabled={props.enabled}
      modal={props.modal}
      onDismiss={props.onDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={props.enabled} restoreFocus={props.restoreFocus} trapped={props.trapFocus}>
        <frame
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(0, 0)}
          Size={UDim2.fromOffset(0, 0)}
          Visible={props.visible}
          ref={contentRef}
        >
          {props.children}
        </frame>
      </FocusScope>
    </DismissableLayer>
  );
}

export function DialogContent(props: DialogContentProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;
  const forceMount = props.forceMount === true;
  const trapFocus = props.trapFocus ?? true;
  const restoreFocus = props.restoreFocus ?? true;

  const handleDismiss = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  const transition = React.useMemo(() => {
    return mergeMotionTransition(buildDialogContentTransition(), props.transition);
  }, [props.transition]);

  if (forceMount) {
    return (
      <DialogContentImpl
        enabled={open}
        modal={dialogContext.modal}
        onDismiss={handleDismiss}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        restoreFocus={restoreFocus}
        trapFocus={trapFocus}
        transition={transition}
        visible={open}
      >
        {props.children}
      </DialogContentImpl>
    );
  }

  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={open}
      render={(state) => (
        <DialogContentImpl
          enabled={state.isPresent}
          modal={dialogContext.modal}
          onDismiss={handleDismiss}
          onExitComplete={state.onExitComplete}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          restoreFocus={restoreFocus}
          trapFocus={trapFocus}
          transition={transition}
          visible={true}
        >
          {props.children}
        </DialogContentImpl>
      )}
    />
  );
}
