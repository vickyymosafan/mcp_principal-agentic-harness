---
name: responsive-first-browser-qa
description: Interact with a local website in a real browser, inspect every route across responsive viewport profiles, collect evidence, and drive repair loops.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Responsive-First Browser QA

## Priority
Responsive inspection is the first UI quality checkpoint after the local app is ready.

## Procedure
1. Confirm the server is ready and the base URL is loopback-only.
2. Discover routes from the router/source-of-truth and user requirements. Do not test only the homepage.
3. Run `localhost.inspect_responsive` over the supplied routes and the default 13-profile viewport matrix (320, 360, 375, 390, 414, 430, 768 portrait, 844 landscape, 1024 landscape, 1280, 1366, 1440, 1920 CSS px).
4. Inspect full-page screenshots, document width, overflow elements, out-of-bounds elements, page errors, failed requests, and HTTP errors.
5. Classify issues by root cause and shared component impact. Avoid one-off CSS patches when the root cause is a reusable component or token.
6. Delegate repair to the appropriate implementation agent with exact route, viewport, screenshot path, selector/DOM evidence, and acceptance condition.
7. Rerun the failed case and all affected viewport/route regression cases.
8. Reopen previously passed responsive checkpoints when later patches can affect layout.
9. Record a browser-report evidence item and only then update the responsive checkpoint to PASS.

## Acceptance
- No unintended document-level horizontal overflow.
- No critical content or controls clipped or unreachable.
- Navigation, forms, media, and primary workflows remain usable at supported profiles.
- Portrait/landscape and breakpoint boundaries are covered where relevant.
- Exceptions (e.g. intentional carousel overflow) are documented with selectors and reason.
- Screenshot and structured browser metrics are retained.

Do not claim all physical devices are covered. Use a documented viewport/browser support matrix and physical-device validation for platform-specific behavior.
