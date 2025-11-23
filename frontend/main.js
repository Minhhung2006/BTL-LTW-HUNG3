/* main.js
  Frontend JS - adjusts endpoints below if your backend endpoints differ
*/

const API_BASE = ''; // if frontend served from same origin + proxy -> use ''
// If you're opening index.html directly and backend is at localhost:4000, set:
// const API_BASE = 'http://localhost:4000';

const userIdInput = document.getElementById('userIdInput');
const monthPicker = document.getElementById('monthPicker');
const refreshBtn = document.getElementById('refreshBtn');
const totalSpentEl = document.getElementById('totalSpent');
const limitAmountEl = document.getElementById('limitAmount');
const percentEl = document.getElementById('percent');
const alertBox = document.getElementById('alertBox');
const pieCtx = document.getElementById('pieChart').getContext('2d');
const barCtx = document.getElementById('barChart').getContext('2d');
const txTableBody = document.querySelector('#txTable tbody');
const categorySelect = document.getElementById('categorySelect');
const addTxForm = document.getElementById('addTxForm');
const setBudgetForm = document.getElementById('setBudgetForm');
const yearInput = document.getElementById('yearInput');
const budgetMonthEl = document.getElementById('budgetMonth');
const budgetAmountEl = document.getElementById('budgetAmount');

let pieChartInstance = null;
let barChartInstance = null;

// default values
const now = new Date();
monthPicker.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
yearInput.value = now.getFullYear();
budgetMonthEl.value = monthPicker.value;

// helper format
function formatMoney(n){
  return Intl.NumberFormat('vi-VN').format(n) + ' VNĐ';
}

function showAlert(msg){
  alertBox.style.display = 'block';
  alertBox.innerText = msg;
}
function hideAlert(){
  alertBox.style.display = 'none';
  alertBox.innerText = '';
}

// load categories
async function loadCategories(){
  try {
    const uid = userIdInput.value || 1;
    const res = await fetch(`${API_BASE}/api/categories/${uid}`);
    if(!res.ok) return;
    const cats = await res.json();
    categorySelect.innerHTML = '<option value="">-- chọn --</option>';
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c.category_id ?? c.categoryId ?? c.id;
      o.textContent = c.name;
      categorySelect.appendChild(o);
    });
  } catch (err) {
    console.error('loadCategories', err);
  }
}

// load monthly report
async function loadMonthly(){
  const uid = userIdInput.value || 1;
  const monthVal = monthPicker.value; // YYYY-MM
  const [y,m] = monthVal.split('-');
  const monthParam = `${y}-${m}`;
  try {
    const res = await fetch(`${API_BASE}/api/report/monthly?user_id=${uid}&month=${y}-${m}`);
    if(!res.ok){
      console.warn('monthly API returned', res.status);
      return;
    }
    const data = await res.json();

    // total / limit / percent
    const total = Number(data.total_spent || data.total || 0);
    const limit = Number(data.limit_amount || data.limit || 0);
    const percent = data.percent_of_limit ?? data.percent ?? (limit ? Math.round(total/limit*10000)/100 : 0);
    totalSpentEl.innerText = formatMoney(total);
    limitAmountEl.innerText = formatMoney(limit);
    percentEl.innerText = percent + '%';

    if(data.over_amount && Number(data.over_amount) > 0){
      showAlert(`Bạn đã vượt định mức: ${formatMoney(Number(data.over_amount))}`);
    } else {
      hideAlert();
    }

    // pie chart - by_category or categories
    const byCat = data.by_category ?? data.categories ?? [];
    const labels = byCat.map(c => c.name || c.category_name || 'Khác');
    const values = byCat.map(c => Number(c.amount || c.sum || 0));
    if(pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data: values }]
      }
    });

  } catch (err) {
    console.error('loadMonthly', err);
  }
}

// load transactions for month (or all)
async function loadTransactions(){
  const uid = userIdInput.value || 1;
  try {
    // endpoint expects /api/transactions/:user_id
    const res = await fetch(`${API_BASE}/api/transactions/${uid}`);
    if(!res.ok){
      console.warn('transactions API returned', res.status);
      return;
    }
    const rows = await res.json();
    // filter by selected month
    const [y,m] = monthPicker.value.split('-');
    const start = new Date(y, Number(m)-1, 1);
    const end = new Date(y, Number(m), 1);
    const filtered = rows.filter(r => {
      const d = new Date(r.transaction_date || r.created_time || r.transactionDate || r.createdAt);
      return d >= start && d < end;
    });

    txTableBody.innerHTML = '';
    filtered.forEach(r => {
      const tr = document.createElement('tr');
      const d = new Date(r.transaction_date || r.created_time || r.transactionDate || r.createdAt);
      tr.innerHTML = `<td>${d.toLocaleDateString()}</td><td>${r.category_name ?? r.name ?? ''}</td><td>${r.note ?? ''}</td><td style="text-align:right">${formatMoney(Number(r.amount))}</td>`;
      txTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('loadTransactions', err);
  }
}

// load yearly stats
async function loadYearly(){
  const uid = userIdInput.value || 1;
  const year = yearInput.value || (new Date()).getFullYear();
  try {
    const res = await fetch(`${API_BASE}/api/report/yearly?user_id=${uid}&year=${year}`);
    if(!res.ok){ console.warn('yearly API', res.status); return; }
    const data = await res.json();
    const months = data.data.map(d => d.month);
    const spent = data.data.map(d => Number(d.total_spent || 0));
    const limits = data.data.map(d => Number(d.limit_amount || 0));
    const over = data.data.map(d => Number(d.over_amount || 0));

    if(barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Đã chi', data: spent, stack: 'a' },
          { label: 'Định mức', data: limits, stack: 'b' },
          { label: 'Vượt', data: over, stack: 'c' }
        ]
      },
      options: {
        scales: { y: { beginAtZero: true } }
      }
    });

  } catch (err) {
    console.error('loadYearly', err);
  }
}

// add transaction
addTxForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user_id = Number(userIdInput.value || 1);
  const category_id = categorySelect.value || null;
  const amount = Number(document.getElementById('txAmount').value || 0);
  const note = document.getElementById('txNote').value || '';
  const date = document.getElementById('txDate').value;

  try {
    const res = await fetch(`${API_BASE}/api/transactions`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ user_id, category_id, amount, note, transaction_date: date })
    });
    if (!res.ok) {
      const txt = await res.text();
      alert('Thêm thất bại: ' + txt);
      return;
    }
    addTxForm.reset();
    await refreshAll();
  } catch (err) {
    console.error('addTx', err);
  }
});

// set budget
setBudgetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user_id = Number(userIdInput.value || 1);
  const month = budgetMonthEl.value; // yyyy-mm
  const limit_amount = Number(budgetAmountEl.value);
  if(!month){ alert('Chọn tháng'); return; }

  // budget_month in DB expects date first of month
  const [y,m] = month.split('-');
  const budget_month = `${y}-${m}-01`;

  try {
    const res = await fetch(`${API_BASE}/api/budgets`, {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ user_id, limit_amount, budget_month })
    });
    if(!res.ok){ alert('Lưu thất bại'); return; }
    setBudgetForm.reset();
    budgetMonthEl.value = monthPicker.value;
    await refreshAll();
  } catch (err) {
    console.error('setBudget', err);
  }
});

async function refreshAll(){
  await Promise.all([loadCategories(), loadMonthly(), loadTransactions(), loadYearly()]);
}

refreshBtn.addEventListener('click', refreshAll);
monthPicker.addEventListener('change', refreshAll);
userIdInput.addEventListener('change', refreshAll);
yearInput.addEventListener('change', loadYearly);

// initial load
loadCategories().then(() => refreshAll());
