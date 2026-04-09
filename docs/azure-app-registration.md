# Authentication Guide

## No App Registration Required

**Power Automate Copilot does not require any Azure AD app registration**, even in corporate tenants. The extension uses VS Code's built-in Microsoft authentication provider with two Microsoft-owned API scopes that are pre-authorized for all Microsoft Entra (Azure AD) tenants:

| Scope | Used For |
|---|---|
| `https://api.bap.microsoft.com/.default` | Listing environments (Business Application Platform API) |
| `https://api.powerplatform.com/.default` | Listing and reading cloud flows and flow runs (Power Platform API) |

Both scopes are Microsoft first-party resources with delegated permissions — they use the same consent model as Microsoft's own VS Code extensions (e.g., the [Power Platform Tools extension](https://marketplace.visualstudio.com/items?itemName=microsoft-IsvExpTools.powerplatform-vscode)).

## How Sign-In Works

1. Click **Sign in to Power Automate** in the VS Code status bar (or run the command palette command).
2. VS Code's built-in account picker appears — select or add your Microsoft / work account.
3. You are prompted to consent to the two scopes above (once per account, per machine).
4. The extension immediately lists your environments and flows.

No admin consent, no app registration, no Azure CLI — just your existing Power Platform access.

## Enterprise / Sovereign Cloud

For GCC, GCC High, or DoD tenants, change `powerAutomate.apiBaseUrl` in VS Code settings to the appropriate endpoint:

| Cloud | API Base URL |
|---|---|
| Commercial (default) | `https://api.powerplatform.com` |
| US Government (GCC) | `https://api.gov.powerplatform.microsoft.us` |
| US Government High (GCC High) | `https://api.high.powerplatform.microsoft.us` |
| US DoD | `https://api.appsplatform.us` |

The BAP URL and auth scopes are automatically derived from your configured API base URL.

## Troubleshooting

**"Need admin approval" dialog appears**
> This means your tenant has user consent blocked for all third-party apps. Power Automate Copilot uses Microsoft first-party scopes, so this should not appear. If it does, contact your administrator and ask them to allow user consent for Microsoft-owned API resources.

**Signed in but no environments appear**
> Your account may not have access to any Power Platform environments. Check the [Power Platform admin center](https://admin.powerplatform.microsoft.com) to confirm you have at least one environment assigned.

**Token errors after switching tenants**
> Use **Sign Out** from the status bar and sign back in to acquire a fresh token for the new tenant.

## Privacy

The extension only requests delegated permissions scoped to Power Automate and the Power Platform API. It never requests access to email, calendar, SharePoint, Teams, or any other Microsoft service.
