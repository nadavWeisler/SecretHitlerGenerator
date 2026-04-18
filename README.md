# Secret Hitler – Game Generator

A lightweight, single-page web app for generating printable role cards for [Secret Hitler](https://www.secrethitler.com/).

## Live site

https://nadavweisler.github.io/SecretHitlerGenerator/

## Screenshots

### Home screen

![Secret Hitler Generator home screen](https://github.com/user-attachments/assets/10cdcad8-39e3-4c4d-8cc5-759dd97bb6be)

### Print & Play Wizard

![Print & Play Wizard step](https://github.com/user-attachments/assets/898c5094-973a-4596-8d08-523182b83604)

## Features

- Two-step wizard: choose a player count (5–10), then customize role labels/images
- Roles are distributed according to the official rules and shuffled randomly
- Cards are labelled **Player 1 … Player N** — no names required
- Optionally customize role names and role images before generating
- PDF is downloaded automatically after generation; re-download or print anytime
- Tap a card in the on-screen preview to reveal the role privately; tap again to hide
- No server or build step required for usage — just open `index.html` in any modern browser

## Role distribution

| Players | Liberals | Fascists | Hitler |
|---------|----------|----------|--------|
| 5       | 3        | 1        | 1      |
| 6       | 4        | 1        | 1      |
| 7       | 4        | 2        | 1      |
| 8       | 5        | 2        | 1      |
| 9       | 5        | 3        | 1      |
| 10      | 6        | 3        | 1      |

## Usage

1. Clone or download this repository.
2. Open `index.html` in a web browser (no server required).
3. **Step 1** – Select the number of players (5–10) and click **Next: Customize**.
4. **Step 2** – Optionally rename roles or upload custom images, then click **Generate Print & Play Cards**.
5. A PDF is downloaded automatically. Use **🖨 Print Cards** to print directly, or **⬇ Download PDF** to save again.
6. Use **↩ Start Over** to reset the wizard and all customizations.

## Files

| File               | Description                              |
|--------------------|------------------------------------------|
| `index.html`       | App shell and markup                     |
| `style.css`        | Styling                                  |
| `script.js`        | DOM interactions and PDF generation      |
| `lib.js`           | Pure game logic utilities                |
| `tests/lib.test.js`| Jest tests for pure game logic           |

## Development

### Running tests

Pure game-logic is covered by [Jest](https://jestjs.io/) unit tests:

```bash
npm install   # install dev-dependencies (Jest)
npm test      # run all tests with coverage report
```

### CI / CD

Two GitHub Actions workflows keep the project healthy:

| Workflow | File | Trigger |
|----------|------|---------|
| **CI** – runs unit tests | `.github/workflows/ci.yml` | Every push / pull-request |
| **Deploy** – publishes to GitHub Pages | `.github/workflows/deploy.yml` | Push to `main` |

**CI** steps:
1. Checks out the code
2. Installs Node.js 20 and dependencies via `npm ci`
3. Runs `npm test` (Jest with coverage)

**Deploy** steps:
1. Checks out the code
2. Uploads the repository root as a Pages artifact
3. Deploys to GitHub Pages

> **Enabling GitHub Pages:** In the repository **Settings → Pages**, set the source to
> **GitHub Actions** so the deploy workflow has permission to publish.
