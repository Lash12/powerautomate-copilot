import * as vscode from 'vscode';
import { AuthProvider } from './auth/AuthProvider';
import { PowerAutomateClient } from './api/PowerAutomateClient';
import { ContextManager } from './context/ContextManager';
import { StatusBarManager } from './ui/statusBar/StatusBarManager';
import {
  EnvironmentsTreeProvider,
  FlowItem,
  EnvironmentItem,
} from './ui/treeView/EnvironmentsTreeProvider';
import { registerAllTools } from './tools/registerTools';
import { logger } from './utils/logger';

export function activate(extensionContext: vscode.ExtensionContext): void {
  logger.info('Power Automate Copilot activating');

  const auth = new AuthProvider();
  const client = new PowerAutomateClient(auth);
  const contextManager = new ContextManager(extensionContext.workspaceState);
  const statusBar = new StatusBarManager(client, contextManager, auth);
  const treeProvider = new EnvironmentsTreeProvider(client, contextManager);

  // ── Tree View ──────────────────────────────────────────────────────────────
  const treeView = vscode.window.createTreeView('powerAutomate.environmentsView', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  // ── LM Tools ───────────────────────────────────────────────────────────────
  const toolDisposables = registerAllTools(client, contextManager);

  // ── Commands ───────────────────────────────────────────────────────────────
  const commands = [
    vscode.commands.registerCommand('powerAutomate.signIn', () => auth.signIn()),

    vscode.commands.registerCommand('powerAutomate.signOut', () => auth.signOut()),

    vscode.commands.registerCommand(
      'powerAutomate.selectEnvironment',
      () => statusBar.selectEnvironment()
    ),

    vscode.commands.registerCommand(
      'powerAutomate.selectFlow',
      () => statusBar.selectFlow()
    ),

    vscode.commands.registerCommand('powerAutomate.refreshTreeView', () =>
      treeProvider.refresh()
    ),

    // Called when user clicks a FlowItem in the tree
    vscode.commands.registerCommand(
      'powerAutomate.setActiveFlow',
      (item: FlowItem) => {
        contextManager.setFlow(item.flow);
        // Also set the environment if clicking a flow in the tree implicitly selects it
      }
    ),

    // Called when user clicks an EnvironmentItem in the tree
    vscode.commands.registerCommand(
      'powerAutomate.setActiveEnvironment',
      (item: EnvironmentItem) => {
        contextManager.setEnvironment(item.environment);
      }
    ),

    vscode.commands.registerCommand(
      'powerAutomate.openFlowInBrowser',
      (item: FlowItem) => {
        const env = encodeURIComponent(item.environmentName);
        const flow = encodeURIComponent(item.flow.name);
        void vscode.env.openExternal(
          vscode.Uri.parse(
            `https://make.powerautomate.com/environments/${env}/flows/${flow}/details`
          )
        );
      }
    ),

    vscode.commands.registerCommand(
      'powerAutomate.copyFlowId',
      (item: FlowItem) => {
        void vscode.env.clipboard.writeText(item.flow.name);
        void vscode.window.showInformationMessage(`Flow ID copied: ${item.flow.name}`);
      }
    ),

    vscode.commands.registerCommand(
      'powerAutomate.enableFlow',
      async (item: FlowItem) => {
        try {
          await client.setFlowState(item.environmentName, item.flow.name, 'enabled');
          treeProvider.refresh();
          logger.info(`Flow enabled: ${item.flow.properties.displayName}`);
          void vscode.window.showInformationMessage(
            `Flow "${item.flow.properties.displayName}" enabled.`
          );
        } catch (e) {
          void vscode.window.showErrorMessage(String(e));
        }
      }
    ),

    vscode.commands.registerCommand(
      'powerAutomate.disableFlow',
      async (item: FlowItem) => {
        try {
          await client.setFlowState(item.environmentName, item.flow.name, 'disabled');
          treeProvider.refresh();
          logger.info(`Flow disabled: ${item.flow.properties.displayName}`);
          void vscode.window.showInformationMessage(
            `Flow "${item.flow.properties.displayName}" disabled.`
          );
        } catch (e) {
          void vscode.window.showErrorMessage(String(e));
        }
      }
    ),

    vscode.commands.registerCommand('powerAutomate.showLogs', () => logger.show()),
  ];

  // ── Initial Status Bar Refresh ─────────────────────────────────────────────
  void statusBar.refresh();

  // ── Register Disposables ───────────────────────────────────────────────────
  extensionContext.subscriptions.push(
    auth,
    statusBar,
    treeProvider,
    treeView,
    contextManager,
    ...commands,
    ...toolDisposables,
    { dispose: () => logger.dispose() }
  );

  logger.info('Power Automate Copilot activated');
}

export function deactivate(): void {
  // VS Code handles cleanup via subscriptions
}
