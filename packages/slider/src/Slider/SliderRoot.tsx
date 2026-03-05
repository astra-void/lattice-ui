import { React, useControllableState } from "@lattice-ui/core";
import { SliderContextProvider } from "./context";
import { normalizeBounds, normalizeStep, pointerPositionToValue, snapValueToStep } from "./internals/math";
import type { SliderProps } from "./types";

const UserInputService = game.GetService("UserInputService");

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function isPointerStartInput(inputObject: InputObject) {
  return (
    inputObject.UserInputType === Enum.UserInputType.MouseButton1 ||
    inputObject.UserInputType === Enum.UserInputType.Touch
  );
}

export function SliderRoot(props: SliderProps) {
  const bounds = normalizeBounds(props.min ?? 0, props.max ?? 100);
  const min = bounds.min;
  const max = bounds.max;
  const step = normalizeStep(props.step ?? 1);
  const orientation = props.orientation ?? "horizontal";
  const disabled = props.disabled === true;
  const keyboardNavigation = props.keyboardNavigation === true;

  const defaultValue = snapValueToStep(props.defaultValue ?? min, min, max, step);

  const [valueState, setValueState] = useControllableState<number>({
    value: props.value,
    defaultValue,
    onChange: props.onValueChange,
  });

  const value = snapValueToStep(valueState, min, max, step);

  const trackRef = React.useRef<GuiObject>();
  const thumbRef = React.useRef<GuiObject>();
  const latestValueRef = React.useRef(value);

  React.useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const setValue = React.useCallback(
    (nextValue: number) => {
      if (disabled) {
        return;
      }

      const normalizedValue = snapValueToStep(nextValue, min, max, step);
      latestValueRef.current = normalizedValue;
      setValueState(normalizedValue);
    },
    [disabled, max, min, setValueState, step],
  );

  const commitValue = React.useCallback(
    (nextValue: number) => {
      if (disabled) {
        return;
      }

      const normalizedValue = snapValueToStep(nextValue, min, max, step);
      props.onValueCommit?.(normalizedValue);
    },
    [disabled, max, min, props.onValueCommit, step],
  );

  const activeDragInputRef = React.useRef<InputObject>();
  const moveConnectionRef = React.useRef<RBXScriptConnection>();
  const endConnectionRef = React.useRef<RBXScriptConnection>();

  const disconnectDragging = React.useCallback(() => {
    moveConnectionRef.current?.Disconnect();
    moveConnectionRef.current = undefined;

    endConnectionRef.current?.Disconnect();
    endConnectionRef.current = undefined;

    activeDragInputRef.current = undefined;
  }, []);

  const updateValueFromInput = React.useCallback(
    (inputObject: InputObject) => {
      const trackNode = trackRef.current;
      if (!trackNode) {
        return undefined;
      }

      const pointerPosition = new Vector2(inputObject.Position.X, inputObject.Position.Y);
      const nextValue = pointerPositionToValue(
        pointerPosition,
        trackNode.AbsolutePosition,
        trackNode.AbsoluteSize,
        min,
        max,
        step,
        orientation,
      );

      setValue(nextValue);
      return nextValue;
    },
    [max, min, orientation, setValue, step],
  );

  const finishDrag = React.useCallback(
    (inputObject?: InputObject) => {
      const activeDragInput = activeDragInputRef.current;
      if (!activeDragInput) {
        return;
      }

      if (inputObject) {
        const nextValue = updateValueFromInput(inputObject);
        if (nextValue !== undefined) {
          latestValueRef.current = nextValue;
        }
      }

      commitValue(latestValueRef.current);
      disconnectDragging();
    },
    [commitValue, disconnectDragging, updateValueFromInput],
  );

  const startDrag = React.useCallback(
    (inputObject: InputObject) => {
      if (disabled || !isPointerStartInput(inputObject)) {
        return;
      }

      activeDragInputRef.current = inputObject;
      const initialValue = updateValueFromInput(inputObject);
      if (initialValue !== undefined) {
        latestValueRef.current = initialValue;
      }

      moveConnectionRef.current?.Disconnect();
      endConnectionRef.current?.Disconnect();

      moveConnectionRef.current = UserInputService.InputChanged.Connect((changedInput) => {
        const activeDragInput = activeDragInputRef.current;
        if (!activeDragInput) {
          return;
        }

        if (activeDragInput.UserInputType === Enum.UserInputType.Touch) {
          if (changedInput.UserInputType !== Enum.UserInputType.Touch || changedInput !== activeDragInput) {
            return;
          }

          const touchValue = updateValueFromInput(changedInput);
          if (touchValue !== undefined) {
            latestValueRef.current = touchValue;
          }
          return;
        }

        if (changedInput.UserInputType !== Enum.UserInputType.MouseMovement) {
          return;
        }

        const mouseValue = updateValueFromInput(changedInput);
        if (mouseValue !== undefined) {
          latestValueRef.current = mouseValue;
        }
      });

      endConnectionRef.current = UserInputService.InputEnded.Connect((endedInput) => {
        const activeDragInput = activeDragInputRef.current;
        if (!activeDragInput) {
          return;
        }

        const endedTouch = activeDragInput.UserInputType === Enum.UserInputType.Touch && endedInput === activeDragInput;
        const endedMouse =
          activeDragInput.UserInputType === Enum.UserInputType.MouseButton1 &&
          endedInput.UserInputType === Enum.UserInputType.MouseButton1;

        if (!endedTouch && !endedMouse) {
          return;
        }

        finishDrag(endedTouch ? endedInput : undefined);
      });
    },
    [disabled, finishDrag, updateValueFromInput],
  );

  React.useEffect(() => {
    return () => {
      disconnectDragging();
    };
  }, [disconnectDragging]);

  const setTrackNode = React.useCallback((instance: Instance | undefined) => {
    trackRef.current = toGuiObject(instance);
  }, []);

  const setThumbNode = React.useCallback((instance: Instance | undefined) => {
    thumbRef.current = toGuiObject(instance);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      value,
      setValue,
      commitValue,
      min,
      max,
      step,
      orientation,
      disabled,
      keyboardNavigation,
      setTrackNode,
      setThumbNode,
      startDrag,
    }),
    [commitValue, disabled, keyboardNavigation, max, min, orientation, setThumbNode, setTrackNode, setValue, startDrag, step, value],
  );

  return <SliderContextProvider value={contextValue}>{props.children}</SliderContextProvider>;
}
