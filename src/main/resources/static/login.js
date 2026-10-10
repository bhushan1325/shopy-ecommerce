/**
 * SHOPY — Login Controller
 * Handles authentication via /api/users/login, JWT session persistence,
 * demo credentials quick-fill, password visibility toggle, and smart redirection.
 */

(function () {
  'use strict';

  // Global helper for one-click demo credentials
  window.fillDemoCredentials = function (username, password) {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = username;
    if (passwordInput) passwordInput.value = password;
    Shopy.showToast(`Autofilled ${username} credentials. Click Sign In.`, 'info', 2000);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) return;

    // Password visibility toggle
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.innerHTML = isPassword
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usernameInput = document.getElementById('username');
      const submitBtn = document.getElementById('loginSubmitBtn');

      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!username || !password) {
        Shopy.showToast('Please enter both username and password.', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'AUTHENTICATING...';
      }

      try {
        const response = await Shopy.apiFetch('/users/login', {
          method: 'POST',
          body: { username, password }
        });

        const data = await response.json();

        if (!response.ok || !data.token) {
          throw new Error(data.message || 'Invalid username or password.');
        }

        // Save JWT & User info
        Shopy.saveAuth(data.token, data.user);
        Shopy.showToast(`Welcome back, ${data.user.name || data.user.username}!`, 'success');

        // Check if there was an intended redirect (query param or localStorage)
        const urlParams = new URLSearchParams(window.location.search);
        const queryRedirect = urlParams.get('redirect');
        const storedRedirect = localStorage.getItem('redirectAfterLogin');
        const redirectUrl = queryRedirect || storedRedirect || (data.user?.role === 'ADMIN' ? '/admin.html' : '/');
        localStorage.removeItem('redirectAfterLogin');

        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 600);

      } catch (error) {
        console.error('Login error:', error);
        Shopy.showToast(error.message || 'Unable to sign in. Please verify credentials.', 'error');

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'SIGN IN TO SHOPY →';
        }
      }
    });
  });

})();