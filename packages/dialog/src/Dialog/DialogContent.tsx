import { getElementRef, React } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import {
  createCanvasGroupRevealRecipe,
  type PresenceMotionConfig,
  usePresenceMotionController,
} from "@lattice-ui/motion";
import { useDialogContext } from "./context";
import type { DialogContentProps } from "./types";

type InstanceRef = React.Ref<Instance> | React.ForwardedRef<Instance>;

function isMutableInstanceRef(ref: InstanceRef | undefined): ref is React.MutableRefObject<Instance | undefined> {
  return typeIs(ref, "table") && "current" in ref;
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
  if (!instance || !candidate.IsA || !candidate.IsA("GuiObject")) {
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
}) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;

  const contentBoundaryRef = React.useRef<GuiObject>();
  const insideBoundaryRefsRef = React.useRef<Array<React.MutableRefObject<GuiObject | undefined>>>([]);

  const defaultTransition = React.useMemo(() => createCanvasGroupRevealRecipe(8), []);
  const config = props.transition ?? defaultTransition;

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
    const refs = new Array<React.MutableRefObject<GuiObject | undefined>>();
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
        <frame
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Size={UDim2.fromScale(1, 1)}
          Visible={shouldRender}
          ZIndex={10}
        >
          <canvasgroup
            BackgroundTransparency={1}
            BorderSizePixel={0}
            Size={UDim2.fromScale(1, 1)}
            Visible={motionVisible}
            ref={motion.ref}
          >
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

  if (props.forceMount) {
    return (
      <DialogContentImpl
        motionPresent={open}
        forceMount={true}
        trapFocus={trapFocus}
        restoreFocus={restoreFocus}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
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
          transition={props.transition}
        >
          {props.children}
        </DialogContentImpl>
      )}
    />
  );
}
