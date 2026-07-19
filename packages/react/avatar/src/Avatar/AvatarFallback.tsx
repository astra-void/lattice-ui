import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useAvatarContext } from "./context";
import { resolveAvatarFallbackVisible } from "./state";
import type { AvatarFallbackProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textlabel` renders an opaque grey box
// labelled "Label". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, text) to the consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function AvatarFallback(props: AvatarFallbackProps) {
  const avatarContext = useAvatarContext();
  const visible = resolveAvatarFallbackVisible(avatarContext.status, avatarContext.delayElapsed);

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Visible: visible,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[AvatarFallback] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...passthrough} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return (
    <textlabel {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
      {props.children}
    </textlabel>
  );
}
