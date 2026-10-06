# UI/UX Design Blueprint: Business Bookkeeper Sim

## 1. Design Philosophy
*   **Guided, not crowded:** Two left-window tabs separate shop activity from business management. Two large right-window tabs separate books of prime entry from ledgers. Each screen explains its purpose and offers a direct next action when a step is blocked or complete.
*   **Readable first:** Use a calm, pastel palette in light mode and a low-glare, warm charcoal palette in dark mode. Keep sage as the primary accent, use brass sparingly, and maintain clear hierarchy, comfortable text sizes, and simple ledger-inspired cards. A persistent appearance toggle remembers the player's choice. Prefer visible state and direct actions over redundant instructions or helper copy; trust players to read the interface. Avoid simulated browser chrome, decorative desk illustrations, dense always-visible controls, and tiny labels.
*   **One language policy:** The interface is English-first. Introduce Form 4 KSSM book names consistently in parentheses the first time they are useful (for example, **Cash Book (Buku Tunai)**); do not mix untranslated Malay labels into unrelated English sentences. Debit and Credit remain neutral accounting sides.
*   **Show context when needed:** The day and cash remain visible in the left-window header. Shop actions and the pending-document inbox belong in **Shop & Inbox**; premises, decor, prices, inventory, and restocking belong in **Business Management**. Processed records remain in the books, not mixed into the active inbox.
*   **Implementation:** The first playable build is a dependency-free browser game using HTML, CSS, and JavaScript. Game progress is saved locally in the current browser; no account or network service is required.

## 2. Layout Structure

### Desktop Layout (Two-Window Workspaces)
The screen has two clear windows and no simulated browser frame or decorative header:
*   **Left Window:** Persistent day and cash indicators sit above two tabs. **Shop & Inbox** contains the activity log, shop controls, and pending source documents. **Business Management** contains the shop investment, inventory, pricing, shelf, and restock controls.
*   **Right Window:** Two larger primary tabs separate **Books of Prime Entry** from **Ledgers**. The first contains the journal tabs. The second contains Sunday posting and selectable account ledgers. Each account ledger uses a spreadsheet layout with date, particulars, folio, debit, credit, and running balance columns.
*   **Posting and review:** Sunday posting remains a manual task. Completed posting tasks update their corresponding ledger sheets immediately. Interface labels use text rather than emojis.

### Mobile Layout (Tabbed/Drawer)
The narrow layout keeps the existing Shop & Inbox and accounting workspaces. **Business Management** opens as a focused full-screen layer instead of competing with the books in a cramped split view; a persistent **Shop & Inbox** control returns to shop activity. Its four management sub-tabs keep overview, stock and prices, shelves, and upgrades separate. On narrow screens, workspace and book tabs scroll horizontally when needed.

## 3. Detailed Component Breakdown

### A. The Left Window: Shop Status & Document Inbox
The persistent header shows the day phase and cash. **Shop & Inbox** contains the shop activity log, shop controls, and source-document inbox. Each pending document has its reference, description, amount, and a clear action. Processed documents leave the inbox and remain accessible through their book entries. **Business Management** is split into four focused sub-tabs: **Overview** (phase-aware next action and a few business signals), **Stock & Prices** (a compact stockroom map with shop-floor and backroom capacity, side-by-side product quantities by location, retail prices, supplier comparison, and the stockroom order modal), **Shelves** (display assignment and evening restock), and **Shop & Upgrades** (premises, decor, and capacity). The stock-order modal explains the selected supplier's offer, minimum quantity, unit cost, total, and the effect of bank-now versus credit payment. Credit invoices show their due date and remain payable from the supplier-invoice list; paying one creates a cheque butt in the inbox. Upgrade groups collapse until needed; avoid repeating the same counts across every screen. Restock controls are disabled while open and during Sunday bookkeeping. Daytime business purchases show their generated source document and consume a time step.

The first relevant customer opportunity each shop day opens a focused decision dialog. Present a short, specific situation and two or three consequence-led responses; do not let the player dismiss the case without choosing. Rotate recent event types and customer names, and tailor the details and amounts to current inventory and prices. Ordinary visits continue in the background so routine foot traffic does not become a succession of modal interruptions.

The hierarchy takes cues from *Two Point Hospital*'s separate information/stat screens and *Game Dev Tycoon*'s focused development-stage decision panel, rather than copying their visual styles: [Two Point Hospital](https://store.steampowered.com/app/535930/Two_Point_Hospital/) · [Game Dev Tycoon](https://store.steampowered.com/app/239820/Game_Dev_Tycoon/). Here, that translates to four task-specific management tabs, a phase-aware next action, and modal ordering instead of a single scrolling pile of controls.

Shelf management uses a visual shelf wall: every display is visible together with its product, fill level, and stock status. Select a shelf to open its focused workbench, where the displayed product and restock quantity can be changed without repeating controls on every shelf; each shelf also has a one-tap fill button, and **Restock all** fills shelves in order until stock or energy runs short. Each successfully restocked shelf spends one energy action. Changing a display product asks whether to fill it with the new product; declining still changes the product, returns the old display stock to the backroom, and leaves the shelf empty. Existing shelf quantities persist overnight; the workbench shows whether display space, backroom stock, or energy is the limiting factor.

### B. The Right Panel: The Workspace (The Books)
This is the core mechanical area. It uses a simple, paper-like worksheet treatment with one clear task at a time.

*   **Workspace Tabs:** The left window switches between **Shop & Inbox** and **Business Management**. The right window switches between **Books of Prime Entry** (journal sub-tabs) and **Ledgers** (Sunday posting and ledger account sheets).

*   **Source Documents (Right Rail):** Clicking a pending document selects its suggested book and brings the evidence into the workspace for cross-reference. If the shop is still open, the player is prompted to close it before recording.

*   **The Data Entry Row ("Option B" Implementation):**
    *   When the player selects a document and a book (for example, the Cash Book (Buku Tunai) and a cash receipt), a new pending row appears at the bottom of the ledger.
    *   **Auto-filled:** The Date and straightforward document total Amount are already typed in soft, greyed-out text.
    *   **Player Input:** 
        1.  A dropdown menu to select the specific Account (for example, Sales).
        2.  A text field to manually type the transaction particulars.
        3.  Account and Debit/Credit side selection.
        4.  For learning calculations such as a discounted payment, editable amount fields for the player to calculate and enter the required split, including the relevant discount.
    *   **Submission:** A satisfying "Stamp" button (or hitting Enter) commits the entry.
    *   Entries are not immediately marked right or wrong. Incorrect entries remain in the books and can be investigated during reconciliation.
    *   Walk-in cash-sale receipts are grouped into one daily summary at shop closing and recorded as one **Sales** entry in the Cash Book; credit-sale invoices remain individual Sales Journal entries.

*   **Ledger Posting:** After processing documents into books of prime entry, the player opens a dedicated posting step to manually post to the ledgers. The UI distinguishes general ledger postings (journal totals where appropriate) from individual customer and supplier account postings. Clearly indicate what remains unposted without silently completing the work for the player.
    *   Each individual ledger is available as a spreadsheet-style account sheet with date, particulars, folio, debit, credit, and running balance columns. Sheets update as posting tasks are completed.

*   **Corrections:** Once posted, an entry is preserved. The player corrects it by entering a separate correcting entry in *Jurnal Am*. A correction can contain one or more ledger lines; keep both the original and correction visible in the record.

*   **Customer Decisions:** The daily customer dialog pauses the shop until the player responds. Bulk orders, negotiated discounts, backroom requests, and valid returns have distinct stock, price, cash/credit, and source-document outcomes. Each decision option states its immediate financial or inventory consequence before selection.

### C. The Sunday Review / Month-End Boss Fight
*   **Trial Balance (Imbangan Duga) View:** 
    *   Once all source documents and ledger postings are complete, a two-column list of ledger balances appears. In the first playable prototype this checkpoint follows a single shop day; later the same flow will anchor month-end.
    *   The player chooses **Calculate trial balance** to total the ledger balances.
    *   If the totals match: The screen pulses with a soft, satisfying glow. Confetti.
    *   If they fail: The totals flash red. The "Truth Engine" offers optional, graduated hint tickets. A broad hint can point to an area of the books; further hints narrow the discrepancy without giving the player the correcting entry (for example, pointing to a journal total that does not match its ledger posting).

## 4. Tactile & "Juicy" Feedback
To ensure it doesn't feel like a boring Excel spreadsheet, we rely heavily on micro-interactions:
*   **Sound Design:** Hovering over documents makes a soft paper rustle. Committing an entry plays a satisfying, chunky mechanical keyboard clack or a rubber stamp "thud."
*   **Animations:** When an entry is posted to the *Buku Catatan Pertama*, a tiny, ghostly copy of the amount flies off-screen toward the *Lejar* tab, reminding the player that a double-entry posting is waiting.
*   **Error Prevention:** If the player tries to type letters into a number field, the box gently shakes (a standard UI error state, but kept subtle). This prevents invalid input without judging accounting choices at entry time.

### Prototype Scope Note
The playable build uses English-first left-window tabs for shop activity and business management, large right-window tabs for books of prime entry and ledgers, and a pending-document inbox. Business management separates backroom inventory from shelf stock and exposes premise, decoration, display/storage capacity, pricing, supplier offers, outstanding supplier invoices, and energy-restock controls; it also shows ordered quantities awaiting next-day delivery. One context-sensitive customer decision is presented per shop day when a suitable event exists; routine customer visits remain simulated. Supplier choices distinguish standard, bulk-discount, and flexible-credit offers, with bank-now or supplier-credit payment and a follow-up bank payment that produces a cheque butt. KSSM book names are shown consistently in parentheses beside their English labels. Sunday posting is manual, and each posted account is visible in a spreadsheet-style ledger with a running balance. Search, filtering, an English/Bahasa Melayu language toggle, a dedicated mobile bottom bar, early-payment cash discounts, and sound/animation polish remain future work.

## 5. UI Flow: Paying an Invoice
1.  Player selects a supplier offer and quantity in the stockroom order form.
2.  The form displays the unit price, minimum quantity, total cost, credit terms, and available bank balance after purchase.
3.  Player chooses **Pay by bank now** (a cash bill is created and Bank decreases immediately) or **Supplier credit** (an invoice is created with a due date; Bank is unchanged).
4.  Outstanding credit invoices appear in the **Supplier invoices** section of Stock & Prices. The player may pay an invoice from available Bank funds.
5.  Paying an invoice creates a *Keratan Cek* (Cheque Butt) in the Inbox and reduces Bank immediately. The player records the cheque butt in the Cash Book using the supplier name as the account particulars. Early-payment discounts and the *Diskaun Diterima* calculation remain future work.