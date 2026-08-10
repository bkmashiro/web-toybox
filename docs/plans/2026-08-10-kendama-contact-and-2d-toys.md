# Kendama Contact Fix and 2D Toy Expansion

> Unattended local execution plan. Continue through all executable slices; do not push, publish, deploy, or mutate remote services while the owner is AFK.

## Goal

Replace kendama cup adhesion with physically releasable contact, improve the kendama drawing, and add three small clearly 2D browser toys as independent zero-runtime-dependency packages and pages.

## Non-negotiable boundaries

- Cup catches must emerge from contact response; never pin ball position/velocity to a cup.
- A cup moving away or accelerating beyond support must let the ball fall or fly free.
- Spike insertion may retain its separate hole/alignment state.
- New toys are clearly 2D: tangram, fifteen sliding puzzle, peg solitaire.
- Each toy has its own package, semver, Web Component/API, page, tests, and procedural lazy audio.
- Home page remains static and must not preload toy bundles.
- No runtime dependencies or remote assets.
- No `AudioContext` before trusted interaction.
- Local signed commits are allowed. No push/npm publish/Pages deployment without a later attended confirmation.

## Queue

- [x] Add RED tests for no cup pinning, natural departure, and no immediate recatch.
- [x] Implement dynamic cup contact and update telemetry semantics.
- [x] Redraw kendama silhouette and cup geometry.
- [x] Add `@web-toybox/tangram@0.0.1` and page.
- [x] Add `@web-toybox/sliding-puzzle@0.0.1` and page.
- [x] Add `@web-toybox/peg-solitaire@0.0.1` and page.
- [x] Integrate package/site/build/size/release discovery.
- [x] Run tests, typecheck, build, size, diff, pack/dry-run, ESM/CJS consumers, browser and 390px QA.
- [x] Make signed local commits and report the permission-gated remote scope.

## Gates

```bash
pnpm test
pnpm typecheck
pnpm clean
pnpm build
pnpm size
git diff --check
```

## Stop conditions

Stop only when all local executable work above is complete, a real product/resource decision is required, repeated gates expose an architectural blocker, or continuation would require an unsafe broad rewrite. A successful intermediate slice is not a stopping condition.

## Verification record

- 62/62 Vitest checks passed across 16 files.
- Root typecheck, clean build, 30 KB gzip budget, and `git diff --check` passed.
- Kendama browser sampling held `caught=none` for the full 50–400 ms release trace; a 900 px/s cup sweep produced a free ball rather than matched cup velocity.
- Catalogue showed 8/8 cards while loading zero toy bundles.
- Tangram drag/rotate, sliding-puzzle legal move/reset, and peg-solitaire legal jump/reset were exercised in the browser.
- Synthetic events stayed `uninitialized`; trusted controls transitioned audio to `running` and hid the fallback.
- 390×844 QA reported zero page overflow, one mounted Shadow Canvas per page, and controls inside 16–374 px.
- `pnpm pack`, `npm publish --dry-run`, and clean ESM/CJS consumers passed for kendama and all three new packages.
