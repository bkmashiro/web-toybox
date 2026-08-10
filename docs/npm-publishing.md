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

The `@web-toybox` npm organization exists and `bkmsr` is its owner. Public organization packages use npm's free plan.

Trusted Publisher settings are configured once **for each npm package** because npm stores trust on the package record. Use the same values each time:

- Provider: GitHub Actions
- Organization or user: `bkmashiro`
- Repository: `web-toybox`
- Workflow filename: `release.yml`
- Environment: leave empty unless the workflow is later changed to use one
- Permission: publish

A package record must exist before its Trusted Publisher can be configured. Do not configure packages one by one in the website. The batch bootstrap command discovers every missing package, first-publishes it, then applies the shared trust configuration:

```bash
pnpm npm:bootstrap -- --execute
```

Run it in an interactive terminal because npm requires account-level 2FA. npm documents a five-minute verification window for bulk `npm trust` calls. The script waits two seconds between packages to avoid rate limiting.

If authentication interrupts the process after a package record was created, repair trust without republishing:

```bash
pnpm npm:bootstrap -- --execute --trust-existing
```

Dry-run without registry writes:

```bash
pnpm npm:bootstrap
```

After bootstrap, normal releases require no `NPM_TOKEN`.

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
