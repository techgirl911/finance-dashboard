// public/js/app.js

const API = '/api';
let token = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let categories = [];
let categoryChart = null;
let currentTxType = 'expense';

// ---------- API helper ----------
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = res.status === 204 ? null : await res.json();

  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

// ---------- Auth UI ----------
function renderAuthArea() {
  const el = document.getElementById('authArea');
  if (currentUser) {
    el.innerHTML = `
      <div class="user-chip">
        <span>${currentUser.name}${currentUser.license_key ? ' ⭐' : ''}</span>
        <button id="logoutBtn">Logout</button>
      </div>`;
    document.getElementById('logoutBtn').onclick = logout;
  } else {
    el.innerHTML = `<button id="openAuth">Login / Register</button>`;
    document.getElementById('openAuth').onclick = () => toggleModal('authModal', true);
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  renderAuthArea();
  document.getElementById('app').classList.add('hidden');
}

document.getElementById('tabLogin').onclick = () => switchAuthTab('login');
document.getElementById('tabRegister').onclick = () => switchAuthTab('register');

function switchAuthTab(which) {
  document.getElementById('tabLogin').classList.toggle('active', which === 'login');
  document.getElementById('tabRegister').classList.toggle('active', which === 'register');
  document.getElementById('loginForm').classList.toggle('hidden', which !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', which !== 'register');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    onAuthSuccess(data);
  } catch (err) {
    document.getElementById('loginError').textContent = err.message;
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  try {
    const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    onAuthSuccess(data);
  } catch (err) {
    document.getElementById('registerError').textContent = err.message;
  }
});

function onAuthSuccess(data) {
  token = data.token;
  currentUser = data.user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(currentUser));
  toggleModal('authModal', false);
  renderAuthArea();
  loadEverything();
}

document.getElementById('closeAuthModal').onclick = () => toggleModal('authModal', false);

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle('hidden', !show);
}

// ---------- Load everything on login ----------
async function loadEverything() {
  document.getElementById('app').classList.remove('hidden');
  await loadCategories();
  await Promise.all([loadSummary(), loadCategoryChart(), loadBudgets(), loadTransactions()]);
}

// ---------- Categories ----------
async function loadCategories() {
  categories = await apiFetch('/categories');
  const txSelect = document.getElementById('txCategory');
  const budgetSelect = document.getElementById('budgetCategory');

  const options = categories.map(c => `<option value="${c.id}">${c.name} (${c.type})</option>`).join('');
  txSelect.innerHTML = options || '<option value="">No categories yet</option>';
  budgetSelect.innerHTML = categories.filter(c => c.type === 'expense')
    .map(c => `<option value="${c.id}">${c.name}</option>`).join('') || '<option value="">No expense categories</option>';
}

// ---------- Summary cards ----------
async function loadSummary() {
  const summary = await apiFetch('/transactions/summary');
  document.getElementById('incomeValue').textContent = formatMoney(summary.income);
  document.getElementById('expenseValue').textContent = formatMoney(summary.expense);
  document.getElementById('netValue').textContent = formatMoney(summary.net);
}

function formatMoney(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

// ---------- Category chart ----------
async function loadCategoryChart() {
  const { breakdown } = await apiFetch('/transactions/by-category');
  const canvas = document.getElementById('categoryChart');
  const emptyNote = document.getElementById('noCategoryData');

  if (!breakdown.length) {
    canvas.classList.add('hidden');
    emptyNote.classList.remove('hidden');
    return;
  }
  canvas.classList.remove('hidden');
  emptyNote.classList.add('hidden');

  const data = {
    labels: breakdown.map(b => b.name),
    datasets: [{
      data: breakdown.map(b => b.total),
      backgroundColor: breakdown.map(b => b.color),
      borderWidth: 0
    }]
  };

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data,
    options: {
      plugins: { legend: { position: 'bottom', labels: { color: '#e8e9ec', font: { size: 11 } } } }
    }
  });
}

// ---------- Budgets ----------
async function loadBudgets() {
  const { progress } = await apiFetch('/budgets/progress');
  const list = document.getElementById('budgetList');

  if (!progress.length) {
    list.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem">No budgets set yet.</p>`;
    return;
  }

  list.innerHTML = progress.map(b => {
    const pct = Math.min(100, Math.round((b.spent / b.monthly_limit) * 100));
    const over = b.spent > b.monthly_limit;
    return `
      <div class="budget-item">
        <div class="budget-item-top">
          <span class="cat-name"><span class="color-dot" style="background:${b.color}"></span>${b.category_name}</span>
          <span>${formatMoney(b.spent)} / ${formatMoney(b.monthly_limit)}</span>
        </div>
        <div class="budget-bar-track">
          <div class="budget-bar-fill ${over ? 'over' : ''}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('budgetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const category_id = document.getElementById('budgetCategory').value;
  const monthly_limit = document.getElementById('budgetLimit').value;
  try {
    await apiFetch('/budgets', { method: 'POST', body: JSON.stringify({ category_id, monthly_limit }) });
    document.getElementById('budgetLimit').value = '';
    loadBudgets();
  } catch (err) {
    document.getElementById('budgetError').textContent = err.message;
  }
});

// ---------- Transactions ----------
async function loadTransactions() {
  const { transactions, demoMode } = await apiFetch('/transactions');
  document.getElementById('demoBanner').classList.toggle('hidden', !demoMode);

  const list = document.getElementById('transactionList');
  if (!transactions.length) {
    list.innerHTML = `<p style="color:var(--text-muted)">No transactions this month yet.</p>`;
    return;
  }

  list.innerHTML = transactions.map(t => `
    <div class="transaction-item">
      <div class="tx-left">
        <span class="tx-desc">${t.description || t.category_name || 'Transaction'}</span>
        <span class="tx-meta">${t.category_name || 'Uncategorized'} · ${t.transaction_date}</span>
      </div>
      <div style="display:flex; align-items:center;">
        <span class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '−'}${formatMoney(t.amount)}</span>
        <button class="tx-delete" data-id="${t.id}">&times;</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.tx-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await apiFetch(`/transactions/${btn.dataset.id}`, { method: 'DELETE' });
        refreshAllFinanceData();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function refreshAllFinanceData() {
  loadSummary();
  loadCategoryChart();
  loadBudgets();
  loadTransactions();
}

// ---------- Add transaction modal ----------
document.getElementById('addTransactionBtn').onclick = () => {
  document.getElementById('txDate').value = new Date().toISOString().slice(0, 10);
  toggleModal('transactionModal', true);
};
document.getElementById('closeTransactionModal').onclick = () => toggleModal('transactionModal', false);

document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTxType = btn.dataset.type;
  });
});

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = document.getElementById('txAmount').value;
  const category_id = document.getElementById('txCategory').value || null;
  const description = document.getElementById('txDescription').value;
  const transaction_date = document.getElementById('txDate').value;

  try {
    await apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify({ amount, type: currentTxType, category_id, description, transaction_date })
    });
    toggleModal('transactionModal', false);
    document.getElementById('transactionForm').reset();
    refreshAllFinanceData();
  } catch (err) {
    document.getElementById('txError').textContent = err.message;
  }
});

// ---------- Category creation (triggered from category select, quick-add) ----------
document.getElementById('closeCategoryModal').onclick = () => toggleModal('categoryModal', false);

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('catName').value;
  const type = document.getElementById('catType').value;
  const color = document.getElementById('catColor').value;

  try {
    await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name, type, color }) });
    toggleModal('categoryModal', false);
    document.getElementById('categoryForm').reset();
    loadCategories();
  } catch (err) {
    document.getElementById('catError').textContent = err.message;
  }
});

// ---------- Upgrade link ----------
document.getElementById('upgradeLink').onclick = (e) => {
  e.preventDefault();
  const key = prompt('Enter your license key (from your purchase email):');
  if (!key) return;
  apiFetch('/auth/activate', { method: 'POST', body: JSON.stringify({ licenseKey: key }) })
    .then(({ user }) => {
      currentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      renderAuthArea();
      refreshAllFinanceData();
      alert('Activated! Full access unlocked.');
    })
    .catch(err => alert(err.message));
};

// ---------- Init ----------
document.getElementById('app').classList.add('hidden');
renderAuthArea();
if (currentUser) loadEverything();