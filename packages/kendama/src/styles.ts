export const styles = `
  :host { display: block; position: relative; min-height: 520px; contain: layout paint style; }
  canvas { display: block; width: 100%; height: 100%; min-height: inherit; touch-action: none; cursor: grab; }
  canvas:active { cursor: grabbing; }
  .hint { position: absolute; left: 50%; bottom: 18px; margin: 0; padding: 8px 13px; border: 1px solid rgba(65,42,24,.16); border-radius: 999px; color: #65422c; background: rgba(249,236,197,.84); font: 700 12px/1 system-ui, sans-serif; transform: translateX(-50%); pointer-events: none; backdrop-filter: blur(8px); }
  @media (prefers-reduced-motion: reduce) { .hint { backdrop-filter: none; } }
`;
