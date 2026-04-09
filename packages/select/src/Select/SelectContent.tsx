import { composeRefs, React } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createCanvasGroupPopperEntranceRecipe, usePresenceMotion } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import { usePopper } from "@lattice-ui/popper";
import { useSelectContext } from "./context";
import type { SelectContentProps } from "./types";

const CONTENT_OFFSET = 10;

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }
  return instance;
}

function SelectContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: SelectContentProps["transition"];
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  forceMount?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const selectContext = useSelectContext();
  const open = selectContext.open;
  const shouldRender = open || props.motionPresent;
  const contentBoundaryRef = React.useRef<GuiObject>();

  const popper = usePopper({
    anchorRef: selectContext.triggerRef,
    contentRef: selectContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: shouldRender,
  });

  const defaultTransition = React.useMemo(
    () => createCanvasGroupPopperEntranceRecipe(popper.placement, CONTENT_OFFSET),
    [popper.placement],
  );
  const recipe = props.transition ?? defaultTransition;

  const motionRef = usePresenceMotion<GuiObject>(props.motionPresent, recipe, props.onExitComplete);

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      const guiObject = toGuiObject(instance);
      selectContext.contentRef.current = guiObject;
      contentBoundaryRef.current = guiObject;
      if (motionRef) {
        motionRef.current = guiObject;
      }
    },
    [motionRef, selectContext.contentRef],
  );

  const handleDismiss = React.useCallback(() => {
    selectContext.setOpen(false);
  }, [selectContext.setOpen]);

  const isActuallyVisible = shouldRender;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[SelectContent] `asChild` requires a child element.");
      }

      const childProps = toGuiPropBag((child as { props?: unknown }).props);

      return (
        <canvasgroup
          AutomaticSize={Enum.AutomaticSize.XY}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Size={UDim2.fromOffset(0, 0)}
          Visible={isActuallyVisible}
          ref={setContentRef as React.Ref<CanvasGroup>}
        >
          {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
            ...childProps,
            Position: UDim2.fromOffset(0, 0),
            ref: composeRefs((childProps as { ref?: React.Ref<Instance> }).ref),
          })}
        </canvasgroup>
      );
    })()
  ) : (
    <canvasgroup
      AutomaticSize={Enum.AutomaticSize.XY}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(0, 0)}
      Visible={isActuallyVisible}
      ref={setContentRef}
    >
      {props.children}
    </canvasgroup>
  );

  return (
    <DismissableLayer
      enabled={open}
      modal={false}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
      contentBoundaryRef={contentBoundaryRef}
    >
      <FocusScope active={open} restoreFocus={true} trapped={false}>
        <frame
          AnchorPoint={popper.anchorPoint}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Position={popper.position}
          Size={UDim2.fromOffset(0, 0)}
          Visible={shouldRender}
        >
          {contentNode}
        </frame>
      </FocusScope>
    </DismissableLayer>
  );
}

export function SelectContent(props: SelectContentProps) {
  const selectContext = useSelectContext();
  const open = selectContext.open;

  if (props.forceMount) {
    return (
      <SelectContentImpl
        motionPresent={open}
        transition={props.transition}
        placement={props.placement}
        offset={props.offset}
        padding={props.padding}
        forceMount={props.forceMount}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        asChild={props.asChild}
      >
        {props.children}
      </SelectContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <SelectContentImpl
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={props.transition}
          placement={props.placement}
          offset={props.offset}
          padding={props.padding}
          forceMount={props.forceMount}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          asChild={props.asChild}
        >
          {props.children}
        </SelectContentImpl>
      )}
    />
  );
}
