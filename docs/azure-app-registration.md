# Authentication Guide

## How Authentication Works

Power Automate Copilot supports two authentication strategies, controlled by the `powerAutomate.authMethod` setting:

| Method | Setting value | Best for |
|---|---|---|
| **Azure CLI** | `azureCli` | Corporate/enterprise tenants |
| **VS Code Microsoft auth** | `vscode` | Personal / M365 developer accounts |
| **Auto (default)** | `auto` | Tries Azure CLI first, falls back to VS Code auth |

---

## Azure CLI Authentication (Recommended for Enterprise)

### Why this works without IT involvement

The Azure CLI is a **Microsoft first-party tool** that is pre-approved in virtually all enterprise Azure AD tenants. When you run `az login`, you authenticate with your work account and consent to the Azure CLI app once. After that, the extension can silently request tokens for any service your account already has access to — including Power Automate — **without any additional consent dialog or admin approval**.

Your existing Power Platform licenses and environment access are fully respected. If you can open `make.powerautomate.com` in a browser with your work account, this will work.

### Setup

1. Install [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (one-time)
2. In your terminal, run:
   ```bash
   az login
   ```
3. If your tenant uses Conditional Access or MFA, follow the prompts
4. In VS Code settings, set:
   ```json
   { "powerAutomate.authMethod": "azureCli" }
   ```
   (Or leave it as `auto` — Azure CLI will be preferred automatically if available)

### Multi-tenant / switching accounts

```bash
# List available subscriptions/tenants
az account list --output table

# Switch to a specific tenant
az login --tenant <tenant-id>
```

---

## VS Code Microsoft Auth (Personal / Developer Accounts)

Uses VS Code's built-in Microsoft authentication provider. A consent dialog appears on first use.

**This may fail in corporate tenants if:**
- Your tenant admin has disabled user consent for new apps
- Your tenant requires admin pre-approval for all OAuth apps
- Your tenant has Conditional Access policies blocking VS Code's app registration

If you see a "consent required" or "unauthorized" error, switch to `azureCli`.

---

## Enterprise Tenant — Custom App Registration

If your organization requires all OAuth apps to be registered in your own tenant (and Azure CLI is not an option), you can register your own app:

1. Go to [Azure Portal → App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. **New registration**
   - Name: `Power Automate Copilot`
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: `vscode://vscode.microsoft-authentication` (type: Web)
3. Note the **Application (client) ID**
4. **API permissions** → Add:
   - `https://service.flow.microsoft.com/user_impersonation` (Delegated)
   - `offline_access` (Delegated)
5. Have an admin **Grant admin consent**
6. Configure:
   ```json
   {
     "powerAutomate.authMethod": "vscode",
     "powerAutomate.clientId": "<YOUR_CLIENT_ID>"
   }
   ```

> **Note:** Custom `clientId` is not yet wired into the VS Code auth provider in v0.1 — this is on the roadmap. For now, Azure CLI is the recommended enterprise path.

---

## Sovereign Cloud Environments

Change the API endpoint to match your cloud:

```json
{
  "powerAutomate.apiBaseUrl": "https://gov.api.flow.microsoft.us"
}
```

| Cloud | API Base URL |
|---|---|
| Commercial (default) | `https://api.flow.microsoft.com` |
| GCC | `https://gov.api.flow.microsoft.us` |
| GCC High | `https://high.api.flow.microsoft.us` |
| DoD | `https://api.flow.appsplatform.us` |

For GCC/GCC High/DoD, also use `az login --tenant <tenant-id>` to ensure you're authenticated against the correct cloud.
