# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest | ✅ |

## How Authentication Works

This extension uses **VS Code's built-in Microsoft authentication provider** (`vscode.authentication`). 

- OAuth tokens are managed by VS Code and stored in the OS keychain via `SecretStorage`
- The extension never sees or stores your password
- Tokens are scoped to `https://service.flow.microsoft.com/user_impersonation` only
- No tokens or flow data are sent to any third-party service

## What We Never Do

- ❌ Never log, cache, or transmit access tokens
- ❌ Never store flow definitions on any external server
- ❌ Never access mailbox, calendar, or any non-Power Platform data
- ❌ Never communicate with any server except `*.flow.microsoft.com` and `login.microsoftonline.com`

## Reporting a Vulnerability

Please do **not** report security vulnerabilities in public GitHub issues. Instead, email the maintainers directly (see repository contact info). We will respond within 48 hours.
