/**
 * SHOPY Core Utility Library (v2.0)
 * Centralizes Authentication, API communication, Cart & Wishlist counters,
 * Toast notifications, and DOM security helpers across all pages.
 */
(function (global) {
  'use strict';

  const API_BASE = '/api';

  // --- Auth Utilities ---
  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  }

  function getUser() {
    try {
      const u = localStorage.getItem('user') || sessionStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  function saveAuth(token, user, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    if (user) storage.setItem('user', JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }

  function isLoggedIn() {
    return Boolean(getToken());
  }

  function requireAuth(redirectUrl) {
    if (!isLoggedIn()) {
      if (redirectUrl) {
        localStorage.setItem('redirectAfterLogin', redirectUrl);
      }
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }

  // --- Secure API Wrapper ---
  async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') || endpoint.startsWith('/api')
      ? endpoint
      : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = Object.assign({}, options.headers || {});
    const token = getToken();

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    options.headers = headers;

    const response = await fetch(url, options);

    if (response.status === 401) {
      // Session expired or invalid
      clearAuth();
      syncHeaderState();
    }

    return response;
  }

  // --- HTML Escaping ---
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Formatting ---
  function formatPrice(amount) {
    const num = Number(amount || 0);
    return '₹' + num.toLocaleString('en-IN');
  }

  // --- Universal Toast System ---
  function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('shopy-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'shopy-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `shopy-toast shopy-toast-${type}`;
    toast.style.cssText = `
      background: #151515;
      color: #ffffff;
      padding: 13px 22px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.2px;
      box-shadow: 0 14px 35px rgba(0,0,0,0.18);
      border: 1px solid rgba(255,255,255,0.12);
      pointer-events: auto;
      opacity: 0;
      transform: translateY(16px);
      transition: all 260ms cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '•';
    toast.innerHTML = `<span style="font-weight:700;color:${type === 'error' ? '#ff6b6b' : '#c5a059'}">${icon}</span><span>${esc(message)}</span>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  // --- Real-Time Header Synchronization ---
  async function syncHeaderState() {
    const token = getToken();
    const user = getUser();

    // 1. Update Account / Login element
    const accountEls = document.querySelectorAll('#account, .account-link, .nav-account');
    accountEls.forEach(el => {
      if (token && user) {
        el.href = user.role === 'ADMIN' ? '/admin.html' : '/profile.html';
        el.textContent = user.name ? user.name.split(' ')[0] : (user.username || 'Account');
        el.title = `Signed in as ${user.username}`;
      } else {
        el.href = '/login.html';
        el.textContent = 'Account';
        el.title = 'Sign In';
      }
    });

    if (!token) {
      updateCounters(0, 0);
      return;
    }

    // 2. Fetch real cart items from /api/cart/items
    try {
      const cartRes = await apiFetch('/cart/items');
      if (cartRes.ok) {
        const items = await cartRes.json();
        const totalQty = Array.isArray(items)
          ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
          : 0;
        updateCartCounter(totalQty);
      } else {
        updateCartCounter(0);
      }
    } catch (e) {
      console.warn('Failed to sync cart count:', e);
    }

    // 3. Fetch real wishlist from /api/wishlist
    try {
      const wishRes = await apiFetch('/wishlist');
      if (wishRes.ok) {
        const wishItems = await wishRes.json();
        const count = Array.isArray(wishItems) ? wishItems.length : 0;
        updateWishlistCounter(count);
      } else {
        updateWishlistCounter(0);
      }
    } catch (e) {
      console.warn('Failed to sync wishlist count:', e);
    }
  }

  function updateCartCounter(count) {
    const els = document.querySelectorAll('#cartCount, .cart-count, [data-cart-count]');
    els.forEach(el => {
      el.textContent = count;
      if (count > 0) {
        el.style.display = 'grid';
      }
    });
  }

  function updateWishlistCounter(count) {
    const els = document.querySelectorAll('#wishCount, .wish-count, [data-wish-count]');
    els.forEach(el => {
      el.textContent = count;
      if (count > 0) {
        el.style.display = 'grid';
      }
    });
  }

  function updateCounters(cartCount, wishCount) {
    updateCartCounter(cartCount);
    updateWishlistCounter(wishCount);
  }

  // --- Global Add to Cart Action ---
  async function addToCart(productId, quantity = 1, variantId = null) {
    if (!requireAuth(window.location.pathname + window.location.search)) {
      return false;
    }

    try {
      const payload = {
        productId: Number(productId),
        quantity: Number(quantity)
      };
      if (variantId) {
        payload.variantId = Number(variantId);
      }

      const res = await apiFetch('/cart/add', {
        method: 'POST',
        body: payload
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || 'Could not add product to cart');
      }

      showToast('Added to your shopping bag.', 'success');
      await syncHeaderState();
      return true;
    } catch (err) {
      console.error('addToCart error:', err);
      showToast(err.message || 'Failed to add item to bag', 'error');
      return false;
    }
  }

  // --- Global Wishlist Action ---
  async function toggleWishlist(productId, btnEl = null) {
    if (!requireAuth(window.location.pathname + window.location.search)) {
      return false;
    }

    try {
      // First check if product is already in wishlist
      const getRes = await apiFetch('/wishlist');
      let isAlreadyWishlisted = false;
      if (getRes.ok) {
        const items = await getRes.json();
        if (Array.isArray(items)) {
          isAlreadyWishlisted = items.some(item => {
            const pId = item.product ? item.product.id : item.productId;
            return Number(pId) === Number(productId);
          });
        }
      }

      if (isAlreadyWishlisted) {
        // Remove from wishlist
        const delRes = await apiFetch(`/wishlist/remove?productId=${productId}`, {
          method: 'DELETE'
        });
        if (!delRes.ok) throw new Error('Could not remove from wishlist');

        if (btnEl) {
          btnEl.classList.remove('active');
          btnEl.innerHTML = '♡';
        }
        showToast('Removed from wishlist.', 'info');
      } else {
        // Add to wishlist
        const addRes = await apiFetch(`/wishlist/add?productId=${productId}`, {
          method: 'POST'
        });
        if (!addRes.ok) throw new Error('Could not add to wishlist');

        if (btnEl) {
          btnEl.classList.add('active');
          btnEl.innerHTML = '♥';
        }
        showToast('Saved to your wishlist.', 'success');
      }

      await syncHeaderState();
      return true;
    } catch (err) {
      console.error('toggleWishlist error:', err);
      showToast('Could not update wishlist', 'error');
      return false;
    }
  }

  // Export to global scope
  global.Shopy = {
    getToken,
    getUser,
    saveAuth,
    clearAuth,
    logout: clearAuth,
    isLoggedIn,
    requireAuth,
    apiFetch,
    esc,
    escapeHtml: esc,
    formatPrice,
    showToast,
    toast: showToast,
    syncHeaderState,
    addToCart,
    toggleWishlist
  };

  // Run on DOM loaded
  document.addEventListener('DOMContentLoaded', () => {
    syncHeaderState();
  });

})(window);
