
# OxidePlayer

OxidePlayer is a small React video player component with optional per-frame processing via a WebAssembly (Rust) module. This repository contains the component and the wasm `pkg/` files produced by wasm-bindgen, and is prepared to be published as the `oxideplayer` npm package.

Features
- Simple React video player with custom controls
- Optional per-frame processing via WASM (Rust)
- Built to be published as an npm library (ESM + CJS builds, TypeScript declarations)
- Real-time frame processing indicator

## Install

When published:

```powershell
npm install oxideplayer
```

To test locally from this repo:

```powershell
npm pack
# then in a test app:
# npm install ../path/to/oxideplayer-0.1.4.tgz
```

## Usage

Basic usage (default export):

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import Videoplayer from "oxideplayer";
import 'oxideplayer/style.css';

function App() {
  return <Videoplayer videoSrc="/testVideo.mp4" />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

Named import (if you need types):

```tsx
import Videoplayer, { VideoplayerProps } from "oxideplayer";
```

## ⚠️ Important: Vite Configuration

If you're using Vite in your consuming app, you **must** configure it to handle the WASM module properly:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['oxideplayer']  // Don't pre-bundle oxideplayer
  },
  server: {
    fs: {
      allow: ['..']  // Allow serving files from node_modules
    }
  }
})
```

**After updating your config:**
1. Delete `node_modules/.vite` to clear Vite cache
2. Restart your dev server

See `CONSUMING_APP_SETUP.md` for detailed setup instructions and troubleshooting.

## WASM notes

- The package includes a `dist/pkg/` directory containing the wasm artifacts (`rust_wasm.js` and `rust_wasm_bg.wasm`).
- The player loads the wasm using a URL resolved from `import.meta.url`, so the relative path works when the package is installed by a consumer.
- Make sure your server/bundler serves `.wasm` files with `application/wasm` MIME type.
- A closable snackbar shows the frame count to verify WASM processing is working.

## Build

```powershell
npm install
npm run build
```

This produces `dist/` with ESM/CJS bundles and `dist/types` with TypeScript declarations. The `pkg/` folder is copied to `dist/pkg/` during build.

## Contributing

See `CONTRIBUTING.md` for development, testing and PR guidelines.

## License

MIT

