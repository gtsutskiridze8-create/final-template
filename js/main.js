import { searchShows, getSaved, setSaved, getUser, clearUser } from './api.js';

// ── Auth ───────────────────────────────────────────
if (!getUser()) window.location.href = 'login.html';

document.getElementById('nav-user').textContent = getUser();
document.getElementById('logout-btn').addEventListener('click', () => {
  clearUser();
  window.location.href = 'login.html';
});

// ── DOM refs ───────────────────────────────────────
const form         = document.getElementById('search-form');
const queryInput   = document.getElementById('query-input');
const statusSelect = document.getElementById('status-select');
const ratedOnly    = document.getElementById('rated-only');
const queryError   = document.getElementById('query-error');
const loadingMsg   = document.getElementById('loading-msg');
const errorMsg     = document.getElementById('error-msg');
const resultsCount = document.getElementById('results-count');
const resultsGrid  = document.getElementById('results-grid');

// App state — holds the last set of search results
let results = [];

// ── Debounce (closure) ─────────────────────────────
// Returns a new function that waits `delay` ms before calling `fn`.
// The `timer` variable lives inside debounce and is remembered by the returned function — that's the closure.
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── UI helpers ─────────────────────────────────────
function showLoading() {
  loadingMsg.hidden = false;
  errorMsg.hidden   = true;
  resultsCount.hidden = true;
  resultsGrid.innerHTML = '';
}

function hideLoading() {
  loadingMsg.hidden = true;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}

// ── Filter results client-side ─────────────────────
function applyFilters(shows) {
  const status = statusSelect.value;
  const rated  = ratedOnly.checked;

  return shows.filter(show => {
    if (status && show.status !== status) return false;
    if (rated && !show.rating?.average) return false;
    return true;
  });
}

// ── Build one card (closure over show) ────────────
// The save/unsave button inside the card closes over `show`,
// so it always knows which show it belongs to — even after the loop ends.
function createCard(show) {
  const saved   = getSaved();
  const isSaved = saved.some(s => s.id === show.id);

  const card = document.createElement('article');
  card.className = 'show-card';

  // Poster image
  const imgWrap = document.createElement('div');
  imgWrap.className = 'show-card__img-wrap';

  if (show.image?.medium) {
    const img = document.createElement('img');
    img.className = 'show-card__img';
    img.src = show.image.medium;
    img.alt = show.name;
    img.loading = 'lazy';
    imgWrap.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'show-card__no-img';
    placeholder.textContent = '📺';
    imgWrap.appendChild(placeholder);
  }

  // Card body
  const body = document.createElement('div');
  body.className = 'show-card__body';

  const status = document.createElement('span');
  status.className = 'show-card__status' + (show.status === 'Ended' ? ' show-card__status--ended' : '');
  status.textContent = show.status ?? 'Unknown';

  const title = document.createElement('h2');
  title.className = 'show-card__title';
  title.textContent = show.name;

  const meta = document.createElement('p');
  meta.className = 'show-card__meta';
  const genres = show.genres?.slice(0, 2).join(', ') || 'No genre';
  const rating = show.rating?.average ? `⭐ ${show.rating.average}` : 'No rating';
  meta.textContent = `${genres} · ${rating}`;

  // Actions row
  const actions = document.createElement('div');
  actions.className = 'show-card__actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = isSaved ? 'btn btn--danger btn--sm' : 'btn btn--primary btn--sm';
  saveBtn.textContent = isSaved ? '✕ Remove' : '+ Watchlist';

  // Closure: this handler closes over `show` — it remembers which show to save/remove
  saveBtn.addEventListener('click', () => toggleSave(show, saveBtn));

  actions.appendChild(saveBtn);
  body.appendChild(status);
  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(actions);
  card.appendChild(imgWrap);
  card.appendChild(body);

  return card;
}

// ── Toggle save/unsave ─────────────────────────────
function toggleSave(show, btn) {
  const saved = getSaved();
  const idx   = saved.findIndex(s => s.id === show.id);

  if (idx === -1) {
    // Not saved — add it (with watched: false for the watchlist page)
    saved.push({ ...show, watched: false });
    btn.className = 'btn btn--danger btn--sm';
    btn.textContent = '✕ Remove';
  } else {
    saved.splice(idx, 1);
    btn.className = 'btn btn--primary btn--sm';
    btn.textContent = '+ Watchlist';
  }

  setSaved(saved);
}

// ── Render all results ─────────────────────────────
function renderResults(shows) {
  resultsGrid.innerHTML = '';
  shows.forEach(show => resultsGrid.appendChild(createCard(show)));
  resultsCount.textContent = `${shows.length} show${shows.length !== 1 ? 's' : ''} found`;
  resultsCount.hidden = false;
}

// ── Search ─────────────────────────────────────────
async function runSearch() {
  const query = queryInput.value.trim();

  if (query.length < 2) {
    queryError.hidden = false;
    queryInput.focus();
    return;
  }
  queryError.hidden = true;
  showLoading();

  try {
    results = await searchShows(query);
    const filtered = applyFilters(results);
    hideLoading();

    if (!filtered.length) {
      showError('No shows found. Try a different name or remove filters.');
      return;
    }

    renderResults(filtered);
  } catch (err) {
    hideLoading();
    showError(`Could not load results: ${err.message}. Check your internet connection.`);
  }
}

// ── Events ─────────────────────────────────────────
form.addEventListener('submit', (e) => {
  e.preventDefault();
  runSearch();
});

// Live search as user types — debounced so it doesn't fire on every keystroke
queryInput.addEventListener('input', debounce(() => {
  queryError.hidden = true;
  if (queryInput.value.trim().length >= 2) runSearch();
}, 500));

// Re-apply filters without a new API call
statusSelect.addEventListener('change', () => {
  if (results.length) renderResults(applyFilters(results));
});

ratedOnly.addEventListener('change', () => {
  if (results.length) renderResults(applyFilters(results));
});

document.getElementById('reset-btn').addEventListener('click', () => {
  results = [];
  resultsGrid.innerHTML = '';
  resultsCount.hidden = true;
  errorMsg.hidden = true;
  queryError.hidden = true;
});
