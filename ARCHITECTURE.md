# Architecture

## Boundaries

The catalogue is navigation, not a container that boots every toy. Card pages load small SVG posters; a toy bundle is loaded only after entering that toy's page.

Each publishable toy owns its physics state, renderer, audio mapping, public API and tests. Do not create a universal toy state or adopt a general-purpose physics engine.

## Dependency policy

Published packages keep `dependencies` empty. Shared workspace code may be bundled into each toy when it is small enough; consumers should not inherit internal package topology.

The root development toolchain is intentionally limited to TypeScript, Vite and Vitest. Add a dependency only when browser or platform APIs cannot meet a measured requirement.

## Runtime policy

- Importing a package must not touch DOM or audio globals.
- Audio contexts are created only from an explicit trusted gesture.
- Physics uses a fixed timestep; rendering follows `requestAnimationFrame`.
- Frame loops avoid per-frame DOM queries and unbounded allocation.
- Components pause or destroy resources with their lifecycle.
- All pointer sessions use capture and preserve ordinary page interaction outside the toy surface.

## Delivery budgets

- Toy package JavaScript: target below 30 KB gzip.
- Runtime dependencies: zero.
- Remote runtime assets: zero unless a product requirement explicitly changes this.
- Card posters: local SVG, WebP or AVIF with fixed dimensions.

Run `pnpm size` after every production build. A package over budget fails the check.

## Adding a toy

1. Add a package under `packages/<toy>` with pure physics tests first.
2. Expose a Web Component and `mount<Toy>()` API.
3. Add a separate page under `apps/toybox/toys/<toy>`.
4. Add one poster and manifest entry; do not import the package from the catalogue entry.
5. Verify desktop, mobile touch, viewport overflow, lifecycle, ESM/CJS imports and package size.
