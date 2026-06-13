# The Grand Reserve: Official Player Wiki

Welcome to the official strategy, mechanics, and design guide for The Grand Reserve. This vault guide is optimized for Obsidian, utilizing internal linking, clear data formatting, and visual callouts to help you master estate management, crop cultivation, cellar maturation, and copper brewery thermodynamics.

## 1. Agricultural & Pantry Registry

Your vineyard and pantry shelf form the foundation of your estate's supply chain. To grow crops, you must purchase seed packets from the Merchant Shop. Planting a crop consumes the seed packet.

### 1.1 Crop & Seed Catalog (Vineyard Crops)

All crops in this registry are grapes, berries, or grains that grow in standard Vineyard plots. Each seed packet is consumed instantly upon planting. Grapes and berries have a base flavour profile that is modified by the weather upon harvesting.

| Crop Name | Seed Cost | Grow Time | Base Flavour (SW/AC/TN/BD) | Primary Blend/Brew Role |
| :--- | :--- | :--- | :--- | :--- |
| Pinot Noir Grapes | $15\text{ Gold}$ | $6\text{ seconds}$ | `15 / 25 / 15 / 20` | Light/medium-bodied red wine bases |
| Chardonnay Grapes | $20\text{ Gold}$ | $8\text{ seconds}$ | `10 / 35 / 0 / 15` | Crisp white wine bases |
| Cabernet Grapes | $30\text{ Gold}$ | $12\text{ seconds}$ | `5 / 15 / 40 / 35` | Bold, heavy tannic red wine bases |
| Muscat Grapes | $45\text{ Gold}$ | $15\text{ seconds}$ | `45 / 10 / 5 / 20` | Highly sweet dessert wine bases |
| Wild Blackberry | $12\text{ Gold}$ | $5\text{ seconds}$ | `15 / 15 / 30 / 25` | Heavy berry tannins / Stout additive |
| Golden Raspberry | $18\text{ Gold}$ | $7\text{ seconds}$ | `20 / 25 / 5 / 10` | Delicate floral wine notes |
| Forest Blueberry | $25\text{ Gold}$ | $10\text{ seconds}$ | `15 / 20 / 15 / 20` | Indigo wine complexity / Wild Sour Ale |
| Sweet Strawberry | $35\text{ Gold}$ | $11\text{ seconds}$ | `35 / 15 / 0 / 10` | Fresh summer fruit wine sweetness |
| Bitter Elderberry | $50\text{ Gold}$ | $18\text{ seconds}$ | `5 / 20 / 35 / 25` | High-value bitter complexity |
| Fresh Hops | $15\text{ Gold}$ | $8\text{ seconds}$ | `N/A` | Brewing bitter and aroma agent |
| Craft Barley | $10\text{ Gold}$ | $6\text{ seconds}$ | `N/A` | Standard malty brewing grain base |
| Malt Wheat | $8\text{ Gold}$ | $5\text{ seconds}$ | `N/A` | Soft, cloudy, and crisp brewing grain base |
| Spicy Rye | $14\text{ Gold}$ | $7\text{ seconds}$ | `N/A` | Dry, spicy, and earthy brewing grain base |
| Sugar Pumpkin | $22\text{ Gold}$ | $14\text{ seconds}$ | `N/A` | Heavy, sweet seasonal brewing adjunct |

### 1.2 Pantry Shelf Additives (Direct Purchase)

Unlike agricultural crops, pantry items are bought directly from the Merchant Shop for flat gold costs and are deposited instantly into your pantry shelf inventory. They can be added to the press to significantly alter a wine's final flavour profile.

| Pantry Additive | Unit Cost | Description | Wine Flavour Modifiers |
| :--- | :--- | :--- | :--- |
| Wild Yeast | $15\text{ Gold}$ | Unleashes complex, tart, sour wild fermentations. | `AC +25`, `BD +15`, `SW -20` |
| Cacao Nibs | $10\text{ Gold}$ | Rich chocolate bitterness and smooth stout mouthfeel |
| Coffee Beans | $12\text{ Gold}$ | Intensely roasted dark chocolate and espresso notes |
| Pure Honey | $20\text{ Gold}$ | Highly fermentable sweet braggot/pumpkin sugar boost. | `SW +30`, `BD +5`, `AC -15` |
| Coriander & Peel | $8\text{ Gold}$ | Citrus aromatics and light herbal spiciness in witbiers |

### 1.3 Dynamic Weather & Terroir

The estate's weather is no longer just cosmetic. It changes every 3 minutes and directly impacts the chemical composition of your crops, a concept known as *terroir*. The weather at the **moment of harvest** applies a modifier to the crop's base flavour profile.

| Weather | Icon | Modifier | Effect Description |
| :--- | :--- | :--- | :--- |
| Sunny | `sun` | `SW +20`, `AC -10` | Intense sun boosts sugar development but reduces sharp acids. |
| Rain | `cloud-rain` | `SW -10`, `AC +20` | Rain dilutes sugars but encourages bright, acidic growth. |
| Mist | `cloud-fog` | `BD +10` | Humid, misty air leads to plumper, heavier fruit with more body. |
| Temperate | `cloud` | None | A balanced, neutral day with no significant impact on flavour. |

[!tip] Strategic Harvesting
Timing your harvest to coincide with specific weather patterns is a key strategy for advanced winemakers. A Cabernet harvested in the rain will have a much different profile than one harvested in the sun, allowing you to create truly unique vintages.

## 2. Cellar Mechanics (Winemaking)

Winemaking is a slow, methodical art of patience. Once you have harvested ingredients, they must be combined to create a wine with a unique flavour profile, then processed through three active stages.

[LOAD PRESS] ──> [MANUAL CRUSH] ──> [FERMENT] ──> [ACTIVE AGING] ──> [CELLAR RACKING]

### 2.1.1 Barrel Types & Aging Effects

The type of barrel you use for aging significantly impacts the final flavour profile of your wine. Each barrel type imparts unique flavour modifiers per percentage of aging progress. These modifiers are applied continuously throughout the aging phase.

| Barrel Type | Cost | Max Owned | Flavour Modifier (per % progress) | Primary Effect |
| :--- | :--- | :--- | :--- | :--- |
| French Oak | $300\text{ Gold}$ | 2 | `TN +0.5`, `BD +0.3`, `SW -0.2` | Adds complex tannins and body, reduces sweetness. |
| American Oak | $200\text{ Gold}$ | 2 | `TN +0.2`, `BD +0.6`, `AC -0.3` | Boosts body and subtle tannins, mellows acidity. |
| Chestnut Wood | $300\text{ Gold}$ | 2 | `TN +1.2`, `AC +0.4`, `SW -0.2` | Imparts strong tannins and bright acidity, reduces sweetness. |
| Old Bourbon | $500\text{ Gold}$ | 2 | `BD +0.8`, `SW +0.6`, `AC -0.4` | Adds significant body and sweetness, softens acidity. |

[!tip] Strategic Barrel Selection
Choosing the right barrel is crucial for crafting your desired wine profile. For example, a wine high in natural acidity might benefit from an American Oak barrel to mellow it out, while a light-bodied wine could gain structure from a French Oak.

### 2.1 The Four-Point Flavour Spectrum

Every wine you create is now defined by a dynamic, four-point flavour profile. The final profile of a bottled wine is determined by the sum of the flavour values from its base ingredients, which is then modified by the harvest weather, any pantry additives used in the press, and finally the type of barrel and duration of the aging process.
*   **Sweetness (SW):** Measures residual fruit sugars and unfermentable additives.
*   **Acidity (AC):** Measures tartness and bright, mouth-watering acids.
*   **Tannin (TN):** Measures mouth-drying astringency from skins, seeds, and wood.
*   **Body (BD):** Measures physical density, weight, and viscous mouthfeel.

Hovering over any ingredient or finished wine in your reserve will show a detailed tooltip with its exact flavour values.

### 2.2 The Multi-Ingredient Press & Recipe Book

To start a batch, click any empty Oak Barrel in your Cellar to open the Ingredient Press. You can load up to $3$ harvested ingredients (grapes and berries) and one pantry additive. The Press automatically evaluates your loaded items against the Recipe Book.

[!tip] Pantry Additives
In addition to the three main ingredient slots, a single pantry additive (like Wild Yeast or Pure Honey) can be added to a batch. This provides a powerful way to fine-tune a wine's flavour profile to meet specific contract demands.

[!info] Ratio Standard
Ratios below represent the exact integer count of ingredients required in the Press.

**Standard Wine Classics**

| Recipe Name | Ingredients | Base Market Value |
| :--- | :--- | :--- |
| Chardonnay Dry White | $2\text{ Chardonnay}$ | $45\text{ Gold}$ |
| Pinot Noir Light Red | $2\text{ Pinot Noir}$ | $50\text{ Gold}$ |
| Cabernet Bold Red | $2\text{ Cabernet}$ | $65\text{ Gold}$ |
| Golden Muscat Dessert | $2\text{ Muscat}$ | $85\text{ Gold}$ |

**Artisan Specialty Blends**

| Recipe Name | Ingredients | Ratio | Base Market Value |
| :--- | :--- | :--- | :--- |
| Summer Rosé | $1\text{ Pinot Noir} + 1\text{ Strawberry}$ | $1:1$ | $60\text{ Gold}$ |
| Midnight Blackberry Port | $1\text{ Cabernet} + 2\text{ Blackberry}$ | $1:2$ | $80\text{ Gold}$ |
| Royal Gold Mead-Wine | $1\text{ Muscat} + 1\text{ Raspberry}$ | $1:1$ | $95\text{ Gold}$ |
| Elder-Blue Elixir | $2\text{ Elderberry} + 1\text{ Blueberry}$ | $2:1$ | $110\text{ Gold}$ |
| Imperial Velvet Blend | $1\text{ Cabernet} + 1\text{ Blueberry} + 1\text{ Elderberry}$ | $1:1:1$ | $150\text{ Gold}$ |

**Recipe Fallbacks**

| Recipe Name | Condition | Base Market Value |
| :--- | :--- | :--- |
| Generic Fruit Cider | Any combination consisting purely of $\ge 2$ berries. | $25\text{ Gold}$ |
| House Red Blend | Any invalid grape-based combination of $\ge 2$ ingredients. | $30\text{ Gold}$ |

### 2.3 Processing Stages

Crushing (Active Tapping): You must click the barrel manually $5\text{ times}$ to crush the grapes. Each squish deforms the barrel container with physical visual shaking.

Fermentation (Passive, $5\text{s}$): The mash sits in a closed barrel to ferment. You will occasionally hear gurgling bubbles.

Aging (Passive, Variable Speed): The aging indicator marker slides along a visual timeline towards the S-Tier peak. During this phase, the barrel's wood type will impart flavour changes to the wine. The aging process takes 100 seconds, with progress displayed as a percentage.

### 2.4 The Aging Timeline & Quality Multipliers

When a barrel transitions to the Aging phase, its value multiplier $M_{\text{tier}}$ climbs as the slider moves toward the S-Tier sweet spot. The batch will remain at peak S-Tier quality even if it reaches 100% progress, giving you a wide window to bottle your best vintages.

[  C-Tier  ] [   B-Tier   ] [   A-Tier   ] [ ★ S-Tier ★ ]
0%        30%            60%          80%            100%


| Quality Tier | Timeline Range | Multiplier ($M_{\text{tier}}$) | Description |
| :--- | :--- | :--- | :--- |
| ★ S-Tier Reserve ★ | $80\% \le \text{Progress} \le 100\%$ | $2.5\times$ | Flawless, rich peak aging sweet spot. |
| A-Tier Premium | $60\% \le \text{Progress} < 80\%$ | $1.5\times$ | Excellent, highly balanced vintage. |
| B-Tier Classic | $30\% \le \text{Progress} < 60\%$ | $1.0\times$ | Standard, everyday classic table wine. |
| C-Tier Table | $0\% \le \text{Progress} < 30\%$ | $0.6\times$ | Weak body, bottled far too early. |
| Vinegar | Manual Conversion at $100\%$ | $0.15\times$ | Optional conversion for specific uses. |

[!info] The Vinegar Option
Once a batch reaches 100% aging progress, it will stop aging and remain at S-Tier quality indefinitely. A new button will appear, giving you the choice to convert the entire batch into low-value Vinegar. While not profitable, Vinegar may have niche uses in future updates.

## 3. Maturation Racks & Vintage Ranks

Unlike active fermentation, matured wines can be stored in the Cellar Maturation Racks to age over long cycles, yielding exponential price gains based on in-game shelf-maturation age.

[Freshly Bottled] ──> [Fine Aged] ──> [Estate Reserve] ──> [Centennial Vintage]
0 Years              15 Years         40 Years            80 Years


Maturation Racks contain a $3 \times 3$ display grid ($9$ slots total). Players can load bottled wines from their reserve inventory directly into any empty slot.

### 3.1 Vintage Ranks & Multipliers

Maturation age increments by $+1$ year every second the bottle remains racked.

$$\text{Final Market Value} = \text{Base Price} \times M_{\text{tier}} \times V_{\text{rank}}$$

| Vintage Rank | Age Threshold | Value Multiplier ($V_{\text{rank}}$) | Description |
| :--- | :--- | :--- | :--- |
| Centennial Vintage | $\ge 80\text{ Years}$ | $3.5\times$ | Exquisite, historic antique of legendary repute. |
| Estate Reserve | $\ge 40\text{ Years}$ | $2.2\times$ | Rich oak tones developed through patient resting. |
| Fine Aged | $\ge 15\text{ Years}$ | $1.5\times$ | Softened acidity, smooth rounded profiles. |
| Freshly Bottled | $\ge 0\text{ Years}$ | $1.0\times$ | Just bottled, raw youth with young notes. |

## 4. Active Brewing (The Copper Kettle)

Once you purchase the Copper Kettle upgrade from the Merchant Shop for $150\text{ Gold}$, the Brewery tab unlocks. This active minigame represents a physics-based, interactive temperature tracking stabilization system.

### 4.1 Beer Recipe Registry

All beers use processed grain and hops. Unlike wines, beers do not age; their value is determined instantly upon successful brew completion.

| Recipe Name | Ingredients | Base Price |
| :--- | :--- | :--- |
| Wheat Beer | $1\text{ Barley} + 1\text{ Wheat}$ | $30\text{ Gold}$ |
| Golden Ale | $2\text{ Barley} + 1\text{ Hops}$ | $40\text{ Gold}$ |
| Bitter IPA | $1\text{ Barley} + 2\text{ Hops}$ | $55\text{ Gold}$ |
| Belgian Witbier | $1\text{ Wheat} + 1\text{ Hops} + 1\text{ Coriander \& Peel}$ | $65\text{ Gold}$ |
| Spiced Rye IPA | $1\text{ Rye} + 2\text{ Hops}$ | $70\text{ Gold}$ |
| Wild Sour Ale | $1\text{ Wheat} + 1\text{ Wild Yeast} + 1\text{ Forest Blueberry}$ | $85\text{ Gold}$ |
| Pumpkin Spice Ale | $1\text{ Wheat} + 1\text{ Pumpkin} + 1\text{ Pure Honey}$ | $95\text{ Gold}$ |
| Imperial Honey Braggot | $1\text{ Barley} + 2\text{ Pure Honey}$ | $110\text{ Gold}$ |
| Double Espresso Stout | $1\text{ Barley} + 1\text{ Coffee Beans} + 1\text{ Cacao Nibs}$ | $130\text{ Gold}$ |

### 4.2 Kettle Temperature Mini-Game (Stardew-Style Physics)

The brewing process is an active, horizontal stabilization minigame, inspired by the physics of popular fishing games.

[← Vent Steam]  ============= [ Catcher Pad ] =============  [Stoke Fire →]
                              { Boiling Bubble }

#### Gameplay Objective
To complete a brew, you must keep the green **Catcher Pad** layered on top of the drifting **Boiling Bubble**. Progress accumulates only during this overlap.

#### Core Mechanics
*   **The Catcher Pad:** This is your stable brewing zone, represented by the green block.
    *   **Width:** $21\%$ of the total track.
    *   **Physics:** Features custom momentum and drag for a smooth feel.
    *   **Controls:**
        *   **Stoke Fire:** Accelerates the pad to the right (velocity `+2.16`).
        *   **Vent Steam:** Accelerates the pad to the left (velocity `-2.16`).
    *   **Boundary Collisions:** Slamming into the track's edges triggers a visual bounce with realistic energy dampening ($45\%$ velocity retention).
*   **The Boiling Bubble:** A custom bubble icon that drifts back and forth along the track.
    *   Its drift patterns are highly smoothed ($35\%$ slower maximum speeds, $20\%$ lower sudden adjustment frequencies) to make alignment satisfying and comfortable.

#### Completion Time
The total time required to complete a brew is dynamic and scales with the base value of the beer recipe.

$$\text{Brew Time Required} = 7.5 + \left(\frac{\text{Base Value} - 30}{100}\right) \times 14.5\text{ seconds}$$

*   **Example (Low Value):** A standard $30\text{-gold}$ Wheat Beer requires only **$7.5\text{ seconds}$** of active contact.
*   **Example (High Value):** An ultra-premium $130\text{-gold}$ Double Espresso Stout requires **$22\text{ seconds}$** of total contact.

[!tip] Dynamic Tab Re-binding & Resilience If you navigate away from the Brewery to harvest crops, your thermal state and active target positions are maintained in the background thread. Returning to the Brewery dynamically binds inputs back to the UI, allowing you to resume with zero progress loss.

## 5. Market Square & Oversupply Mechanics

The town market does not pay fixed rates. It employs a dynamic supply-and-demand algorithm that reacts to how you sell your goods.

### 5.1 Price Volatility & Market Shifts

Every $30\text{-seconds}$ real-time, the market experiences a Market Shift. Base prices fluctuate according to volatility metrics:

$$\text{New Base Price} = \text{Base Value} \times \text{Volatility} \times \text{Oversupply Penalty}$$

Market Volatility: A random coefficient ranging between $0.8$ and $1.2$ ($\pm 20\%$).

Oversupply Penalty ($P_{\text{supply}}$): Selling a bottle of wine or beer increases that specific product's market oversupply index ($S$) by $+1.0$. 

$$P_{\text{supply}} = \max(0.3, 1.0 - (S \times 0.05))$$

If you dump dozens of the same wine variety onto the market at once, its purchase value will plummet down to a minimum floor of $30\%$ of its base value.

Oversupply Recovery: During each $30\text{-second}$ Market Shift, the oversupply index for all products naturally decays by $20\%$ ($S_{\text{new}} = S_{\text{old}} \times 0.8$).

The Market interface renders SVG Sparklines displaying the pricing trend over the last $10$ market shifts.

## 6. Customer Order Board

The Customer Order Board, accessible via the "Orders" tab, is a dynamic contract system where NPCs request wines with specific characteristics. Fulfilling these contracts offers premium payouts and provides a directed challenge for master winemakers.

### 6.1 Dialogue Difficulty

To accommodate all players, NPC requests can be interpreted at different difficulty levels, which can be changed at any time.

*   **Beginner Mode:** NPCs use simple, literal words like "unsweetened," "tart," and "thin."
*   **Sommelier Mode:** NPCs use evocative, professional terms like "austere," "enamel-stripping," and "cigar-box."
*   **Intermediate Mode:** A 50/50 blend of both, helping players naturally learn advanced terminology.

### 6.2 Contract Mechanics

*   **Requests:** An NPC will request a specific wine variety (e.g., Cabernet Bold Red) with one to four flavour attributes falling within a target range (e.g., Tannin between 75-85%).
*   **The Solvability Engine:** To ensure fairness, every contract is pre-validated by a background simulation engine. This engine confirms that a valid combination of weather, additives, and barrel aging exists to create the requested wine, making every order achievable.
*   **Lifecycle:** New orders are posted every 10-15 minutes. Available orders expire after 20-30 minutes if not accepted. A player can have up to 3 active orders, which do not expire.
*   **Fulfillment:** From the contract detail screen, you can submit any wine from your reserve that matches the required variety. The system then calculates the wine's precision.
    *   If the wine's average flavour deviation is within a **20% tolerance** of the requested ranges, the customer will accept it.
    *   If the deviation is greater than 20%, the customer will refuse the wine, but the order will not be canceled, allowing you to try again with a different bottle.
*   **Cancellation:** If you no longer wish to complete an active order, you can open its detail screen and select "Cancel Order".

### 6.3 Precision Payouts & Rewards

The reward for a successful contract delivery is significantly higher than a standard market sale. The formula is:

$$\text{Contract Payout} = \text{Market Value} \times \max(1, M_{\text{tier}}) \times V_{\text{rank}} \times M_{\text{precision}}$$

*   **Market Value:** The current market price of the wine.
*   **$M_{\text{tier}}$ (Tier Multiplier):** The multiplier from the wine's quality (C, B, A, S). For contracts, this is floored at a minimum of `1.0x`, meaning even a C-Tier wine won't penalize your payout.
*   **$V_{\text{rank}}$ (Vintage Multiplier):** The multiplier from the wine's maturation rank.
|   **$M_{\text{precision}}$ (Precision Multiplier):** A dynamic bonus based on how closely your wine matches the request and the contract's difficulty. The reward scales **exponentially**, meaning small deviations have minor penalties, but the penalty grows significantly as you approach the 20% deviation limit. This makes achieving a perfect match highly rewarding.

| Flavour Constraints | Payout Multiplier Range ($M_{\text{precision}}$) |
| :--- | :--- |
| 1 | `1.50x` - `2.35x` |
| 2 | `2.20x` - `2.85x` |
| 3 | `2.70x` - `3.70x` |
| 4 | `3.45x` - `5.00x` |

When submitting a wine, you will see a qualitative rating to help you gauge its value for the order.

| Precision (from perfect) | Qualitative Rating |
| :--- | :--- |
| 100% (0% deviation) | "A Perfect Match!" |
| >75% (<5% avg. deviation) | "An Excellent Offer" |
| >40% (<12% avg. deviation) | "A Good Fit" |
| <40% (>12% avg. deviation) | "An Acceptable Offer" |

### 6.4 The Fulfillment Report

After a successful sale, a detailed **Order Fulfillment Report** will appear. This modal provides a complete breakdown of the transaction, helping you learn and improve. It includes:
*   A side-by-side comparison of the requested flavour ranges versus your submitted wine's stats.
*   The precise deviation for each attribute, color-coded for clarity.
*   The final average deviation score.
*   A full breakdown of how the final payout was calculated, listing the base value and every multiplier that was applied.

[!tip] Maximizing Profit
Fulfilling a 4-constraint contract with a perfectly crafted, S-Tier, Centennial Vintage wine will yield the highest possible payout in the game, combining all available multipliers for a massive reward.

## 7. Saving Your Progress

Your estate's progress is automatically saved to your browser's local storage every 10 seconds. You can also manually save at any time by pressing `Ctrl + S`. Since the game saves locally, your progress is tied to the browser and device you are currently using.

## 8. Graphics & Sound Engineering (Tactile Immersion)

The visual and auditory experience is designed to feel tactile, cozy, and highly responsive.

### 8.1 Dynamic SVG Graphics Pipeline

Every bottled vintage, seed bag, and mug in the game is procedurally rendered using vectors, eliminating generic icons:

Custom Bottle Outlines: Dynamic paths change color based on the recipe (crisp golden-yellow fills for Chardonnay, dark burgundy for Pinot Noir, ink-purple for Cabernet).

Quality Ribbons: Bottled wines feature a neck ribbon colored according to the quality tier (Purple for S-Tier, Yellow for A-Tier, Blue for B-Tier, Gray for C-Tier).

Bavarian Brewery Vessels: Beer rendering alternates between flared steins with thick white foam heads (Wheat Beer), custom-labeled glass bottles (Golden Ale), and heavy handles (Stout).

Seed Pouches: Seed bag vectors feature miniature preview drawings of the crop on the cover for easy sorting.

### 8.2 Web Audio Synthesis API

Sound effects are synthesized live in the audio buffer, eliminating lag and loaded assets:

Harvesting Plucks: A high-frequency sine wave exponential pitch slide ($600\text{Hz} \to 1200\text{Hz}$) simulates snapping vines.

Squishing Squelches: Low-pass filtered random white noise simulates crushing grapes or venting kettle steam.

Cork Pops: A resonant triangle wave sweeping downward ($150\text{Hz} \to 20\text{Hz}$) simulates pressure release when bottling.

Market Clinks: Dual high-frequency sine oscillators ($987.77\text{Hz}$ and $1318.51\text{Hz}$) simulate counting gold coins.

Active Bubbles: Intermittent low-frequency sine bursts simulate active fermentation.

### 9. The Estate Label Architect (Customization)

To add personal prestige to your products, you can customize the label of any bottled wine or brewed beer from your Cellar Reserve (Warehouse) tab.

## 9.1 Custom Vector Composites

Labels are mapped as real-time SVG nested vector nodes. Players can design and preview custom labels immediately before attaching them to their stock.

[SELECT PRODUCT] ──> [OPEN ARCHITECT] ──> [SWATCH PAPER/INK] ──> [SELECT EMBLEM] ──> [SAVE LABEL]

**Visual Properties Configurator:**

*   **Title:** Up to 22 alphanumeric characters typed directly onto the custom bottle container.
*   **Canvas Shapes:**
    *   Rect (Classic Rectangle): For a traditional, geometric, clean presentation.
    *   Oval (Refined Ellipse): Gives an antique, soft-bodied presentation.
    *   Shield (Noble Crest): Best suited for rare reserve blends.
*   **Ink Borders:**
    *   None: Minimalist borderless style.
    *   Solid: Single thin framing outline.
    *   Dashed: Light-textured dotted outline.
    *   Double: Ornate double-ring border.
*   **Estate Crest Emblems:**
    *   Star (Astral Reserve)
    *   Crown (Imperial Grade)
    *   Grape (Vineyard Heritage)
    *   Leaf (Natural Fermentation)
    *   Droplet (Pure Distilled)
    *   Diamond (Diamond Standard)

**Palette Swatches:**

| Swatch Choice | Paper Hex Code | Intended Aesthetic |
| :--- | :--- | :--- |
| Parchment White | `#FFFFFF` | Minimalist contemporary label |
| Soft Cream | `#FEF9E7` | Traditional vintage warm layout |
| Rose Petal | `#F9EBEA` | Recommended for Sweet Rosés and Ciders |
| Silver Slate | `#EAECEE` | Crisp metallic base for IPAs and Witbiers |
| Charred Oak | `#1A1008` | Deep luxury dark contrast label |
| Velvet Amethyst | `#2E1156` | Royal, rich dessert-style layout |

**Foil Ink Choice:**

| Ink/Foil Choice | Ink/Foil Hex Code | Intended Contrast |
| :--- | :--- | :--- |
| Gold Leaf | `#D4AC0D` | Rich gold-flake embossing foil |
| Crimson Red | `#C0392B` | Bold ruby-contrast wax-red |
| Meadow Green | `#27AE60` | Earthy, hop-centric garden tone |
| Deep Ocean | `#1F618D` | Deep cool maritime sapphire |
| Dark Burgundy | `#78281F` | Deep ink-grape tannin contrast |
| Frost White | `#FFFFFF` | Stark white stencil highlights |