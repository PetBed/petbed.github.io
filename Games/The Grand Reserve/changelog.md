# The Grand Reserve - Changelog

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