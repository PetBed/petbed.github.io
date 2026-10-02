# The Grand Reserve: Player Wiki

Welcome to the estate guide. Here you'll find the crops, recipes, cellar craft, market, and customer orders available in the current game. Values below reflect the current game data and may change as the estate grows.

## 1. Getting Started

### The Tutorial

The guided tutorial introduces the vineyard, the wine press and cellar, custom labels, and selling at the market. It has two resume checkpoints: the first harvest and the first vintage. When resumed, the current phase is reset and its tutorial state is rebuilt, so tutorial-grown Pinot Noir or the tutorial wine may be cleared.

### Your New Estate

A fresh save starts with three unlocked plots out of nine, one French Oak barrel, and 150 gold in the initial game state. The opening tutorial sets the balance to 20 gold and provides two Pinot Noir seeds. Starting seed stock during the tutorial is:

| Seed | Packets |
| :--- | ---: |
| Pinot Noir | 2 |
| Hops | 2 |
| Barley | 2 |
| Blackberry | 1 |
| All other seeds | 0 |

The starting weather is Temperate. The Merchant sells seeds, pantry stock, more plots, barrels, the Copper Kettle, and Oak Conditioning.

### Expanding the Estate

Buying a plot unlocks the first locked plot. The first costs 50 gold; after each purchase, the next price is rounded from 1.5 times the previous price. There are nine plots in total. Each barrel type costs the amount shown in the cellar table, and the estate can own up to two of each type. You begin with one French Oak barrel. The Copper Kettle costs 150 gold; Oak Conditioning costs 250 gold and permanently increases cellar-aging speed by 30%.

## 2. Crops, Pantry & Weather

Buy seed packets in the Merchant's Seed Stock shop. Planting consumes one packet. Growth timers count down in the game loop; harvest is a separate action. Weather is rerolled every three minutes and the new roll may match the previous weather.

### Crop & Seed Catalog

Flavour values use the order Sweetness / Acidity / Tannin / Body. Grapes and berries have flavour profiles; grain, hops, and pumpkin are brewing ingredients without wine-flavour values. Harvest weather is applied to the crop's base profile and each attribute is clamped from 0 to 100.

| Crop | Seed Cost | Grow Time | Base Flavour (SW/AC/TN/BD) |
| :--- | ---: | ---: | :--- |
| Pinot Noir Grapes | 15 gold | 6 sec | `15 / 25 / 15 / 20` |
| Chardonnay Grapes | 20 gold | 8 sec | `10 / 35 / 0 / 15` |
| Cabernet Grapes | 30 gold | 12 sec | `5 / 15 / 40 / 35` |
| Muscat Grapes | 45 gold | 15 sec | `45 / 10 / 5 / 20` |
| Wild Blackberry | 12 gold | 5 sec | `15 / 15 / 30 / 25` |
| Golden Raspberry | 18 gold | 7 sec | `20 / 25 / 5 / 10` |
| Forest Blueberry | 25 gold | 10 sec | `15 / 20 / 15 / 20` |
| Sweet Strawberry | 35 gold | 11 sec | `35 / 15 / 0 / 10` |
| Bitter Elderberry | 50 gold | 18 sec | `5 / 20 / 35 / 25` |
| Fresh Hops | 15 gold | 8 sec | None |
| Craft Barley | 10 gold | 6 sec | None |
| Malt Wheat | 8 gold | 5 sec | None |
| Spicy Rye | 14 gold | 7 sec | None |
| Sugar Pumpkin | 22 gold | 14 sec | None |

### Weather at Harvest

| Weather | Sweetness | Acidity | Tannin | Body |
| :--- | ---: | ---: | ---: | ---: |
| Sunny | +20 | -10 | 0 | 0 |
| Rain | -10 | +20 | 0 | 0 |
| Mist | 0 | 0 | 0 | +10 |
| Temperate | 0 | 0 | 0 | 0 |

These are ingredient modifiers, not global changes to fruit already in storage. Harvested ingredients retain their flavour and harvest-weather record.

### Pantry Shelf

Pantry items are purchased directly for gold and added to inventory. Only Wild Yeast and Pure Honey can be used as wine-press additives; the other pantry goods are used in beer recipes.

| Pantry Item | Cost | Wine Flavour Modifier | Other Recipe Use |
| :--- | ---: | :--- | :--- |
| Wild Yeast | 15 gold | `SW -20`, `AC +25`, `BD +15` | Wild Sour Ale |
| Cacao Nibs | 10 gold | None | Double Espresso Stout |
| Coffee Beans | 12 gold | None | Double Espresso Stout |
| Pure Honey | 20 gold | `SW +30`, `AC -15`, `BD +5` | Pumpkin Spice Ale; Imperial Honey Braggot |
| Coriander & Peel | 8 gold | None | Belgian Witbier |

Each wine batch can use at most one pantry additive. Additive and fruit flavour values are added and clamped to the 0-100 range.

## 3. Wine Cellar

The cellar's wine workflow is: load fruit in the press, crush the batch, let it ferment, then bottle during aging. Empty barrels open the press. A batch accepts up to three grapes or berries plus one eligible pantry additive.

The recipe book matches the exact fruit combination. Two or more berries that do not match a named recipe become Generic Fruit Cider. Other unmatched combinations of two or more fruit become House Red Blend. A pantry additive does not count as one of the fruit slots.

### Wine Recipes

Values are recipe base market prices before market shifts and wine multipliers.

| Recipe | Exact Fruit Combination | Base Price |
| :--- | :--- | ---: |
| Chardonnay Dry White | 2 Chardonnay | 45 gold |
| Pinot Noir Light Red | 2 Pinot Noir | 50 gold |
| Cabernet Bold Red | 2 Cabernet | 65 gold |
| Golden Muscat Dessert | 2 Muscat | 85 gold |
| Summer Rosé | 1 Pinot Noir + 1 Strawberry | 60 gold |
| Midnight Blackberry Port | 1 Cabernet + 2 Blackberry | 80 gold |
| Royal Gold Mead-Wine | 1 Muscat + 1 Raspberry | 95 gold |
| Elder-Blue Elixir | 2 Elderberry + 1 Blueberry | 110 gold |
| Imperial Velvet Blend | 1 Cabernet + 1 Blueberry + 1 Elderberry | 150 gold |
| Generic Fruit Cider | Unmatched combination of 2+ berries | 25 gold |
| House Red Blend | Other unmatched combination of 2+ fruit | 30 gold |

### Crushing, Fermentation & Aging

Crushing takes five barrel clicks. Fermentation lasts five seconds. Aging then advances once per second; at normal speed it takes 100 seconds to reach 100%. Oak Conditioning changes aging speed to 1.3 progress points per second. It does not affect crop growth or fermentation.

The barrel changes the wine's flavour during aging. Modifiers below are applied on each aging update per progress point, with flavour clamped to 0-100. Each type has a maximum ownership of two barrels.

| Barrel | Cost | Flavour Change per Aging Point (SW/AC/TN/BD) |
| :--- | ---: | :--- |
| French Oak | 300 gold | `-0.2 / 0 / +0.5 / +0.3` |
| American Oak | 200 gold | `0 / -0.3 / +0.2 / +0.6` |
| Chestnut Wood | 300 gold | `-0.2 / +0.4 / +1.2 / 0` |
| Old Bourbon | 500 gold | `+0.6 / -0.4 / 0 / +0.8` |

### Flavour & Quality

Wine flavour is the clamped sum of the harvested fruit profiles and any eligible additive, followed by the barrel's changes during aging. Attributes are Sweetness (SW), Acidity (AC), Tannin (TN), and Body (BD). Tooltips in the game show ingredient and product flavour details.

| Bottle at Aging Progress | Quality | Sale Multiplier |
| :--- | :--- | ---: |
| 0% to under 30% | C-Tier Table | `0.6x` |
| 30% to under 60% | B-Tier Classic | `1.0x` |
| 60% to under 80% | A-Tier Premium | `1.5x` |
| 80% to 100% | S-Tier Reserve | `2.5x` |

At 100%, aging stops and the batch remains S-Tier until bottled or converted to Vinegar. Vinegar is an optional conversion with a `0.15x` quality multiplier. Bottling stores the wine in the reserve; barrel aging quality is set by the progress at the moment you bottle.

## 4. Maturation Racks

The cellar rack has nine slots. Move a bottled wine from the reserve onto an empty slot to mature it. Rack age advances by one year per second. When a bottle reaches a new age threshold, its vintage rank and value multiplier update.

| Rank | Age | Multiplier |
| :--- | ---: | ---: |
| Freshly Bottled | 0+ years | `1.0x` |
| Fine Aged | 15+ years | `1.5x` |
| Estate Reserve | 40+ years | `2.2x` |
| Centennial Vintage | 80+ years | `3.5x` |

## 5. Copper Brewery

Buy the Copper Kettle for 150 gold to unlock the Brewery. The kettle takes up to three ingredients. Its recipe must match the exact ingredient keys and quantities. Selecting an ingredient reserves it while the modal is open; removing a slot or closing the modal releases the reservation. Confirming a recipe consumes the loaded ingredients once.

### Beer Recipe Book

Beers do not use the wine aging or quality system. Their base price is their recipe's market value.

| Beer | Exact Ingredients | Base Price |
| :--- | :--- | ---: |
| Wheat Beer | 1 Barley + 1 Wheat | 30 gold |
| Golden Ale | 2 Barley + 1 Hops | 40 gold |
| Bitter IPA | 1 Barley + 2 Hops | 55 gold |
| Belgian Witbier | 1 Wheat + 1 Hops + 1 Coriander & Peel | 65 gold |
| Spiced Rye IPA | 1 Rye + 2 Hops | 70 gold |
| Wild Sour Ale | 1 Wheat + 1 Wild Yeast + 1 Blueberry | 85 gold |
| Pumpkin Spice Ale | 1 Wheat + 1 Pumpkin + 1 Pure Honey | 95 gold |
| Imperial Honey Braggot | 1 Barley + 2 Pure Honey | 110 gold |
| Double Espresso Stout | 1 Barley + 1 Coffee Beans + 1 Cacao Nibs | 130 gold |

### Kettle Alignment

Keep the green catcher pad over the moving bubble. Progress builds while they overlap and recedes slowly when they separate. Stoke Fire adds rightward velocity; Vent Steam adds leftward velocity. The pad has momentum and drag, and bounces off the track edges. Leaving the Brewery tab does not itself reset the simulation; browser background-tab throttling can slow timers.

Required contact time scales with recipe base price:

$$t = 7.5 + \left(\frac{\text{Base Price} - 30}{100}\right) \times 14.5\text{ seconds}$$

This is alignment time, not necessarily elapsed wall-clock time, because progress only accumulates during overlap. On completion, the beer is added to the reserve and the label editor opens.

## 6. Market Square

Market prices shift every 30 seconds. Wine and beer each have a separate random volatility range. Selling a product increases only that product's oversupply by one; oversupply decays by 20% at each market shift.

For the price update, oversupply first decays, then the new price is calculated:

$$P_{\text{supply}} = \max(0.3, 1 - 0.05S)$$

$$\text{Market Price} = \text{Recipe Base Price} \times \text{Volatility} \times P_{\text{supply}}$$

| Product | Volatility Range |
| :--- | :--- |
| Wine | `0.8x` to `1.2x` (`+/-20%`) |
| Beer | `0.85x` to `1.15x` (`+/-15%`) |

The oversupply penalty has a floor of `0.3x`. A wine's sale price is the current market price multiplied by its quality and vintage rank multipliers. Beer sells at its current market price without wine multipliers. Price history keeps up to ten values for the market sparklines.

## 7. Customer Orders

The Orders board offers requests for a wine recipe and one to four flavour ranges. Requests are checked by a configuration solver against recipes, weather, eligible additives, and barrels before being posted. A new order is attempted on a randomized 10-15 minute interval while fewer than ten available orders are listed. Available orders expire after a randomized 20-30 minutes.

You can accept up to three orders at once. Accepted orders do not expire. Cancelling removes the order. To fulfill an order, submit a wine of the requested recipe. A rejected bottle remains in your reserve and the order stays active.

### Acceptance & Precision

For each requested attribute, deviation is zero when the wine lies within the requested range; otherwise it is the distance to the nearest range edge. The customer accepts when the average deviation across requested attributes is at most 20 points on the 0-100 flavour scale. This is a point difference, not relative-percent error.

Let $d$ be average deviation. Linear precision is $p=1-d/20$. The payout multiplier interpolates across the request's multiplier range using $p^2$:

$$M_{\text{precision}} = M_{\min} + (M_{\max} - M_{\min})p^2$$

| Average Deviation | Submission Rating |
| :--- | :--- |
| 0 points | Perfect Match |
| Up to 5 points | Excellent Offer |
| Over 5 to 12 points | Good Fit |
| Over 12 to 20 points | Acceptable Offer |

| Requested Flavour Attributes | Precision Multiplier Range |
| ---: | :--- |
| 1 | `1.50x` to `2.35x` |
| 2 | `2.20x` to `2.85x` |
| 3 | `2.70x` to `3.70x` |
| 4 | `3.45x` to `5.00x` |

The contract payout uses the current wine market price. Contract tier multiplier is at least `1.0x`, then the vintage rank and precision multipliers are applied:

$$\text{Payout} = \text{Current Market Price} \times \max(1, M_{\text{tier}}) \times V_{\text{rank}} \times M_{\text{precision}}$$

The completion report shows requested ranges, submitted flavour, deviations, and payout multipliers. Dialogue vocabulary has Beginner, Intermediate, and Sommelier styles; the difficulty selector is in the playtest controls, not the normal Settings modal.

## 8. Labels, Art & Sound

The label editor is available for wines and beers. It provides a title up to 22 characters, three label shapes (rectangle, oval, shield), four border styles (none, solid, dashed, double), and six crests (star, crown, grape, leaf, droplet, diamond). The title accepts punctuation and spaces; the input enforces length, not an alphanumeric-only rule.

| Paper Swatch | Color |
| :--- | :--- |
| White | `#FFFFFF` |
| Soft Cream | `#FEF9E7` |
| Rose | `#F9EBEA` |
| Silver | `#EAECEE` |
| Charred Oak | `#1A1008` |
| Amethyst | `#2E1156` |

| Ink Swatch | Color |
| :--- | :--- |
| Gold | `#D4AC0D` |
| Crimson | `#C0392B` |
| Green | `#27AE60` |
| Blue | `#1F618D` |
| Burgundy | `#78281F` |
| White | `#FFFFFF` |

Bottle and beer illustrations are dynamic SVGs. Several crop and seed icons use pixel-art assets, with generated SVGs used for other icons. Planting, harvest, purchase, and other actions can use short GSAP item animations. Sound effects are synthesized with the Web Audio API and begin only after audio is enabled by browser interaction.

## 9. Saving & Settings

The game autosaves to browser local storage every ten seconds. Use `Ctrl + S` on Windows/Linux or `Cmd + S` on macOS to save manually. Saves include gold, inventory, plots, barrels, wines, racks, beers, contracts, tutorial state, and settings. Market prices, history, and oversupply are not saved; they return to their default values after reload. The save is tied to the current browser and device.

The normal Settings modal changes the game's font. Dialogue difficulty is stored in the save but currently controlled through playtest UI.