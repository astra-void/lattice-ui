import { React, Slot } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createCanvasGroupRevealRecipe, type PresenceMotionConfig, usePresenceMotion } from "@lattice-ui/motion";
import { useDialogContext } from "./context";
import type { DialogContentProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  const candidate = instance as Instance & { IsA?: (className: string) => boolean };
  if (!instance || !candidate.IsA || !candidate.IsA("GuiObject")) {
    return undefined;
  }
  return candidate;
}

function renderChildrenWithBoundaryRefs(
  children: React.ReactNode,
  nextBoundaryIndex: { current: number },
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
          {renderChildrenWithBoundaryRefs(fragmentProps.children, nextBoundaryIndex, setBoundaryRef)}
        </React.Fragment>
      );
    }

    const boundaryIndex = nextBoundaryIndex.current;
    nextBoundaryIndex.current += 1;

    return <Slot ref={(instance) => setBoundaryRef(boundaryIndex, instance)}>{child}</Slot>;
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

  const defaultTransition = React.useMemo(() => createCanvasGroupRevealRecipe(), []);
  const config = props.transition ?? defaultTransition;

  const motionRef = usePresenceMotion<CanvasGroup>(props.motionPresent, config, props.onExitComplete);

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
    const content = renderChildrenWithBoundaryRefs(props.children, nextBoundaryIndex, setBoundaryRef);
    return { content, boundaryCount: nextBoundaryIndex.current };
  }, [props.children, setBoundaryRef]);

  const insideBoundaryRefs = React.useMemo(() => {
    const refs = new Array<React.MutableRefObject<GuiObject | undefined>>();
    for (let index = 1; index < insideBoundaryRefsRef.current.size(); index++) {
      refs.push(insideBoundaryRefsRef.current[index]);
    }
    return refs;
  }, [renderedChildren.boundaryCount]);

  React.useLayoutEffect(() => {
    const boundaryRefs = insideBoundaryRefsRef.current;
    if (renderedChildren.boundaryCount === 0) {
      contentBoundaryRef.current = toGuiObject(motionRef.current);
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
        <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)} ZIndex={10}>
          <canvasgroup
            BackgroundTransparency={1}
            BorderSizePixel={0}
            GroupTransparency={1}
            Position={UDim2.fromScale(0, 0)}
            Size={UDim2.fromScale(1, 1)}
            Visible={true}
            ref={motionRef}
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
