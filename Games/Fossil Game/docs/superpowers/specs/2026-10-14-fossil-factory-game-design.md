# Fossil Factory Game — Design Brief

## Intent

Create a browser-based fossil collection idle game that plays as a physical,
top-down factory-building game. The player excavates fossil fragments and raw
materials, builds and routes an expanding industrial operation, and eventually
opens completed but unidentified fossils to reveal collection results.

The factory and its logistics are gameplay, not a presentation layer over
abstract production numbers. The main play space is a continuous gridded world
where machines occupy tiles, belts carry visible items, and the player can
inspect activity by panning and zooming.

## Why

The game combines two rewards:

- Designing a growing, interconnected production system where shared resources,
  power, recipes, and layout all matter.
- Completing a fossil collection through an RNG reveal that the player chooses
  to open, rather than receiving a finished identified fossil directly from
  excavation.

The material chain should make players return to optimize supply and production;
the fossil collection should give that work long-term goals and discoveries.

## Goals

- A playable browser game with a single continuous top-down 2D gridded world.
- A clearly readable factory where machines and logistics are physically placed.
- Visible item movement along player-routed belts.
- Deep, interconnected, material-based production with shared inputs and power.
- Fossil processing that scales with industrial progression.
- A deliberate inventory-based fossil-opening action where type and rarity are
  determined by RNG.
- Expansion to new dig sites without wiping existing factories.

## Non-Goals

- A conventional website, dashboard, or set of resource-management forms as the
  primary play experience.
- Abstract factory links or production chains that hide item transport and
  machine placement from the player.
- A coin-based construction economy.
- Direct RNG drops of completed, identified fossils from excavation.
- Factory-wiping prestige or rebirth.
- Copying Factorio's proprietary art, sprites, exact interface, or other
  distinctive assets.

## Anti-Goals

- Do not let the map become decorative scenery behind a menu-driven idle game.
- Do not replace physical routes, item movement, or machine interactions with
  unexplained rate summaries.
- Do not make all fossil discoveries happen automatically while the player is
  away: finished unidentified fossils wait in inventory for the player to open.
- Do not allow one site's materials to solve another site's local production
  problems.
- Do not make advanced fossil preparation available before the factory can
  supply its required materials and infrastructure.

## Core Play Experience

The player starts at a dig site, places machines on a tile grid, and routes
materials between them. Excavators collect raw resources and distinct fossil
fragment types. Machines process those resources into intermediate and advanced
materials. Belts carry items through the factory and splitters provide the
first-playable routing choices; filters, combiners, and other logistics
components are later additions. Machines consume power from the site's grid, so
fuel used for power competes with fuel and materials needed by recipes.

The factory runs while the player is away. Returning to the game should make it
possible to see production and meaningful outcomes from the time spent idle.
The world remains the main view while playing: the player freely pans and zooms
across the continuous site and uses a minimap to navigate as the factory grows.
Compact game controls can overlay the world, but should not obscure or replace
it.

## Material and Power Economy

Production is a network of shared resources, not a set of independent recipe
buttons. A material can have multiple valuable uses. For example, coal may:

- Burn as fuel in generators to supply machine power.
- Provide heat for smelting.
- Combine with iron in a steel recipe.

This creates real allocation and logistics decisions. A player who routes too
much coal to steel may starve generators; one who burns all coal may block
advanced recipes. Recipes, machine rates, and resource use should be data-driven
and balanceable.

Building machines and expanding museum capacity costs materials, not coins.
New sites add new raw materials alongside core materials so familiar production
can branch into new or more effective routes.

## Fossil Lifecycle and Collection

The intended sequence is:

1. Excavation yields fossil fragments and raw materials, not identified fossils.
2. Players route fragments through physical machines and belts for preparation.
3. Preparation capability expands with the factory. Early infrastructure can
   finish basic fossils; advanced fossil preparation needs higher-tier
   infrastructure and materials.
4. A fossil-finishing machine outputs a complete, unidentified fossil.
5. The unidentified fossil is stored in inventory.
6. The player manually opens an item from inventory. The RNG reveal determines
   the fossil's type and rarity, like opening a collectible pack.
7. The identified fossil enters the permanent collection and can be displayed
   in a museum.

There is one museum per site. Fossils can be moved freely between site museums,
but a displayed fossil's bonus applies only to the site where it is displayed.
Museum slots are limited and expand through material investment. Fossils do
not decay or lose ownership when removed or transferred. The collection may
include partial and completed fossil sets with bonuses as described in the
existing discussion; exact set and bonus rules remain for implementation
planning.

## World and Site Progression

The world is open and contains resource nodes. New sites/maps are optional
expansions, not resets: moving to a new site creates a fresh local factory while
existing sites remain active and playable. Sites have no material transfers;
fossils are the collection that can move between museums.

Not all fossils are available at every site. New sites introduce additional raw
materials and fossil pools. A new site is founded by spending materials at the
current site. Players should be able to return to older sites to continue
building and exploring.

Map generation must not strand a player without required core resources. The
implementation will guarantee core resource nodes in the starting area and
generate additional resource and fossil nodes as the player explores. This is
an implementation choice, not a player-selected requirement.

## Visual and Interaction Direction

- Use Factorio as a hard reference for a readable overhead factory: clear
  machine footprints, understandable belts, visible item flow, and practical
  in-game controls. Use original pixel-art tiles and sprites.
- Keep the world as the primary screen; do not use a conventional web-page
  dashboard aesthetic.
- The camera supports free panning and zooming over one continuous site.
- A minimap supports orientation and navigation across expanded sites.
- Physical machine placement and hand-routed item logistics are central.
- Belts are general-purpose item transport. Logistics options such as splitters,
  filters, combiners/connectors, and later belt variants or underground/overhead
  transport provide routing decisions.
- Convey gameplay events in-world where practical: machine state, item flow,
  completed fossil production, and resource movement should be observable on
  the map.
- Use original art and a project-specific interface rather than recreating
  Factorio assets or exact UI.

## Browser and Idle Constraints

- The game runs in a browser and supports persistent saves and offline progress.
- The active site should visibly simulate its physical factory.
- Multiple background sites and offline simulation must preserve the player's
  actual placed layout and item routes. Any performance optimization must not
  turn the factory into an abstract production network from the player's
  perspective.
- Storage technology, simulation scheduling, offline catch-up, and rendering
  approach are implementation decisions to settle in the build plan.

## First Playable Slice

The first playable version should prove the relationship among physical
excavation, materials, power, routing, and fossil reveals on one site:

- A starting area with a dig operation and several core resource sources.
- A compact set of machines that mine or process raw materials.
- At least one shared-resource choice, such as allocating coal to generation,
  smelting, or steel production.
- Placeable belts and splitters that visibly move items; filters, combiners,
  and other advanced logistics are out of scope for this slice.
- A fossil preparation/finishing chain that requires increasing infrastructure
  for higher tiers and produces unidentified fossils.
- An inventory action to open a fossil and reveal its randomized type and
  rarity.
- A collection/museum surface to see the revealed fossil and activate an
  equipped individual-fossil bonus. Fossil set bonuses are deferred until after
  the first playable.

Initial machine/recipe quantities, costs, rates, starting resource quantities,
and exact individual-fossil bonus values are implementation-plan decisions.

## Decisions Already Made

- Browser-based game.
- The factory is physical and played directly on a top-down 2D grid.
- Free pan and zoom; minimap for expansion.
- Factorio is the hard reference for presentation and factory readability.
- Use original pixel-art tiles and sprites, not Factorio assets.
- Machines and logistics are placed and routed by the player; no factory
  abstraction.
- Belts transport items; splitters, filters, combiners, and related logistics
  components handle routing. The first playable includes belts and splitters
  only; filters and combiners are later additions.
- The factory has deep, interconnected material recipes and a power system.
- Materials, not coins, pay for construction and expansion.
- Coal is a shared input for power and material processing, including steel.
- Fossil preparation scales with industrial infrastructure and material tiers.
- Fossil finishing outputs complete unidentified fossils to inventory.
- The player manually opens fossils from inventory; RNG determines the result
  at that point.
- Every site keeps its factory; no material transfers between sites.
- Fossils can move between museums; bonuses apply only at the museum's site.
- Museum capacity grows by spending materials; fossils are permanent.
- New sites are founded by spending materials at the current site.
- The first playable has no fossil set bonuses; set bonuses are deferred.

## Open for the Builder to Decide

- The exact simulation tick, item representation, pathing, and belt throughput
  implementation, provided routes and item movement remain physical and visible.
- Exact UI details for inventory, fossil opening reveal, build selection, and
  machine inspection, provided the world remains primary.
- Initial resource/machine/recipe quantities and balance.
- How fossil-specific preparation requirements map to fossil types and tiers.
- Whether inventory supports one-at-a-time fossil opening only or optional
  batch opening.
- Exact individual-fossil bonus values and museum slot costs.

## Remaining Builder Decisions

- The implementation plan selects Canvas 2D, IndexedDB, a guaranteed-resource
  start with procedural expansion, and route-aware bounded catch-up for
  inactive-site simulation. In practice, Granite Reach costs 10 iron and 10
  stone, has its own local starting stock, and adds a copper deposit and a
  distinct fossil pool. Inactive sites reuse the physical site tick in
  300-second chunks, capped at six hours per catch-up. Per-site simulation
  timestamps let a factory catch up both after reload and when revisited during
  a play session. These are implementation calls, not additional player-selected
  requirements.
