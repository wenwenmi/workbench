/* ===== 文文的工作台 - 主逻辑 ===== */

// ========== 数据存储 ==========
const DB = {
  get(key, def) {
    try { let v = localStorage.getItem('ww_' + key); return v ? JSON.parse(v) : def; }
    catch(e) { return def; }
  },
  set(key, val) { localStorage.setItem('ww_' + key, JSON.stringify(val)); }
};

// ========== 工具函数 ==========
function $(s) { return document.querySelector(s); }
function $$(s) { return document.querySelectorAll(s); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function toast(msg) {
  let t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 2000);
}
function fmtMoney(n) { return '¥' + Number(n).toFixed(2); }

// ========== 导航 ==========
const MODULES = ['todo', 'account', 'fitness', 'calendar', 'study'];
const MODULE_NAMES = { todo: '个人待办', account: '记账本', fitness: '运动健身', calendar: '日历天气', study: '学习区' };

function switchModule(name) {
  MODULES.forEach(m => {
    $('#mod-' + m).classList.toggle('active', m === name);
    $('#nav-' + m).classList.toggle('active', m === name);
  });
  $('#header-title').textContent = MODULE_NAMES[name];
  closeSidebar();
  if (name === 'calendar') renderCalendar();
  if (name === 'account') renderAccount();
  if (name === 'fitness') renderFitness();
  if (name === 'study') renderStudy();
}

function toggleSidebar() {
  let sb = $('#sidebar');
  if (sb.classList.contains('show')) closeSidebar();
  else openSidebar();
}
function openSidebar() {
  $('#sidebar').classList.add('show');
  $('#sidebar-overlay').classList.add('show');
  updateSidebarTime();
}
function closeSidebar() {
  $('#sidebar').classList.remove('show');
  $('#sidebar-overlay').classList.remove('show');
}
function updateSidebarTime() {
  let now = new Date();
  let days = ['周日','周一','周二','周三','周四','周五','周六'];
  let timeStr = `${now.getMonth()+1}月${now.getDate()}日 ${days[now.getDay()]} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  $('#sidebar-time').textContent = timeStr;
  $('#header-date').textContent = `${now.getMonth()+1}.${String(now.getDate()).padStart(2,'0')}`;
}

// ========== 待办模块 ==========
function getTodos() { return DB.get('todos', []); }
function saveTodos(d) { DB.set('todos', d); }

function renderTodo() {
  const todos = getTodos();
  const today = todayStr();
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const pending = total - done;
  const overdue = todos.filter(t => !t.done && t.due && t.due < today).length;
  const rate = total ? Math.round(done / total * 100) : 0;

  $('#todo-stats').innerHTML = `
    <div class="stat-card"><div class="label">总数</div><div class="value">${total}</div></div>
    <div class="stat-card"><div class="label">未完成</div><div class="value">${pending}</div></div>
    <div class="stat-card"><div class="label">已过期</div><div class="value">${overdue}</div></div>
    <div class="stat-card"><div class="label">完成率</div><div class="value">${rate}%</div></div>`;

  const filter = $('#todo-filter')?.dataset.filter || 'all';
  let list = todos;
  if (filter === 'pending') list = todos.filter(t => !t.done);
  if (filter === 'done') list = todos.filter(t => t.done);
  if (filter === 'overdue') list = todos.filter(t => !t.done && t.due && t.due < today);

  if (!list.length) {
    $('#todo-list').innerHTML = '<div class="empty">暂无待办事项<br>点击下方按钮添加</div>';
    return;
  }
  $('#todo-list').innerHTML = list.map((t, i) => {
    const pri = { '高': 'tag-high', '中': 'tag-mid', '低': 'tag-low' }[t.priority] || 'tag-mid';
    const isOverdue = !t.done && t.due && t.due < today;
    return `<div class="list-item ${t.done ? 'done' : ''}" data-idx="${todos.indexOf(t)}">
      <div class="checkbox ${t.done ? 'checked' : ''}" onclick="toggleTodo(${todos.indexOf(t)})">${t.done ? '✓' : ''}</div>
      <div class="item-content">
        <div class="item-title">${t.title}</div>
        <div class="item-meta">
          <span class="tag ${pri}">${t.priority || '中'}</span>
          ${t.category ? `<span style="margin-left:4px">${t.category}</span>` : ''}
          ${t.due ? `<span style="margin-left:6px">📅 ${t.due}</span>` : ''}
          ${isOverdue ? '<span class="tag tag-overdue" style="margin-left:4px">过期</span>' : ''}
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm btn-outline" onclick="editTodo(${todos.indexOf(t)})">编辑</button>
      </div>
    </div>`;
  }).join('');
}

function toggleTodo(idx) {
  let todos = getTodos();
  todos[idx].done = !todos[idx].done;
  if (todos[idx].done) todos[idx].completedAt = new Date().toISOString();
  saveTodos(todos);
  renderTodo();
}

function editTodo(idx) {
  let todos = getTodos();
  showTodoModal(todos[idx], idx);
}

function deleteTodo(idx) {
  let todos = getTodos();
  todos.splice(idx, 1);
  saveTodos(todos);
  renderTodo();
  toast('已删除');
}

function showTodoModal(data, editIdx) {
  data = data || { title: '', category: '工作', priority: '中', due: todayStr(), note: '', done: false };
  $('#modal-body').innerHTML = `
    <h3>${editIdx !== undefined ? '编辑' : '新建'}待办</h3>
    <div class="field"><label>事项名称</label><input class="input" id="td-title" value="${data.title}" placeholder="输入待办事项"></div>
    <div class="field"><label>分类</label>
      <select class="select" id="td-cat">
        ${['工作','学习','生活','健康','其他'].map(c => `<option ${c===data.category?'selected':''}>${c}</option>`).join('')}
      </select></div>
    <div class="field"><label>优先级</label>
      <select class="select" id="td-pri">
        ${['高','中','低'].map(p => `<option ${p===data.priority?'selected':''}>${p}</option>`).join('')}
      </select></div>
    <div class="field"><label>截止日期</label><input class="input" type="date" id="td-due" value="${data.due}"></div>
    <div class="field"><label>备注</label><textarea class="textarea" id="td-note">${data.note}</textarea></div>
    <div class="modal-actions">
      ${editIdx !== undefined ? '<button class="btn btn-danger" onclick="deleteTodo('+editIdx+')">删除</button>' : ''}
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveTodoModal(${editIdx})">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}

function saveTodoModal(editIdx) {
  let title = $('#td-title').value.trim();
  if (!title) { toast('请输入事项名称'); return; }
  let item = {
    title, category: $('#td-cat').value, priority: $('#td-pri').value,
    due: $('#td-due').value, note: $('#td-note').value.trim(), done: false,
    createdAt: new Date().toISOString()
  };
  let todos = getTodos();
  if (editIdx !== undefined) { item.done = todos[editIdx].done; item.completedAt = todos[editIdx].completedAt; todos[editIdx] = item; }
  else todos.push(item);
  saveTodos(todos);
  closeModal();
  renderTodo();
  toast(editIdx !== undefined ? '已更新' : '已添加');
}

// ========== 记账模块 ==========
function getAccounts() { return DB.get('accounts', []); }
function saveAccounts(d) { DB.set('accounts', d); }
function getBudget() { return DB.get('budget', 5000); }

function renderAccount() {
  const records = getAccounts();
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRecs = records.filter(r => r.date.startsWith(ym));
  const income = monthRecs.filter(r => r.type === '收入').reduce((s, r) => s + r.amount, 0);
  const expense = monthRecs.filter(r => r.type === '支出').reduce((s, r) => s + r.amount, 0);
  const balance = income - expense;
  const budget = getBudget();
  const remain = budget - expense;

  $('#acc-stats').innerHTML = `
    <div class="stat-card"><div class="label">本月收入</div><div class="value" style="color:#2E7D32">${fmtMoney(income)}</div></div>
    <div class="stat-card"><div class="label">本月支出</div><div class="value" style="color:#C62828">${fmtMoney(expense)}</div></div>
    <div class="stat-card"><div class="label">结余</div><div class="value">${fmtMoney(balance)}</div></div>
    <div class="stat-card"><div class="label">预算剩余</div><div class="value" style="color:${remain < 0 ? '#C62828' : '#2E7D32'}">${fmtMoney(remain)}</div></div>`;

  // 超支提醒
  let warn = '';
  if (remain < 0) warn = `<div class="card" style="background:#FFEBEE;color:#C62828;text-align:center;font-weight:600">⚠ 本月已超支 ${fmtMoney(Math.abs(remain))}</div>`;
  $('#acc-warn').innerHTML = warn;

  // 图表
  renderAccountChart(monthRecs);

  // 记录列表
  if (!records.length) {
    $('#acc-list').innerHTML = '<div class="empty">暂无记录<br>点击下方按钮记一笔</div>';
    return;
  }
  let sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  $('#acc-list').innerHTML = sorted.map(r => {
    let idx = records.indexOf(r);
    let color = r.type === '收入' ? '#2E7D32' : '#C62828';
    let sign = r.type === '收入' ? '+' : '-';
    return `<div class="list-item" data-idx="${idx}">
      <div style="width:36px;height:36px;border-radius:8px;background:${r.type==='收入'?'#C8E6C9':'#FFCDD2'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${r.type==='收入'?'💰':'🛒'}</div>
      <div class="item-content">
        <div class="item-title">${r.category}</div>
        <div class="item-meta">${r.date} ${r.note || ''}</div>
      </div>
      <div style="font-weight:700;color:${color}">${sign}${fmtMoney(r.amount)}</div>
    </div>`;
  }).join('');
}

function renderAccountChart(monthRecs) {
  // 支出分类统计
  let byCat = {};
  monthRecs.filter(r => r.type === '支出').forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + r.amount; });
  let cats = Object.keys(byCat);
  let total = cats.reduce((s, c) => s + byCat[c], 0);

  let chartHtml = '';
  if (cats.length) {
    const colors = ['#81C784','#EC407A','#FFB74D','#7E57C2','#26C6DA','#EF5350','#66BB6A','#AB47BC'];
    chartHtml = '<div class="card-title">📊 本月支出分布</div>';
    cats.forEach((c, i) => {
      let pct = Math.round(byCat[c] / total * 100);
      chartHtml += `<div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px">
          <span>${c}</span><span>${fmtMoney(byCat[c])} (${pct}%)</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div></div>
      </div>`;
    });
  } else {
    chartHtml = '<div class="empty">本月暂无支出数据</div>';
  }
  $('#acc-chart').innerHTML = chartHtml;
}

function showAccountModal() {
  $('#modal-body').innerHTML = `
    <h3>记一笔</h3>
    <div class="field"><label>类型</label>
      <div class="toggle-group">
        <div class="toggle-btn active" id="tg-expense" onclick="accToggleType('支出')">🛒 支出</div>
        <div class="toggle-btn" id="tg-income" onclick="accToggleType('收入')">💰 收入</div>
      </div></div>
    <div class="field"><label>金额</label><input class="input" id="acc-amount" type="number" step="0.01" placeholder="0.00"></div>
    <div class="field"><label>分类</label>
      <select class="select" id="acc-cat"></select></div>
    <div class="field"><label>日期</label><input class="input" type="date" id="acc-date" value="${todayStr()}"></div>
    <div class="field"><label>备注</label><input class="input" id="acc-note" placeholder="可选备注"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveAccountModal()">保存</button>
    </div>`;
  $('#modal').classList.add('show');
  accToggleType('支出');
}

let _accType = '支出';
function accToggleType(type) {
  _accType = type;
  $('#tg-expense').classList.toggle('active', type === '支出');
  $('#tg-income').classList.toggle('active', type === '收入');
  let cats = type === '支出'
    ? ['餐饮','交通','购物','居家','娱乐','医疗','教育','其他']
    : ['工资','奖金','兼职','投资','其他'];
  $('#acc-cat').innerHTML = cats.map(c => `<option>${c}</option>`).join('');
}

function saveAccountModal() {
  let amount = parseFloat($('#acc-amount').value);
  if (!amount || amount <= 0) { toast('请输入有效金额'); return; }
  let rec = { type: _accType, amount, category: $('#acc-cat').value, date: $('#acc-date').value, note: $('#acc-note').value.trim() };
  let records = getAccounts();
  records.push(rec);
  saveAccounts(records);
  closeModal();
  renderAccount();
  toast('已记录');
}

function showBudgetModal() {
  $('#modal-body').innerHTML = `
    <h3>设置月度预算</h3>
    <div class="field"><label>月度预算金额</label><input class="input" id="bdg-val" type="number" value="${getBudget()}" step="100"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveBudgetModal()">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}
function saveBudgetModal() {
  let v = parseFloat($('#bdg-val').value);
  if (v < 0) { toast('请输入有效金额'); return; }
  DB.set('budget', v);
  closeModal();
  renderAccount();
  toast('预算已更新');
}

function exportAccounts() {
  let records = getAccounts();
  if (!records.length) { toast('暂无数据'); return; }
  let csv = '\ufeff日期,类型,分类,金额,备注\n';
  records.forEach(r => { csv += `${r.date},${r.type},${r.category},${r.amount},${r.note || ''}\n`; });
  let blob = new Blob([csv], { type: 'text/csv' });
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `记账_${todayStr()}.csv`;
  a.click();
  toast('已导出 CSV');
}

// ========== 运动模块 ==========
const EX_TYPES = ['游泳', '体态调整', '减脂塑形'];
function getFitness() { return DB.get('fitness', []); }
function saveFitness(d) { DB.set('fitness', d); }
function getMetrics() { return DB.get('metrics', []); }
function saveMetrics(d) { DB.set('metrics', d); }
function getFitGoals() { return DB.get('fitGoals', { sessions: 20, duration: 1200, weight: 65 }); }
function saveFitGoals(d) { DB.set('fitGoals', d); }

function renderFitness() {
  const records = getFitness();
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRecs = records.filter(r => r.date.startsWith(ym));
  const sessions = monthRecs.length;
  const duration = monthRecs.reduce((s, r) => s + r.duration, 0);
  const calories = monthRecs.reduce((s, r) => s + r.calories, 0);
  const goals = getFitGoals();

  $('#fit-stats').innerHTML = `
    <div class="stat-card"><div class="label">本月次数</div><div class="value">${sessions}</div></div>
    <div class="stat-card"><div class="label">时长(分)</div><div class="value">${duration}</div></div>
    <div class="stat-card"><div class="label">热量</div><div class="value">${calories}</div></div>
    <div class="stat-card"><div class="label">目标</div><div class="value" style="color:${sessions>=goals.sessions?'#2E7D32':'#C62828'}">${sessions}/${goals.sessions}</div></div>`;

  // 目标进度
  let pctS = Math.min(sessions / goals.sessions * 100, 100);
  let pctD = Math.min(duration / goals.duration * 100, 100);
  $('#fit-goals').innerHTML = `
    <div class="card-title">🎯 目标进度</div>
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px"><span>月度次数</span><span>${sessions}/${goals.sessions}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pctS}%"></div></div>
    </div>
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px"><span>月度时长</span><span>${duration}/${goals.duration}分钟</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pctD}%"></div></div>
    </div>
    <button class="btn btn-sm btn-outline btn-full" onclick="showGoalsModal()">设置目标</button>`;

  // 运动分布
  let byType = {};
  monthRecs.forEach(r => { byType[r.type] = (byType[r.type] || 0) + r.duration; });
  let chartHtml = '<div class="card-title">📊 本月运动分布</div>';
  let totalDur = Object.values(byType).reduce((s, v) => s + v, 0);
  if (totalDur) {
    const colors = ['#81C784','#EC407A','#FFB74D','#7E57C2'];
    Object.keys(byType).forEach((t, i) => {
      let pct = Math.round(byType[t] / totalDur * 100);
      chartHtml += `<div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px"><span>${t}</span><span>${byType[t]}分钟 (${pct}%)</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${colors[i%4]}"></div></div>
      </div>`;
    });
  } else { chartHtml += '<div class="empty">本月暂无运动记录</div>'; }
  $('#fit-chart').innerHTML = chartHtml;

  // 记录列表
  if (!records.length) {
    $('#fit-list').innerHTML = '<div class="empty">暂无运动记录</div>';
    return;
  }
  let sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const icons = { '游泳': '🏊', '体态调整': '🧘', '减脂塑形': '💪' };
  $('#fit-list').innerHTML = sorted.map(r => {
    let idx = records.indexOf(r);
    return `<div class="list-item">
      <div style="width:36px;height:36px;border-radius:8px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${icons[r.type]||'🏃'}</div>
      <div class="item-content">
        <div class="item-title">${r.type}</div>
        <div class="item-meta">${r.date} · ${r.duration}分钟 · ${r.calories}千卡 · ${r.intensity} ${r.note?'· '+r.note:''}</div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="deleteFitness(${idx})">删除</button>
    </div>`;
  }).join('');
}

function showFitnessModal() {
  $('#modal-body').innerHTML = `
    <h3>记录运动</h3>
    <div class="field"><label>运动类型</label>
      <select class="select" id="fit-type">${EX_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></div>
    <div class="field"><label>日期</label><input class="input" type="date" id="fit-date" value="${todayStr()}"></div>
    <div class="field"><label>时长(分钟)</label><input class="input" type="number" id="fit-dur" value="60"></div>
    <div class="field"><label>消耗(千卡)</label><input class="input" type="number" id="fit-cal" value="300"></div>
    <div class="field"><label>强度</label>
      <select class="select" id="fit-int">${['轻松','中等','高强度'].map(i=>`<option>${i}</option>`).join('')}</select></div>
    <div class="field"><label>备注</label><input class="input" id="fit-note" placeholder="可选"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveFitnessModal()">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}
function saveFitnessModal() {
  let rec = {
    type: $('#fit-type').value, date: $('#fit-date').value,
    duration: parseInt($('#fit-dur').value) || 0, calories: parseFloat($('#fit-cal').value) || 0,
    intensity: $('#fit-int').value, note: $('#fit-note').value.trim()
  };
  let records = getFitness();
  records.push(rec);
  saveFitness(records);
  closeModal();
  renderFitness();
  toast('已记录');
}
function deleteFitness(idx) {
  let records = getFitness();
  records.splice(idx, 1);
  saveFitness(records);
  renderFitness();
  toast('已删除');
}

function showMetricModal() {
  $('#modal-body').innerHTML = `
    <h3>记录身体指标</h3>
    <div class="field"><label>日期</label><input class="input" type="date" id="mt-date" value="${todayStr()}"></div>
    <div class="field"><label>体重(kg)</label><input class="input" type="number" step="0.1" id="mt-weight" placeholder="可选"></div>
    <div class="field"><label>体脂率(%)</label><input class="input" type="number" step="0.1" id="mt-bf" placeholder="可选"></div>
    <div class="field"><label>静息心率</label><input class="input" type="number" id="mt-hr" placeholder="可选"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveMetricModal()">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}
function saveMetricModal() {
  let rec = { date: $('#mt-date').value };
  if ($('#mt-weight').value) rec.weight = parseFloat($('#mt-weight').value);
  if ($('#mt-bf').value) rec.bodyfat = parseFloat($('#mt-bf').value);
  if ($('#mt-hr').value) rec.heartRate = parseInt($('#mt-hr').value);
  if (Object.keys(rec).length < 2) { toast('至少填一项'); return; }
  let metrics = getMetrics();
  metrics.push(rec);
  saveMetrics(metrics);
  closeModal();
  renderFitness();
  toast('已记录');
}

function showGoalsModal() {
  let g = getFitGoals();
  $('#modal-body').innerHTML = `
    <h3>设置运动目标</h3>
    <div class="field"><label>月度次数目标</label><input class="input" type="number" id="g-s" value="${g.sessions}"></div>
    <div class="field"><label>月度时长(分钟)</label><input class="input" type="number" id="g-d" value="${g.duration}"></div>
    <div class="field"><label>目标体重(kg)</label><input class="input" type="number" step="0.1" id="g-w" value="${g.weight}"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveGoalsModal()">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}
function saveGoalsModal() {
  saveFitGoals({ sessions: parseInt($('#g-s').value)||20, duration: parseInt($('#g-d').value)||1200, weight: parseFloat($('#g-w').value)||65 });
  closeModal();
  renderFitness();
  toast('目标已更新');
}

// ========== 日历天气模块 ==========
let calYear, calMonth;
function getEvents() { return DB.get('events', []); }
function saveEvents(d) { DB.set('events', d); }
function getCity() { return DB.get('city', { name: '北京', query: 'Beijing' }); }
function saveCity(d) { DB.set('city', d); }

function renderCalendar() {
  if (!calYear) { let n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth(); }
  $('#cal-month').textContent = `${calYear}年${calMonth + 1}月`;

  let first = new Date(calYear, calMonth, 1);
  let startDay = (first.getDay() + 6) % 7; // 周一为首
  let daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  let prevDays = new Date(calYear, calMonth, 0).getDate();
  let today = todayStr();
  let events = getEvents();

  let html = '';
  ['一','二','三','四','五','六','日'].forEach(w => { html += `<div class="cal-weekday">${w}</div>`; });

  // 上月填充
  for (let i = startDay - 1; i >= 0; i--) {
    let d = prevDays - i;
    let prevM = calMonth === 0 ? 11 : calMonth - 1;
    let prevY = calMonth === 0 ? calYear - 1 : calYear;
    let ds = `${prevY}-${String(prevM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let lunar = solar2lunar(prevY, prevM+1, d);
    html += `<div class="cal-day other-month"><span class="solar">${d}</span><span class="lunar">${lunar?lunar.dayStr:''}</span></div>`;
  }
  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    let ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let lunar = solar2lunar(calYear, calMonth+1, d);
    let isToday = ds === today;
    let hasEvent = events.some(e => e.date === ds);
    let dow = new Date(calYear, calMonth, d).getDay();
    let isWeekend = dow === 0 || dow === 6;
    html += `<div class="cal-day ${isToday?'today':''} ${hasEvent?'has-event':''} ${isWeekend?'weekend':''}" onclick="showEventModal('${ds}')">
      <span class="solar">${d}</span><span class="lunar">${lunar?lunar.dayStr:''}</span>
    </div>`;
  }
  // 下月填充
  let total = startDay + daysInMonth;
  let fill = (7 - total % 7) % 7;
  for (let d = 1; d <= fill; d++) {
    let nextM = calMonth === 11 ? 0 : calMonth + 1;
    let nextY = calMonth === 11 ? calYear + 1 : calYear;
    let lunar = solar2lunar(nextY, nextM+1, d);
    html += `<div class="cal-day other-month"><span class="solar">${d}</span><span class="lunar">${lunar?lunar.dayStr:''}</span></div>`;
  }
  $('#cal-grid').innerHTML = html;

  // 今日运势
  renderFortune();
  // 天气
  fetchWeather();
  // 近期事件
  renderEvents();
}

function calPrevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}
function calNextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}
function calGoToday() {
  let n = new Date();
  calYear = n.getFullYear();
  calMonth = n.getMonth();
  renderCalendar();
}

function renderFortune() {
  let today = new Date();
  let ds = todayStr();
  let lunar = solar2lunar(today.getFullYear(), today.getMonth()+1, today.getDate());
  let sign = getZodiacSign(today.getMonth()+1, today.getDate());
  let fortune = getDailyFortune(ds, sign);

  let lunarStr = lunar ? `${lunar.ganzhi}年（${lunar.zodiac}年）${lunar.monthStr}${lunar.dayStr}` : '';
  $('#fortune').innerHTML = `
    <div class="f-title">今日运势 · ${sign}</div>
    ${lunarStr ? `<div style="font-size:12px;color:var(--pink-text);opacity:0.7;margin-bottom:8px">${lunarStr}</div>` : ''}
    <div class="f-row"><span class="f-label">幸运颜色</span><span class="f-val">${fortune.luckyColor}</span></div>
    <div class="f-row"><span class="f-label">幸运数字</span><span class="f-val">${fortune.luckyNum}</span></div>
    <div class="f-row"><span class="f-label">幸运物品</span><span class="f-val">${fortune.luckyItem}</span></div>
    <div class="f-row"><span class="f-label">幸运方位</span><span class="f-val">${fortune.luckyDir}</span></div>
    <div class="f-row"><span class="f-label">爱情</span><span class="f-val stars">${stars(fortune.love)}</span></div>
    <div class="f-row"><span class="f-label">事业</span><span class="f-val stars">${stars(fortune.work)}</span></div>
    <div class="f-row"><span class="f-label">财运</span><span class="f-val stars">${stars(fortune.wealth)}</span></div>
    <div class="f-row"><span class="f-label">健康</span><span class="f-val stars">${stars(fortune.health)}</span></div>
    <div class="tip">提示：${fortune.tip}</div>`;
}

function fetchWeather() {
  let city = getCity();
  $('#weather').innerHTML = `<div class="weather-card"><div class="city">${city.name}</div><div class="temp">--°</div><div class="desc">加载中...</div></div>`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  fetch(`https://wttr.in/${encodeURIComponent(city.query)}?format=j1`, { signal: controller.signal })
    .then(r => r.json())
    .then(data => {
      clearTimeout(timeoutId);
      let cur = data.current_condition[0];
      let area = data.nearest_area[0];
      let cityName = city.name || area.areaName[0].value;
      let temp = cur.temp_C;
      let code = cur.weatherCode;
      let descMap = { '113':'晴','116':'多云','119':'阴','122':'阴','143':'雾','176':'小阵雨','200':'雷雨','227':'小雪','230':'暴雪','248':'雾','260':'雾','263':'小雨','266':'雨','293':'小雨','296':'雨','299':'中雨','302':'大雨','305':'暴雨','308':'暴雨','311':'雨','314':'雨','317':'雨夹雪','320':'雪','323':'小雪','326':'中雪','329':'大雪','332':'大雪','335':'暴雪','338':'暴雪','353':'小雨','356':'中雨','359':'暴雨','362':'雨夹雪','365':'雨夹雪','368':'小雪','371':'大雪','386':'雷阵雨','389':'雷雨','392':'雷雪','395':'暴雪' };
      let desc = descMap[code] || '晴';
      let textIcon = { '113':'[晴]', '116':'[多云]', '119':'[阴]', '122':'[阴]', '143':'[雾]', '176':'[阵雨]', '200':'[雷雨]', '227':'[雪]', '230':'[暴雪]', '248':'[雾]', '260':'[雾]', '263':'[小雨]', '266':'[雨]', '293':'[小雨]', '296':'[雨]', '299':'[中雨]', '302':'[大雨]', '305':'[暴雨]', '308':'[暴雨]', '311':'[雨]', '314':'[雨]', '317':'[雨夹雪]', '320':'[雪]', '323':'[小雪]', '326':'[中雪]', '329':'[大雪]', '332':'[大雪]', '335':'[暴雪]', '338':'[暴雪]', '353':'[小雨]', '356':'[中雨]', '359':'[暴雨]', '362':'[雨夹雪]', '365':'[雨夹雪]', '368':'[小雪]', '371':'[大雪]', '386':'[雷阵雨]', '389':'[雷雨]', '392':'[雷雪]', '395':'[暴雪]' }[code] || '[晴]';
      $('#weather').innerHTML = `
        <div class="weather-card">
          <button class="refresh-btn" onclick="fetchWeather()">刷新</button>
          <div class="city">${cityName}</div>
          <div class="temp">${textIcon} ${temp}°C</div>
          <div class="desc">${desc}</div>
          <div class="details">
            <span>体感 ${cur.FeelsLikeC}°C</span>
            <span>湿度 ${cur.humidity}%</span>
            <span>风 ${cur.windspeedKmph}km/h</span>
          </div>
        </div>`;
    })
    .catch(() => {
      clearTimeout(timeoutId);
      $('#weather .desc').textContent = '获取失败，点击刷新重试';
      $('#weather .temp').innerHTML = '--°';
    });
}

function renderEvents() {
  let events = getEvents();
  let today = todayStr();
  let upcoming = events.filter(e => e.date >= today).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 10);
  if (!upcoming.length) {
    $('#event-list').innerHTML = '<div class="empty">暂无事件<br>点击日历日期添加</div>';
    return;
  }
  $('#event-list').innerHTML = upcoming.map(e => {
    let idx = events.indexOf(e);
    return `<div class="list-item">
      <div style="width:36px;height:36px;border-radius:8px;background:var(--pink-mid);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">📅</div>
      <div class="item-content">
        <div class="item-title">${e.title}</div>
        <div class="item-meta">${e.date} · ${e.category} ${e.note?'· '+e.note:''}</div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="deleteEvent(${idx})">删除</button>
    </div>`;
  }).join('');
}

function showEventModal(date) {
  let events = getEvents();
  let dayEvents = events.filter(e => e.date === date);
  let listHtml = dayEvents.length ? dayEvents.map(e => {
    let idx = events.indexOf(e);
    return `<div class="list-item"><div class="item-content"><div class="item-title">${e.title}</div><div class="item-meta">${e.category} ${e.note||''}</div></div><button class="btn btn-sm btn-danger" onclick="deleteEvent(${idx})">删</button></div>`;
  }).join('') : '<div class="empty">当天暂无事件</div>';

  $('#modal-body').innerHTML = `
    <h3>${date} 事件</h3>
    ${listHtml}
    <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px">
      <div class="field"><label>事件名称</label><input class="input" id="ev-title" placeholder="输入事件"></div>
      <div class="field"><label>分类</label><select class="select" id="ev-cat">${['工作','生活','健康','纪念日','其他'].map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label>备注</label><input class="input" id="ev-note" placeholder="可选"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">关闭</button>
      <button class="btn" onclick="saveEventModal('${date}')">添加</button>
    </div>`;
  $('#modal').classList.add('show');
}
function saveEventModal(date) {
  let title = $('#ev-title').value.trim();
  if (!title) { toast('请输入事件名称'); return; }
  let events = getEvents();
  events.push({ title, date, category: $('#ev-cat').value, note: $('#ev-note').value.trim() });
  saveEvents(events);
  closeModal();
  renderCalendar();
  toast('已添加');
}
function deleteEvent(idx) {
  let events = getEvents();
  events.splice(idx, 1);
  saveEvents(events);
  renderCalendar();
  toast('已删除');
}

function showCityModal() {
  const cities = ['北京','上海','广州','深圳','杭州','成都','武汉','西安','南京','重庆','苏州','天津'];
  const cityMap = {'北京':'Beijing','上海':'Shanghai','广州':'Guangzhou','深圳':'Shenzhen','杭州':'Hangzhou','成都':'Chengdu','武汉':'Wuhan','西安':'Xian','南京':'Nanjing','重庆':'Chongqing','苏州':'Suzhou','天津':'Tianjin'};
  let cur = getCity();
  $('#modal-body').innerHTML = `
    <h3>切换城市</h3>
    <div class="field"><label>常用城市</label><select class="select" id="ct-name">${cities.map(c=>`<option ${c===cur.name?'selected':''}>${c}</option>`).join('')}</select></div>
    <div class="field"><label>或输入其他城市（中文/拼音）</label><input class="input" id="ct-custom" placeholder="留空则使用上方选择"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveCityModal()">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}
function saveCityModal() {
  let custom = $('#ct-custom').value.trim();
  let name = $('#ct-name').value;
  const cityMap = {'北京':'Beijing','上海':'Shanghai','广州':'Guangzhou','深圳':'Shenzhen','杭州':'Hangzhou','成都':'Chengdu','武汉':'Wuhan','西安':'Xian','南京':'Nanjing','重庆':'Chongqing','苏州':'Suzhou','天津':'Tianjin'};
  if (custom) saveCity({ name: custom, query: custom });
  else saveCity({ name, query: cityMap[name] || name });
  closeModal();
  fetchWeather();
  toast('已切换');
}

// ========== 学习模块 ==========
function getResources() { return DB.get('resources', []); }
function saveResources(d) { DB.set('resources', d); }
function getProjects() { return DB.get('projects', []); }
function saveProjects(d) { DB.set('projects', d); }
function getSessions() { return DB.get('sessions', []); }
function saveSessions(d) { DB.set('sessions', d); }
function getNotes() { return DB.get('notes', []); }
function saveNotes(d) { DB.set('notes', d); }

let studyTab = 'pomo';
function switchStudyTab(tab) {
  studyTab = tab;
  ['pomo','res','proj','note'].forEach(t => {
    $('#st-'+t).classList.toggle('active', t === tab);
    $('#stud-'+t).style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'pomo') renderPomo();
  if (tab === 'res') renderResources();
  if (tab === 'proj') renderProjects();
  if (tab === 'note') renderNotes();
}

function renderStudy() { switchStudyTab(studyTab); }

// 番茄钟
let pomoMin = 25, pomoSec = 25 * 60, pomoRunning = false, pomoTimer = null;
function renderPomo() {
  let sessions = getSessions();
  let now = new Date();
  let ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  let monthS = sessions.filter(s => s.start.startsWith(ym));
  let monthMin = monthS.reduce((s, x) => s + x.duration, 0);
  let today = todayStr();
  let todayS = sessions.filter(s => s.start.startsWith(today));
  let todayMin = todayS.reduce((s, x) => s + x.duration, 0);
  $('#pomo-stats').innerHTML = `
    <div class="stat-card"><div class="label">今日番茄</div><div class="value">${todayS.length}</div></div>
    <div class="stat-card"><div class="label">今日时长</div><div class="value">${todayMin}分</div></div>
    <div class="stat-card"><div class="label">本月番茄</div><div class="value">${monthS.length}</div></div>
    <div class="stat-card"><div class="label">本月时长</div><div class="value">${monthMin}分</div></div>`;
  updatePomoDisplay();
}
function updatePomoDisplay() {
  let m = String(Math.floor(pomoSec / 60)).padStart(2, '0');
  let s = String(pomoSec % 60).padStart(2, '0');
  $('#pomo-time').textContent = `${m}:${s}`;
}
function pomoStart() {
  if (!pomoRunning) {
    if (pomoSec === 0) pomoSec = pomoMin * 60;
    pomoRunning = true;
    $('#pomo-status').textContent = '专注中...';
    $('#pomo-btn').textContent = '暂停';
    pomoTimer = setInterval(() => {
      pomoSec--;
      updatePomoDisplay();
      if (pomoSec <= 0) { pomoComplete(); }
    }, 1000);
  } else { pomoPause(); }
}
function pomoPause() {
  pomoRunning = false;
  clearInterval(pomoTimer);
  $('#pomo-status').textContent = '已暂停';
  $('#pomo-btn').textContent = '继续';
}
function pomoStop() {
  pomoRunning = false;
  clearInterval(pomoTimer);
  pomoSec = pomoMin * 60;
  updatePomoDisplay();
  $('#pomo-status').textContent = '已停止';
  $('#pomo-btn').textContent = '开始';
}
function pomoComplete() {
  let elapsed = pomoMin * 60 - pomoSec;
  if (elapsed >= 60) {
    let minutes = Math.round(elapsed / 60);
    let sessions = getSessions();
    sessions.push({ start: new Date().toISOString().slice(0,16).replace('T',' '), duration: minutes });
    saveSessions(sessions);
  }
  pomoRunning = false;
  clearInterval(pomoTimer);
  pomoSec = pomoMin * 60;
  updatePomoDisplay();
  $('#pomo-status').textContent = '🎉 专注完成！';
  $('#pomo-btn').textContent = '开始';
  toast('专注完成！休息一下～');
  renderPomo();
}
function pomoSetMin() {
  let v = parseInt($('#pomo-min-input').value);
  if (v > 0 && v <= 120) {
    pomoMin = v;
    if (!pomoRunning) { pomoSec = v * 60; updatePomoDisplay(); }
    toast('已设置 ' + v + ' 分钟');
  }
}

// 学习资源
function renderResources() {
  let resources = getResources();
  if (!resources.length) { $('#res-list').innerHTML = '<div class="empty">暂无资源<br>点击下方按钮添加</div>'; return; }
  const icons = { '视频课程':'🎬','书籍':'📚','文章':'📄','文档':'📑','网站':'🌐','工具':'🔧' };
  $('#res-list').innerHTML = resources.map((r, i) => `
    <div class="res-item" ${r.url?`onclick="window.open('${r.url}')"`:''}>
      <div class="ri-type">${icons[r.type]||'📎'}</div>
      <div class="ri-info">
        <div class="ri-title">${r.title}</div>
        <div class="ri-meta">${r.type} · ${r.category} · ${r.added} ${r.note?'· '+r.note:''}</div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();deleteResource(${i})">删</button>
    </div>`).join('');
}
function showResourceModal() {
  $('#modal-body').innerHTML = `
    <h3>添加学习资源</h3>
    <div class="field"><label>名称</label><input class="input" id="rs-title" placeholder="资源名称"></div>
    <div class="field"><label>类型</label><select class="select" id="rs-type">${['视频课程','书籍','文章','文档','网站','工具'].map(t=>`<option>${t}</option>`).join('')}</select></div>
    <div class="field"><label>分类</label><select class="select" id="rs-cat">${['编程','语言','设计','商业','科学','其他'].map(c=>`<option>${c}</option>`).join('')}</select></div>
    <div class="field"><label>链接</label><input class="input" id="rs-url" placeholder="https://..."></div>
    <div class="field"><label>备注</label><input class="input" id="rs-note" placeholder="可选"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveResourceModal()">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}
function saveResourceModal() {
  let title = $('#rs-title').value.trim();
  if (!title) { toast('请输入名称'); return; }
  let resources = getResources();
  resources.push({ title, type: $('#rs-type').value, category: $('#rs-cat').value, url: $('#rs-url').value.trim(), note: $('#rs-note').value.trim(), added: todayStr() });
  saveResources(resources);
  closeModal();
  renderResources();
  toast('已添加');
}
function deleteResource(idx) { let r = getResources(); r.splice(idx,1); saveResources(r); renderResources(); toast('已删除'); }

// 学习项目
function renderProjects() {
  let projects = getProjects();
  if (!projects.length) { $('#proj-list').innerHTML = '<div class="empty">暂无学习项目</div>'; return; }
  $('#proj-list').innerHTML = projects.map((p, i) => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:700;font-size:15px">${p.title}</div>
        <span style="font-weight:700;color:${p.progress>=100?'#2E7D32':'var(--pink-deep)'}">${p.progress}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;align-items:center">
        <span style="font-size:12px;color:var(--text-light)">目标：${p.target||'-'}</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-outline" onclick="updateProject(${i})">更新</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProject(${i})">删</button>
        </div>
      </div>
    </div>`).join('');
}
function showProjectModal() {
  $('#modal-body').innerHTML = `
    <h3>添加学习项目</h3>
    <div class="field"><label>项目名称</label><input class="input" id="pj-title" placeholder="如：Python进阶"></div>
    <div class="field"><label>目标</label><input class="input" id="pj-target" placeholder="如：掌握FastAPI"></div>
    <div class="field"><label>初始进度(%)</label><input class="input" type="number" id="pj-prog" value="0" min="0" max="100"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="saveProjectModal()">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}
function saveProjectModal() {
  let title = $('#pj-title').value.trim();
  if (!title) { toast('请输入名称'); return; }
  let projects = getProjects();
  projects.push({ title, target: $('#pj-target').value.trim(), progress: Math.max(0, Math.min(100, parseInt($('#pj-prog').value)||0)), created: todayStr() });
  saveProjects(projects);
  closeModal();
  renderProjects();
  toast('已添加');
}
function updateProject(idx) {
  let projects = getProjects();
  let p = projects[idx];
  $('#modal-body').innerHTML = `
    <h3>更新进度 - ${p.title}</h3>
    <div style="text-align:center;margin:16px 0"><span style="font-size:36px;font-weight:700;color:var(--pink-deep)">${p.progress}%</span></div>
    <div class="field"><label>新进度(%)</label><input class="input" type="number" id="up-prog" value="${p.progress}" min="0" max="100"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn" onclick="doUpdateProject(${idx})">保存</button>
    </div>`;
  $('#modal').classList.add('show');
}
function doUpdateProject(idx) {
  let projects = getProjects();
  projects[idx].progress = Math.max(0, Math.min(100, parseInt($('#up-prog').value)||0));
  saveProjects(projects);
  closeModal();
  renderProjects();
  toast('已更新');
}
function deleteProject(idx) { let p = getProjects(); p.splice(idx,1); saveProjects(p); renderProjects(); toast('已删除'); }

// 学习笔记
let currentNoteIdx = null;
function renderNotes() {
  let notes = getNotes();
  let listHtml = notes.length ? notes.map((n, i) => `
    <div class="note-list-item ${i===currentNoteIdx?'active':''}" onclick="selectNote(${i})">
      <div class="nt">${n.title||'无标题'}</div>
      <div class="nm">${n.modified||n.created||''}</div>
    </div>`).join('') : '<div class="empty">暂无笔记</div>';
  if (currentNoteIdx !== null && notes[currentNoteIdx]) {
    let n = notes[currentNoteIdx];
    $('#note-editor').style.display = 'block';
    $('#note-editor').innerHTML = `
      <input class="input" id="nt-title" value="${n.title}" style="font-weight:700;margin-bottom:8px" placeholder="笔记标题">
      <div style="font-size:11px;color:var(--text-light);margin-bottom:8px">创建：${n.created||''} | 修改：${n.modified||''}</div>
      <textarea class="textarea" id="nt-content" style="min-height:200px" placeholder="开始书写...">${n.content}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-full" onclick="saveNote()">保存</button>
        <button class="btn btn-danger btn-full" onclick="deleteNote()">删除</button>
      </div>`;
  } else {
    $('#note-editor').style.display = 'none';
  }
  $('#note-list').innerHTML = listHtml;
}
function addNote() {
  let notes = getNotes();
  notes.push({ title: '新笔记', content: '', created: new Date().toISOString().slice(0,16).replace('T',' '), modified: new Date().toISOString().slice(0,16).replace('T',' ') });
  saveNotes(notes);
  currentNoteIdx = notes.length - 1;
  renderNotes();
}
function selectNote(idx) { currentNoteIdx = idx; renderNotes(); }
function saveNote() {
  if (currentNoteIdx === null) return;
  let notes = getNotes();
  notes[currentNoteIdx].title = $('#nt-title').value.trim() || '无标题';
  notes[currentNoteIdx].content = $('#nt-content').value;
  notes[currentNoteIdx].modified = new Date().toISOString().slice(0,16).replace('T',' ');
  saveNotes(notes);
  renderNotes();
  toast('已保存');
}
function deleteNote() {
  if (currentNoteIdx === null) return;
  let notes = getNotes();
  notes.splice(currentNoteIdx, 1);
  saveNotes(notes);
  currentNoteIdx = null;
  renderNotes();
  toast('已删除');
}

// ========== 弹窗 ==========
function closeModal() { $('#modal').classList.remove('show'); }

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  // 更新时间
  updateSidebarTime();
  setInterval(updateSidebarTime, 60000);
  // 渲染待办
  renderTodo();
  // 默认显示待办
  switchModule('todo');
  // 点击筛选
  $$('#todo-filter .toggle-btn').forEach(btn => {
    btn.onclick = () => {
      $$('#todo-filter .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('#todo-filter').dataset.filter = btn.dataset.filter;
      renderTodo();
    };
  });
});
