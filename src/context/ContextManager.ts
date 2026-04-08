import * as vscode from 'vscode';
import type { Environment, Flow } from '../api/types';

const KEY_ENVIRONMENT = 'activeEnvironment';
const KEY_FLOW = 'activeFlow';

export interface ActiveContext {
  environment: Environment | undefined;
  flow: Flow | undefined;
}

export class ContextManager {
  private _activeEnvironment: Environment | undefined;
  private _activeFlow: Flow | undefined;

  private _onDidChangeEnvironment = new vscode.EventEmitter<Environment | undefined>();
  private _onDidChangeFlow = new vscode.EventEmitter<Flow | undefined>();

  readonly onDidChangeEnvironment = this._onDidChangeEnvironment.event;
  readonly onDidChangeFlow = this._onDidChangeFlow.event;

  constructor(private readonly workspaceState: vscode.Memento) {
    // Restore persisted IDs — actual objects will be populated lazily
    const envName = this.workspaceState.get<string>(KEY_ENVIRONMENT);
    const flowName = this.workspaceState.get<string>(KEY_FLOW);
    if (envName) {
      this._activeEnvironment = { name: envName } as Environment;
    }
    if (flowName) {
      this._activeFlow = { name: flowName } as Flow;
    }
  }

  get activeEnvironment(): Environment | undefined {
    return this._activeEnvironment;
  }

  get activeFlow(): Flow | undefined {
    return this._activeFlow;
  }

  get activeEnvironmentName(): string | undefined {
    return this._activeEnvironment?.name;
  }

  get activeFlowName(): string | undefined {
    return this._activeFlow?.name;
  }

  setEnvironment(environment: Environment | undefined): void {
    this._activeEnvironment = environment;
    this._activeFlow = undefined; // reset flow when env changes
    void this.workspaceState.update(
      KEY_ENVIRONMENT,
      environment?.name ?? undefined
    );
    void this.workspaceState.update(KEY_FLOW, undefined);
    this._onDidChangeEnvironment.fire(environment);
    this._onDidChangeFlow.fire(undefined);
  }

  setFlow(flow: Flow | undefined): void {
    this._activeFlow = flow;
    void this.workspaceState.update(KEY_FLOW, flow?.name ?? undefined);
    this._onDidChangeFlow.fire(flow);
  }

  resolve(
    environmentName?: string,
    flowName?: string
  ): { environmentName: string; flowName?: string } {
    const env = environmentName ?? this.activeEnvironmentName;
    if (!env) {
      throw new Error(
        'No active environment. Use the status bar or run "Power Automate: Select Environment" first.'
      );
    }
    return { environmentName: env, flowName: flowName ?? this.activeFlowName };
  }

  resolveFlow(environmentName?: string, flowName?: string): { environmentName: string; flowName: string } {
    const { environmentName: env, flowName: flow } = this.resolve(environmentName, flowName);
    if (!flow) {
      throw new Error(
        'No active flow. Use the status bar or run "Power Automate: Select Active Flow" first.'
      );
    }
    return { environmentName: env, flowName: flow };
  }

  dispose(): void {
    this._onDidChangeEnvironment.dispose();
    this._onDidChangeFlow.dispose();
  }
}
