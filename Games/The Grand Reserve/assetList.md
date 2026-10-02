## Pixel-Perfect Rendering Guide

To ensure pixel art remains crisp and sharp without distortion, the on-screen display size of an asset's container must be an **exact integer multiple** of the asset's base resolution (e.g., 1x, 2x, 3x scale).

This guide provides the correct TailwindCSS classes to use for each asset type. Using other sizes (like `w-10` for a 32px asset) will result in non-uniform pixel scaling.

*   **The `pixel-art` CSS class is required** on all `<img>` tags displaying these assets to prevent blurring.
*   Tailwind's default spacing unit is `0.25rem`, which is typically `4px`. Therefore, `w-8` = `8 * 4px` = `32px`.

---

### I. Item & Product Sprites

These are the core icons for all the craftable and collectible items in the game.

*   **A. Crops, Seeds, & Ingredients**
    *   **Recommended Size:** 32x32 pixels
    *   **Assets Needed (33 total):**
        *   **Seed Packets (14):** A unique bag for each seed type: `Pinot Noir`, `Chardonnay`, `Cabernet`, `Muscat`, `Blackberry`, `Raspberry`, `Blueberry`, `Strawberry`, `Elderberry`, `Hops`, `Barley`, `Wheat`, `Rye`, `Pumpkin`.
    *   **Recommended UI Container Sizes:**
        *   **1x Scale (32x32px):** Use `w-8 h-8`
        *   **2x Scale (64x64px):** Use `w-16 h-16`
        *   *Note: The UI currently uses non-integer scales like `w-10` (40px) and `w-12` (48px) in many places. These should be updated to `w-8` or `w-16` as the new art is implemented.*
        *   **Harvested Crops (14):** The final, harvested form of each crop listed above.
        *   **Pantry Ingredients (5):** `Wild Yeast`, `Cacao Nibs`, `Coffee Beans`, `Pure Honey`, `Coriander & Peel`.

*   **B. Wine Products**
    *   **Recommended Size:** 64x64 pixels
    *   **Assets Needed (15 total):**
        *   **Base Bottle Sprites (11):** A unique bottle design for each wine recipe to make them instantly recognizable: `Chardonnay`, `Pinot Noir`, `Cabernet`, `Muscat`, `Summer Rosé`, `Blackberry Port`, `Royal Gold`, `Elder-Blue Elixir`, `Imperial Velvet`, `Fruit Cider`, `House Red`.
    *   **Recommended UI Container Sizes:**
        *   **1x Scale (64x64px):** Use `w-16 h-16`
        *   **0.5x Scale (32x32px):** Use `w-8 h-8`
        *   **Quality Tier Overlays (4):** A small ribbon or seal that can be layered on the bottle neck to indicate its quality: S-Tier, A-Tier, B-Tier, and C-Tier.

*   **C. Beer Products**
    *   **Recommended Size:** 64x64 pixels
    *   **Assets Needed (9 total):**
        *   **Base Vessel Sprites (9):** A unique mug, stein, or bottle for each beer recipe: `Wheat Beer`, `Golden Ale`, `Bitter IPA`, `Belgian Witbier`, `Spiced Rye IPA`, `Wild Sour Ale`, `Pumpkin Spice Ale`, `Imperial Honey Braggot`, `Double Espresso Stout`.

    *   **Recommended UI Container Sizes:**
        *   **1x Scale (64x64px):** Use `w-16 h-16`

### II. Custom Label Components

These assets will be layered programmatically on top of the base wine and beer sprites to create custom labels.

*   **A. Label Background Shapes**
    *   **Recommended Size:** Approx. 48x48 pixels (to fit nicely on a 64x64 bottle)
    *   **Assets Needed (3):** `Rectangle`, `Oval`, `Shield`.

*   **B. Crest Emblems**
    *   **Recommended Size:** 24x24 pixels
    *   **Assets Needed (6):** `Star`, `Crown`, `Grape`, `Leaf`, `Droplet`, `Diamond`.

*   **C. Label Border Styles**
    *   These can be drawn directly onto the background shapes. You'll need versions for `Solid`, `Dashed`, and `Double` borders for each shape.

### III. Environment & Prop Sprites

These are the larger, interactive objects in the game world.

*   **A. Vineyard Plots**
    *   **Recommended Size:** 128x128 pixels
    *   **Assets Needed (3+):**
        *   A "Locked" plot (e.g., overgrown with weeds).
        *   An "Empty/Tilled" plot, ready for planting.
        *   You might also want sprites for growth stages, like a small sprout.

*   **B. Cellar Barrels**
    *   **Recommended Size:** Approx. 144x176 pixels
    *   **Assets Needed:**
        *   A base sprite for the barrel.
        *   Consider creating simple 2-3 frame animations for the "crushing" (shaking) and "fermenting" (bubbling) states to add life.

*   **C. Maturation Racks**
    *   **Recommended Size:** Approx. 128 pixels wide x 112 pixels high (per slot)
    *   **Assets Needed:**
        *   A sprite for an empty rack slot.
        *   This could also be a tileable background texture for the entire rack grid.

*   **D. Brewery Kettle**
    *   **Recommended Size:** Approx. 160x160 pixels
    *   **Assets Needed:** A detailed sprite for the main Copper Kettle that serves as the centerpiece of the brewery.

### IV. UI & Icon Sprites

These small icons are used throughout the game's interface.

*   **A. General Icons**
    *   **Recommended Size:** 16x16 or 24x24 pixels
    *   **Assets Needed:** A pixel-art replacement for the current vector icons, such as: `Add/Plus`, `Remove/Trash`, `Lock`, `Sprout`, `Coins`, `Arrow`, `Checkmark`, `X-mark`, `Sound On/Off`, `Trending Up/Down`, `Flask` (for Vinegar), etc.

*   **B. Kettle Minigame Sprites**
    *   **Assets Needed:**
        *   **Catcher Pad:** Approx. **84 pixels wide** by **40 pixels high**.
        *   **Boiling Bubble:** Approx. **32x32 pixels**.
        *   **Flame & Wind/Steam Icons:** **16x16 pixels**.