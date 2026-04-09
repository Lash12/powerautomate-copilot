import * as vscode from 'vscode';
import type { PowerAutomateClient } from '../api/PowerAutomateClient';
import type { ContextManager } from '../context/ContextManager';
import { searchConnectors } from '../data/connectors';
import type { ConnectorTier } from '../data/connectors';
import { searchExpressions } from '../data/expressions';
import type { ExpressionCategory } from '../data/expressions';
import { validateFlowDefinition } from './validateFlow';

function ok(data: unknown): vscode.LanguageModelToolResult {
  return new vscode.LanguageModelToolResult([
    new vscode.LanguageModelTextPart(
      typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    ),
  ]);
}

function err(message: string): never {
  throw new Error(message);
}

async function confirmAction(message: string): Promise<void> {
  const confirm = vscode.workspace
    .getConfiguration('powerAutomate')
    .get<boolean>('confirmDestructiveActions', true);
  if (!confirm) {return;}

  const choice = await vscode.window.showWarningMessage(message, { modal: true }, 'Confirm');
  if (choice !== 'Confirm') {
    err('Action cancelled by user.');
  }
}

export function registerAllTools(
  client: PowerAutomateClient,
  ctx: ContextManager
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  const register = <T extends object>(
    name: string,
    handler: (input: T) => Promise<vscode.LanguageModelToolResult>
  ) => {
    disposables.push(
      vscode.lm.registerTool(name, {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<T>) => {
          try {
            return await handler(options.input);
          } catch (e) {
            return ok({ error: String(e) });
          }
        },
      })
    );
  };

  // ── List Tools ────────────────────────────────────────────────────────────

  register<Record<string, never>>('powerAutomate_listEnvironments', async () => {
    const environments = await client.listEnvironments();
    return ok(
      environments.map((e) => ({
        name: e.name,
        displayName: e.properties.displayName,
        sku: e.properties.environmentSku,
        isDefault: e.properties.isDefault,
        location: e.location,
      }))
    );
  });

  register<{ environmentName?: string }>('powerAutomate_listConnections', async (input) => {
    const { environmentName } = ctx.resolve(input.environmentName);
    const connections = await client.listConnections(environmentName);
    return ok(
      connections.map((c) => ({
        name: c.name,
        displayName: c.properties.displayName,
        apiId: c.properties.apiId,
        status: c.properties.statuses?.[0]?.status,
      }))
    );
  });

  register<{ environmentName?: string }>('powerAutomate_listFlows', async (input) => {
    const { environmentName } = ctx.resolve(input.environmentName);
    const flows = await client.listFlows(environmentName);
    return ok(
      flows.map((f) => ({
        name: f.name,
        displayName: f.properties.displayName,
        state: f.properties.state,
        lastModified: f.properties.lastModifiedTime,
        triggers: f.properties.definitionSummary?.triggers,
      }))
    );
  });

  // ── Get / Inspect Tools ───────────────────────────────────────────────────

  register<{ flowName?: string; environmentName?: string }>(
    'powerAutomate_getFlow',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      const flow = await client.getFlow(environmentName, flowName);
      return ok(flow);
    }
  );

  register<{ flowName?: string; environmentName?: string; top?: number }>(
    'powerAutomate_getFlowRuns',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      const runs = await client.getFlowRuns(environmentName, flowName, input.top ?? 10);
      return ok(
        runs.map((r) => ({
          name: r.name,
          status: r.properties.status,
          startTime: r.properties.startTime,
          endTime: r.properties.endTime,
          error: r.properties.error,
        }))
      );
    }
  );

  register<{ runName: string; flowName?: string; environmentName?: string }>(
    'powerAutomate_getFlowRunError',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      const actions = await client.getFlowRunActions(
        environmentName,
        flowName,
        input.runName
      );
      const failed = actions.filter((a) => a.properties.status === 'Failed');
      return ok({
        runName: input.runName,
        failedActions: failed.map((a) => ({
          name: a.name,
          status: a.properties.status,
          error: a.properties.error,
          startTime: a.properties.startTime,
          endTime: a.properties.endTime,
        })),
        allActions: actions.map((a) => ({
          name: a.name,
          status: a.properties.status,
        })),
      });
    }
  );

  register<{
    runName: string;
    actionName: string;
    flowName?: string;
    environmentName?: string;
  }>('powerAutomate_getFlowRunActionOutputs', async (input) => {
    const { environmentName, flowName } = ctx.resolveFlow(
      input.environmentName,
      input.flowName
    );
    const result = await client.getFlowRunActionInputsOutputs(
      environmentName,
      flowName,
      input.runName,
      input.actionName
    );
    return ok(result);
  });

  register<{ flowName?: string; environmentName?: string }>(
    'powerAutomate_getFlowHttpSchema',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      const schema = await client.getFlowHttpSchema(environmentName, flowName);
      return ok(schema);
    }
  );

  register<{ flowName?: string; environmentName?: string }>(
    'powerAutomate_getFlowTriggerUrl',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      const url = await client.getFlowTriggerUrl(environmentName, flowName);
      return ok(url);
    }
  );

  // ── Modify Tools ──────────────────────────────────────────────────────────

  register<{
    flowDefinition: Record<string, unknown>;
    flowName?: string;
    environmentName?: string;
  }>('powerAutomate_updateFlow', async (input) => {
    const { environmentName, flowName } = ctx.resolve(
      input.environmentName,
      input.flowName
    );
    await confirmAction(
      flowName
        ? `Update live flow "${flowName}" in environment "${environmentName}"?`
        : `Create a new flow in environment "${environmentName}"?`
    );
    const result = await client.createOrUpdateFlow(
      environmentName,
      flowName,
      input.flowDefinition
    );
    return ok({ success: true, flowName: result.name, displayName: result.properties.displayName });
  });

  register<{ state: 'enabled' | 'disabled'; flowName?: string; environmentName?: string }>(
    'powerAutomate_setFlowState',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      await confirmAction(
        `${input.state === 'enabled' ? 'Enable' : 'Disable'} flow "${flowName}"?`
      );
      await client.setFlowState(environmentName, flowName, input.state);
      return ok({ success: true, flowName, state: input.state });
    }
  );

  register<{ solutionId: string; flowName?: string; environmentName?: string }>(
    'powerAutomate_addFlowToSolution',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      await client.addFlowToSolution(environmentName, flowName, input.solutionId);
      return ok({ success: true, flowName, solutionId: input.solutionId });
    }
  );

  // ── Trigger & Debug Tools ─────────────────────────────────────────────────

  register<{ body?: Record<string, unknown>; flowName?: string; environmentName?: string }>(
    'powerAutomate_triggerFlow',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      const result = await client.triggerFlow(environmentName, flowName, input.body);
      return ok({ success: true, response: result });
    }
  );

  register<{ runName: string; flowName?: string; environmentName?: string }>(
    'powerAutomate_resubmitFlowRun',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      await client.resubmitFlowRun(environmentName, flowName, input.runName);
      return ok({ success: true, runName: input.runName });
    }
  );

  register<{ runName: string; flowName?: string; environmentName?: string }>(
    'powerAutomate_cancelFlowRun',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      await client.cancelFlowRun(environmentName, flowName, input.runName);
      return ok({ success: true, runName: input.runName });
    }
  );

  // ── Static Knowledge Tools (no API calls) ─────────────────────────────────

  register<{ query?: string; category?: string; tier?: string }>(
    'powerAutomate_searchConnectors',
    async (input) => {
      const tier = (input.tier ?? 'All') as ConnectorTier | 'All';
      const results = searchConnectors(input.query, tier === 'All' ? undefined : tier);
      if (input.category) {
        const cat = input.category.toLowerCase();
        return ok(results.filter((c) => c.category.toLowerCase().includes(cat)));
      }
      return ok(results);
    }
  );

  register<{ functionName?: string; category?: string }>(
    'powerAutomate_getExpressionHelp',
    async (input) => {
      const results = searchExpressions(
        input.functionName,
        input.category as ExpressionCategory | undefined
      );
      return ok(results);
    }
  );

  register<{ flowName?: string; environmentName?: string }>(
    'powerAutomate_validateFlow',
    async (input) => {
      const { environmentName, flowName } = ctx.resolveFlow(
        input.environmentName,
        input.flowName
      );
      const flow = await client.getFlow(environmentName, flowName);
      const flowAny = flow as unknown as { properties?: { definition?: unknown } };
      const definition = flowAny?.properties?.definition ?? flow;
      const result = validateFlowDefinition(definition);
      return ok({
        flowName,
        score: result.score,
        issueCount: result.issues.length,
        issues: result.issues,
        passed: result.passed,
      });
    }
  );

  return disposables;
}
