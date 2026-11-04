---
"@lattice-ui/react-motion": minor
"@lattice-ui/react-progress": patch
---

Add `useLoopMotion`, a continuous property loop driven by the motion scheduler: each cycle interpolates `from` to `to` over `duration` seconds, restarting or reversing (`repeat`). It stops and rests at `from` when inactive or when the motion policy disables motion, including the platform reduced-motion setting. `Progress.Spinner` now rotates through it instead of writing `Rotation` from its own `RunService.Heartbeat` connection, so it no longer spins with motion disabled or reduced motion on.
