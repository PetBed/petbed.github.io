# Belt Routing and Logistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players preview and commit shortest affordable belt routes while preserving independent crossing flows, connected-belt behavior, and smooth deterministic item motion.

**Architecture:** Keep `site.belts` as a flat list of directional belt lanes; permit distinct lane directions at the same coordinate. Add a pure route-preview API in `world-grid.js`, commit through a fresh revalidation, and keep pointer interaction in `app.js` while `world-renderer.js` draws previews and interpolated items.

**Tech Stack:** Browser JavaScript ES modules, HTML canvas, Node.js built-in `node:test`; no new runtime dependencies.

**Spec:** [../specs/2026-10-15-factory-qol-design.md](../specs/2026-10-15-factory-qol-design.md)

## Global Constraints

- Keep the existing no-dependency browser setup.
- Both drag endpoints are empty tiles.
- Find a shortest four-direction grid path between the endpoints.
- Resolve equally short routes deterministically so the preview does not flicker between alternatives.
- A perpendicular crossing through an existing belt is free.
- The simulation advances in whole-second steps, and offline catch-up depends on that deterministic simulation. Smooth drawing must not change production rates or saved simulation outcomes.
- Existing saves must remain loadable if crossing tracks require a richer representation.

## Review Focus

- Equal-length routes must return the same path on every preview — test `usesStableTieBreakForEqualShortestPaths` in Task 2.
- Building footprints block routes but resource deposits do not — test `routesAroundBuildingButOverResourceNodes` in Task 2.
- Existing directional lanes are reused, and perpendicular crossings remain independent and free — test `reusesExistingLaneAndAddsFreeCrossingLane` in Task 1.
- A connected perpendicular feed follows the receiving belt's direction, unlike a same-tile crossing — test `feedsIntoAdjacentPerpendicularBeltFlow` in Task 1.
- A blocked destination must not cause visible or simulated item loss at a tick boundary — test `retainsBlockedItemWithoutDuplication` in Task 1 and browser check `items-glide-and-stop-at-blocked-belt`.

---

## File Structure

- `src/logistics.js`: directional lane placement and item transfer rules.
- `src/world-grid.js`: shortest route preview, material-limited prefix, and route commit.
- `app.js`: pointer drag lifecycle and route preview state.
- `src/world-renderer.js`: route/lane visualization and smooth item interpolation.
- `src/storage.js`: retain validation/load compatibility for existing belt records.
- `tests/logistics.test.js`: crossing, connection, and blocked-flow regressions.
- `tests/world-grid.test.js`: route search, costs, and commit regressions.
- `tests/storage.test.js`: loading a legacy single-lane save and a crossing-lane save.

## Tasks

### Task 1: Support Directional Lanes, Crossings, and Connected Feeds

**Files:**
- Modify: `src/logistics.js`
- Modify: `src/world-grid.js`
- Modify: `src/storage.js`
- Test: `tests/logistics.test.js`
- Test: `tests/world-grid.test.js`
- Test: `tests/storage.test.js`

**Interfaces:**
- A lane remains a belt object in `site.belts` with unique `id`, `x`, `y`, `direction`, `item`, and `progress`. Distinct directions may share coordinates; duplicate lanes with the same coordinate and direction are invalid.
- Consumes: existing machine-port and warehouse delivery rules.
- Produces: a perpendicular crossing lane without iron cost; item transfers select a same-direction lane at a crossing, or join the receiving lane's direction when entering a belt in the next tile and no same-direction lane exists.

- [x] **Step 1: Write failing lane and transfer tests**

Add `reusesExistingLaneAndAddsFreeCrossingLane`, `feedsIntoAdjacentPerpendicularBeltFlow`, `keepsCrossingItemsOnTheirOriginalLanes`, and `rejectsDuplicateSameDirectionLane` to the relevant existing grid/logistics tests. Add `loadsLegacySingleLaneSave`, `loadsDistinctCrossingLanesAtOneCoordinate`, and `rejectsDuplicateSameDirectionLaneInSave` to `tests/storage.test.js`. Assert the crossing does not change either lane's direction, both items continue straight, adjacent feeds enter the receiving lane and follow its direction on the next step, and no iron is spent for the perpendicular crossing. A lane at a tile has a distinct direction from the other lane; for example:

```js
assert.deepEqual(site.belts.map(({ x, y, direction }) => ({ x, y, direction })), [
  { x: 10, y: 10, direction: 'east' },
  { x: 10, y: 10, direction: 'north' },
]);
assert.equal(site.resources.iron, ironBefore);
```

- [x] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/world-grid.test.js tests/logistics.test.js tests/storage.test.js`
Expected: FAIL because current placement rejects a second belt at a coordinate and transfer chooses by coordinate alone.

- [x] **Step 3: Implement lane-aware placement and movement**

Update `placeBelt(state, x, y, direction)` and logistics target selection to support one belt lane per coordinate/direction. Reuse an existing same-direction lane; add a perpendicular crossing lane for free; reject duplicate-direction placement. At an adjacent transfer, prefer a same-direction lane when present; otherwise transfer into the receiving belt so the item follows that belt's direction. Preserve machine-port and warehouse handling. Update save validation to allow distinct directions at a shared coordinate while rejecting duplicate lanes of the same direction. Retain the current serialized belt object shape; do not bump the save version unless the existing validator requires it.

- [x] **Step 4: Run focused regressions**

Run: `node --test tests/world-grid.test.js tests/logistics.test.js tests/storage.test.js`
Expected: PASS, including old single-lane transport and legacy-save tests.

- [x] **Step 5: Commit lane-aware logistics**

```bash
git add "Games/Fossil Game/src/logistics.js" "Games/Fossil Game/src/world-grid.js" "Games/Fossil Game/src/storage.js" "Games/Fossil Game/tests/logistics.test.js" "Games/Fossil Game/tests/world-grid.test.js" "Games/Fossil Game/tests/storage.test.js"
git commit -m "feat: support crossing belt lanes" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 2: Add Shortest-Path Route Preview and Material-Limited Commit

**Files:**
- Modify: `src/world-grid.js`
- Test: `tests/world-grid.test.js`

**Interfaces:**
- Produces: `previewBeltRoute(state, start, end) -> { ok, reason?, route?, buildableRoute?, cost?, complete? }`.
- Each route entry is `{ x, y, direction, kind }`, where `kind` is `new`, `reuse`, or `crossing`.
- Produces: `placeBeltRoute(state, start, end) -> { ok, reason?, placed?, reused?, cost?, remaining? }`; it reruns preview logic against current state before mutation.
- Invalid endpoint or unreachable-path results use `{ ok: false, reason }` and leave state untouched.

- [x] **Step 1: Write failing route-planning tests**

Add `findsShortestFourDirectionRoute`, `usesStableTieBreakForEqualShortestPaths`, `routesAroundBuildingButOverResourceNodes`, `requiresEmptyEndpoints`, `capsPreviewAtLastAffordableTile`, and `revalidatesAndCommitsOnlyAffordablePrefix` to `tests/world-grid.test.js`. Assert exact coordinates/directions for a small obstacle layout; confirm belt cells are reusable, crossings cost zero iron, only newly built non-crossing lanes cost one iron each, preview spends nothing, and commit spends exactly the returned cost.

- [x] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/world-grid.test.js`
Expected: FAIL because route preview and route commit exports do not exist.

- [x] **Step 3: Implement `previewBeltRoute(state, start, end)`**

Use A* with Manhattan distance and deterministic neighbor order `south`, `east`, `north`, `west`. Treat building footprints as blocked, resource nodes as passable, and intermediate belt lanes as reusable/crossable. Require both endpoints to be empty. Select the shortest geometric route first; apply material availability to that route afterward, exposing the full route and its consecutive buildable prefix without mutating state. An endpoint lane that should feed a main belt must face into the adjacent belt; an item then follows the receiving lane.

- [x] **Step 4: Implement `placeBeltRoute(state, start, end)`**

Recompute the route at release time, then commit only its current buildable prefix. Reuse existing lanes, create perpendicular crossing lanes free, charge one iron for each new non-crossing lane, and return the count/cost plus any unbuilt remainder. On invalid path or invalid endpoint, do not partially mutate the world.

- [x] **Step 5: Run focused route tests**

Run: `node --test tests/world-grid.test.js`
Expected: PASS for shortest routes, stable ties, blockers, free/reused lanes, affordability, and commit revalidation.

- [x] **Step 6: Commit shortest-path route planning**

```bash
git add "Games/Fossil Game/src/world-grid.js" "Games/Fossil Game/tests/world-grid.test.js"
git commit -m "feat: plan affordable shortest belt routes" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 3: Wire Drag-to-Route and Live Preview

**Files:**
- Modify: `app.js`
- Modify: `src/world-renderer.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `previewBeltRoute(state, start, end)` and `placeBeltRoute(state, start, end)` from Task 2.
- Produces: the current drag's preview object is passed to `drawWorld` and cleared on pointer release, cancellation, tool change, or site change.

- [x] **Step 1: Add belt drag state and pointer handling**

In `app.js`, distinguish a primary-button drag that starts while the belt tool is selected from the existing camera-pan gestures. Convert pointer screen positions through `screenToWorld`, update `previewBeltRoute` as the pointer moves, and call `placeBeltRoute` only on release. Preserve click-to-place for a single belt, right/middle/shift camera panning, inspect mode, and touch panning when inspect mode is active.

- [x] **Step 2: Draw the live route preview**

Extend `drawWorld` and `src/world-renderer.js` to draw every route tile with its direction, differentiating reused lanes, free crossings, affordable new tiles, and the unaffordable tail. On invalid endpoints, display a clear invalid preview without changing game state.

- [x] **Step 3: Handle cancellation and commit feedback**

Clear preview state on pointer cancellation, Escape, build-tool changes (including selecting Remove), and site changes. On release, refresh resources and inspection, persist the state, and report any unaffordable remainder or invalid route through the existing toast/log pattern.

- [x] **Step 4: Run the browser check**

Check `belt-drag-preview-and-commit`: drag a route around a building; verify the path updates while dragging and does not spend iron until release; confirm a short stock stops the preview at the last buildable tile; verify cancellation spends nothing; verify single-tile click placement and camera-pan gestures still work.

- [x] **Step 5: Commit drag routing**

```bash
git add "Games/Fossil Game/app.js" "Games/Fossil Game/src/world-renderer.js" "Games/Fossil Game/styles.css"
git commit -m "feat: add live belt route drawing" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 4: Smooth Belt Item Rendering

**Files:**
- Modify: `src/world-renderer.js`
- Test: `tests/world-renderer.test.js`

**Interfaces:**
- Consumes: `site.simulationAccumulator` as the fractional render time between deterministic simulation steps and the lane-aware logistics state.
- Produces: `getBeltItemPosition(site, belt) -> { x, y }` interpolates item positions without mutating the game state or simulation clocks; `drawBelt` uses this helper.

- [x] **Step 1: Write the failing render-purity test**

Add `interpolatesUnblockedItemBetweenBeltCenters`, `holdsBlockedItemAtItsCurrentCenter`, and `drawWorldDoesNotMutateItemOrSimulationState` to `tests/world-renderer.test.js`. For an eastbound item on `(10, 10)` with an empty destination `(11, 10)` and accumulator `0.5`, assert its render position is `(11, 10.5)` in tile-centered coordinates; with an occupied destination, assert `(10.5, 10.5)`; after rendering, assert a structured clone of the site is unchanged.

- [x] **Step 2: Run the test and verify it fails**

Run: `node --test tests/world-renderer.test.js`
Expected: FAIL because `getBeltItemPosition` is not defined.

- [x] **Step 3: Interpolate each lane's visible item position**

Implement `getBeltItemPosition(site, belt)` and update belt drawing to render a distinct track for each lane at a shared coordinate, then interpolate from the current lane toward its next cell using fractional simulation time. Stop blocked items at their current position; never draw through an occupied destination. Keep interpolation read-only and keep logistics progression exclusively in the existing fixed-step simulation.

- [x] **Step 4: Run tests and browser check**

Run: `node --test tests/world-renderer.test.js tests/logistics.test.js`
Expected: PASS.

Check `items-glide-and-stop-at-blocked-belt`: observe a long belt line for smooth, continuous travel; confirm items stay still when blocked; verify horizontal and vertical items cross without changing lanes; confirm a perpendicular adjacent feed joins the receiving belt direction.

- [x] **Step 5: Commit smooth item rendering**

```bash
git add "Games/Fossil Game/src/world-renderer.js" "Games/Fossil Game/tests/world-renderer.test.js"
git commit -m "feat: smooth belt item rendering" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 5: Run the Full Regression Suite

**Files:**
- Verify: all project tests

- [x] **Step 1: Run the complete suite**

Run: `npm test`
Expected: all tests pass.
