---
"lattice-ui": patch
---

Pressing Ctrl+C at a text or y/N prompt now cancels the run quietly with exit code 130, the same as the list prompts. It used to print an `AbortError` stack trace and exit 1 as an unexpected failure.
