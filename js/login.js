import { getUser, setUser } from './api.js';

// Already logged in → go straight to the app
if (getUser()) window.location.href = 'index.html';

const form      = document.getElementById('login-form');
const nameInput = document.getElementById('name-input');
const errorEl   = document.getElementById('login-error');

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();

  if (name.length < 2) {
    showError('Name must be at least 2 characters.');
    return;
  }

  setUser(name);
  window.location.href = 'index.html';
});

// Clear error as user types
nameInput.addEventListener('input', () => { errorEl.hidden = true; });
