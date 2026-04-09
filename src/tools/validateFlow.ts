// Best-practices validation for Power Automate flow definitions.
// Operates entirely on the flow's JSON definition — no additional API calls required.

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  rule: string;
  message: string;
  actionName?: string;
}

export interface ValidationResult {
  /** Score from 0 (worst) to 100 (best). */
  score: number;
  issues: ValidationIssue[];
  passed: string[];
}

interface ActionDefinition {
  type?: string;
  kind?: string;
  inputs?: Record<string, unknown>;
  actions?: Record<string, ActionDefinition>;
  else?: { actions?: Record<string, ActionDefinition> };
  branches?: Record<string, { actions?: Record<string, ActionDefinition> }>;
  foreach?: string;
  until?: unknown;
  runAfter?: Record<string, string[]>;
  metadata?: Record<string, unknown>;
}

interface TriggerDefinition {
  type?: string;
  kind?: string;
  recurrence?: { frequency?: string; interval?: number };
  inputs?: Record<string, unknown>;
}

interface FlowDefinition {
  triggers?: Record<string, TriggerDefinition>;
  actions?: Record<string, ActionDefinition>;
  parameters?: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenActions(
  actions: Record<string, ActionDefinition>,
  path: string[] = []
): Array<{ name: string; action: ActionDefinition; depth: number }> {
  const results: Array<{ name: string; action: ActionDefinition; depth: number }> = [];
  for (const [name, action] of Object.entries(actions)) {
    results.push({ name, action, depth: path.length });
    if (action.actions) {
      results.push(...flattenActions(action.actions, [...path, name]));
    }
    if (action.else?.actions) {
      results.push(...flattenActions(action.else.actions, [...path, name, 'else']));
    }
    if (action.branches) {
      for (const branch of Object.values(action.branches)) {
        if (branch.actions) {
          results.push(...flattenActions(branch.actions, [...path, name]));
        }
      }
    }
  }
  return results;
}

function isDefaultName(name: string): boolean {
  // Power Automate generates names like "Compose", "Compose_2", "Send_an_email_(V2)",
  // "Condition", "Condition_2", etc. We flag names that haven't been customised.
  const defaultPatterns = [
    /^Compose(_\d+)?$/,
    /^Condition(_\d+)?$/,
    /^Apply_to_each(_\d+)?$/,
    /^Do_until(_\d+)?$/,
    /^Scope(_\d+)?$/,
    /^Switch(_\d+)?$/,
    /^Terminate(_\d+)?$/,
    /^Initialize_variable(_\d+)?$/,
    /^Set_variable(_\d+)?$/,
    /^Increment_variable(_\d+)?$/,
    /^Append_to_array_variable(_\d+)?$/,
    /^Append_to_string_variable(_\d+)?$/,
    /^Send_an_email(_\(V\d\))?(_\d+)?$/i,
    /^HTTP(_\d+)?$/,
    /^Parse_JSON(_\d+)?$/,
    /^Response(_\d+)?$/,
    /^Get_items(_\d+)?$/i,
    /^Get_item(_\d+)?$/i,
    /^Create_item(_\d+)?$/i,
    /^Update_item(_\d+)?$/i,
    /^Delete_item(_\d+)?$/i,
    /^Post_a_message(_in_a_channel)?(_\d+)?$/i,
    /^Send_message(_\d+)?$/i,
    /^Get_file_content(_\d+)?$/i,
    /^Create_file(_\d+)?$/i,
  ];
  return defaultPatterns.some((p) => p.test(name));
}

// ── Rules ─────────────────────────────────────────────────────────────────────

function checkErrorHandling(
  allActions: Array<{ name: string; action: ActionDefinition }>,
  issues: ValidationIssue[],
  passed: string[]
): void {
  const scopes = allActions.filter(({ action }) => action.type === 'Scope');
  if (scopes.length === 0) {
    issues.push({
      severity: 'warning',
      rule: 'no-error-handling',
      message:
        'No Scope actions found. Wrap critical sections in a Scope with a "Configure run after" ' +
        'error handler to catch and handle failures gracefully.',
    });
    return;
  }
  // Check whether any scope has a sibling that runs after it on failure (error handler pattern)
  let hasHandler = false;
  for (const { name } of scopes) {
    for (const { action } of allActions) {
      const runAfter = action.runAfter ?? {};
      const deps = runAfter[name] ?? [];
      if (deps.some((s) => s === 'Failed' || s === 'TimedOut')) {
        hasHandler = true;
        break;
      }
    }
    if (hasHandler) {break;}
  }
  if (!hasHandler) {
    issues.push({
      severity: 'warning',
      rule: 'no-error-handling',
      message:
        'Scope actions exist but none have a downstream error handler configured via ' +
        '"Configure run after". Add a handler action that runs after the Scope fails.',
    });
  } else {
    passed.push('error-handling: Scope with error handler detected.');
  }
}

function checkApprovalOutcomes(
  allActions: Array<{ name: string; action: ActionDefinition }>,
  issues: ValidationIssue[],
  passed: string[]
): void {
  const approvals = allActions.filter(
    ({ action }) =>
      action.type === 'OpenApiConnection' &&
      typeof (action.inputs as Record<string, unknown>)?.operationId === 'string' &&
      ((action.inputs as Record<string, string>).operationId as string)
        .toLowerCase()
        .includes('approval')
  );
  if (approvals.length === 0) {
    return; // no approvals in this flow
  }
  for (const { name } of approvals) {
    const hasBranch = allActions.some(({ action }) => {
      const runAfter = action.runAfter ?? {};
      return Object.keys(runAfter).includes(name) && action.type === 'If';
    });
    if (!hasBranch) {
      issues.push({
        severity: 'warning',
        rule: 'unhandled-approval-outcome',
        message: `Action "${name}" sends an approval but the flow may not branch on Approve/Reject. ` +
          'Add a Condition to check the approval outcome.',
        actionName: name,
      });
    }
  }
  if (!issues.some((i) => i.rule === 'unhandled-approval-outcome')) {
    passed.push('approval-outcomes: Approval result is evaluated in a condition.');
  }
}

function checkHighFrequencyTrigger(
  triggers: Record<string, TriggerDefinition>,
  issues: ValidationIssue[],
  passed: string[]
): void {
  for (const [name, trigger] of Object.entries(triggers)) {
    const rec = trigger.recurrence;
    if (!rec) {continue;}
    const freq = rec.frequency?.toLowerCase() ?? '';
    const interval = rec.interval ?? 1;
    const isHighFreq =
      (freq === 'second') ||
      (freq === 'minute' && interval < 1);
    if (isHighFreq) {
      issues.push({
        severity: 'warning',
        rule: 'high-frequency-recurrence',
        message:
          `Trigger "${name}" fires every ${interval} ${freq}(s). ` +
          'Very frequent recurrence increases API consumption and may hit throttle limits.',
        actionName: name,
      });
    } else {
      passed.push(`trigger-frequency: Trigger "${name}" has a reasonable recurrence interval.`);
    }
  }
}

function checkNestedLoops(
  allActions: Array<{ name: string; action: ActionDefinition; depth: number }>,
  issues: ValidationIssue[],
  passed: string[]
): void {
  const nestedLoops = allActions.filter(
    ({ action, depth }) =>
      (action.type === 'Foreach' || action.type === 'Until') && depth >= 1
  );
  if (nestedLoops.length > 0) {
    for (const { name } of nestedLoops) {
      issues.push({
        severity: 'warning',
        rule: 'nested-loops',
        message:
          `Action "${name}" is a loop nested inside another loop or scope. ` +
          'Nested loops can cause exponential run durations and high API call counts. ' +
          'Consider batching with Select/Filter or moving logic to a child flow.',
        actionName: name,
      });
    }
  } else {
    passed.push('nested-loops: No nested Apply to each loops detected.');
  }
}

function checkDefaultNames(
  allActions: Array<{ name: string; action: ActionDefinition }>,
  issues: ValidationIssue[],
  passed: string[]
): void {
  const defaultNamed = allActions.filter(({ name }) => isDefaultName(name));
  if (defaultNamed.length > 0) {
    for (const { name } of defaultNamed.slice(0, 10)) {
      // Cap at 10 to avoid noisy output for large flows
      issues.push({
        severity: 'info',
        rule: 'default-action-name',
        message:
          `Action "${name}" still has a generated default name. ` +
          'Rename actions to describe their purpose to improve readability and maintainability.',
        actionName: name,
      });
    }
  } else {
    passed.push('action-names: All actions appear to have custom names.');
  }
}

function checkHttpTimeouts(
  allActions: Array<{ name: string; action: ActionDefinition }>,
  issues: ValidationIssue[],
  passed: string[]
): void {
  const httpActions = allActions.filter(({ action }) => action.type === 'Http');
  const missingTimeout = httpActions.filter(({ action }) => {
    const inputs = (action.inputs ?? {}) as Record<string, unknown>;
    return !inputs.retryPolicy && !inputs.timeout;
  });
  if (missingTimeout.length > 0) {
    for (const { name } of missingTimeout) {
      issues.push({
        severity: 'info',
        rule: 'http-no-timeout',
        message:
          `HTTP action "${name}" has no retry policy or explicit timeout configured. ` +
          'Consider adding a retry policy and a timeout to handle transient failures.',
        actionName: name,
      });
    }
  } else if (httpActions.length > 0) {
    passed.push('http-timeouts: All HTTP actions have retry policies or timeouts configured.');
  }
}

function checkVariablesInLoops(
  allActions: Array<{ name: string; action: ActionDefinition; depth: number }>,
  issues: ValidationIssue[],
  passed: string[]
): void {
  const initInsideLoop = allActions.filter(
    ({ action, depth }) => action.type === 'InitializeVariable' && depth >= 1
  );
  if (initInsideLoop.length > 0) {
    for (const { name } of initInsideLoop) {
      issues.push({
        severity: 'warning',
        rule: 'variable-init-in-loop',
        message:
          `Action "${name}" initialises a variable inside a loop. ` +
          'Variables should be initialised before the loop begins to avoid re-initialisation ' +
          'on every iteration.',
        actionName: name,
      });
    }
  } else {
    passed.push('variable-init: No variable initialisation inside loops detected.');
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Validates a Power Automate flow definition object against best-practice rules.
 * The definition is the value of `flow.properties.definition` from the API response.
 */
export function validateFlowDefinition(definition: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const passed: string[] = [];

  const def = definition as FlowDefinition;
  const triggers = def?.triggers ?? {};
  const rootActions = def?.actions ?? {};
  const allActions = flattenActions(rootActions);

  checkErrorHandling(allActions, issues, passed);
  checkApprovalOutcomes(allActions, issues, passed);
  checkHighFrequencyTrigger(triggers, issues, passed);
  checkNestedLoops(allActions, issues, passed);
  checkDefaultNames(allActions, issues, passed);
  checkHttpTimeouts(allActions, issues, passed);
  checkVariablesInLoops(allActions, issues, passed);

  // Score: start at 100, deduct by severity
  const deductions = issues.reduce((sum, issue) => {
    if (issue.severity === 'error') {return sum + 20;}
    if (issue.severity === 'warning') {return sum + 10;}
    return sum + 3; // info
  }, 0);
  const score = Math.max(0, 100 - deductions);

  return { score, issues, passed };
}
