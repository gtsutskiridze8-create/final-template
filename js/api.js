const BASE = 'https://api.tvmaze.com';

// Fetch shows matching the query from TVmaze
export async function searchShows(query) {
  const res = await fetch(`${BASE}/search/shows?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.map(item => item.show); // each result is { score, show } — we only need show
}

// localStorage helpers
export function getSaved() {
  try {
    return JSON.parse(localStorage.getItem('tvscope_saved') ?? '[]');
  } catch {
    return [];
  }
}

export function setSaved(shows) {
  localStorage.setItem('tvscope_saved', JSON.stringify(shows));
}

export function getUser() {
  return localStorage.getItem('tvscope_user');
}

export function setUser(name) {
  localStorage.setItem('tvscope_user', name);
}

export function clearUser() {
  localStorage.removeItem('tvscope_user');
}
