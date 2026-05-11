const API_BASE = 'http://localhost:8000';

let allRepos = [];
let token = null;

// ── DOM refs ──────────────────────────────────────────
const loginScreen    = document.getElementById('login-screen');
const dashScreen     = document.getElementById('dashboard-screen');
const tokenInput     = document.getElementById('token-input');
const eyeBtn         = document.getElementById('eye-btn');
const loginBtn       = document.getElementById('login-btn');
const loginError     = document.getElementById('login-error');
const logoutBtn      = document.getElementById('logout-btn');
const navUsername    = document.getElementById('nav-username');
const navAvatar      = document.getElementById('nav-avatar');
const reposList      = document.getElementById('repos-list');
const searchInput    = document.getElementById('search-input');
const filterSelect   = document.getElementById('filter-select');
const refreshBtn     = document.getElementById('refresh-btn');
const sidebarStats   = document.getElementById('sidebar-stats');

// ── Toggle password visibility ────────────────────────
eyeBtn.addEventListener('click', () => {
  const isPass = tokenInput.type === 'password';
  tokenInput.type = isPass ? 'text' : 'password';
  eyeBtn.textContent = isPass ? '🙈' : '👁';
});

// ── Login ─────────────────────────────────────────────
loginBtn.addEventListener('click', handleLogin);
tokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

async function handleLogin() {
  const val = tokenInput.value.trim();
  if (!val) {
    showError('Введи токен');
    return;
  }
  loginBtn.disabled = true;
  loginBtn.textContent = 'Подключение...';
  hideError();

  // Temporarily save token and try to load repos
  token = val;
  try {
    const repos = await fetchRepos();
    if (repos && !repos.error) {
      allRepos = repos;
      switchToDashboard(repos);
    } else {
      showError(repos?.error || 'Ошибка авторизации. Проверь токен.');
      token = null;
    }
  } catch (err) {
    showError('Не удалось подключиться к серверу. Запущен ли бэкенд?');
    token = null;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Войти';
  }
}

function showError(msg) {
  loginError.textContent = msg;
  loginError.classList.remove('hidden');
}
function hideError() {
  loginError.classList.add('hidden');
}

// ── Fetch repos ───────────────────────────────────────
async function fetchRepos() {
  const headers = token ? { 'X-GitHub-Token': token } : {};
  const res = await fetch(`${API_BASE}/api/projects`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Switch to dashboard ───────────────────────────────
function switchToDashboard(repos) {
  loginScreen.classList.remove('active');
  dashScreen.classList.add('active');
  renderDashboard(repos);
}

function renderDashboard(repos) {
  // Extract username from first repo or token
  const username = repos.length > 0
    ? (repos[0]._owner || repos[0].owner || 'user')
    : 'user';

  const initials = username.slice(0, 2).toUpperCase();
  navAvatar.textContent = initials;
  navUsername.textContent = username;

  renderRepos(repos);
  renderSidebarStats(repos);
}

// ── Render repos ──────────────────────────────────────
function renderRepos(repos) {
  if (!repos.length) {
    reposList.innerHTML = `
      <div class="empty-state">
        <div class="big">📭</div>
        <p>Репозитории не найдены</p>
      </div>`;
    return;
  }

  reposList.innerHTML = '';
  repos.forEach((repo, i) => {
    const card = buildCard(repo);
    card.style.animationDelay = `${i * 40}ms`;
    reposList.appendChild(card);
  });
}

function statusInfo(status) {
  switch (status) {
    case 'Зеленый': return { cls: 'green',  label: 'Stable',       dotCls: 'green'  };
    case 'Желтый':  return { cls: 'yellow', label: 'Development',  dotCls: 'yellow' };
    case 'Красный': return { cls: 'orange', label: 'Active Work',  dotCls: 'orange' };
    default:        return { cls: 'orange', label: status,         dotCls: 'orange' };
  }
}

function buildCard(repo) {
  const card = document.createElement('div');
  const info = statusInfo(repo.status);
  card.className = `repo-card status-${info.cls}`;

  // Build branch pills
  const branches = repo.branches || {};
  const pillsHtml = buildPills(branches);

  // Build description (use repo language or empty)
  const desc = repo.description || repo.language || '';

  card.innerHTML = `
    <div class="card-top">
      <span class="repo-name">${escHtml(repo.name)}</span>
      <span class="status-badge ${info.cls}">
        <span class="dot ${info.dotCls}"></span>
        ${info.label}
      </span>
    </div>
    ${desc ? `<p class="repo-desc">${escHtml(desc)}</p>` : '<p class="repo-desc" style="height:6px"></p>'}
    <div class="branches-row">${pillsHtml}</div>
    <div class="card-meta">
      <span>Ветки: ${countBranches(branches)}</span>
      ${repo.stars != null ? `<span>★ ${repo.stars}</span>` : ''}
    </div>
  `;

  return card;
}

function buildPills(branches) {
  let html = '';
  const other = branches.other || [];
  const features = branches.features || [];
  const bugfixes = branches.bugfixes || [];

  // main / develop from "other"
  const main = other.find(b => b === 'main' || b === 'master');
  const develop = other.find(b => b === 'develop');
  const rest = other.filter(b => b !== main && b !== develop);

  if (main)    html += pill(main,    'main');
  if (develop) html += pill(develop, 'develop');
  features.forEach(b => { html += pill(b, 'feature'); });
  bugfixes.forEach(b => { html += pill(b, 'bugfix'); });
  rest.forEach(b => { html += pill(b, 'other'); });

  return html || pill('(no branches)', 'other');
}

function pill(name, type) {
  return `<span class="branch-pill ${type}">${escHtml(name)}</span>`;
}

function countBranches(branches) {
  return Object.values(branches).reduce((s, arr) => s + arr.length, 0);
}

// ── Sidebar stats ─────────────────────────────────────
function renderSidebarStats(repos) {
  const counts = {
    total:   repos.length,
    green:   repos.filter(r => r.status === 'Зеленый').length,
    yellow:  repos.filter(r => r.status === 'Желтый').length,
    red:     repos.filter(r => r.status === 'Красный').length,
  };

  sidebarStats.innerHTML = `
    <p class="stat-label">ИТОГО</p>
    <div class="stat-row"><span class="stat-name">Репозиториев</span><span class="stat-val">${counts.total}</span></div>
    <div class="stat-row"><span class="stat-name">Стабильных</span><span class="stat-val" style="color:var(--green)">${counts.green}</span></div>
    <div class="stat-row"><span class="stat-name">В разработке</span><span class="stat-val" style="color:var(--yellow)">${counts.yellow}</span></div>
    <div class="stat-row"><span class="stat-name">Активных</span><span class="stat-val" style="color:var(--orange)">${counts.red}</span></div>
  `;
}

// ── Search & filter ───────────────────────────────────
function getFiltered() {
  const q      = searchInput.value.toLowerCase().trim();
  const status = filterSelect.value;
  return allRepos.filter(r => {
    const matchName   = r.name.toLowerCase().includes(q);
    const matchStatus = status === 'all' || r.status === status;
    return matchName && matchStatus;
  });
}

searchInput.addEventListener('input', () => renderRepos(getFiltered()));
filterSelect.addEventListener('change', () => renderRepos(getFiltered()));

// ── Refresh ───────────────────────────────────────────
refreshBtn.addEventListener('click', async () => {
  reposList.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Обновление...</p></div>`;
  try {
    const repos = await fetchRepos();
    if (repos && !repos.error) {
      allRepos = repos;
      renderRepos(getFiltered());
      renderSidebarStats(repos);
    }
  } catch (e) {
    reposList.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Ошибка обновления</p></div>`;
  }
});

// ── Logout ────────────────────────────────────────────
logoutBtn.addEventListener('click', () => {
  token = null;
  allRepos = [];
  tokenInput.value = '';
  dashScreen.classList.remove('active');
  loginScreen.classList.add('active');
  reposList.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Загрузка репозиториев...</p></div>`;
  searchInput.value = '';
  filterSelect.value = 'all';
  sidebarStats.innerHTML = '';
});

// ── Utils ─────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
