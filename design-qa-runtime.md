# Design QA Runtime

## Goal

Keep visual QA dependencies out of the app dependency tree. Do not install Playwright or Sharp into this app with `npm install --no-save`; it can rewrite package metadata and corrupt Next dev dependencies after Codex resumes.

## Runtime Layout

- App source and app dependencies: `work/repo`
- Visual QA dependencies: `work/qa-node`
- Visual QA script: `work/visual-diff-audit.mjs`
- Browser cache: `/private/tmp/ms-playwright`

`visual-diff-audit.mjs` uses `createRequire` from `work/qa-node/package.json`, so QA dependencies are isolated from the app.

## Recovery Steps After Resume

1. From `work/repo`, restore app dependencies if Next behaves oddly:

```bash
npm ci
```

2. Ensure QA dependencies exist without touching app `package.json`:

```bash
cd ../qa-node
npm install
```

3. Start the app from `work/repo`:

```bash
env NEXT_TELEMETRY_DISABLED=1 npm run dev -- --webpack -H 0.0.0.0 -p 3125
```

4. Run visual QA:

```bash
APP_URL=http://localhost:3125 PLAYWRIGHT_BROWSERS_PATH=/private/tmp/ms-playwright node ../visual-diff-audit.mjs
```

Never commit changes to app `package.json` or `package-lock.json` caused only by QA tooling.
