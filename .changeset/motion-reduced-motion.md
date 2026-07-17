---
"@lattice-ui/motion": patch
---

Motion policy now honors the platform Reduced Motion accessibility setting (GuiService.ReducedMotionEnabled) by default, disabling motion even when no MotionProvider is mounted. Opt out via the new `respectSystemReducedMotion={false}` prop on MotionProvider.
