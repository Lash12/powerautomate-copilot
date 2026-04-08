// All shared types for the Power Automate API
//
// Shapes are aligned with:
//  - BAP API (api.bap.microsoft.com) for environments
//  - Power Platform API (api.powerplatform.com) for cloud flows and flow runs

export interface Environment {
  name: string;
  id: string;
  type: string;
  location: string;
  properties: {
    displayName: string;
    createdTime?: string;
    createdBy?: { id: string; displayName: string; email: string };
    environmentSku: 'Production' | 'Sandbox' | 'Trial' | 'Default';
    isDefault: boolean;
    linkedEnvironmentMetadata?: {
      instanceApiUrl?: string;
      domainName?: string;
      schemaType?: string;
    };
  };
}

export interface Flow {
  name: string;
  id: string;
  type: string;
  properties: {
    displayName: string;
    state: 'Started' | 'Stopped' | 'Suspended';
    createdTime: string;
    lastModifiedTime: string;
    // workflowId is the Dataverse workflow GUID (equals flow name for solution flows).
    workflowId?: string;
    // flowTriggerUri is available in the legacy flow API; not returned by the PP API.
    flowTriggerUri?: string;
    definitionSummary?: {
      triggers: Array<{ type: string; kind?: string }>;
      actions: Array<{ type: string }>;
    };
    // Full flow definition is not returned by the Power Platform API.
    definition?: Record<string, unknown>;
  };
}

export interface FlowRun {
  name: string;
  id: string;
  type: string;
  properties: {
    startTime: string;
    endTime?: string;
    status: 'Running' | 'Succeeded' | 'Failed' | 'Cancelled' | 'TimedOut';
    code?: string;
    error?: { code: string; message: string };
    // trigger details may not be present in all API versions
    trigger?: { name: string; inputsLink?: { uri: string }; outputsLink?: { uri: string } };
    workflowId?: string;
  };
}

export interface FlowRunAction {
  name: string;
  id: string;
  type: string;
  properties: {
    startTime: string;
    endTime?: string;
    status: 'Running' | 'Succeeded' | 'Failed' | 'Skipped' | 'TimedOut';
    code?: string;
    error?: { code: string; message: string };
    inputsLink?: { uri: string; contentSize?: number };
    outputsLink?: { uri: string; contentSize?: number };
  };
}

export interface Connection {
  name: string;
  id: string;
  type: string;
  properties: {
    displayName: string;
    apiId: string;
    statuses: Array<{ status: string; error?: { code: string; message: string } }>;
    createdTime: string;
    lastModifiedTime: string;
  };
}

export interface FlowTriggerSchema {
  method: string;
  relativePath: string;
  schema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface FlowTriggerUrl {
  value: string;
  method: string;
  basePath: string;
  authentication: Record<string, string>;
  queries: Record<string, string>;
}

export interface PaApiListResponse<T> {
  value: T[];
  nextLink?: string;
}

export interface PowerAutomateContext {
  environmentName: string | undefined;
  flowName: string | undefined;
}
