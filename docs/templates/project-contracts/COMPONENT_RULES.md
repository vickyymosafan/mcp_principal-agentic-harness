# Component Rules

## Component ownership
- Component source of truth: TBD
- Shared component promotion criteria: repeated stable behavior and shared change reason.
- Avoid duplicate implementations for the same responsibility.

## Contract
For each shared component document:
- Purpose and semantic element.
- Props / inputs and public events.
- Variants and sizes.
- States: default, hover, focus-visible, active, disabled, loading, error, selected, expanded.
- Responsive behavior.
- Keyboard and touch behavior.
- Accessible name and state semantics.
- Design tokens consumed.
- Unit, interaction and visual tests.

## Rules
- Components consume semantic tokens, not arbitrary hardcoded colors.
- Keep behavior separate from presentation when it improves cohesion.
- Interactive-looking elements must perform their advertised action.
- Do not add variants without a real use case.
