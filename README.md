# Web Toybox / 旧玩具箱

A lightweight collection of physics-driven browser toys, presented as a retro toy catalogue.

## Current toys

- **竹知了** — links to the published [`zhuzhiliao`](https://www.npmjs.com/package/zhuzhiliao) toy.
- **剑玉** — finite-radius ball, rotating hole, cup/rim contact, and angle-gated hard mode.
- **悠悠球** — constrained string, disc spin, sleep, return, and procedural hum.
- **翻板** — deterministic wooden-slat cascade that flips in both directions.
- **铁皮青蛙** — wind-up spring, cam gait, ballistic hops, and tin/gear sound.
- **七巧板** — polygon hit-testing, free drag, and 45-degree rotation.
- **十五滑块** — legal-move shuffling that always preserves solvability.
- **孔明棋** — exact orthogonal jump rules and move highlighting.

## Principles

- zero runtime dependencies in every published toy package;
- one root pnpm toolchain for the whole monorepo;
- browser-native Canvas, SVG, Pointer Events and Web Audio;
- no toy bundle on the catalogue page;
- lazy audio creation after a trusted user gesture, with automatic unlock detection and a visible fallback;
- independent ESM, UMD/CJS and TypeScript declaration output;
- configuration-driven procedural sound through `@web-toybox/toy-audio`, bundled into each toy at build time;
- a 30 KB gzip JavaScript budget per toy package.

## Workspace

```text
apps/toybox/            static catalogue and independent toy pages
packages/toy-audio/      lazy synthesizer, sound configs, and tone/noise helpers
packages/kendama/       rigid-ball kendama
packages/yoyo/          spinning yo-yo
packages/jacobs-ladder/ reversible slat cascade
packages/tangram/        seven-piece freeform puzzle
packages/sliding-puzzle/ solvable fifteen puzzle
packages/peg-solitaire/  single-player jump puzzle
packages/tin-frog/      wind-up hopping frog
scripts/                build, size, and release checks
```

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
pnpm size
```

The production site is written to `site/`. Generated output and dependency directories are not committed.

See [`docs/npm-publishing.md`](docs/npm-publishing.md) for the single-workflow, independent-version Trusted Publishing setup.

## License

MIT
