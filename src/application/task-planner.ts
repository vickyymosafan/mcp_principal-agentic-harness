import { randomUUID } from 'node:crypto';
import type { ExecutionPlan, TaskNode, WorkDomain } from '../domain/models.js';
import { QUALITY_DIMENSIONS } from '../domain/models.js';

const now = () => new Date().toISOString();

export interface CreatePlanInput {
  title: string;
  request: string;
  domains?: WorkDomain[];
  maxRepairIterations?: number;
}

const DOMAIN_RULES: Array<{ domain: WorkDomain; pattern: RegExp }> = [
  { domain: 'frontend', pattern: /frontend|website|web app|ui|ux|page|dashboard|portfolio|landing/i },
  { domain: 'backend', pattern: /backend|api|server|service|endpoint/i },
  { domain: 'design', pattern: /design|interface|layout|theme|typography|color|component/i },
  { domain: 'responsive', pattern: /responsive|mobile|tablet|viewport|breakpoint/i },
  { domain: 'threejs', pattern: /three\.?js|3d|webgl|shader|glsl|scene/i },
  { domain: 'motion', pattern: /animation|motion|transition|gesture|scroll effect/i },
  { domain: 'security', pattern: /security|auth|permission|privacy|vulnerability/i },
  { domain: 'data', pattern: /database|migration|schema|data model/i }
];

function inferDomains(request: string): WorkDomain[] {
  const found = DOMAIN_RULES.filter(rule => rule.pattern.test(request)).map(rule => rule.domain);
  return found.length > 0 ? [...new Set(found)] : ['frontend'];
}

function createTask(planId: string, partial: Omit<TaskNode, 'id' | 'planId' | 'status' | 'evidenceIds' | 'claimedBy' | 'createdAt' | 'updatedAt' | 'completedAt' | 'failureReason'>): TaskNode {
  const timestamp = now();
  return {
    id: randomUUID(), planId, ...partial, status: 'pending', evidenceIds: [], claimedBy: null,
    createdAt: timestamp, updatedAt: timestamp, completedAt: null, failureReason: null
  };
}

export class TaskPlanner {
  constructor(private readonly defaultMaxRepairIterations = 5) {}

  create(input: CreatePlanInput): { plan: ExecutionPlan; tasks: TaskNode[] } {
    const planId = randomUUID();
    const selectedDomains: WorkDomain[] = input.domains?.length ? [...new Set(input.domains)] : inferDomains(input.request);
    const hasUi = selectedDomains.some(domain => ['frontend', 'design', 'responsive', 'threejs', 'motion'].includes(domain));
    const domains: WorkDomain[] = hasUi && !selectedDomains.includes('frontend')
      ? ['frontend', ...selectedDomains]
      : selectedDomains;
    const hasThreeJs = domains.includes('threejs');
    const tasks: TaskNode[] = [];
    const add = (task: Parameters<typeof createTask>[1]) => {
      const created = createTask(planId, task);
      tasks.push(created);
      return created.id;
    };

    const discovery = add({
      title: 'Discover requirements and repository context',
      description: 'Extract acceptance criteria, inspect source-of-truth files, identify unknowns and map affected areas.',
      ownerRole: 'discovery-lead', skillIds: ['repository-discovery', 'requirements-evidence'],
      moduleIds: [1, 20, 39, 49, 64, 67], domains, dependsOn: [], parallelGroup: null, requiredEvidence: true
    });
    const governance = add({
      title: 'Resolve policy, permissions and risk profile',
      description: 'Apply least privilege, privacy boundaries, safe defaults, tool contracts and risk-based autonomy.',
      ownerRole: 'governance-lead', skillIds: ['security-review', 'agentic-task-delegation'],
      moduleIds: [5, 8, 23, 29, 31, 33, 38, 45, 59, 62, 66], domains: ['security'], dependsOn: [discovery], parallelGroup: 'planning', requiredEvidence: true
    });
    const architecture = add({
      title: 'Design architecture and change boundaries',
      description: 'Define affected layers, dependency direction, contracts, migration risks and patch boundaries.',
      ownerRole: 'architecture-lead', skillIds: ['clean-architecture-development', 'repository-discovery'],
      moduleIds: [19, 21, 35, 40, 50, 56, 57, 58, 69, 70], domains, dependsOn: [discovery], parallelGroup: 'planning', requiredEvidence: true
    });
    const design = hasUi ? add({
      title: 'Prepare design and experience contract',
      description: 'Resolve design direction, component system, color, typography, motion and responsive constraints.',
      ownerRole: 'design-lead', skillIds: ['design-systems-governance', 'design-direction', 'typography-engineering', 'color-theming', 'motion-animation'],
      moduleIds: [13, 15, 17, 18, 21, 22], domains: ['design', ...domains.filter(d => ['frontend', 'responsive', 'threejs', 'motion'].includes(d))],
      dependsOn: [discovery], parallelGroup: 'planning', requiredEvidence: true
    }) : null;

    const implementationIds: string[] = [];
    for (const domain of domains.filter(d => d !== 'release' && d !== 'responsive' && d !== 'design')) {
      const role = domain === 'frontend' ? 'frontend-developer' : domain === 'backend' ? 'backend-developer' : domain === 'threejs' ? 'threejs-developer' : domain === 'motion' ? 'motion-developer' : domain === 'security' ? 'security-engineer' : 'data-engineer';
      const skills = domain === 'frontend' ? ['frontend-implementation', 'design-systems-governance'] : domain === 'backend' ? ['backend-implementation', 'clean-architecture-development'] : domain === 'threejs' ? ['threejs-shaders'] : domain === 'motion' ? ['motion-animation'] : domain === 'security' ? ['security-review'] : ['clean-architecture-development'];
      implementationIds.push(add({
        title: `Implement ${domain} workstream`,
        description: `Implement the ${domain} workstream within approved architecture, scope, design contract and security boundaries.`,
        ownerRole: role, skillIds: skills, moduleIds: [6, 19, 21, 25, 26, 37, 57, 65], domains: [domain],
        dependsOn: [governance, architecture, ...(design ? [design] : [])], parallelGroup: 'implementation', requiredEvidence: true
      }));
    }

    const implementationJoin = implementationIds.length ? implementationIds : [architecture];
    const qaTasks: string[] = [];
    if (hasUi) {
      const responsiveTask = add({
        title: 'Responsive-first localhost browser inspection',
        description: 'Inspect every supplied route across the viewport matrix, collect screenshots and DOM metrics, repair defects, then re-run affected profiles until PASS or BLOCKED.',
        ownerRole: 'responsive-qa-agent', skillIds: ['responsive-first-browser-qa', 'local-development-runtime'],
        moduleIds: [9, 15, 18, 39, 42, 43, 63], domains: ['responsive'], dependsOn: implementationJoin, parallelGroup: null, requiredEvidence: true
      });
      qaTasks.push(responsiveTask);
      const layout = add({ title: 'Inspect and repair layout and visual structure', description: 'Audit hierarchy, alignment, spacing, overflow, clipping, composition and design-system consistency.', ownerRole: 'visual-qa-agent', skillIds: ['ui-layout-repair', 'design-direction'], moduleIds: [13, 15, 17, 18, 22, 61, 63], domains: ['design'], dependsOn: [responsiveTask], parallelGroup: null, requiredEvidence: true });
      const interaction = add({ title: 'Inspect functional interaction states', description: 'Test navigation, forms, controls, keyboard and touch interactions with explicit non-destructive scenarios.', ownerRole: 'functional-qa-agent', skillIds: ['interaction-functional-qa'], moduleIds: [15, 18, 34, 60, 63], domains: ['frontend'], dependsOn: [layout], parallelGroup: null, requiredEvidence: true });
      const visual = add({ title: 'Inspect typography, color and motion', description: 'Validate typography scale, semantic colors, contrast, component states, animation intent and reduced-motion behavior.', ownerRole: 'design-qa-agent', skillIds: ['typography-engineering', 'color-theming', 'motion-animation'], moduleIds: [13, 15, 17, 21, 63], domains: ['design', 'motion'], dependsOn: [interaction], parallelGroup: null, requiredEvidence: true });
      const threeDReview = hasThreeJs ? add({ title: 'Inspect 3D scene, shader and lifecycle stability', description: 'Inspect scene composition, shader compilation, resource disposal, deterministic scroll behavior, GPU evidence and device fallback.', ownerRole: 'threejs-qa-agent', skillIds: ['threejs-shaders', 'performance-qa'], moduleIds: [15, 18, 19, 30, 34, 44, 63], domains: ['threejs'], dependsOn: [visual], parallelGroup: null, requiredEvidence: true }) : null;
      const accessibility = add({ title: 'Run accessibility verification', description: 'Test semantic structure, keyboard order, focus visibility, contrast, zoom and reduced motion.', ownerRole: 'accessibility-qa-agent', skillIds: ['accessibility-qa'], moduleIds: [15, 17, 18, 59, 63], domains: ['frontend'], dependsOn: [threeDReview ?? visual], parallelGroup: null, requiredEvidence: true });
      qaTasks.push(layout, interaction, visual, ...(threeDReview ? [threeDReview] : []), accessibility);
    }
    const securityQA = add({ title: 'Run security and reliability checks', description: 'Inspect exposed surfaces, dependencies, input handling, runtime errors and policy conformance.', ownerRole: 'security-qa-agent', skillIds: ['security-review'], moduleIds: [7, 8, 29, 37, 38, 45, 59], domains: ['security'], dependsOn: [...implementationJoin, ...qaTasks.slice(-1)], parallelGroup: 'final-assurance', requiredEvidence: true });
    const performanceQA = hasUi ? add({ title: 'Run performance and runtime checks', description: 'Inspect build output, loading, console/network errors, browser rendering and relevant GPU/frame budgets.', ownerRole: 'performance-qa-agent', skillIds: ['performance-qa', 'threejs-shaders'], moduleIds: [12, 15, 26, 30, 36, 44], domains: ['frontend', ...domains.filter(d => ['threejs', 'motion'].includes(d))], dependsOn: [...implementationJoin, ...qaTasks.slice(-1)], parallelGroup: 'final-assurance', requiredEvidence: true }) : null;
    const finalRegression = add({
      title: 'Run final regression and quality gate',
      description: 'Re-run impacted checks, verify evidence freshness, deduplicate findings and evaluate all required acceptance criteria.',
      ownerRole: 'independent-assurance-lead', skillIds: ['evidence-and-release-governance', 'agentic-quality-governance'],
      moduleIds: [9, 10, 14, 16, 39, 43, 51, 54, 61, 63], domains, dependsOn: [securityQA, ...(performanceQA ? [performanceQA] : [])], parallelGroup: null, requiredEvidence: true
    });
    add({
      title: 'Prepare release and update engineering records',
      description: 'Prepare a release decision packet, verification receipt, documentation updates and handoff. Do not deploy without explicit authorization.',
      ownerRole: 'release-lead', skillIds: ['evidence-and-release-governance'],
      moduleIds: [10, 12, 32, 36, 46, 53], domains: ['release'], dependsOn: [finalRegression], parallelGroup: null, requiredEvidence: true
    });

    const timestamp = now();
    const plan: ExecutionPlan = {
      id: planId, title: input.title, request: input.request, domains, taskIds: tasks.map(task => task.id),
      checkpointIds: QUALITY_DIMENSIONS.filter(item => {
        if (item.id === '3d-rendering') return hasThreeJs;
        if (item.id === 'motion') return domains.includes('motion');
        if (['responsive', 'layout', 'interaction', 'typography-color', 'accessibility'].includes(item.id)) return hasUi;
        return true;
      }).map(item => item.id),
      maxRepairIterations: Math.max(1, Math.min(input.maxRepairIterations ?? this.defaultMaxRepairIterations, 12)), repairIterations: 0,
      createdAt: timestamp, updatedAt: timestamp
    };
    return { plan, tasks };
  }
}
