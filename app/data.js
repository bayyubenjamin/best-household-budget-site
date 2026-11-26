// The Linden Ledger — the household dataset for November 2026.
//
// One family, one month, one set of figures. Every page of the site
// reads from this single dataset, so the numbers always agree with
// each other. Category spending is computed from the transactions
// below, never typed twice, so the totals cannot drift apart.
//
// The figures: income $4,900 (Maya $3,100 teaching, Tom $1,600
// freelance design, $200 other). The thirteen envelopes add up to
// exactly $4,900. The 26 transactions below add up, category by
// category, to $4,104 spent month-to-date, leaving $796.

const LINDEN_DATA = {
  household: {
    name: "The Linden Family",
    members: "Maya & Tom, with two kids (ages 7 and 10)",
    month: "November 2026",
    monthShort: "Nov 2026",
    asOfDay: 26,
    daysInMonth: 30,
    daysLeft: 4
  },

  income: {
    sources: [
      { label: "Maya — teaching", amount: 3100 },
      { label: "Tom — freelance design", amount: 1600 },
      { label: "Other — refunds & interest", amount: 200 }
    ],
    total: 4900
  },

  // Allocated envelopes. The thirteen add up to exactly $4,900.
  // Each envelope carries its own colour, so the donut, the legend
  // and the report bars always show the same colour for one category.
  categories: [
    { id: "housing", name: "Housing", allocated: 1450, color: "#1e4d2e" },
    { id: "groceries", name: "Groceries", allocated: 640, color: "#c8912a" },
    { id: "utilities", name: "Utilities", allocated: 215, color: "#2e6b41" },
    { id: "transport", name: "Transport", allocated: 345, color: "#8a5a1f" },
    { id: "dining", name: "Dining & Takeout", allocated: 185, color: "#5b8c5a" },
    { id: "entertainment", name: "Entertainment", allocated: 130, color: "#d4a017" },
    { id: "kids", name: "Kids & School", allocated: 420, color: "#3d7a52" },
    { id: "health", name: "Health", allocated: 175, color: "#b07d2b" },
    { id: "clothing", name: "Clothing", allocated: 95, color: "#6a9b6e" },
    { id: "home", name: "Home & Garden", allocated: 110, color: "#e0b45c" },
    { id: "savings", name: "Savings", allocated: 650, color: "#274e36" },
    { id: "fun", name: "Fun Money", allocated: 145, color: "#a86f1c" },
    { id: "buffer", name: "Buffer", allocated: 340, color: "#7ba05b" }
  ],

  // November transactions. Grouped by category they sum to:
  // Housing $1,450 · Groceries $512 · Utilities $198 · Transport $287
  // Dining $164 · Entertainment $96 · Kids $355 · Health $142
  // Clothing $58 · Home $74 · Savings $650 · Fun Money $118
  // Buffer $0 — $4,104 in all.
  transactions: [
    { id: "t01", date: "2026-11-01", merchant: "Mortgage payment", category: "housing", amount: 1450 },
    { id: "t02", date: "2026-11-01", merchant: "Transfer to savings", category: "savings", amount: 650 },
    { id: "t03", date: "2026-11-02", merchant: "GreenMart Supermarket", category: "groceries", amount: 128 },
    { id: "t04", date: "2026-11-03", merchant: "Shell Fuel Station", category: "transport", amount: 98 },
    { id: "t05", date: "2026-11-04", merchant: "Lincoln Elementary — lunch program", category: "kids", amount: 120 },
    { id: "t06", date: "2026-11-05", merchant: "Pharmacy — prescription", category: "health", amount: 38 },
    { id: "t07", date: "2026-11-06", merchant: "Bella's Pizzeria", category: "dining", amount: 62 },
    { id: "t08", date: "2026-11-07", merchant: "GreenMart Supermarket", category: "groceries", amount: 142 },
    { id: "t09", date: "2026-11-07", merchant: "Cinema — family movie night", category: "entertainment", amount: 42 },
    { id: "t10", date: "2026-11-08", merchant: "City Electric Co.", category: "utilities", amount: 132 },
    { id: "t11", date: "2026-11-08", merchant: "Tom — sketchbook & pens", category: "fun", amount: 47 },
    { id: "t12", date: "2026-11-09", merchant: "Hardware store — bulbs & batteries", category: "home", amount: 74 },
    { id: "t13", date: "2026-11-10", merchant: "Kids' winter jackets", category: "clothing", amount: 58 },
    { id: "t14", date: "2026-11-11", merchant: "Soccer club fees", category: "kids", amount: 95 },
    { id: "t15", date: "2026-11-11", merchant: "Metro Transit — monthly pass", category: "transport", amount: 85 },
    { id: "t16", date: "2026-11-12", merchant: "City Water Dept", category: "utilities", amount: 48 },
    { id: "t17", date: "2026-11-12", merchant: "Dental checkup — copay", category: "health", amount: 104 },
    { id: "t18", date: "2026-11-13", merchant: "Noodle House takeout", category: "dining", amount: 58 },
    { id: "t19", date: "2026-11-14", merchant: "GreenMart Supermarket", category: "groceries", amount: 117 },
    { id: "t20", date: "2026-11-14", merchant: "Recycling & trash service", category: "utilities", amount: 18 },
    { id: "t21", date: "2026-11-16", merchant: "Maya — bookshop", category: "fun", amount: 71 },
    { id: "t22", date: "2026-11-18", merchant: "Lincoln Elementary — field trip & supplies", category: "kids", amount: 140 },
    { id: "t23", date: "2026-11-20", merchant: "Taco Stand", category: "dining", amount: 44 },
    { id: "t24", date: "2026-11-20", merchant: "Shell Fuel Station — fuel & car wash", category: "transport", amount: 104 },
    { id: "t25", date: "2026-11-21", merchant: "Fresh Foods Market", category: "groceries", amount: 125 },
    { id: "t26", date: "2026-11-22", merchant: "Toy Store — board game", category: "entertainment", amount: 54 }
  ],

  // Recurring bills. Four are paid, four are still to come.
  // Paid so far: $1,709. Still to pay: $271.
  bills: [
    { id: "b1", name: "Mortgage", amount: 1450, dueDay: 1, paid: true, category: "housing" },
    { id: "b2", name: "Electric bill", amount: 132, dueDay: 8, paid: true, category: "utilities" },
    { id: "b3", name: "Water bill", amount: 48, dueDay: 12, paid: true, category: "utilities" },
    { id: "b4", name: "Internet", amount: 79, dueDay: 15, paid: true, category: "utilities" },
    { id: "b5", name: "Mobile phones", amount: 86, dueDay: 18, paid: false, category: "utilities" },
    { id: "b6", name: "Home insurance", amount: 124, dueDay: 21, paid: false, category: "housing" },
    { id: "b7", name: "Streaming service", amount: 16, dueDay: 24, paid: false, category: "entertainment" },
    { id: "b8", name: "Gym membership", amount: 45, dueDay: 28, paid: false, category: "health" }
  ],

  // Savings goals. Progress is what is saved so far.
  goals: [
    { id: "g1", name: "Emergency fund", current: 5200, target: 8000, note: "Six months of essentials, for the month nothing goes to plan." },
    { id: "g2", name: "Family vacation", current: 1150, target: 2400, note: "A week at the lake next summer — cabin, bikes, ice cream." },
    { id: "g3", name: "New car", current: 3800, target: 12000, note: "Replacing the old hatchback before it gives up for good." },
    { id: "g4", name: "Kids' college", current: 6400, target: 25000, note: "A little every month, starting early, for both kids." }
  ],

  // Six months of income against spending. Spending stays under
  // income every month. November is month-to-date, through the 26th.
  trend: [
    { month: "Jun", label: "June 2026", income: 4850, spending: 4620 },
    { month: "Jul", label: "July 2026", income: 4900, spending: 4710 },
    { month: "Aug", label: "August 2026", income: 4750, spending: 4580 },
    { month: "Sep", label: "September 2026", income: 4900, spending: 4660 },
    { month: "Oct", label: "October 2026", income: 4950, spending: 4730 },
    { month: "Nov", label: "November 2026 (to the 26th)", income: 4900, spending: 4104 }
  ],

  // Three short written insights for the reports page.
  insights: [
    {
      title: "Groceries are $128 under budget",
      body: "With four days left, the food envelope still holds $128. Three home-cooked Sundays instead of takeout did most of the work — if the last shop stays small, about $100 of it can move to the vacation fund."
    },
    {
      title: "Dining out is $21 under",
      body: "Takeout came to $164 against a $185 plan. The batch-cook Sunday replaced two takeout nights, and the kids actually asked for the leftovers again."
    },
    {
      title: "The buffer is untouched",
      body: "All $340 of the buffer is still there — the first month since August with nothing unexpected. Leave it alone and it rolls into the vacation fund on the 1st."
    }
  ]
};
