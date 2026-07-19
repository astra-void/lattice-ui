import { FocusScope } from "@lattice-ui/react-focus";
import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import { DismissableLayer, Presence } from "@lattice-ui/react-layer";
import { type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/react-motion";
import {
  composeRefs,
  getElementRef,
  getPassthroughProps,
  type PassthroughProps,
  React,
} from "@lattice-ui/react-runtime";
import { useDialogContext } from "./context";
import type { DialogContentProps } from "./types";

type InstanceRef = React.Ref<Instance> | React.ForwardedRef<Instance>;

const OWN_PROPS = [
  "transition",
  "forceMount",
  "trapFocus",
  "restoreFocus",
  "onPointerDownOutside",
  "onInteractOutside",
  "children",
] as const;

// Roblox instance defaults are themselves a look: a bare frame renders an opaque grey box.
// Neutralize only that, and leave every real appearance decision to the consumer. Passthrough props
// are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// An unstyled dialog has nothing to animate, so there is no default recipe. Presence timing is
// still owned here; consumers opt into motion with `transition`.
const NO_MOTION: PresenceMotionConfig = {};

function isMutableInstanceRef(ref: InstanceRef | undefined): ref is React.MutableRefObject<Instance | undefined> {
  if (!typeIs(ref, "table")) {
    return false;
  }

  const tableRef = ref as unknown as Record<string, unknown>;

  // Ref tables from useRef/createRef may omit the `current` key while nil.
  if ("current" in tableRef) {
    return true;
  }

  return next(tableRef)[0] === undefined;
}

function setInstanceRef(ref: InstanceRef | undefined, value: Instance | undefined) {
  if (typeIs(ref, "function")) {
    ref(value);
    return;
  }

  if (isMutableInstanceRef(ref)) {
    ref.current = value;
  }
}

function composeInstanceRefs(...refs: Array<InstanceRef | undefined>) {
  return (instance: Instance | undefined) => {
    for (const ref of refs) {
      setInstanceRef(ref, instance);
    }
  };
}

function toGuiObject(instance: Instance | undefined) {
  const candidate = instance as Instance & { IsA?: (className: string) => boolean };
  if (!instance || !candidate.IsA?.("GuiObject")) {
    return undefined;
  }
  return candidate;
}

function isHostElement(child: React.ReactElement) {
  return typeIs((child as { type?: unknown }).type, "string");
}

function cloneChildrenWithBoundaryRefs(
  children: React.ReactNode,
  nextBoundaryIndex: { current: number },
  ensureBoundaryRef: (index: number) => React.MutableRefObject<GuiObject | undefined>,
  setBoundaryRef: (index: number, instance: Instance | undefined) => void,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    if (child.type === React.Fragment) {
      const fragmentProps = child.props as { children?: React.ReactNode };
      return (
        <React.Fragment>
          {cloneChildrenWithBoundaryRefs(fragmentProps.children, nextBoundaryIndex, ensureBoundaryRef, setBoundaryRef)}
        </React.Fragment>
      );
    }

    if (!isHostElement(child)) {
      return child;
    }

    const boundaryIndex = nextBoundaryIndex.current;
    nextBoundaryIndex.current += 1;
    ensureBoundaryRef(boundaryIndex);
    const childRef = getElementRef<Instance>(child);

    return React.cloneElement(child as React.ReactElement, {
      ref: composeInstanceRefs(childRef, (instance) => setBoundaryRef(boundaryIndex, instance)),
    });
  });
}

function DialogContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: PresenceMotionConfig;
  forceMount?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
  passthrough: PassthroughProps<CanvasGroup>;
}) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;

  const contentBoundaryRef = React.useRef<GuiObject>();
  const insideBoundaryRefsRef = React.useRef<Array<React.MutableRefObject<GuiObject | undefined>>>([]);

  const config = props.transition ?? NO_MOTION;

  const motion = usePresenceMotionController<CanvasGroup>({
    present: props.motionPresent,
    forceMount: props.forceMount,
    config,
    onExitComplete: props.onExitComplete,
  });

  const shouldRender = motion.mounted;
  const motionVisible = shouldRender && motion.phase !== "exited";

  const ensureInsideBoundaryRef = React.useCallback((index: number) => {
    const existing = insideBoundaryRefsRef.current[index];
    if (existing) return existing;
    const created = { current: undefined as GuiObject | undefined };
    insideBoundaryRefsRef.current[index] = created;
    return created;
  }, []);

  const setBoundaryRef = React.useCallback(
    (index: number, instance: Instance | undefined) => {
      const guiObject = toGuiObject(instance);
      ensureInsideBoundaryRef(index).current = guiObject;
      if (index === 0) {
        contentBoundaryRef.current = guiObject;
      }
    },
    [ensureInsideBoundaryRef],
  );

  const renderedChildren = React.useMemo(() => {
    const nextBoundaryIndex = { current: 0 };
    const content = cloneChildrenWithBoundaryRefs(
      props.children,
      nextBoundaryIndex,
      ensureInsideBoundaryRef,
      setBoundaryRef,
    );
    return { content, boundaryCount: nextBoundaryIndex.current };
  }, [ensureInsideBoundaryRef, props.children, setBoundaryRef]);

  const insideBoundaryRefs = React.useMemo(() => {
    const refs: React.MutableRefObject<GuiObject | undefined>[] = [];
    for (let index = 1; index < renderedChildren.boundaryCount; index++) {
      refs.push(insideBoundaryRefsRef.current[index]);
    }
    return refs;
  }, [renderedChildren.boundaryCount]);

  React.useLayoutEffect(() => {
    const boundaryRefs = insideBoundaryRefsRef.current;
    if (renderedChildren.boundaryCount === 0) {
      contentBoundaryRef.current = undefined;
      for (let index = boundaryRefs.size() - 1; index >= 0; index--) {
        boundaryRefs.remove(index);
      }
      return;
    }
    for (let index = renderedChildren.boundaryCount; index < boundaryRefs.size(); index++) {
      boundaryRefs[index].current = undefined;
    }
    for (let index = boundaryRefs.size() - 1; index >= renderedChildren.boundaryCount; index--) {
      boundaryRefs.remove(index);
    }
    contentBoundaryRef.current = boundaryRefs[0]?.current;
  }, [renderedChildren.boundaryCount]);

  const handleDismiss = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  const passthrough = props.passthrough;
  const behaviorProps = {
    // The motion host spans the layer so the consumer's own children lay themselves out inside it:
    // layer geometry, not a size design choice.
    Size: UDim2.fromScale(1, 1),
    Visible: motionVisible,
    ref: composeRefs<CanvasGroup>(passthrough.ref as never, motion.ref),
  };

  return (
    <DismissableLayer
      contentBoundaryRef={contentBoundaryRef}
      enabled={open}
      insideRefs={insideBoundaryRefs}
      modal={dialogContext.modal}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={open} restoreFocus={props.restoreFocus} trapped={props.trapFocus}>
        {/* Layer host: full-screen and ZIndex-stacked above the overlay. Layering, not appearance. */}
        <frame {...NEUTRAL_PROPS} Size={UDim2.fromScale(1, 1)} Visible={shouldRender} ZIndex={10}>
          <canvasgroup {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
            {renderedChildren.content}
          </canvasgroup>
        </frame>
      </FocusScope>
    </DismissableLayer>
  );
}

export function DialogContent(props: DialogContentProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;
  const trapFocus = props.trapFocus ?? true;
  const restoreFocus = props.restoreFocus ?? true;
  const passthrough = getPassthroughProps<CanvasGroup>(props, OWN_PROPS);

  if (props.forceMount) {
    return (
      <DialogContentImpl
        motionPresent={open}
        forceMount={true}
        trapFocus={trapFocus}
        restoreFocus={restoreFocus}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        passthrough={passthrough}
        transition={props.transition}
      >
        {props.children}
      </DialogContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <DialogContentImpl
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          trapFocus={trapFocus}
          restoreFocus={restoreFocus}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          passthrough={passthrough}
          transition={props.transition}
        >
          {props.children}
        </DialogContentImpl>
      )}
    />
  );
}
