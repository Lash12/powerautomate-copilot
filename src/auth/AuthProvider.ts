import * as vscode from 'vscode';

// VS Code's built-in 'microsoft' auth provider supports these scopes without
// the AADSTS65002 preauthorization error that blocks service.flow.microsoft.com.
//
// BAP (Business Application Platform) scope: used for environment management.
// Power Platform API scope: used for cloud flow and run operations.
//
// Reference: microsoft/powerplatform-vscode uses the same pattern — BAP scope
// for environment listing, PP API scope for service-specific operations.

const PROVIDER_ID = 'microsoft';

// Maps Power Platform API base URLs to their auth scopes.
// Used to support both commercial and sovereign cloud deployments.
const PP_API_SCOPE_MAP: Record<string, string> = {
  'https://api.powerplatform.com': 'https://api.powerplatform.com/.default',
  'https://api.gov.powerplatform.microsoft.us': 'https://api.gov.powerplatform.microsoft.us/.default',
  'https://api.high.powerplatform.microsoft.us': 'https://api.high.powerplatform.microsoft.us/.default',
  'https://api.appsplatform.us': 'https://api.appsplatform.us/.default',
};

// Maps Power Platform API base URLs to corresponding BAP base URLs and scopes.
const BAP_CONFIG_MAP: Record<string, { baseUrl: string; scope: string }> = {
  'https://api.powerplatform.com': {
    baseUrl: 'https://api.bap.microsoft.com',
    scope: 'https://api.bap.microsoft.com/.default',
  },
  'https://api.gov.powerplatform.microsoft.us': {
    baseUrl: 'https://gov.api.bap.appsplatform.us',
    scope: 'https://gov.api.bap.appsplatform.us/.default',
  },
  'https://api.high.powerplatform.microsoft.us': {
    baseUrl: 'https://high.api.bap.appsplatform.us',
    scope: 'https://high.api.bap.appsplatform.us/.default',
  },
  'https://api.appsplatform.us': {
    baseUrl: 'https://api.bap.appsplatform.us',
    scope: 'https://api.bap.appsplatform.us/.default',
  },
};

export class AuthProvider {
  private _onDidChangeSignInState = new vscode.EventEmitter<boolean>();
  readonly onDidChangeSignInState = this._onDidChangeSignInState.event;

  private get configuredPpApiBaseUrl(): string {
    return (
      vscode.workspace
        .getConfiguration('powerAutomate')
        .get<string>('apiBaseUrl') ?? 'https://api.powerplatform.com'
    );
  }

  /** The Power Platform API base URL for the configured cloud. */
  get ppApiBaseUrl(): string {
    return this.configuredPpApiBaseUrl;
  }

  /** The BAP API base URL for the configured cloud. */
  get bapBaseUrl(): string {
    return BAP_CONFIG_MAP[this.configuredPpApiBaseUrl]?.baseUrl ?? 'https://api.bap.microsoft.com';
  }

  private get ppApiScope(): string {
    return PP_API_SCOPE_MAP[this.configuredPpApiBaseUrl] ?? `${this.configuredPpApiBaseUrl}/.default`;
  }

  private get bapScope(): string {
    return BAP_CONFIG_MAP[this.configuredPpApiBaseUrl]?.scope ?? 'https://api.bap.microsoft.com/.default';
  }

  /** Get an access token for the BAP API (environment management). */
  async getBapToken(): Promise<string> {
    const session = await vscode.authentication.getSession(PROVIDER_ID, [this.bapScope], {
      createIfNone: true,
    });
    return session.accessToken;
  }

  /** Get an access token for the Power Platform API (cloud flows, flow runs). */
  async getPpApiToken(): Promise<string> {
    const session = await vscode.authentication.getSession(PROVIDER_ID, [this.ppApiScope], {
      createIfNone: true,
    });
    return session.accessToken;
  }

  async getSignedInUser(): Promise<string | undefined> {
    const session = await vscode.authentication.getSession(PROVIDER_ID, [this.bapScope], {
      createIfNone: false,
      silent: true,
    });
    return session?.account.label;
  }

  async isSignedIn(): Promise<boolean> {
    const session = await vscode.authentication.getSession(PROVIDER_ID, [this.bapScope], {
      createIfNone: false,
      silent: true,
    });
    return session !== undefined;
  }

  async signIn(): Promise<void> {
    await vscode.authentication.getSession(PROVIDER_ID, [this.bapScope], {
      createIfNone: true,
    });
    this._onDidChangeSignInState.fire(true);
  }

  async signOut(): Promise<void> {
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
