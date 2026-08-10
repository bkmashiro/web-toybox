# Web Toybox Autonomous Build Roadmap

> **For Hermes:** This is the unattended execution source of truth. Read it fully, update it after every verified slice, and continue without waiting for “继续”.

**Goal:** Turn the current retro catalogue into a small collection of genuinely playable, dependency-free browser toys, beginning with a physically meaningful kendama hard mode, then yo-yo, Jacob’s ladder, and a wind-up tin frog.

**Repository:** `/Users/yuzhe/projects/web-toybox`

## User intent

Yuzhe is AFK and asked Hermes to continue building the other toys. He specifically rejected the kendama’s point-mass/proximity-snap behavior: a hard mode must model a finite-radius rotating ball, release cooldown, cup contact, and hole/spike alignment.

## Unattended boundary

This run is local-only while the owner is AFK:

- Signed local commits are allowed.
- Never push, publish npm packages, deploy Pages, mutate npm/GitHub package settings, or use production accounts.
- Existing credentials are not permission.
- Prepare CI and release scripts, but do not trigger remote workflows.
- Do not migrate or modify the separate `bamboo-cicada` repository.

## Value filter

Prefer small, complete toys with distinctive mechanics and clear interaction over broad engine abstractions. Keep each package at zero runtime dependencies and load only one toy bundle on its detail page.

Do not add React, Vue, Three.js, Matter.js, Tone.js, GSAP, Tailwind, Turborepo, Nx, Lerna, Changesets, remote fonts, or runtime third-party assets.

## Current state discovered

- Catalogue and Pages are live.
- `packages/kendama` is a zero-runtime-dependency Web Component, but its catch model uses distance-based snap and the ball has no rotational state.
- The release package name `@web-toybox/kendama` does not yet exist on npm.
- Root development dependencies are only TypeScript, Vite, and Vitest.
- Yo-yo, Jacob’s ladder, and tin frog currently exist only as catalogue cards.

## Desired future state

### Product

- Kendama offers normal and hard modes. Hard mode uses a rotating rigid ball; release cannot immediately recatch; cup catches come from finite ball/cup geometry; spike insertion requires aligned hole position, angle, and bounded relative speed.
- Yo-yo is playable with string extension, sleep/spin decay, return, floor contact, and motion-driven procedural sound.
- Jacob’s ladder has deterministic cascading slats and per-impact wooden sound.
- Tin frog stores spring energy through winding, releases it through a simple cam/leg gait, hops, lands, and produces procedural tin/gear sound.
- Catalogue cards link only to working pages and remain image-only on the overview.

### Architecture

- One pnpm workspace and one root toolchain.
- Each toy is an independent package with ESM, UMD/CJS, declarations, SSR-safe import, Web Component, mount API, and empty `dependencies`.
- Shared code is extracted only after at least two toys prove the seam; no universal physics engine.
- Each package remains under the existing 30 KiB gzip JS budget.

### Release automation

- One manual/tag-capable `publish-npm.yml`, not one workflow per package.
- The workflow runs tests/build/pack, scans `packages/*/package.json`, checks `npm view name@version`, skips existing versions, and publishes only missing versions.
- Use npm Trusted Publishing via GitHub OIDC (`id-token: write`) and provenance; no permanent `NPM_TOKEN` in steady state.
- Actual first publication and Trusted Publisher configuration remain owner-attended and blocked until scope/package ownership is confirmed.

## Global gates

Run before every behavior commit:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm size
git diff --check
```

For each package also run tarball ESM/CJS consumer smoke and SSR import. For UI slices run desktop and 390px touch QA with zero horizontal overflow and no page errors.

## Execution queue

### Track A — Kendama rigid-ball hard mode

- [x] RED tests for angular state, release cooldown, cup contact, and hole/spike alignment.
- [x] Implement finite-radius rigid ball and string torque in hard mode.
- [x] Replace hard-mode magnetic catch with cup/rim contact and aligned spike insertion.
- [x] Draw rotating ball hole and string attachment.
- [x] Add normal/hard mode UI and truthful telemetry.
- [x] Browser/touch QA, gates, signed local commit.

### Track B — Yo-yo

- [x] Write deterministic physics tests for string limit, spin energy, sleep/return, and bounds.
- [x] Implement package, Web Component, procedural sound, API, and SSR-safe import.
- [x] Add detail page and activate catalogue card.
- [x] Browser/touch QA, package smokes, gates, signed local commit.

### Track C — Jacob’s ladder

- [x] Write deterministic cascade/state-transition tests.
- [x] Implement slat cascade, reset/flip interaction, wooden impact sound, API, and package.
- [x] Add detail page and activate catalogue card.
- [x] Browser/touch QA, package smokes, gates, signed local commit.

### Track D — Wind-up tin frog

- [x] Write deterministic spring-energy, cam/gait, hop, and landing tests.
- [x] Implement winding input, gait/hop simulation, procedural tin/gear sound, API, and package.
- [x] Add detail page and activate catalogue card.
- [x] Browser/touch QA, package smokes, gates, signed local commit.

### Track E — Batch npm release preparation

- [x] Add a dependency-free package discovery/version-existence script with tests or deterministic dry-run fixtures.
- [x] Add one Trusted Publishing workflow with OIDC, provenance, manual dispatch, and tag support.
- [x] Document exact npm-side setup per package and first-publication boundary.
- [x] Validate workflow syntax and local dry-run without publishing.
- [x] Signed local commit; leave push/publish/deploy blocked for owner return.

## Per-slice protocol

1. Inspect live Git state and relevant files.
2. Write a failing test, or record why browser-only proof is necessary.
3. Implement the smallest coherent behavior.
4. Run focused tests.
5. Update this roadmap and completion log.
6. Run global gates.
7. Make a signed local commit.
8. Verify signature and clean tree.
9. Continue immediately to the next executable item.

## Stop conditions

Continue automatically after each verified slice. Stop only when all executable queue items are complete, an owner decision/resource/permission is required, gates repeatedly fail in a way that needs a product choice, or continuation would require an unsafe broad rewrite. A clean checkpoint or completed toy is not a stop condition.

## Completion log

- 2026-08-10: Roadmap created from live repository state. No implementation item marked complete yet.
- 2026-08-10: Kendama hard mode implemented. Nine tests pass; hard mode uses rotating ball state, hole-attached rope torque, release grace, narrow cup mouths/rim response, and angle/speed-gated spike insertion. Mobile touch QA confirmed angular motion, no immediate recatch, mode switching, zero overflow, and zero page errors.
- 2026-08-10: Yo-yo package and page implemented. Four deterministic physics tests cover string limits, throw-to-spin transfer, sleep, and return. Mobile touch QA raised spin from 8 to 29.6 rad/s and shortened the returning string from 250 to 152 px. ESM/CJS tarball consumers, SSR import, size gate (3.70 KiB gzip), zero-overflow, and zero-error checks passed.
- 2026-08-10: Jacob's ladder package and page implemented. The deterministic cascade releases slats in order, counts one impact per slat, and reverses over the same state. Browser QA observed only the first three slats active at 650 ms, then exact 8/8 forward and reverse completion. ESM/CJS tarball consumers, SSR import, size gate (2.81 KiB gzip), sound, overflow, and error checks passed.
- 2026-08-10: Tin frog package and page implemented. Holding the wind control stores bounded spring energy and emits gear pulses; release drives a cam cycle into finite ballistic hops and explicit landings. Browser QA stored 74% energy in 1.25 seconds, observed an upward velocity near -273 px/s, then a real landing after one hop. ESM/CJS tarball consumers, SSR import, size gate (3.44 KiB gzip), sound, overflow, and error checks passed.
- 2026-08-10: Batch npm release preparation completed. One workflow validates the full workspace, discovers exact package versions absent from npm, dry-runs each tarball, and publishes only missing versions under GitHub OIDC. Three release-planner tests, YAML parsing, a four-package live registry dry-run, and the local publish refusal passed. npm scope ownership and four bootstrap package records remain owner-attended.

## Owner-attended blockers

- npm scope/package ownership and first package records.
- npm Trusted Publisher configuration matching `bkmashiro/web-toybox` and the final workflow filename/environment.
- Any actual npm publication, GitHub push, or Pages deployment during this AFK run.

## Short prompt to resume

Read `docs/plans/2026-08-10-web-toybox-autonomous-build.md` fully and execute it in `/Users/yuzhe/projects/web-toybox`. Do not stop after one successful slice. This is unattended: never push, publish, deploy, mutate production, or use production accounts/data. Continue through RED, implementation, gates, roadmap updates, and signed local commits until all executable work is done or a real product/resource/risk blocker remains.
