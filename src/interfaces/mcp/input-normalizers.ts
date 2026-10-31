import type { CreatePlanInput } from '../../application/task-planner.js';
import type { InteractionAction } from '../../domain/ports.js';
import type { WorkDomain } from '../../domain/models.js';

/**
 * Shape emitted by the MCP/Zod adapter. With exactOptionalPropertyTypes,
 * optional input fields may be present with `undefined`, while domain inputs
 * represent absence by omitting the property entirely.
 */
export interface CreatePlanToolInput {
  title: string;
  request: string;
  domains?: WorkDomain[] | undefined;
  maxRepairIterations?: number | undefined;
}

export interface InteractionActionToolInput {
  action: InteractionAction['action'];
  selector: string;
  value?: string | undefined;
  timeoutMs?: number | undefined;
}

/** Convert transport input into the stricter application-layer contract. */
export function toCreatePlanInput(input: CreatePlanToolInput): CreatePlanInput {
  return {
    title: input.title,
    request: input.request,
    ...(input.domains !== undefined ? { domains: input.domains } : {}),
    ...(input.maxRepairIterations !== undefined
      ? { maxRepairIterations: input.maxRepairIterations }
      : {})
  };
}

/** Remove absent optional values before crossing into the domain port. */
export function toInteractionActions(
  actions: readonly InteractionActionToolInput[]
): InteractionAction[] {
  return actions.map(action => ({
    action: action.action,
    selector: action.selector,
    ...(action.value !== undefined ? { value: action.value } : {}),
    ...(action.timeoutMs !== undefined ? { timeoutMs: action.timeoutMs } : {})
  }));
}
