# Power Automate Copilot

> Give GitHub Copilot native tools to build, debug, and manage Power Automate flows — entirely locally, no third-party server.

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Why this extension?

Most Power Automate AI tooling routes your flow data through third-party servers. **Power Automate Copilot** is different:

- ✅ **Runs entirely locally** — your flows never leave your machine except to go to Microsoft's own APIs
- ✅ **No third-party server** — works behind corporate firewalls and in enterprise tenants
- ✅ **Native Copilot integration** — tools appear directly in GitHub Copilot Chat, no MCP config needed
- ✅ **Active context** — set an active environment and flow once, then just say *"debug my broken flow"*

## Requirements

- VS Code 1.87+
- GitHub Copilot (for Chat tool integration)
- A Microsoft account with access to Power Automate

## Getting Started

### Corporate / Enterprise tenants (recommended)

If you work in an organization managed by IT, use **Azure CLI authentication** — it works with your existing permissions and requires no admin approval or new app registrations:

1. Install [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) if not already installed
2. Run `az login` in your terminal and sign in with your work account
3. In VS Code settings, set `powerAutomate.authMethod` to `azureCli` (or leave as `auto`)
4. Select your environment from the status bar and start using Copilot

### Personal / Developer accounts

1. Install the extension
2. Click **Sign in to Power Automate** in the status bar
3. Authorize the Power Platform scopes when prompted
4. Select your environment and start using Copilot

## Available Copilot Tools

Once signed in, Copilot can use these tools automatically:

| Tool | What it does |
|---|---|
| `powerAutomate_listEnvironments` | List all accessible environments |
| `powerAutomate_listConnections` | List connections in active environment |
| `powerAutomate_listFlows` | List flows in active environment |
| `powerAutomate_getFlow` | Get full flow definition JSON |
| `powerAutomate_getFlowRuns` | Get run history with status |
| `powerAutomate_getFlowRunError` | Per-action error details for failed runs |
| `powerAutomate_getFlowRunActionOutputs` | Inspect action inputs/outputs |
| `powerAutomate_getFlowHttpSchema` | HTTP trigger schema |
| `powerAutomate_getFlowTriggerUrl` | Signed trigger callback URL |
| `powerAutomate_updateFlow` | Create or update a flow |
| `powerAutomate_setFlowState` | Enable or disable a flow |
| `powerAutomate_addFlowToSolution` | Migrate flow into a solution |
| `powerAutomate_triggerFlow` | Fire an HTTP-triggered flow |
| `powerAutomate_resubmitFlowRun` | Resubmit a failed run |
| `powerAutomate_cancelFlowRun` | Cancel a running execution |

## Example Prompts

```
"List all my Power Automate flows and show me which ones are disabled"
"Debug my active flow — find the last failed run and tell me what went wrong"
"Create a new flow that sends a Teams message when a SharePoint item is created"
"What's the HTTP trigger schema for my active flow?"
"Resubmit the last failed run of my approval flow"
```

## Settings

| Setting | Default | Description |
|---|---|---|
| `powerAutomate.authMethod` | `auto` | Auth strategy: `auto` (Azure CLI → VS Code fallback), `azureCli`, or `vscode`. Use `azureCli` in corporate tenants. |
| `powerAutomate.clientId` | `""` | Custom Azure AD client ID for the `vscode` auth method. Leave blank to use VS Code's built-in app. |
| `powerAutomate.apiBaseUrl` | `https://api.flow.microsoft.com` | API base URL for sovereign clouds (GCC, GCC High, DoD). |
| `powerAutomate.confirmDestructiveActions` | `true` | Require confirmation before updating or deleting live flows. |

## Enterprise / Sovereign Cloud

For GCC, GCC High, or DoD tenants, set `powerAutomate.apiBaseUrl` to the appropriate endpoint and use `az login --tenant <tenant-id>` to authenticate against the correct cloud.

**No admin approval or app registration is required** as long as you authenticate via Azure CLI (`az login`). Your existing Power Platform environment access is used as-is. See [docs/azure-app-registration.md](docs/azure-app-registration.md) for the full authentication guide.

## Security

- Azure CLI auth uses Microsoft's own pre-approved tooling — no new OAuth consent required
- VS Code auth tokens are stored in VS Code's `SecretStorage` (OS keychain)
- No data is logged or sent to any third-party service
- See [SECURITY.md](SECURITY.md) for the full security policy

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

## License

[MIT](LICENSE)
