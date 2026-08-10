# npm publishing

The workspace uses independent package versions and one release workflow. Registry publication still happens one package at a time because npm's API publishes one tarball per request, but the owner triggers only one workflow.

## What the workflow does

1. Installs the locked workspace once.
2. Runs all tests, type checks, builds, and size budgets.
3. Discovers every non-private `packages/*/package.json` with zero runtime dependencies.
4. Queries npm for the exact `name@version`.
5. Skips versions that already exist.
6. Runs `npm pack --dry-run` for every missing version.
7. With an explicit publish trigger, publishes only missing versions with Trusted Publishing and provenance.

A manual workflow run defaults to dry-run. Checking **publish**, or pushing a `release-*` tag, enables publication. The script refuses `--publish` outside GitHub Actions with an OIDC request URL.

## One-time npm setup

The current package names use the `@web-toybox` scope. Before publishing, the owner must either own/create that npm organization scope or rename the packages to a scope they control.

Trusted Publisher settings are configured once **for each npm package** because npm stores trust on the package record. Use the same values each time:

- Provider: GitHub Actions
- Organization or user: `bkmashiro`
- Repository: `web-toybox`
- Workflow filename: `release.yml`
- Environment: leave empty unless the workflow is later changed to use one
- Permission: publish

A package record must exist before its Trusted Publisher can be configured. Therefore each new package needs one owner-attended bootstrap publication with npm login and 2FA, followed immediately by Trusted Publisher configuration. After that, revoke any old automation token; normal releases require no `NPM_TOKEN`.

## Independent versions

Increment only the package that changed. For example, a kendama-only fix can change `@web-toybox/kendama` while the other package versions remain untouched. The release planner will skip all exact versions already present on npm.

Before triggering publication, review:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm size
node scripts/release-packages.mjs
```

The official npm Trusted Publishing documentation requires `id-token: write`. Trusted Publishing automatically creates provenance for supported public repositories. This workflow uses Node 24, npm 12.0.2, and disables package-manager caching in the release job, following the current npm guidance.

Reference: https://docs.npmjs.com/trusted-publishers/
