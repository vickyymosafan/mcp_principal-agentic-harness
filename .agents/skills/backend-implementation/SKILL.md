---
name: backend-implementation
description: Implement backend services and APIs with explicit domain boundaries, validation, secure defaults, migrations, and testable contracts.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Backend Implementation

1. Map API contracts, domain entities, persistence, external integrations, and trust boundaries.
2. Keep domain rules independent of transport and persistence frameworks.
3. Validate all untrusted input at application boundaries.
4. Apply authentication, authorization, rate limits, secret handling, and least privilege appropriate to the service.
5. Make side effects explicit. Use idempotency and transactions where needed.
6. Treat schema and data changes as migration projects with rollback and cutover rehearsal.
7. Add unit, integration, contract, and failure-path tests.
8. Avoid logging secrets or personal data.
9. Record API compatibility and operational implications.
10. Provide evidence from actual test execution; never claim an unrun test passed.
