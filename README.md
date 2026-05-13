# Secret Hitler – Game Generator

A lightweight, single-page web app for generating printable role cards for [Secret Hitler](https://www.secrethitler.com/) and custom hidden-role variants.

## Live site

https://nadavweisler.github.io/SecretHitlerGenerator/

## Features

- **Official Print & Play Wizard** for the official 5–10 player Secret Hitler role distribution
- Role customization with editable labels, optimized image uploads, per-role resets, and saved local presets
- **Custom Game Builder** for defining custom roles, counts, icons, descriptions, art, and print themes
- Variant presets plus re-openable saved local configurations for house rules and experimental decks
- Export options for **US Letter / A4**, 2–3 column layouts, optional crop marks, optional card backs, duplex-friendly back ordering, PDF download, PNG sheet download, and direct printing
- Accessible on-screen previews with keyboard-reveal support and mobile-friendly action layouts

## Official role distribution

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
2. Open `index.html` in a modern browser.
3. Choose either:
   - **Print & Play Wizard** for official Secret Hitler decks, or
   - **Custom Game Builder** for your own variant roles.
4. Customize labels, art, layouts, and export settings.
5. Generate cards, then print them directly or download PDF / PNG sheet exports.

## Files

| File | Description |
|------|-------------|
| `index.html` | App shell and UI sections |
| `style.css` | Shared screen and print styling |
| `lib.js` | Pure game/deck/data helpers |
| `ui.js` | DOM rendering helpers for previews and print layouts |
| `exporters.js` | PDF / PNG export helpers and print-page layout logic |
| `script.js` | App state, browser events, presets, and flow orchestration |
| `tests/` | Jest coverage for logic, export helpers, and UI-oriented flows |

## Development

### Running tests

```bash
npm install
npm test
```

### CI / CD

Two GitHub Actions workflows keep the project healthy:

| Workflow | File | Trigger |
|----------|------|---------|
| **CI** – runs Jest tests | `.github/workflows/ci.yml` | Every push / pull request |
| **Deploy** – publishes to GitHub Pages | `.github/workflows/deploy.yml` | Push to `main` |

### Release process

1. Make changes on a branch and run `npm test` locally.
2. Open a pull request and wait for the **CI** workflow to pass.
3. Merge to `main`.
4. Confirm the **Deploy** workflow publishes the latest `main` branch to GitHub Pages.
5. Record user-facing changes in `CHANGELOG.md`.

## Roadmap and planning

- `ROADMAP.md` tracks planned product work in-repo.
- Mirror roadmap items into GitHub issues and milestones when triaging future work.
