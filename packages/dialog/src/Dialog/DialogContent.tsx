import {
  getMotionTransitionExitFallbackMs,
  type MotionProperties,
  type MotionTransition,
  mergeMotionTransition,
  React,
  Slot,
  useMotionTween,
} from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { DialogOverlay } from "./DialogOverlay";
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

type DialogContentImplProps = {
  enabled: boolean;
  motionActive: boolean;
  rendered: boolean;
  modal: boolean;
  trapFocus: boolean;
  restoreFocus: boolean;
  onDismiss: () => void;
  onExitComplete?: () => void;
  transition?: MotionTransition | false;
} & Pick<DialogContentProps, "children" | "onInteractOutside" | "onPointerDownOutside">;

type DialogContentMotionChildProps = {
  child: React.ReactElement;
  motionActive: boolean;
  transition?: MotionTransition | false;
  onExitComplete?: () => void;
};

type FlattenedDialogChild = {
  key: React.Key;
  node: React.ReactNode;
};

function addUDim2(a: UDim2, b: UDim2) {
  return new UDim2(a.X.Scale + b.X.Scale, a.X.Offset + b.X.Offset, a.Y.Scale + b.Y.Scale, a.Y.Offset + b.Y.Offset);
}

function offsetMotionProperties(position: UDim2, properties?: MotionProperties) {
  if (!properties) {
    return undefined;
  }

  const nextProperties = { ...properties };
  const motionPosition = properties.Position;
  if (motionPosition !== undefined && typeIs(motionPosition, "userdata")) {
    nextProperties.Position = addUDim2(position, motionPosition as UDim2);
  }

  return nextProperties;
}

function buildVisualMotionTransition(position: UDim2, transition?: MotionTransition | false) {
  if (transition === false || transition === undefined) {
    return transition;
  }

  return {
    ...transition,
    enter: transition.enter
      ? {
          ...transition.enter,
          from: offsetMotionProperties(position, transition.enter.from),
          to: offsetMotionProperties(position, transition.enter.to),
        }
      : undefined,
    exit: transition.exit
      ? {
          ...transition.exit,
          from: offsetMotionProperties(position, transition.exit.from),
          to: offsetMotionProperties(position, transition.exit.to),
        }
      : undefined,
  } satisfies MotionTransition;
}

function isOverlayElement(child: React.ReactNode): child is React.ReactElement {
  return React.isValidElement(child) && child.type === DialogOverlay;
}

function isAnimatableDialogChild(child: React.ReactNode): child is React.ReactElement {
  return React.isValidElement(child) && child.type !== DialogOverlay;
}

function getChildBasePosition(child: React.ReactElement) {
  const childProps = child.props as { Position?: UDim2 };
  return childProps.Position ?? UDim2.fromScale(0, 0);
}

function flattenDialogChildren(children: React.ReactNode, path = "dialog"): Array<FlattenedDialogChild> {
  const flattenedChildren = new Array<FlattenedDialogChild>();
  let index = 0;

  React.Children.forEach(children, (child) => {
    const fallbackKey = `${path}.${index}`;
    const childKey = React.isValidElement(child) && child.key !== undefined ? child.key : fallbackKey;
    index += 1;

    if (React.isValidElement(child) && child.type === React.Fragment) {
      const fragmentProps = child.props as { children?: React.ReactNode };
      const fragmentChildren = flattenDialogChildren(fragmentProps.children, `${childKey}`);
      for (const fragmentChild of fragmentChildren) {
        flattenedChildren.push(fragmentChild);
      }
      return;
    }

    flattenedChildren.push({
      key: childKey,
      node: child,
    });
  });

  return flattenedChildren;
}

function DialogContentMotionChild(props: DialogContentMotionChildProps) {
  const motionRef = React.useRef<Instance>();
  const basePosition = getChildBasePosition(props.child);
  const transition = React.useMemo(
    () => buildVisualMotionTransition(basePosition, props.transition),
    [basePosition, props.transition],
  );

  useMotionTween(motionRef, {
    active: props.motionActive,
    onExitComplete: props.onExitComplete,
    transition,
  });

  return <Slot ref={motionRef}>{props.child}</Slot>;
}

function DialogContentImpl(props: DialogContentImplProps) {
  const flattenedChildren = React.useMemo(() => flattenDialogChildren(props.children), [props.children]);
  const motionChildCount = flattenedChildren.reduce((count, child) => {
    return count + (isAnimatableDialogChild(child.node) ? 1 : 0);
  }, 0);
  const exitCoordinatorRef = React.useRef({
    completed: false,
    initialized: false,
    pendingCount: 0,
  });
  const lastMotionActiveRef = React.useRef(props.motionActive);

  const completeExit = React.useCallback(() => {
    const state = exitCoordinatorRef.current;
    if (state.completed) {
      return;
    }

    state.completed = true;
    state.pendingCount = 0;
    props.onExitComplete?.();
  }, [props.onExitComplete]);

  React.useEffect(() => {
    const state = exitCoordinatorRef.current;
    if (!state.initialized) {
      state.initialized = true;
      lastMotionActiveRef.current = props.motionActive;
      return;
    }

    if (props.motionActive) {
      state.completed = false;
      state.pendingCount = 0;
      lastMotionActiveRef.current = true;
      return;
    }

    const wasMotionActive = lastMotionActiveRef.current;
    lastMotionActiveRef.current = false;
    if (!wasMotionActive) {
      return;
    }

    state.completed = false;
    state.pendingCount = motionChildCount;
    if (motionChildCount === 0) {
      completeExit();
    }
  }, [completeExit, motionChildCount, props.motionActive]);

  const handleMotionChildExitComplete = React.useCallback(() => {
    const state = exitCoordinatorRef.current;
    if (state.completed || state.pendingCount <= 0) {
      return;
    }

    state.pendingCount -= 1;
    if (state.pendingCount === 0) {
      completeExit();
    }
  }, [completeExit]);

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
          Position={UDim2.fromScale(0, 0)}
          Size={UDim2.fromScale(1, 1)}
          Visible={props.rendered}
        >
          {flattenedChildren.map((child) => {
            if (isOverlayElement(child.node) || !isAnimatableDialogChild(child.node)) {
              return child.node;
            }

            return (
              <DialogContentMotionChild
                child={child.node}
                key={child.key}
                motionActive={props.motionActive}
                onExitComplete={handleMotionChildExitComplete}
                transition={props.transition}
              />
            );
          })}
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
  const forceMountRenderState = useForceMountRenderedState(open);

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
        motionActive={open}
        onDismiss={handleDismiss}
        onExitComplete={forceMountRenderState.onExitComplete}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        rendered={forceMountRenderState.rendered}
        restoreFocus={restoreFocus}
        trapFocus={trapFocus}
        transition={transition}
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
          motionActive={state.isPresent}
          onDismiss={handleDismiss}
          onExitComplete={state.onExitComplete}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          rendered={true}
          restoreFocus={restoreFocus}
          trapFocus={trapFocus}
          transition={transition}
        >
          {props.children}
        </DialogContentImpl>
      )}
    />
  );
}
