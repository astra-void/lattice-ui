import {
  motionSettle,
  motionTargets as motionTargetContracts,
  type ResponseMotionConfig,
  useResponseMotion,
} from "@lattice-ui/react-motion";
import { composeRefs, getElementRef, getPassthroughProps, React } from "@lattice-ui/react-runtime";
import { useSwitchContext } from "./context";
import type { SwitchThumbProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See SwitchRoot: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

const UNCHECKED_THUMB_POSITION = UDim2.fromScale(0, 0);
const ZERO_SIZE = UDim2.fromScale(0, 0);

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

function toUDim2(value: unknown) {
  return typeIs(value, "UDim2") ? value : undefined;
}

/**
 * The thumb travels the full width of its track, so the checked position depends on how wide the
 * consumer sized it. The size itself stays a consumer decision; only the resulting geometry is
 * state-driven.
 */
function getCheckedThumbPosition(size: UDim2) {
  return new UDim2(1 - size.X.Scale, -size.X.Offset, 0, 0);
}

export function SwitchThumb(props: SwitchThumbProps) {
  const switchContext = useSwitchContext();
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  const child = props.children;
  const childProps =
    props.asChild && React.isValidElement(child) ? toGuiPropBag((child as { props?: unknown }).props) : undefined;
  // Only a size the consumer actually declared can inform the travel distance; nothing is invented
  // when they size the thumb some other way.
  const declaredSize = toUDim2(passthrough.Size) ?? toUDim2(childProps?.Size);
  const thumbSize = declaredSize ?? ZERO_SIZE;

  const motionTargets = React.useMemo(
    () => ({
      active: { Position: getCheckedThumbPosition(thumbSize) },
      inactive: { Position: UNCHECKED_THUMB_POSITION },
    }),
    [thumbSize],
  );
  const motionConfig = React.useMemo<ResponseMotionConfig>(
    () => ({
      target: motionTargetContracts.offsetWrapper("switch thumb response"),
      settle: { duration: motionSettle.toggle, tempo: "swift", tone: "responsive" },
    }),
    [],
  );

  const motionRef = useResponseMotion<Frame>(switchContext.checked, motionTargets, motionConfig);
  const ref = composeRefs<Frame>(passthrough.ref as never, motionRef);

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[SwitchThumb] `asChild` requires a child element.");
    }

    const resolvedChildProps = childProps ?? {};
    const childRef = getElementRef<Instance>(child);

    // Motion owns its own host element: the animated `Position` lands on this wrapper, never on the
    // consumer's element, which is pinned inside it.
    return (
      <frame {...NEUTRAL_PROPS} {...passthrough} Size={declaredSize} ref={ref}>
        {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
          ...resolvedChildProps,
          Position: UDim2.fromOffset(0, 0),
          ref: composeRefs(childRef),
        })}
      </frame>
    );
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} ref={ref}>
      {props.children}
    </frame>
  );
}
