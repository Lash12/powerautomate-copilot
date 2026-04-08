# Azure AD App Registration Guide

## Default: No Registration Required

By default, **Power Automate Copilot uses VS Code's built-in Microsoft authentication provider**, which uses VS Code's own Azure AD application to handle OAuth. This means:

- ✅ No app registration needed for most users
- ✅ Works immediately after install — just click "Sign In"
- ✅ Consent is scoped to `https://service.flow.microsoft.com/user_impersonation`

## Enterprise / Custom Client ID

Some organizations may require all OAuth apps to use tenant-registered applications (e.g., via Conditional Access policies or restricted app consent).

In these cases, create your own Azure AD App Registration:

### Steps

1. Go to [Azure Portal → App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Click **New registration**
   - Name: `Power Automate Copilot` (or any name)
   - Supported account types: **Accounts in any organizational directory** (or your tenant only)
   - Redirect URI: `vscode://vscode.microsoft-authentication` (type: Web)
3. After creation, note the **Application (client) ID**
4. Under **API permissions**, add:
   - `https://service.flow.microsoft.com/user_impersonation` (Delegated)
   - `offline_access` (Delegated, under Microsoft Graph)
5. If required by your tenant, have an admin **grant admin consent**

### Configure the Extension

Set your client ID in VS Code settings:

```json
{
  "powerAutomate.clientId": "<YOUR_CLIENT_ID>"
}
```

## Scopes Used

| Scope | Purpose |
|---|---|
| `https://service.flow.microsoft.com/user_impersonation` | Read and manage Power Automate flows on the user's behalf |
| `offline_access` | Enables silent token refresh without re-prompting the user |

> **Note:** These scopes grant access to Power Automate only. The extension never requests access to email, calendar, SharePoint, or any other Microsoft service.
