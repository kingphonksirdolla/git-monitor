const API = 'http://127.0.0.1:8000';

let token = '';
let allStatuses = [];
let filterStatus = null;
let allAvailable = [];
let selectedIds = new Set();
let trackedIds = new Set();
let repoMeta = {};

// авторизация

async function handleLogin() {
  const input = document.getElementById('token-input');
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-error');
  const t     = input.value.trim();
  if (!t) return;

  btn.disabled = true;
  btn.textContent = 'Проверка...';
  err.style.display = 'none';

  try {
    const res = await fetch(`${API}/user`, { headers: { token: t } });
    if (!res.ok) throw new Error('Неверный токен или нет доступа');
    const user = await res.json();
    token = t;
    initDashboard(user);
  } catch (e) {
    err.textContent = e.message;
    err.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Войти';
  }
}

function handleLogout() {
  token = '';
  allStatuses = [];
  filterStatus = null;
  document.getElementById('dashboard-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('token-input').value = '';
  document.getElementById('login-btn').disabled = false;
  document.getElementById('login-btn').textContent = 'Войти';
  document.querySelector('.filter-btn').textContent = 'Фильтр';
}

document.getElementById('token-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleLogin();
});

// инициализация дэшборда

function initDashboard(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'block';

  const av = document.getElementById('nav-avatar');
  if (user.avatar_url) {
    av.innerHTML = `<img src="${user.avatar_url}" alt="${user.login}" />`;
  } else {
    av.textContent = (user.login || 'U').substring(0, 2).toUpperCase();
  }

  loadStatuses();
}

// статусы репозиториев

async function loadStatuses() {
  const list = document.getElementById('repos-list');
  list.innerHTML = `
    <div class="empty-state">
      <div class="icon" style="display:inline-block;animation:spin 1s linear infinite">↻</div>
      <p>Загрузка...</p>
    </div>`;

  try {
    const res = await fetch(`${API}/repos/status`, { headers: { token } });
    if (!res.ok) throw new Error();
    allStatuses = await res.json();
    renderRepos();
  } catch {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠</div>
        <p>Ошибка загрузки статусов</p>
      </div>`;
  }
}

function renderRepos() {
  const list = document.getElementById('repos-list');
  const q    = document.getElementById('search-input').value.toLowerCase();

  let filtered = allStatuses;
  if (q)            filtered = filtered.filter(r => r.repo.toLowerCase().includes(q));
  if (filterStatus) filtered = filtered.filter(r => r.status === filterStatus);

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>Нет репозиториев</p>
        <div class="sub">Добавь через «Управление» или измени фильтр</div>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(r => {
    const name = r.repo.split('/').pop();
    const cls  = r.status === 'stable' ? 'stable'
               : r.status === 'development' ? 'development'
               : 'error';

    return `
      <div class="repo-card ${cls}">
        <div class="repo-card-top">
          <span class="repo-name">${name}</span>
          ${badgeHtml(r.status)}
        </div>
        <div class="repo-full-name">${r.repo}</div>
        <div class="branches">${branchesHtml(r.status)}</div>
        ${r.message ? `<div class="repo-error-msg">${r.message}</div>` : ''}
      </div>`;
  }).join('');
}

function badgeHtml(status) {
  if (status === 'stable')
    return `<span class="status-badge stable"><span class="dot"></span>Stable</span>`;
  return `<span class="status-badge development"><span class="dot"></span>Development</span>`;
}

function branchesHtml(status) {
  if (status === 'stable')
    return `<span class="branch-tag main">⬤ main</span>`;
  if (status === 'development')
    return `<span class="branch-tag main">⬤ main</span><span class="branch-tag develop">⬤ develop</span>`;
  return '';
}



function filterRepos() { renderRepos(); }

function filterByStatus() {
  const opts   = [null, 'stable', 'development'];
  const labels = { null: 'Фильтр', stable: '● Stable', development: '● Development' };
  filterStatus = opts[(opts.indexOf(filterStatus) + 1) % opts.length];
  document.querySelector('.filter-btn').textContent = labels[filterStatus] ?? 'Фильтр';
  renderRepos();
}

// выбор репозиториев для отслеживания

async function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-body').innerHTML = '<div class="modal-loading">Загрузка репозиториев...</div>';
  document.getElementById('modal-search').value = '';

  try {
    const [avRes, trRes] = await Promise.all([
      fetch(`${API}/repos/available`, { headers: { token } }),
      fetch(`${API}/repos/tracked`,   { headers: { token } })
    ]);
    allAvailable = await avRes.json();
    const tracked = await trRes.json();

    repoMeta   = Object.fromEntries(allAvailable.map(r => [r.id, { name: r.name, fullName: r.full_name }]));
    trackedIds = new Set(tracked.map(r => r.repo_id));
    selectedIds = new Set(trackedIds);

    renderModalRepos();
  } catch {
    document.getElementById('modal-body').innerHTML = '<div class="modal-loading">Ошибка загрузки</div>';
  }
}

function renderModalRepos() {
  const q        = document.getElementById('modal-search').value.toLowerCase();
  const filtered = q ? allAvailable.filter(r => r.full_name.toLowerCase().includes(q)) : allAvailable;

  document.getElementById('modal-body').innerHTML = filtered.map(r => `
    <div class="modal-repo-item ${selectedIds.has(r.id) ? 'checked' : ''}"
         onclick="toggleRepo(${r.id})">
      <div class="checkbox">${selectedIds.has(r.id) ? '✓' : ''}</div>
      <div>
        <div class="modal-repo-name">${r.name}</div>
        <div class="modal-repo-full">${r.full_name}</div>
      </div>
    </div>`).join('');

  document.getElementById('selected-count').textContent = `Выбрано: ${selectedIds.size}`;
}

function toggleRepo(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  renderModalRepos();
}

function filterModalRepos() { renderModalRepos(); }

async function saveTracked() {
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Сохранение...';

  try {
    const toAdd    = [...selectedIds].filter(id => !trackedIds.has(id));
    const toRemove = [...trackedIds].filter(id => !selectedIds.has(id));

    await Promise.all([
      ...toRemove.map(id =>
        fetch(`${API}/repos/tracked/${id}`, { method: 'DELETE', headers: { token } })
      ),
      ...toAdd.map(id => {
        const m      = repoMeta[id] || {};
        const params = new URLSearchParams({ repo_name: m.name || '', repo_full_name: m.fullName || '' });
        return fetch(`${API}/repos/tracked/${id}?${params}`, { method: 'PUT', headers: { token } });
      })
    ]);

    closeModal();
    await loadStatuses();
  } catch {
    alert('Ошибка при сохранении');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Сохранить';
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}
