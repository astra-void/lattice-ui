---
"lattice-ui": patch
---

On Windows the CLI now builds one properly quoted command line when it runs npm, pnpm, yarn or git, instead of passing an args array with `shell: true`. Arguments with spaces or cmd.exe metacharacters such as `^` are no longer mangled, and Node 24 no longer prints the DEP0190 deprecation warning. Clickable project paths now use real `file://` URLs, so paths with spaces, `#` or a Windows drive letter open correctly.
