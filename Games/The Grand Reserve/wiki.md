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

Unlike agricultural crops, pantry items are bought directly from the Merchant Shop for flat gold costs and are deposited instantly into your pantry shelf inventory.

| Pantry Additive | Unit Cost | Primary Recipe Utility |
| :--- | :--- | :--- |
| Wild Yeast | $15\text{ Gold}$ | Unleashes complex, tart, sour wild fermentations |
| Cacao Nibs | $10\text{ Gold}$ | Rich chocolate bitterness and smooth stout mouthfeel |
| Coffee Beans | $12\text{ Gold}$ | Intensely roasted dark chocolate and espresso notes |
| Pure Honey | $20\text{ Gold}$ | Highly fermentable sweet braggot/pumpkin sugar boost |
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

### 2.1 The Four-Point Flavour Spectrum

Every wine you create is now defined by a dynamic, four-point flavour profile. The final profile of a bottled wine is determined by the sum of the flavour values from each ingredient used in the press.

*   **Sweetness (SW):** Measures residual fruit sugars and unfermentable additives.
*   **Acidity (AC):** Measures tartness and bright, mouth-watering acids.
*   **Tannin (TN):** Measures mouth-drying astringency from skins, seeds, and wood.
*   **Body (BD):** Measures physical density, weight, and viscous mouthfeel.

Hovering over any ingredient or finished wine in your reserve will show a detailed tooltip with its exact flavour values.

### 2.2 The Multi-Ingredient Press & Recipe Book

To start a batch, click any empty Oak Barrel in your Cellar to open the Ingredient Press. You can load up to $3$ harvested ingredients. The Press automatically evaluates your loaded items against the Recipe Book.

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

Aging (Passive, Variable Speed): The aging indicator marker slides along a visual timeline towards the S-Tier peak.

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

### 5.2 Sparklines Trend-Tracking

The Market interface renders SVG Sparklines displaying the pricing trend over the last $10$ market shifts.

Green Line: Upward pricing trend. Ideal time to sell.

Red Line: Downward pricing trend due to market dips or player-driven oversupply. It is highly recommended to hoard your stock in your Cellar Reserve and wait for a recovery.

## 6. Cloud Synchronization & Database Architecture

The Grand Reserve features automated cloud synchronization powered by a serverless database backend to ensure progress is saved across multiple devices.

### 6.1 Database Path Hierarchy

To adhere to strict security rules, all user states are isolated into private profiles. A single, unified document coordinates the save state without complex index lookups:

/artifacts/{appId}/users/{userId}/saves/current


appId: The sandbox application namespace separating developer staging pipelines.

userId: Secured anonymous profile ID generated by the authentication module on boot.

### 6.2 Serialization & Sync Procedures

Authentication Pre-flights: Before any database interaction occurs, the application requests an anonymous session with priority custom tokens. Once authentication is confirmed, the real-time sync listener begins.

Autosave Triggers: The client triggers a cloud backup automatically on critical progression updates (buying estate property, finishing harvests, or selling vats).

Cross-Device Transfers: Users can copy their unique alpha-numeric Sync Code from the dashboard and input it on another device. The database verifies the document pathway's validity and loads the remote progression state instantly.

## 7. Graphics & Sound Engineering (Tactile Immersion)

The visual and auditory experience is designed to feel tactile, cozy, and highly responsive.

### 7.1 Dynamic SVG Graphics Pipeline

Every bottled vintage, seed bag, and mug in the game is procedurally rendered using vectors, eliminating generic icons:

Custom Bottle Outlines: Dynamic paths change color based on the recipe (crisp golden-yellow fills for Chardonnay, dark burgundy for Pinot Noir, ink-purple for Cabernet).

Quality Ribbons: Bottled wines feature a neck ribbon colored according to the quality tier (Purple for S-Tier, Yellow for A-Tier, Blue for B-Tier, Gray for C-Tier).

Bavarian Brewery Vessels: Beer rendering alternates between flared steins with thick white foam heads (Wheat Beer), custom-labeled glass bottles (Golden Ale), and heavy handles (Stout).

Seed Pouches: Seed bag vectors feature miniature preview drawings of the crop on the cover for easy sorting.

### 7.2 Web Audio Synthesis API

Sound effects are synthesized live in the audio buffer, eliminating lag and loaded assets:

Harvesting Plucks: A high-frequency sine wave exponential pitch slide ($600\text{Hz} \to 1200\text{Hz}$) simulates snapping vines.

Squishing Squelches: Low-pass filtered random white noise simulates crushing grapes or venting kettle steam.

Cork Pops: A resonant triangle wave sweeping downward ($150\text{Hz} \to 20\text{Hz}$) simulates pressure release when bottling.

Market Clinks: Dual high-frequency sine oscillators ($987.77\text{Hz}$ and $1318.51\text{Hz}$) simulate counting gold coins.

Active Bubbles: Intermittent low-frequency sine bursts simulate active fermentation.

### 8. The Estate Label Architect (Customization)

To add personal prestige to your products, you can customize the label of any bottled wine or brewed beer from your Cellar Reserve (Warehouse) tab.

## 8.1 Custom Vector Composites

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