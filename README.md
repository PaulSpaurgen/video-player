
# OxidePlayer

OxidePlayer is a small React video player component with optional per-frame processing via a WebAssembly (Rust) module. This repository contains the component and the wasm `pkg/` files produced by wasm-bindgen, and is prepared to be published as the `oxideplayer` npm package.

Features
- Simple React video player with custom controls
- Optional per-frame processing via WASM (Rust)
- Built to be published as an npm library (ESM + CJS builds, TypeScript declarations)

## Install

When published:

```powershell
npm install oxideplayer
```

To test locally from this repo:

```powershell
npm pack
# then in a test app:
# npm install ../path/to/oxideplayer-0.1.0.tgz
```

## Usage

Basic usage (default export):

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import Videoplayer from "oxideplayer";

function App() {
  return <Videoplayer videoSrc="/testVideo.mp4" />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

Named import (if you need types):

```tsx
import Videoplayer, { VideoplayerProps } from "oxideplayer";
```

## WASM notes

- The package includes a `pkg/` directory containing the wasm artifacts (`rust_wasm.js` and `rust_wasm_bg.wasm`).
- The player loads the wasm using a URL resolved from `import.meta.url`, so the relative path works when the package is installed by a consumer.
- Make sure your server/bundler serves `.wasm` files with `application/wasm` MIME type.

## Build

```powershell
npm install
npm run build
```

This produces `dist/` with ESM/CJS bundles and `dist/types` with TypeScript declarations. The `pkg/` folder is included in the published package for runtime.

## Contributing

See `CONTRIBUTING.md` for development, testing and PR guidelines.

## License

MIT

