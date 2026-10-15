# Factory Building and Feedback Improvements

## Intent

Make the existing fossil factory easier to understand, build, and watch without
replacing its physical grid, logistics, or core game loop. The player should be
able to recognize what is on the map, see where materials go, and lay out
affordable belt routes without mentally decoding directions or placing every
tile by hand.

## Why

At present, important information is hidden in small labels and implied by
visual direction. Construction is click-by-click, build costs are not
consistently visible, and machine contents are drawn outside their footprints.
The game should communicate its state directly and make construction feel
deliberate rather than fiddly.

## Existing Context and Constraints

- The game is a browser-based JavaScript game using a canvas for its continuous
  top-down grid and DOM panels for controls and inspection.
- World placement, logistics simulation, drawing, and save validation are
  already separated into modules. Keep those boundaries and the existing
  no-dependency browser setup.
- Buildings already define footprints, construction costs, input ports, and
  output ports. Belts cost one iron each.
- The simulation advances in whole-second steps, and offline catch-up depends
  on that deterministic simulation. Smooth drawing must not change production
  rates or saved simulation outcomes.
- A site has separate resource, fragment, and unidentified-fossil inventories.
  Removed machine contents must return to the matching inventory at that site.
- Saves may contain the current one-belt-per-tile representation. Existing
  saves must remain loadable if crossing tracks require a richer representation.

## Goals

1. Make map contents, machine flow, building orientation, and construction
   costs obvious before the player commits resources.
2. Let players draw a belt route between two tiles, previewing its shortest
   valid path continuously and committing it on release.
3. Make belt movement appear continuous while keeping simulation deterministic.
4. Let players remove placed buildings and belts with a full construction-cost
   refund, without losing stored items.
5. Ensure adjacent and crossing belt lines transport items according to their
   own directions.

## Detailed Behavior

### Readable Map and Building UI

- Distinguish ordinary ground, resource deposits, belts, and each machine type
  at a glance using the game's existing restrained, pixel-like visual style.
  Labels or icons should remain legible at the normal playable zoom.
- Draw a clear flow arrow on each belt. Machine input and output ports must be
  visibly different from one another and show the direction items travel;
  compass words may supplement but must not be the only way to infer direction.
- When a machine is selected for construction, show a footprint preview that
  follows the pointer, including its rotated footprint and port indicators.
  Invalid placement and insufficient materials must be visually distinct from
  a valid, affordable preview.
- Show each building's full cost in the build menu at all times, using distinct
  visual resource icons—not abbreviations alone—alongside readable resource
  names and quantities. Clearly indicate whether the active site can afford
  the selected building. Keep the HUD's existing resource totals legible and
  pair each amount with its matching icon and accessible full resource name.
- Keep machine input and output contents visually inside the machine's
  footprint. Show the held items or a compact count/slot representation without
  obscuring the machine identity, ports, or orientation.
- Inspection should explain the selected machine's inputs, outputs, inventory,
  and facing direction in plain language. It should also expose a remove action
  for placed machines and belts.

### Belt Routing and Preview

- With the belt tool selected, dragging from a start tile to an end tile
  continuously updates a visible route preview. Releasing commits the route;
  cancelling the gesture commits nothing.
- Find a shortest four-direction grid path between the endpoints. Route around
  occupied machine footprints; resource deposits do not block belt placement,
  consistent with current placement behavior. Resolve equally short routes
  deterministically so the preview does not flicker between alternatives.
- Both drag endpoints are empty tiles. Existing belts are usable along the
  intermediate route, not obstacles; reusing a belt costs no materials and
  must not alter its existing direction or item flow. To join a main belt, end
  the route on an empty tile next to it and point the route into that belt.
- A perpendicular crossing through an existing belt is free. Represent the two
  tracks as independent lanes at that tile: items continue straight along
  their own original directions and do not turn, merge, or block one another
  just because the lanes cross. A new crossing lane does not consume iron.
- When a belt feeds into another belt in the next tile (including a
  perpendicular connection to a main line), the item joins that belt and
  follows its direction. This is a connection, not a same-tile crossing.
- Model lane directions and connections as reusable logistics rules, rather
  than adding one-off behavior for particular crossing shapes or map layouts.
- New non-crossing belt tiles cost the existing belt construction cost. The
  preview must account for materials at the active site and stop at the last
  consecutive tile that can actually be built when stock runs out. Reused
  existing belts remain free. Previewing must not spend resources; on release,
  revalidate the path and stock, place only the buildable portion, charge only
  for new tiles, and report any unbuilt remainder clearly.
- Each newly placed belt segment follows the route's travel direction, including
  bends. The visual preview must make its path and directions readable.
- A route whose start or end cannot be used, or for which no valid route can be
  produced, must not silently place a partial path. Show a clear invalid state
  and leave materials and the world unchanged.

### Item Movement and Belt Connections

- Items should glide smoothly along their belt lane rather than visibly hopping
  tile-to-tile. Drawing may interpolate between simulation steps, but must not
  mutate inventory, duplicate items, skip items, or alter the simulation's
  deterministic one-step logistics behavior.
- Preserve correct visual behavior for blocked belts: an item must not appear
  to pass through an occupied destination, and it should resume movement once
  the route is clear.
- When one belt feeds the next, items transfer without being dropped. At
  perpendicular crossings, the independent-lane rule above takes precedence:
  the item continues along its original direction rather than adopting the
  crossing belt's direction.
- Preserve the existing machine-port and warehouse delivery semantics.

### Removal and Refunds

- Provide a direct remove control when inspecting a placed machine or belt.
- Add a dedicated Remove button to the main build toolbar so the player can
  enter a clear removal mode.
- In removal mode, clicking a machine removes that machine. Clicking a belt tile
  removes every belt lane on that tile; inspector controls remain available for
  removing one specific lane.
- Dragging in removal mode immediately removes all belt lanes on each tile
  swept by the cursor. Include grid tiles between pointer events so fast drags
  do not skip belts. A belt crossing removes both lanes on that tile. Dragging
  never removes machines; a machine is removed only by a direct click.
- Removing a player-built machine refunds the full construction cost actually
  paid for it at the active site. Removing a belt refunds its full belt cost.
  Pre-placed starter buildings that did not cost materials do not mint a
  refund. Removal must not refund more than was spent or create negative/invalid
  inventory values.
- Return every stored input and output item in a removed machine to the
  matching inventory at that site: resource items to site resources, fragments
  to fragment inventory, and unidentified fossils to fossil inventory.
  Do not discard those items. Unfinished progress is not a separate material
  refund.
- Removing a belt that carries an item must also return that item to its
  matching site inventory rather than destroying it.
- Removal and refunds update the map, inspector, resource display, save, and
  factory log consistently.

## Non-Goals

- Replacing the canvas world, changing the game engine, or adding a runtime
  dependency.
- Rebalancing recipes, production rates, building costs, or site progression.
- Adding new machines, belt speeds, filters, splitters, or resource types.
- Replacing the world with an abstract factory graph or menu-driven production
  system.
- Redesigning unrelated museum, fossil collection, site navigation, or save
  features.

## Anti-Goals

- Do not make players infer machine ports or belt travel direction from text
  alone.
- Do not show a preview that implies unaffordable tiles will be placed.
- Do not let preview or removal silently lose, duplicate, or spend items.
- Do not make perpendicular belt crossings silently turn or merge item flows.
- Do not make visual smoothing change offline progress or simulation results.
- Do not break existing saved factories when adding crossing-lane support.

## Acceptance Checks

- A player can identify ground, deposits, belts, and each machine type at a
  glance, and can see every machine's inputs, outputs, and orientation.
- Every build option exposes its exact cost before selection or placement, and
  a building preview communicates footprint, rotation, placement validity, and
  affordability.
- The main toolbar exposes a Remove mode. Clicking a machine removes and
  refunds it; clicking a belt tile removes its belt lanes. Dragging immediately
  removes belts under and between cursor positions, including both lanes at a
  crossing, while leaving any machine under the sweep untouched.
- A drag between empty endpoints shows an updated shortest route, routes around
  buildings, reuses existing belts, connects into adjacent main belts, shows
  independent perpendicular crossings, and commits only its affordable
  buildable prefix.
- Insufficient stock does not get spent during preview; on release, resources
  decrease by exactly the cost of newly built tiles.
- A continuous belt line carries an item without a visible tile-boundary jump;
  blocked transport remains correct.
- Removing each player-built structure restores only construction materials
  actually spent, exactly once, and returns any carried/stored items to the
  correct site inventory.
- Remove-mode belt dragging deletes every crossed belt lane immediately,
  including both lanes at a crossing, and never deletes a machine under the
  cursor sweep.
- A perpendicular lane crossing preserves both flows, while a belt feeding
  into an adjacent belt joins that belt's flow direction.
- Existing saves load with their belts and machine state intact.
- Targeted automated tests cover shortest paths, blockers, existing belt reuse,
  crossing flows, stock-capped previews/commits, refunds, item preservation,
  and legacy-save compatibility; the full existing suite still passes.

## Implementation Calls for the Builder

- Keep the current visual language and resource abbreviations as supplemental
  labels; add distinct small resource symbols so materials are not text-only.
  Improve legibility rather than introducing a new art direction.
- Use a deterministic shortest-path search over the open grid. The specific
  tie-break order is an implementation detail, provided equal-cost previews
  remain stable.
- Put a dedicated Remove mode button in the build toolbar, retain the
  inspector's lane-specific remove controls, and make a belt drag erase
  immediately without requiring a release confirmation.
- Sweep every grid cell touched between successive pointer positions during
  belt removal; never treat a drag-over machine as a removal target.
- Preserve mouse camera panning gestures. In belt mode, a primary-button drag
  is a route gesture; keep an explicit inspect/pan mode available so touch
  users can still pan the world.
- Keep save compatibility by normalizing or migrating existing single-lane
  belts into the new representation rather than discarding or resetting saves.
- Use existing project test conventions and add focused regressions for all
  behavior changes; do not add dependencies just for testing.
