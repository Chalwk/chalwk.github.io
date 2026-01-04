/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Bills & Invoice Tracker - JavaScript
*/

const defaultData = {
    incomeStreams: [],
    weeklyBills: [],
    biWeeklyBills: [],
    monthlyBills: [],
    invoices: [],
    affordabilityItems: []
};

function loadData() {
    const savedData = localStorage.getItem('billsTrackerData');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        return {
            incomeStreams: parsed.incomeStreams || defaultData.incomeStreams,
            weeklyBills: parsed.weeklyBills || defaultData.weeklyBills,
            biWeeklyBills: parsed.biWeeklyBills || defaultData.biWeeklyBills,
            monthlyBills: parsed.monthlyBills || defaultData.monthlyBills,
            invoices: parsed.invoices || defaultData.invoices,
            affordabilityItems: parsed.affordabilityItems || defaultData.affordabilityItems
        };
    }
    return { ...defaultData };
}

function saveData() {
    const dataToSave = {
        incomeStreams,
        weeklyBills,
        biWeeklyBills,
        monthlyBills,
        invoices,
        affordabilityItems,
        lastSaved: new Date().toISOString(),
        version: '1.0'
    };
    localStorage.setItem('billsTrackerData', JSON.stringify(dataToSave));
}

let { incomeStreams, weeklyBills, biWeeklyBills, monthlyBills, invoices, affordabilityItems } = loadData();

const weeklyIncomeEl = document.getElementById('weekly-income');
const weeklyExpensesEl = document.getElementById('weekly-expenses');
const remainingBalanceEl = document.getElementById('remaining-balance');
const monthlyAverageEl = document.getElementById('monthly-average');

const weeklyBillsTable = document.getElementById('weekly-bills-table').querySelector('tbody');
const monthlyBillsTable = document.getElementById('monthly-bills-table').querySelector('tbody');
const invoicesContainer = document.getElementById('invoices-container');
const incomeStreamsTable = document.getElementById('income-streams-table').querySelector('tbody');
const affordabilityTable = document.getElementById('affordability-table').querySelector('tbody');

const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

const billModal = document.getElementById('bill-modal');
const invoiceModal = document.getElementById('invoice-modal');
const paymentModal = document.getElementById('payment-modal');
const incomeModal = document.getElementById('income-modal');
const affordabilityModal = document.getElementById('affordability-modal');

const billForm = document.getElementById('bill-form');
const invoiceForm = document.getElementById('invoice-form');
const paymentForm = document.getElementById('payment-form');
const incomeForm = document.getElementById('income-form');
const affordabilityForm = document.getElementById('affordability-form');

const togglePaidInvoicesBtn = document.getElementById('toggle-paid-invoices');
const importFileInput = document.getElementById('import-file');
let showPaidInvoices = false;

function calculateInvoiceBalance(invoice) {
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return invoice.total - totalPaid;
}

function calculateTotalWeeklyIncome() {
    const now = new Date();
    let total = 0;
    let oneOffTotal = 0;

    incomeStreams.forEach(income => {
        if (income.status === "ended") return;

        if (income.startDate && new Date(income.startDate) > now) return;
        if (income.endDate && new Date(income.endDate) < now) {
            income.status = "ended";
            return;
        }

        if (income.isOneOff) {
            oneOffTotal += income.amount;
        } else {
            switch (income.frequency) {
                case "Weekly":
                    total += income.amount;
                    break;
                case "Fortnightly":
                    total += income.amount / 2;
                    break;
                case "Monthly":
                    total += income.amount / 4.33;
                    break;
                case "Yearly":
                    total += income.amount / 52;
                    break;
            }
        }
    });

    return { recurring: total, oneOff: oneOffTotal };
}

function attachIncomeEventListeners() {
    document.querySelectorAll('.edit-income').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            editIncome(id);
        });
    });

    document.querySelectorAll('.delete-income').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteIncome(id);
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    updateCalculations();
    renderWeeklyBills();
    renderMonthlyBills();
    renderInvoices();
    renderIncomeStreams();
    renderAffordabilityItems();
    setupEventListeners();

    switchTab('income');
});

function setupEventListeners() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    document.getElementById('add-weekly-bill').addEventListener('click', () => openBillModal('weekly'));
    document.getElementById('add-monthly-bill').addEventListener('click', () => openBillModal('monthly'));
    document.getElementById('add-invoice').addEventListener('click', () => openInvoiceModal());
    document.getElementById('add-income').addEventListener('click', () => openIncomeModal());
    document.getElementById('add-affordability-item').addEventListener('click', () => openAffordabilityModal());

    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('import-data').addEventListener('click', () => importFileInput.click());
    document.getElementById('reset-data').addEventListener('click', resetToDefault);

    importFileInput.addEventListener('change', importData);

    document.getElementById('close-modal').addEventListener('click', closeBillModal);
    document.getElementById('close-invoice-modal').addEventListener('click', closeInvoiceModal);
    document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('close-income-modal').addEventListener('click', closeIncomeModal);
    document.getElementById('close-affordability-modal').addEventListener('click', closeAffordabilityModal);

    document.getElementById('cancel-bill').addEventListener('click', closeBillModal);
    document.getElementById('cancel-invoice').addEventListener('click', closeInvoiceModal);
    document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
    document.getElementById('cancel-income').addEventListener('click', closeIncomeModal);
    document.getElementById('cancel-affordability').addEventListener('click', closeAffordabilityModal);

    billForm.addEventListener('submit', saveBill);
    invoiceForm.addEventListener('submit', saveInvoice);
    paymentForm.addEventListener('submit', savePayment);
    incomeForm.addEventListener('submit', saveIncome);
    affordabilityForm.addEventListener('submit', saveAffordabilityItem);

    if (togglePaidInvoicesBtn) {
        togglePaidInvoicesBtn.addEventListener('click', togglePaidInvoices);
    }

    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = '../../index.html';
    });
}

function switchTab(tabId) {
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    tabContents.forEach(content => {
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function updateCalculations() {
    const incomeData = calculateTotalWeeklyIncome();
    const totalWeeklyIncome = incomeData.recurring;

    const weeklyExpensesFromWeeklyBills = weeklyBills.reduce((total, bill) => {
        return total + (bill.frequency === "Weekly" ? bill.amount : 0);
    }, 0);

    const weeklyExpensesFromBiWeeklyBills = weeklyBills.reduce((total, bill) => {
        return total + (bill.frequency === "Bi-weekly" ? bill.amount / 2 : 0);
    }, 0);

    const weeklyExpensesFromMonthlyBills = monthlyBills.reduce((total, bill) => {
        if (bill.paymentMethod === 'automatic' && !bill.weeklyCovered) {
            return total + (bill.amount / 4.33);
        }
        return total;
    }, 0);

    const totalWeeklyExpenses = weeklyExpensesFromWeeklyBills +
    weeklyExpensesFromBiWeeklyBills +
    weeklyExpensesFromMonthlyBills;

    weeklyIncomeEl.textContent = `$${totalWeeklyIncome.toFixed(2)}`;
    weeklyExpensesEl.textContent = `$${totalWeeklyExpenses.toFixed(2)}`;

    const remainingBalance = totalWeeklyIncome + incomeData.oneOff - totalWeeklyExpenses;
    remainingBalanceEl.textContent = `$${remainingBalance.toFixed(2)}`;

    if (remainingBalance >= 0) {
        remainingBalanceEl.className = 'stat positive';
    } else {
        remainingBalanceEl.className = 'stat negative';
    }

    const totalMonthlyExpenses = (weeklyExpensesFromWeeklyBills +
    weeklyExpensesFromBiWeeklyBills +
    weeklyExpensesFromMonthlyBills) * 4.33;
    monthlyAverageEl.textContent = `$${totalMonthlyExpenses.toFixed(2)}`;

    checkIncomeStreamsStatus();
    saveData();
}

function renderWeeklyBills() {
    weeklyBillsTable.innerHTML = '';

    const allBills = [...weeklyBills, ...biWeeklyBills].sort((a, b) => a.id - b.id);

    if (allBills.length === 0) {
        weeklyBillsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div>No weekly bills added yet</div>
                </td>
            </tr>
        `;
        return;
    }

    allBills.forEach(bill => {
        const weeklyAmount = bill.frequency === "Bi-weekly" ?
        `$${bill.amount.toFixed(2)} ($${(bill.amount/2).toFixed(2)}/week)` :
        `$${bill.amount.toFixed(2)}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bill.name}</td>
            <td>${weeklyAmount}</td>
            <td>${bill.frequency}</td>
            <td>${bill.day}</td>
            <td>${bill.notes}</td>
            <td class="actions">
                <button class="btn btn-warning btn-sm edit-bill" data-id="${bill.id}" data-type="weekly" data-frequency="${bill.frequency}">Edit</button>
                <button class="btn btn-danger btn-sm delete-bill" data-id="${bill.id}" data-type="weekly" data-frequency="${bill.frequency}">Delete</button>
            </td>
        `;

        row.addEventListener('dblclick', () => editBill(bill.id, 'weekly', bill.frequency));
        weeklyBillsTable.appendChild(row);
    });

    attachBillEventListeners();
    saveData();
}

function renderMonthlyBills() {
    monthlyBillsTable.innerHTML = '';

    if (monthlyBills.length === 0) {
        monthlyBillsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div>No monthly bills added yet</div>
                </td>
            </tr>
        `;
        return;
    }

    monthlyBills.forEach(bill => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bill.name}</td>
            <td>$${typeof bill.amount === 'number' ? bill.amount.toFixed(2) : bill.amount}</td>
            <td>${bill.frequency}</td>
            <td>${bill.day}</td>
            <td>${bill.notes}</td>
            <td class="actions">
                <button class="btn btn-warning btn-sm edit-bill" data-id="${bill.id}" data-type="monthly">Edit</button>
                <button class="btn btn-danger btn-sm delete-bill" data-id="${bill.id}" data-type="monthly">Delete</button>
            </td>
        `;

        row.addEventListener('dblclick', () => editBill(bill.id, 'monthly'));

        monthlyBillsTable.appendChild(row);
    });

    attachBillEventListeners();
    saveData();
}

function attachBillEventListeners() {
    document.querySelectorAll('.edit-bill').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const type = e.target.getAttribute('data-type');
            editBill(id, type);
        });
    });

    document.querySelectorAll('.delete-bill').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const type = e.target.getAttribute('data-type');
            deleteBill(id, type);
        });
    });
}

function renderInvoices() {
    invoicesContainer.innerHTML = '';

    if (invoices.length === 0) {
        invoicesContainer.innerHTML = `
            <div class="empty-state">
                <div>No invoices added yet</div>
            </div>
        `;
        return;
    }

    invoices.forEach(invoice => {
        const balance = calculateInvoiceBalance(invoice);
        const isPaid = balance <= 0;
        const invoiceEl = document.createElement('div');
        invoiceEl.className = `card invoice-card ${isPaid ? 'paid' : ''}`;
        invoiceEl.innerHTML = `
            <div class="invoice-header">
                <h2>Invoice: ${invoice.number}</h2>
                ${isPaid ? '<span class="paid-badge">PAID</span>' : ''}
            </div>
            <p><strong>Total:</strong> $${invoice.total.toFixed(2)}</p>
            <p><strong>Balance Owing:</strong> $${balance.toFixed(2)}</p>

            <div class="toolbar">
                <h3>Payments</h3>
                <button class="btn btn-primary btn-sm add-payment" data-id="${invoice.id}">
                    Add Payment
                </button>
            </div>

            <div class="invoice-payments">
                ${invoice.payments.length > 0 ?
                    invoice.payments.map(payment => `
                        <div class="payment-row">
                            <span>${formatDate(payment.date)}</span>
                            <span>$${payment.amount.toFixed(2)}</span>
                        </div>
                    `).join('') :
                    '<p>No payments recorded</p>'
                }
            </div>

            <div class="actions" style="margin-top: 15px;">
                <button class="btn btn-warning btn-sm edit-invoice" data-id="${invoice.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-invoice" data-id="${invoice.id}">Delete</button>
            </div>
        `;

        invoiceEl.addEventListener('dblclick', () => editInvoice(invoice.id));

        invoicesContainer.appendChild(invoiceEl);
    });

    attachInvoiceEventListeners();
    saveData();
}

function attachInvoiceEventListeners() {
    document.querySelectorAll('.edit-invoice').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            editInvoice(id);
        });
    });

    document.querySelectorAll('.delete-invoice').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteInvoice(id);
        });
    });

    document.querySelectorAll('.add-payment').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            openPaymentModal(id);
        });
    });
}

function spendOneOffIncome(id) {
    const income = incomeStreams.find(i => i.id === id);
    if (!income || !income.isOneOff) return;

    const spendAmount = prompt(`How much do you want to spend from ${income.name}? Current amount: $${income.amount.toFixed(2)}`);
    const amount = parseFloat(spendAmount);

    if (isNaN(amount) || amount <= 0 || amount > income.amount) {
        alert('Please enter a valid amount');
        return;
    }

    income.amount -= amount;

    if (income.amount <= 0) {
        income.amount = 0;
        income.status = 'ended';
    }

    updateCalculations();
    renderIncomeStreams();
    saveData();
}

function renderIncomeStreams() {
    incomeStreamsTable.innerHTML = '';

    if (incomeStreams.length === 0) {
        incomeStreamsTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div>No income streams added yet</div>
                </td>
            </tr>
        `;
        return;
    }

    incomeStreams.forEach(income => {
        const row = document.createElement('tr');
        const statusClass = income.status === 'active' ? 'status-active' : 'status-ended';
        const statusText = income.isOneOff ?
        (income.amount > 0 ? 'Active' : 'Ended') :
        income.status;

        row.innerHTML = `
            <td>${income.name}</td>
            <td>$${income.amount.toFixed(2)}</td>
            <td>${income.frequency}</td>
            <td>${income.startDate ? formatDate(income.startDate) : '-'}</td>
            <td>${income.endDate ? formatDate(income.endDate) : '-'}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>${income.notes || '-'}</td>
            <td class="actions">
                <button class="btn btn-warning btn-sm edit-income" data-id="${income.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-income" data-id="${income.id}">Delete</button>
                ${income.isOneOff && income.amount > 0 ?
                    `<button class="btn btn-info btn-sm spend-oneoff" data-id="${income.id}">Spend</button>` :
                    ''}
            </td>
        `;

        row.addEventListener('dblclick', () => editIncome(income.id));
        incomeStreamsTable.appendChild(row);
    });

    document.querySelectorAll('.spend-oneoff').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            spendOneOffIncome(id);
        });
    });

    attachIncomeEventListeners();
    saveData();
}

function renderAffordabilityItems() {
    affordabilityTable.innerHTML = '';

    if (affordabilityItems.length === 0) {
        affordabilityTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div>No affordability items added yet</div>
                </td>
            </tr>
        `;
        return;
    }

    affordabilityItems.forEach(item => {
        const row = document.createElement('tr');

        const remainingBalanceText = remainingBalanceEl.textContent;
        const remainingBalance = parseFloat(remainingBalanceText.replace('$', ''));

        let weeklyNeeded, displayTimeframe;

        if (item.timeframe === 0) {
            if (remainingBalance > 0) {
                weeklyNeeded = remainingBalance;
                displayTimeframe = Math.ceil((item.totalCost - item.deposit) / weeklyNeeded) + ' weeks (auto)';
            } else {
                weeklyNeeded = 0;
                displayTimeframe = 'Not affordable';
            }
        } else {
            weeklyNeeded = (item.totalCost - item.deposit) / (item.timeframe !== undefined ? item.timeframe : 52);
            displayTimeframe = (item.timeframe !== undefined ? item.timeframe : 52) + ' weeks';
        }

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.description || '-'}</td>
            <td>$${item.totalCost.toFixed(2)}</td>
            <td>$${item.deposit.toFixed(2)}</td>
            <td>$${weeklyNeeded.toFixed(2)}</td>
            <td>${displayTimeframe}</td>
            <td class="${item.analyzed ? 'affordable' : 'not-analyzed'}">
                ${item.analyzed ?
                    (weeklyNeeded <= remainingBalance ? 'Affordable ✓' : 'Not Affordable ✗') :
                    'Not Analyzed'}
            </td>
            <td class="actions">
                <button class="btn btn-info btn-sm analyze-item" data-id="${item.id}">Analyze</button>
                <button class="btn btn-warning btn-sm edit-affordability" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-affordability" data-id="${item.id}">Delete</button>
            </td>
        `;

        row.addEventListener('dblclick', () => editAffordabilityItem(item.id));

        affordabilityTable.appendChild(row);
    });

    document.querySelectorAll('.edit-affordability').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            editAffordabilityItem(id);
        });
    });

    document.querySelectorAll('.delete-affordability').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteAffordabilityItem(id);
        });
    });

    document.querySelectorAll('.analyze-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            analyzeAffordabilityItem(id);
        });
    });

    saveData();
}

function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function togglePaidInvoices() {
    showPaidInvoices = !showPaidInvoices;
    const paidInvoices = document.querySelectorAll('.invoice-card.paid');

    if (showPaidInvoices) {
        paidInvoices.forEach(invoice => invoice.style.display = 'block');
        togglePaidInvoicesBtn.textContent = 'Hide Paid Invoices';
    } else {
        paidInvoices.forEach(invoice => invoice.style.display = 'none');
        togglePaidInvoicesBtn.textContent = 'Show Paid Invoices';
    }
}

function analyzeAffordabilityItem(id) {
    const item = affordabilityItems.find(i => i.id === id);
    if (!item) return;

    const remainingBalanceText = remainingBalanceEl.textContent;
    const remainingBalance = parseFloat(remainingBalanceText.replace('$', ''));

    let weeklyNeeded, timeframeMessage;

    if (item.timeframe === 0) {
        if (remainingBalance > 0) {
            weeklyNeeded = remainingBalance;
            const calculatedWeeks = Math.ceil((item.totalCost - item.deposit) / weeklyNeeded);
            timeframeMessage = `Auto-calculated timeframe: ${calculatedWeeks} weeks`;
        } else {
            weeklyNeeded = 0;
            timeframeMessage = 'Not affordable with current balance';
        }
    } else {
        weeklyNeeded = (item.totalCost - item.deposit) / (item.timeframe !== undefined ? item.timeframe : 52);
        timeframeMessage = `Timeframe: ${item.timeframe !== undefined ? item.timeframe : 52} weeks`;
    }

    item.analyzed = true;
    item.weeklyPayment = weeklyNeeded;

    let message = `Analysis for ${item.name}:\n`;
    message += `Total Cost: $${item.totalCost.toFixed(2)}\n`;
    message += `Deposit: $${item.deposit.toFixed(2)}\n`;
    message += `Remaining Weekly Balance: $${remainingBalance.toFixed(2)}\n`;
    message += `Weekly Payment Needed: $${weeklyNeeded.toFixed(2)}\n`;
    message += `${timeframeMessage}\n\n`;

    if (weeklyNeeded <= remainingBalance) {
        message += '✅ This item is AFFORDABLE with your current budget!';
    } else {
        message += '❌ This item is NOT AFFORDABLE with your current budget.';
        if (remainingBalance > 0) {
            const additionalNeeded = weeklyNeeded - remainingBalance;
            message += `\nYou need an additional $${additionalNeeded.toFixed(2)} per week.`;
        } else {
            message += `\nYou have no remaining weekly balance.`;
        }
    }

    alert(message);
    renderAffordabilityItems();
    saveData();
}

function openBillModal(type, id = null) {
    document.getElementById('modal-title').textContent = id ? 'Edit Bill' : 'Add Bill';
    document.getElementById('bill-type').value = type;
    document.getElementById('bill-id').value = id || '';

    if (id) {
        const bill = type === 'weekly'
            ? weeklyBills.find(b => b.id === id)
            : monthlyBills.find(b => b.id === id);

        document.getElementById('bill-name').value = bill.name;
        document.getElementById('bill-amount').value = typeof bill.amount === 'number' ? bill.amount : '';
        document.getElementById('bill-frequency').value = bill.frequency;
        document.getElementById('bill-day').value = bill.day;
        document.getElementById('bill-notes').value = bill.notes;
    } else {
        document.getElementById('bill-form').reset();
        document.getElementById('bill-frequency').value = type === 'weekly' ? 'Weekly' : 'Monthly';
    }

    billModal.style.display = 'flex';
}

function closeBillModal() {
    billModal.style.display = 'none';
}

function saveBill(e) {
    e.preventDefault();

    const id = document.getElementById('bill-id').value;
    const type = document.getElementById('bill-type').value;
    const name = document.getElementById('bill-name').value;
    const amount = document.getElementById('bill-amount').value;
    const frequency = document.getElementById('bill-frequency').value;
    const day = document.getElementById('bill-day').value;
    const notes = document.getElementById('bill-notes').value;

    const billData = {
        name,
        amount: amount === 'Varies' ? 'Varies' : parseFloat(amount),
        frequency,
        day,
        notes
    };

    if (id) {
        if (type === 'weekly') {
            if (frequency === "Bi-weekly") {
                const index = biWeeklyBills.findIndex(b => b.id === parseInt(id));
                if (index !== -1) {
                    biWeeklyBills[index] = { ...biWeeklyBills[index], ...billData };
                }
            } else {
                const index = weeklyBills.findIndex(b => b.id === parseInt(id));
                if (index !== -1) {
                    weeklyBills[index] = { ...weeklyBills[index], ...billData };
                }
            }
        } else {
            const index = monthlyBills.findIndex(b => b.id === parseInt(id));
            if (index !== -1) {
                monthlyBills[index] = { ...monthlyBills[index], ...billData };
            }
        }
    } else {
        const newId = Math.max(...[...weeklyBills, ...monthlyBills, ...biWeeklyBills].map(b => b.id), 0) + 1;
        billData.id = newId;

        if (type === 'weekly') {
            if (frequency === "Bi-weekly") {
                biWeeklyBills.push(billData);
            } else {
                weeklyBills.push(billData);
            }
        } else {
            monthlyBills.push(billData);
        }
    }

    closeBillModal();
    updateCalculations();
    renderWeeklyBills();
    saveData();
}

function checkIncomeStreamsStatus() {
    const now = new Date();
    let updated = false;

    incomeStreams.forEach(income => {
        if (!income.isOneOff && income.status === 'active' && income.endDate) {
            if (new Date(income.endDate) < now) {
                income.status = 'ended';
                updated = true;
            }
        }
        if (income.isOneOff && income.amount <= 0 && income.status !== 'ended') {
            income.status = 'ended';
            updated = true;
        }
    });

    if (updated) {
        updateCalculations();
        renderIncomeStreams();
        saveData();
    }
}

function editBill(id, type) {
    openBillModal(type, id);
}

function deleteBill(id, type) {
    if (confirm('Are you sure you want to delete this bill?')) {
        if (type === 'weekly') {
            weeklyBills = weeklyBills.filter(b => b.id !== id);
            renderWeeklyBills();
        } else {
            monthlyBills = monthlyBills.filter(b => b.id !== id);
            renderMonthlyBills();
        }
        updateCalculations();
        saveData();
    }
}

function openIncomeModal(id = null) {
    document.getElementById('income-modal-title').textContent = id ? 'Edit Income Stream' : 'Add Income Stream';
    document.getElementById('income-id').value = id || '';

    const frequencySelect = document.getElementById('income-frequency');
    frequencySelect.innerHTML = `
        <option value="Weekly">Weekly</option>
        <option value="Fortnightly">Fortnightly</option>
        <option value="Monthly">Monthly</option>
        <option value="Yearly">Yearly</option>
        <option value="One-off">One-off</option>
    `;

    if (id) {
        const income = incomeStreams.find(i => i.id === parseInt(id));
        if (income) {
            document.getElementById('income-name').value = income.name;
            document.getElementById('income-amount').value = income.amount;
            frequencySelect.value = income.frequency;
            document.getElementById('income-notes').value = income.notes || '';
            document.getElementById('income-start-date').value = income.startDate || '';
            document.getElementById('income-end-date').value = income.endDate || '';

            if (income.frequency === "One-off") {
                income.isOneOff = true;
                document.getElementById('income-dates-group').style.display = 'none';
            }
        }
    } else {
        document.getElementById('income-form').reset();
        document.getElementById('income-start-date').valueAsDate = new Date();
    }

    frequencySelect.addEventListener('change', function() {
        const isOneOff = this.value === "One-off";
        document.getElementById('income-dates-group').style.display = isOneOff ? 'none' : 'flex';
    });

    incomeModal.style.display = 'flex';
}

function closeIncomeModal() {
    incomeModal.style.display = 'none';
}

function saveIncome(e) {
    e.preventDefault();

    const id = document.getElementById('income-id').value;
    const name = document.getElementById('income-name').value;
    const amount = parseFloat(document.getElementById('income-amount').value);
    const frequency = document.getElementById('income-frequency').value;
    const notes = document.getElementById('income-notes').value;
    const startDate = document.getElementById('income-start-date').value;
    const endDate = document.getElementById('income-end-date').value;

    const isOneOff = frequency === "One-off";
    const status = isOneOff ? (amount > 0 ? 'active' : 'ended') : 'active';

    if (!name || isNaN(amount) || amount <= 0) {
        alert('Please enter valid income details');
        return;
    }

    if (id) {
        const index = incomeStreams.findIndex(i => i.id === parseInt(id));
        if (index !== -1) {
            incomeStreams[index] = {
                ...incomeStreams[index],
                name,
                amount,
                frequency,
                notes,
                startDate: isOneOff ? null : startDate,
                endDate: isOneOff ? null : endDate,
                status,
                isOneOff
            };
        }
    } else {
        const newId = Math.max(...incomeStreams.map(i => i.id), 0) + 1;
        incomeStreams.push({
            id: newId,
            name,
            amount,
            frequency,
            notes,
            startDate: isOneOff ? null : startDate,
            endDate: isOneOff ? null : endDate,
            status,
            isOneOff
        });
    }

    closeIncomeModal();
    updateCalculations();
    renderIncomeStreams();
    saveData();
}

function editIncome(id) {
    openIncomeModal(id);
}

function deleteIncome(id) {
    if (confirm('Are you sure you want to delete this income stream?')) {
        incomeStreams = incomeStreams.filter(i => i.id !== id);
        updateCalculations();
        renderIncomeStreams();
        saveData();
    }
}

function openAffordabilityModal(id = null) {
    document.getElementById('affordability-modal-title').textContent =
    id ? 'Edit Affordability Item' : 'Add Affordability Item';
    document.getElementById('affordability-id').value = id || '';

    if (id) {
        const item = affordabilityItems.find(i => i.id === id);
        if (item) {
            document.getElementById('affordability-name').value = item.name;
            document.getElementById('affordability-description').value = item.description || '';
            document.getElementById('affordability-total-cost').value = item.totalCost;
            document.getElementById('affordability-deposit').value = item.deposit;
            document.getElementById('affordability-timeframe').value = item.timeframe !== undefined ? item.timeframe : 52;
        }
    } else {
        document.getElementById('affordability-form').reset();
        document.getElementById('affordability-timeframe').value = 52;
    }

    affordabilityModal.style.display = 'flex';
}

function closeAffordabilityModal() {
    affordabilityModal.style.display = 'none';
}

function saveAffordabilityItem(e) {
    e.preventDefault();

    const id = document.getElementById('affordability-id').value;
    const name = document.getElementById('affordability-name').value;
    const description = document.getElementById('affordability-description').value;
    const totalCost = parseFloat(document.getElementById('affordability-total-cost').value);
    const deposit = parseFloat(document.getElementById('affordability-deposit').value) || 0;

    const timeframeInput = document.getElementById('affordability-timeframe').value;
    let timeframe;
    if (timeframeInput === '' || isNaN(timeframeInput)) {
        timeframe = 52;
    } else {
        timeframe = parseInt(timeframeInput);
    }

    if (id) {
        const index = affordabilityItems.findIndex(i => i.id === parseInt(id));
        if (index !== -1) {
            affordabilityItems[index] = { ...affordabilityItems[index], name, description, totalCost, deposit, timeframe, analyzed: false };
        }
    } else {
        const newId = Math.max(...affordabilityItems.map(i => i.id), 0) + 1;
        affordabilityItems.push({
            id: newId,
            name,
            description,
            totalCost,
            deposit,
            weeklyPayment: 0,
            timeframe,
            analyzed: false
        });
    }

    closeAffordabilityModal();
    renderAffordabilityItems();
    saveData();
}

function editAffordabilityItem(id) {
    openAffordabilityModal(id);
}

function deleteAffordabilityItem(id) {
    if (confirm('Are you sure you want to delete this affordability item?')) {
        affordabilityItems = affordabilityItems.filter(i => i.id !== id);
        renderAffordabilityItems();
        saveData();
    }
}

function openInvoiceModal(id = null) {
    document.getElementById('invoice-modal-title').textContent = id ? 'Edit Invoice' : 'Add Invoice';
    document.getElementById('invoice-id').value = id || '';

    if (id) {
        const invoice = invoices.find(i => i.id === id);
        document.getElementById('invoice-number').value = invoice.number;
        document.getElementById('invoice-total').value = invoice.total;
    } else {
        document.getElementById('invoice-form').reset();
    }

    invoiceModal.style.display = 'flex';
}

function closeInvoiceModal() {
    invoiceModal.style.display = 'none';
}

function saveInvoice(e) {
    e.preventDefault();

    const id = document.getElementById('invoice-id').value;
    const number = document.getElementById('invoice-number').value;
    const total = parseFloat(document.getElementById('invoice-total').value);

    if (id) {
        const index = invoices.findIndex(i => i.id === parseInt(id));
        if (index !== -1) {
            invoices[index].number = number;
            invoices[index].total = total;
        }
    } else {
        const newId = Math.max(...invoices.map(i => i.id), 0) + 1;
        invoices.push({
            id: newId,
            number,
            total,
            payments: []
        });
    }

    closeInvoiceModal();
    renderInvoices();
    saveData();
}

function editInvoice(id) {
    openInvoiceModal(id);
}

function deleteInvoice(id) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        invoices = invoices.filter(i => i.id !== id);
        renderInvoices();
        saveData();
    }
}

function openPaymentModal(invoiceId) {
    document.getElementById('payment-invoice-id').value = invoiceId;
    document.getElementById('payment-form').reset();
    document.getElementById('payment-date').valueAsDate = new Date();
    paymentModal.style.display = 'flex';
}

function closePaymentModal() {
    paymentModal.style.display = 'none';
}

function savePayment(e) {
    e.preventDefault();

    const invoiceId = parseInt(document.getElementById('payment-invoice-id').value);
    const date = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);

    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
        invoice.payments.push({
            date,
            amount
        });
    }

    closePaymentModal();
    renderInvoices();
    saveData();
}

function exportData() {
    const data = {
        incomeStreams,
        weeklyBills,
        biWeeklyBills,
        monthlyBills,
        invoices,
        affordabilityItems,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `bills-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (!importedData.incomeStreams || !importedData.weeklyBills || !importedData.monthlyBills) {
                throw new Error('Invalid data format');
            }

            if (confirm('Importing data will replace your current data. Continue?')) {
                incomeStreams = importedData.incomeStreams || defaultData.incomeStreams;
                weeklyBills = importedData.weeklyBills || defaultData.weeklyBills;
                biWeeklyBills = importedData.biWeeklyBills || defaultData.biWeeklyBills;
                monthlyBills = importedData.monthlyBills || defaultData.monthlyBills;
                invoices = importedData.invoices || defaultData.invoices;
                affordabilityItems = importedData.affordabilityItems || defaultData.affordabilityItems;

                saveData();

                updateCalculations();
                renderWeeklyBills();
                renderMonthlyBills();
                renderInvoices();
                renderIncomeStreams();
                renderAffordabilityItems();

                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }

        event.target.value = '';
    };

    reader.readAsText(file);
}

function resetToDefault() {
    if (confirm('This will reset ALL data to default values. This cannot be undone. Continue?')) {
        incomeStreams = [...defaultData.incomeStreams];
        weeklyBills = [...defaultData.weeklyBills];
        biWeeklyBills = [...defaultData.biWeeklyBills];
        monthlyBills = [...defaultData.monthlyBills];
        invoices = [...defaultData.invoices];
        affordabilityItems = [...defaultData.affordabilityItems];

        saveData();

        updateCalculations();
        renderWeeklyBills();
        renderMonthlyBills();
        renderInvoices();
        renderIncomeStreams();
        renderAffordabilityItems();

        alert('Data reset to default values.');
    }
}