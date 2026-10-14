# Betterleaks CI

OWASP-CRT runs Betterleaks as an open-source, API-key-free secret scanner.

## Scope

The workflow runs on:

- pull requests;
- pushes to `main`;
- manual workflow dispatches.

It scans the complete Git history using a read-only repository mount.

## Security properties

- No API key is required.
- No repository secret is passed to the scanner.
- The job has only `contents: read`.
- Git credentials are not persisted.
- Credential validation and analysis are disabled.
- The scanner performs local detection only.

## Configuration

The project configuration is stored in:

`config/betterleaks.toml`

It extends Betterleaks’ built-in detectors and adds patterns for credential
variables specific to OWASP-CRT.

The complete upstream Betterleaks rule catalog is not copied into this
repository. This keeps the project small and allows Betterleaks upgrades to be
reviewed independently.

## Handling findings

If the workflow reports a possible secret:

1. Treat it as real until verified.
2. Revoke and rotate the credential.
3. Remove it from the working tree and history where appropriate.
4. Store the replacement in an approved secret manager.
5. Re-run the workflow.
6. Add an allowlist exception only for a documented placeholder.

Never commit real secrets as test fixtures.
