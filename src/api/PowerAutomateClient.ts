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
import { logger } from '../utils/logger';

// Power Platform API version for cloud flow and flow run operations.
const PP_API_VERSION = '2022-03-01-preview';

// BAP API version for environment management.
// Matches what the official microsoft/powerplatform-vscode extension uses.
const BAP_API_VERSION = '2021-04-01';

// Fields to select from the BAP environments API to avoid over-fetching.
const BAP_ENV_SELECT = 'name,properties.displayName,properties.environmentSku,properties.isDefault,properties.linkedEnvironmentMetadata';

export class PowerAutomateClient {
  constructor(private readonly auth: AuthProvider) {}

  private async fetchWithToken<T>(
    baseUrl: string,
    token: string,
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const method = options?.method ?? 'GET';
    logger.debug(`${method} ${url}`);

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
      logger.error(`${method} ${url} → ${errorMessage}`);
      throw new Error(`Power Automate API error: ${errorMessage}`);
    }

    logger.debug(`${method} ${url} → ${response.status}`);

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private async fetchAllWithToken<T>(
    baseUrl: string,
    token: string,
    path: string
  ): Promise<T[]> {
    const results: T[] = [];
    let currentPath: string | undefined = path;
    while (currentPath) {
      const page: PaApiListResponse<T> = await this.fetchWithToken<PaApiListResponse<T>>(
        baseUrl,
        token,
        currentPath
      );
      results.push(...page.value);
      currentPath = page.nextLink
        ? page.nextLink.replace(baseUrl, '')
        : undefined;
    }
    return results;
  }

  // ── Environments ─────────────────────────────────────────────────────────
  //
  // Uses the Business Application Platform (BAP) API with BAP scope
  // (https://api.bap.microsoft.com/.default). This scope is pre-authorized
  // for VS Code's built-in Microsoft auth provider in corporate tenants,
  // unlike the legacy service.flow.microsoft.com scope.

  async listEnvironments(): Promise<Environment[]> {
    const token = await this.auth.getBapToken();
    return this.fetchAllWithToken<Environment>(
      this.auth.bapBaseUrl,
      token,
      `/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments?api-version=${BAP_API_VERSION}&select=${BAP_ENV_SELECT}`
    );
  }

  // ── Connections ───────────────────────────────────────────────────────────
  //
  // Connection management is not yet available in the Power Platform API.
  // This will be implemented when the API adds connection support.

  async listConnections(_environmentName: string): Promise<Connection[]> {
    throw new Error(
      'Connection listing is not yet available via the Power Platform API. ' +
      'View connections in the Power Automate portal.'
    );
  }

  // ── Flows ─────────────────────────────────────────────────────────────────
  //
  // Uses the Power Platform API (api.powerplatform.com) with PP API scope.
  // Note: This endpoint returns solution-aware flows only. Flows under
  // "My Flows" (non-solution flows) are not returned by this API.
  //
  // TODO: Migrate to the GA Power Platform API when it achieves full feature
  // parity with the legacy service.flow.microsoft.com endpoints.

  async listFlows(environmentName: string): Promise<Flow[]> {
    const token = await this.auth.getPpApiToken();
    return this.fetchAllWithToken<Flow>(
      this.auth.ppApiBaseUrl,
      token,
      `/powerautomate/environments/${encodeURIComponent(environmentName)}/cloudFlows?api-version=${PP_API_VERSION}`
    );
  }

  async getFlow(environmentName: string, flowName: string): Promise<Flow> {
    const token = await this.auth.getPpApiToken();
    // The PP API does not have a single-flow GET; filter the list by workflowId.
    const flows = await this.fetchAllWithToken<Flow>(
      this.auth.ppApiBaseUrl,
      token,
      `/powerautomate/environments/${encodeURIComponent(environmentName)}/cloudFlows?workflowId=${encodeURIComponent(flowName)}&api-version=${PP_API_VERSION}`
    );
    const flow = flows[0];
    if (!flow) {
      throw new Error(`Flow not found: ${flowName}`);
    }
    return flow;
  }

  async createOrUpdateFlow(
    _environmentName: string,
    _flowName: string | undefined,
    _definition: Record<string, unknown>
  ): Promise<Flow> {
    throw new Error(
      'Creating or updating flows is not yet available via the Power Platform API. ' +
      'Use the Power Automate portal to create or edit flows.'
    );
  }

  async setFlowState(
    _environmentName: string,
    _flowName: string,
    _state: 'enabled' | 'disabled'
  ): Promise<void> {
    throw new Error(
      'Enabling/disabling flows is not yet available via the Power Platform API. ' +
      'Use the Power Automate portal to enable or disable flows.'
    );
  }

  async addFlowToSolution(
    _environmentName: string,
    _flowName: string,
    _solutionId: string
  ): Promise<void> {
    throw new Error(
      'Adding flows to solutions is not yet available via the Power Platform API. ' +
      'Use the Power Automate portal to manage solution membership.'
    );
  }

  // ── Flow Runs ─────────────────────────────────────────────────────────────

  async getFlowRuns(
    environmentName: string,
    flowName: string,
    top = 10
  ): Promise<FlowRun[]> {
    const normalizedTop = Math.max(0, Math.floor(top));
    if (normalizedTop === 0) {
      return [];
    }

    const token = await this.auth.getPpApiToken();
    const runs = await this.fetchAllWithToken<FlowRun>(
      this.auth.ppApiBaseUrl,
      token,
      `/powerautomate/environments/${encodeURIComponent(environmentName)}/flowRuns?workflowId=${encodeURIComponent(flowName)}&api-version=${PP_API_VERSION}&$top=${encodeURIComponent(String(normalizedTop))}`
    );
    return runs.slice(0, normalizedTop);
  }

  async getFlowRunActions(
    _environmentName: string,
    _flowName: string,
    _runName: string
  ): Promise<FlowRunAction[]> {
    throw new Error(
      'Flow run action details are not yet available via the Power Platform API. ' +
      'View action-level details in the Power Automate portal run history.'
    );
  }

  async getFlowRunActionInputsOutputs(
    _environmentName: string,
    _flowName: string,
    _runName: string,
    _actionName: string
  ): Promise<{ inputs: unknown; outputs: unknown }> {
    throw new Error(
      'Flow run action inputs/outputs are not yet available via the Power Platform API.'
    );
  }

  async resubmitFlowRun(
    _environmentName: string,
    _flowName: string,
    _runName: string
  ): Promise<void> {
    throw new Error(
      'Resubmitting flow runs is not yet available via the Power Platform API. ' +
      'Use the Power Automate portal to resubmit failed runs.'
    );
  }

  async cancelFlowRun(
    _environmentName: string,
    _flowName: string,
    _runName: string
  ): Promise<void> {
    throw new Error(
      'Cancelling flow runs is not yet available via the Power Platform API. ' +
      'Use the Power Automate portal to cancel running flows.'
    );
  }

  // ── Trigger ───────────────────────────────────────────────────────────────

  async getFlowHttpSchema(
    _environmentName: string,
    _flowName: string
  ): Promise<FlowTriggerSchema> {
    throw new Error(
      'HTTP trigger schema retrieval is not yet available via the Power Platform API.'
    );
  }

  async getFlowTriggerUrl(
    _environmentName: string,
    _flowName: string
  ): Promise<FlowTriggerUrl> {
    throw new Error(
      'Trigger URL retrieval is not yet available via the Power Platform API. ' +
      'Retrieve the trigger URL from the flow details in the Power Automate portal.'
    );
  }

  async triggerFlow(
    _environmentName: string,
    _flowName: string,
    _body?: Record<string, unknown>
  ): Promise<unknown> {
    throw new Error(
      'Triggering flows is not yet available via the Power Platform API. ' +
      'Use the flow\'s HTTP trigger URL from the Power Automate portal.'
    );
  }
}
