import { getSaved, setSaved, getUser, clearUser } from './api.js';

// ── Auth ───────────────────────────────────────────
if (!getUser()) window.location.href = 'login.html';

document.getElementById('nav-user').textContent = getUser();
document.getElementById('logout-btn').addEventListener('click', () => {
  clearUser();
  window.location.href = 'login.html';
});

// ── DOM refs ───────────────────────────────────────
const savedGrid = document.getElementById('saved-grid');
const emptyMsg  = document.getElementById('empty-msg');

// ── Render watchlist ───────────────────────────────
function renderWatchlist() {
  const saved = getSaved();
  savedGrid.innerHTML = '';

  if (!saved.length) {
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;

  // forEach closure: each card's buttons close over their own `show` object
  saved.forEach(show => savedGrid.appendChild(createSavedCard(show)));
}

// ── Build saved card ───────────────────────────────
function createSavedCard(show) {
  const card = document.createElement('article');
  card.className = 'show-card';

  // Poster
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

  // Body
  const body = document.createElement('div');
  body.className = 'show-card__body';

  if (show.watched) {
    const badge = document.createElement('span');
    badge.className = 'watched-badge';
    badge.textContent = '✓ Watched';
    body.appendChild(badge);
  }

  const title = document.createElement('h2');
  title.className = 'show-card__title';
  title.textContent = show.name;

  const meta = document.createElement('p');
  meta.className = 'show-card__meta';
  const genres = show.genres?.slice(0, 2).join(', ') || 'No genre';
  const rating = show.rating?.average ? `⭐ ${show.rating.average}` : 'No rating';
  meta.textContent = `${genres} · ${rating}`;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'show-card__actions';

  const watchedBtn = document.createElement('button');
  watchedBtn.type = 'button';
  watchedBtn.className = show.watched ? 'btn btn--sm' : 'btn btn--success btn--sm';
  watchedBtn.textContent = show.watched ? 'Mark unwatched' : '✓ Watched';

  // Closure: closes over `show` — toggles watched flag for THIS show
  watchedBtn.addEventListener('click', () => {
    const saved = getSaved();
    const target = saved.find(s => s.id === show.id);
    if (target) target.watched = !target.watched;
    setSaved(saved);
    renderWatchlist();
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn--danger btn--sm';
  removeBtn.textContent = '✕ Remove';

  // Closure: closes over `show` — removes THIS show from the list
  removeBtn.addEventListener('click', () => {
    const updated = getSaved().filter(s => s.id !== show.id);
    setSaved(updated);
    renderWatchlist();
  });

  actions.appendChild(watchedBtn);
  actions.appendChild(removeBtn);
  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(actions);
  card.appendChild(imgWrap);
  card.appendChild(body);

  return card;
}

// ── Init ───────────────────────────────────────────
renderWatchlist();
