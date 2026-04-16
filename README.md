# Secret Hitler – Print & Play Wizard

A lightweight, single-page web app for generating printable role cards for [Secret Hitler](https://www.secrethitler.com/).

## Live site

https://nadavweisler.github.io/SecretHitlerGenerator/

## Screenshots

### Home screen

![Secret Hitler Generator home screen](https://github.com/user-attachments/assets/10cdcad8-39e3-4c4d-8cc5-759dd97bb6be)

### Print & Play Wizard

![Print & Play Wizard step](https://github.com/user-attachments/assets/898c5094-973a-4596-8d08-523182b83604)

## Features

- Wizard flow for creating print-and-play cards
- Add 5–10 players (names optional)
- Roles are distributed according to the official rules and shuffled randomly
- Customize role names and role images (defaults are the original role names/icons)
- Tap a player's card to privately reveal their role, tap again to hide it
- No server, no build step – just open `index.html` in any modern browser

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
3. Open **Print & Play Wizard**.
4. Add each player and click **Add** (or press Enter). Names are optional; generated cards use the format **Player 1**, **Player 2**, etc. Then click **Next: Customize**.
5. Optionally customize role names/images, then click **Generate Print & Play Cards**.
6. Click **Download PDF** to save the generated cards as a PDF, or **Print Cards** to print directly.

## Files

| File        | Description                          |
|-------------|--------------------------------------|
| `index.html`| App shell and markup                 |
| `style.css` | Dark, themed styles                  |
| `script.js` | Role logic and DOM interactions      |

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
