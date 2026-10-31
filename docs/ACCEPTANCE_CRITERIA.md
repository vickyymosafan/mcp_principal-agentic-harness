# Acceptance Criteria

## Harness runtime
- [ ] MCP server starts over stdio without writing non-protocol data to stdout.
- [ ] Host can list the registered tools, prompt, and architecture resource.
- [ ] Plan creation persists tasks and checkpoints.
- [ ] Ready-task discovery respects dependencies.
- [ ] Duplicate task claims are rejected.
- [ ] Task completion requiring evidence is rejected without evidence IDs.
- [ ] PASS checkpoint is rejected without evidence.
- [ ] NOT_APPLICABLE is rejected without a rationale.
- [ ] Final gate remains blocked while required checkpoints are unresolved.

## Local development and browser
- [ ] Dev server starts only from an allowlisted package script.
- [ ] Status and logs are retrievable; only owned child processes can be stopped.
- [ ] Browser refuses non-loopback URLs and cross-origin redirects.
- [ ] Every requested route is tested across every selected viewport.
- [ ] Full-page screenshots and structured responsive reports are saved.
- [ ] Horizontal overflow, page errors, failed requests and HTTP errors are reported.
- [ ] Interaction scenarios execute only explicit steps; risky selectors are blocked by default.
- [ ] Repair loop reruns the failed case and affected regression profiles.

## Engineering quality
- [ ] Domain code does not depend on infrastructure packages.
- [ ] External input validates at interface boundaries.
- [ ] Workspace paths are constrained.
- [ ] Skills comply with Agent Skills frontmatter requirements.
- [ ] All 70 module IDs are unique and fully described.
- [ ] Reference provenance preserves verified, partial and unverified status.

## Release
- [ ] All required checkpoints have current evidence.
- [ ] Independent verification has been performed.
- [ ] Known limitations and residual risks are documented.
- [ ] Human approval is captured for external/destructive actions.
