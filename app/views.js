// The Linden Ledger — page renderers.
//
// Each view is a pure function: it takes the current state and
// returns an HTML string for one page. main.js drops the string into
// #app and wires the controls. All figures come from the state, so a
// change on one page (a new transaction, a paid bill, a contribution)
// shows up everywhere at once.

function catById(id) {
  return LINDEN_DATA.categories.find(function (c) { return c.id === id; }) ||
    { id: id, name: id, allocated: 0 };
}

function spentByCategory(state) {
  const spent = {};
  LINDEN_DATA.categories.forEach(function (c) { spent[c.id] = 0; });
  state.transactions.forEach(function (t) {
    if (spent[t.category] === undefined) spent[t.category] = 0;
    spent[t.category] += t.amount;
  });
  return spent;
}

function totals(state) {
  const spent = spentByCategory(state);
  const spentTotal = Object.keys(spent).reduce(function (a, k) { return a + spent[k]; }, 0);
  // Planned total honours per-envelope overrides and falls back to
  // the dataset's planned amount for every envelope not yet edited.
  const allocated = LINDEN_DATA.categories.reduce(function (a, c) { return a + allocationOf(state, c.id); }, 0);
  const income = LINDEN_DATA.income.total;
  return {
    income: income,
    allocated: allocated,
    spent: spentTotal,
    remaining: income - spentTotal,
    saved: spent.savings || 0,
    savingsRate: income ? ((spent.savings || 0) / income) * 100 : 0,
    spentByCat: spent
  };
}

function fmtDate(iso) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = iso.split("-");
  return months[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10);
}

function dueLabel(day) {
  const n = day;
  const last = n % 10;
  const lastTwo = n % 100;
  let suffix = "th";
  if (lastTwo !== 11 && lastTwo !== 12 && lastTwo !== 13) {
    if (last === 1) suffix = "st";
    else if (last === 2) suffix = "nd";
    else if (last === 3) suffix = "rd";
  }
  return "Nov " + n + suffix;
}

function sortedTransactions(state) {
  return state.transactions.slice().sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
}

function upcomingBills(state) {
  return state.bills
    .filter(function (b) { return !b.paid; })
    .sort(function (a, b) { return a.dueDay - b.dueDay; });
}

function allocationOf(state, catId) {
  if (state.allocations && state.allocations[catId] !== undefined) return state.allocations[catId];
  return catById(catId).allocated;
}

// ---------- Dashboard ----------

function renderDashboard(state) {
  const t = totals(state);
  const spent = t.spentByCat;
  const slices = LINDEN_DATA.categories
    .filter(function (c) { return spent[c.id] > 0; })
    .map(function (c) { return { label: c.name, value: spent[c.id], color: c.color }; });
  const bills = upcomingBills(state).slice(0, 3);
  const paidCount = state.bills.filter(function (b) { return b.paid; }).length;
  const recent = sortedTransactions(state).slice(0, 6);
  const dailySoFar = Math.round(t.spent / LINDEN_DATA.household.asOfDay);
  const dailyLeft = Math.round(t.remaining / LINDEN_DATA.household.daysLeft);
  const incomeBits = LINDEN_DATA.income.sources.map(function (s) {
    return s.label.split(" — ")[0] + " " + money(s.amount);
  }).join(" · ");

  const billRows = bills.map(function (b) {
    return '<tr><td>' + esc(b.name) + '</td><td>' + dueLabel(b.dueDay) + '</td>' +
      '<td class="num amount">' + money(b.amount) + '</td>' +
      '<td><span class="pill due">Due soon</span></td></tr>';
  }).join("");

  const recentRows = recent.map(function (tx) {
    return '<tr><td>' + fmtDate(tx.date) + '</td><td>' + esc(tx.merchant) + '</td>' +
      '<td><span class="cat-chip">' + esc(catById(tx.category).name) + '</span></td>' +
      '<td class="num amount">' + money(tx.amount) + '</td></tr>';
  }).join("");

  // "Three things to know" — every figure computed live from the
  // state, so it stays true after any edit made on the site.
  const pctSpent = Math.round((t.spent / t.income) * 100);
  const tight = LINDEN_DATA.categories
    .map(function (c) {
      const alloc = allocationOf(state, c.id);
      const sp = spent[c.id] || 0;
      return { name: c.name, alloc: alloc, spent: sp, left: alloc - sp, pct: alloc > 0 ? (sp / alloc) * 100 : 0 };
    })
    .filter(function (e) { return e.spent < e.alloc && e.alloc > 0; })
    .sort(function (a, b) { return b.pct - a.pct; })[0];
  const overdue = state.bills
    .filter(function (b) { return !b.paid && b.dueDay < LINDEN_DATA.household.asOfDay; })
    .sort(function (a, b) { return a.dueDay - b.dueDay; });
  const unpaidTotal = state.bills.filter(function (b) { return !b.paid; })
    .reduce(function (a, b) { return a + b.amount; }, 0);
  const afterBills = t.remaining - unpaidTotal;
  const afterBillsDay = Math.round(afterBills / LINDEN_DATA.household.daysLeft);

  const knowItems = [];
  if (tight) {
    knowItems.push('<li><strong>' + esc(tight.name) + ' is the tightest envelope.</strong> ' +
      money(tight.left) + ' left of ' + money(tight.alloc) + ' — ' + Math.round(tight.pct) + '% spent, with ' +
      LINDEN_DATA.household.daysLeft + ' days still to go.</li>');
  }
  if (overdue.length > 0) {
    const first = overdue[0];
    const daysOver = LINDEN_DATA.household.asOfDay - first.dueDay;
    knowItems.push('<li><strong>The ' + esc(first.name.toLowerCase()) + ' bill (' + money(first.amount) + ') is ' +
      daysOver + ' days overdue.</strong> It was due ' + dueLabel(first.dueDay) +
      (overdue.length > 1
        ? ' — and ' + (overdue.length - 1) + ' more bill' + (overdue.length - 1 > 1 ? 's are' : ' is') + ' overdue too.'
        : '.') + '</li>');
  }
  knowItems.push('<li><strong>After the bills, ' + money(afterBills) + ' is left.</strong> Pay the ' +
    money(unpaidTotal) + ' still owed and the family has about ' + money(afterBillsDay) + ' a day for the last ' +
    LINDEN_DATA.household.daysLeft + ' days.</li>');

  return '' +
    '<div class="page-head"><h1>November is ' + pctSpent + '% spent — and every dollar already has a job.</h1>' +
    '<p class="lede">The Linden family — Maya, Tom, and two kids — and where their money stands on 26 November.</p></div>' +
    '<div class="stat-grid">' +
    '<div class="stat-card"><div class="label">Income</div><div class="value">' + money(t.income) + '</div><div class="sub">' + esc(incomeBits) + '</div></div>' +
    '<div class="stat-card"><div class="label">Spent so far</div><div class="value">' + money(t.spent) + '</div><div class="sub">of ' + money(t.income) + ' planned</div></div>' +
    '<div class="stat-card accent"><div class="label">Remaining</div><div class="value">' + money(t.remaining) + '</div><div class="sub">' + LINDEN_DATA.household.daysLeft + ' days left in November</div></div>' +
    '<div class="stat-card"><div class="label">Savings rate</div><div class="value">' + t.savingsRate.toFixed(1) + '%</div><div class="sub">' + money(t.saved) + ' moved to savings</div></div>' +
    '</div>' +
    '<section class="card know-panel"><h2>Three things to know in November</h2>' +
    '<ul class="know-list">' + knowItems.join("") + '</ul></section>' +
    '<div class="grid-2">' +
    '<section class="card"><h2>Where November&rsquo;s money went</h2>' +
    '<p class="hint">Every dollar spent, by envelope — savings included.</p>' +
    donutChart(slices, t.spent, 200) + '</section>' +
    '<section class="card"><h2>Bills still to pay</h2>' +
    '<p class="hint">The next three, in due order. ' + paidCount + ' of ' + state.bills.length + ' bills are already paid.</p>' +
    '<table><thead><tr><th>Bill</th><th>Due</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>' +
    billRows + '</tbody></table>' +
    '<p style="margin:12px 0 0"><a href="#/bills">See all 8 bills &rarr;</a></p></section>' +
    '</div>' +
    '<section class="card" style="margin-top:18px"><h2>Recent transactions</h2>' +
    '<p class="hint">The latest six, newest first.</p>' +
    '<table><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th class="num">Amount</th></tr></thead><tbody>' +
    recentRows + '</tbody></table>' +
    '<p style="margin:12px 0 0"><a href="#/transactions">See all ' + state.transactions.length + ' transactions &rarr;</a></p></section>' +
    '<section class="card"><p class="health-line">On track: <b>' + money(t.remaining) + ' left</b> for the last ' +
    LINDEN_DATA.household.daysLeft + ' days — about <b>' + money(dailyLeft) + ' a day</b> if you spent it evenly, against about ' +
    money(dailySoFar) + ' a day so far this month.</p></section>';
}

// ---------- Transactions ----------

function transactionRows(state, filters) {
  const list = state.transactions.filter(function (tx) {
    if (filters.category && tx.category !== filters.category) return false;
    if (filters.month && tx.date.slice(0, 7) !== filters.month) return false;
    if (filters.search && tx.merchant.toLowerCase().indexOf(filters.search.toLowerCase()) === -1) return false;
    return true;
  }).sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
  if (list.length === 0) {
    return { html: '<tr><td colspan="4">Nothing matches those filters yet. Loosen the search or pick another category.</td></tr>', count: 0 };
  }
  const html = list.map(function (tx) {
    return '<tr><td>' + fmtDate(tx.date) + '</td><td>' + esc(tx.merchant) + '</td>' +
      '<td><span class="cat-chip">' + esc(catById(tx.category).name) + '</span></td>' +
      '<td class="num amount">' + money(tx.amount) + '</td></tr>';
  }).join("");
  return { html: html, count: list.length };
}

function renderTransactions(state, filters) {
  const f = filters || { category: "", month: "", search: "" };
  const rows = transactionRows(state, f);
  const catOptions = LINDEN_DATA.categories.map(function (c) {
    return '<option value="' + c.id + '"' + (f.category === c.id ? " selected" : "") + '>' + esc(c.name) + '</option>';
  }).join("");
  const monthOptions = '<option value="">All months</option>' +
    '<option value="2026-11"' + (f.month === "2026-11" ? " selected" : "") + '>November 2026</option>';
  const allocOptions = LINDEN_DATA.categories.map(function (c) {
    return '<option value="' + c.id + '">' + esc(c.name) + '</option>';
  }).join("");

  return '' +
    '<div class="page-head"><h1>Transactions</h1>' +
    '<p>Every dollar out the door in November — ' + state.transactions.length + ' transactions, adding up to ' + money(totals(state).spent) + '. Add one below and every total on the site updates.</p></div>' +
    '<section class="card compact"><h2>Add a transaction</h2>' +
    '<form data-action="add-transaction"><div class="row">' +
    '<div class="field"><label for="tx-date">Date</label><input id="tx-date" name="date" type="date" value="2026-11-26" required></div>' +
    '<div class="field grow"><label for="tx-merchant">Merchant</label><input id="tx-merchant" name="merchant" type="text" placeholder="e.g. GreenMart Supermarket" required></div>' +
    '<div class="field"><label for="tx-category">Category</label><select id="tx-category" name="category">' + allocOptions + '</select></div>' +
    '<div class="field"><label for="tx-amount">Amount ($)</label><input id="tx-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required></div>' +
    '<button class="btn" type="submit">Add transaction</button>' +
    '</div></form></section>' +
    '<section class="card compact"><h2>Find a transaction</h2>' +
    '<div class="row">' +
    '<div class="field"><label for="flt-cat">Category</label><select id="flt-cat" data-filter="category"><option value="">All categories</option>' + catOptions + '</select></div>' +
    '<div class="field"><label for="flt-month">Month</label><select id="flt-month" data-filter="month">' + monthOptions + '</select></div>' +
    '<div class="field grow"><label for="flt-search">Search merchant</label><input id="flt-search" data-filter="search" type="text" placeholder="Type a shop or name&hellip;" value="' + esc(f.search) + '"></div>' +
    '</div>' +
    '<p class="hint" style="margin-top:8px" id="tx-count">Showing ' + rows.count + ' of ' + state.transactions.length + ' transactions.</p>' +
    '<table><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th class="num">Amount</th></tr></thead>' +
    '<tbody id="tx-rows">' + rows.html + '</tbody></table></section>';
}

// ---------- Budget ----------

function renderBudget(state, editingId) {
  const t = totals(state);
  const spent = t.spentByCat;
  // One vertical list, one row per envelope: name, bar, figures.
  // A list of bars reads at a glance when shrunk, where thirteen
  // identical cards read as a repeating pattern. Editing keeps the
  // same data-action hooks main.js already wires (edit-alloc,
  // save-alloc, cancel-alloc, data-edit-amount).
  const rows = LINDEN_DATA.categories.map(function (c) {
    const alloc = allocationOf(state, c.id);
    const sp = spent[c.id] || 0;
    const left = alloc - sp;
    const pct = alloc > 0 ? Math.min(100, Math.round((sp / alloc) * 100)) : 0;
    const over = left < 0;
    const fillStyle = over
      ? 'display:block;width:100%;background:#a33b2e'
      : 'display:block;width:' + pct + '%;background:' + c.color;
    const editBtn = editingId === c.id ? '' :
      '<button class="btn small ghost" data-action="edit-alloc" data-cat="' + c.id + '">Edit</button>';
    const editRow = editingId === c.id
      ? '<div class="edit-row"><input type="number" min="0" step="1" value="' + alloc + '" data-edit-amount="' + c.id + '" aria-label="New amount for ' + esc(c.name) + '">' +
        '<button class="btn small" data-action="save-alloc" data-cat="' + c.id + '">Save</button>' +
        '<button class="btn small ghost" data-action="cancel-alloc">Cancel</button></div>'
      : '';
    return '<div class="env-row">' +
      '<div class="env-row-top"><span class="env-name">' + esc(c.name) + '</span>' +
      '<span class="env-nums"><strong>' + money(sp) + '</strong> spent of ' + money(alloc) + ' planned</span>' +
      '<span class="env-left ' + (over ? 'over' : 'ok') + '">' +
      (over ? money(-left) + ' over' : money(left) + ' left') + '</span>' + editBtn + '</div>' +
      '<div class="progress"><span class="bar-track"><span class="bar-fill" style="' + fillStyle + '"></span></span><span class="pct">' + pct + '%</span></div>' +
      editRow + '</div>';
  }).join("");

  return '' +
    '<div class="page-head"><h1>Budget envelopes</h1>' +
    '<p>Thirteen envelopes, one for each part of the month. Edit any planned amount and the totals below — and on the dashboard — move with it.</p></div>' +
    '<p class="totals-line">Planned <b>' + money(t.allocated) + '</b> of ' + money(t.income) + ' income &nbsp;·&nbsp; Spent <b>' + money(t.spent) + '</b> &nbsp;·&nbsp; Left <b>' + money(t.remaining) + '</b></p>' +
    '<div class="env-list">' + rows + '</div>';
}

// ---------- Bills ----------

function renderBills(state) {
  const paid = state.bills.filter(function (b) { return b.paid; });
  const unpaid = state.bills.filter(function (b) { return !b.paid; });
  const paidSum = paid.reduce(function (a, b) { return a + b.amount; }, 0);
  const unpaidSum = unpaid.reduce(function (a, b) { return a + b.amount; }, 0);
  const nextUp = unpaid.slice().sort(function (a, b) { return a.dueDay - b.dueDay; })[0];
  const nextUpLine = nextUp
    ? '<p class="hint" style="margin-top:12px">Next up: ' + esc(nextUp.name) + ', ' + money(nextUp.amount) + ', due ' + dueLabel(nextUp.dueDay) + ' — the first unpaid bill on the list.</p>'
    : '<p class="hint" style="margin-top:12px">Every bill is paid. Nothing is due for the rest of November.</p>';
  const rows = state.bills.slice().sort(function (a, b) { return a.dueDay - b.dueDay; }).map(function (b) {
    const action = b.paid
      ? '<button class="btn small ghost" data-action="toggle-bill" data-bill="' + b.id + '">Mark unpaid</button>'
      : '<button class="btn small" data-action="toggle-bill" data-bill="' + b.id + '">Mark paid</button>';
    const pill = b.paid
      ? '<span class="pill paid">Paid</span>'
      : '<span class="pill due">Due ' + dueLabel(b.dueDay) + '</span>';
    return '<tr><td>' + esc(b.name) + '</td>' +
      '<td class="hide-phone"><span class="cat-chip">' + esc(catById(b.category).name) + '</span></td>' +
      '<td>' + dueLabel(b.dueDay) + '</td>' +
      '<td class="num amount">' + money(b.amount) + '</td>' +
      '<td>' + pill + '</td><td>' + action + '</td></tr>';
  }).join("");

  return '' +
    '<div class="page-head"><h1>Recurring bills</h1>' +
    '<p>Eight bills land every month, on the same days. Mark one paid when the money leaves and the dashboard&rsquo;s upcoming list updates.</p></div>' +
    '<p class="bill-summary"><span><b>' + paid.length + '</b> of 8 paid</span><span><b>' + money(paidSum) + '</b> paid</span><span><b>' + money(unpaidSum) + '</b> still to pay</span></p>' +
    '<section class="card"><div class="table-scroll"><table><thead><tr><th>Bill</th><th class="hide-phone">Category</th><th>Due</th><th class="num">Amount</th><th>Status</th><th>Action</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>' +
    nextUpLine + '</section>';
}

// ---------- Goals ----------

function renderGoals(state) {
  const cards = state.goals.map(function (g) {
    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
    const left = Math.max(0, g.target - g.current);
    return '<section class="card goal"><div class="goal-top"><h2>' + esc(g.name) + '</h2>' +
      '<span class="goal-amounts"><b>' + money(g.current) + '</b> of ' + money(g.target) + '</span></div>' +
      '<p class="goal-note">' + esc(g.note) + '</p>' +
      '<div class="progress"><span class="bar-track"><span class="bar-fill gold" style="display:block;width:' + pct + '%"></span></span><span class="pct">' + pct + '%</span></div>' +
      '<p class="goal-left" style="margin-top:8px">' + money(left) + ' to go.</p>' +
      '<div class="contribute"><label for="contrib-' + g.id + '" style="font-size:14px;font-weight:700">Add to this goal:</label>' +
      '<input id="contrib-' + g.id + '" type="number" min="1" step="1" placeholder="$" data-contrib-amount="' + g.id + '">' +
      '<button class="btn small" data-action="contribute" data-goal="' + g.id + '">Contribute</button></div></section>';
  }).join("");
  const totalSaved = state.goals.reduce(function (a, g) { return a + g.current; }, 0);
  const totalTarget = state.goals.reduce(function (a, g) { return a + g.target; }, 0);

  return '' +
    '<div class="page-head"><h1>Savings goals</h1>' +
    '<p>Four things the family is saving for, with ' + money(totalSaved) + ' put aside so far toward ' + money(totalTarget) + ' of goals. Add a contribution and the bar moves.</p></div>' +
    cards;
}

// ---------- Reports ----------

function renderReports(state) {
  const t = totals(state);
  const spent = t.spentByCat;
  const rows = LINDEN_DATA.categories
    .filter(function (c) { return spent[c.id] > 0; })
    .map(function (c) { return { label: c.name, value: spent[c.id], color: c.color }; })
    .sort(function (a, b) { return b.value - a.value; });

  // Top merchants: group by the shop name before any " — " detail.
  const byMerchant = {};
  state.transactions.forEach(function (tx) {
    if (tx.category === "housing" || tx.category === "savings") return;
    const base = tx.merchant.split(" — ")[0];
    if (!byMerchant[base]) byMerchant[base] = { total: 0, count: 0 };
    byMerchant[base].total += tx.amount;
    byMerchant[base].count += 1;
  });
  const top = Object.keys(byMerchant).map(function (name) {
    return { name: name, total: byMerchant[name].total, count: byMerchant[name].count };
  }).sort(function (a, b) { return b.total - a.total; }).slice(0, 5);

  const topRows = top.map(function (m, i) {
    return '<div class="top-merchant"><span><strong>' + (i + 1) + '.</strong> ' + esc(m.name) +
      ' <span class="m-count">(' + m.count + (m.count === 1 ? ' visit' : ' visits') + ')</span></span>' +
      '<span class="m-amt">' + money(m.total) + '</span></div>';
  }).join("");

  const insightHtml = LINDEN_DATA.insights.map(function (ins) {
    return '<div class="insight"><h3>' + esc(ins.title) + '</h3><p>' + esc(ins.body) + '</p></div>';
  }).join("");

  return '' +
    '<div class="page-head"><h1>Reports</h1>' +
    '<p>November in pictures: where the money went, how six months compare, and what the numbers are saying.</p></div>' +
    '<section class="card"><h2>Spending by category</h2>' +
    '<p class="hint">Month to date, largest first. Total spent: ' + money(t.spent) + '.</p>' +
    hbarChart(rows) + '</section>' +
    '<section class="card"><h2>Income vs spending — six months</h2>' +
    '<p class="hint">Spending has stayed under income every month since June.</p>' +
    trendChart(LINDEN_DATA.trend) +
    '<p class="trend-note">November is month-to-date, through the 26th — the last four days are still to come.</p></section>' +
    '<section class="card"><h2>Top merchants</h2>' +
    '<p class="hint">Where the shopping money actually went, leaving out the mortgage and the savings transfer.</p>' +
    topRows + '</section>' +
    '<section class="card"><h2>What the numbers say</h2>' + insightHtml + '</section>';
}

// ---------- Dispatch ----------

function renderPage(route, state, ui) {
  if (route === "transactions") return renderTransactions(state, ui.filters);
  if (route === "budget") return renderBudget(state, ui.editingId);
  if (route === "bills") return renderBills(state);
  if (route === "goals") return renderGoals(state);
  if (route === "reports") return renderReports(state);
  return renderDashboard(state);
}
