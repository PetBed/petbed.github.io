# Fossil Dig Idle Game Implementation Plan

## Goal
Build a browser-based fossil-dig idle game that merges RNG collection with factory logistics and site progression. The game should feel like a Satisfactory-inspired expansion loop, but with a fossil archaeology theme and a collection/museum reward system.

## Source
This plan is derived from the design discussion in [chat.md](C:/Users/MSI/Documents/G80/Games/Fossil%20Game/chat.md).

## Core Design Decisions
- The player alternates between two loops:
  - Dig loop: Excavations, RNG fossil discovery, collection completion, rare finds.
  - Factory loop: resource extraction, processing, power generation, smelting, and logistics optimization.
- The game should feel like Satisfactory-style relaxed expansion with deeper production planning, not a single linear chain.
- Fossils are not automatically active; they are displayed in a museum at each site.
- Each site has its own museum, but fossils can be moved between sites freely.
- Fossils are permanent once obtained; no decay.
- Museum slots expand through material investment, not milestones.
- Shared resources create meaningful tradeoffs (for example, coal can be used for power, smelting, or processing).
- New sites unlock with progress and materials, but older sites continue to run.

## Global Constraints
- Browser-first, local save friendly.
- Idle progression should work while the player is away.
- The first playable version should prioritize a complete loop over exhaustive content.
- The factory should be modular so future mechanic expansion is possible without a rewrite.
- All major systems should be data-driven to support balancing and future content.

## Product Scope
### MVP Scope
- One site with dig/extraction, a small factory, a power grid, smelting, and fossils.
- A museum with limited slots and fossil loadout bonuses.
- Collection progress for partial and complete fossils.
- Material costs for building machines and expanding museum slots.
- Save/load, offline earnings, and a basic loop.

### Post-MVP Scope
- Multi-site progression.
- Additional resource layers and unique site biome rules.
- More fossil families, rarity tiers, and bonus types.
- Deeper automation and belt/grid logistics.
- Prestige and rebirth paths.

## Task Plan

### Task 1: Define the MVP vertical slice
Objective: lock the smallest playable loop and conversion path.

Deliverables:
- Player loop definition: dig → collect resources → build factory → power machines → smelt materials → unlock better digs → collect fossils.
- Core resource list: coal, iron, stone, sediment, steel, concrete, rare minerals.
- Basic progression checklist: start with a base dig site and a small machine setup.
- A precise implementation target for the initial play session (5-10 minutes).

Acceptance criteria:
- A player can start from zero, make a first few machines, generate materials, and see a clear sense of progression.

### Task 2: Build the simulation and economy foundation
Objective: implement the core data model and tick-driven simulation.

Deliverables:
- Core state model for site, machine, resource, power, and museum.
- Resource registry and recipe table.
- Tick/update loop for production and idle accumulation.
- Save schema and local persistence.

Acceptance criteria:
- Resources update over time according to machine behavior and power availability.
- Saving and loading preserve state consistently.

### Task 3: Implement the dig sites and resource extraction loop
Objective: make the excavation system productive and rewarding.

Deliverables:
- Dig site layers with increasing rarity and resource values.
- Resource generation per site tick.
- Chance-based fossil discovery tied to site depth and layer.
- Partial fossil progress and completion logic.

Acceptance criteria:
- Digging produces both materials and occasional fossil discoveries.
- Deeper sites yield more valuable resources and rarer fossils.

### Task 4: Add the factory production systems
Objective: create a small but meaningful production network.

Deliverables:
- Machine placement/building system.
- Resource consumption and output rules.
- Smelter/processing recipes with multi-input dependencies.
- Material-based placement and refunds or deconstruction rules.

Acceptance criteria:
- A machine can consume inputs, produce outputs, and fit into a broader production chain.
- Basic balancing supports shared resource tradeoffs.

### Task 5: Add power and energy management
Objective: introduce a meaningful energy constraint.

Deliverables:
- Generators and fuel-based power production.
- Shared power grid with consumption tracking.
- Blackout or slowdown behavior when power is insufficient.
- Generator and machine efficiency tuning.

Acceptance criteria:
- The power system affects machine throughput and creates strategic decisions around coal usage.

### Task 6: Implement the fossil collection and museum system
Objective: connect fossils to gameplay bonuses and long-term collection progression.

Deliverables:
- Fossil definition table with rarity, family, part count, image, and bonus effects.
- Museum slots per site with expansion costs.
- Fossil placement and movement between museums.
- Active fossil bonuses only while displayed in a museum.
- Partial set bonuses and full set completion logic.

Acceptance criteria:
- Displayed fossils materially change site performance.
- Players can change the loadout without losing ownership of fossils.

### Task 7: Add multi-site progression and long-term replayability
Objective: expand the loop beyond one location.

Deliverables:
- Site unlocks tied to completed milestones and materials.
- Progression of new site types or resource-biome variation.
- A legacy site model where old sites keep running while new sites open.
- Scaling of difficulty and reward curve.

Acceptance criteria:
- New sites feel like progression rather than a reset.
- Site-specific optimization remains meaningful.

### Task 8: Polish, balance, and UX
Objective: turn the loop into a satisfying idle game.

Deliverables:
- UI polish for resource panels, museum management, and dig site updates.
- Rarity reveal effects and collection feedback.
- Offline progress summaries.
- Balancing pass across resource bottlenecks, fossil rarity, and power requirements.

Acceptance criteria:
- The game is understandable in a first session and rewarding over repeated play.

## Suggested Technical Architecture
### Frontend
- JavaScript or TypeScript with HTML/CSS for UI-heavy gameplay.
- Use a lightweight rendering layer (PixiJS or Phaser) only if animation becomes necessary.
- Keep systems data-driven with JSON-like recipe tables and rarity definitions.

### State Model
- Site state:
  - resources
  - depth/layer
  - fossil discovery counters
  - museum slots
- Factory state:
  - machines
  - placements
  - recipes
  - power usage
- Global state:
  - save version
  - inventory/material reserves
  - unlocked sites
  - discovered fossils

### Persistence
- Save to localStorage or a lightweight local JSON save file.
- Use a serializable game state object with versioning for migrations.
- Include offline progression calculations and return-to-game summary output.

## Risk Areas
- Shared-resource balancing can become too punishing if coal or steel is overused.
- Museum bonuses need to feel meaningful but not mandatory.
- Factory complexity can overwhelm early players if recipes are too opaque.
- Too much RNG without progression will reduce the feeling of agency.

## Recommended MVP Order
1. Dig site + resource generation
2. Basic machine and recipe loop
3. Power grid
4. Fossil discovery
5. Museum slot system
6. Save/offline progression
7. Site unlock progression
8. Polish and balancing

## Definition of Done for the MVP
- The player can dig for resources and fossils.
- The factory can process materials and create higher-tier outputs.
- The power system affects production throughput.
- Fossils can be collected, displayed, and provide meaningful bonuses.
- The game saves and continues offline.
- The loop clearly supports “dig, process, optimize, expand” across multiple sessions.

## Open Questions to Resolve Before Build
- How deep should the crafting tree go before the MVP ends?
- Should fossil bonuses be additive or capped to a max number of active bonuses?
- Should the player use a grid layout or a freeform placement system for machines?
- Should there be a prestige/rebirth system in the initial version or later?
- Does each site have unique resources, or are all sites resource-variant versions of the same core system?

## Implementation Note
This plan is intentionally scoped to a realistic MVP. The game’s biggest design risk is trying to implement the entire factory + fossil + multi-site system at once. The safest path is to ship a single-site, single-loop version first, then expand once the core relation between digging, processing, power, and fossil bonuses is proven fun.
