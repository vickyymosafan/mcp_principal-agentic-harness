# Responsive Rules

## Supported matrix
- Supported browsers and devices: TBD
- Required viewport profiles: 320, 360, 375, 390, 414, 430, 768, 844 landscape, 1024, 1280, 1366, 1440 and 1920 CSS pixels, plus project-specific breakpoints.
- Test orientations: portrait and landscape where applicable.

## Layout contract
- No unintended document-level horizontal overflow.
- No clipped text, overlapping controls or inaccessible off-screen actions.
- Images, video, SVG and canvas preserve intended aspect ratio and fit their containers.
- Navigation, forms, dialogs, tables and fixed/sticky UI remain usable.
- DOM order remains meaningful and keyboard order follows the intended reading order.

## Verification
- Inspect every in-scope route at all supported profiles.
- Inspect widths immediately below and above each project breakpoint.
- Capture screenshot and DOM metrics for failures and passes.
- After repair, rerun the failing case and impacted regression profiles.
- Physical-device validation is required for platform-specific behavior not represented by emulation.

## Exceptions
- Allowed overflow selector and reason: TBD
- Owner and review date: TBD
