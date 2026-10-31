# ADR 0002: Localhost-first UI verification

- Status: Accepted
- Decision: Every UI implementation must be verified against a running localhost app, with responsive coverage as the first quality checkpoint.

## Consequences
- Browser automation is an infrastructure adapter.
- Browser findings are evidence, not subjective statements.
- Repair invalidates affected evidence and triggers regression.
- Physical-device validation remains necessary for platform-specific behaviors.
