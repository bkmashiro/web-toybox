# Procedural Toy Audio Library

## Goal

Extract the repeated lazy Web Audio lifecycle and reusable procedural material sounds into `@web-toybox/toy-audio@0.0.1`, while keeping every toy distributable self-contained with zero runtime dependencies.

## Boundaries

- The public API is configuration-first: helper functions build tone/noise layers and named sounds, while `createToySynth(config)` loads defaults or caller overrides.
- Default material sounds are exported as immutable configurations rather than hard-coded playback functions.
- Toy-specific event names and physics-to-sound mappings stay in each toy voice.
- Toy packages consume the workspace library as a build-time `devDependency`; Vite bundles the used code into each package.
- Public declarations and installed tarballs must not require `@web-toybox/toy-audio` at runtime.
- No context at import or construction time; unsupported browsers report `unsupported`.
- No recordings, remote assets, or runtime network requests.
- No push, npm publication, bootstrap, trust attachment, or deployment in this task.

## Queue

- [x] RED-test lifecycle, volume, configuration helpers, defaults, custom overrides, destroy/re-unlock, and SSR import.
- [x] Build ESM, UMD/CJS, and declarations.
- [x] Migrate all seven voices without changing their public component APIs.
- [x] Verify all published toy package manifests still have zero runtime dependencies.
- [x] Add the package to package documentation and release discovery without adding a catalogue card.
- [x] Run browser cold-start, trusted unlock, volume, event, and homepage-boundary checks.
- [x] Run full gates, pack/dry-run, and fresh ESM/CJS/SSR consumers.
- [x] Run final secret/diff review and make a signed local commit.

## Verification record

- 71/71 tests passed across 18 files; typecheck, clean build, size gate, and `git diff --check` passed.
- `@web-toybox/toy-audio` builds to 6.72 KB ESM / 1.99 KB gzip with zero runtime dependencies.
- The final tarball is 6.6 KB packed / 20.6 KB unpacked and excludes TypeScript build-info.
- All eight packages passed `npm publish --dry-run`; all seven toy tarballs imported in clean ESM and CJS consumers without installing toy-audio.
- The catalogue loaded eight cards and zero toy-audio/toy scripts; every toy page reached `running` after a trusted interaction with no console errors.
- Runtime configuration merge was exercised in-browser by adding and triggering a custom layered sound alongside the loaded tangram config.
- Build-time source aliases keep every published toy self-contained while allowing Rollup to drop unused default configurations; toy gzip output fell by roughly 0.22–0.30 KB each.
