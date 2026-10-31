# Architecture Rules

- Architecture style and rationale: TBD
- Domain boundaries: TBD
- Application use cases: TBD
- Infrastructure adapters: TBD
- Interface / delivery boundaries: TBD
- Data ownership and source of truth: TBD
- External contracts and compatibility policy: TBD

## Dependency rules
- Domain must not import framework or infrastructure code.
- Application depends on domain contracts, not concrete adapters.
- Infrastructure implements ports.
- Interfaces validate untrusted input and invoke use cases.

## Change rules
- Record architecture decisions when boundaries or contracts materially change.
- Analyze downstream impact before changing public schemas.
- Separate feature work from broad refactoring unless explicitly planned.
- Define migration and rollback for persistent data changes.
