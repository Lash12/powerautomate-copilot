# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial extension scaffold
- Microsoft OAuth authentication via `vscode.authentication`
- Power Automate REST API client (typed, all Live Tools)
- Active environment/flow context manager with workspace persistence
- Status bar items for environment and flow selection
- Sidebar TreeView: Environments → Flows → Connections
- 15 Copilot LM tools registered via `vscode.lm.registerTool`
- Sovereign cloud support (GCC, GCC High, DoD)
- Confirmation prompt for destructive actions (update/delete flows)
