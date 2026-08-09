# @web-toybox/kendama

A dependency-free, physics-driven kendama for the browser.

```ts
import { mountKendama } from '@web-toybox/kendama';

const kendama = mountKendama(document.body);
await kendama.unlockSound(); // call from an explicit user gesture
```

Or use the registered Web Component:

```html
<retro-kendama></retro-kendama>
```

The package has no runtime dependencies. It uses Canvas 2D, Pointer Events and Web Audio.
