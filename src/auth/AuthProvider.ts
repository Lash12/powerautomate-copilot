import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);

const PA_RESOURCE = 'https://service.flow.microsoft.com';
const PA_SCOPE = `${PA_RESOURCE}/user_impersonation`;
const OFFLINE_ACCESS = 'offline_access';
const VSCODE_PROVIDER_ID = 'microsoft';

type AuthMethod = 'azureCli' | 'vscode' | 'auto';

interface AzureCliTokenResponse {
  accessToken: string;
  expiresOn: string; // "2024-01-01 12:00:00.000000"
  tokenType: string;
}

/**
 * Resolves a Power Automate access token using one of two strategies:
 *
 * 1. **Azure CLI** (preferred for enterprise tenants): Calls `az account get-access-token`
 *    which uses the Azure CLI's own pre-approved Microsoft app registration. This works
 *    in corporate tenants even when user consent is disabled, because the user's existing
 *    Power Platform permissions are respected without needing any new OAuth consent.
 *
 * 2. **VS Code Microsoft auth provider** (fallback / personal accounts): Uses
 *    `vscode.authentication.getSession` which prompts the user for consent. Works well
 *    for personal/developer tenants but may fail in strict enterprise tenants where
 *    user consent is disabled by tenant policy.
 *
 * The strategy is controlled by `powerAutomate.authMethod` (default: `auto`).
 * In `auto` mode, Azure CLI is tried first; VS Code auth is used as a fallback.
 */
export class AuthProvider {
  private _onDidChangeSignInState = new vscode.EventEmitter<boolean>();
  readonly onDidChangeSignInState = this._onDidChangeSignInState.event;

  // Cache the CLI token to avoid re-shelling on every API call
  private _cliTokenCache: { token: string; expiresAt: Date } | undefined;

  private get authMethod(): AuthMethod {
    return (
      vscode.workspace
        .getConfiguration('powerAutomate')
        .get<AuthMethod>('authMethod') ?? 'auto'
    );
  }

  async getAccessToken(): Promise<string> {
    const method = this.authMethod;

    if (method === 'azureCli') {
      return this._getCliToken();
    }
    if (method === 'vscode') {
      return this._getVscodeToken();
    }

    // auto: try CLI first, fall back to VS Code auth
    try {
      const token = await this._getCliToken();
      logger.debug('Auth: using Azure CLI token');
      return token;
    } catch (cliErr) {
      logger.info(
        'Auth: Azure CLI unavailable or not logged in, falling back to VS Code auth',
        cliErr instanceof Error ? cliErr.message : cliErr
      );
      return this._getVscodeToken();
    }
  }

  async getSignedInUser(): Promise<string | undefined> {
    const method = this.authMethod;

    if (method === 'azureCli' || method === 'auto') {
      try {
        const info = await this._getCliAccountInfo();
        return info ?? undefined;
      } catch {
        // fall through to VS Code
      }
    }

    const session = await vscode.authentication.getSession(
      VSCODE_PROVIDER_ID,
      [PA_SCOPE, OFFLINE_ACCESS],
      { createIfNone: false, silent: true }
    );
    return session?.account.label;
  }

  async isSignedIn(): Promise<boolean> {
    const method = this.authMethod;

    // Use silent/non-interactive checks only — never trigger a login prompt
    if (method === 'azureCli' || method === 'auto') {
      // Valid cached CLI token counts as signed in
      if (this._cliTokenCache) {
        const bufferMs = 2 * 60 * 1000;
        if (this._cliTokenCache.expiresAt.getTime() - Date.now() > bufferMs) {
          return true;
        }
      }
      // No cache — silently check if az has an active account
      const info = await this._getCliAccountInfo();
      if (info !== null) {
        return true;
      }
      if (method === 'azureCli') {
        return false;
      }
      // auto: fall through to VS Code silent check
    }

    const session = await vscode.authentication.getSession(
      VSCODE_PROVIDER_ID,
      [PA_SCOPE, OFFLINE_ACCESS],
      { createIfNone: false, silent: true }
    );
    return session !== undefined;
  }

  async signIn(): Promise<void> {
    const method = this.authMethod;

    if (method === 'azureCli') {
      // Guide the user to run az login, then verify auth actually works
      const choice = await vscode.window.showInformationMessage(
        'Power Automate Copilot is configured to use Azure CLI authentication. Run `az login` in your terminal to sign in, then try again.',
        'Open Terminal'
      );
      if (choice === 'Open Terminal') {
        await vscode.commands.executeCommand('workbench.action.terminal.new');
      }
      // Do NOT fire the event yet — the user hasn't authenticated.
      // StatusBarManager.refresh() will pick up the state once az login completes.
      return;
    }

    if (method === 'auto') {
      // Check if CLI is available; if so, prefer it
      try {
        await this._getCliToken();
        this._onDidChangeSignInState.fire(true);
        return;
      } catch {
        // CLI not available, fall through to VS Code auth
      }
    }

    // VS Code auth
    await vscode.authentication.getSession(VSCODE_PROVIDER_ID, [PA_SCOPE, OFFLINE_ACCESS], {
      createIfNone: true,
      forceNewSession: true,
    });
    this._onDidChangeSignInState.fire(true);
  }

  async signOut(): Promise<void> {
    this._cliTokenCache = undefined;
    const choice = await vscode.window.showInformationMessage(
      'To fully sign out, either run `az logout` (Azure CLI) or revoke the Power Automate Copilot session from your Microsoft account settings.',
      'Run az logout',
      'Open Account Settings'
    );
    if (choice === 'Run az logout') {
      const terminal = vscode.window.createTerminal('Power Automate Sign Out');
      terminal.show();
      terminal.sendText('az logout');
    } else if (choice === 'Open Account Settings') {
      await vscode.env.openExternal(
        vscode.Uri.parse('https://account.microsoft.com/permissions')
      );
    }
    this._onDidChangeSignInState.fire(false);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async _getCliToken(): Promise<string> {
    // Return cached token if still valid (with 2-minute buffer)
    if (this._cliTokenCache) {
      const bufferMs = 2 * 60 * 1000;
      if (this._cliTokenCache.expiresAt.getTime() - Date.now() > bufferMs) {
        return this._cliTokenCache.token;
      }
    }

    const result = await this._runAzCli([
      'account',
      'get-access-token',
      '--resource',
      PA_RESOURCE,
      '--output',
      'json',
    ]);

    const parsed = JSON.parse(result) as AzureCliTokenResponse;

    // `expiresOn` from the Azure CLI is "YYYY-MM-DD HH:mm:ss.ffffff" (local time,
    // not ISO 8601). Normalise to ISO by replacing the space separator with 'T'.
    // If parsing still fails, fall back to 55 minutes from now (safe default).
    const normalised = parsed.expiresOn.replace(' ', 'T');
    const expiresAt = new Date(normalised);
    const validExpiry = !isNaN(expiresAt.getTime());
    if (!validExpiry) {
      logger.warn(`Auth: could not parse CLI token expiry "${parsed.expiresOn}", defaulting to 55 min`);
    }
    const resolvedExpiry = validExpiry ? expiresAt : new Date(Date.now() + 55 * 60 * 1000);

    this._cliTokenCache = { token: parsed.accessToken, expiresAt: resolvedExpiry };
    return parsed.accessToken;
  }

  private async _getCliAccountInfo(): Promise<string | null> {
    try {
      const result = await this._runAzCli(['account', 'show', '--output', 'json']);
      const account = JSON.parse(result) as { user?: { name?: string } };
      return account?.user?.name ?? null;
    } catch {
      return null;
    }
  }

  private async _runAzCli(args: string[]): Promise<string> {
    // On Windows, `az` is a .cmd file, so we must invoke via cmd.exe
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'cmd.exe' : 'az';
    const cmdArgs = isWindows ? ['/c', 'az', ...args] : args;

    try {
      const { stdout } = await execFileAsync(cmd, cmdArgs, {
        env: { ...process.env },
        timeout: 15_000,
      });
      return stdout.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Azure CLI error: ${message}`);
    }
  }

  private async _getVscodeToken(): Promise<string> {
    try {
      const session = await vscode.authentication.getSession(
        VSCODE_PROVIDER_ID,
        [PA_SCOPE, OFFLINE_ACCESS],
        { createIfNone: true }
      );
      return session.accessToken;
    } catch (err) {
      // Provide a clear, actionable error for enterprise users
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('consent') || message.toLowerCase().includes('unauthorized')) {
        throw new Error(
          'Sign-in failed: your organization may have disabled user consent for new apps. ' +
          'Try setting `powerAutomate.authMethod` to `azureCli` and run `az login` in your terminal. ' +
          'See the docs: https://github.com/Lash12/powerautomate-copilot/blob/main/docs/azure-app-registration.md'
        );
      }
      throw err;
    }
  }

  dispose(): void {
    this._cliTokenCache = undefined;
    this._onDidChangeSignInState.dispose();
  }
}
