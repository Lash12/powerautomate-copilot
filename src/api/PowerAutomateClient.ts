import * as vscode from 'vscode';
import type { AuthProvider } from '../auth/AuthProvider';
import type {
  Connection,
  Environment,
  Flow,
  FlowRun,
  FlowRunAction,
  FlowTriggerSchema,
  FlowTriggerUrl,
  PaApiListResponse,
} from './types';

const API_VERSION = '2016-11-01';

export class PowerAutomateClient {
  private get baseUrl(): string {
    return (
      vscode.workspace
        .getConfiguration('powerAutomate')
        .get<string>('apiBaseUrl') ?? 'https://api.flow.microsoft.com'
    );
  }

  constructor(private readonly auth: AuthProvider) {}

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options?.headers ?? {}),
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const body = (await response.json()) as { error?: { message?: string } };
        if (body?.error?.message) {
          errorMessage = body.error.message;
        }
      } catch {
        // ignore JSON parse error
      }
      throw new Error(`Power Automate API error: ${errorMessage}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private async fetchAll<T>(path: string): Promise<T[]> {
    const results: T[] = [];
    let currentPath: string | undefined = path;
    while (currentPath) {
      const page: PaApiListResponse<T> = await this.fetch<PaApiListResponse<T>>(currentPath);
      results.push(...page.value);
      currentPath = page.nextLink
        ? page.nextLink.replace(this.baseUrl, '')
        : undefined;
    }
    return results;
  }

  // ── Environments ─────────────────────────────────────────────────────────

  async listEnvironments(): Promise<Environment[]> {
    return this.fetchAll<Environment>(
      `/providers/Microsoft.ProcessSimple/environments?api-version=${API_VERSION}`
    );
  }

  // ── Connections ───────────────────────────────────────────────────────────

  async listConnections(environmentName: string): Promise<Connection[]> {
    return this.fetchAll<Connection>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/connections?api-version=${API_VERSION}`
    );
  }

  // ── Flows ─────────────────────────────────────────────────────────────────

  async listFlows(environmentName: string): Promise<Flow[]> {
    return this.fetchAll<Flow>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows?api-version=${API_VERSION}&$expand=properties.definition`
    );
  }

  async getFlow(environmentName: string, flowName: string): Promise<Flow> {
    return this.fetch<Flow>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}?api-version=${API_VERSION}&$expand=properties.definition`
    );
  }

  async createOrUpdateFlow(
    environmentName: string,
    flowName: string | undefined,
    definition: Record<string, unknown>
  ): Promise<Flow> {
    const path = flowName
      ? `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}?api-version=${API_VERSION}`
      : `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows?api-version=${API_VERSION}`;

    return this.fetch<Flow>(path, {
      method: flowName ? 'PATCH' : 'POST',
      body: JSON.stringify({ properties: { definition } }),
    });
  }

  async setFlowState(
    environmentName: string,
    flowName: string,
    state: 'enabled' | 'disabled'
  ): Promise<void> {
    await this.fetch<void>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}/${state === 'enabled' ? 'start' : 'stop'}?api-version=${API_VERSION}`,
      { method: 'POST' }
    );
  }

  async addFlowToSolution(
    environmentName: string,
    flowName: string,
    solutionId: string
  ): Promise<void> {
    await this.fetch<void>(
      `/providers/Microsoft.PowerApps/environments/${encodeURIComponent(environmentName)}/addToSolution?api-version=${API_VERSION}`,
      {
        method: 'POST',
        body: JSON.stringify({
          resourceIds: [flowName],
          solutionUniqueName: solutionId,
        }),
      }
    );
  }

  // ── Flow Runs ─────────────────────────────────────────────────────────────

  async getFlowRuns(
    environmentName: string,
    flowName: string,
    top = 10
  ): Promise<FlowRun[]> {
    const runs = await this.fetchAll<FlowRun>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}/runs?api-version=${API_VERSION}&$top=${top}`
    );
    return runs.slice(0, top);
  }

  async getFlowRunActions(
    environmentName: string,
    flowName: string,
    runName: string
  ): Promise<FlowRunAction[]> {
    return this.fetchAll<FlowRunAction>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}/runs/${encodeURIComponent(runName)}/actions?api-version=${API_VERSION}`
    );
  }

  async getFlowRunActionInputsOutputs(
    environmentName: string,
    flowName: string,
    runName: string,
    actionName: string
  ): Promise<{ inputs: unknown; outputs: unknown }> {
    const action = await this.fetch<FlowRunAction>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}/runs/${encodeURIComponent(runName)}/actions/${encodeURIComponent(actionName)}?api-version=${API_VERSION}`
    );

    const [inputs, outputs] = await Promise.all([
      action.properties.inputsLink?.uri
        ? fetch(action.properties.inputsLink.uri).then((r) => r.json())
        : Promise.resolve(null),
      action.properties.outputsLink?.uri
        ? fetch(action.properties.outputsLink.uri).then((r) => r.json())
        : Promise.resolve(null),
    ]);

    return { inputs, outputs };
  }

  async resubmitFlowRun(
    environmentName: string,
    flowName: string,
    runName: string
  ): Promise<void> {
    await this.fetch<void>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}/runs/${encodeURIComponent(runName)}/resubmit?api-version=${API_VERSION}`,
      { method: 'POST' }
    );
  }

  async cancelFlowRun(
    environmentName: string,
    flowName: string,
    runName: string
  ): Promise<void> {
    await this.fetch<void>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}/runs/${encodeURIComponent(runName)}/cancel?api-version=${API_VERSION}`,
      { method: 'POST' }
    );
  }

  // ── Trigger ───────────────────────────────────────────────────────────────

  async getFlowHttpSchema(
    environmentName: string,
    flowName: string
  ): Promise<FlowTriggerSchema> {
    return this.fetch<FlowTriggerSchema>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}/triggers/manual/schema?api-version=${API_VERSION}`
    );
  }

  async getFlowTriggerUrl(
    environmentName: string,
    flowName: string
  ): Promise<FlowTriggerUrl> {
    return this.fetch<FlowTriggerUrl>(
      `/providers/Microsoft.ProcessSimple/environments/${encodeURIComponent(environmentName)}/flows/${encodeURIComponent(flowName)}/triggers/manual/listCallbackUrl?api-version=${API_VERSION}`,
      { method: 'POST' }
    );
  }

  async triggerFlow(
    environmentName: string,
    flowName: string,
    body?: Record<string, unknown>
  ): Promise<unknown> {
    const urlData = await this.getFlowTriggerUrl(environmentName, flowName);
    const response = await fetch(urlData.value, {
      method: urlData.method ?? 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Flow trigger failed: HTTP ${response.status} ${response.statusText}`);
    }
    try {
      return await response.json();
    } catch {
      return { status: response.status };
    }
  }
}
