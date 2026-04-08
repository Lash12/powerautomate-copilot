import * as vscode from 'vscode';
import type { PowerAutomateClient } from '../../api/PowerAutomateClient';
import type { ContextManager } from '../../context/ContextManager';
import type { AuthProvider } from '../../auth/AuthProvider';
import type { Environment, Flow } from '../../api/types';

export class StatusBarManager {
  private readonly envItem: vscode.StatusBarItem;
  private readonly flowItem: vscode.StatusBarItem;
  private readonly signInItem: vscode.StatusBarItem;

  constructor(
    private readonly client: PowerAutomateClient,
    private readonly context: ContextManager,
    private readonly auth: AuthProvider
  ) {
    this.signInItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.signInItem.command = 'powerAutomate.signIn';
    this.signInItem.tooltip = 'Sign in to Power Automate';

    this.envItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      99
    );
    this.envItem.command = 'powerAutomate.selectEnvironment';
    this.envItem.tooltip = 'Click to select Power Automate environment';

    this.flowItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      98
    );
    this.flowItem.command = 'powerAutomate.selectFlow';
    this.flowItem.tooltip = 'Click to select active flow';

    context.onDidChangeEnvironment(() => this.update());
    context.onDidChangeFlow(() => this.update());
    auth.onDidChangeSignInState(() => void this.refresh());
  }

  async refresh(): Promise<void> {
    const signedIn = await this.auth.isSignedIn();
    if (!signedIn) {
      this.signInItem.text = '$(account) Sign in to Power Automate';
      this.signInItem.show();
      this.envItem.hide();
      this.flowItem.hide();
    } else {
      const user = await this.auth.getSignedInUser();
      this.signInItem.text = `$(account) ${user ?? 'Signed In'}`;
      this.signInItem.tooltip = `Signed in as ${user}. Click to sign out.`;
      this.signInItem.command = 'powerAutomate.signOut';
      this.signInItem.show();
      this.update();
    }
  }

  update(): void {
    const env = this.context.activeEnvironment;
    const flow = this.context.activeFlow;

    if (env) {
      const displayName = env.properties?.displayName ?? env.name;
      this.envItem.text = `$(cloud) ${displayName}`;
      this.envItem.show();
    } else {
      this.envItem.text = '$(cloud) Select Environment';
      this.envItem.show();
    }

    if (flow) {
      const displayName = flow.properties?.displayName ?? flow.name;
      const stateIcon =
        flow.properties?.state === 'Started' ? '$(play)' : '$(debug-pause)';
      this.flowItem.text = `${stateIcon} ${displayName}`;
      this.flowItem.show();
    } else {
      this.flowItem.text = '$(play) Select Flow';
      this.flowItem.show();
    }
  }

  async selectEnvironment(): Promise<void> {
    const environments = await vscode.window.withProgress<Environment[]>(
      { location: vscode.ProgressLocation.Notification, title: 'Loading environments…' },
      () => this.client.listEnvironments()
    );

    const picks = environments.map((env) => ({
      label: env.properties.displayName,
      description: env.properties.environmentSku,
      detail: env.properties.isDefault ? '$(star-full) Default environment' : undefined,
      env,
    }));

    const selected = await vscode.window.showQuickPick(picks, {
      placeHolder: 'Select a Power Automate environment',
      matchOnDescription: true,
    });

    if (selected) {
      this.context.setEnvironment(selected.env);
    }
  }

  async selectFlow(): Promise<void> {
    const { environmentName } = this.context.resolve();

    const flows = await vscode.window.withProgress<Flow[]>(
      { location: vscode.ProgressLocation.Notification, title: 'Loading flows…' },
      () => this.client.listFlows(environmentName)
    );

    const picks = flows.map((flow) => {
      const state = flow.properties.state;
      const icon = state === 'Started' ? '$(play)' : '$(debug-pause)';
      return {
        label: `${icon} ${flow.properties.displayName}`,
        description: state,
        detail: `Modified: ${new Date(flow.properties.lastModifiedTime).toLocaleDateString()}`,
        flow,
      };
    });

    const selected = await vscode.window.showQuickPick(picks, {
      placeHolder: 'Select an active flow',
      matchOnDescription: true,
    });

    if (selected) {
      this.context.setFlow(selected.flow);
    }
  }

  dispose(): void {
    this.signInItem.dispose();
    this.envItem.dispose();
    this.flowItem.dispose();
  }
}
