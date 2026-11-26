# The Linden Ledger

A working household budget site for the Linden family — Maya (teacher),
Tom (freelance designer), and two kids, ages 7 and 10 — for November 2026.

## What it is

Six linked pages, one consistent dataset, every control working:

- **Dashboard** — month overview (income $4,900, spent $4,104, remaining
  $796, savings rate 13.3%), a spending donut by category, the next three
  unpaid bills, the latest six transactions, and a plain-words budget
  health line.
- **Transactions** — all 26 November transactions, plus a working
  add-transaction form, filter by category, filter by month, and search
  by merchant. Adding a transaction updates every total on the site.
- **Budget** — thirteen envelopes with allocated, spent, remaining and a
  progress bar each. Any planned amount can be edited, and the totals move.
- **Bills** — eight recurring bills with due dates and paid/unpaid status.
  "Mark paid" toggles a bill and updates the dashboard.
- **Goals** — four savings goals with progress bars; "Contribute" adds an
  amount and moves the bar.
- **Reports** — spending by category, a six-month income-vs-spending trend,
  the top five merchants, and three short written insights.

All figures are one dataset (`app/data.js`) and they add up: the thirteen
envelopes total exactly $4,900, and the 26 transactions sum, category by
category, to $4,104 spent. State persists in localStorage, so changes
survive a reload; with no stored state the site shows the dataset exactly
as written.

## How to run

Serve `app/` with any static HTTP server and open `index.html`:

```sh
cd app
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in a desktop browser, and resize to
390px wide (or open it on a phone) to see the phone layout. No build step,
no network requests — every file the site loads is under `app/`.

## How to hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` into the output directory and writes `dossier.json` there
with `buildDossier` from `vendor/makefun-frontend.ts`. Run it twice and
diff the two `dossier.json` files: they are byte-identical.

## How to test

Every route and control is checked in a real browser against a local
static server:

- Open each hash route (`#/`, `#/transactions`, `#/budget`, `#/bills`,
  `#/goals`, `#/reports`) at desktop width (1280px) and phone width
  (390px) and confirm the page renders with real figures.
- Add a transaction, filter by category and month, search by merchant,
  edit an envelope amount, mark a bill paid, contribute to a goal —
  each one updates the totals on its own page and on the dashboard.
- Reload the page and confirm the change is still there (localStorage).
- Run `main.ts` twice with `MAKEFUN_OUTPUT_DIR` set and diff the two
  `dossier.json` files: they are byte-identical.

## What makes this entry different

- **Complete, not a demo.** Six pages, not one dashboard with dead links.
  Every page is reached from the nav, every control does what it says,
  and nothing is a placeholder.
- **One true dataset.** A single source of truth means the dashboard, the
  budget envelopes, the reports and the transaction list can never
  disagree with each other.
- **Warm and original.** A deep forest green, warm cream and amber gold
  identity drawn for this family — hand-built SVG charts, a hand-drawn
  house-and-coin mark, system serif headings — no copied brand, no stock
  images, no framework.
- **Tiny first load.** Vanilla HTML, CSS and JavaScript only. No framework,
  no external fonts, no images from the network. The whole first load is
  a few small files under `app/`.

## Files

- `app/index.html` — shell, navigation, mount point
- `app/style.css` — all styles
- `app/data.js` — the household dataset (income, envelopes, transactions,
  bills, goals, trend, insights)
- `app/charts.js` — SVG chart builders (donut, horizontal bars, trend bars)
- `app/views.js` — page renderers (dashboard, transactions, budget, bills,
  goals, reports)
- `app/main.js` — router, state, persistence, event wiring
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged
- `main.ts` — the hand-in program
- `screenshots/` — four real renders of the site's own code
