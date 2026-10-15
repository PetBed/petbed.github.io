# Map and Build Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make map objects, machine directions, construction previews, visual material costs, and machine inventories legible before the player commits materials.

**Architecture:** Keep the canvas world and DOM HUD. Share rotated building geometry between placement, logistics, inspection, and rendering so displayed ports match actual ports. Render build-menu costs from existing building definitions and pass a typed preview description to the world renderer.

**Tech Stack:** Browser JavaScript ES modules, HTML, CSS, Canvas 2D, Node.js built-in `node:test`; no new runtime dependencies.

**Spec:** [../specs/2026-10-15-factory-qol-design.md](../specs/2026-10-15-factory-qol-design.md)

## Global Constraints

- Keep the game's existing restrained, pixel-like visual style.
- Keep the existing no-dependency browser setup.
- Compass words may supplement but must not be the only way to infer direction.
- Keep machine input and output contents visually inside the machine's footprint.
- Show each building's full cost in the build menu at all times, using distinct visual resource icons—not abbreviations alone—alongside readable names and quantities.
- Do not redesign unrelated museum, fossil collection, site navigation, or save features.

## Review Focus

- Rotated footprints and port arrows must match actual logistics directions — test `transformsBuildingFootprintAndPortsForAllRotations` in Task 1.
- A deposit must remain buildable for an excavator while buildings and belts remain correctly blocked — test `keepsExcavatorPlacementOnResourceNode` and existing placement regressions in Task 1.
- Machine inventory positions must stay within small and large footprints at every rotation — test `keepsMachineInventoryMarkersInsideFootprint` in Task 3.
- Build-menu affordability must reflect the active site's changing stock, not stale amounts — include browser check `build-menu-costs-track-active-site-stock` in Task 2.
- Preview geometry/orientation must remain legible at normal zoom and on narrow screens, and inspection must explain machine flow — include browser checks `construction-preview-readable-at-desktop-and-mobile` and `machine-inspector-shows-ports-and-contained-inventory` in Task 3.

---

## File Structure

- `src/buildings.js`: shared footprint and rotated-port calculations alongside existing building definitions.
- `src/materials.js`: shared material labels, icons, cost rows, inventory rows, and affordability checks.
- `src/world-grid.js`: consume shared footprint geometry for occupancy checks.
- `src/logistics.js`: consume shared port geometry without changing transport behavior.
- `app.js`: build-menu cost/availability rendering, selected-building preview state, and inspection details.
- `src/world-renderer.js`: map identifiers, belt and port arrows, build previews, and contained machine inventory markers.
- `index.html`, `styles.css`: semantic build-menu content and responsive presentation.
- `tests/buildings.test.js`: geometry and rotation regressions.
- `tests/materials.test.js`: resource display and affordability regressions.
- `tests/world-renderer.test.js`: pure inventory-marker geometry regressions.

## Tasks

### Task 1: Share Rotated Building Geometry

**Files:**
- Modify: `src/buildings.js`
- Modify: `src/world-grid.js`
- Modify: `src/logistics.js`
- Test: `tests/buildings.test.js`
- Test: `tests/world-grid.test.js`
- Test: `tests/logistics.test.js`

**Interfaces:**
- Produces: `getBuildingFootprint(building) -> { left, top, right, bottom, width, height }`.
- Produces: `getBuildingPorts(building) -> [{ type: 'input' | 'output', x, y, direction }]`.
- `building` contains `type`, `x`, `y`, and `rotation`; rotation remains one of `0`, `90`, `180`, or `270`.
- Consumes: existing `BUILDING_DEFINITIONS`.

- [x] **Step 1: Write the failing geometry tests**

Add `transformsBuildingFootprintAndPortsForAllRotations` and `keepsExcavatorPlacementOnResourceNode` to the relevant tests. Assert exact footprint dimensions and transformed port coordinates/directions for all four valid rotations, and assert a new excavator can still be placed on an available resource node. For example, for a smelter at `(10, 20)` rotated 90 degrees:

```js
assert.deepEqual(getBuildingFootprint(building), {
  left: 10, top: 20, right: 11, bottom: 21, width: 2, height: 2,
});
assert.deepEqual(getBuildingPorts(building), [
  { type: 'input', x: 11, y: 19, direction: 'north' },
  { type: 'output', x: 11, y: 22, direction: 'south' },
]);
```

- [x] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/buildings.test.js tests/world-grid.test.js`
Expected: FAIL because the shared geometry exports do not yet exist.

- [x] **Step 3: Implement the shared geometry exports**

Implement `getBuildingFootprint(building)` and `getBuildingPorts(building)` in `src/buildings.js`. Replace the duplicated footprint and port transformations in `src/world-grid.js` and `src/logistics.js` with these exports. Keep placement validation and logistics results unchanged.

- [x] **Step 4: Run focused regression tests**

Run: `node --test tests/buildings.test.js tests/world-grid.test.js tests/logistics.test.js`
Expected: PASS, including the existing placement and machine-port tests.

- [x] **Step 5: Commit the geometry refactor**

```bash
git add "Games/Fossil Game/src/buildings.js" "Games/Fossil Game/src/world-grid.js" "Games/Fossil Game/src/logistics.js" "Games/Fossil Game/tests/buildings.test.js" "Games/Fossil Game/tests/world-grid.test.js" "Games/Fossil Game/tests/logistics.test.js"
git commit -m "refactor: share rotated building geometry" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 2: Show Build Costs and Affordability

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Create: `src/materials.js`
- Test: `tests/materials.test.js`

**Interfaces:**
- Consumes: `BUILDING_DEFINITIONS`, `BELT_COST`, and the active site's resources.
- Produces: each build choice displays distinct resource icons, readable material names and quantities, plus an affordable/unaffordable state that refreshes when the active site or stock changes. The resource strip pairs every amount with its matching icon and accessible full name.
- Produces: `getCostDisplayRows(cost)`, `getResourceDisplayRows(resources)`, and `canAffordCost(resources, cost)` in `src/materials.js`, with shared resource icon/name metadata used by both UI surfaces.

- [x] **Step 1: Test shared material display data**

Add `rendersKnownCostsWithIconsAndNames`, `showsResourceInventoryWithAccessibleNames`, and `checksAffordabilityAgainstCurrentStock` to `tests/materials.test.js`. Assert exact cost rows for the fossil finisher, named/iconed rows for every inventory resource, and true/false affordability when one required amount is below cost.

- [x] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/materials.test.js`
Expected: FAIL because the shared material display exports do not exist.

- [x] **Step 3: Add accessible cost markup**

Update the build-menu markup in `index.html` so every build button has a stable label area and a cost area; each material row must have an icon, readable full name, and quantity. Keep existing build IDs and keyboard shortcuts.

- [x] **Step 4: Render costs from definitions**

Implement the three tested helpers in `src/materials.js`. Update `renderBuildSelection()` in `app.js` to populate every button's cost from `BUILDING_DEFINITIONS` and `BELT_COST`, using distinct resource symbols plus readable names and quantities; existing abbreviations may remain supplemental. Update `renderResources()` to pair every current-site amount with the matching symbol and accessible full name. Update affordability during `updateHud()` so it follows active-site stock changes. Do not duplicate cost values in HTML.

- [x] **Step 5: Style cost and shortage states responsively**

In `styles.css`, make distinct resource icons, names, and quantities readable in the desktop build panel and narrow-screen build toolbar. Show shortage without relying on color alone.

- [x] **Step 6: Run focused tests and browser check**

Run: `node --test tests/materials.test.js`
Expected: PASS for cost rows, inventory labels/icons, and stock comparisons.

Check `build-menu-costs-track-active-site-stock`: verify every build choice shows a distinct icon, full material name, and exact cost before selection; reduce a required material and confirm the choice becomes unaffordable; switch sites and confirm the displayed affordability follows the new active site; verify the mobile toolbar does not clip icons or costs and the resource strip exposes full names accessibly.

- [x] **Step 7: Commit the build-menu update**

```bash
git add "Games/Fossil Game/index.html" "Games/Fossil Game/app.js" "Games/Fossil Game/styles.css" "Games/Fossil Game/src/materials.js" "Games/Fossil Game/tests/materials.test.js"
git commit -m "feat: show build costs and affordability" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 3: Draw Readable Machines and Construction Previews

**Files:**
- Modify: `app.js`
- Modify: `src/world-renderer.js`
- Modify: `styles.css`
- Test: `tests/world-renderer.test.js`

**Interfaces:**
- Consumes: `getBuildingFootprint(building)` and `getBuildingPorts(building)` from Task 1.
- Produces: `getMachineInventoryMarkers(building) -> [{ role, item, x, y, size }]`, used by the renderer and tests.
- Produces: `drawWorld(context, state, camera, viewport, preview = null)`; `preview` is `null` or a discriminated preview object. This task defines `type: 'building'` with `buildingType`, `x`, `y`, `rotation`, `valid`, and `affordable`; the belt plan extends the same parameter with `type: 'belt-route'`.

- [x] **Step 1: Write the failing inventory-layout test**

Add `keepsMachineInventoryMarkersInsideFootprint` to `tests/world-renderer.test.js`. Use a 2x2 smelter and a rotated 3x2 fossil finisher with more than four held items; assert every marker's full square (`x ± size / 2`, `y ± size / 2`) stays inside the rotated footprint and input/output markers remain distinguishable.

- [x] **Step 2: Run the test and verify it fails**

Run: `node --test tests/world-renderer.test.js`
Expected: FAIL because machine inventory is currently drawn outside the footprint and no marker helper exists.

- [x] **Step 3: Implement contained inventory markers and visible machine flow**

Implement and export `getMachineInventoryMarkers(building)` in `src/world-renderer.js`; use it to draw held items or compact slot counts inside the footprint. Draw distinct input/output port markers using shared geometry, belt direction arrows, and readable machine/resource identifiers without covering the machine label. Update `inspectTile(tile)` to list the selected machine's input and output directions and the names/counts of its held items in plain language.

- [x] **Step 4: Implement the construction footprint preview**

In `app.js`, compute the selected building preview from the pointer tile and selected rotation, including placement validity and affordability. Pass it to `drawWorld`. Draw the rotated footprint and port indicators in `src/world-renderer.js`, with distinct valid, occupied, and unaffordable states. Preserve click-to-place and the existing rotate/cancel controls.

- [x] **Step 5: Run tests and browser checks**

Run: `node --test tests/world-renderer.test.js tests/buildings.test.js tests/world-grid.test.js`
Expected: PASS.

Check `construction-preview-readable-at-desktop-and-mobile`: verify each machine type and all four rotations show the correct footprint and ports; blocked and unaffordable placements are visibly different; inventory markers remain inside machine squares at several zoom levels and on a narrow viewport.

Check `machine-inspector-shows-ports-and-contained-inventory`: inspect each machine type and confirm the panel names input/output directions and held items while every item icon stays inside the machine footprint.

- [x] **Step 6: Commit the map-feedback update**

```bash
git add "Games/Fossil Game/app.js" "Games/Fossil Game/src/world-renderer.js" "Games/Fossil Game/styles.css" "Games/Fossil Game/tests/world-renderer.test.js"
git commit -m "feat: clarify machine placement and map feedback" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 4: Run the Full Regression Suite

**Files:**
- Verify: all project tests

- [x] **Step 1: Run the complete suite**

Run: `npm test`
Expected: all tests pass.
