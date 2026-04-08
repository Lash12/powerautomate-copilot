import * as vscode from 'vscode';
import type { PowerAutomateClient } from '../../api/PowerAutomateClient';
import type { ContextManager } from '../../context/ContextManager';
import type { Environment, Flow } from '../../api/types';

// ── Tree Item Types ───────────────────────────────────────────────────────────

export class EnvironmentItem extends vscode.TreeItem {
  readonly itemType = 'environment' as const;
  constructor(public readonly environment: Environment) {
    super(
      environment.properties.displayName,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    this.contextValue = 'environment';
    this.description = environment.properties.environmentSku;
    this.iconPath = new vscode.ThemeIcon('cloud');
    this.tooltip = `${environment.properties.displayName} (${environment.properties.environmentSku})`;
  }
}

export class FlowsGroupItem extends vscode.TreeItem {
  readonly itemType = 'flowsGroup' as const;
  constructor(public readonly environmentName: string) {
    super('Flows', vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'flowsGroup';
    this.iconPath = new vscode.ThemeIcon('symbol-event');
  }
}

export class ConnectionsGroupItem extends vscode.TreeItem {
  readonly itemType = 'connectionsGroup' as const;
  constructor(public readonly environmentName: string) {
    super('Connections', vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'connectionsGroup';
    this.iconPath = new vscode.ThemeIcon('link');
  }
}

export class FlowItem extends vscode.TreeItem {
  readonly itemType = 'flow' as const;
  constructor(
    public readonly flow: Flow,
    public readonly environmentName: string
  ) {
    super(flow.properties.displayName, vscode.TreeItemCollapsibleState.None);
    const isRunning = flow.properties.state === 'Started';
    this.contextValue = isRunning ? 'flow_enabled' : 'flow_disabled';
    this.description = isRunning ? 'On' : 'Off';
    this.iconPath = new vscode.ThemeIcon(
      isRunning ? 'play-circle' : 'debug-pause',
      isRunning
        ? new vscode.ThemeColor('testing.runAction')
        : new vscode.ThemeColor('disabledForeground')
    );
    this.tooltip = `${flow.properties.displayName}\nState: ${flow.properties.state}\nModified: ${new Date(flow.properties.lastModifiedTime).toLocaleDateString()}`;
    this.command = {
      command: 'powerAutomate.setActiveFlow',
      title: 'Set as Active Flow',
      arguments: [this],
    };
  }
}

export class ConnectionItem extends vscode.TreeItem {
  readonly itemType = 'connection' as const;
  constructor(public readonly connectionName: string, public readonly displayName: string) {
    super(displayName, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'connection';
    this.iconPath = new vscode.ThemeIcon('plug');
  }
}

export type TreeNode =
  | EnvironmentItem
  | FlowsGroupItem
  | ConnectionsGroupItem
  | FlowItem
  | ConnectionItem;

// ── Tree Data Provider ────────────────────────────────────────────────────────

export class EnvironmentsTreeProvider
  implements vscode.TreeDataProvider<TreeNode>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private readonly client: PowerAutomateClient,
    private readonly context: ContextManager
  ) {
    context.onDidChangeEnvironment(() => this.refresh());
    context.onDidChangeFlow(() => this.refresh());
  }

  refresh(node?: TreeNode): void {
    this._onDidChangeTreeData.fire(node);
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    // Mark active environment/flow
    if (element instanceof EnvironmentItem) {
      const isActive =
        element.environment.name === this.context.activeEnvironmentName;
      if (isActive) {
        element.description = `${element.environment.properties.environmentSku} ✦`;
        element.iconPath = new vscode.ThemeIcon(
          'cloud',
          new vscode.ThemeColor('testing.runAction')
        );
      }
    }
    if (element instanceof FlowItem) {
      const isActive = element.flow.name === this.context.activeFlowName;
      if (isActive) {
        element.description = `${element.description ?? ''} ✦`;
      }
    }
    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!element) {
      // Root: list environments
      try {
        const envs = await this.client.listEnvironments();
        return envs.map((e) => new EnvironmentItem(e));
      } catch (err) {
        void vscode.window.showErrorMessage(`Failed to load environments: ${String(err)}`);
        return [];
      }
    }

    if (element instanceof EnvironmentItem) {
      return [
        new FlowsGroupItem(element.environment.name),
        new ConnectionsGroupItem(element.environment.name),
      ];
    }

    if (element instanceof FlowsGroupItem) {
      try {
        const flows = await this.client.listFlows(element.environmentName);
        return flows.map((f) => new FlowItem(f, element.environmentName));
      } catch (err) {
        void vscode.window.showErrorMessage(`Failed to load flows: ${String(err)}`);
        return [];
      }
    }

    if (element instanceof ConnectionsGroupItem) {
      try {
        const connections = await this.client.listConnections(
          element.environmentName
        );
        return connections.map(
          (c) => new ConnectionItem(c.name, c.properties.displayName)
        );
      } catch (err) {
        void vscode.window.showErrorMessage(`Failed to load connections: ${String(err)}`);
        return [];
      }
    }

    return [];
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
