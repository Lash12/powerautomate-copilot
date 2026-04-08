# Contributing to Power Automate Copilot

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository
2. Run `npm install`
3. Open in VS Code
4. Press `F5` to launch the Extension Development Host

## Project Structure

```
src/
  auth/           # Microsoft OAuth via vscode.authentication
  api/            # Power Automate REST API client + types
  context/        # Active environment/flow state management
  ui/
    statusBar/    # Status bar items and QuickPick selection
    treeView/     # Sidebar TreeView provider
  tools/          # vscode.lm.registerTool registrations
  extension.ts    # Extension entry point
```

## Submitting a PR

- Branch from `main`
- Run `npm run lint` before submitting
- Add a CHANGELOG entry under `[Unreleased]`
- Keep PRs focused — one feature or fix per PR

## Reporting Issues

Please use the GitHub issue templates. Include your VS Code version, extension version, and steps to reproduce.
