# Removal and Refunds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a main Remove tool for clicking machines and sweeping belts, while retaining lane-specific inspector removal, exact material refunds, and complete item recovery.

**Architecture:** Add transactional removal APIs to `world-grid.js`, record construction payments on newly placed entities, and infer historical costs for existing saves without refunding free starter buildings. The main tool removes a clicked machine or all belt lanes at a clicked tile; belt drags immediately erase every belt lane in the swept grid tiles while ignoring machines. Inspector actions remain entity-ID keyed so a single crossing lane can still be removed.

**Tech Stack:** Browser JavaScript ES modules, HTML, CSS, Node.js built-in `node:test`, existing IndexedDB save layer; no new runtime dependencies.

**Spec:** [../specs/2026-10-15-factory-qol-design.md](../specs/2026-10-15-factory-qol-design.md)

## Global Constraints

- Keep the existing no-dependency browser setup.
- Removing a player-built machine refunds the full construction cost actually paid for it at the active site.
- Pre-placed starter buildings that did not cost materials do not mint a refund.
- Do not let preview or removal silently lose, duplicate, or spend items.
- Existing saves must remain loadable if crossing tracks require a richer representation.
- Removal and refunds update the map, inspector, resource display, save, and factory log consistently.
- Dragging in removal mode immediately removes all belts in each swept tile, including both lanes at a crossing, and never removes machines.

## Review Focus

- Free starter buildings must not create materials when removed — test `doesNotRefundPreplacedStarterBuildings` in Task 1.
- A player-built building, including one from a save predating `paidCost`, refunds its original cost exactly once — test `refundsRecordedConstructionCostExactlyOnce` and `infersHistoricalConstructionCostForLegacyBuiltEntity` in Task 1.
- Resource, fragment, and unidentified-fossil contents must return to their respective inventories — test `returnsMachineContentsToMatchingInventories` in Task 1.
- A remove-mode click removes a machine, while an immediate drag sweeps every crossed belt tile, deletes both lanes at a crossing, and skips machines — test `removeBeltsAtTilesDeletesAllLanesButNoBuildings` in Task 1 and browser check `remove-mode-click-and-belt-sweep` in Task 2.
- Failed removal or an unsupported held item must not partially mutate the state — test `rejectsInvalidRemovalWithoutPartialRefund` in Task 1.

---

## File Structure

- `src/world-grid.js`: removal APIs, construction-payment metadata, and deterministic grid sweep tiles.
- `app.js`: inspected-entity state, remove controls, refund feedback, persistence.
- `index.html`, `styles.css`: main Remove tool and inspector action presentation.
- `src/storage.js`: backward-compatible handling of old entities without payment metadata.
- `tests/world-grid.test.js`: refund and returned-item regressions.
- `tests/storage.test.js`: persist and reload after removal.

## Dependency

Implement this plan after [Belt Routing and Logistics](./2026-10-15-belt-routing-and-logistics.md), because remove-mode sweeps and inspector actions must identify every lane when several lanes share a tile.

## Tasks

### Task 1: Add Transactional Removal and Refund APIs

**Files:**
- Modify: `src/world-grid.js`
- Modify: `src/storage.js`
- Test: `tests/world-grid.test.js`
- Test: `tests/storage.test.js`

**Interfaces:**
- Produces: `removeBuilding(state, buildingId) -> { ok: true, refunded, returnedItems } | { ok: false, reason }`.
- Produces: `removeBelt(state, beltId) -> { ok: true, refunded, returnedItems } | { ok: false, reason }`.
- Produces: `removeBeltsAtTiles(state, tiles) -> { ok: true, removed, refunded, returnedItems } | { ok: false, reason }`; removes every belt lane at the listed coordinates and never removes buildings.
- Produces: `getGridLineTiles(start, end) -> [{ x, y }]`; returns each grid tile touched between two tile coordinates, including both endpoints in deterministic order.
- Newly placed entities store `paidCost` as a copy of the cost actually charged. A free crossing lane stores an empty cost.
- Consumes: existing site resource, fragment, and unidentified-fossil inventories.

- [x] **Step 1: Write failing removal tests**

Add `refundsRecordedConstructionCostExactlyOnce`, `doesNotRefundPreplacedStarterBuildings`, `infersHistoricalConstructionCostForLegacyBuiltEntity`, `returnsMachineContentsToMatchingInventories`, `removesOnlySelectedLaneAndReturnsItsItem`, `removeBeltsAtTilesDeletesAllLanesButNoBuildings`, `gridSweepIncludesEveryTouchedTile`, and `rejectsInvalidRemovalWithoutPartialRefund` to `tests/world-grid.test.js`. Add `rejectsMalformedPaidCostInSave` to `tests/storage.test.js`. Assert exact before/after site inventories, that unrelated entities remain, both crossing lanes are removed by a tile sweep, and a failed removal leaves a structured clone of the state unchanged. For a player-built generator, assert:

```js
const before = { ...site.resources };
assert.deepEqual(removeBuilding(state, generator.id), {
  ok: true,
  refunded: BUILDING_DEFINITIONS.generator.cost,
  returnedItems: 0,
});
assert.equal(site.resources.iron, before.iron + BUILDING_DEFINITIONS.generator.cost.iron);
assert.equal(site.resources.stone, before.stone + BUILDING_DEFINITIONS.generator.cost.stone);
assert.equal(site.buildings.includes(generator), false);
```

- [x] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/world-grid.test.js tests/storage.test.js`
Expected: FAIL because removal APIs and recorded construction costs do not exist.

- [x] **Step 3: Record costs actually paid**

Update `placeBuilding`, `placeBelt`, and route placement to store a copied `paidCost` on each created entity. Store `{}` for a free crossing lane. Preserve legacy refunds by using the building definition or belt cost when old placed entities lack `paidCost`, while recognizing the pre-placed starter building IDs as free. Extend save validation so an optional `paidCost` contains only known resource keys with finite, non-negative amounts.

- [x] **Step 4: Implement transactional `removeBuilding` and `removeBelt`**

Validate the entity and all held items before changing state. Refund recorded materials to the active site's resources; return resource items to `site.resources`, fragment items to `site.fragments`, and unidentified fossils to `site.unidentifiedFossils`. For a lane-specific removal, find the belt by unique ID so other lanes at the same coordinate are untouched. For `removeBeltsAtTiles`, remove every belt lane at those coordinates, aggregating refunds and returned items while ignoring buildings. Return `{ ok: false, reason }` without partial changes for invalid entities or unreturnable item types.

- [x] **Step 5: Run focused removal tests**

Run: `node --test tests/world-grid.test.js tests/storage.test.js`
Expected: PASS for exact refunds, starter buildings, all supported item types, lane-specific removal, and atomic failure.

- [x] **Step 6: Commit the removal APIs**

```bash
git add "Games/Fossil Game/src/world-grid.js" "Games/Fossil Game/src/storage.js" "Games/Fossil Game/tests/world-grid.test.js"
git commit -m "feat: add refundable structure removal" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 2: Add Main Remove Mode and Inspector Actions

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `removeBuilding(state, buildingId)`, `removeBelt(state, beltId)`, `removeBeltsAtTiles(state, tiles)`, and `getGridLineTiles(start, end)` from Task 1.
- Produces: a main-toolbar Remove mode. A direct click removes a machine or every belt lane at that tile; dragging immediately removes belt lanes in every swept tile and ignores machines. Inspector actions remain lane-specific.

- [x] **Step 1: Add the main Remove tool**

Add a dedicated Remove button to the main build toolbar in `index.html`. Update `renderBuildSelection()` and its click handler in `app.js` to select a distinct `remove` mode without treating it as a building or displaying a construction cost. Show a concise hint that a click removes a machine or belt tile and a drag sweeps belts.

- [x] **Step 2: Implement click-to-remove and immediate belt sweeps**

In remove mode, a click on a machine calls `removeBuilding`; a click on a belt tile calls `removeBeltsAtTiles` for that tile and removes all lanes there. While dragging, immediately call `getGridLineTiles` between successive pointer tiles and remove all belts on those swept tiles; do not remove machines during a drag. Batch state refresh and persistence by pointer-move segment, and summarize the removal/refund at gesture end. Preserve camera-pan gestures and ordinary click-to-build behavior outside remove mode.

- [x] **Step 3: Keep inspector removal lane-specific**

Update `inspectTile(tile)` to retain the selected machine and all belt lane IDs. Keep a direct inspector remove action for machines and a separate action for each belt lane; unlike the main tool's tile click/sweep, these inspector actions remove only their selected entity. On success, refresh the inspector, resource strip, factory log, toast, and persisted save; on failure, show the returned reason.

- [x] **Step 4: Style and verify the removal tool**

Style the selected Remove button and inspector actions clearly. Check `remove-mode-click-and-belt-sweep` in the browser: click a machine and confirm it is removed/refunded; click a crossing tile and confirm both lanes are removed; drag quickly across belts and a machine and confirm every traversed belt lane is immediately removed while the machine remains; use an inspector lane action to remove only one crossing lane.

- [x] **Step 5: Commit removal controls**

```bash
git add "Games/Fossil Game/app.js" "Games/Fossil Game/index.html" "Games/Fossil Game/styles.css"
git commit -m "feat: add removal tool and inspector actions" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 3: Verify Removal Persistence and Full Regressions

**Files:**
- Test: `tests/storage.test.js`
- Verify: all project tests

- [x] **Step 1: Write the save/reload regression**

Add `persistsRemovalRefundsAndReturnedItems` to `tests/storage.test.js`. Remove a player-built machine containing a resource and a belt containing a fragment, save and reload the state, then assert the exact resource, fragment, and entity lists.

- [x] **Step 2: Run the focused storage test**

Run: `node --test tests/storage.test.js`
Expected: PASS with unchanged save version when the serialized fields remain backward-compatible.

- [x] **Step 3: Run the complete suite**

Run: `npm test`
Expected: all tests pass, including the existing build, logistics, storage, and rendering regressions.

- [x] **Step 4: Commit the persistence regression**

```bash
git add "Games/Fossil Game/tests/storage.test.js"
git commit -m "test: preserve removal refunds across saves" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
