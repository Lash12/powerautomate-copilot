import * as vscode from 'vscode';

const PA_SCOPE = 'https://service.flow.microsoft.com/user_impersonation';
const OFFLINE_ACCESS = 'offline_access';
const PROVIDER_ID = 'microsoft';

export class AuthProvider {
  private _onDidChangeSignInState = new vscode.EventEmitter<boolean>();
  readonly onDidChangeSignInState = this._onDidChangeSignInState.event;

  async getAccessToken(): Promise<string> {
    const session = await vscode.authentication.getSession(
      PROVIDER_ID,
      [PA_SCOPE, OFFLINE_ACCESS],
      { createIfNone: true }
    );
    return session.accessToken;
  }

  async getSignedInUser(): Promise<string | undefined> {
    const session = await vscode.authentication.getSession(
      PROVIDER_ID,
      [PA_SCOPE, OFFLINE_ACCESS],
      { createIfNone: false, silent: true }
    );
    return session?.account.label;
  }

  async isSignedIn(): Promise<boolean> {
    const session = await vscode.authentication.getSession(
      PROVIDER_ID,
      [PA_SCOPE, OFFLINE_ACCESS],
      { createIfNone: false, silent: true }
    );
    return session !== undefined;
  }

  async signIn(): Promise<void> {
    await vscode.authentication.getSession(PROVIDER_ID, [PA_SCOPE, OFFLINE_ACCESS], {
      createIfNone: true,
      forceNewSession: true,
    });
    this._onDidChangeSignInState.fire(true);
  }

  async signOut(): Promise<void> {
    // VS Code doesn't expose a direct sign-out for delegated sessions,
    // but we can clear workspaceState context and notify the user.
    const choice = await vscode.window.showInformationMessage(
      'To fully sign out, revoke the Power Automate Copilot session from your Microsoft account settings.',
      'Open Account Settings',
      'OK'
    );
    if (choice === 'Open Account Settings') {
      await vscode.env.openExternal(
        vscode.Uri.parse('https://account.microsoft.com/permissions')
      );
    }
    this._onDidChangeSignInState.fire(false);
  }

  dispose(): void {
    this._onDidChangeSignInState.dispose();
  }
}
