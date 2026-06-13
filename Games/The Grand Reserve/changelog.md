# The Grand Reserve - Changelog

## Version 0.3.0 - The Precision & Feedback Update

This update focuses on adding significant depth and skill expression to the contract system, rewarding precision and providing players with detailed feedback to help them master the art of winemaking.

### New Features & Gameplay Mechanics

*   **Precision-Based Payouts:** The contract system has been completely overhauled. Instead of a pass/fail system, payouts are now calculated based on how precisely your wine matches the customer's request.
    *   **20% Tolerance Window:** Customers will accept wines with an average flavour deviation of up to 20% from the target ranges.
    *   **Exponential Reward Curve:** The payout multiplier now scales exponentially. Perfect matches receive the maximum reward, while the penalty for inaccuracy grows significantly as you approach the 20% deviation limit.
    *   **Updated Multiplier Ranges:** Payout multipliers have been re-balanced to support the new precision system (e.g., 4-flavour contracts now range from `3.45x` to `5.00x`).
*   **Dialogue Difficulty Settings:** Players can now choose their preferred level of NPC dialogue complexity: **Beginner** (simple terms), **Sommelier** (professional vocabulary), and **Intermediate** (a 50/50 blend).
*   **Enhanced Flavor Text Engine:** The NPC request generator is now more dynamic, with varied sentence structures and improved grammar to make each request feel more unique.

### UI & UX Improvements

*   **Order Fulfillment Report:** After a successful contract sale, a new detailed report modal appears. It provides a side-by-side breakdown of the requested vs. submitted stats, individual flavour deviations, and a full calculation of the final payout.
*   **Qualitative Submission Feedback:** When submitting a wine for a contract, the UI now displays a qualitative rating (e.g., "A Perfect Match!", "An Excellent Offer") to give players immediate, intuitive feedback on their wine's suitability.
*   **Expanded Order Cards:** Contract cards on the order board now dynamically expand to show the full, untruncated text of the NPC's request.

### Developer & Playtesting

*   **Playtest Wine Spawner:** A new "Wine Spawner" has been added to the playtest sidebar, allowing developers to instantly create a wine of any recipe with specific, user-defined flavour values.
*   **UI Toggles:** The playtest sidebar now includes a toggle to show/hide the exact numerical target ranges on all contract cards.
*   **Collapsible Sidebar:** The playtest sidebar has been refactored with a clean, collapsible accordion layout for better organization.

---

## Version 0.2.0 - Flavours and Requests Update

This major update introduces the Customer Order Board, a dynamic contract system that challenges players to become true artisans of winemaking by fulfilling precise flavour requests for premium rewards.

### New Features & Gameplay Mechanics

*   **Customer Order Board:** A new "Orders" tab is now available, where local townspeople, critics, and merchants post specific requests for wines.
*   **Precision Winemaking:** Contracts require wines of a specific variety (e.g., Pinot Noir) that meet precise flavour ranges (e.g., Sweetness between 40-50%).
*   **The Solvability Engine:** Behind the scenes, a powerful new engine runs simulations to ensure every contract posted on the board is mathematically possible to create, preventing player frustration from impossible requests.
*   **Dynamic Contract Lifecycle:** New orders appear on the board every 10-15 minutes and expire if not accepted. Players can manage up to 3 active orders at a time, which do not expire.
*   **Enhanced Reward System:** Fulfilling contracts offers significant payout multipliers. The final reward is calculated as: `Market Value * (Tier Multiplier >= 1) * Vintage Multiplier * Order Multiplier`.
    *   **Order Multipliers:** `2x` for 1 flavour range, `2.5x` for 2, `3x` for 3, and `4x` for 4.

### UI & UX Improvements

*   **Styled Notifications:** Toast notifications are now color-coded: green for successful sales, red for errors, and the classic brown for general information.

### Bug Fixes

*   Resolved a visual bug where a wine's SVG image would remain on a rack slot after being removed.
*   Fixed an issue where newly purchased barrels would not appear in the cellar until the page was refreshed.
*   Restored missing UI update calls to ensure the player's gold total updates immediately after transactions.

---

## Version 0.1.2 - The Local Estate Update

This version overhauls the game's save system, moving from a cloud-based model to a more robust and reliable local storage system.

### New Features & System Changes

*   **Local Storage Saving:** Game progress is now saved directly to the browser's local storage. This removes the need for an internet connection or cloud sync codes and provides a more stable save experience.
*   **Automatic Saving:** The game now automatically saves progress every 10 seconds, ensuring player data is consistently backed up.
*   **Manual Save Hotkey:** Players can now manually save the game at any time by pressing `Ctrl + S`, which is confirmed by a "Game Saved!" notification.

### Developer & Playtesting

*   **Reset Game State:** A "Reset Game" button has been added to the playtest sidebar, allowing for a complete wipe of local storage data for fresh testing sessions.

### Bug Fixes

*   Fixed a critical bug where harvesting non-wine crops (e.g., Hops, Barley) would cause the game to crash.
*   Resolved an issue where tooltips would remain "stuck" on the screen after the associated item was moved or used.
*   Removed leftover code from the old cloud save system that could cause errors.

---

## Version 0.1.1 - Cellar Refinement & Flavour Depth

This update significantly enhances the winemaking experience by introducing new layers of customization and strategic depth in the cellar.

### New Features

*   **Flavour-Modifying Pantry Additives:** Introduced "Wild Yeast" and "Pure Honey" as pantry additives that can be added to the press, each with unique flavour modifiers (AC +25, BD +15, SW -20 for Yeast; SW +30, BD +5, AC -15 for Honey).
*   **Dedicated Additive Slot:** A new, separate slot in the ingredient press allows for the addition of one pantry additive per barrel, independent of the 3 main ingredient slots.
*   **Dynamic Barrel Aging:** Different barrel types (French Oak, American Oak, Chestnut Wood, Old Bourbon) now impart unique flavour modifiers to wine during the aging process, changing the wine's profile per percentage of aging progress.
*   **Expanded Barrel Capacity:** Players can now purchase up to two of each new barrel type from the shop, in addition to the default French Oak barrel.
*   **Enhanced Aging Feedback:** The aging process in barrels now takes 100 seconds, and a percentage progress is displayed directly under the progress bar.
*   **Consolidated Item Tooltips:** All relevant item details (flavour profile, vintage age, harvest weather modifiers, etc.) are now displayed in a single, dynamic tooltip when hovering over ingredients, wines in reserve, or aging barrels.
*   **Unique Wine Stacking:** Wines in the cellar reserve (warehouse) now only stack if they have identical metadata, including their full flavour profile and custom labels, ensuring each unique vintage is distinct.

### Bug Fixes

*   Resolved an issue where pantry items purchased from the shop were not appearing in the ingredients reserve.
*   Fixed "Owned: undefined" display bug for pantry items in the shop.
*   Corrected an issue preventing ingredients from appearing in the press modal's inventory list.
*   Addressed multiple `TypeError` and `ReferenceError` issues related to UI rendering and barrel type initialization.

---

## Version 0.1.0 - The Flavour & Terroir Update

This update introduces a complete overhaul of the winemaking system, moving from a deterministic recipe model to a dynamic, customizable flavour-based system. The introduction of weather and terroir now makes every harvest a unique strategic decision.

### New Features

*   **Four-Point Flavour Spectrum:** Every wine and ingredient is now defined by four core flavour attributes:
    *   **Sweetness (SW):** Measures residual sugars.
    *   **Acidity (AC):** Measures tartness and brightness.
    *   **Tannin (TN):** Measures mouth-drying astringency.
    *   **Body (BD):** Measures physical weight and mouthfeel.
*   **Dynamic Weather System:** The weather now changes every 3 minutes between **Sunny, Rain, Mist, and Temperate**. The weather at the moment of **harvest** applies a unique modifier to the crop's base flavour profile, adding a layer of strategic timing to your agricultural planning. The current weather is now displayed on the main UI.
*   **Raw Materials Overhaul:** All grapes and berries now have their own unique base flavour values. Ingredients with different flavour profiles (due to harvest weather) are now stored in separate stacks in your inventory. The base flavour of a wine is now calculated by summing the flavour profiles of all its ingredients.
*   **Enhanced UI & Tooltips:** Hovering over any ingredient or finished wine now displays a detailed tooltip with its full Four-Point Flavour Spectrum. Tooltips for harvested crops will also show the specific weather modifiers that were applied.

### Developer & Playtesting
*   **Weather Controls:** The playtest sidebar now includes buttons to manually set the weather, allowing for easy testing of the new flavour modification system.

---
## Version 0.0.1 - Initial Release (Alpha)

This marks the first public alpha release of The Grand Reserve! This version establishes the core gameplay loop, from planting your first grape seed to selling your first artisan vintage.

### New Features

*   **Core Gameplay Loop:**
    *   **Vineyard Management:** Purchase and unlock up to 9 vineyard plots to grow a variety of crops.
    *   **Harvesting:** Plant 14 different types of seeds (grapes, berries, and grains) and harvest them when ready.
    *   **Pantry:** Purchase 5 unique pantry additives directly from the shop to use in advanced recipes.

*   **Advanced Winemaking System:**
    *   **Ingredient Press:** Load up to 3 ingredients into an oak barrel to discover 11 unique wine recipes.
    *   **Multi-Stage Processing:** Manually crush grapes, wait for fermentation, and allow the aging process to take place.
    *   **Quality Tiers:** Allow your wine to age over time to achieve C, B, A, or the coveted S-Tier quality, each with a unique value multiplier, or turn it into Vinegar!
    *   **Maturation Racks:** Place bottled wines on a 9-slot rack to age them over time, progressing through 4 Vintage Ranks for massive value multipliers.

*   **Active Brewery & Minigame:**
    *   **Copper Kettle:** Unlock the Brewery and its centerpiece, the Copper Kettle.
    *   **Brewing Minigame:** Engage in a fun, physics-based stabilization minigame to brew 9 different types of beer.
    *   **Dynamic Brew Time:** The difficulty and time required to complete a brew scales with the value of the beer recipe.

*   **Customization Options:**
    *   **Full Customization:** Design custom labels for every wine and beer you produce.
    *   **Components:** Choose from multiple background shapes, border styles, crest emblems, paper colors, and foil ink colors to create a unique brand identity.
    *   **Persistent Labels:** Custom names and designs are saved and displayed in your warehouse and on the market.

*   **Dynamic Market System:**
    *   **Live Prices:** Market prices for all products fluctuate every 30 seconds.
    *   **Oversupply Mechanic:** Selling too much of one product will temporarily crash its market value, encouraging diverse production.
    *   **Trend Tracking:** A sparkline graph for each product helps you visualize market trends and sell at the right time.

*   **Immersive Audio & Visuals:**
    *   **Procedural Graphics:** All item icons, from seed bags to wine bottles and beer mugs, are dynamically generated with SVG for a crisp, unique look.
    *   **Synthesized Sound:** All sound effects are generated in real-time using the Web Audio API for a responsive, tactile feel without asset loading.

### Developer & Playtesting

*   **Playtest Panel:** A hidden playtest sidebar can be accessed.