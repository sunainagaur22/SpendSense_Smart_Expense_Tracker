/* ════════════════════════════════════════════════
   SPENDSENSE — SMART EXPENSE TRACKER
   script.js — Complete Application Logic
   ════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════
// SECTION 1: CONSTANTS & CATEGORY CONFIG
// ══════════════════════════════════════════

/** Category definitions: keywords, icon, colors */
const CATEGORIES = {
  Food: {
    icon: '🍔',
    color: '#F7B845',
    bg: 'rgba(247,185,69,0.15)',
    keywords: ['swiggy','zomato','bigbasket','blinkit','dominos','pizza','kfc','mcdonalds',
                'burger','starbucks','cafe','restaurant','food','eat','dunzo','grofers','instamart']
  },
  Travel: {
    icon: '🚗',
    color: '#4F7EF7',
    bg: 'rgba(79,126,247,0.15)',
    keywords: ['uber','ola','rapido','irctc','makemytrip','goibibo','flight','railway','metro',
                'bus','cab','auto','train','airline','petrol','fuel','toll']
  },
  Shopping: {
    icon: '🛍️',
    color: '#A76DF7',
    bg: 'rgba(167,109,247,0.15)',
    keywords: ['amazon','flipkart','myntra','ajio','nykaa','meesho','snapdeal','reliance digital',
                'croma','vijay sales','shopping','clothes','apparels']
  },
  Bills: {
    icon: '💡',
    color: '#2DD0C0',
    bg: 'rgba(45,208,192,0.15)',
    keywords: ['electricity','water','gas','wifi','broadband','jio','airtel','bsnl','vi','vodafone',
                'paytm','phonepe','rent','maintenance','neft','utility','bill','subscription',
                'netflix','spotify','prime','hotstar','disney','electricity board']
  },
  Health: {
    icon: '🏥',
    color: '#22D07A',
    bg: 'rgba(34,208,122,0.15)',
    keywords: ['apollo','medplus','pharmacy','hospital','clinic','doctor','medicine','lab',
                'diagnostic','health','gpay','practo','1mg','wellness']
  },
  Entertainment: {
    icon: '🎬',
    color: '#F76DA8',
    bg: 'rgba(247,109,168,0.15)',
    keywords: ['pvr','inox','bookmyshow','gaming','game','sports','entertainment','movie','theatre']
  },
  Other: {
    icon: '📦',
    color: '#7A88B0',
    bg: 'rgba(122,136,176,0.15)',
    keywords: []
  }
};

/** Chart color palette */
const CHART_COLORS = ['#F7B845','#4F7EF7','#A76DF7','#2DD0C0','#22D07A','#F76DA8','#7A88B0'];

// ══════════════════════════════════════════
// SECTION 2: STATE
// ══════════════════════════════════════════

/** All chart instances — tracked so they can be destroyed on re-render */
let chartInstances = {};

/** Currently edited transaction ID */
let editingTxId = null;

/** Mock SMS data loaded from JSON */
let mockSMSData = [];

/** IDs of mock messages already parsed */
let parsedMockIds = new Set();

// ══════════════════════════════════════════
// SECTION 3: LOCAL STORAGE HELPERS
// ══════════════════════════════════════════

const storage = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { console.warn('Storage error', e); }
  },
  remove: (key) => localStorage.removeItem(key)
};

// ── Typed accessors ──
const getTransactions = ()  => storage.get('ss_transactions', []);
const setTransactions = (t) => storage.set('ss_transactions', t);
const getCurrentUser  = ()  => storage.get('ss_currentUser', null);
const setCurrentUser  = (u) => storage.set('ss_currentUser', u);
const getUsers        = ()  => storage.get('ss_users', []);
const setUsers        = (u) => storage.set('ss_users', u);
const getBudget       = ()  => storage.get('ss_budget', 0);
const setBudget       = (b) => storage.set('ss_budget', b);
const getTheme        = ()  => storage.get('ss_theme', 'dark');
const setTheme        = (t) => storage.set('ss_theme', t);

// ══════════════════════════════════════════
// SECTION 4: AUTHENTICATION
// ══════════════════════════════════════════

/** On page load: restore theme, check auth */
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', getTheme());
  updateThemeBtn();

  // Set today as default date in add form
  const today = new Date().toISOString().slice(0,10);
  const expDateEl = document.getElementById('expDate');
  if (expDateEl) expDateEl.value = today;

  // Check if user is already logged in
  const user = getCurrentUser();
  if (user) {
    showApp(user);
  } else {
    document.getElementById('authScreen').classList.remove('hidden');
  }

  // Load mock data
  loadMockNotifications();
});

/** Switch between Login / Sign Up tabs */
function switchAuthTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
  // Clear errors
  document.getElementById('loginError').textContent = '';
  document.getElementById('signupError').textContent = '';
}

/** Handle login form submission */
function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const users    = getUsers();
  const errEl    = document.getElementById('loginError');

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    errEl.textContent = 'Invalid email or password. Try signing up first.';
    return;
  }
  errEl.textContent = '';
  setCurrentUser(user);
  showApp(user);
}

/** Handle signup form submission */
function handleSignup(e) {
  e.preventDefault();
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;
  const errEl    = document.getElementById('signupError');
  const users    = getUsers();

  if (users.find(u => u.email === email)) {
    errEl.textContent = 'Email already exists. Please login instead.';
    return;
  }
  const newUser = { id: Date.now(), name, email, password };
  users.push(newUser);
  setUsers(users);
  setCurrentUser(newUser);
  errEl.textContent = '';
  showApp(newUser);
  showToast(`Welcome, ${name}! 🎉`);
}

/** Log out */
function handleLogout() {
  storage.remove('ss_currentUser');
  document.getElementById('appWrapper').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  // Reset charts
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} });
  chartInstances = {};
}

// ══════════════════════════════════════════
// SECTION 5: APP INITIALIZATION
// ══════════════════════════════════════════

/** Show the main app shell */
function showApp(user) {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appWrapper').classList.remove('hidden');

  // Set avatar & user info
  const initial = (user.name || user.email)[0].toUpperCase();
  document.getElementById('userAvatar').textContent = initial;
  document.getElementById('userInfoSidebar').textContent = `${user.name || ''}\n${user.email}`;

  // Navigate to dashboard
  navigateTo('dashboard', document.querySelector('[data-page="dashboard"]'));
}

// ══════════════════════════════════════════
// SECTION 6: NAVIGATION
// ══════════════════════════════════════════

function navigateTo(page, navEl) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('active');
  });

  // Show target page
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  else {
    const el = document.querySelector(`[data-page="${page}"]`);
    if (el) el.classList.add('active');
  }

  // Page title
  const titles = {
    dashboard: 'Dashboard', notifications: 'SMS Parser',
    transactions: 'Transactions', analytics: 'Analytics & Insights',
    budget: 'Budget Manager', add: 'Add Expense'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  // Render page content
  renderPage(page);

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

function renderPage(page) {
  switch (page) {
    case 'dashboard':     renderDashboard();     break;
    case 'notifications': renderNotificationsPage(); break;
    case 'transactions':  renderTransactionsPage(); break;
    case 'analytics':     renderAnalyticsPage(); break;
    case 'budget':        renderBudgetPage();    break;
    case 'add':           break; // static form
  }
  checkBudgetAlert();
}

/** Toggle mobile sidebar */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ══════════════════════════════════════════
// SECTION 7: SMS PARSING ENGINE
// ══════════════════════════════════════════

/**
 * Core SMS parser — extracts structured data using regex patterns.
 * Handles common Indian bank SMS formats from SBI, HDFC, ICICI, Axis, Kotak, etc.
 */
function parseSMS(rawText, timestamp = null) {
  const text = rawText.trim();
  if (!text) return null;

  // ── Determine transaction type ──
  const creditKeywords = /credit|credited|received|cashback|refund|salary|added|deposited/i;
  const debitKeywords  = /debit|debited|spent|paid|payment|purchased|withdrawn|transferred|sent/i;
  const isCredit = creditKeywords.test(text) && !debitKeywords.test(text);
  const type = isCredit ? 'credit' : 'debit';

  // ── Extract amount ──
  // Supports: INR 1,200 | Rs. 1200 | Rs 1,200.50 | ₹1200
  const amtPatterns = [
    /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?|₹)/i,
    /(?:of|for|worth)\s+(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i
  ];
  let amount = 0;
  for (const pat of amtPatterns) {
    const m = text.match(pat);
    if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break; }
  }
  if (amount <= 0) return null; // Can't parse a valid amount

  // ── Extract available balance ──
  let balance = null;
  const balMatch = text.match(
    /(?:Avl\.?\s*Bal(?:ance)?|balance|Bal|Remaining|remaining)\s*:?\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (balMatch) balance = parseFloat(balMatch[1].replace(/,/g, ''));

  // ── Extract merchant ──
  // Tries several common patterns; falls back to "Unknown"
  let merchant = 'Unknown';
  const merchantPatterns = [
    /(?:at|to|on|for)\s+([A-Z][A-Za-z0-9 &'._\-]{2,35})(?:\s+(?:on|via|\.|\,|UPI|Ref|ID|Txn)|\s*$)/,
    /(?:at|to|on|for)\s+([A-Z][A-Z0-9 &'._\-]{2,35})/,
    /Narration:\s*([A-Za-z0-9 &'._\-]{3,40})(?:\.|,|$)/i,
    /— ([A-Z][A-Za-z0-9 &'._\- ]{2,35}) (?:via|on)/
  ];
  for (const pat of merchantPatterns) {
    const m = text.match(pat);
    if (m && m[1].trim().length > 2) {
      merchant = m[1].trim()
        .replace(/\b\w/g, c => c.toUpperCase()) // Title case
        .replace(/\s+/g, ' ');
      break;
    }
  }

  // ── Extract bank name ──
  let bank = '';
  const bankM = text.match(/\b(SBI|HDFC|ICICI|Axis|Kotak|PNB|BOB|Canara|IDFC|Federal|Yes Bank|IndusInd)\b/i);
  if (bankM) bank = bankM[1].toUpperCase();

  // ── Extract account number ──
  let account = '';
  const accM = text.match(/(?:A[\/]?[Cc]\.?\s*(?:No\.?)?\s*)([Xx*]{2,4}\d{2,6}|\d{4})/i);
  if (accM) account = accM[1];

  // ── Parse date & time ──
  let txDate = timestamp ? new Date(timestamp) : new Date();
  const datePatterns = [
    /(\d{2}[-\/]\d{2}[-\/]\d{4})/,   // 05-04-2025 or 05/04/2025
    /(\d{1,2}-[A-Za-z]{3}-\d{4})/,   // 05-Apr-2025
    /(\d{4}-\d{2}-\d{2})/            // ISO
  ];
  for (const dp of datePatterns) {
    const dm = text.match(dp);
    if (dm) {
      const parsed = new Date(dm[1]);
      if (!isNaN(parsed)) { txDate = parsed; break; }
      // Try DD-MMM-YYYY
      const parts = dm[1].split(/[-\/]/);
      if (parts.length === 3 && isNaN(parseInt(parts[1]))) {
        const attempt = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
        if (!isNaN(attempt)) { txDate = attempt; break; }
      }
    }
  }
  const timeM = text.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i);
  if (timeM) {
    const tp = timeM[1].split(':');
    txDate.setHours(parseInt(tp[0]), parseInt(tp[1] || 0));
  }

  // ── Auto-categorize ──
  const category = detectCategory(merchant + ' ' + text);

  return {
    id:       `tx_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    merchant,
    amount,
    type,
    category,
    bank,
    account,
    balance,
    date:     txDate.toISOString(),
    notes:    '',
    rawSMS:   rawText.trim(),
    source:   'sms'
  };
}

/** Auto-categorize based on keyword matching */
function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, cfg] of Object.entries(CATEGORIES)) {
    if (cat === 'Other') continue;
    if (cfg.keywords.some(kw => lower.includes(kw))) return cat;
  }
  return 'Other';
}

// ══════════════════════════════════════════
// SECTION 8: TRANSACTION CRUD
// ══════════════════════════════════════════

/** Add a parsed transaction to storage */
function addTransaction(tx) {
  const txs = getTransactions();
  txs.unshift(tx); // newest first
  setTransactions(txs);
}

/** Delete a transaction by ID */
function deleteTransaction(id) {
  const txs = getTransactions().filter(t => t.id !== id);
  setTransactions(txs);
}

/** Update a transaction */
function updateTransaction(id, updates) {
  const txs = getTransactions().map(t => t.id === id ? { ...t, ...updates } : t);
  setTransactions(txs);
}

// ══════════════════════════════════════════
// SECTION 9: DASHBOARD RENDERING
// ══════════════════════════════════════════

function renderDashboard() {
  const txs = getTransactions();

  // ── Date boundaries ──
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const debits = txs.filter(t => t.type === 'debit');

  const sumDebits = (from) =>
    debits
      .filter(t => new Date(t.date) >= from)
      .reduce((s, t) => s + t.amount, 0);

  const totalIncome = txs
    .filter(t => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  document.getElementById('statToday').textContent   = '₹' + fmt(sumDebits(today));
  document.getElementById('statWeek').textContent    = '₹' + fmt(sumDebits(weekStart));
  document.getElementById('statMonth').textContent   = '₹' + fmt(sumDebits(monthStart));
  document.getElementById('statIncome').textContent  = '₹' + fmt(totalIncome);

  // ── Charts ──
  renderLineChart('week');
  renderPieChart();

  // ── Recent transactions (last 8) ──
  renderTxList(document.getElementById('recentTxList'), txs.slice(0, 8));
}

// ══════════════════════════════════════════
// SECTION 10: CHART RENDERING
// ══════════════════════════════════════════

/** Destroy an existing chart instance before recreating */
function destroyChart(key) {
  if (chartInstances[key]) {
    try { chartInstances[key].destroy(); } catch {}
    delete chartInstances[key];
  }
}

/** Shared Chart.js default options */
function baseChartOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#7A88B0', font: { family: 'DM Mono', size: 11 } }
      },
      tooltip: {
        backgroundColor: '#0F1525',
        borderColor: '#1E2845',
        borderWidth: 1,
        titleColor: '#7A88B0',
        bodyColor: '#E6EBF8',
        titleFont: { family: 'DM Mono', size: 10 },
        bodyFont:  { family: 'DM Mono', size: 12 }
      }
    },
    ...extra
  };
}

/** Spending trend line chart */
function renderLineChart(period = 'week') {
  const txs    = getTransactions().filter(t => t.type === 'debit');
  const days   = period === 'week' ? 7 : 30;
  const labels = [];
  const data   = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    labels.push(key);

    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd   = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1);
    const sum = txs
      .filter(t => { const td = new Date(t.date); return td >= dayStart && td < dayEnd; })
      .reduce((s, t) => s + t.amount, 0);
    data.push(Math.round(sum));
  }

  destroyChart('line');
  const ctx = document.getElementById('lineChart');
  if (!ctx) return;
  chartInstances['line'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Spent (₹)',
        data,
        borderColor: '#4F7EF7',
        backgroundColor: 'rgba(79,126,247,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#4F7EF7',
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true
      }]
    },
    options: baseChartOptions({
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#3D4D75', font: { family: 'DM Mono', size: 9 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#3D4D75', font: { family: 'DM Mono', size: 9 }, callback: v => '₹' + v.toLocaleString('en-IN') } }
      }
    })
  });
}

/** Update line chart period when toggle clicked */
function updateLineChart(period, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLineChart(period);
}

/** Category pie chart */
function renderPieChart() {
  const txs = getTransactions().filter(t => t.type === 'debit');
  const catTotals = buildCategoryTotals(txs);
  if (!catTotals.length) return;

  const labels = catTotals.map(([k]) => `${CATEGORIES[k].icon} ${k}`);
  const data   = catTotals.map(([, v]) => v);
  const colors = catTotals.map(([k]) => CATEGORIES[k].color);

  destroyChart('pie');
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;
  chartInstances['pie'] = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
    options: baseChartOptions()
  });
}

/** Bar chart for analytics */
function renderBarChart() {
  const txs = getTransactions().filter(t => t.type === 'debit');
  // Last 6 months
  const labels = [];
  const data   = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    labels.push(label);
    const sum = txs.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    }).reduce((s, t) => s + t.amount, 0);
    data.push(Math.round(sum));
  }

  destroyChart('bar');
  const ctx = document.getElementById('barChart');
  if (!ctx) return;
  chartInstances['bar'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Monthly Spending (₹)',
        data,
        backgroundColor: CHART_COLORS,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: baseChartOptions({
      scales: {
        x: { grid: { display: false }, ticks: { color: '#3D4D75', font: { family: 'DM Mono', size: 9 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#3D4D75', font: { family: 'DM Mono', size: 9 }, callback: v => '₹' + v.toLocaleString('en-IN') } }
      }
    })
  });
}

/** Doughnut chart for analytics */
function renderDoughnutChart() {
  const txs = getTransactions().filter(t => t.type === 'debit');
  const catTotals = buildCategoryTotals(txs);
  if (!catTotals.length) return;

  destroyChart('doughnut');
  const ctx = document.getElementById('doughnutChart');
  if (!ctx) return;
  chartInstances['doughnut'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: catTotals.map(([k]) => `${CATEGORIES[k].icon} ${k}`),
      datasets: [{
        data: catTotals.map(([,v]) => v),
        backgroundColor: catTotals.map(([k]) => CATEGORIES[k].color),
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: baseChartOptions({ cutout: '65%' })
  });
}

/** Aggregate debit totals by category, sorted descending */
function buildCategoryTotals(txs) {
  const map = {};
  txs.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// ══════════════════════════════════════════
// SECTION 11: TRANSACTION LIST RENDERING
// ══════════════════════════════════════════

/** Render a list of transaction items into a container element */
function renderTxList(container, txs) {
  if (!container) return;

  if (!txs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📩</div>
        <p>No transactions yet. Parse an SMS or add one manually!</p>
      </div>`;
    return;
  }

  container.innerHTML = txs.map((tx, i) => {
    const cat  = CATEGORIES[tx.category] || CATEGORIES.Other;
    const d    = new Date(tx.date);
    const ds   = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const ts   = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const sign = tx.type === 'credit' ? '+' : '-';
    const amtClass = tx.type === 'credit' ? 'credit' : '';

    return `
      <div class="tx-item" style="animation-delay:${Math.min(i * 30, 300)}ms">
        <div class="tx-avatar cat-${tx.category}">${cat.icon}</div>
        <div class="tx-info">
          <div class="tx-merchant">${escHtml(tx.merchant)}</div>
          <div class="tx-sub">
            <span>${ds} · ${ts}</span>
            <span class="cat-tag cat-${tx.category}">${tx.category}</span>
            ${tx.notes ? `<span>📝 ${escHtml(tx.notes)}</span>` : ''}
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${amtClass}">${sign}₹${fmtAmt(tx.amount)}</div>
          <div class="tx-actions">
            <button class="btn-icon" onclick="openEditModal('${tx.id}')" title="Edit">✏️</button>
            <button class="btn-icon danger" onclick="confirmDelete('${tx.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ══════════════════════════════════════════
// SECTION 12: NOTIFICATIONS PAGE
// ══════════════════════════════════════════

/** Load mock JSON data and render the notifications page */
async function loadMockNotifications() {
  try {
    const res = await fetch('./data/mockNotifications.json');
    mockSMSData = await res.json();
  } catch {
    // Fallback inline data if fetch fails (e.g. opened as file://)
    mockSMSData = [
      { id:'sms_001', raw:'INR 250.00 spent on Zomato. SBI Card XX4521. Avl Bal: INR 45,230.00.', timestamp:'2025-04-05T08:45:00' },
      { id:'sms_002', raw:'Rs. 1,200 debited from HDFC A/c XX8821 via UPI to Amazon. Avl Bal: Rs. 32,100.50', timestamp:'2025-04-05T10:15:00' },
      { id:'sms_003', raw:'Paid Rs. 80 to Uber via UPI. Balance: Rs. 18,450.00', timestamp:'2025-04-05T12:30:00' },
      { id:'sms_004', raw:'INR 3,500.00 credited to ICICI A/c XX9923. Narration: SALARY APRIL 2025', timestamp:'2025-04-04T09:00:00' },
      { id:'sms_005', raw:'Rs. 499 deducted for Netflix subscription. ICICI A/c XX9923. 04-Apr-2025', timestamp:'2025-04-04T11:00:00' },
      { id:'sms_006', raw:'INR 650 spent at Swiggy on 03-Apr-2025. Axis Card XX7714.', timestamp:'2025-04-03T19:20:00' },
      { id:'sms_007', raw:'Rs. 2,100 debited from Kotak A/c XX3310 to Myntra via UPI.', timestamp:'2025-04-03T14:55:00' },
      { id:'sms_008', raw:'Payment of Rs. 450 made to Ola. SBI UPI. Available Balance: Rs. 22,080.00', timestamp:'2025-04-03T08:10:00' },
      { id:'sms_009', raw:'INR 1,800 debited from SBI for ELECTRICITY BILL via Paytm. Bal: INR 20,280.00', timestamp:'2025-04-02T16:40:00' },
      { id:'sms_010', raw:'Rs. 320 spent on BigBasket. HDFC Debit Card XX8821. Avl Bal: Rs. 31,780.50', timestamp:'2025-04-02T10:22:00' }
    ];
  }
  renderNotificationsPage();
}

function renderNotificationsPage() {
  renderSampleChips();
  renderMockList();
}

/** Sample chips to quickly load into textarea */
function renderSampleChips() {
  const samples = [
    'INR 250 spent on Zomato. SBI Card XX4521. Avl Bal: INR 45,230.',
    'Rs. 1,200 debited from HDFC A/c XX8821 at Amazon. Avl Bal: Rs. 32,100.',
    'Paid Rs. 80 to Uber via UPI. Balance: Rs. 18,450.',
    'INR 50,000 credited to ICICI A/c. Narration: SALARY APRIL 2025.',
    'Rs. 499 deducted for Netflix subscription renewal. ICICI A/c.',
    'INR 1,800 debited for ELECTRICITY BILL via Paytm. Bal: INR 20,280.'
  ];
  const el = document.getElementById('sampleChips');
  if (!el) return;
  el.innerHTML = samples.map(s =>
    `<div class="sample-chip" onclick="loadSampleSMS(this.dataset.sms)" data-sms="${escAttr(s)}">${s}</div>`
  ).join('');
}

function loadSampleSMS(text) {
  const ta = document.getElementById('smsTextarea');
  if (ta) { ta.value = text; ta.focus(); }
}

/** Render the mock SMS list */
function renderMockList() {
  const el = document.getElementById('mockList');
  if (!el) return;
  el.innerHTML = mockSMSData.map(item => {
    const isParsed = parsedMockIds.has(item.id);
    const d = new Date(item.timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    return `
      <div class="mock-sms-item ${isParsed ? 'parsed' : ''}" onclick="parseMockItem('${item.id}')">
        <div class="mock-sms-text">${escHtml(item.raw)}</div>
        <div class="mock-sms-time">${d} ${isParsed ? '· ✅ Added' : '· Click to parse'}</div>
      </div>`;
  }).join('');
}

/** Parse a specific mock SMS by ID */
function parseMockItem(id) {
  const item = mockSMSData.find(m => m.id === id);
  if (!item || parsedMockIds.has(id)) return;
  const tx = parseSMS(item.raw, item.timestamp);
  if (tx) {
    addTransaction(tx);
    parsedMockIds.add(id);
    renderMockList();
    showToast(`✅ ${tx.merchant} — ₹${fmtAmt(tx.amount)} added`);
    checkBudgetAlert();
  } else {
    showToast('⚠️ Could not parse this SMS', 'warn');
  }
}

/** Parse the SMS from the textarea */
function parseSingleSMS() {
  const val = document.getElementById('smsTextarea').value.trim();
  if (!val) { showToast('⚠️ Please paste an SMS first', 'warn'); return; }
  const tx = parseSMS(val);
  if (!tx) { showToast('❌ Unable to parse. Check the SMS format.', 'error'); return; }
  addTransaction(tx);
  document.getElementById('smsTextarea').value = '';
  showToast(`✅ ${tx.merchant} — ₹${fmtAmt(tx.amount)} added as ${tx.type}`);
  checkBudgetAlert();
}

/** Load ALL mock data at once */
function loadAllMockData() {
  let added = 0;
  mockSMSData.forEach(item => {
    if (parsedMockIds.has(item.id)) return;
    const tx = parseSMS(item.raw, item.timestamp);
    if (tx) { addTransaction(tx); parsedMockIds.add(item.id); added++; }
  });
  renderMockList();
  showToast(`✅ ${added} transactions added from mock data!`);
  checkBudgetAlert();
}

// ══════════════════════════════════════════
// SECTION 13: TRANSACTIONS PAGE
// ══════════════════════════════════════════

function renderTransactionsPage() {
  applyFilters();
}

/** Apply all active filters and render the filtered list */
function applyFilters() {
  let txs = getTransactions();

  const search  = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat     = document.getElementById('filterCat')?.value    || 'all';
  const type    = document.getElementById('filterType')?.value   || 'all';
  const dateFrom = document.getElementById('filterDateFrom')?.value;
  const dateTo   = document.getElementById('filterDateTo')?.value;
  const amtMin   = parseFloat(document.getElementById('filterAmtMin')?.value) || 0;
  const amtMax   = parseFloat(document.getElementById('filterAmtMax')?.value) || Infinity;

  txs = txs.filter(tx => {
    if (search && !tx.merchant.toLowerCase().includes(search) && !tx.rawSMS.toLowerCase().includes(search)) return false;
    if (cat !== 'all' && tx.category !== cat)   return false;
    if (type !== 'all' && tx.type !== type)      return false;
    if (tx.amount < amtMin || tx.amount > amtMax) return false;
    if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(tx.date) > new Date(dateTo))   return false;
    return true;
  });

  const badge = document.getElementById('txCountBadge');
  if (badge) badge.textContent = txs.length;
  renderTxList(document.getElementById('txFullList'), txs);
}

function clearFilters() {
  ['searchInput','filterCat','filterType','filterDateFrom','filterDateTo','filterAmtMin','filterAmtMax']
    .forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') el.value = 'all';
      else el.value = '';
    });
  applyFilters();
}

// ══════════════════════════════════════════
// SECTION 14: ANALYTICS PAGE
// ══════════════════════════════════════════

function renderAnalyticsPage() {
  renderInsights();
  renderBarChart();
  renderDoughnutChart();
  renderSuggestions();
}

function renderInsights() {
  const txs    = getTransactions();
  const debits = txs.filter(t => t.type === 'debit');
  const el     = document.getElementById('insightsGrid');
  if (!el) return;

  if (!debits.length) {
    el.innerHTML = '<p style="color:var(--text3);font-size:.82rem">No data yet. Parse some SMS messages!</p>';
    return;
  }

  // Highest spending category
  const catTotals = buildCategoryTotals(debits);
  const topCat = catTotals[0];

  // Most frequent merchant
  const merchantFreq = {};
  debits.forEach(t => { merchantFreq[t.merchant] = (merchantFreq[t.merchant] || 0) + 1; });
  const topMerchant = Object.entries(merchantFreq).sort((a,b) => b[1]-a[1])[0];

  // Daily average (last 30 days)
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30 = debits.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const dailyAvg = last30.length ? last30.reduce((s,t) => s+t.amount, 0) / 30 : 0;

  // Total transactions
  const totalSpent = debits.reduce((s,t) => s+t.amount, 0);

  el.innerHTML = [
    { icon:'🏆', label:'Top Category',     value: topCat ? `${CATEGORIES[topCat[0]].icon} ${topCat[0]}` : '—',       sub: topCat ? `₹${fmtAmt(topCat[1])} total` : '' },
    { icon:'🏪', label:'Top Merchant',     value: topMerchant ? topMerchant[0] : '—',                                  sub: topMerchant ? `${topMerchant[1]} visits` : '' },
    { icon:'📅', label:'Daily Average',    value: `₹${fmtAmt(dailyAvg)}`,                                              sub: 'Last 30 days' },
    { icon:'💸', label:'Total Spent',      value: `₹${fmtAmt(totalSpent)}`,                                            sub: `${debits.length} transactions` },
    { icon:'📈', label:'Avg Txn Value',    value: debits.length ? `₹${fmtAmt(totalSpent/debits.length)}` : '₹0',      sub: 'Per transaction' },
    { icon:'📊', label:'Categories Used',  value: catTotals.length,                                                    sub: 'of 7 categories' }
  ].map(c => `
    <div class="insight-card">
      <div class="insight-icon">${c.icon}</div>
      <div class="insight-label">${c.label}</div>
      <div class="insight-value">${c.value}</div>
      <div class="insight-sub">${c.sub}</div>
    </div>`).join('');
}

function renderSuggestions() {
  const el  = document.getElementById('suggestionsList');
  if (!el) return;

  const txs   = getTransactions().filter(t => t.type === 'debit');
  const tips  = [];

  if (!txs.length) {
    el.innerHTML = '<p style="color:var(--text3);font-size:.82rem">No data for suggestions yet.</p>';
    return;
  }

  // Compare this week vs last week per category
  const now  = new Date();
  const wkStart = new Date(now); wkStart.setDate(now.getDate() - 7);
  const pwkStart = new Date(now); pwkStart.setDate(now.getDate() - 14);

  const catMap = {};
  txs.forEach(t => {
    const d = new Date(t.date);
    if (!catMap[t.category]) catMap[t.category] = { thisWeek: 0, lastWeek: 0 };
    if (d >= wkStart)                           catMap[t.category].thisWeek += t.amount;
    else if (d >= pwkStart && d < wkStart)      catMap[t.category].lastWeek += t.amount;
  });

  Object.entries(catMap).forEach(([cat, vals]) => {
    if (!vals.lastWeek) return;
    const change = ((vals.thisWeek - vals.lastWeek) / vals.lastWeek) * 100;
    if (change > 20) {
      tips.push({ type: 'warn', text: `📈 You spent <strong>${Math.round(change)}% more</strong> on ${cat} this week vs last week.` });
    } else if (change < -20) {
      tips.push({ type: 'good', text: `📉 Great! You spent <strong>${Math.round(Math.abs(change))}% less</strong> on ${cat} this week.` });
    }
  });

  // Budget suggestion
  const budget = getBudget();
  if (budget) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSpent = txs.filter(t => new Date(t.date) >= monthStart).reduce((s,t) => s+t.amount, 0);
    const pct = (monthSpent / budget) * 100;
    if (pct > 100) {
      tips.push({ type: 'warn', text: `🚨 You've exceeded your monthly budget by ₹${fmtAmt(monthSpent - budget)}.` });
    } else if (pct > 80) {
      tips.push({ type: 'warn', text: `⚠️ You've used <strong>${Math.round(pct)}%</strong> of your monthly budget.` });
    }
  }

  // Generic tips
  const catTotals = buildCategoryTotals(txs);
  if (catTotals.length) {
    const top = catTotals[0];
    tips.push({ type: 'info', text: `💡 Your biggest spending category is <strong>${top[0]}</strong> at ₹${fmtAmt(top[1])}.` });
  }
  tips.push({ type: 'good', text: '✅ Tip: Set category budgets to control your spending more precisely.' });

  el.innerHTML = tips.map((t, i) => `
    <div class="suggestion-item ${t.type}" style="animation-delay:${i*80}ms">
      <span>${t.text}</span>
    </div>`).join('');
}

// ══════════════════════════════════════════
// SECTION 15: BUDGET PAGE
// ══════════════════════════════════════════

function renderBudgetPage() {
  const budget     = getBudget();
  const txs        = getTransactions().filter(t => t.type === 'debit');
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSpent = txs.filter(t => new Date(t.date) >= monthStart).reduce((s,t) => s+t.amount, 0);

  const inEl = document.getElementById('budgetInput');
  if (inEl) inEl.value = budget || '';

  const dispEl = document.getElementById('budgetDisplay');
  if (dispEl) {
    if (!budget) {
      dispEl.innerHTML = '<p style="color:var(--text3);font-size:.82rem;margin-top:.75rem">No budget set yet.</p>';
    } else {
      const pct  = Math.min((monthSpent / budget) * 100, 100);
      const rem  = Math.max(budget - monthSpent, 0);
      const cls  = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
      dispEl.innerHTML = `
        <div class="budget-bar-wrap">
          <div class="budget-bar-labels">
            <span>Spent: ₹${fmtAmt(monthSpent)}</span>
            <span>Remaining: ₹${fmtAmt(rem)} / ₹${fmtAmt(budget)}</span>
          </div>
          <div class="budget-track">
            <div class="budget-fill ${cls}" style="width:${pct}%"></div>
          </div>
          <div style="font-size:.72rem;color:var(--text3);margin-top:.4rem;font-family:'DM Mono',monospace">
            ${Math.round(pct)}% used this month
          </div>
        </div>`;
    }
  }

  renderCategoryBudgets(txs, monthStart);
}

function saveBudget() {
  const val = parseFloat(document.getElementById('budgetInput').value);
  if (!val || val <= 0) { showToast('⚠️ Enter a valid budget amount', 'warn'); return; }
  setBudget(val);
  renderBudgetPage();
  checkBudgetAlert();
  showToast(`✅ Budget set to ₹${fmtAmt(val)}`);
}

function renderCategoryBudgets(txs, monthStart) {
  const el = document.getElementById('catBudgetList');
  if (!el) return;

  const catColors = Object.entries(CATEGORIES).map(([k, v]) => ({ name: k, color: v.color, icon: v.icon }));
  const monthTxs  = txs.filter(t => new Date(t.date) >= monthStart);
  const catTotals = {};
  monthTxs.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  const maxSpend = Math.max(...Object.values(catTotals), 1);

  el.innerHTML = catColors.map(({ name, color, icon }) => {
    const spent = catTotals[name] || 0;
    const pct   = Math.min((spent / maxSpend) * 100, 100);
    return `
      <div class="cat-budget-row">
        <div class="cat-budget-name">${icon} ${name}</div>
        <div class="cat-budget-bar-wrap">
          <div class="cat-budget-track">
            <div class="cat-budget-fill" style="width:${pct}%;background:${color}"></div>
          </div>
        </div>
        <div class="cat-budget-pct">₹${spent >= 1000 ? (spent/1000).toFixed(1)+'K' : Math.round(spent)}</div>
      </div>`;
  }).join('');
}

/** Show/hide the budget alert banner */
function checkBudgetAlert() {
  const budget = getBudget();
  const el     = document.getElementById('budgetAlert');
  if (!el) return;
  if (!budget) { el.classList.add('hidden'); return; }

  const txs        = getTransactions().filter(t => t.type === 'debit');
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const spent      = txs.filter(t => new Date(t.date) >= monthStart).reduce((s,t) => s+t.amount, 0);
  const pct        = (spent / budget) * 100;

  if (pct >= 100) {
    el.textContent = `🚨 Budget Exceeded! You've spent ₹${fmtAmt(spent)} of ₹${fmtAmt(budget)} this month.`;
    el.className   = 'budget-banner danger';
    el.classList.remove('hidden');
  } else if (pct >= 80) {
    el.textContent = `⚠️ 80% Budget Alert — ₹${fmtAmt(spent)} spent of ₹${fmtAmt(budget)} this month.`;
    el.className   = 'budget-banner warning';
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// ══════════════════════════════════════════
// SECTION 16: ADD EXPENSE (MANUAL)
// ══════════════════════════════════════════

function handleAddExpense(e) {
  e.preventDefault();
  const amount   = parseFloat(document.getElementById('expAmount').value);
  const type     = document.getElementById('expType').value;
  const merchant = document.getElementById('expMerchant').value.trim();
  const category = document.getElementById('expCategory').value;
  const date     = document.getElementById('expDate').value;
  const notes    = document.getElementById('expNotes').value.trim();

  if (!amount || !merchant || !date) { showToast('⚠️ Please fill all required fields', 'warn'); return; }

  const tx = {
    id:       `tx_${Date.now()}_manual`,
    merchant: merchant.replace(/\b\w/g, c => c.toUpperCase()),
    amount,
    type,
    category,
    bank:     '',
    account:  '',
    balance:  null,
    date:     new Date(date).toISOString(),
    notes,
    rawSMS:   `Manual entry: ${merchant} ₹${amount}`,
    source:   'manual'
  };

  addTransaction(tx);
  e.target.reset();
  document.getElementById('expDate').value = new Date().toISOString().slice(0,10);
  showToast(`✅ ${tx.merchant} — ₹${fmtAmt(amount)} added!`);
  checkBudgetAlert();
}

// ══════════════════════════════════════════
// SECTION 17: VOICE INPUT
// ══════════════════════════════════════════

let recognition = null;

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('⚠️ Voice input not supported in this browser', 'warn');
    return;
  }

  const btn    = document.getElementById('voiceBtn');
  const status = document.getElementById('voiceStatus');

  if (recognition) { recognition.stop(); return; }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = false;

  btn.classList.add('listening');
  btn.textContent = '🔴 Listening...';
  status.textContent = 'Speak now...';

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.toLowerCase();
    status.textContent = `Heard: "${transcript}"`;

    // Simple voice command parsing
    // e.g. "spent five hundred on pizza"
    const amtMatch = transcript.match(/([\d]+(?:[\.,][\d]+)?|hundred|thousand|lakh)/);
    const words = {
      'hundred': 100, 'thousand': 1000, 'lakh': 100000,
      'fifty': 50, 'twenty': 20, 'ten': 10
    };
    let amount = 0;
    if (amtMatch) {
      amount = words[amtMatch[1]] || parseFloat(amtMatch[1].replace(',','.'));
    }

    if (amount > 0) {
      document.getElementById('expAmount').value = amount;
    }

    // Detect category keywords
    const detectedCat = detectCategory(transcript);
    if (detectedCat !== 'Other') {
      document.getElementById('expCategory').value = detectedCat;
    }

    // Try to pick up merchant name
    const merchantMatch = transcript.match(/(?:on|at|to|for)\s+(\w+)/);
    if (merchantMatch) {
      document.getElementById('expMerchant').value = merchantMatch[1];
    }
  };

  recognition.onerror = () => {
    status.textContent = 'Error — try again';
    resetVoiceBtn();
  };

  recognition.onend = () => {
    resetVoiceBtn();
  };

  recognition.start();
}

function resetVoiceBtn() {
  const btn = document.getElementById('voiceBtn');
  if (btn) { btn.classList.remove('listening'); btn.innerHTML = '🎤 Voice Input'; }
  recognition = null;
}

// ══════════════════════════════════════════
// SECTION 18: EDIT & DELETE MODALS
// ══════════════════════════════════════════

function openEditModal(id) {
  const tx = getTransactions().find(t => t.id === id);
  if (!tx) return;
  editingTxId = id;

  document.getElementById('editMerchant').value = tx.merchant;
  document.getElementById('editAmount').value   = tx.amount;
  document.getElementById('editCategory').value = tx.category;
  document.getElementById('editType').value     = tx.type;
  document.getElementById('editNotes').value    = tx.notes || '';
  document.getElementById('editTxId').value     = id;

  document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('editModal').classList.add('hidden');
  editingTxId = null;
}

function saveEditTransaction(e) {
  e.preventDefault();
  const id = document.getElementById('editTxId').value;
  updateTransaction(id, {
    merchant: document.getElementById('editMerchant').value.trim(),
    amount:   parseFloat(document.getElementById('editAmount').value),
    category: document.getElementById('editCategory').value,
    type:     document.getElementById('editType').value,
    notes:    document.getElementById('editNotes').value.trim()
  });
  closeEditModal();
  showToast('✅ Transaction updated!');
  // Re-render current page
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (activePage) renderPage(activePage);
}

function confirmDelete(id) {
  if (!confirm('Delete this transaction? This cannot be undone.')) return;
  deleteTransaction(id);
  showToast('🗑️ Transaction deleted');
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (activePage) renderPage(activePage);
}

// ══════════════════════════════════════════
// SECTION 19: CSV EXPORT
// ══════════════════════════════════════════

function exportCSV() {
  const txs = getTransactions();
  if (!txs.length) { showToast('⚠️ No transactions to export', 'warn'); return; }

  const headers = ['Date','Time','Merchant','Amount','Type','Category','Bank','Account','Balance','Notes','Source'];
  const rows = txs.map(tx => {
    const d = new Date(tx.date);
    return [
      d.toLocaleDateString('en-IN'),
      d.toLocaleTimeString('en-IN'),
      `"${(tx.merchant||'').replace(/"/g,"'")}"`,
      tx.amount,
      tx.type,
      tx.category,
      tx.bank || '',
      tx.account || '',
      tx.balance || '',
      `"${(tx.notes||'').replace(/"/g,"'")}"`,
      tx.source || 'sms'
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `spendsense_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 CSV exported successfully!');
}

// ══════════════════════════════════════════
// SECTION 20: DARK MODE TOGGLE
// ══════════════════════════════════════════

function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  setTheme(next);
  updateThemeBtn();
}

function updateThemeBtn() {
  const btn   = document.getElementById('themeBtn');
  const theme = document.documentElement.getAttribute('data-theme');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ══════════════════════════════════════════
// SECTION 21: TOAST NOTIFICATION
// ══════════════════════════════════════════

let toastTimer = null;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'toast show';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3400);
}

// ══════════════════════════════════════════
// SECTION 22: UTILITY HELPERS
// ══════════════════════════════════════════

/** Format numbers: 1234.5 → "1,234.50" */
function fmtAmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Short format for dashboard stats */
function fmt(n) {
  if (n >= 100000) return (n/100000).toFixed(1) + 'L';
  if (n >= 1000)   return (n/1000).toFixed(1) + 'K';
  return Math.round(n).toString();
}

/** Escape HTML to prevent XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/** Escape for HTML attributes */
function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
