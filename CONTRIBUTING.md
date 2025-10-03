# Contributing to OxidePlayer

Thanks for your interest in contributing! This document outlines quick guidelines to help your PRs get accepted smoothly.

How to contribute

1. Fork the repo and create a feature branch:

```bash
git checkout -b feat/my-change
```

2. Install deps and run the dev server locally:

```powershell
npm install
npm run dev
```

3. Make changes and add tests where appropriate. Keep changes small and focused.

4. Run the build and type-check before submitting:

```powershell
npm run build
```

5. Commit with a clear message and open a PR against `main`. Include a short description and screenshots or traces if relevant (for performance changes).

Coding guidelines

- Follow the existing TypeScript and React patterns in the codebase.
- Avoid large, unrelated changes in a single PR.
- For performance-sensitive changes (wasm or rendering), include a short profiling note and before/after traces if possible.

Testing wasm changes

- The `pkg/` folder contains the wasm artifacts. If you rebuild Rust code, make sure to place the generated `pkg/` files back into the repo or update the package copying logic.

License and CLA

By contributing you agree that your contributions will be licensed under the project's MIT license.

***

If you'd like, open an issue first describing larger changes and we'll discuss the design.