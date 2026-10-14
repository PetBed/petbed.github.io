# Physical Fossil Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abstract prototype with a playable, browser-based top-down factory where the player places machines and routes physical items from excavation through fossil processing and manual discovery.

**Architecture:** Keep simulation state independent of rendering in plain JavaScript ES modules. Use a sparse integer tile grid for world placement and a Canvas 2D renderer for the pixel-art map, with compact in-game overlays for controls and inventory. Persist versioned saves in IndexedDB; the active site ticks physically, while inactive sites reuse bounded physical ticks that preserve machine slots and connected routes.

**Tech Stack:** Vanilla JavaScript ES modules, HTML, CSS, Canvas 2D, IndexedDB, Node.js built-in `node:test`, and `fake-indexeddb` as a development-only test dependency.

**Spec:** `docs/superpowers/specs/2026-10-14-fossil-factory-game-design.md`

## Global Constraints

- The factory is physical and played directly on a top-down 2D grid.
- Free pan and zoom; minimap for expansion.
- Factorio is the hard reference for presentation and factory readability.
- Use original pixel-art tiles and sprites, not Factorio assets.
- Machines and logistics are placed and routed by the player; no factory abstraction.
- The first playable includes belts and splitters only; filters and combiners are later additions.
- Materials, not coins, pay for construction and expansion.
- Coal is a shared input for power and material processing, including steel.
- Fossil finishing outputs complete unidentified fossils to inventory.
- The player manually opens fossils from inventory; RNG determines the result at that point.
- Every site keeps its factory; no material transfers between sites.
- Fossils can move between museums; bonuses apply only at the museum's site.
- New sites are founded by spending materials at the current site.
- The first playable has no fossil set bonuses; set bonuses are deferred.
- Keep the world as the primary screen; do not use a conventional web-page dashboard aesthetic.

## Review Focus

- Invalid or occupied tile placement must leave the world and resource balances unchanged; cover in `world-grid.test.js`.
- A belt with no valid downstream route must retain its item rather than lose or duplicate it; cover in `logistics.test.js`.
- Insufficient power or missing recipe inputs must pause production without consuming partial inputs; cover in `game-core.test.js`.
- Opening an already-opened fossil or an unknown fossil ID must not award a second result; cover in `fossils.test.js`.
- A malformed, missing, or older save must report a recoverable load error or migrate explicitly, never silently replace the player's data; cover in `storage.test.js`.

---

### Task 1: Define the physical world and placement rules

**Files:**
- Modify: `src/game-core.js`
- Create: `src/world-grid.js`
- Create: `src/buildings.js`
- Test: `tests/game-core.test.js`
- Create: `tests/world-grid.test.js`

**Interfaces:**
- `createInitialState() -> GameState` creates a version-1 save with active `site-1`, a guaranteed-resource starting area, a sparse tile grid, a functioning starter excavator and warehouse, 12 coal, 16 iron, 20 stone, 16 sediment, no starting steel/concrete, empty fossil inventories, and a `nextEntityId`.
- `placeBuilding(state, buildingId, x, y, rotation) -> { ok, reason? }` places an excavator, generator, smelter, crusher, fossil finisher, or splitter only on valid unoccupied tiles and deducts its material cost on success.
- `placeBelt(state, x, y, direction) -> { ok, reason? }` places one belt tile using the same occupancy and payment rules.
- `src/buildings.js` exports the footprint, rotation, port, and construction-cost definitions used by placement and rendering.
- World coordinates are integer tile coordinates; machine rotations are `0`, `90`, `180`, or `270`; missing sparse-grid cells are traversable ground.
- Map-generation call: guarantee the starting site's core resource nodes, then generate additional resource/fossil nodes as the player explores.

- [ ] **Step 1: Write failing tests** named `createsGuaranteedStartingSite`, `placesBuildingAndDeductsCost`, and `rejectsInvalidOrOccupiedPlacement`; assert the starter resources and excavator exist, successful placement deducts the definition's exact cost, and each rejected placement leaves the full state unchanged.
- [ ] **Step 2: Run `npm test`** and verify the new assertions fail for missing world/placement behavior.
- [ ] **Step 3: Implement the state shape and placement functions** in `src/game-core.js` and `src/world-grid.js`; failed placements must not mutate state.
- [ ] **Step 4: Run `npm test`** and verify placement and existing core tests pass.
- [ ] **Step 5: Commit** as `feat: add physical factory grid and placement`.

### Task 2: Route physical items on belts and splitters

**Files:**
- Create: `src/logistics.js`
- Test: `tests/logistics.test.js`

**Interfaces:**
- `tickLogistics(site, deltaSeconds) -> void` advances item positions on placed belts and transfers items only to connected belts or machine ports.
- `setSplitterOutputs(site, splitterId, outputDirections) -> { ok, reason? }` configures the splitter's two distinct output directions.
- A belt stores at most one item; each belt has an explicit direction.
- A splitter accepts one input and routes each item to the next available configured output in deterministic alternating order.
- Belt movement is one tile per second; blocked items wait without changing ownership.

- [ ] **Step 1: Write failing tests** named `movesItemOneTilePerSecond`, `transfersItemToMachinePort`, `retainsBlockedItemWithoutDuplication`, and `alternatesSplitterOutputs`; assert exact tile/item state after each one-second tick.
- [ ] **Step 2: Run `npm test`** and verify the logistics tests fail.
- [ ] **Step 3: Implement `tickLogistics`** in `src/logistics.js` using item ownership by one tile at a time.
- [ ] **Step 4: Run `npm test`** and verify all route and retention assertions pass.
- [ ] **Step 5: Commit** as `feat: simulate belts and splitters`.

### Task 3: Simulate excavation, power, and material recipes

**Files:**
- Modify: `src/game-core.js`
- Modify: `src/buildings.js`
- Modify: `src/logistics.js`
- Create: `src/recipes.js`
- Modify: `tests/game-core.test.js`
- Modify: `tests/logistics.test.js`

**Interfaces:**
- `tickSite(site, deltaSeconds, rng = Math.random) -> SiteEvents` advances resource extraction, machine recipes, and power; it calls `tickLogistics` for item movement.
- `SiteEvents` is `{ produced: Item[], consumed: Item[], blocked: { machineId, reason }[] }` and is used for in-world event feedback.
- `recipes.js` exports machine input/output, duration, power, and construction-cost definitions.
- Initial production buildings are a warehouse, excavator, generator, smelter, crusher, and fossil finisher; building footprints and ports are defined in `src/buildings.js`.
- A warehouse accepts resource, fragment, and unidentified-fossil items only through connected belt ports; its delivery updates that site's inventory.
- Excavators and processors emit items to physical output slots; disconnected outputs do not update inventory.
- Inputs are consumed atomically only when all recipe inputs and required power are available.
- Excavators output raw resources and typed fossil fragments into physical machine output slots; no fossil rarity/type RNG occurs here.

- [ ] **Step 1: Write failing tests** named `excavatorEmitsResourcesAndFragments`, `productionWaitsForPower`, `missingInputsRemainUnchanged`, `generatorCoalIsNotAlsoRecipeInput`, and `extractedItemsReachWarehouseOnlyThroughBelts`; assert item counts and machine progress before/after deterministic ticks and confirm disconnected output never enters inventory.
- [ ] **Step 2: Run `npm test`** and verify the new simulation assertions fail.
- [ ] **Step 3: Implement recipe data and `tickSite`** with deterministic elapsed-time accumulators and atomic input consumption.
- [ ] **Step 4: Run `npm test`** and verify production, shared coal use, and existing world/logistics tests pass.
- [ ] **Step 5: Commit** as `feat: add powered excavation and recipes`.

### Task 4: Process fragments and manually reveal fossils

**Files:**
- Modify: `src/game-core.js`
- Create: `src/fossils.js`
- Test: `tests/fossils.test.js`

**Interfaces:**
- `finishFossil(site, finisher) -> { ok, item?, reason? }` consumes processed fragment inputs and emits a complete unidentified fossil item from the finisher's output slot; the item enters that site's inventory only after reaching its warehouse by belt.
- `openFossil(state, siteId, fossilId, rng = Math.random) -> { ok, fossil?, reason? }` removes a valid unidentified fossil from that site's inventory and rolls family and rarity only when opened; a fossil ID can be opened once.
- `setMuseumDisplay(state, siteId, fossilId, slotIndex) -> { ok, reason? }` equips an owned identified fossil at that site's museum; site bonuses apply only to that site's machines.
- `expandMuseum(state, siteId) -> { ok, reason? }` spends materials to add one museum slot.
- The first playable has individual fossil bonuses only, with no partial- or complete-set bonus logic.

- [ ] **Step 1: Write failing tests** named `finishesUnidentifiedFossilWithoutRng`, `warehouseStoresOnlyBeltDeliveredFossils`, `openFossilRollsOnlyWhenRequested`, `rejectsSecondOpen`, `museumBonusIsSiteLocal`, and `expandingMuseumDeductsMaterials`; assert physical output, inventory identity, deterministic family/rarity, one-time reveal, local-only activation, and exact slot/cost changes.
- [ ] **Step 2: Run `npm test`** and verify the fossil tests fail against the current auto-roll behavior.
- [ ] **Step 3: Implement `finishFossil`, `openFossil`, `setMuseumDisplay`, and `expandMuseum`** in `src/fossils.js` and connect their state transitions to `src/game-core.js`.
- [ ] **Step 4: Run `npm test`** and verify manual reveal, inventory, and museum assertions pass.
- [ ] **Step 5: Commit** as `feat: add unidentified fossil discovery and museum`.

### Task 5: Render and interact with the living factory

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Create: `src/world-renderer.js`
- Create: `src/camera.js`
- Test: `tests/camera.test.js`

**Interfaces:**
- `drawWorld(context, state, camera, viewport) -> void` draws ground tiles, resources, machines, belts, splitter directions, and moving items in a crisp original pixel-art style.
- `screenToWorld(point, camera) -> { x, y }` converts pointer coordinates to integer grid coordinates.
- `camera.js` exports `panCamera(camera, dx, dy)`, `zoomCamera(camera, delta, anchor)`, and `screenToWorld`.
- Canvas is the main play surface; resource counts, build selection, inventory/opening, fossil collection, museum, and event messages are compact overlays rather than page sections.
- The minimap shows the explored map and current camera bounds and recenters the camera when clicked.

- [ ] **Step 1: Write failing camera tests** named `convertsScreenPointToTile`, `keepsZoomAnchorStable`, and `pansCamera`; assert exact world/tile coordinates after each transform, then run `npm test` to verify failure.
- [ ] **Step 2: Implement the camera helpers** and run `npm test` to verify the camera tests pass.
- [ ] **Step 3: Implement the Canvas renderer** with readable tile footprints and distinct visible items on belts; preserve the site as the dominant view.
- [ ] **Step 4: Replace the current panel layout** with world-first controls and wire placement, inspection, excavation, fossil opening, and museum actions to the simulation.
- [ ] **Step 5: Manually verify** pan, zoom, placement, moving items, minimap navigation, and narrow-window usability in a browser.
- [ ] **Step 6: Commit** as `feat: render interactive pixel-art factory world`.

### Task 6: Save and restore the physical factory

**Files:**
- Create: `src/storage.js`
- Modify: `package.json`
- Create: `package-lock.json`
- Modify: `app.js`
- Test: `tests/storage.test.js`

**Interfaces:**
- `saveGame(state) -> Promise<void>` writes a versioned save to IndexedDB.
- `loadGame() -> Promise<GameState | null>` loads and validates a save, applying explicit migrations for supported prior versions.
- `createInitialState()` is used only when no save exists; an invalid save surfaces an actionable error in the game UI and does not overwrite it.
- `fake-indexeddb` is a development-only dependency for exercising IndexedDB behavior under `node:test`.

- [ ] **Step 1: Write failing storage tests** named `roundTripsPhysicalState`, `returnsNullWhenNoSaveExists`, `rejectsMalformedSaveWithoutOverwrite`, and `migratesSupportedVersion`; assert placements, belt contents, inventories, museums, and save integrity.
- [ ] **Step 2: Run `npm test`** and verify storage behavior is not implemented.
- [ ] **Step 3: Implement versioned IndexedDB save/load** in `src/storage.js` and connect autosave and startup restoration in `app.js`.
- [ ] **Step 4: Run `npm test`** and verify save schema, migration, and error behavior pass.
- [ ] **Step 5: Manually verify** refresh restores the factory and a broken save produces a visible error without resetting the save.
- [ ] **Step 6: Commit** as `feat: persist factory state in indexeddb`.

### Task 7: Expand to material-funded sites and offline progression

This task extends the first playable slice; it is not a blocker for the one-site
factory loop.

**Files:**
- Modify: `src/game-core.js`
- Create: `src/sites.js`
- Modify: `src/storage.js`
- Modify: `app.js`
- Test: `tests/sites.test.js`

**Interfaces:**
- `foundSite(state, siteDefinitionId) -> { ok, reason? }` deducts the founding cost from the active site's materials and creates a new local factory without moving materials between sites.
- `switchSite(state, siteId) -> { ok, reason? }` changes the active site while preserving every site's placed layout and item routes.
- `simulateInactiveSite(site, elapsedSeconds) -> SiteEvents` applies bounded physical catch-up through the site's actual machines and connected routes, in 300-second chunks and capped at six hours per call; it must not advance disconnected or blocked production lines or rewrite the site's layout.
- `catchUpSite(site, currentTime, fallbackLastSimulatedAt)` calculates elapsed time from the site's last physical tick (or the save timestamp for older saves), runs bounded catch-up, and advances the site's timestamp so returning to a site catches up only that site's idle period.
- Fossil ownership is global; museum display and its bonuses remain site-local.

- [x] **Step 1: Write failing tests** named `foundingCostsActiveSiteMaterials`, `switchesWithoutLosingLayouts`, `sitesKeepMaterialsSeparate`, `fossilsTransferBetweenMuseums`, `museumBonusesStayLocal`, `inactiveCatchupRespectsConnectedRoutes`, and `catchesUpSiteFromItsLastSimulatedTime`; assert exact costs, preserved state, transfer ownership, local effects, and no production through blocked routes.
- [x] **Step 2: Run `npm test`** and verify the site tests fail.
- [x] **Step 3: Implement site definitions, founding, switching, and bounded inactive-site simulation** in `src/sites.js` and `src/game-core.js`.
- [x] **Step 4: Run `npm test`** and verify site isolation and catch-up tests pass.
- [x] **Step 5: Add compact site navigation and founding controls** without obscuring the active world; verify site switching and expansion in the browser.
- [x] **Step 6: Commit** as `feat: add material-funded site expansion`.
