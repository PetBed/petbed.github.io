# Testing The Grand Reserve

## Requirements

- Node.js 18 or newer for the native test runner and `structuredClone`.
- Python 3 for the browser QA page's local static server. No project dependencies or network downloads are required for automated tests.

## Automated tests

Run the mechanics and regression suite:

```powershell
npm test
```

The suite uses production contract, crop, recipe, kettle, progression, market, and save-migration rules. Shared game state is snapshotted and restored around scenarios.

## Balance batch

Generate a deterministic JSON report:

```powershell
npm run test:balance -- --seed 20261001 --runs 500
```

Repeat with the same seed and run count to compare identical output. Change `--seed` to sample a different sequence. The report includes contract generation and solver failures, request complexity, perfect-match payout estimates, and market price distributions at baseline and elevated oversupply. These are measured baselines, not automatic design targets.

To save the report to a file:

```powershell
npm run test:balance -- --seed 20261001 --runs 500 > balance-report.json
```

## Browser QA bench

From the project folder, start a local server:

```powershell
python -m http.server 8768 --bind 127.0.0.1
```

Open `http://127.0.0.1:8768/testing.html`, run the production scenarios, and use **Run balance batch** to display or download a JSON report. The automated browser scenarios operate on cloned in-memory state and do not read or write the normal game save. Use the on-page checklist for UI and end-to-end flows that require interacting with the game.

Stop the server with `Ctrl+C` when finished.
