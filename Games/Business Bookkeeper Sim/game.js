
        const startingInventory = {
            paperGoods: { id: 'paperGoods', name: 'Paper Goods (Notebooks, Reams)', qty: 45, unitCost: 4.50 },
            writingInstruments: { id: 'writingInstruments', name: 'Writing Instruments (Pens, Pencils)', qty: 120, unitCost: 1.20 },
            artSupplies: { id: 'artSupplies', name: 'Art Supplies (Paints, Brushes)', qty: 15, unitCost: 12.00 },
            officeAccessories: { id: 'officeAccessories', name: 'Office Accessories (Staplers, Folders)', qty: 25, unitCost: 6.50 },
            electronics: { id: 'electronics', name: 'Electronics (Calculators)', qty: 5, unitCost: 45.00 }
        };
        Object.values(startingInventory).forEach(item => {
            item.retailPrice = Math.round(item.unitCost * 1.5 * 100) / 100;
        });
        const startingDisplayStock = { paperGoods: 12, writingInstruments: 15, artSupplies: 8 };
        const startingInventoryValue = Object.values(startingInventory)
            .reduce((total, item) => total + Math.round(item.qty * item.unitCost * 100) / 100, 0);
        Object.values(startingInventory).forEach(item => {
            item.qty -= startingDisplayStock[item.id] || 0;
        });
        const openingCapital = 1000 + 4000 + startingInventoryValue;
        const premises = [
            { id: 'neighborhood-shop', name: 'Neighborhood Shop', cost: 0, rent: 300, traffic: 1, appeal: 0.05, unlockDay: 1 },
            { id: 'town-center', name: 'Town Center Store', cost: 2200, rent: 650, traffic: 1.35, appeal: 0.12, unlockDay: 1 },
            { id: 'market-plaza', name: 'Market Plaza Store', cost: 5200, rent: 1200, traffic: 1.8, appeal: 0.2, unlockRevenue: 5000 }
        ];
        const decorations = [
            { id: 'warm-lighting', name: 'Warm Lighting', cost: 350, appeal: 0.12, basket: 0.2, unlockDay: 1 },
            { id: 'window-display', name: 'Window Display', cost: 800, appeal: 0.2, basket: 0.35, unlockDay: 1 },
            { id: 'reading-corner', name: 'Reading Corner', cost: 1800, appeal: 0.3, basket: 0.5, unlockRevenue: 2500 }
        ];
        const openingJournalEntries = [
            { id: 'OPENING-CASH', day: 1, documentId: 'GJ-0001', book: 'generalJournal', particulars: 'Cash', amount: 1000, side: 'debit', discountAllowed: 0, discountReceived: 0, opening: true },
            { id: 'OPENING-BANK', day: 1, documentId: 'GJ-0001', book: 'generalJournal', particulars: 'Bank', amount: 4000, side: 'debit', discountAllowed: 0, discountReceived: 0, opening: true },
            { id: 'OPENING-INVENTORY', day: 1, documentId: 'GJ-0001', book: 'generalJournal', particulars: 'Inventory', amount: startingInventoryValue, side: 'debit', discountAllowed: 0, discountReceived: 0, opening: true },
            { id: 'OPENING-CAPITAL', day: 1, documentId: 'GJ-0001', book: 'generalJournal', particulars: 'Capital', amount: openingCapital, side: 'credit', discountAllowed: 0, discountReceived: 0, opening: true }
        ];

        const state = {
            day: 1,
            hour: 9, // Start at 9:00 AM
            minute: 0,
            eventsToday: 0,
            maxEventsToday: Math.floor(Math.random() * 2) + 4, // 4 to 5 events max per day
            shopOpen: true,
            customerDecisionPresentedToday: false,
            pendingCustomerDecision: null,
            customerDecisionCounter: 1,
            customerDecisionHistory: [],
            recentDecisionCustomers: [],
            focus: 100,
            restockEnergy: 100,
            maxRestockEnergy: 100,
            restockEnergyCost: 10,
            actualCash: 1000.0,
            actualBank: 4000.0,
            totalRevenue: 0,
            activeTab: 'cashBook',
            activeWorkspace: 'books',
            activeLedgerView: 'accounts',
            selectedLedgerAccount: 'all',
            activeLeftTab: 'shop',
            activeManagementTab: 'overview',
            inbox: [],
            primeEntries: openingJournalEntries,
            postedTaskIds: openingJournalEntries.map(entry => `entry:${entry.id}`),
            ledgerPostings: [
                { account: 'Cash', side: 'debit', amount: 1000, date: 1, reference: 'Opening journal GJ-0001' },
                { account: 'Bank', side: 'debit', amount: 4000, date: 1, reference: 'Opening journal GJ-0001' },
                { account: 'Inventory', side: 'debit', amount: startingInventoryValue, date: 1, reference: 'Opening journal GJ-0001' },
                { account: 'Capital', side: 'credit', amount: openingCapital, date: 1, reference: 'Opening journal GJ-0001' }
            ],
            docCounter: 1001,
            activeDoc: null,
            recordingDoc: null,
            selectedColumn: null, // e.g. 'debit-cash', 'debit-bank', 'debit', 'credit', 'amount'
            
            // New: Inventory and Suppliers
            inventory: startingInventory,
            storageCapacity: 220,
            shelfCapacity: 15,
            shelves: Object.entries(startingDisplayStock).map(([itemId, qty], index) => ({ id: index + 1, itemId, qty })),
            premiseId: 'neighborhood-shop',
            ownedDecorations: [],
            premises,
            decorations,
            inventoryModalOpener: null,
            rentBilledDays: [],
            customers: ['Sekolah Jaya', 'Kedai Buku Murni', 'Ravi Kumar', 'Aina Hassan', 'Mei Lin', 'Farid Iskandar', 'Nadia Tan', 'Daniel Wong'],
            customerPurchases: [],
            suppliers: [
                { id: 'S01', name: 'Pustaka Jaya Wholesale', terms: 'Net 7 days', creditDays: 7, minQuantity: 1, unitDiscount: 0, unitMarkup: 0, offer: 'Everyday pricing with no minimum order.' },
                { id: 'S02', name: 'Mega Stationers Bhd', terms: 'Net 14 days', creditDays: 14, minQuantity: 10, unitDiscount: 0.08, unitMarkup: 0, offer: 'Bulk offer: 8% off the usual unit cost on orders of 10 or more.' },
                { id: 'S03', name: 'Kilang Kertas KL', terms: 'Net 30 days', creditDays: 30, minQuantity: 1, unitDiscount: 0, unitMarkup: 0.04, offer: 'Flexible small orders at a 4% premium, with 30-day credit.' }
            ],
            supplierInvoices: [],
            pendingInventoryDeliveries: [],
            activeOrderItem: null,
            selectedOrderSupplierId: null,

            events: []
        };
        let selectedShelfId = state.shelves.length ? state.shelves[0].id : null;
        const initialState = JSON.parse(JSON.stringify(state));
        const SAVE_SLOT_COUNT = 3;
        const SAVE_STORAGE_PREFIX = 'bookkeeper-save-slot-';
        let activeSaveSlot = null;
        let lastSaveError = null;

        const formatMoney = (amount) => `RM ${parseFloat(amount).toFixed(2)}`;
        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        function readSaveSlot(slot) {
            let raw = null;
            try {
                raw = localStorage.getItem(`${SAVE_STORAGE_PREFIX}${slot}`);
                if (!raw) return { exists: false, save: null, error: null };

                let save;
                try {
                    save = JSON.parse(raw);
                } catch (error) {
                    console.error(`Save file ${slot} contains invalid data.`, error);
                    return { exists: true, save: null, error: 'This save file is invalid and cannot be loaded.' };
                }
                if (
                    save?.version !== 1 ||
                    !save.state ||
                    !Number.isInteger(save.state.day) ||
                    save.state.day < 1 ||
                    !Number.isFinite(save.state.actualCash) ||
                    !Number.isFinite(save.state.actualBank) ||
                    !save.state.inventory ||
                    !Array.isArray(save.state.shelves) ||
                    !Array.isArray(save.state.inbox) ||
                    !Array.isArray(save.state.primeEntries) ||
                    !Array.isArray(save.state.ledgerPostings) ||
                    !Array.isArray(save.state.events) ||
                    !Array.isArray(save.state.rentBilledDays)
                ) {
                    return { exists: true, save: null, error: 'This save file is invalid and cannot be loaded.' };
                }
                return { exists: true, save, error: null };
            } catch (error) {
                console.error(`Save file ${slot} could not be read.`, error);
                return { exists: Boolean(raw), save: null, error: 'Save files are unavailable in this browser.' };
            }
        }

        function setSaveMenuError(message) {
            const error = document.getElementById('save-menu-error');
            if (error) error.textContent = message;
        }

        function renderSaveMenu() {
            const slotList = document.getElementById('save-slot-list');
            slotList.replaceChildren();
            setSaveMenuError('');

            for (let slot = 1; slot <= SAVE_SLOT_COUNT; slot++) {
                const result = readSaveSlot(slot);
                const card = document.createElement('article');
                card.className = 'save-slot';
                const details = document.createElement('div');
                details.className = 'save-slot-details';
                const title = document.createElement('h3');
                title.textContent = `Save ${slot}${activeSaveSlot === slot ? ' · Current' : ''}`;
                details.appendChild(title);

                const description = document.createElement('p');
                if (result.save) {
                    const savedAt = new Date(result.save.savedAt);
                    const savedTime = Number.isNaN(savedAt.getTime()) ? 'Save time unavailable' : savedAt.toLocaleString();
                    description.textContent = `Day ${result.save.state.day} · ${savedTime}`;
                } else if (result.error) {
                    description.textContent = result.error;
                    description.classList.add('save-slot-warning');
                } else {
                    description.textContent = 'Empty save file';
                }
                details.appendChild(description);

                const actions = document.createElement('div');
                actions.className = 'save-slot-actions';
                const selectButton = document.createElement('button');
                selectButton.type = 'button';
                selectButton.className = 'save-slot-select';
                selectButton.textContent = result.error
                    ? 'Unavailable'
                    : activeSaveSlot === slot
                        ? 'Return to game'
                        : result.save
                            ? 'Load save'
                            : 'Start new game';
                selectButton.disabled = Boolean(result.error);
                selectButton.addEventListener('click', () => selectSaveSlot(slot));
                actions.appendChild(selectButton);

                if (result.exists || result.save) {
                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.className = 'save-slot-delete';
                    deleteButton.textContent = 'Delete';
                    deleteButton.addEventListener('click', () => deleteSaveSlot(slot));
                    actions.appendChild(deleteButton);
                }

                card.append(details, actions);
                slotList.appendChild(card);
            }
        }

        function saveActiveGame() {
            if (activeSaveSlot === null) return true;

            try {
                const savedState = {
                    ...state,
                    inventoryModalOpener: null,
                    activeDoc: null,
                    recordingDoc: null,
                    selectedColumn: null
                };
                localStorage.setItem(`${SAVE_STORAGE_PREFIX}${activeSaveSlot}`, JSON.stringify({
                    version: 1,
                    savedAt: new Date().toISOString(),
                    state: savedState
                }));
                lastSaveError = null;
                return true;
            } catch (error) {
                console.error(`Save file ${activeSaveSlot} could not be autosaved.`, error);
                const message = 'Autosave failed. Your latest progress may not be saved.';
                setSaveMenuError(message);
                if (lastSaveError !== message) showToast(message, 'error');
                lastSaveError = message;
                return false;
            }
        }

        function openSaveMenu(initial = false) {
            if (!initial && !saveActiveGame()) return;
            renderSaveMenu();
            const menu = document.getElementById('save-menu');
            menu.classList.remove('hidden');
            menu.setAttribute('aria-hidden', 'false');
            document.getElementById('save-menu-close').hidden = activeSaveSlot === null;
            menu.querySelector('[role="dialog"]').focus();
        }

        function closeSaveMenu() {
            if (activeSaveSlot === null) return;
            const menu = document.getElementById('save-menu');
            menu.classList.add('hidden');
            menu.setAttribute('aria-hidden', 'true');
            document.getElementById('save-menu-button').focus();
        }

        function resetGameState() {
            Object.keys(state).forEach(key => delete state[key]);
            Object.assign(state, JSON.parse(JSON.stringify(initialState)));
            selectedShelfId = state.shelves.length ? state.shelves[0].id : null;
        }

        function startFreshGame(slot) {
            resetGameState();
            activeSaveSlot = slot;
            renderOpeningJournal();
            renderSavedShopLog();
            issueMonthlyRent();
            switchLeftTab('shop');
            switchManagementTab('overview');
            closeSaveMenu();
            updateUI();
        }

        function selectSaveSlot(slot) {
            if (activeSaveSlot === slot) {
                closeSaveMenu();
                return;
            }
            if (activeSaveSlot !== null && !saveActiveGame()) return;

            const result = readSaveSlot(slot);
            if (result.error) {
                setSaveMenuError(result.error);
                return;
            }
            if (!result.save) {
                startFreshGame(slot);
                return;
            }

            resetGameState();
            Object.assign(state, result.save.state);
            state.inventoryModalOpener = null;
            state.activeDoc = null;
            state.recordingDoc = null;
            state.selectedColumn = null;
            state.events = Array.isArray(state.events) ? state.events : [];
            selectedShelfId = state.shelves.some(shelf => shelf.id === selectedShelfId)
                ? selectedShelfId
                : state.shelves.length ? state.shelves[0].id : null;
            activeSaveSlot = slot;
            renderOpeningJournal();
            renderSavedJournalEntries();
            renderSavedShopLog();
            switchLeftTab(state.activeLeftTab);
            switchManagementTab(state.activeManagementTab);
            closeSaveMenu();
            updateUI();
            if (state.pendingCustomerDecision) showCustomerDecision(state.pendingCustomerDecision);
        }

        function deleteSaveSlot(slot) {
            const isCurrentSave = activeSaveSlot === slot;
            const prompt = isCurrentSave
                ? `Delete Save ${slot} and immediately start a new game in this slot?`
                : `Permanently delete Save ${slot}?`;
            if (!window.confirm(prompt)) return;

            try {
                localStorage.removeItem(`${SAVE_STORAGE_PREFIX}${slot}`);
            } catch (error) {
                console.error(`Save file ${slot} could not be deleted.`, error);
                setSaveMenuError(`Save ${slot} could not be deleted.`);
                return;
            }

            if (isCurrentSave) {
                startFreshGame(slot);
            } else {
                renderSaveMenu();
            }
        }

        function getWeekday(day = state.day) {
            return weekdays[(day - 1) % weekdays.length];
        }

        function isSunday() {
            return getWeekday() === 'Sunday';
        }
        
        function formatTime(h, m) {
            const ampm = h >= 12 ? 'PM' : 'AM';
            let hour12 = h % 12;
            if (hour12 === 0) hour12 = 12;
            const minStr = m.toString().padStart(2, '0');
            return `${hour12}:${minStr} ${ampm}`;
        }

        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            const bgColor = type === 'error' ? 'bg-red-500 text-white' : (type === 'success' ? 'bg-mint text-gray-900' : 'bg-gray-700 text-white');
            toast.className = `${bgColor} px-4 py-2 rounded shadow-lg text-xs font-bold animate-slide-up flex items-center gap-2`;
            toast.innerHTML = message;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        function switchTab(tabName) {
            if (tabName === 'books' || tabName === 'ledgers') {
                state.activeWorkspace = tabName;
                if (tabName === 'ledgers') {
                    state.activeLedgerView = isSunday() && state.inbox.length === 0 ? 'posting' : 'accounts';
                }
                updateWorkspaceTabs();
                return;
            }

            if (tabName === 'posting') {
                if (!isSunday()) {
                    showToast('Ledger posting is available on Sunday.', 'error');
                    return;
                }
                if (state.inbox.length > 0) {
                    showToast('Record every document in the inbox before posting to ledgers.', 'error');
                    return;
                }
                state.activeWorkspace = 'ledgers';
                state.activeLedgerView = 'posting';
                updateWorkspaceTabs();
                renderPostingView();
                return;
            }

            state.activeWorkspace = 'books';
            state.activeTab = tabName;
            updateWorkspaceTabs();
            if (state.recordingDoc) {
                renderPendingRow();
            }
        }

        function updateWorkspaceTabs() {
            const booksWorkspace = document.getElementById('books-workspace');
            const ledgersWorkspace = document.getElementById('ledgers-workspace');
            const booksTabBar = document.getElementById('books-tab-bar');
            const ledgerTabBar = document.getElementById('ledger-tab-bar');
            const booksTab = document.getElementById('workspace-tab-books');
            const ledgersTab = document.getElementById('workspace-tab-ledgers');
            const isBooks = state.activeWorkspace === 'books';

            booksWorkspace.classList.toggle('hidden', !isBooks);
            ledgersWorkspace.classList.toggle('hidden', isBooks);
            booksTabBar.classList.toggle('hidden', !isBooks);
            ledgerTabBar.classList.toggle('hidden', isBooks);
            booksTab.setAttribute('aria-selected', String(isBooks));
            ledgersTab.setAttribute('aria-selected', String(!isBooks));
            booksTab.className = isBooks
                ? 'px-6 py-4 text-sm md:text-base font-bold border-b-2 border-mint text-mint whitespace-nowrap'
                : 'px-6 py-4 text-sm md:text-base font-bold border-b-2 border-transparent text-gray-400 hover:text-gray-200 whitespace-nowrap';
            ledgersTab.className = !isBooks
                ? 'px-6 py-4 text-sm md:text-base font-bold border-b-2 border-mint text-mint whitespace-nowrap'
                : 'px-6 py-4 text-sm md:text-base font-bold border-b-2 border-transparent text-gray-400 hover:text-gray-200 whitespace-nowrap';

            const bookTabs = ['cashBook', 'generalJournal', 'salesJournal', 'purchasesJournal', 'salesReturnsJournal', 'purchasesReturnsJournal'];
            bookTabs.forEach(tab => {
                const view = document.getElementById(`view-${tab}`);
                const button = document.getElementById(`tab-${tab}`);
                const active = tab === state.activeTab;
                view.classList.toggle('hidden', !isBooks || !active);
                button.setAttribute('aria-selected', String(active));
                button.className = active
                    ? 'px-4 py-3 font-semibold bg-gray-900 text-mint border-b-2 border-mint whitespace-nowrap'
                    : 'px-4 py-3 font-semibold text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap';
            });

            const postingView = document.getElementById('view-posting');
            const ledgerAccountsView = document.getElementById('view-ledgerAccounts');
            const postingTab = document.getElementById('tab-posting');
            const ledgerAccountsTab = document.getElementById('tab-ledgerAccounts');
            const isPosting = state.activeLedgerView === 'posting';
            postingView.classList.toggle('hidden', isBooks || !isPosting);
            ledgerAccountsView.classList.toggle('hidden', isBooks || isPosting);
            postingTab.setAttribute('aria-selected', String(isPosting));
            ledgerAccountsTab.setAttribute('aria-selected', String(!isPosting));
            postingTab.className = isPosting
                ? 'px-5 py-3 font-semibold text-mint border-b-2 border-mint whitespace-nowrap'
                : 'px-5 py-3 font-semibold text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap';
            ledgerAccountsTab.className = !isPosting
                ? 'px-5 py-3 font-semibold text-mint border-b-2 border-mint whitespace-nowrap'
                : 'px-5 py-3 font-semibold text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap';
            const canPost = isSunday() && state.inbox.length === 0;
            postingTab.disabled = !canPost;
            postingTab.classList.toggle('opacity-50', !canPost);
            postingTab.classList.toggle('cursor-not-allowed', !canPost);

            if (isPosting) renderPostingView();
            if (!isBooks && !isPosting) renderLedgerAccounts();
        }

        function switchLeftTab(tabName) {
            state.activeLeftTab = tabName;
            const isShop = tabName === 'shop';
            const shopView = document.getElementById('left-view-shop');
            const managementView = document.getElementById('left-view-management');
            const shopTab = document.getElementById('left-tab-shop');
            const managementTab = document.getElementById('left-tab-management');

            shopView.classList.toggle('hidden', !isShop);
            managementView.classList.toggle('hidden', isShop);
            shopTab.setAttribute('aria-selected', String(isShop));
            managementTab.setAttribute('aria-selected', String(!isShop));
            shopTab.className = isShop
                ? 'flex-1 px-4 py-3 text-sm font-semibold border-b-2 border-mint text-mint'
                : 'flex-1 px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-gray-200';
            managementTab.className = !isShop
                ? 'flex-1 px-4 py-3 text-sm font-semibold border-b-2 border-mint text-mint'
                : 'flex-1 px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-gray-200';
        }

        function switchManagementTab(tabName) {
            const tabs = ['overview', 'stock', 'shelves', 'shop'];
            if (!tabs.includes(tabName)) return;
            state.activeManagementTab = tabName;
            tabs.forEach(tab => {
                const active = tab === tabName;
                const button = document.getElementById(`management-tab-${tab}`);
                const panel = document.getElementById(`management-view-${tab}`);
                button.setAttribute('aria-selected', String(active));
                button.tabIndex = active ? 0 : -1;
                button.classList.toggle('is-active', active);
                panel.classList.toggle('hidden', !active);
            });
        }

        function switchLedgerView(viewName) {
            if (viewName === 'posting' && !isSunday()) {
                showToast('Ledger posting is available on Sunday.', 'error');
                return;
            }
            if (viewName === 'posting' && state.inbox.length > 0) {
                showToast('Record every document in the inbox before posting to ledgers.', 'error');
                return;
            }

            state.activeWorkspace = 'ledgers';
            state.activeLedgerView = viewName;
            updateWorkspaceTabs();
        }

        function startDataEntry() {
            if (!state.activeDoc) return;
            if (state.activeDoc.rawType === 'sale_cash' && state.shopOpen) {
                showToast('Cash sale receipts are combined into a daily summary when the shop closes.', 'info');
                return;
            }
            if (state.activeDoc.rawType === 'supplier_payment') {
                state.activeTab = 'cashBook';
                state.selectedColumn = 'credit-bank';
                updateWorkspaceTabs();
            } else if (state.activeDoc.billType === 'rent') {
                const premise = state.premises.find(item => item.id === state.premiseId);
                const premiseName = premise ? premise.name : 'the current premises';
                if (state.activeDoc.paymentMethod === 'credit') {
                    state.activeDoc.rawType = 'rent_credit';
                    state.activeDoc.type = 'Rent Bill (Unpaid)';
                    state.activeDoc.desc = `Monthly rent accrued as unpaid rent for ${premiseName}.`;
                    state.activeTab = 'generalJournal';
                    state.selectedColumn = 'debit';
                } else {
                    state.activeDoc.rawType = 'expense_cheque';
                    state.activeDoc.type = 'Cheque Butt (Original)';
                    state.activeDoc.desc = `Monthly rent paid by cheque for ${premiseName}.`;
                    state.activeTab = 'cashBook';
                    state.selectedColumn = 'credit-bank';
                }
                updateWorkspaceTabs();
            } else {
                state.selectedColumn = null;
            }
            state.recordingDoc = state.activeDoc;
            
            closeDocument();
            
            // Display banner
            const banner = document.getElementById('recording-banner');
            document.getElementById('banner-doc-info').innerText = `${state.recordingDoc.type} #${state.recordingDoc.id} (${formatMoney(state.recordingDoc.amount)})`;
            banner.classList.remove('hidden');

            renderPendingRow();
        }

        function cancelRecording() {
            state.recordingDoc = null;
            state.selectedColumn = null;
            document.getElementById('recording-banner').classList.add('hidden');
            
            // Remove pending rows from all tables
            document.querySelectorAll('.pending-entry-row').forEach(row => row.remove());
        }

        function selectStampColumn(col) {
            state.selectedColumn = col;
            renderPendingRow();
        }

        function renderPendingRow() {
            const existingInput = document.getElementById('pending-particulars-input');
            const isRentEntry = state.recordingDoc?.rawType === 'rent_credit' || state.recordingDoc?.billType === 'rent';
            const savedParticulars = existingInput
                ? existingInput.value
                : isRentEntry ? 'Rent Expense' : state.recordingDoc?.rawType === 'supplier_payment' ? state.recordingDoc.supplierName : '';
            const savedDiscountGiven = document.getElementById('pending-discount-input')?.value || '';
            const savedDiscountReceived = document.getElementById('pending-discount-rec-input')?.value || '';

            // Remove existing pending rows
            document.querySelectorAll('.pending-entry-row').forEach(row => row.remove());

            if (!state.recordingDoc) return;

            const doc = state.recordingDoc;
            const dateStr = `May ${doc.date}`;
            const amountVal = doc.amount.toFixed(2);
            const tab = state.activeTab;
            const tbody = document.getElementById(`tb-${tab}`);
            if (!tbody) return;

            const tr = document.createElement('tr');
            tr.className = 'pending-entry-row bg-amber-950/40 border-2 border-dashed border-amber-500/70 text-xs font-mono animate-slide-up';

            if (tab === 'cashBook') {
                const isDebitCash = state.selectedColumn === 'debit-cash';
                const isDebitBank = state.selectedColumn === 'debit-bank';
                const isCreditCash = state.selectedColumn === 'credit-cash';
                const isCreditBank = state.selectedColumn === 'credit-bank';

                tr.innerHTML = `
                    <td class="p-2 text-amber-300 font-bold">${dateStr}</td>
                    <td class="p-2" colspan="2">
                        <input type="text" id="pending-particulars-input" value="${savedParticulars}" placeholder="Type particulars / account name..." class="w-full bg-gray-950 text-amber-200 border border-amber-500/50 rounded p-1 text-xs focus:outline-none focus:border-amber-400">
                    </td>
                    <td class="p-2 text-right">
                        <input type="number" id="pending-discount-input" placeholder="Disc" class="w-12 bg-gray-950 text-amber-300 border border-gray-700 rounded p-1 text-[10px] text-right focus:outline-none">
                    </td>
                    <td class="p-2 text-right">
                        ${isDebitCash ? `<span class="text-mint font-bold">${amountVal}</span>` : `<button onclick="selectStampColumn('debit-cash')" class="bg-emerald-900/60 hover:bg-emerald-800 text-mint border border-emerald-500/50 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all">+ Cash</button>`}
                    </td>
                    <td class="p-2 text-right border-r border-gray-700">
                        ${isDebitBank ? `<span class="text-mint font-bold">${amountVal}</span>` : `<button onclick="selectStampColumn('debit-bank')" class="bg-emerald-900/60 hover:bg-emerald-800 text-mint border border-emerald-500/50 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all">+ Bank</button>`}
                    </td>
                    <td class="p-2 text-amber-300 font-bold">${dateStr}</td>
                    <td class="p-2" colspan="2">
                        <span class="text-gray-500 text-[10px] italic">(Same Particulars)</span>
                    </td>
                    <td class="p-2 text-right">
                        <input type="number" id="pending-discount-rec-input" placeholder="Disc" class="w-12 bg-gray-950 text-amber-300 border border-gray-700 rounded p-1 text-[10px] text-right focus:outline-none">
                    </td>
                    <td class="p-2 text-right">
                        ${isCreditCash ? `<span class="text-coral font-bold">${amountVal}</span>` : `<button onclick="selectStampColumn('credit-cash')" class="bg-rose-900/60 hover:bg-rose-800 text-coral border border-rose-500/50 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all">+ Cash</button>`}
                    </td>
                    <td class="p-2 text-right">
                        ${isCreditBank ? `<span class="text-coral font-bold">${amountVal}</span>` : `<button onclick="selectStampColumn('credit-bank')" class="bg-rose-900/60 hover:bg-rose-800 text-coral border border-rose-500/50 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all">+ Bank</button>`}
                    </td>
                `;
            } else if (tab === 'generalJournal') {
                const isDebit = state.selectedColumn === 'debit';
                const isCredit = state.selectedColumn === 'credit';

                tr.innerHTML = `
                    <td class="p-3 text-amber-300 font-bold">${dateStr}</td>
                    <td class="p-3">
                        <input type="text" id="pending-particulars-input" value="${savedParticulars}" placeholder="Type Particulars & Explanation..." class="w-full bg-gray-950 text-amber-200 border border-amber-500/50 rounded p-1.5 text-xs focus:outline-none focus:border-amber-400">
                    </td>
                    <td class="p-3 text-center text-gray-500">GJ1</td>
                    <td class="p-3 text-right">
                        ${isDebit ? `<span class="text-mint font-bold">${amountVal}</span>` : `<button onclick="selectStampColumn('debit')" class="bg-emerald-900/60 hover:bg-emerald-800 text-mint border border-emerald-500/50 px-2 py-1 rounded text-xs font-bold">+ Stamp Debit</button>`}
                    </td>
                    <td class="p-3 text-right">
                        ${isCredit ? `<span class="text-coral font-bold">${amountVal}</span>` : `<button onclick="selectStampColumn('credit')" class="bg-rose-900/60 hover:bg-rose-800 text-coral border border-rose-500/50 px-2 py-1 rounded text-xs font-bold">+ Stamp Credit</button>`}
                    </td>
                `;
            } else {
                // Special Journals
                const isStamped = state.selectedColumn === 'amount';

                tr.innerHTML = `
                    <td class="p-3 text-amber-300 font-bold">${dateStr}</td>
                    <td class="p-3">
                        <input type="text" id="pending-particulars-input" value="${savedParticulars}" placeholder="Type Customer/Supplier Name..." class="w-full bg-gray-950 text-amber-200 border border-amber-500/50 rounded p-1.5 text-xs focus:outline-none focus:border-amber-400">
                    </td>
                    <td class="p-3 text-gray-400 font-mono">${doc.id}</td>
                    <td class="p-3 text-center text-gray-500">SL1</td>
                    <td class="p-3 text-right">
                        ${isStamped ? `<span class="text-amber-300 font-bold">${amountVal}</span>` : `<button onclick="selectStampColumn('amount')" class="bg-amber-900/60 hover:bg-amber-800 text-amber-300 border border-amber-500/50 px-2 py-1 rounded text-xs font-bold">+ Stamp RM ${amountVal}</button>`}
                    </td>
                `;
            }

            // Append Action Row
            const actionTr = document.createElement('tr');
            actionTr.className = 'pending-entry-row bg-amber-950/20 border-b-2 border-amber-500/50 text-xs';
            actionTr.innerHTML = `
                <td colspan="12" class="p-2 text-right bg-gray-900/90">
                    <div class="flex justify-end items-center gap-3">
                        <span class="text-[11px] text-amber-300 italic">Verify typed particulars and stamped column above</span>
                        <button onclick="commitPendingEntry()" class="bg-mint hover:bg-emerald-400 text-gray-950 font-bold px-4 py-1.5 rounded shadow transition-all active:scale-95 flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            Confirm & Post Entry
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
            tbody.appendChild(actionTr);

            // Maintain input focus if possible
            const inputEl = document.getElementById('pending-particulars-input');
            if (inputEl) {
                inputEl.value = savedParticulars;
            }
            const discountGivenInput = document.getElementById('pending-discount-input');
            const discountReceivedInput = document.getElementById('pending-discount-rec-input');
            if (discountGivenInput) discountGivenInput.value = savedDiscountGiven;
            if (discountReceivedInput) discountReceivedInput.value = savedDiscountReceived;
        }

        function commitPendingEntry() {
            if (!state.recordingDoc) return;

            const particularInput = document.getElementById('pending-particulars-input');
            const particulars = particularInput ? particularInput.value.trim() : '';

            if (!particulars) {
                showToast('Please type the particulars / account name first!', 'error');
                return;
            }

            if (!state.selectedColumn) {
                showToast('Please click a button to stamp the amount into a column!', 'error');
                return;
            }

            const doc = state.recordingDoc;
            const tab = state.activeTab;
            const isUnpaidRent = doc.rawType === 'rent_credit';
            const isBankRent = doc.billType === 'rent' && doc.rawType === 'expense_cheque';
            const isSupplierPayment = doc.rawType === 'supplier_payment';
            if (isUnpaidRent && (tab !== 'generalJournal' || state.selectedColumn !== 'debit' || particulars.toLowerCase() !== 'rent expense')) {
                showToast('For unpaid rent, debit Rent Expense in the General Journal. Unpaid Rent is credited automatically.', 'error');
                return;
            }
            if (isBankRent && (tab !== 'cashBook' || state.selectedColumn !== 'credit-bank' || particulars.toLowerCase() !== 'rent expense')) {
                showToast('For rent paid by cheque, credit Bank in the Cash Book and use Rent Expense as the particulars.', 'error');
                return;
            }
            if (isSupplierPayment && (tab !== 'cashBook' || state.selectedColumn !== 'credit-bank' || particulars !== doc.supplierName)) {
                showToast('For a supplier payment, credit Bank in the Cash Book and use the supplier name as the particulars.', 'error');
                return;
            }
            const dateStr = `May ${doc.date}`;
            const amountStr = doc.amount.toFixed(2);
            const tbody = document.getElementById(`tb-${tab}`);
            const discGiven = tab === 'cashBook' ? parseFloat(document.getElementById('pending-discount-input')?.value) || 0 : 0;
            const discRec = tab === 'cashBook' ? parseFloat(document.getElementById('pending-discount-rec-input')?.value) || 0 : 0;

            // Remove empty initial placeholder rows if existing
            const emptyMsg = document.getElementById(`empty-${tab.replace('Journal', '').toLowerCase()}`);
            if (emptyMsg) emptyMsg.remove();

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-750 hover:bg-gray-800 transition-colors animate-slide-up font-mono text-xs';

            if (tab === 'cashBook') {
                tr.className = 'border-b border-gray-750 hover:bg-gray-800 transition-colors animate-slide-up font-mono text-[11px]';

                const isDebitCash = state.selectedColumn === 'debit-cash';
                const isDebitBank = state.selectedColumn === 'debit-bank';
                const isCreditCash = state.selectedColumn === 'credit-cash';
                const isCreditBank = state.selectedColumn === 'credit-bank';

                if (isDebitCash || isDebitBank) {
                    tr.innerHTML = `
                        <td class="p-2 text-gray-300">${dateStr}</td>
                        <td class="p-2 text-gray-100 font-semibold">${particulars}</td>
                        <td class="p-2 text-center text-gray-500">GL</td>
                        <td class="p-2 text-right text-amber">${discGiven > 0 ? discGiven.toFixed(2) : '-'}</td>
                        <td class="p-2 text-right ${isDebitCash ? 'text-mint font-bold' : 'text-gray-600'}">${isDebitCash ? amountStr : '-'}</td>
                        <td class="p-2 text-right ${isDebitBank ? 'text-mint font-bold' : 'text-gray-600'} border-r border-gray-700">${isDebitBank ? amountStr : '-'}</td>
                        <td class="p-2 text-gray-500">-</td><td class="p-2 text-gray-500">-</td><td class="p-2 text-center text-gray-500">-</td><td class="p-2 text-right text-gray-600">-</td><td class="p-2 text-right text-gray-600">-</td><td class="p-2 text-right text-gray-600">-</td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td class="p-2 text-gray-500">-</td><td class="p-2 text-gray-500">-</td><td class="p-2 text-center text-gray-500">-</td><td class="p-2 text-right text-gray-600">-</td><td class="p-2 text-right text-gray-600">-</td><td class="p-2 text-right text-gray-600 border-r border-gray-700">-</td>
                        <td class="p-2 text-gray-300">${dateStr}</td>
                        <td class="p-2 text-gray-100 font-semibold">${particulars}</td>
                        <td class="p-2 text-center text-gray-500">GL</td>
                        <td class="p-2 text-right text-amber">${discRec > 0 ? discRec.toFixed(2) : '-'}</td>
                        <td class="p-2 text-right ${isCreditCash ? 'text-coral font-bold' : 'text-gray-600'}">${isCreditCash ? amountStr : '-'}</td>
                        <td class="p-2 text-right ${isCreditBank ? 'text-coral font-bold' : 'text-gray-600'}">${isCreditBank ? amountStr : '-'}</td>
                    `;
                }
            } else if (tab === 'generalJournal') {
                const isDebit = state.selectedColumn === 'debit';
                tr.innerHTML = `
                    <td class="p-3 text-gray-300">${dateStr}</td>
                    <td class="p-3 text-gray-100 font-semibold">${particulars}<br/><span class="text-[10px] text-gray-500 font-normal">(${doc.desc})</span></td>
                    <td class="p-3 text-center text-gray-500">GJ1</td>
                    <td class="p-3 text-right ${isDebit ? 'text-mint font-bold' : 'text-gray-600'}">${isDebit ? amountStr : '-'}</td>
                    <td class="p-3 text-right ${!isDebit ? 'text-coral font-bold' : 'text-gray-600'}">${!isDebit ? amountStr : '-'}</td>
                `;
            } else {
                // Special Journals
                tr.innerHTML = `
                    <td class="p-3 text-gray-300">${dateStr}</td>
                    <td class="p-3 text-gray-100 font-semibold">${particulars}</td>
                    <td class="p-3 text-gray-400 font-mono">${doc.id}</td>
                    <td class="p-3 text-center text-gray-500">SL1</td>
                    <td class="p-3 text-right text-amber font-bold">${amountStr}</td>
                `;
            }

            tbody.appendChild(tr);
            if (isUnpaidRent) {
                const liabilityRow = document.createElement('tr');
                liabilityRow.className = 'border-b border-gray-750 hover:bg-gray-800 transition-colors font-mono text-xs';
                liabilityRow.innerHTML = `
                    <td class="p-3 text-gray-300">${dateStr}</td>
                    <td class="p-3 text-gray-100 font-semibold pl-8">Unpaid Rent</td>
                    <td class="p-3 text-center text-gray-500">GJ1</td>
                    <td class="p-3 text-right text-gray-600">-</td>
                    <td class="p-3 text-right text-coral font-bold">${amountStr}</td>
                `;
                tbody.appendChild(liabilityRow);
            }

            const cashColumn = tab === 'cashBook' ? state.selectedColumn : null;
            const amount = doc.amount;
            let side = state.selectedColumn === 'debit' ? 'debit' : 'credit';
            if (tab === 'cashBook') {
                side = state.selectedColumn.startsWith('debit-') ? 'debit' : 'credit';
            } else if (tab === 'salesJournal' || tab === 'purchasesReturnsJournal') {
                side = 'credit';
            } else if (tab === 'purchasesJournal' || tab === 'salesReturnsJournal') {
                side = 'debit';
            }
            const entry = {
                id: `ENTRY-${state.docCounter++}`,
                day: state.day,
                documentId: doc.id,
                book: tab,
                particulars,
                description: doc.desc,
                amount,
                side,
                cashColumn,
                discountAllowed: discGiven,
                discountReceived: discRec
            };
            state.primeEntries.push(entry);
            if (isUnpaidRent) {
                state.primeEntries.push({
                    id: `ENTRY-${state.docCounter++}`,
                    day: state.day,
                    documentId: doc.id,
                    book: 'generalJournal',
                    particulars: 'Unpaid Rent',
                    amount,
                    side: 'credit',
                    cashColumn: null,
                    discountAllowed: 0,
                    discountReceived: 0
                });
            }

            if (tab === 'cashBook') {
                const cashAccount = cashColumn.endsWith('cash') ? 'Cash' : 'Bank';
                addLedgerPosting(
                    cashAccount,
                    side,
                    amount,
                    doc.id,
                    state.day
                );
            }
            if (isBankRent) {
                state.actualBank -= amount;
            }

            // Remove document from inbox
            state.inbox = state.inbox.filter(d => d.id !== doc.id);
            cancelRecording();

            showToast(`Successfully recorded entry in ${tab}!`, 'success');
            updateUI();
            if (isSunday() && state.inbox.length === 0) {
                const postingTab = document.getElementById('tab-posting');
                if (postingTab) postingTab.disabled = false;
            }
        }

        const specialJournalPostings = {
            salesJournal: { account: 'Sales', totalSide: 'credit', personalSide: 'debit', personalType: 'Customer' },
            purchasesJournal: { account: 'Purchases', totalSide: 'debit', personalSide: 'credit', personalType: 'Supplier' },
            salesReturnsJournal: { account: 'Sales Returns', totalSide: 'debit', personalSide: 'credit', personalType: 'Customer' },
            purchasesReturnsJournal: { account: 'Purchases Returns', totalSide: 'credit', personalSide: 'debit', personalType: 'Supplier' }
        };

        function getPostingTasks() {
            const postingWeek = Math.floor((state.day - 2) / 7);
            const entries = state.primeEntries.filter(entry => Math.floor((entry.day - 1) / 7) === postingWeek);
            const tasks = [];
            const specialEntries = new Set();

            Object.entries(specialJournalPostings).forEach(([book, posting]) => {
                const journalEntries = entries.filter(entry => entry.book === book);
                if (journalEntries.length === 0) return;

                const total = journalEntries.reduce((sum, entry) => sum + entry.amount, 0);
                const totalTaskId = `total:${postingWeek}:${book}`;
                if (!state.postedTaskIds.includes(totalTaskId)) {
                    tasks.push({
                        id: totalTaskId,
                        label: `Post ${book.replace(/Journal$/, '').replace(/([A-Z])/g, ' $1').trim()} total to ${posting.account}`,
                        detail: `${journalEntries.length} entries · ${formatMoney(total)}`,
                        postings: [{ account: posting.account, side: posting.totalSide, amount: total, reference: `${book} total` }]
                    });
                }

                journalEntries.forEach(entry => {
                    specialEntries.add(entry.id);
                    const taskId = `personal:${entry.id}`;
                    if (state.postedTaskIds.includes(taskId)) return;
                    tasks.push({
                        id: taskId,
                        label: `Post ${posting.personalType.toLowerCase()} account: ${entry.particulars}`,
                        detail: `${entry.documentId} · ${formatMoney(entry.amount)}`,
                        postings: [{ account: entry.particulars, side: posting.personalSide, amount: entry.amount, reference: entry.documentId }]
                    });
                });
            });

            entries.filter(entry => !specialEntries.has(entry.id)).forEach(entry => {
                const taskId = `entry:${entry.id}`;
                if (state.postedTaskIds.includes(taskId)) return;
                if (entry.book === 'cashBook') {
                    const accountSide = entry.side === 'debit' ? 'credit' : 'debit';
                    tasks.push({
                        id: taskId,
                        label: `Post ${entry.particulars} to its ledger`,
                        detail: `${entry.documentId} · ${formatMoney(entry.amount)} ${entry.side === 'debit' ? 'received' : 'paid'}`,
                        postings: [{ account: entry.particulars, side: accountSide, amount: entry.amount, reference: entry.documentId }]
                    });
                } else {
                    tasks.push({
                        id: taskId,
                        label: `Post ${entry.particulars} from the General Journal`,
                        detail: `${entry.documentId} · ${formatMoney(entry.amount)}`,
                        postings: [{ account: entry.particulars, side: entry.side, amount: entry.amount, reference: entry.documentId }]
                    });
                }
            });

            const discountAllowed = entries.reduce((sum, entry) => sum + entry.discountAllowed, 0);
            const discountReceived = entries.reduce((sum, entry) => sum + entry.discountReceived, 0);
            [
                { key: 'discount-allowed', account: 'Discount Allowed', side: 'debit', amount: discountAllowed },
                { key: 'discount-received', account: 'Discount Received', side: 'credit', amount: discountReceived }
            ].filter(discount => discount.amount > 0).forEach(discount => {
                const taskId = `total:${postingWeek}:${discount.key}`;
                if (!state.postedTaskIds.includes(taskId)) {
                    tasks.push({
                        id: taskId,
                        label: `Post ${discount.account} total`,
                        detail: formatMoney(discount.amount),
                        postings: [{ account: discount.account, side: discount.side, amount: discount.amount, reference: 'Cash Book total' }]
                    });
                }
            });

            return tasks;
        }

        function addLedgerPosting(account, side, amount, reference, date) {
            state.ledgerPostings.push({ account, side, amount, reference, date });
        }

        function postLedgerTask(taskId) {
            if (!isSunday() || state.inbox.length > 0) {
                showToast('Clear the document inbox before posting during Sunday catch-up.', 'error');
                return;
            }

            const task = getPostingTasks().find(item => item.id === taskId);
            if (!task) return;

            task.postings.forEach(posting => {
                addLedgerPosting(posting.account, posting.side, posting.amount, posting.reference, state.day);
            });
            state.postedTaskIds.push(task.id);
            renderPostingView();
            updateUI();
        }

        function renderPostingView() {
            const queue = document.getElementById('posting-queue');
            const ledger = document.getElementById('ledger-summary');
            const status = document.getElementById('posting-status');
            if (!queue || !ledger || !status) return;

            if (state.inbox.length > 0) {
                status.innerText = `Record all ${state.inbox.length} document${state.inbox.length === 1 ? '' : 's'} in the inbox before posting.`;
            } else {
                status.innerText = 'Post journal totals to the general ledger and individual amounts to customer and supplier ledgers.';
            }

            queue.replaceChildren();
            const tasks = state.inbox.length === 0 ? getPostingTasks() : [];
            if (tasks.length === 0 && state.inbox.length === 0) {
                const complete = document.createElement('p');
                complete.className = 'text-sm text-mint';
                complete.innerText = 'All entries for this week have been posted. You can start Monday.';
                queue.appendChild(complete);
            }
            tasks.forEach(task => {
                const card = document.createElement('div');
                card.className = 'posting-task';
                const copy = document.createElement('div');
                const label = document.createElement('strong');
                label.innerText = task.label;
                const detail = document.createElement('span');
                detail.innerText = task.detail;
                copy.append(label, detail);
                const button = document.createElement('button');
                button.className = 'bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded text-xs font-semibold flex-shrink-0';
                button.innerText = 'Post to ledger';
                button.onclick = () => postLedgerTask(task.id);
                card.append(copy, button);
                queue.appendChild(card);
            });

            const accounts = new Map();
            state.ledgerPostings.forEach(posting => {
                if (!accounts.has(posting.account)) accounts.set(posting.account, { debit: 0, credit: 0, entries: [] });
                const account = accounts.get(posting.account);
                account[posting.side] += posting.amount;
                account.entries.push(posting);
            });

            ledger.replaceChildren();
            if (accounts.size === 0) {
                ledger.innerHTML = '<p class="text-xs text-gray-500 italic">Ledger postings will appear here.</p>';
                return;
            }

            const table = document.createElement('table');
            table.className = 'w-full text-left border-collapse text-xs';
            table.innerHTML = '<thead><tr class="border-b border-gray-700 text-gray-400"><th class="p-2">Ledger account</th><th class="p-2 text-right">Debit</th><th class="p-2 text-right">Credit</th><th class="p-2 text-right">Balance</th></tr></thead>';
            const body = document.createElement('tbody');
            accounts.forEach((account, name) => {
                const difference = account.debit - account.credit;
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `<td class="p-2 text-gray-200"></td><td class="p-2 text-right font-mono text-mint">${account.debit ? account.debit.toFixed(2) : '-'}</td><td class="p-2 text-right font-mono text-coral">${account.credit ? account.credit.toFixed(2) : '-'}</td><td class="p-2 text-right font-mono">${Math.abs(difference).toFixed(2)} ${difference >= 0 ? 'Dr' : 'Cr'}</td>`;
                row.cells[0].innerText = name;
                body.appendChild(row);
            });
            table.appendChild(body);
            ledger.appendChild(table);
        }

        function renderInventoryOverview() {
            const overview = document.getElementById('management-inventory-overview');
            const summary = document.getElementById('management-inventory-summary');
            if (!overview || !summary) return;

            overview.replaceChildren();
            const displayedTotal = state.shelves.reduce((total, shelf) => total + shelf.qty, 0);
            const storageTotal = getStorageUsed();
            const displayCapacity = state.shelves.length * state.shelfCapacity;
            summary.innerHTML = `
                <div class="management-location-card management-location-floor">
                    <div><span>SHOP FLOOR</span><strong>${displayedTotal}<small> / ${displayCapacity} spaces</small></strong></div>
                    <div class="management-location-track"><span style="width:${displayCapacity ? Math.min(displayedTotal / displayCapacity * 100, 100) : 0}%"></span></div>
                    <small>${state.shelves.length} shelves</small>
                </div>
                <div class="management-location-card management-location-backroom">
                    <div><span>BACKROOM</span><strong>${storageTotal}<small> / ${state.storageCapacity} units</small></strong></div>
                    <div class="management-location-track"><span style="width:${state.storageCapacity ? Math.min(storageTotal / state.storageCapacity * 100, 100) : 0}%"></span></div>
                    ${getPendingInventoryQuantity() ? `<small>${getPendingInventoryQuantity()} units arriving</small>` : ''}
                </div>
            `;
            Object.values(state.inventory).forEach(item => {
                const displayed = getDisplayedQuantity(item.id);
                const total = displayed + item.qty;
                const shelfShare = total ? displayed / total * 100 : 0;
                const incomingDeliveries = state.pendingInventoryDeliveries.filter(delivery => delivery.itemId === item.id);
                const card = document.createElement('article');
                card.className = 'management-product-card';
                card.innerHTML = `
                    <div class="management-product-name">
                        <strong>${escapeDocumentText(item.name.split('(')[0].trim())}</strong>
                        <span>${item.qty <= 5 ? 'Low stock' : ''}</span>
                    </div>
                    <div class="management-product-locations">
                        <div><small>On shelves</small><strong>${displayed}</strong></div>
                        <div><small>In storage</small><strong>${item.qty}</strong></div>
                    </div>
                    ${incomingDeliveries.length ? `<small>${incomingDeliveries.map(delivery => `${delivery.quantity} arriving Day ${delivery.arrivalDay}`).join(' · ')}</small>` : ''}
                    <div class="management-product-balance" role="img" aria-label="${displayed} on shelves, ${item.qty} in backroom">
                        <span style="width:${shelfShare}%"></span><span style="width:${100 - shelfShare}%"></span>
                    </div>
                    <label class="management-price-label" for="retail-price-${item.id}">Retail price
                        <span>RM <input id="retail-price-${item.id}" type="number" min="0.10" step="0.10" value="${item.retailPrice.toFixed(2)}" aria-label="Retail price for ${escapeDocumentText(item.name.split('(')[0].trim())}"
                                onchange="setRetailPrice('${item.id}', this.value)"
                                class="management-price-input">
                        </span>
                    </label>
                `;
                overview.appendChild(card);
            });
        }

        function getDisplayedQuantity(itemId) {
            return state.shelves
                .filter(shelf => shelf.itemId === itemId)
                .reduce((total, shelf) => total + shelf.qty, 0);
        }

        function getStorageUsed() {
            return Object.values(state.inventory).reduce((total, item) => total + item.qty, 0);
        }

        function getPendingInventoryQuantity(itemId = null) {
            return state.pendingInventoryDeliveries
                .filter(delivery => itemId === null || delivery.itemId === itemId)
                .reduce((total, delivery) => total + delivery.quantity, 0);
        }

        function deliverInventoryOrders() {
            const dueDeliveries = state.pendingInventoryDeliveries.filter(delivery => delivery.arrivalDay <= state.day);
            state.pendingInventoryDeliveries = state.pendingInventoryDeliveries.filter(delivery => delivery.arrivalDay > state.day);
            dueDeliveries.forEach(delivery => {
                state.inventory[delivery.itemId].qty += delivery.quantity;
                logEvent(`Delivery received: ${delivery.quantity} × ${state.inventory[delivery.itemId].name.split('(')[0].trim()} from ${delivery.supplierName}.`, true);
            });
        }

        function getShopAppeal() {
            const premise = state.premises.find(item => item.id === state.premiseId);
            const decorationAppeal = state.ownedDecorations.reduce((total, id) => {
                const decoration = state.decorations.find(item => item.id === id);
                return total + (decoration ? decoration.appeal : 0);
            }, 0);
            return Math.min(0.8, (premise ? premise.appeal : 0) + decorationAppeal);
        }

        function renderSupplierInvoices() {
            const list = document.getElementById('supplier-bills-list');
            if (!list) return;
            const unpaidInvoices = state.supplierInvoices.filter(invoice => !invoice.paid);
            if (!unpaidInvoices.length) {
                list.innerHTML = '<p class="supplier-bills-empty">No supplier invoices are outstanding.</p>';
                return;
            }
            list.replaceChildren();
            unpaidInvoices.forEach(invoice => {
                const row = document.createElement('article');
                row.className = 'supplier-bill-card';
                row.innerHTML = `
                    <div>
                        <strong>${escapeDocumentText(invoice.supplierName)}</strong>
                        <span>${invoice.quantity} × ${escapeDocumentText(invoice.itemName)} · Invoice ${escapeDocumentText(invoice.id)}</span>
                        <small>Due Day ${invoice.dueDay} · ${escapeDocumentText(invoice.terms)}</small>
                    </div>
                    <div class="supplier-bill-action">
                        <strong>${formatMoney(invoice.amount)}</strong>
                        <button type="button" onclick="paySupplierInvoice('${escapeDocumentText(invoice.id)}')" ${state.actualBank < invoice.amount ? 'disabled' : ''}>Pay by bank</button>
                    </div>
                `;
                list.appendChild(row);
            });
        }

        function renderManagement() {
            renderInventoryOverview();
            renderSupplierInvoices();
            const summary = document.getElementById('management-shop-summary');
            const shelves = document.getElementById('management-shelves');
            const shelfWorkbench = document.getElementById('management-shelf-workbench');
            const upgrades = document.getElementById('management-upgrades');
            const energy = document.getElementById('ui-energy');
            const phaseNote = document.getElementById('restock-phase-note');
            const primaryAction = document.getElementById('management-primary-action');
            if (!summary || !shelves || !shelfWorkbench || !upgrades || !energy || !phaseNote || !primaryAction) return;

            const premise = state.premises.find(item => item.id === state.premiseId);
            const traffic = premise ? premise.traffic : 1;
            const appeal = Math.round(getShopAppeal() * 100);
            const managementHeading = isSunday()
                ? { button: 'Post to ledgers', action: "switchTab('posting')" }
                : state.shopOpen
                    ? { button: 'Stockroom', action: 'openInventoryModal()' }
                    : { button: 'Restock shelves', action: "switchManagementTab('shelves')" };
            primaryAction.innerHTML = `
                <button type="button" onclick="${managementHeading.action}" class="management-hero-button">${managementHeading.button}<span aria-hidden="true"> →</span></button>
            `;
            summary.innerHTML = `
                <div class="management-stat"><span>${escapeDocumentText(premise.name)}</span><strong>RM ${premise.rent.toLocaleString()}</strong><small>Monthly rent</small></div>
                <div class="management-stat"><span>Foot traffic</span><strong>${traffic.toFixed(2)}<i>×</i></strong></div>
                <div class="management-stat"><span>Appeal</span><strong>${appeal}<i>%</i></strong><div class="management-meter"><span style="width:${Math.min(appeal, 100)}%"></span></div></div>
                <div class="management-stat"><span>Backroom</span><strong>${getStorageUsed()}<i> / ${state.storageCapacity}</i></strong><div class="management-meter"><span style="width:${Math.min(getStorageUsed() / state.storageCapacity * 100, 100)}%"></span></div></div>
            `;

            energy.textContent = `Energy ${state.restockEnergy} / ${state.maxRestockEnergy}`;
            const canRestock = !state.shopOpen && !isSunday();
            const canRestockAnyShelf = state.shelves.some(shelf =>
                shelf.qty < state.shelfCapacity && state.inventory[shelf.itemId].qty > 0
            );
            const restockAllButton = document.getElementById('restock-all-shelves');
            if (restockAllButton) {
                restockAllButton.disabled = !canRestock || state.restockEnergy < state.restockEnergyCost || !canRestockAnyShelf;
            }
            phaseNote.textContent = isSunday()
                ? 'Closed · Bookkeeping'
                : state.shopOpen
                    ? 'Restock after closing'
                    : '';
            if (!state.shelves.some(shelf => shelf.id === selectedShelfId)) {
                selectedShelfId = state.shelves.length ? state.shelves[0].id : null;
            }
            shelves.replaceChildren();
            state.shelves.forEach((shelf, index) => {
                const item = state.inventory[shelf.itemId];
                const isSelected = shelf.id === selectedShelfId;
                const fill = Math.min(shelf.qty / state.shelfCapacity * 100, 100);
                const productName = item.name.split('(')[0].trim();
                const status = shelf.qty === 0 ? 'Empty' : shelf.qty <= Math.ceil(state.shelfCapacity / 3) ? 'Running low' : shelf.qty === state.shelfCapacity ? 'Full' : 'On display';
                const tile = document.createElement('article');
                tile.className = `shelf-map-card${isSelected ? ' is-selected' : ''}`;
                tile.innerHTML = `
                    <button type="button" class="shelf-map-select" aria-pressed="${isSelected}" aria-label="Select Shelf ${String(index + 1).padStart(2, '0')}, ${productName}, ${shelf.qty} of ${state.shelfCapacity} units, ${status}">
                    <div class="shelf-map-heading"><span>SHELF ${String(index + 1).padStart(2, '0')}</span><span class="shelf-map-status${shelf.qty === 0 ? ' is-empty' : ''}">${status}</span></div>
                    <div class="shelf-map-display" aria-hidden="true">
                        <div class="shelf-map-products">${Array.from({ length: 5 }, (_, block) => `<i class="${block < Math.ceil(shelf.qty / state.shelfCapacity * 5) ? 'is-filled' : ''}"></i>`).join('')}</div>
                        <span class="shelf-map-rail"></span>
                    </div>
                    <div class="shelf-map-product"><strong>${escapeDocumentText(productName)}</strong><span>${shelf.qty}<small> / ${state.shelfCapacity}</small></span></div>
                    <div class="management-shelf-meter"><span style="width:${fill}%"></span></div>
                    </button>
                    <button type="button" class="management-restock-button shelf-map-restock" onclick="restockShelf(${index}, true)" ${!canRestock || state.restockEnergy < state.restockEnergyCost || shelf.qty >= state.shelfCapacity || item.qty <= 0 ? 'disabled' : ''}>Restock shelf</button>
                `;
                tile.querySelector('.shelf-map-select').onclick = () => selectShelf(shelf.id);
                shelves.appendChild(tile);
            });
            const selectedIndex = state.shelves.findIndex(shelf => shelf.id === selectedShelfId);
            const selectedShelf = state.shelves[selectedIndex];
            if (selectedShelf) {
                const item = state.inventory[selectedShelf.itemId];
                const selectId = `shelf-item-${selectedShelf.id}`;
                const qtyId = `shelf-qty-${selectedShelf.id}`;
                const remainingCapacity = state.shelfCapacity - selectedShelf.qty;
                const available = Math.min(remainingCapacity, item.qty);
                const options = Object.values(state.inventory).map(stockItem =>
                    `<option value="${stockItem.id}" ${selectedShelf.itemId === stockItem.id ? 'selected' : ''}>${escapeDocumentText(stockItem.name.split('(')[0].trim())}</option>`
                ).join('');
                shelfWorkbench.innerHTML = `
                    <div class="shelf-workbench-heading">
                        <div><h4>Shelf ${String(selectedIndex + 1).padStart(2, '0')}</h4></div>
                        <span class="shelf-workbench-stock">${selectedShelf.qty} <small>/ ${state.shelfCapacity} units</small></span>
                    </div>
                    <div class="shelf-workbench-meter"><span style="width:${Math.min(selectedShelf.qty / state.shelfCapacity * 100, 100)}%"></span></div>
                    <div class="shelf-workbench-fields">
                        <label class="shelf-workbench-product" for="${selectId}"><span>Display product</span>
                            <select id="${selectId}" onchange="promptShelfProductChange(${selectedIndex}, this.value)" class="management-field" ${!canRestock ? 'disabled' : ''}>${options}</select>
                        </label>
                        <div class="shelf-workbench-restock">
                            <label for="${qtyId}"><span>Move from backroom</span><small>${item.qty} available · ${state.restockEnergyCost} energy</small></label>
                            <div class="shelf-workbench-action">
                                <input id="${qtyId}" type="number" min="1" max="${remainingCapacity}" value="${Math.max(1, available)}" aria-label="Units to add to Shelf ${selectedIndex + 1}" class="management-field management-quantity" ${!canRestock ? 'disabled' : ''}>
                                <button type="button" onclick="restockShelf(${selectedIndex})" class="management-restock-button shelf-workbench-button" ${!canRestock || state.restockEnergy < state.restockEnergyCost || available <= 0 ? 'disabled' : ''}>Restock shelf</button>
                            </div>
                        </div>
                    </div>
                    ${available <= 0 && selectedShelf.qty < state.shelfCapacity ? '<p class="shelf-workbench-hint">No stock available. Order more.</p>' : ''}
                `;
            } else {
                shelfWorkbench.innerHTML = '<p class="shelf-workbench-hint">Buy a storefront shelf to start arranging your displays.</p>';
            }

            const canBuy = !isSunday();
            const premiseCards = state.premises.map(option => {
                const isCurrent = option.id === state.premiseId;
                const unlocked = !option.unlockRevenue || state.totalRevenue >= option.unlockRevenue;
                const affordable = state.actualBank >= option.cost;
                const label = option.cost === 0 ? `RM ${option.rent}/month` : `RM ${option.cost.toLocaleString()} · RM ${option.rent}/month`;
                const action = isCurrent ? 'Current' : !unlocked ? `Unlock · RM ${option.unlockRevenue.toLocaleString()}` : 'Move';
                return `<div class="management-upgrade-card">
                    <div><strong>${escapeDocumentText(option.name)}</strong><span>${option.traffic.toFixed(2)}× traffic · ${label}</span></div>
                    <button onclick="buyPremise('${option.id}')" ${isCurrent || !unlocked || !affordable || !canBuy ? 'disabled' : ''} class="management-upgrade-button">${action}</button>
                </div>`;
            }).join('');
            const decorationCards = state.decorations.map(option => {
                const owned = state.ownedDecorations.includes(option.id);
                const unlocked = !option.unlockRevenue || state.totalRevenue >= option.unlockRevenue;
                const affordable = state.actualBank >= option.cost;
                return `<div class="management-upgrade-card">
                    <div><strong>${escapeDocumentText(option.name)}</strong><span>+${Math.round(option.appeal * 100)}% appeal</span></div>
                    <button onclick="buyDecoration('${option.id}')" ${owned || !unlocked || !affordable || !canBuy ? 'disabled' : ''} class="management-upgrade-button">${owned ? 'Owned' : unlocked ? `Buy RM ${option.cost}` : `Unlock RM ${option.unlockRevenue} sales`}</button>
                </div>`;
            }).join('');
            const storageUpgrade = `<div class="management-upgrade-card">
                <div><strong>Backroom extension</strong><span>+80 storage</span></div>
                <button onclick="buyStorageUpgrade()" ${!canBuy || state.actualBank < 500 ? 'disabled' : ''} class="management-upgrade-button">RM 500</button>
            </div>`;
            const shelfUpgrade = `<div class="management-upgrade-card">
                <div><strong>Storefront shelf</strong><span>+1 display · ${state.shelfCapacity} units</span></div>
                <button onclick="buyShelfUpgrade()" ${!canBuy || state.actualBank < 600 ? 'disabled' : ''} class="management-upgrade-button">RM 600</button>
            </div>`;
            upgrades.innerHTML = `
                <details class="management-disclosure" open><summary>Premises</summary><div>${premiseCards}</div></details>
                <details class="management-disclosure"><summary>Decor</summary><div>${decorationCards}</div></details>
                <details class="management-disclosure"><summary>Capacity</summary><div>${storageUpgrade}${shelfUpgrade}</div></details>
            `;
            switchManagementTab(state.activeManagementTab);
        }

        function setRetailPrice(itemId, value) {
            const item = state.inventory[itemId];
            const price = Number(value);
            if (!item || !Number.isFinite(price) || price <= 0) {
                showToast('Retail price must be greater than RM 0.00.', 'error');
                const input = document.getElementById(`retail-price-${itemId}`);
                if (item && input) input.value = item.retailPrice.toFixed(2);
                return;
            }
            item.retailPrice = Math.round(price * 100) / 100;
            showToast(`${item.name.split('(')[0].trim()} price set to ${formatMoney(item.retailPrice)}.`, 'success');
        }

        function setShelfItem(index, itemId) {
            const shelf = state.shelves[index];
            if (!shelf || !state.inventory[itemId] || state.shopOpen || isSunday()) return false;
            if (shelf.qty > 0) {
                const item = state.inventory[shelf.itemId];
                if (getStorageUsed() + shelf.qty > state.storageCapacity) {
                    showToast('Not enough backroom capacity to change this shelf. Restock less or expand storage first.', 'error');
                    renderManagement();
                    return false;
                }
                item.qty += shelf.qty;
            }
            shelf.itemId = itemId;
            shelf.qty = 0;
            renderManagement();
            return true;
        }

        function promptShelfProductChange(index, itemId) {
            const shelf = state.shelves[index];
            if (!shelf || shelf.itemId === itemId) return;
            const productName = state.inventory[itemId].name.split('(')[0].trim();
            const shouldFill = window.confirm(
                `Change Shelf ${index + 1} to ${productName} and fill it with available backroom stock? This costs ${state.restockEnergyCost} energy. Choose Cancel to change the product but leave the shelf empty.`
            );
            if (setShelfItem(index, itemId) && shouldFill) {
                restockShelf(index, true);
            }
        }

        function selectShelf(shelfId) {
            if (!state.shelves.some(shelf => shelf.id === shelfId)) return;
            selectedShelfId = shelfId;
            renderManagement();
        }

        function transferStockToShelf(index, requested) {
            const shelf = state.shelves[index];
            if (!shelf) return 0;
            const item = state.inventory[shelf.itemId];
            const availableCapacity = state.shelfCapacity - shelf.qty;
            const quantity = Math.min(requested, item.qty, availableCapacity);
            if (!Number.isInteger(quantity) || quantity <= 0) return 0;

            item.qty -= quantity;
            shelf.qty += quantity;
            state.restockEnergy -= state.restockEnergyCost;
            logEvent(`Restocked Shelf ${index + 1} with ${quantity} ${item.name.split('(')[0].trim()}.`, true);
            return quantity;
        }

        function restockShelf(index, fillAvailable = false) {
            const shelf = state.shelves[index];
            if (!shelf || state.shopOpen || isSunday()) {
                showToast('Shelves can only be restocked after the shop closes, before Sunday bookkeeping.', 'error');
                return;
            }
            if (state.restockEnergy < state.restockEnergyCost) {
                showToast('Not enough energy for another shelf-restock action. Energy refills tomorrow morning.', 'error');
                return;
            }
            const quantityInput = document.getElementById(`shelf-qty-${shelf.id}`);
            const item = state.inventory[shelf.itemId];
            const availableCapacity = state.shelfCapacity - shelf.qty;
            const requested = fillAvailable || !quantityInput
                ? availableCapacity
                : Number.parseInt(quantityInput.value, 10);
            if (!Number.isInteger(requested) || requested <= 0 || availableCapacity <= 0) {
                showToast('Enter a positive quantity and leave room on the shelf.', 'error');
                return;
            }
            if (item.qty <= 0) {
                showToast(`No ${item.name.split('(')[0].trim()} available in the backroom. Order more stock first.`, 'error');
                return;
            }
            const quantity = transferStockToShelf(index, requested);
            renderManagement();
            updateUI();
            showToast(`Shelf ${index + 1} restocked with ${quantity} units.`, 'success');
        }

        function restockAllShelves() {
            if (state.shopOpen || isSunday()) {
                showToast('Shelves can only be restocked after the shop closes, before Sunday bookkeeping.', 'error');
                return;
            }
            let restockedShelves = 0;
            let restockedUnits = 0;
            for (let index = 0; index < state.shelves.length; index += 1) {
                if (state.restockEnergy < state.restockEnergyCost) break;
                const shelf = state.shelves[index];
                const quantity = transferStockToShelf(index, state.shelfCapacity - shelf.qty);
                if (quantity > 0) {
                    restockedShelves += 1;
                    restockedUnits += quantity;
                }
            }
            renderManagement();
            updateUI();
            if (restockedShelves > 0) {
                showToast(`Restocked ${restockedShelves} ${restockedShelves === 1 ? 'shelf' : 'shelves'} with ${restockedUnits} units. ${state.restockEnergy} energy left.`, 'success');
            } else if (state.restockEnergy < state.restockEnergyCost) {
                showToast('Not enough energy for another shelf-restock action. Energy refills tomorrow morning.', 'error');
            } else {
                showToast('No shelves need restocking, or there is no matching stock in the backroom.', 'info');
            }
        }

        function recordShopPurchase(name, cost, description) {
            if (state.actualBank < cost) {
                showToast('Not enough bank funds for this business purchase.', 'error');
                return false;
            }
            state.actualBank -= cost;
            state.inbox.push({
                id: `UPG-${state.docCounter++}`,
                date: state.day,
                type: 'Cash Bill (Original)',
                amount: cost,
                desc: description,
                rawType: 'purchase_cash',
                supplierName: 'Shop Improvements',
                itemName: name,
                unitPrice: cost,
                quantity: 1
            });
            logEvent(`${name} purchased for ${formatMoney(cost)}. A cash bill was added to the inbox.`);
            return true;
        }

        function consumeShopPurchaseTime() {
            if (!state.shopOpen) return;
            state.minute += 30;
            if (state.minute >= 60) {
                state.hour += 1;
                state.minute -= 60;
            }
            if (state.hour >= 17) {
                state.hour = 17;
                state.minute = 0;
            }
            state.eventsToday++;
            if (!presentDailyCustomerDecision()) processCustomerVisit();
            if (!state.pendingCustomerDecision) closeShopIfNeeded();
        }

        function finishShopPurchase() {
            updateUI();
            consumeShopPurchaseTime();
            updateUI();
        }

        function buyPremise(premiseId) {
            const option = state.premises.find(item => item.id === premiseId);
            if (!option || option.id === state.premiseId || (option.unlockRevenue && state.totalRevenue < option.unlockRevenue) || isSunday()) return;
            const previous = state.premises.find(item => item.id === state.premiseId);
            if (!recordShopPurchase(option.name, option.cost, `Moved from ${previous.name} to ${option.name}. New monthly rent is RM ${option.rent}.`)) return;
            state.premiseId = option.id;
            showToast(`Now operating from ${option.name}. New rent applies on the next monthly due date.`, 'success');
            finishShopPurchase();
        }

        function buyDecoration(decorationId) {
            const option = state.decorations.find(item => item.id === decorationId);
            if (!option || state.ownedDecorations.includes(option.id) || (option.unlockRevenue && state.totalRevenue < option.unlockRevenue) || isSunday()) return;
            if (!recordShopPurchase(option.name, option.cost, `Shop decoration installed. Appeal increased by ${Math.round(option.appeal * 100)}%.`)) return;
            state.ownedDecorations.push(option.id);
            showToast(`${option.name} installed. Browsing customers are more likely to buy.`, 'success');
            finishShopPurchase();
        }

        function buyStorageUpgrade() {
            if (isSunday() || !recordShopPurchase('Backroom extension', 500, 'Backroom storage capacity expanded by 80 units.')) return;
            state.storageCapacity += 80;
            finishShopPurchase();
        }

        function buyShelfUpgrade() {
            if (isSunday() || !recordShopPurchase('Storefront shelf', 600, `Added a storefront shelf with ${state.shelfCapacity} units of display capacity.`)) return;
            const newShelf = { id: Math.max(0, ...state.shelves.map(shelf => shelf.id)) + 1, itemId: Object.keys(state.inventory)[0], qty: 0 };
            state.shelves.push(newShelf);
            selectedShelfId = newShelf.id;
            finishShopPurchase();
        }

        function renderLedgerAccounts() {
            const tabs = document.getElementById('ledger-account-tabs');
            const sheet = document.getElementById('ledger-account-sheet');
            if (!tabs || !sheet) return;

            const accounts = new Map();
            state.ledgerPostings.forEach(posting => {
                if (!accounts.has(posting.account)) accounts.set(posting.account, []);
                accounts.get(posting.account).push(posting);
            });

            const accountNames = Array.from(accounts.keys());
            if (state.selectedLedgerAccount !== 'all' && !accounts.has(state.selectedLedgerAccount)) {
                state.selectedLedgerAccount = 'all';
            }

            tabs.replaceChildren();
            const tabNames = ['all', ...accountNames];
            tabNames.forEach(accountName => {
                const button = document.createElement('button');
                const active = accountName === state.selectedLedgerAccount;
                button.type = 'button';
                button.role = 'tab';
                button.setAttribute('aria-selected', String(active));
                button.className = active
                    ? 'rounded border border-mint bg-emerald-950/50 px-3 py-2 text-xs font-semibold text-mint'
                    : 'rounded border border-gray-700 bg-gray-850 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-gray-500';
                button.textContent = accountName === 'all' ? 'All Ledgers' : accountName;
                button.onclick = () => {
                    state.selectedLedgerAccount = accountName;
                    renderLedgerAccounts();
                };
                tabs.appendChild(button);
            });

            sheet.replaceChildren();
            const visibleAccounts = state.selectedLedgerAccount === 'all'
                ? accountNames
                : [state.selectedLedgerAccount];
            visibleAccounts.forEach(accountName => {
                const postings = accounts.get(accountName);
                const section = document.createElement('section');
                section.className = 'overflow-x-auto rounded-lg border border-gray-700 bg-gray-850';
                const heading = document.createElement('h3');
                heading.className = 'border-b border-gray-700 px-4 py-3 text-sm font-bold text-gray-100';
                heading.textContent = `${accountName} Ledger`;
                section.appendChild(heading);

                const table = document.createElement('table');
                table.className = 'w-full min-w-[640px] border-collapse text-left text-xs';
                const thead = document.createElement('thead');
                thead.className = 'bg-gray-800 text-gray-400';
                thead.innerHTML = '<tr><th class="p-3">Date</th><th class="p-3">Particulars</th><th class="p-3">Folio</th><th class="p-3 text-right">Debit (RM)</th><th class="p-3 text-right">Credit (RM)</th><th class="p-3 text-right">Balance</th></tr>';
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                tbody.className = 'font-mono';
                let debitTotal = 0;
                let creditTotal = 0;
                let runningBalance = 0;
                postings.forEach((posting, index) => {
                    const row = document.createElement('tr');
                    row.className = 'border-t border-gray-700 text-gray-300';
                    if (posting.side === 'debit') {
                        debitTotal += posting.amount;
                        runningBalance += posting.amount;
                    } else {
                        creditTotal += posting.amount;
                        runningBalance -= posting.amount;
                    }

                    const values = [
                        `May ${posting.date}`,
                        posting.reference,
                        String(index + 1),
                        posting.side === 'debit' ? posting.amount.toFixed(2) : '-',
                        posting.side === 'credit' ? posting.amount.toFixed(2) : '-',
                        `${Math.abs(runningBalance).toFixed(2)} ${runningBalance >= 0 ? 'Dr' : 'Cr'}`
                    ];
                    values.forEach((value, valueIndex) => {
                        const cell = document.createElement('td');
                        cell.className = valueIndex >= 3 ? 'p-3 text-right' : 'p-3';
                        cell.textContent = value;
                        row.appendChild(cell);
                    });
                    tbody.appendChild(row);
                });

                const totalRow = document.createElement('tr');
                totalRow.className = 'border-t-2 border-gray-600 bg-gray-800 font-bold text-gray-100';
                const totalLabel = document.createElement('td');
                totalLabel.colSpan = 3;
                totalLabel.className = 'p-3';
                totalLabel.textContent = 'Totals';
                const debitCell = document.createElement('td');
                debitCell.className = 'p-3 text-right';
                debitCell.textContent = debitTotal.toFixed(2);
                const creditCell = document.createElement('td');
                creditCell.className = 'p-3 text-right';
                creditCell.textContent = creditTotal.toFixed(2);
                const balanceCell = document.createElement('td');
                balanceCell.className = 'p-3 text-right';
                balanceCell.textContent = `${Math.abs(runningBalance).toFixed(2)} ${runningBalance >= 0 ? 'Dr' : 'Cr'}`;
                totalRow.append(totalLabel, debitCell, creditCell, balanceCell);
                tbody.appendChild(totalRow);
                table.appendChild(tbody);
                section.appendChild(table);
                sheet.appendChild(section);
            });
        }

        function updateUI() {
            document.getElementById('ui-day').innerText = `${getWeekday()} · Day ${state.day} · ${formatTime(state.hour, state.minute)}`;
            document.getElementById('ui-cash').innerText = formatMoney(state.actualCash + state.actualBank);
            document.getElementById('ui-focus').style.width = `${state.focus}%`;
            
            const btnAdvance = document.getElementById('btn-advance');
            const btnClose = document.getElementById('btn-close');
            const postingTab = document.getElementById('tab-posting');
            const isPostingSunday = isSunday();
            const canPost = isPostingSunday && state.inbox.length === 0;
            const postingComplete = canPost && getPostingTasks().length === 0;

            if (postingTab) {
                postingTab.disabled = !canPost;
                postingTab.classList.toggle('opacity-50', !canPost);
                postingTab.classList.toggle('cursor-not-allowed', !canPost);
            }
            const inventoryButton = document.getElementById('btn-inventory');
            if (inventoryButton) {
                inventoryButton.disabled = isSunday();
                inventoryButton.classList.toggle('opacity-50', isSunday());
                inventoryButton.classList.toggle('cursor-not-allowed', isSunday());
            }
            renderManagement();
            
            if (!state.shopOpen) {
                if(btnAdvance) {
                    btnAdvance.disabled = true;
                    btnAdvance.classList.add('opacity-50', 'cursor-not-allowed');
                    btnAdvance.innerText = isPostingSunday ? 'Sunday · Shop Closed' : 'Shop Closed';
                }
                if(btnClose) {
                    if (isPostingSunday) {
                        btnClose.innerText = postingComplete ? 'Start Monday' : state.inbox.length > 0 ? 'Record Sunday Documents' : 'Continue Sunday Posting';
                        btnClose.className = 'text-xs text-mint hover:text-white transition-colors w-full mt-1 font-bold py-1';
                    } else {
                        btnClose.innerText = getWeekday() === 'Saturday'
                            ? 'Finish Saturday · Begin Sunday'
                            : `Finish day · Start ${getWeekday(state.day + 1)}`;
                        btnClose.className = "text-xs text-mint hover:text-white transition-colors w-full mt-1 font-bold py-1";
                    }
                }
            } else {
                if(btnAdvance) {
                    btnAdvance.disabled = Boolean(state.pendingCustomerDecision);
                    btnAdvance.classList.toggle('opacity-50', Boolean(state.pendingCustomerDecision));
                    btnAdvance.classList.toggle('cursor-not-allowed', Boolean(state.pendingCustomerDecision));
                    btnAdvance.innerText = "+ Wait";
                }
                if(btnClose) {
                    btnClose.disabled = Boolean(state.pendingCustomerDecision);
                    btnClose.innerText = 'Close shop';
                    btnClose.className = "text-xs text-amber hover:text-white transition-colors w-full mt-1 py-1";
                }
            }

            const inboxContainer = document.getElementById('inbox-container');
            document.getElementById('ui-inbox-count').innerText = state.inbox.length;
            
            if (state.inbox.length === 0) {
                inboxContainer.replaceChildren();
            } else {
                inboxContainer.innerHTML = '';
                state.inbox.forEach(doc => {
                    let colorClass = 'bg-gray-200 text-gray-800 border-gray-400';
                    if (doc.type.includes('Invoice')) colorClass = 'bg-blue-200 text-blue-900 border-blue-400';
                    else if (doc.type.includes('Receipt') || doc.type.includes('Cheque') || doc.type.includes('Cash Bill') || doc.type.includes('Cash Sales')) colorClass = 'bg-emerald-200 text-emerald-900 border-emerald-400';
                    else if (doc.type.includes('Credit Note')) colorClass = 'bg-amber-200 text-amber-900 border-amber-400';

                    const docBtn = document.createElement('button');
                    docBtn.className = `w-full text-left p-2 rounded border shadow text-[11px] font-bold hover:brightness-95 transition-all active:scale-95 flex justify-between items-center ${colorClass}`;
                    docBtn.onclick = () => openDocument(doc);
                    docBtn.innerHTML = `
                        <span class="truncate pr-2">${doc.type}</span>
                        <span class="font-mono whitespace-nowrap">${formatMoney(doc.amount)}</span>
                    `;
                    inboxContainer.appendChild(docBtn);
                });
            }

            updateWorkspaceTabs();
            saveActiveGame();
        }

        function logEvent(message, isSystem = false) {
            state.events.unshift({
                message,
                isSystem,
                day: state.day,
                hour: state.hour,
                minute: state.minute
            });
            const log = document.getElementById('shop-log');
            const entry = document.createElement('div');
            entry.className = `text-xs text-gray-300 border-l-2 ${isSystem ? 'border-amber-400' : 'border-gray-600'} pl-2 animate-slide-up`;
            if (isSystem) {
                entry.innerHTML = message;
            } else {
                entry.innerHTML = `<span class="text-gray-500">[D${state.day} · ${formatTime(state.hour, state.minute)}]</span> ${message}`;
            }
            log.prepend(entry);
        }

        function renderSavedShopLog() {
            const log = document.getElementById('shop-log');
            log.replaceChildren();
            state.events.forEach(event => {
                const entry = document.createElement('div');
                entry.className = `text-xs text-gray-300 border-l-2 ${event.isSystem ? 'border-amber-400' : 'border-gray-600'} pl-2`;
                if (event.isSystem) {
                    entry.innerHTML = event.message;
                } else {
                    entry.innerHTML = `<span class="text-gray-500">[D${event.day} · ${formatTime(event.hour, event.minute)}]</span> ${event.message}`;
                }
                log.appendChild(entry);
            });
        }

        function renderOpeningJournal() {
            const tbody = document.getElementById('tb-generalJournal');
            if (!tbody) return;

            tbody.replaceChildren();
            openingJournalEntries.forEach((entry, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800 font-mono text-xs';
                const particulars = index === openingJournalEntries.length - 1
                    ? `<span class="pl-6">${entry.particulars}</span>`
                    : entry.particulars;
                row.innerHTML = `
                    <td class="p-3 text-gray-300">May 1</td>
                    <td class="p-3 text-gray-100">${particulars}</td>
                    <td class="p-3 text-center text-gray-500">GJ-0001</td>
                    <td class="p-3 text-right ${entry.side === 'debit' ? 'text-mint' : 'text-gray-600'}">${entry.side === 'debit' ? entry.amount.toFixed(2) : '-'}</td>
                    <td class="p-3 text-right ${entry.side === 'credit' ? 'text-coral' : 'text-gray-600'}">${entry.side === 'credit' ? entry.amount.toFixed(2) : '-'}</td>
                `;
                tbody.appendChild(row);
            });

            const narration = document.createElement('tr');
            narration.className = 'border-b border-gray-700 bg-gray-900/50 text-[10px] text-gray-400';
            narration.innerHTML = '<td></td><td colspan="4" class="px-3 pb-3 italic">Being opening assets introduced into the business by the owner as capital.</td>';
            tbody.appendChild(narration);
        }

        function renderSavedJournalEntries() {
            const savedEntries = state.primeEntries.filter(entry => !entry.opening);
            const books = ['cashBook', 'generalJournal', 'salesJournal', 'purchasesJournal', 'salesReturnsJournal', 'purchasesReturnsJournal'];
            books.forEach(book => {
                const tbody = document.getElementById(`tb-${book}`);
                if (!tbody) return;
                if (book === 'cashBook') {
                    Array.from(tbody.children).slice(1).forEach(row => row.remove());
                } else {
                    tbody.replaceChildren();
                }
            });

            const appendCell = (row, text, className = 'p-3') => {
                const cell = document.createElement('td');
                cell.className = className;
                cell.textContent = text;
                row.appendChild(cell);
            };

            savedEntries.forEach(entry => {
                const tbody = document.getElementById(`tb-${entry.book}`);
                if (!tbody) return;
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-750 hover:bg-gray-800 font-mono text-xs';
                const date = `May ${entry.day}`;
                const amount = Number(entry.amount).toFixed(2);

                if (entry.book === 'cashBook') {
                    const dashCells = count => {
                        for (let index = 0; index < count; index++) {
                            appendCell(row, '-', 'p-2 text-gray-500');
                        }
                    };
                    if (entry.side === 'debit') {
                        appendCell(row, date, 'p-2 text-gray-300');
                        appendCell(row, entry.particulars, 'p-2 text-gray-100 font-semibold');
                        appendCell(row, 'GL', 'p-2 text-center text-gray-500');
                        appendCell(row, entry.discountAllowed ? Number(entry.discountAllowed).toFixed(2) : '-', 'p-2 text-right text-amber');
                        appendCell(row, entry.cashColumn === 'debit-cash' ? amount : '-', `p-2 text-right ${entry.cashColumn === 'debit-cash' ? 'text-mint font-bold' : 'text-gray-600'}`);
                        appendCell(row, entry.cashColumn === 'debit-bank' ? amount : '-', `p-2 text-right ${entry.cashColumn === 'debit-bank' ? 'text-mint font-bold' : 'text-gray-600'} border-r border-gray-700`);
                        dashCells(6);
                    } else {
                        dashCells(6);
                        appendCell(row, date, 'p-2 text-gray-300');
                        appendCell(row, entry.particulars, 'p-2 text-gray-100 font-semibold');
                        appendCell(row, 'GL', 'p-2 text-center text-gray-500');
                        appendCell(row, entry.discountReceived ? Number(entry.discountReceived).toFixed(2) : '-', 'p-2 text-right text-amber');
                        appendCell(row, entry.cashColumn === 'credit-cash' ? amount : '-', `p-2 text-right ${entry.cashColumn === 'credit-cash' ? 'text-coral font-bold' : 'text-gray-600'}`);
                        appendCell(row, entry.cashColumn === 'credit-bank' ? amount : '-', `p-2 text-right ${entry.cashColumn === 'credit-bank' ? 'text-coral font-bold' : 'text-gray-600'}`);
                    }
                } else if (entry.book === 'generalJournal') {
                    const particulars = document.createElement('td');
                    particulars.className = 'p-3 text-gray-100 font-semibold';
                    particulars.textContent = entry.particulars;
                    if (entry.description) {
                        const explanation = document.createElement('span');
                        explanation.className = 'block text-[10px] text-gray-500 font-normal';
                        explanation.textContent = `(${entry.description})`;
                        particulars.appendChild(document.createElement('br'));
                        particulars.appendChild(explanation);
                    }
                    row.appendChild(particulars);
                    const firstCell = document.createElement('td');
                    firstCell.className = 'p-3 text-gray-300';
                    firstCell.textContent = date;
                    row.insertBefore(firstCell, particulars);
                    appendCell(row, 'GJ1', 'p-3 text-center text-gray-500');
                    appendCell(row, entry.side === 'debit' ? amount : '-', `p-3 text-right ${entry.side === 'debit' ? 'text-mint font-bold' : 'text-gray-600'}`);
                    appendCell(row, entry.side === 'credit' ? amount : '-', `p-3 text-right ${entry.side === 'credit' ? 'text-coral font-bold' : 'text-gray-600'}`);
                } else {
                    appendCell(row, date, 'p-3 text-gray-300');
                    appendCell(row, entry.particulars, 'p-3 text-gray-100 font-semibold');
                    appendCell(row, entry.documentId || '-', 'p-3 text-gray-400 font-mono');
                    appendCell(row, 'SL1', 'p-3 text-center text-gray-500');
                    appendCell(row, amount, 'p-3 text-right text-amber font-bold');
                }
                tbody.appendChild(row);
            });
        }

        function finalizeDailyCashSales() {
            const cashSaleDocs = state.inbox.filter(doc => doc.date === state.day && doc.rawType === 'sale_cash');
            if (cashSaleDocs.length === 0) return;

            const cashSaleIds = new Set(cashSaleDocs.map(doc => doc.id));
            if (state.recordingDoc && cashSaleIds.has(state.recordingDoc.id)) {
                cancelRecording();
            }
            if (state.activeDoc && cashSaleIds.has(state.activeDoc.id)) {
                closeDocument();
            }

            const amount = cashSaleDocs.reduce((total, doc) => total + doc.amount, 0);
            const receiptIds = cashSaleDocs.map(doc => doc.id);
            state.inbox = state.inbox.filter(doc => !cashSaleIds.has(doc.id));
            state.inbox.push({
                id: `DAY-${state.day}-CASH-SALES`,
                date: state.day,
                type: 'Daily Cash Sales Summary',
                amount,
                desc: `Daily total of ${cashSaleDocs.length} walk-in cash receipt${cashSaleDocs.length === 1 ? '' : 's'} (${receiptIds.join(', ')}). Record the total as Sales in the Cash Book.`,
                rawType: 'sale_cash_summary',
                receiptIds
            });
        }

        function getAvailableItemQuantity(itemId) {
            const item = state.inventory[itemId];
            return item ? item.qty + getDisplayedQuantity(itemId) : 0;
        }

        function chooseDecisionCustomer() {
            const availableCustomers = state.customers.filter(customer => !state.recentDecisionCustomers.includes(customer));
            const customerPool = availableCustomers.length ? availableCustomers : state.customers;
            return customerPool[Math.floor(Math.random() * customerPool.length)];
        }

        function createCustomerDecisionEvent() {
            const candidates = [];
            const bulkItems = ['paperGoods', 'writingInstruments', 'artSupplies']
                .map(id => state.inventory[id])
                .filter(item => item && getAvailableItemQuantity(item.id) >= 4);

            if (bulkItems.length) {
                const item = bulkItems[Math.floor(Math.random() * bulkItems.length)];
                const quantity = Math.min(getAvailableItemQuantity(item.id), Math.floor(Math.random() * 3) + 4);
                const discountedPrice = Math.round(item.retailPrice * 0.95 * 100) / 100;
                const customerName = chooseDecisionCustomer();
                candidates.push({
                    type: 'bulk-order',
                    title: 'A group order, with a catch',
                    customerName,
                    itemId: item.id,
                    quantity,
                    description: `${customerName} needs ${quantity} ${item.name.split('(')[0].trim()} for an upcoming activity. They can take the full order today, but want to know whether you can meet them on price.`,
                    choices: [
                        { id: 'full-price', label: `Keep the listed price · ${formatMoney(quantity * item.retailPrice)} cash`, detail: 'Fulfil the full order now without reducing your margin.' },
                        { id: 'discount-credit', label: `Offer 5% off · ${formatMoney(quantity * discountedPrice)} on credit`, detail: 'Secure the full order, but accept a lower selling price and add a customer balance.' },
                        { id: 'decline', label: 'Decline the order', detail: 'Keep the stock available for walk-in customers.' }
                    ]
                });
            }

            const stockedShelves = state.shelves.filter(shelf => shelf.qty >= 2);
            if (stockedShelves.length) {
                const shelf = stockedShelves[Math.floor(Math.random() * stockedShelves.length)];
                const item = state.inventory[shelf.itemId];
                const quantity = Math.min(shelf.qty, Math.floor(Math.random() * 2) + 2);
                const discountedPrice = Math.round(item.retailPrice * 0.9 * 100) / 100;
                const customerName = chooseDecisionCustomer();
                candidates.push({
                    type: 'price-negotiation',
                    title: 'A customer wants a better price',
                    customerName,
                    itemId: item.id,
                    quantity,
                    description: `${customerName} is interested in ${quantity} ${item.name.split('(')[0].trim()}, but asks for a 10% discount if they buy them together. The shelf has enough stock to fulfil the request.`,
                    choices: [
                        { id: 'accept-offer', label: `Accept 10% off · ${formatMoney(quantity * discountedPrice)} cash`, detail: 'Sell the full quantity now at a lower margin.' },
                        { id: 'hold-price', label: `Hold your price · sell 1 for ${formatMoney(item.retailPrice)}`, detail: 'Keep the listed price, but the customer will only buy one.' },
                        { id: 'decline', label: 'Decline the offer', detail: 'Keep all the stock at the listed price for another customer.' }
                    ]
                });
            }

            const backroomItems = Object.values(state.inventory)
                .filter(item => item.qty > 0 && getDisplayedQuantity(item.id) === 0);
            if (backroomItems.length) {
                const item = backroomItems[Math.floor(Math.random() * backroomItems.length)];
                const quantity = Math.min(item.qty, Math.floor(Math.random() * 2) + 1);
                const alternativeShelves = state.shelves.filter(shelf => shelf.qty > 0 && shelf.itemId !== item.id);
                const alternative = alternativeShelves.length
                    ? state.inventory[alternativeShelves[Math.floor(Math.random() * alternativeShelves.length)].itemId]
                    : null;
                const customerName = chooseDecisionCustomer();
                const choices = [
                    { id: 'fetch-request', label: `Fetch ${quantity} from storage · ${formatMoney(quantity * item.retailPrice)} cash`, detail: 'Serve a product that is not currently displayed.' }
                ];
                if (alternative) {
                    choices.push({
                        id: 'offer-alternative',
                        label: `Suggest ${alternative.name.split('(')[0].trim()} · ${formatMoney(alternative.retailPrice)} cash`,
                        detail: 'Offer one item that is already on display instead.'
                    });
                }
                choices.push({ id: 'decline', label: 'Let the customer go', detail: 'Keep the backroom stock for another opportunity.' });
                candidates.push({
                    type: 'stockroom-request',
                    title: 'A request for something off the shelf',
                    customerName,
                    itemId: item.id,
                    quantity,
                    alternativeItemId: alternative ? alternative.id : null,
                    description: `${customerName} asks for ${item.name.split('(')[0].trim()}, but none is on display. You have stock in the backroom and can fetch it, suggest another displayed product, or pass.`,
                    choices
                });
            }

            const returnablePurchases = state.customerPurchases.filter(purchase => purchase.quantityRemaining > 0);
            if (returnablePurchases.length) {
                const purchase = returnablePurchases[Math.floor(Math.random() * returnablePurchases.length)];
                const item = state.inventory[purchase.itemId];
                const quantity = Math.min(purchase.quantityRemaining, Math.floor(Math.random() * 2) + 1);
                candidates.push({
                    type: 'return-request',
                    title: 'A customer asks to return an item',
                    customerName: purchase.customerName,
                    itemId: item.id,
                    quantity,
                    purchase,
                    description: `${purchase.customerName} has brought back ${quantity} ${item.name.split('(')[0].trim()} bought earlier. The purchase record confirms the return is valid.`,
                    choices: [
                        { id: 'accept-return', label: `Accept the return · ${formatMoney(quantity * purchase.unitPrice)} refund`, detail: 'Refund a cash purchase or issue a credit note, then return the goods to stock.' },
                        { id: 'decline-return', label: 'Decline the return', detail: 'Keep the original sale and explain that you cannot accept the goods back.' }
                    ]
                });
            }

            const recentTypes = state.customerDecisionHistory.slice(-2).map(entry => entry.type);
            const freshCandidates = candidates.filter(candidate => !recentTypes.includes(candidate.type));
            const eventPool = freshCandidates.length ? freshCandidates : candidates;
            if (!eventPool.length) return null;

            const event = eventPool[Math.floor(Math.random() * eventPool.length)];
            event.id = `CUSTOMER-${state.day}-${state.customerDecisionCounter++}`;
            state.customerDecisionHistory.push({ id: event.id, type: event.type, day: state.day });
            if (state.customerDecisionHistory.length > 12) state.customerDecisionHistory.shift();
            state.recentDecisionCustomers.push(event.customerName);
            if (state.recentDecisionCustomers.length > 3) state.recentDecisionCustomers.shift();
            return event;
        }

        function showCustomerDecision(event) {
            state.pendingCustomerDecision = event;
            const modal = document.getElementById('customer-event-modal');
            document.getElementById('customer-event-kicker').textContent = event.type === 'return-request'
                ? 'A previous customer is back'
                : 'A customer needs your decision';
            document.getElementById('customer-event-title').textContent = event.title;
            document.getElementById('customer-event-customer').textContent = event.customerName;
            document.getElementById('customer-event-description').textContent = event.description;
            const choices = document.getElementById('customer-event-choices');
            choices.replaceChildren();
            event.choices.forEach(choice => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'customer-event-choice';
                button.innerHTML = `<strong>${escapeDocumentText(choice.label)}</strong><span>${escapeDocumentText(choice.detail)}</span>`;
                button.addEventListener('click', () => resolveCustomerDecision(choice.id));
                choices.appendChild(button);
            });
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
            const firstChoice = choices.querySelector('button');
            if (firstChoice) firstChoice.focus();
        }

        function hideCustomerDecision() {
            const modal = document.getElementById('customer-event-modal');
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
            state.pendingCustomerDecision = null;
        }

        function fulfillCustomerSale(event, quantity, unitPrice, paymentType, note) {
            if (getAvailableItemQuantity(event.itemId) < quantity) {
                showToast('The available stock changed before this sale could be completed.', 'error');
                return false;
            }
            let remaining = quantity;
            state.shelves.filter(shelf => shelf.itemId === event.itemId).forEach(shelf => {
                const sold = Math.min(shelf.qty, remaining);
                shelf.qty -= sold;
                remaining -= sold;
            });
            if (remaining > 0) {
                const itemStock = state.inventory[event.itemId];
                const fromBackroom = Math.min(itemStock.qty, remaining);
                itemStock.qty -= fromBackroom;
                remaining -= fromBackroom;
            }
            if (remaining > 0) {
                showToast('The available stock changed before this sale could be completed.', 'error');
                return false;
            }

            const item = state.inventory[event.itemId];
            const amount = Math.round(quantity * unitPrice * 100) / 100;
            state.totalRevenue += amount;
            state.customerPurchases.push({
                customerName: event.customerName,
                itemId: event.itemId,
                quantityRemaining: quantity,
                unitPrice,
                paymentType
            });
            const isCredit = paymentType === 'credit';
            const description = `${event.customerName} bought ${quantity} ${item.name.split('(')[0].trim()} ${note}.`;
            state.inbox.push({
                id: `DOC-${state.docCounter++}`,
                date: state.day,
                type: isCredit ? 'Invoice (Copy)' : 'Official Receipt (Copy)',
                amount,
                desc: description,
                rawType: isCredit ? 'sale_credit' : 'sale_cash',
                itemId: item.id,
                itemName: item.name.split('(')[0].trim(),
                unitPrice,
                quantity,
                customerName: event.customerName
            });
            if (!isCredit) state.actualCash += amount;
            logEvent(description);
            showToast(`${isCredit ? 'Credit sale' : 'Cash sale'} · ${item.name.split('(')[0].trim()} × ${quantity}.`);
            return true;
        }

        function resolveCustomerDecision(choiceId) {
            const event = state.pendingCustomerDecision;
            if (!event) return;
            if (!event.choices.some(option => option.id === choiceId)) {
                showToast('That customer response is no longer available.', 'error');
                return;
            }
            hideCustomerDecision();

            const item = event.itemId ? state.inventory[event.itemId] : null;
            if (event.type === 'bulk-order') {
                if (choiceId === 'full-price') {
                    fulfillCustomerSale(event, event.quantity, item.retailPrice, 'cash', 'at the listed price for the group order');
                } else if (choiceId === 'discount-credit') {
                    const discountedPrice = Math.round(item.retailPrice * 0.95 * 100) / 100;
                    fulfillCustomerSale(event, event.quantity, discountedPrice, 'credit', 'at the agreed 5% group-order discount');
                } else {
                    logEvent(`${event.customerName}'s group order was declined; the stock remains available.`);
                    showToast('Order declined. Stock remains available for walk-in customers.');
                }
            } else if (event.type === 'price-negotiation') {
                if (choiceId === 'accept-offer') {
                    const discountedPrice = Math.round(item.retailPrice * 0.9 * 100) / 100;
                    fulfillCustomerSale(event, event.quantity, discountedPrice, 'cash', 'at the agreed 10% discount');
                } else if (choiceId === 'hold-price') {
                    fulfillCustomerSale(event, 1, item.retailPrice, 'cash', 'at the listed price');
                } else {
                    logEvent(`${event.customerName} declined to buy at the listed price.`);
                    showToast('You held your price. The customer left without buying.');
                }
            } else if (event.type === 'stockroom-request') {
                if (choiceId === 'fetch-request') {
                    fulfillCustomerSale(event, event.quantity, item.retailPrice, 'cash', 'after you fetched the items from the backroom');
                } else if (choiceId === 'offer-alternative' && event.alternativeItemId) {
                    const alternative = state.inventory[event.alternativeItemId];
                    fulfillCustomerSale({ ...event, itemId: alternative.id }, 1, alternative.retailPrice, 'cash', `after choosing the displayed ${alternative.name.split('(')[0].trim()}`);
                } else {
                    logEvent(`${event.customerName} left without buying ${item.name.split('(')[0].trim()}.`);
                    showToast('The customer left without a purchase.');
                }
            } else if (event.type === 'return-request') {
                if (choiceId === 'accept-return') {
                    const purchase = event.purchase;
                    purchase.quantityRemaining -= event.quantity;
                    const amount = Math.round(event.quantity * purchase.unitPrice * 100) / 100;
                    returnStockToStore(event.itemId, event.quantity);
                    const isCashRefund = purchase.paymentType === 'cash';
                    const description = `${event.customerName} returned ${event.quantity} ${item.name.split('(')[0].trim()} from an earlier purchase.`;
                    state.inbox.push({
                        id: `DOC-${state.docCounter++}`,
                        date: state.day,
                        type: isCashRefund ? 'Cash Refund Voucher (Copy)' : 'Credit Note (Copy)',
                        amount,
                        desc: description,
                        rawType: isCashRefund ? 'sale_cash_return' : 'sales_return',
                        itemId: item.id,
                        itemName: item.name.split('(')[0].trim(),
                        unitPrice: purchase.unitPrice,
                        quantity: event.quantity,
                        customerName: event.customerName
                    });
                    if (isCashRefund) state.actualCash -= amount;
                    logEvent(description);
                    showToast(`Return accepted · ${formatMoney(amount)} ${isCashRefund ? 'refunded' : 'credited'}.`);
                } else {
                    logEvent(`${event.customerName}'s valid return request was declined.`);
                    showToast('You declined the return. The original sale stands.');
                }
            }

            closeShopIfNeeded();
            updateUI();
            const returnFocus = document.getElementById(state.shopOpen
                ? 'btn-advance'
                : state.activeLeftTab === 'management' ? 'left-tab-management' : 'btn-close');
            if (returnFocus && !returnFocus.disabled) returnFocus.focus();
        }

        function presentDailyCustomerDecision() {
            if (state.customerDecisionPresentedToday) return false;
            state.customerDecisionPresentedToday = true;
            const event = createCustomerDecisionEvent();
            if (!event) return false;
            showCustomerDecision(event);
            return true;
        }

        function closeShopIfNeeded() {
            if (!state.shopOpen || (state.eventsToday < state.maxEventsToday && state.hour < 17)) return;
            state.shopOpen = false;
            finalizeDailyCashSales();
            logEvent('Shop automatically closed.', true);
            switchLeftTab('management');
        }

        function triggerEvent() {
            if (!state.shopOpen) return;
            if (state.pendingCustomerDecision) return;

            if (state.focus <= 10) {
                showToast('Focus too low. Please close shop or rest.', 'error');
                return;
            }

            // Advance Time by 1-2 hours and random minutes
            let addHours = Math.floor(Math.random() * 2) + 1; 
            let addMins = Math.floor(Math.random() * 45) + 5;
            state.minute += addMins;
            if (state.minute >= 60) {
                state.hour += 1;
                state.minute -= 60;
            }
            state.hour += addHours;
            
            if (state.hour >= 17) {
                state.hour = 17;
                state.minute = 0;
            }

            state.eventsToday++;
            state.focus -= 5;
            if (!presentDailyCustomerDecision()) processCustomerVisit();
            
            if (!state.pendingCustomerDecision) closeShopIfNeeded();
            
            updateUI();
        }

        function processCustomerVisit() {
            const customerName = state.customers[Math.floor(Math.random() * state.customers.length)];
            const isBrowsing = Math.random() < 0.72;
            const displayedProducts = Object.values(state.inventory).filter(product => getDisplayedQuantity(product.id) > 0);
            const item = isBrowsing
                ? displayedProducts[Math.floor(Math.random() * displayedProducts.length)]
                : Object.values(state.inventory)[Math.floor(Math.random() * Object.keys(state.inventory).length)];

            if (!item) {
                logEvent(`${customerName} browsed, but the storefront has no products on display.`);
                return;
            }
            if (getDisplayedQuantity(item.id) <= 0) {
                logEvent(`${customerName} wanted ${item.name.split('(')[0].trim()}, but it was not on a shelf and left without buying.`);
                return;
            }

            const anchorPrice = item.unitCost * 1.5;
            const pricePremium = (item.retailPrice - anchorPrice) / anchorPrice;
            const buyChance = isBrowsing
                ? Math.max(0.15, Math.min(0.92, 0.48 + getShopAppeal() * 0.55 - pricePremium * 0.45))
                : Math.max(0.35, Math.min(0.95, 0.84 - pricePremium * 0.35));
            if (Math.random() > buyChance) {
                logEvent(`${customerName} browsed ${item.name.split('(')[0].trim()} but decided not to buy at ${formatMoney(item.retailPrice)}.`);
                return;
            }

            const shelf = state.shelves.find(display => display.itemId === item.id && display.qty > 0);
            if (!shelf) {
                logEvent(`${customerName} could not find ${item.name.split('(')[0].trim()} on display.`);
                return;
            }
            const basketBonus = state.ownedDecorations.reduce((total, id) => {
                const decoration = state.decorations.find(option => option.id === id);
                return total + (decoration ? decoration.basket : 0);
            }, 0);
            const maxQuantity = isBrowsing
                ? 1 + Math.floor(Math.random() * 2) + (Math.random() < Math.min(0.75, basketBonus * 0.5) ? 1 : 0)
                : 1 + (Math.random() < 0.2 ? 1 : 0);
            const quantity = Math.min(shelf.qty, maxQuantity);
            shelf.qty -= quantity;
            const amount = Math.round(quantity * item.retailPrice * 100) / 100;
            state.totalRevenue += amount;
            const isCredit = Math.random() < 0.25;
            const paymentType = isCredit ? 'credit' : 'cash';
            state.customerPurchases.push({
                customerName,
                itemId: item.id,
                quantityRemaining: quantity,
                unitPrice: item.retailPrice,
                paymentType
            });
            const doc = {
                id: `DOC-${state.docCounter++}`,
                date: state.day,
                type: isCredit ? 'Invoice (Copy)' : 'Official Receipt (Copy)',
                amount,
                desc: `${isBrowsing ? 'Browsing' : 'Specific-item'} customer ${customerName} bought ${quantity} ${item.name.split('(')[0].trim()} from the storefront.`,
                rawType: isCredit ? 'sale_credit' : 'sale_cash',
                itemId: item.id,
                itemName: item.name.split('(')[0].trim(),
                unitPrice: item.retailPrice,
                quantity,
                customerName
            };
            state.inbox.push(doc);
            if (!isCredit) state.actualCash += amount;
            logEvent(doc.desc);
            showToast(`${isCredit ? 'Credit sale' : 'Cash sale'} · ${item.name.split('(')[0].trim()} × ${quantity}.`);
        }

        function returnStockToStore(itemId, quantity) {
            let remaining = quantity;
            state.shelves.filter(shelf => shelf.itemId === itemId).forEach(shelf => {
                const space = state.shelfCapacity - shelf.qty;
                const returned = Math.min(space, remaining);
                shelf.qty += returned;
                remaining -= returned;
            });
            state.inventory[itemId].qty += remaining;
        }

        function endDay() {
            if (state.shopOpen) {
                if (state.pendingCustomerDecision) {
                    showToast('Resolve the customer request before closing the shop.', 'error');
                    return;
                }
                // Manually close the shop early
                state.shopOpen = false;
                finalizeDailyCashSales();
                logEvent('Shop closed.', true);
                switchLeftTab('management');
                updateUI();
            } else if (isSunday()) {
                if (state.inbox.length > 0) {
                    showToast('Record every document before Sunday posting can begin.', 'error');
                    switchTab('cashBook');
                    return;
                }
                if (getPostingTasks().length > 0) {
                    switchTab('posting');
                    showToast('Post every weekly journal and personal-ledger amount before Monday.', 'info');
                    return;
                }
                startNextShopDay();
            } else {
                const wasSaturday = getWeekday() === 'Saturday';
                state.day++;
                deliverInventoryOrders();
                if (wasSaturday) {
                    state.shopOpen = false;
                    logEvent('Sunday · Bookkeeping.', true);
                    showToast('It’s Sunday. The shop stays closed for bookkeeping.', 'info');
                } else {
                    startShopDay();
                }
                updateUI();
            }
        }

        function startShopDay() {
            state.focus = 100;
            state.restockEnergy = state.maxRestockEnergy;
            state.hour = 9;
            state.minute = 0;
            state.eventsToday = 0;
            state.customerDecisionPresentedToday = false;
            state.pendingCustomerDecision = null;
            const premise = state.premises.find(item => item.id === state.premiseId);
            const baseTraffic = Math.floor(Math.random() * 2) + 4;
            state.maxEventsToday = Math.max(2, Math.round(baseTraffic * (premise ? premise.traffic : 1)));
            state.shopOpen = true;
            issueMonthlyRent();
            switchLeftTab('shop');
            logEvent(`--- ${getWeekday()} begins: Day ${state.day} ---`, true);
            updateUI();
        }

        function issueMonthlyRent() {
            if ((state.day - 1) % 30 !== 0 || state.rentBilledDays.includes(state.day)) return;
            const premise = state.premises.find(item => item.id === state.premiseId);
            if (!premise || premise.rent <= 0) return;
            state.rentBilledDays.push(state.day);
            state.inbox.push({
                id: `RENT-${state.day}`,
                date: state.day,
                type: 'Rent Bill (Original)',
                amount: premise.rent,
                desc: `Monthly rent bill for ${premise.name}. Choose to pay by bank or record it as unpaid rent.`,
                rawType: 'rent_bill',
                billType: 'rent',
                paymentMethod: 'bank',
                itemName: `${premise.name} monthly rent`,
                unitPrice: premise.rent,
                quantity: 1
            });
            logEvent(`Rent · ${premise.name} · ${formatMoney(premise.rent)}`, true);
        }

        function startNextShopDay() {
            state.day++;
            deliverInventoryOrders();
            startShopDay();
            switchTab('cashBook');
        }

        function closeDocument() {
            document.getElementById('doc-viewer').classList.add('hidden');
            document.getElementById('doc-viewer').classList.remove('flex');
            state.activeDoc = null;
        }

        // --- NEW: INVENTORY & STOCK PURCHASE SYSTEM ---

        function openInventoryModal() {
            if (isSunday()) {
                showToast('Stock orders are available Monday through Saturday, not during Sunday bookkeeping.', 'error');
                return;
            }
            const modal = document.getElementById('inventory-modal');
            state.inventoryModalOpener = document.activeElement;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.getElementById('order-form').classList.add('hidden');
            document.getElementById('order-form').classList.remove('flex');
            document.getElementById('inventory-list-view').classList.remove('hidden');
            state.activeOrderItem = null;
            state.selectedOrderSupplierId = null;
            renderInventoryList();
            modal.querySelector('[role="dialog"]').focus();
        }

        function closeInventoryModal() {
            const modal = document.getElementById('inventory-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            state.activeOrderItem = null;
            state.selectedOrderSupplierId = null;
            if (state.inventoryModalOpener instanceof HTMLElement && state.inventoryModalOpener.isConnected) {
                state.inventoryModalOpener.focus();
            }
            state.inventoryModalOpener = null;
        }

        function renderInventoryList() {
            const listEl = document.getElementById('inventory-list');
            listEl.replaceChildren();
            
            Object.values(state.inventory).forEach(item => {
                const incoming = getPendingInventoryQuantity(item.id);
                const statusText = item.qty <= 5 ? 'Low stock' : item.qty <= 20 ? 'Restock soon' : 'Stock available';
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-product-row';
                itemDiv.innerHTML = `
                    <div class="inventory-product-info">
                        <strong>${escapeDocumentText(item.name.split('(')[0].trim())}</strong>
                        <span>${statusText}${incoming ? ` · ${incoming} arriving` : ''}</span>
                    </div>
                    <div class="inventory-product-stock"><small>In backroom</small><strong>${item.qty}</strong></div>
                    <button type="button" onclick="startOrder('${item.id}')" class="inventory-product-action">Order this <span aria-hidden="true">→</span></button>
                `;
                listEl.appendChild(itemDiv);
            });
        }

        function startOrder(itemId) {
            const item = state.inventory[itemId];
            if (!item) {
                showToast('Choose a valid product before placing an order.', 'error');
                return;
            }
            state.activeOrderItem = item;
            state.selectedOrderSupplierId = state.suppliers[0]?.id || null;
            
            document.getElementById('order-item-name').innerText = `Order ${state.activeOrderItem.name.split('(')[0].trim()}`;
            document.getElementById('order-qty').value = 10;
            renderOrderSupplierOptions();
            document.getElementById('inventory-list-view').classList.add('hidden');
            updateOrderTotal();
            document.getElementById('order-form').classList.remove('hidden');
            document.getElementById('order-form').classList.add('flex');
            document.querySelector('#order-supplier-options input:checked')?.focus();
        }

        function cancelOrder() {
            document.getElementById('order-form').classList.add('hidden');
            document.getElementById('order-form').classList.remove('flex');
            state.activeOrderItem = null;
            state.selectedOrderSupplierId = null;
            document.getElementById('inventory-list-view').classList.remove('hidden');
            document.getElementById('inventory-list-view').querySelector('.inventory-product-action')?.focus();
        }

        function renderOrderSupplierOptions() {
            const options = document.getElementById('order-supplier-options');
            options.innerHTML = state.suppliers.map((supplier, index) => {
                const unitPrice = Math.round(state.activeOrderItem.unitCost * (1 - supplier.unitDiscount + supplier.unitMarkup) * 100) / 100;
                const offerLabel = supplier.unitDiscount > 0
                    ? 'Bulk savings'
                    : supplier.unitMarkup > 0
                        ? 'Flexible terms'
                        : 'Everyday pricing';
                return `
                    <label class="supplier-choice ${supplier.id === state.selectedOrderSupplierId ? 'is-selected' : ''}">
                        <input type="radio" name="order-supplier" value="${escapeDocumentText(supplier.id)}"
                            ${supplier.id === state.selectedOrderSupplierId ? 'checked' : ''} onchange="selectOrderSupplier(this.value)">
                        <span class="supplier-choice-content">
                            <span class="supplier-choice-heading">
                                <strong>${escapeDocumentText(supplier.name)}</strong>
                                <span>${offerLabel}</span>
                            </span>
                            <span class="supplier-choice-price">${formatMoney(unitPrice)} <small>/ unit</small></span>
                            <span class="supplier-choice-terms">${escapeDocumentText(supplier.offer)}</span>
                            <span class="supplier-choice-footer">
                                <span>Minimum ${supplier.minQuantity} units</span>
                                <span>${escapeDocumentText(supplier.terms)}</span>
                            </span>
                        </span>
                    </label>
                `;
            }).join('');
        }

        function selectOrderSupplier(supplierId) {
            state.selectedOrderSupplierId = supplierId;
            document.querySelectorAll('.supplier-choice').forEach(choice => {
                choice.classList.toggle('is-selected', choice.querySelector('input').value === supplierId);
            });
            updateOrderTotal();
        }

        function changeOrderQuantity(change) {
            const quantityInput = document.getElementById('order-qty');
            const currentQuantity = Number.parseInt(quantityInput.value, 10) || 0;
            quantityInput.value = Math.max(1, currentQuantity + change);
            updateOrderTotal();
        }

        function updateOrderTotal() {
            if (!state.activeOrderItem) return;
            const qty = Number.parseInt(document.getElementById('order-qty').value, 10) || 0;
            const supplier = state.suppliers.find(item => item.id === state.selectedOrderSupplierId);
            if (!supplier) return;
            const unitPrice = Math.round(state.activeOrderItem.unitCost * (1 - supplier.unitDiscount + supplier.unitMarkup) * 100) / 100;
            const total = Math.round(qty * unitPrice * 100) / 100;
            const baseline = Math.round(qty * state.activeOrderItem.unitCost * 100) / 100;
            const offerSummary = document.getElementById('supplier-offer-summary');
            const paymentSummary = document.getElementById('order-payment-summary');
            const paymentMethod = document.querySelector('input[name="order-payment"]:checked')?.value || 'credit';
            const quantityMeetsMinimum = qty >= supplier.minQuantity;
            const capacity = Math.max(0, state.storageCapacity - getStorageUsed() - getPendingInventoryQuantity());
            const cashAfterPurchase = state.actualBank - total;
            const submitButton = document.getElementById('submit-inventory-order');
            const paymentIsValid = paymentMethod !== 'cash' || cashAfterPurchase >= 0;
            const orderIsValid = qty > 0 && qty >= supplier.minQuantity && qty <= capacity && paymentIsValid;

            document.getElementById('order-total').innerText = formatMoney(total);
            document.getElementById('order-quantity-hint').textContent =
                `${capacity} units of backroom space available · Delivery Day ${state.day + 1}`;
            offerSummary.innerHTML = `
                <strong>Order details</strong>
                <span>${formatMoney(unitPrice)} per unit · ${qty} units · Delivery expected Day ${state.day + 1}</span>
                ${supplier.unitDiscount > 0 && quantityMeetsMinimum
                    ? `<span class="supplier-offer-saving">You save ${formatMoney(baseline - total)} compared with standard unit cost.</span>`
                    : supplier.unitMarkup > 0
                        ? `<span class="supplier-offer-saving">This flexible offer costs ${formatMoney(total - baseline)} more than standard pricing.</span>`
                        : ''}
                ${!quantityMeetsMinimum ? `<span class="supplier-offer-warning">This supplier requires at least ${supplier.minQuantity} units.</span>` : ''}
                ${qty > capacity ? `<span class="supplier-offer-warning">Only ${capacity} units of backroom space are available.</span>` : ''}
            `;
            paymentSummary.textContent = paymentMethod === 'cash'
                ? cashAfterPurchase >= 0
                    ? `Pay now by bank. Available bank balance after this order: ${formatMoney(cashAfterPurchase)}.`
                    : `Not enough bank funds. This order would leave you short by ${formatMoney(Math.abs(cashAfterPurchase))}; choose supplier credit or reduce the quantity.`
                : `Buy on supplier credit. Pay ${formatMoney(total)} by Day ${state.day + supplier.creditDays}; bank balance is unchanged today.`;
            submitButton.disabled = !orderIsValid;
            submitButton.title = !quantityMeetsMinimum
                ? `Order at least ${supplier.minQuantity} units from this supplier.`
                : qty > capacity
                    ? `Only ${capacity} units of backroom space are available.`
                    : !paymentIsValid
                        ? 'Not enough bank funds for this order.'
                        : '';
        }

        function submitOrder() {
            if (isSunday() || !state.activeOrderItem) return;
            
            const qty = Number.parseInt(document.getElementById('order-qty').value, 10);
            if (!Number.isInteger(qty) || qty <= 0) {
                showToast("Quantity must be greater than 0.", "error");
                return;
            }

            const supplierId = state.selectedOrderSupplierId;
            const supplier = state.suppliers.find(s => s.id === supplierId);
            const paymentMethod = document.querySelector('input[name="order-payment"]:checked')?.value;
            if (!supplier) {
                showToast('Choose a valid supplier before placing the order.', 'error');
                return;
            }
            if (qty < supplier.minQuantity) {
                showToast(`${supplier.name} requires an order of at least ${supplier.minQuantity} units.`, 'error');
                return;
            }
            const unitPrice = Math.round(state.activeOrderItem.unitCost * (1 - supplier.unitDiscount + supplier.unitMarkup) * 100) / 100;
            const totalCost = Math.round(qty * unitPrice * 100) / 100;
            if (paymentMethod !== 'cash' && paymentMethod !== 'credit') {
                showToast('Choose whether to pay by bank now or use supplier credit.', 'error');
                return;
            }
            if (paymentMethod === 'cash' && state.actualBank < totalCost) {
                showToast('Not enough bank funds for this order. Choose supplier credit or reduce the quantity.', 'error');
                return;
            }
            const availableCapacity = Math.max(0, state.storageCapacity - getStorageUsed() - getPendingInventoryQuantity());
            if (qty > availableCapacity) {
                showToast(`The order exceeds backroom capacity. Only ${availableCapacity} units of space remain after pending deliveries.`, 'error');
                return;
            }

            // Generate source document for Inbox
            const isCredit = paymentMethod === 'credit';
            const docType = isCredit ? 'Invoice (Original)' : 'Cash Bill (Original)';
            const dueDay = state.day + supplier.creditDays;
            const arrivalDay = state.day + 1;
            const docDesc = `Ordered ${qty} units of ${state.activeOrderItem.name.split('(')[0].trim()} from ${supplier.name} at ${formatMoney(unitPrice)} each. Delivery expected Day ${arrivalDay}. ${isCredit ? `Payment due Day ${dueDay} (${supplier.terms}).` : 'Paid by bank when ordered.'}`;
            
            const newDoc = {
                id: `INV-${state.docCounter++}`,
                date: state.day,
                type: docType,
                amount: totalCost,
                desc: docDesc,
                rawType: isCredit ? 'purchase_credit' : 'purchase_cash',
                supplierName: supplier.name,
                itemId: state.activeOrderItem.id,
                itemName: state.activeOrderItem.name.split('(')[0].trim(),
                unitPrice,
                quantity: qty,
                supplierId: supplier.id,
                supplierTerms: isCredit ? supplier.terms : null,
                dueDay: isCredit ? dueDay : null
            };

            state.pendingInventoryDeliveries.push({
                itemId: state.activeOrderItem.id,
                quantity: qty,
                supplierName: supplier.name,
                arrivalDay
            });
            state.inbox.push(newDoc);
            if (isCredit) {
                state.supplierInvoices.push({
                    id: newDoc.id,
                    supplierName: supplier.name,
                    itemName: newDoc.itemName,
                    quantity: qty,
                    amount: totalCost,
                    terms: supplier.terms,
                    dueDay,
                    paid: false
                });
            }
            
            if (!isCredit) {
                state.actualBank -= totalCost; 
            }

            logEvent(`Stock ordered: ${qty} × ${state.activeOrderItem.name.split('(')[0].trim()} from ${supplier.name} for ${formatMoney(totalCost)}. Delivery expected Day ${arrivalDay}${isCredit ? `; payment due Day ${dueDay}` : ', paid by bank'}.`);
            showToast(isCredit ? `Credit order placed. Delivery expected Day ${arrivalDay}; ${formatMoney(totalCost)} due Day ${dueDay}.` : `Order paid by bank. Delivery expected Day ${arrivalDay}.`);
            
            updateUI();
            closeInventoryModal();
            consumeShopPurchaseTime();
            updateUI();
        }

        function paySupplierInvoice(invoiceId) {
            const invoice = state.supplierInvoices.find(item => item.id === invoiceId && !item.paid);
            if (!invoice) {
                showToast('This supplier invoice is already paid or no longer available.', 'error');
                return;
            }
            if (state.actualBank < invoice.amount) {
                showToast(`Not enough bank funds. You need ${formatMoney(invoice.amount)} to pay this invoice.`, 'error');
                return;
            }
            invoice.paid = true;
            invoice.paidDay = state.day;
            state.actualBank -= invoice.amount;
            const paymentDoc = {
                id: `PAY-${state.docCounter++}`,
                date: state.day,
                type: 'Cheque Butt (Original)',
                amount: invoice.amount,
                desc: `Paid supplier invoice ${invoice.id} to ${invoice.supplierName} by bank cheque.`,
                rawType: 'supplier_payment',
                supplierName: invoice.supplierName,
                itemName: `Payment for ${invoice.itemName}`,
                unitPrice: invoice.amount,
                quantity: 1,
                invoiceId: invoice.id
            };
            state.inbox.push(paymentDoc);
            logEvent(`Paid ${invoice.supplierName} ${formatMoney(invoice.amount)} by bank for invoice ${invoice.id}. A cheque butt was added to the inbox.`);
            showToast('Supplier invoice paid. Record the cheque butt in the Cash Book.', 'success');
            updateUI();
        }

        function escapeDocumentText(value) {
            return String(value).replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        function openDocument(doc) {
            state.activeDoc = doc;
            const viewer = document.getElementById('doc-viewer');
            const content = document.getElementById('doc-content');
            const safe = escapeDocumentText;
            const isReceipt = doc.type.includes('Receipt') || doc.rawType === 'sale_cash_summary';
            const isReturn = doc.type.includes('Credit Note') || doc.type.includes('Refund');
            const internalSummary = doc.rawType === 'sale_cash_summary';
            const incomingSupplierDocument = doc.rawType === 'purchase_credit' || doc.rawType === 'purchase_cash';
            const supplierPayment = doc.rawType === 'supplier_payment';
            const issuer = incomingSupplierDocument ? doc.supplierName : 'Zen Bookstore';
            const recipientLabel = incomingSupplierDocument
                ? 'Billed to'
                : supplierPayment
                    ? 'Payee'
                : internalSummary
                    ? 'Record type'
                    : (doc.customerName ? 'Customer' : 'Payee');
            const recipient = incomingSupplierDocument
                ? 'Zen Bookstore'
                : supplierPayment
                    ? doc.supplierName
                : (doc.customerName || (internalSummary ? 'Walk-in cash sales' : 'Not stated'));
            const supplier = state.suppliers.find(item => item.name === doc.supplierName);
            const supplierInvoice = state.supplierInvoices.find(item => item.id === doc.id);
            const terms = doc.rawType === 'purchase_credit'
                ? doc.supplierTerms || (supplier ? supplier.terms : null)
                : null;

            let description = doc.itemName || doc.desc;
            let quantity = doc.quantity || 1;
            let unitPrice = doc.unitPrice || doc.amount;
            if (doc.rawType === 'sale_cash_summary') {
                description = `Walk-in cash sales (${doc.receiptIds.length} receipts)`;
                quantity = doc.receiptIds.length;
                unitPrice = doc.amount / quantity;
            }

            const line = `
                <tr>
                    <td>${safe(description)}</td>
                    <td class="document-number">${quantity}</td>
                    <td class="document-money">${unitPrice.toFixed(2)}</td>
                    <td class="document-money">${doc.amount.toFixed(2)}</td>
                </tr>
            `;
            const detail = doc.itemName
                ? `<p class="document-detail">${safe(doc.desc)}</p>`
                : '';
            const footerLabel = internalSummary ? 'Prepared by' : isReceipt ? 'Received by' : 'Authorised by';
            const acknowledgementLabel = internalSummary
                ? 'Source records'
                : isReceipt
                    ? 'Received from'
                    : 'Acknowledged by';
            const sourceLabel = internalSummary
                ? 'INTERNAL SUMMARY'
                : doc.type.includes('(Copy)')
                    ? 'CUSTOMER COPY'
                    : 'ORIGINAL';
            const totalLabel = isReturn
                ? 'Total credit / refund'
                : isReceipt
                    ? 'Total received'
                    : doc.rawType === 'purchase_credit'
                        ? 'Total payable'
                        : doc.rawType === 'purchase_cash'
                            ? 'Total paid'
                            : 'Total amount';
            const paymentNote = terms
                ? `<div><span>${doc.rawType === 'purchase_credit' ? 'Credit terms' : 'Supplier terms'}</span><strong>${safe(terms)}</strong></div>
                   ${doc.dueDay ? `<div><span>Payment due</span><strong>Day ${safe(doc.dueDay)}</strong></div>` : ''}
                   ${supplierInvoice ? `<div><span>Invoice status</span><strong>${supplierInvoice.paid ? `Paid Day ${safe(supplierInvoice.paidDay)}` : 'Outstanding'}</strong></div>` : ''}`
                : '';
            const rentPaymentChoice = doc.billType === 'rent'
                ? `<div class="mt-4 rounded border border-gray-300 bg-gray-50 p-3 text-sm">
                    <strong class="block mb-2">How will you settle this bill?</strong>
                    <label class="flex items-center gap-2 mb-2 cursor-pointer">
                        <input type="radio" name="rent-payment" value="bank" ${doc.paymentMethod !== 'credit' ? 'checked' : ''} onchange="selectRentPaymentMethod(this.value)">
                        <span>Pay by Bank / cheque</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="rent-payment" value="credit" ${doc.paymentMethod === 'credit' ? 'checked' : ''} onchange="selectRentPaymentMethod(this.value)">
                        <span>On credit (Unpaid Rent)</span>
                    </label>
                    <p class="mt-2 text-xs text-gray-600">Credit records Rent Expense now and adds the amount owed to Unpaid Rent without reducing your bank balance.</p>
                </div>`
                : '';

            content.innerHTML = `
                <article class="official-document">
                    <header class="document-heading">
                        <div>
                            <p class="document-kicker">BUSINESS DOCUMENT</p>
                            <h2>${safe(issuer.toUpperCase())}</h2>
                            <p class="document-address">Stationery &amp; Books</p>
                        </div>
                        <div class="document-type-block">
                            <span class="document-copy">${sourceLabel}</span>
                            <h3>${safe(doc.type.replace(/\s*\((Original|Copy)\)/i, ''))}</h3>
                            <span class="document-reference">No. ${safe(doc.id)}</span>
                        </div>
                    </header>
                    <div class="document-meta">
                        <div><span>Document date</span><strong>May ${safe(doc.date)}, Year 1</strong></div>
                        <div><span>${recipientLabel}</span><strong>${safe(recipient)}</strong></div>
                        ${paymentNote}
                    </div>
                    <table class="document-lines">
                        <thead><tr><th>Description</th><th class="document-number">Qty</th><th class="document-money">Unit price</th><th class="document-money">Amount (RM)</th></tr></thead>
                        <tbody>${line}</tbody>
                    </table>
                    ${detail}
                    <div class="document-total"><span>${totalLabel} (RM)</span><strong>${doc.amount.toFixed(2)}</strong></div>
                    <p class="document-amount-words">All amounts are stated in Malaysian ringgit (RM).</p>
                    <div class="document-note"><strong>Remarks</strong><span>${safe(doc.desc)}</span></div>
                    ${rentPaymentChoice}
                    <footer class="document-footer">
                        <div><span>${footerLabel}</span><i></i><small>${safe(issuer)}</small></div>
                        <div><span>${acknowledgementLabel}</span><i></i><small>${internalSummary ? `${doc.receiptIds.length} source receipts` : safe(recipient)}</small></div>
                    </footer>
                    <p class="document-legal">This document is issued for bookkeeping and transaction reference.</p>
                </article>
            `;
            viewer.classList.remove('hidden');
            viewer.classList.add('flex');
        }

        function selectRentPaymentMethod(paymentMethod) {
            if (!state.activeDoc || state.activeDoc.billType !== 'rent') return;
            state.activeDoc.paymentMethod = paymentMethod;
        }

        function checkBalance() {
            showToast('Trial Balance Check: All accounts logged accurately so far!', 'success');
        }

        window.addEventListener('keydown', event => {
            const saveMenu = document.getElementById('save-menu');
            if (saveMenu && !saveMenu.classList.contains('hidden')) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeSaveMenu();
                    return;
                }
                if (event.key === 'Tab') {
                    const focusable = Array.from(saveMenu.querySelectorAll('button:not(:disabled)'))
                        .filter(element => !element.hidden && element.offsetParent !== null);
                    if (!focusable.length) return;
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (event.shiftKey && (document.activeElement === first || document.activeElement === saveMenu.querySelector('[role="dialog"]'))) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
                return;
            }
            const managementTabs = ['overview', 'stock', 'shelves', 'shop'];
            if (event.target instanceof HTMLElement && event.target.closest('.management-tabs') &&
                ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                const currentIndex = managementTabs.indexOf(state.activeManagementTab);
                const nextIndex = event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                        ? managementTabs.length - 1
                        : (currentIndex + (event.key === 'ArrowRight' ? 1 : managementTabs.length - 1)) % managementTabs.length;
                switchManagementTab(managementTabs[nextIndex]);
                document.getElementById(`management-tab-${managementTabs[nextIndex]}`).focus();
                return;
            }
            const customerModal = document.getElementById('customer-event-modal');
            if (customerModal && !customerModal.classList.contains('hidden')) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    return;
                }
                if (event.key === 'Tab') {
                    const choices = Array.from(customerModal.querySelectorAll('button:not(:disabled)'));
                    if (!choices.length) return;
                    const first = choices[0];
                    const last = choices[choices.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
                return;
            }
            const modal = document.getElementById('inventory-modal');
            if (modal && !modal.classList.contains('hidden')) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeInventoryModal();
                    return;
                }
                if (event.key === 'Tab') {
                    const focusable = Array.from(modal.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'))
                        .filter(element => element.offsetParent !== null);
                    if (focusable.length === 0) return;
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal.querySelector('[role="dialog"]'))) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
                return;
            }
            if (event.key === 'Escape' && !document.getElementById('doc-viewer').classList.contains('hidden')) {
                closeDocument();
                return;
            }
            if (event.key === 'Escape' && state.activeLeftTab === 'management' && window.matchMedia('(max-width: 767px)').matches) {
                switchLeftTab('shop');
            }
        });

        window.onload = function() {
            renderOpeningJournal();
            openSaveMenu(true);
        };
        window.addEventListener('pagehide', saveActiveGame);
