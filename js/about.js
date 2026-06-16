import { getUser, clearUser } from './api.js';

if (!getUser()) window.location.href = 'login.html';

document.getElementById('nav-user').textContent = getUser();

document.getElementById('logout-btn').addEventListener('click', () => {
  clearUser();
  window.location.href = 'login.html';
});
