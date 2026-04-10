# Secret Hitler – Role Generator

A lightweight, single-page web app that randomly assigns secret roles to players for a custom game of [Secret Hitler](https://www.secrethitler.com/).

## Features

- Add 5–10 players by name
- Roles are distributed according to the official rules and shuffled randomly
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
3. Enter each player's name and click **Add** (or press Enter).
4. Click **Generate Roles** once all players are added.
5. Pass the device around – each player taps their card to see their role privately, then taps again to hide it before handing back.

## Files

| File        | Description                          |
|-------------|--------------------------------------|
| `index.html`| App shell and markup                 |
| `style.css` | Dark, themed styles                  |
| `script.js` | Role logic and DOM interactions      |
