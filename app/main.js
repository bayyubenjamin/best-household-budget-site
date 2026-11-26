// The Linden Ledger — router, state and event wiring.
//
// State lives in one object: transactions, bills, goals and the
// allocation overrides. It starts from the dataset in data.js and is
// saved to localStorage on every change, so an added transaction, a
// paid bill, an edited envelope or a goal contribution survives a
// reload. With no stored state, the site shows the dataset exactly
// as written — every figure the spec promises.

const STORAGE_KEY = "linden-ledger-v1";

function defaultState() {
  return {
    transactions: LINDEN_DATA.transactions.map(function (t) { return { id: t.id, date: t.date, merchant: t.merchant, category: t.category, amount: t.amount }; }),
    bills: LINDEN_DATA.bills.map(function (b) { return { id: b.id, name: b.name, amount: b.amount, dueDay: b.dueDay, paid: b.paid, category: b.category }; }),
    goals: LINDEN_DATA.goals.map(function (g) { return { id: g.id, name: g.name, current: g.current, target: g.target, note: g.note }; }),
    allocations: null
  };
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const base = defaultState();
    if (Array.isArray(saved.transactions) && saved.transactions.length > 0) base.transactions = saved.transactions;
    if (Array.isArray(saved.bills) && saved.bills.length > 0) base.bills = saved.bills;
    if (Array.isArray(saved.goals) && saved.goals.length > 0) base.goals = saved.goals;
    if (saved.allocations && typeof saved.allocations === "object") base.allocations = saved.allocations;
    return base;
  } catch (e) {
    return defaultState();
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage full or unavailable (private mode): the site still
    // works for this visit; the change simply does not persist.
  }
}

const state = loadState();

// UI-only state: filters and the envelope being edited. Never saved.
const ui = {
  filters: { category: "", month: "", search: "" },
  editingId: null,
  notice: ""
};

function currentRoute() {
  const hash = window.location.hash || "#/";
  const route = hash.replace(/^#\/?/, "").split("/")[0];
  return ["transactions", "budget", "bills", "goals", "reports"].indexOf(route) >= 0 ? route : "";
}

function render() {
  const route = currentRoute();
  const app = document.getElementById("app");
  const notice = ui.notice ? '<p class="notice" role="status">' + ui.notice + '</p>' : "";
  app.innerHTML = notice + renderPage(route, state, ui);
  document.querySelectorAll(".nav a").forEach(function (a) {
    a.classList.toggle("active", a.getAttribute("data-route") === route);
  });
  window.scrollTo(0, 0);
}

function refreshTransactionList() {
  const rows = transactionRows(state, ui.filters);
  const tbody = document.getElementById("tx-rows");
  const count = document.getElementById("tx-count");
  if (tbody) tbody.innerHTML = rows.html;
  if (count) count.textContent = "Showing " + rows.count + " of " + state.transactions.length + " transactions.";
}

function flashNotice(html) {
  ui.notice = html;
  render();
  window.setTimeout(function () {
    ui.notice = "";
    const note = document.querySelector(".notice");
    if (note) note.remove();
  }, 6000);
}

function handleAction(target) {
  const action = target.getAttribute("data-action");
  if (!action) return;

  if (action === "toggle-bill") {
    const bill = state.bills.find(function (b) { return b.id === target.getAttribute("data-bill"); });
    if (!bill) return;
    bill.paid = !bill.paid;
    saveState(state);
    flashNotice("<strong>" + esc(bill.name) + "</strong> marked " + (bill.paid ? "paid" : "unpaid") + ". The dashboard and bills list are updated.");
  }

  if (action === "edit-alloc") {
    ui.editingId = target.getAttribute("data-cat");
    render();
  }

  if (action === "cancel-alloc") {
    ui.editingId = null;
    render();
  }

  if (action === "save-alloc") {
    const catId = target.getAttribute("data-cat");
    const input = document.querySelector('[data-edit-amount="' + catId + '"]');
    const value = input ? parseFloat(input.value) : NaN;
    if (isNaN(value) || value < 0) {
      flashNotice("That planned amount does not look right — please enter a number of $0 or more.");
      return;
    }
    if (!state.allocations) state.allocations = {};
    state.allocations[catId] = Math.round(value);
    ui.editingId = null;
    saveState(state);
    flashNotice("<strong>" + esc(catById(catId).name) + "</strong> is now planned at " + money(Math.round(value)) + " a month. Totals updated everywhere.");
  }

  if (action === "contribute") {
    const goalId = target.getAttribute("data-goal");
    const input = document.querySelector('[data-contrib-amount="' + goalId + '"]');
    const value = input ? parseFloat(input.value) : NaN;
    const goal = state.goals.find(function (g) { return g.id === goalId; });
    if (!goal) return;
    if (isNaN(value) || value <= 0) {
      flashNotice("Enter an amount above $0 to contribute to <strong>" + esc(goal.name) + "</strong>.");
      return;
    }
    goal.current += Math.round(value);
    saveState(state);
    flashNotice("<strong>" + money(Math.round(value)) + "</strong> added to <strong>" + esc(goal.name) + "</strong> — now " + money(goal.current) + " of " + money(goal.target) + ".");
  }
}

function boot() {
  window.addEventListener("hashchange", function () {
    ui.editingId = null;
    render();
  });

  document.getElementById("app").addEventListener("click", function (event) {
    const target = event.target.closest("[data-action]");
    if (target) handleAction(target);
  });

  document.getElementById("app").addEventListener("submit", function (event) {
    const form = event.target.closest('form[data-action="add-transaction"]');
    if (!form) return;
    event.preventDefault();
    const date = form.elements.date.value;
    const merchant = form.elements.merchant.value.trim();
    const category = form.elements.category.value;
    const amount = parseFloat(form.elements.amount.value);
    if (!date || !merchant || isNaN(amount) || amount <= 0) {
      flashNotice("Please fill in a date, a merchant and an amount above $0.");
      return;
    }
    const id = "u" + Date.now().toString(36);
    state.transactions.push({ id: id, date: date, merchant: merchant, category: category, amount: Math.round(amount * 100) / 100 });
    saveState(state);
    flashNotice("<strong>" + esc(merchant) + "</strong> — " + money(amount) + " added to <strong>" + esc(catById(category).name) + "</strong>. Totals updated everywhere.");
  });

  // Live search: the text box filters as you type. The two dropdowns
  // filter on change only — a select fires both input and change in
  // some browsers, and refreshing twice for one choice is waste.
  document.getElementById("app").addEventListener("input", function (event) {
    if (event.target.tagName !== "INPUT") return;
    const filter = event.target.getAttribute("data-filter");
    if (!filter) return;
    ui.filters[filter] = event.target.value;
    refreshTransactionList();
  });

  document.getElementById("app").addEventListener("change", function (event) {
    if (event.target.tagName !== "SELECT") return;
    const filter = event.target.getAttribute("data-filter");
    if (!filter) return;
    ui.filters[filter] = event.target.value;
    refreshTransactionList();
  });

  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
