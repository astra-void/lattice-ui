import { composeRefs, React } from "@lattice-ui/core";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createCanvasGroupPopperEntranceRecipe, usePresenceMotion } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import { usePopper } from "@lattice-ui/popper";
import { useTooltipContext } from "./context";
import type { TooltipContentProps } from "./types";

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

function TooltipContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: TooltipContentProps["transition"];
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  forceMount?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const tooltipContext = useTooltipContext();
  const open = tooltipContext.open;
  const shouldRender = open || props.motionPresent;
  const contentBoundaryRef = React.useRef<GuiObject>();

  const popper = usePopper({
    anchorRef: tooltipContext.triggerRef,
    contentRef: tooltipContext.contentRef,
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

  const motionRef = usePresenceMotion<GuiObject>(
    props.motionPresent && popper.isPositioned,
    recipe,
    props.onExitComplete,
  );

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      const guiObject = toGuiObject(instance);
      tooltipContext.contentRef.current = guiObject;
      contentBoundaryRef.current = guiObject;
      if (motionRef) {
        motionRef.current = guiObject;
      }
    },
    [motionRef, tooltipContext.contentRef],
  );

  const handleDismiss = React.useCallback(() => {
    tooltipContext.close();
  }, [tooltipContext]);

  const isActuallyVisible = shouldRender && popper.isPositioned;

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TooltipContent] `asChild` requires a child element.");
    }

    const childProps = toGuiPropBag((child as { props?: unknown }).props);

    return (
      <DismissableLayer
        enabled={open}
        modal={false}
        onDismiss={handleDismiss}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        contentBoundaryRef={contentBoundaryRef}
      >
        <frame
          AnchorPoint={popper.anchorPoint}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Position={isActuallyVisible ? popper.position : UDim2.fromOffset(-9999, -9999)}
          Size={UDim2.fromOffset(0, 0)}
          Visible={shouldRender}
        >
          <canvasgroup
            AutomaticSize={Enum.AutomaticSize.XY}
            BackgroundTransparency={1}
            BorderSizePixel={0}
            GroupTransparency={1}
            Position={UDim2.fromOffset(0, 0)}
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
        </frame>
      </DismissableLayer>
    );
  }

  return (
    <DismissableLayer
      enabled={open}
      modal={false}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
      contentBoundaryRef={contentBoundaryRef}
    >
      <frame
        AnchorPoint={popper.anchorPoint}
        BackgroundTransparency={1}
        BorderSizePixel={0}
        Position={isActuallyVisible ? popper.position : UDim2.fromOffset(-9999, -9999)}
        Size={UDim2.fromOffset(0, 0)}
        Visible={shouldRender}
      >
        <canvasgroup
          AutomaticSize={Enum.AutomaticSize.XY}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          GroupTransparency={1}
          Position={UDim2.fromOffset(0, 0)}
          Size={UDim2.fromOffset(0, 0)}
          Visible={isActuallyVisible}
          ref={setContentRef}
        >
          {props.children}
        </canvasgroup>
      </frame>
    </DismissableLayer>
  );
}

export function TooltipContent(props: TooltipContentProps) {
  const tooltipContext = useTooltipContext();
  const open = tooltipContext.open;

  if (props.forceMount) {
    return (
      <TooltipContentImpl
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
      </TooltipContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <TooltipContentImpl
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
        </TooltipContentImpl>
      )}
    />
  );
}
