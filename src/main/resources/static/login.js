/**
 * SHOPY — Login Controller
 * Handles authentication via /api/users/login, JWT session persistence,
 * and smart redirection.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
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
          submitBtn.textContent = 'SIGN IN';
        }
      }
    });
  });

})();