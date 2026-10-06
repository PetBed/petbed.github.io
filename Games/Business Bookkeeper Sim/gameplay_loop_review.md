# Gameplay Loop Review: Business Bookkeeper Sim

## Executive summary

The game already has the pieces of a cozy shop and bookkeeping simulation: customer visits, shelf stock, prices, shop upgrades, source documents, books of prime entry, and weekly ledger posting. The problem is that these pieces do not yet form a satisfying decision loop. The player mostly advances time, watches a small random simulation, then records what happened. The business systems have limited influence on the next event, and the bookkeeping rarely changes what the player should do next.

This makes repetition the default experience. On a typical day, several customer visits produce similar sales documents; the player has few meaningful in-the-moment choices; and the day-to-day differences in prices, shelf setup, cash, and stock are not surfaced as clear feedback or goals. More random transactions would add variety to the inbox, but could make the game feel even more like paperwork.

The recommended direction is to make each day a short, legible business challenge:

1. Give the player a forecast and a concrete goal.
2. Let them make a small number of meaningful preparation choices.
3. Present a few customer or business situations that require a response.
4. Make stock, price, cash, and credit decisions affect the result.
5. Close with a recap that explains outcomes and connects them to the books.

The accounting should be the evidence and consequence of running the shop, not a second repetitive task layered on top of it.

## Current loop

### What the player currently does

1. **Open the shop.** The game initializes the day and sets a target number of events.
2. **Advance time.** The main action is **Wait**. Each click advances the clock and triggers a customer visit, or occasionally a return.
3. **Watch the outcome.** A customer may buy from available shelf stock, decide not to buy, or leave if their requested item is not displayed. A purchase creates a receipt or credit invoice.
4. **Close the shop.** The shop automatically closes after its event limit or at 5 PM. The game summarizes walk-in cash sales in a daily document; credit sales remain individual documents.
5. **Restock and manage.** After closing, the player can move stock from the backroom to shelves. Ordering new stock, changing prices, and buying upgrades are available through management screens.
6. **Record documents.** The player selects each document, chooses or confirms the book, enters particulars, chooses the accounting side, and stamps the row. Daily cash sales are grouped, but credit sales and other transactions are separate documents.
7. **Post weekly ledgers.** Sunday is reserved for clearing the inbox and manually posting journal totals and personal-account amounts. The next shop week cannot start until posting is complete.

The described systems are implemented in `game.js`: `triggerEvent()` advances time and selects a visit or return; `processCustomerVisit()` resolves the sale; `endDay()` and `startShopDay()` manage the daily/weekly phases; `renderPendingRow()` and `commitPendingEntry()` handle entry; and `getPostingTasks()` builds Sunday posting work.

### What varies today

- Random customer names and product/category selected.
- Whether a customer browses or asks for a specific item.
- Whether they buy, and how many units they buy.
- Whether a purchase is cash or credit.
- Occasional returns, conditional on prior purchases.
- Customer count, influenced by the selected premises.
- Purchase likelihood, influenced by appeal and price.
- Which shelves run low, depending on sales and restocking.

These variations change the resulting quantities and documents, but generally do not change the player's decision. The most common event remains a customer sale handled by waiting; much of the strategic value of price and display choices is hidden inside probabilities.

## Why the loop is not engaging

### 1. The central action is passive

**Wait** does not ask the player to make a decision. It spends a click to reveal an outcome selected by the simulation. The player cannot meaningfully shape the current customer visit, respond to a request, or choose how to use the time step. Waiting therefore feels like operating a random-event button, not running the shop.

### 2. Most outcomes are variations of one transaction

The customer system includes browsing, specific-item requests, successful purchases, failed purchases, and credit purchases, but most successful encounters still resolve to “a customer bought something.” The most frequent transaction is a sale, while returns are uncommon and rent is monthly. The activity log and inbox can therefore look different in detail while presenting the same basic task repeatedly.

### 3. Choices are detached from visible consequences

The player can set retail prices, select shelf products, restock, order stock, and buy premises or decorations. Those actions influence sales probability or capacity, but the game does not consistently turn those mechanics into a clear, near-term choice-and-feedback loop:

- Price effects are probabilistic and not explained with a simple demand signal.
- The player sees current stock but does not get a strong forecast of what will be needed.
- Restocking is mostly a transfer action; energy is a constraint, but there is little tactical information about where the next sale opportunity lies.
- Upgrade benefits are broad statistics such as traffic and appeal, not a specific short-term target.

As a result, a player may change a setting without knowing what outcome to expect or how to judge whether it helped.

### 4. There is no short-term purpose for a day

The game does not give each day a contract, target, customer priority, or other explicit objective. The player can run the shop, but there is no daily question like “Can I prepare for the school rush?” or “Should I accept this low-margin bulk order?” Without a goal, waiting and processing documents become ends in themselves.

### 5. Management has weak moment-to-moment trade-offs

Inventory and shelf allocation are real systems, but the player has limited reason to reconsider them until something runs out. A more interesting stock decision would compare competing uses of scarce cash, shelf space, storage, and time. Today, the primary repeated management action is restocking whatever is low.

### 6. Bookkeeping repeats without a strong learning or business payoff

The books record transactions, but the current prototype does not yet provide the planned trial balance, reconciliation hints, or correcting entries. Entries are not judged immediately, which is consistent with the intended learning design, but the player has little later feedback to understand whether their work was correct or what it means for the business. Clearing documents can therefore feel like an obligation rather than a puzzle with a reveal.

### 7. The weekly cadence delays variety and closure

The shop runs Monday through Saturday, then closes for Sunday posting. Rent recurs every 30 in-game days. A player who feels repetitive gameplay after only a few days has not yet reached the weekly bookkeeping gate, much less monthly rent. The pacing gives routine sales many repetitions before introducing a different kind of play.

### 8. Systems exist, but progression does not yet provide a strong arc

There are upgrades and some revenue-gated content, but the player is not guided through a sequence of meaningful near-term milestones. A revenue unlock is not as motivating as knowing what the next goal is, what decision could help reach it, and what tangible capability will be gained.

### 9. The design ambition is broader than the current playable loop

The game design document describes a procedural, player-driven simulation where business decisions shape events. It also identifies trial balance, reconciliation, and corrections as follow-up work. In the playable loop, customer events are mostly random, the range of supported day-to-day interactions is narrow, and the accounting journey currently stops after posting. The player is experiencing a prototype slice without enough of the intended decision-making or payoff.

## Improvement principles

1. **Add decisions before adding volume.** More sales, documents, or random events will not solve repetition if the player still only observes them.
2. **Make decisions consequential but understandable.** Show the likely upside, cost, and risk in plain language.
3. **Keep a daily session compact.** Offer a few interesting situations, not a long queue of interruptions.
4. **Create a short feedback loop.** A choice should have a visible outcome by closing time.
5. **Use accounting to explain the business.** Show how a decision appears in the records and what it did to cash, profit, or customer balances.
6. **Respect the educational scope.** New mechanics should reinforce supported accounting concepts rather than add unrelated simulation complexity.

## Concrete improvement ideas

### A. Add a daily brief and an explicit objective
NOTE: DO NOT IMPLEMENT THIS YET
At the start of each week, show a compact "Weekly Goal":

- **Today’s objective:** e.g. earn RM 180 revenue, sell 6 writing instruments, or complete a school order.
- **Forecast:** e.g. “The nearby school has exams this week; demand for paper goods may rise.”
- **Constraint:** e.g. limited cash, one nearly empty shelf, or an order due today.
- **Reward:** a modest bonus, relationship progress, or progress toward an upgrade.

Use a small number of objective types and rotate them. Goals should not require a single correct strategy; several viable plans should exist. For example, “Earn RM 180” could be approached through a popular low-price product or a higher-margin category.

**Why it helps:** The day gains a purpose, and preparation decisions become relevant. A goal also gives the end-of-day recap something meaningful to evaluate.

### B. Replace some passive visits with customer decisions

Keep ordinary walk-ins as background activity, but make one or two visits per day interactive. Each situation should present a short request and 2–3 responses with clear consequences.

Example: **A school needs 20 notebooks for an event tomorrow.**

- Accept at the standard price: good margin, but reserve stock and risk not having enough for walk-ins.
- Offer a small bulk discount: lower margin, larger guaranteed sale.
- Decline: preserve stock and cash, but lose the sale and possible relationship progress.
- Offer partial fulfillment: sell what is available and create a follow-up order.

Other situations could include a customer asking for a product not on display, an invoice customer requesting more time to pay, a supplier offering a limited-time deal, or a customer asking to return a purchase.

Each response should visibly affect stock, cash or receivables, and create the appropriate source document. Avoid asking the player to choose among accounting labels at the customer-facing decision point; keep the business choice separate from the later bookkeeping task.

**Why it helps:** The player becomes an operator instead of a spectator. Different responses naturally generate varied transactions, but the variety comes from choice rather than random paperwork.

### C. Make forecasts drive shelf and purchasing decisions

Introduce a simple weekly demand calendar: school events, exam periods, art fairs, or payday weekends. Before a demand spike, tell the player which categories are likely to be popular, without guaranteeing exact quantities.

Add a small forecast card in management:

| Category | Forecast | Displayed | Backroom | Suggested action |
|---|---:|---:|---:|---|
| Paper goods | High | 4 | 12 | Refill or order |
| Art supplies | Normal | 8 | 7 | Keep display |

Forecasts should be directionally reliable but not perfectly deterministic. This keeps planning meaningful without turning the game into spreadsheet optimization.

**Why it helps:** Inventory becomes a proactive allocation puzzle rather than a reactive check-and-restock chore.

### D. Make pricing a short experiment with readable feedback

For each product, show a simple demand indicator relative to a fair-price band:

- **Great value:** likely to sell, lower margin.
- **Fair price:** balanced demand and margin.
- **Premium:** higher margin, fewer likely buyers.

After closing, report units sold, gross margin, and missed sales for that category. Let the player compare today with the prior day or a small baseline.

Example: “Pens sold 8 units at RM 2.10. Demand was strong; raising the price may improve margin but could reduce volume.”

**Why it helps:** Price changes become intentional experiments, and the simulation explains what its probability model means.

### E. Give restocking an actual opportunity cost

Keep the existing shelf/restock system, but make the player choose among competing priorities. Examples:

- Limited restock energy means only some shelves can be filled before opening.
- Shelf space is limited, so adding one category pushes out another.
- Incoming customer demand or an accepted order can consume reserved stock.
- A rush is expected tomorrow, but filling those shelves means less stock available for a bulk order.

Show projected shelf coverage or a simple “likely to run out” indicator. Avoid requiring exact forecast math; communicate risk in useful terms.

**Why it helps:** Restocking becomes a plan with trade-offs, not a button that restores a meter.

### F. Add supplier offers and payment choices

Offer a few supplier decisions with distinct financial implications:

- Pay cash now for a lower unit cost.
- Buy on credit with a due date.
- Pay within a short window to receive a cash discount.
- Accept a bulk offer that saves money but consumes storage and cash.

Display the amount due, due date, discount, and resulting available cash before confirmation. The corresponding invoice, cheque, discount, or liability document becomes bookkeeping practice.

**Why it helps:** This adds variety that also reinforces the accounting curriculum and creates a meaningful cash-flow decision.

### G. Tie regular customers and community orders to shop decisions

Track a few customer relationships, such as a school, nearby office, or art club. Good service, reliable fulfillment, and fair pricing improve the chance of future orders. Failed promises or repeated stockouts reduce trust.

Keep the model simple: a few relationship levels and occasional requests are enough. Do not require a social simulation or large dialogue system.

**Why it helps:** Today’s choice can affect a future day, creating continuity and a reason to plan.

### H. Add a close-of-day business recap

At close, present one concise report before the inbox/accounting step:

- Goal progress and reward.
- Revenue by category and payment type.
- Units sold and unsatisfied demand.
- Cash and bank change.
- Stock that ran out or was overstocked.
- One explanation linking an outcome to the player’s decision.
- Documents created and the next recommended accounting task.

Example: “The school order met today’s revenue target, but the notebook shelf ran out before the afternoon rush. RM 60 is still owed on credit.”

**Why it helps:** It provides closure, shows cause and effect, and helps the player understand why the documents exist.

### I. Make bookkeeping progress toward a visible accounting payoff

Implement the planned accounting checkpoints in manageable steps:

1. Weekly posting status: show what is complete and what remains.
2. Trial balance: calculate debit and credit totals after posting.
3. Graduated hints: point first to a book or account group, then to a particular total or posting.
4. Correcting entries: allow a separate correction without overwriting the original.
5. Later, financial statements and a month-end review.

When the player finishes recording a document, show a neutral confirmation of its accounting effect and the business balance it changed. Do not immediately label the player's classification correct or incorrect if preserving the investigation-based teaching approach.

**Why it helps:** Bookkeeping becomes a learning challenge with a result and a route to investigate, rather than an inbox-clearing chore.

### J. Compress routine actions and reserve clicks for decisions

The game should not require a separate time-advance click for every uneventful stretch. Consider presenting a small number of scheduled decision moments per day, with routine sales summarized automatically between them. Preserve individual documents where educationally useful, but offer clear summaries and filtering so bookkeeping quantity does not grow faster than meaningful play.

Possible pacing:

- Morning planning.
- One or two customer/business decisions.
- A short afternoon update or urgent choice.
- Closing recap and bookkeeping.

**Why it helps:** It reduces repetitive clicking while preserving the important transactions and decisions.

## Suggested target loop

### Morning: plan

1. Read the day objective and demand forecast.
2. Choose a focus, such as maximizing margin, serving a school order, or clearing excess stock.
3. Make a few constrained decisions: shelf allocation, price adjustment, and optional supplier order.

### During the day: respond

1. Ordinary visits resolve quickly and are summarized.
2. One or two notable customers present meaningful choices.
3. The choices affect inventory, cash/receivables, relationships, and source documents.
4. Give immediate feedback when a decision creates a risk or opportunity.

### Closing: understand

1. Show the objective result and business recap.
2. Explain at least one consequence of the player's decisions.
3. Highlight stock risks and tomorrow's forecast.
4. Provide a direct route to record the generated documents.

### Weekly: reconcile and learn

1. Record and post the week's transactions.
2. Calculate the trial balance.
3. Use optional hints and corrections to find discrepancies.
4. Start the next week with a fresh target and an evolving customer/supplier situation.

## Recommended implementation order

### Priority 1: Improve feedback before adding lots of content

- Add a daily goal and simple forecast.
- Add an end-of-day recap that shows sales, stockouts, cash/credit split, and goal completion.
- Make the effects of price, appeal, and shelf availability visible in plain language.

This is the smallest coherent change that makes current systems easier to understand and gives days purpose.

### Priority 2: Add a small set of interactive customer situations

- Implement 3–5 reusable event templates.
- Show one notable event per day initially, with a second only on selected days.
- Ensure choices produce distinct outcomes and documents.
- Test that the choices are financially legible and avoid one obviously dominant answer.

This directly changes the passive “wait and see” experience.

### Priority 3: Make stock and supplier decisions react to forecasts

- Add category demand forecasts and stockout reporting.
- Add one supplier offer type, such as a bulk discount versus standard replenishment.
- Make cash, storage, shelf space, and energy trade-offs visible.

### Priority 4: Complete the accounting payoff

- Add trial balance after weekly posting.
- Add graduated discrepancy hints and correcting entries.
- Use the recap to connect business events with their source documents and ledger effects.

### Priority 5: Expand the long-term arc

- Add customer relationships and recurring orders.
- Expand the month calendar and later Form 4 transaction types.
- Add month-end financial statements after the weekly learning loop is engaging.

## Risks and design guardrails

- **Do not solve boredom by flooding the inbox.** A greater transaction count can increase clerical work without increasing meaningful play.
- **Avoid opaque randomness.** If outcomes depend on price or appeal, surface those factors enough that the player can form a reasonable expectation.
- **Avoid a single optimal strategy.** Goals and events should support multiple trade-offs, not force the player to memorize one correct setup.
- **Avoid punishing bad forecasts too harshly.** Early play should teach through recoverable consequences, not a sudden insolvency spiral.
- **Preserve accounting integrity.** Customer-facing choices should create the correct source documents and ledger implications; tutorial cues should not silently post entries.
- **Keep the scope incremental.** A full calendar, extensive dialogue, and every syllabus transaction type are not prerequisites to making the first week engaging.

## How to validate the changes

Test with new players and ask them to think aloud during at least the first six in-game days. Track:

- Whether the player can state the day's objective and forecast.
- How often they make a deliberate management choice before opening.
- Whether they can explain why a sale succeeded, failed, or produced a stockout.
- How often they use pass-time without expecting a decision or event.
- How many routine clicks are needed to complete a day.
- Whether they can explain the financial consequence of a customer or supplier choice.
- Where they stop playing, and what they say prompted them to stop.
- Whether they understand why weekly posting and trial balance matter.

Success is not simply more events or more playtime. A better loop should lead players to make plans, notice consequences, and want to see how the next business day turns out.

## Inspiration applied

These references are examples of design patterns, not templates to copy:

- [Game Dev Tycoon](https://www.greenheartgames.com/app/game-dev-tycoon/) makes choices about focus and development affect a game's outcome, and ties experience to unlocks. Adaptation: make shop decisions legible, consequential experiments and make progression unlock a useful new business option.
- [Moonlighter](https://store.steampowered.com/app/606150/Moonlighter/) connects gathering goods, selling them, and investing in the shop. Adaptation: connect sourcing and display choices to customer opportunities, while keeping this game's accounting work central.
- [Papers, Please](https://papersplea.se/) gives repeated work tension through individual cases with meaningful consequences. Adaptation: make a small number of customer or supplier cases per day matter, rather than turning every routine sale into a lengthy dialogue.

## Project references

- `game.js`: daily event generation, customer outcomes, management, document recording, and ledger posting.
- `index.html`: primary day controls and workspace layout.
- `game_design_document.md`: intended business loop, accounting rules, and prototype scope.
- `ui_ux_design_document.md`: workspace structure, guidance goals, and prototype scope note.
