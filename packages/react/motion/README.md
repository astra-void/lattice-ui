# @lattice-ui/react-motion

Motion runtime for Lattice UI primitives. It owns the frame scheduler, instance property interpolation, and the motion policy, so primitives and apps animate through these hooks instead of running their own render loops.

## Hooks

- `usePresenceMotion` / `usePresenceMotionController`: enter/exit motion for mounted content, driven by a `PresenceMotionConfig` (`initial`, `reveal`, `exit`).
- `useResponseMotion`: follows a value toward its active or inactive target (fills, thumbs, selection state).
- `useFeedbackEffect`: a short accent and recovery for transient feedback.
- `useLoopMotion`: a continuous loop of one or more properties while `active` is true, such as a spinner's rotation or a pulse.

Every hook returns a ref to attach to the instance it animates.

## Loop motion

```tsx
const spin: LoopMotionConfig = {
  from: { Rotation: 0 },
  to: { Rotation: 360 },
  duration: 1, // seconds per cycle
};

const ref = useLoopMotion<Frame>(loading, spin);
```

- Each cycle interpolates linearly from `from` to `to` over `duration` seconds. `repeat: "restart"` (the default) begins every cycle at `from`, which is seamless for a full turn; `repeat: "reverse"` plays every other cycle back to `from`.
- A property missing from `from` loops from the value the instance has when the loop starts.
- Re-rendering with a fresh config object of the same shape keeps the running cycle, and a new `duration` keeps the current phase.
- When `active` is false, or the motion policy disables motion, the loop stops and the instance rests at `from`.

## Policy

`MotionProvider` sets the policy for its subtree. `disableAllMotion` (or `mode="none"`) makes every hook apply its end values immediately, and loops do not run. The platform reduced-motion setting (`GuiService.ReducedMotionEnabled`) does the same unless `respectSystemReducedMotion={false}`. Read the resolved policy with `useMotionPolicy`.

## Recipes and tokens

The package ships no presence recipes: where a reveal ends is appearance, so a `transition` is a `PresenceMotionConfig` written by the consumer. Response and feedback recipes (`createProgressResponseRecipe`, `createPressFeedbackEffect`, …) only carry timing. `motionDuration`, `motionExitDuration`, `motionOffset`, `motionSettle`, `createPlacementOffset` and `motionTargets` are there for building your own configs.

`motionTargets` declares which properties a config may write: `appearance` targets own transparency, colour and `Rotation`; `offsetWrapper`, `sizeWrapper` and `layout` targets also own `Position`, `Size`, or both.
