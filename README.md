# Web Toybox / 旧玩具箱

A lightweight collection of physics-driven browser toys, presented as a retro toy catalogue.

## Current toys

- **竹知了** — links to the published [`zhuzhiliao`](https://www.npmjs.com/package/zhuzhiliao) toy.
- **剑玉** — the first package developed inside this monorepo; playable now, npm release pending.
- **悠悠球 / 翻板 / 铁皮青蛙** — planned.

## Principles

- zero runtime dependencies in every published toy package;
- one root pnpm toolchain for the whole monorepo;
- browser-native Canvas, SVG, Pointer Events and Web Audio;
- no toy bundle on the catalogue page;
- lazy audio creation behind an explicit user gesture;
- independent ESM, UMD/CJS and TypeScript declaration output;
- a 30 KB gzip JavaScript budget per toy package.

## Workspace

```text
apps/toybox/       static catalogue and independent toy pages
packages/kendama/  dependency-free kendama package
scripts/           build hygiene and size checks
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

## License

MIT
