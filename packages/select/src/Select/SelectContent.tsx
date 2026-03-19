import { React, Slot } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { usePopper } from "@lattice-ui/popper";
import { useSelectContext } from "./context";
import type { SelectContentProps } from "./types";

const TweenService = game.GetService("TweenService");

const OPEN_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CLOSE_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OPEN_Y_OFFSET = 6;

type SelectContentImplProps = {
  enabled: boolean;
  visible: boolean;
  exiting: boolean;
  onDismiss: () => void;
  onExitComplete?: () => void;
  asChild?: boolean;
  placement?: SelectContentProps["placement"];
  offset?: SelectContentProps["offset"];
  padding?: SelectContentProps["padding"];
} & Pick<SelectContentProps, "children" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function withVerticalOffset(position: UDim2, offset: number) {
  return new UDim2(position.X.Scale, position.X.Offset, position.Y.Scale, position.Y.Offset + offset);
}

function SelectContentImpl(props: SelectContentImplProps) {
  const selectContext = useSelectContext();

  const popper = usePopper({
    anchorRef: selectContext.triggerRef,
    contentRef: selectContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: props.enabled,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      selectContext.contentRef.current = toGuiObject(instance);
    },
    [selectContext.contentRef],
  );

  const positionTweenRef = React.useRef<Tween>();
  const tweenCompletedConnectionRef = React.useRef<RBXScriptConnection>();
  const previousVisibleRef = React.useRef(props.visible);
  const previousExitingRef = React.useRef(props.exiting);

  const clearTween = React.useCallback(() => {
    const tween = positionTweenRef.current;
    if (tween) {
      tween.Cancel();
      positionTweenRef.current = undefined;
    }

    const completedConnection = tweenCompletedConnectionRef.current;
    if (completedConnection) {
      completedConnection.Disconnect();
      tweenCompletedConnectionRef.current = undefined;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      clearTween();
    };
  }, [clearTween]);

  React.useEffect(() => {
    const contentNode = selectContext.contentRef.current;
    if (!contentNode) {
      return;
    }

    const wasVisible = previousVisibleRef.current;
    const wasExiting = previousExitingRef.current;
    previousVisibleRef.current = props.visible;
    previousExitingRef.current = props.exiting;

    if (props.exiting) {
      if (wasExiting) {
        return;
      }

      clearTween();

      const tween = TweenService.Create(contentNode, CLOSE_TWEEN_INFO, {
        Position: withVerticalOffset(popper.position, CONTENT_OPEN_Y_OFFSET),
      });

      positionTweenRef.current = tween;
      tweenCompletedConnectionRef.current = tween.Completed.Connect((playbackState) => {
        if (playbackState === Enum.PlaybackState.Completed) {
          props.onExitComplete?.();
        }
      });

      tween.Play();
      return;
    }

    clearTween();

    if (props.visible && !wasVisible) {
      contentNode.Position = withVerticalOffset(popper.position, CONTENT_OPEN_Y_OFFSET);
      const tween = TweenService.Create(contentNode, OPEN_TWEEN_INFO, {
        Position: popper.position,
      });
      positionTweenRef.current = tween;
      tween.Play();
      return;
    }

    contentNode.Position = popper.position;
  }, [clearTween, popper.position, props.exiting, props.onExitComplete, props.visible, selectContext.contentRef]);

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[SelectContent] `asChild` requires a child element.");
      }

      return (
        <Slot
          AnchorPoint={popper.anchorPoint}
          Position={popper.position}
          Visible={props.visible || props.exiting}
          ref={setContentRef}
        >
          {child}
        </Slot>
      );
    })()
  ) : (
    <frame
      AnchorPoint={popper.anchorPoint}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Position={popper.position}
      Size={UDim2.fromOffset(0, 0)}
      Visible={props.visible || props.exiting}
      ref={setContentRef}
    >
      {props.children}
    </frame>
  );

  return (
    <DismissableLayer
      enabled={props.enabled}
      modal={false}
      onDismiss={props.onDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={props.enabled} restoreFocus={true} trapped={false}>
        {contentNode}
      </FocusScope>
    </DismissableLayer>
  );
}

export function SelectContent(props: SelectContentProps) {
  const selectContext = useSelectContext();
  const open = selectContext.open;
  const forceMount = props.forceMount === true;

  const handleDismiss = React.useCallback(() => {
    selectContext.setOpen(false);
  }, [selectContext]);

  if (!open && !forceMount) {
    return undefined;
  }

  if (forceMount) {
    return (
      <SelectContentImpl
        asChild={props.asChild}
        enabled={open}
        exiting={false}
        offset={props.offset}
        onDismiss={handleDismiss}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        padding={props.padding}
        placement={props.placement}
        visible={open}
      >
        {props.children}
      </SelectContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={180}
      present={open}
      render={(state) => (
        <SelectContentImpl
          asChild={props.asChild}
          enabled={state.isPresent}
          exiting={!state.isPresent}
          offset={props.offset}
          onDismiss={handleDismiss}
          onExitComplete={state.onExitComplete}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          padding={props.padding}
          placement={props.placement}
          visible={state.isPresent}
        >
          {props.children}
        </SelectContentImpl>
      )}
    />
  );
}
