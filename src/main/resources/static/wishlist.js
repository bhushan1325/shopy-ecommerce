/**
 * SHOPY — Wishlist Controller
 * Connects directly to /api/wishlist and enables real item removal,
 * moving to cart with /api/cart/add, and synchronized counters.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    loadWishlist();
  });

  async function loadWishlist() {
    const container = document.getElementById('wishlistContainer');
    if (!container) return;

    if (!Shopy.isLoggedIn()) {
      container.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1; text-align: center; padding: 70px 24px;">
          <p class="eyebrow-label">SAVED ITEMS</p>
          <h2 style="font-family: var(--serif); font-size: 32px; margin: 8px 0 14px;">Sign in to view your wishlist.</h2>
          <p style="color: var(--muted); max-width: 380px; margin: 0 auto 28px;">
            Access your curated fashion selections across all devices and add them to your shopping bag.
          </p>
          <a href="/login.html" class="btn-shopy-primary">SIGN IN TO SHOPY</a>
        </div>
      `;
      return;
    }

    try {
      const res = await Shopy.apiFetch('/wishlist');

      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load wishlist');
      }

      const items = await res.json();
      renderWishlist(Array.isArray(items) ? items : [], container);
      Shopy.syncHeaderState();

    } catch (error) {
      console.error('Wishlist error:', error);
      container.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1; text-align: center; padding: 60px 24px;">
          <p class="eyebrow-label">ERROR</p>
          <h3 style="font-family: var(--serif); font-size: 26px; margin: 8px 0 16px;">Unable to load your saved pieces.</h3>
          <p style="color: var(--muted); margin-bottom: 24px;">Please check your connection and try again.</p>
          <button type="button" class="btn-shopy-primary" onclick="loadWishlist()">TRY AGAIN</button>
        </div>
      `;
    }
  }

  function renderWishlist(items, container) {
    if (!items.length) {
      container.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1; text-align: center; padding: 70px 24px;">
          <p class="eyebrow-label">EMPTY CURATION</p>
          <h2 style="font-family: var(--serif); font-size: 32px; margin: 8px 0 14px;">Your wishlist is empty.</h2>
          <p style="color: var(--muted); max-width: 360px; margin: 0 auto 28px;">
            Save pieces you admire while browsing to keep them easily accessible for future purchases.
          </p>
          <a href="/" class="btn-shopy-primary">EXPLORE NEW ARRIVALS</a>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => {
      const p = item.product || {};
      const productId = p.id || item.productId;
      const isSale = p.salePrice && p.salePrice < p.price;
      const currentPrice = isSale ? p.salePrice : p.price;
      const fallbackImage = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80';
      const imageUrl = p.imageUrl || fallbackImage;

      return `
        <article class="product-card-item" data-product-id="${productId}">
          <div class="card-media">
            <a href="/product.html?id=${productId}">
              <img src="${Shopy.esc(imageUrl)}"
                   alt="${Shopy.esc(p.name || 'Product')}"
                   loading="lazy"
                   onerror="this.src='${fallbackImage}'"/>
            </a>

            <button type="button"
                    class="btn-card-wish active"
                    data-remove-id="${productId}"
                    title="Remove from wishlist"
                    style="color: var(--wine);">
              ♥
            </button>
          </div>

          <div class="card-details">
            <span class="card-brand">${Shopy.esc(p.brand || 'SHOPY')}</span>
            <a href="/product.html?id=${productId}" class="card-title">
              ${Shopy.esc(p.name || 'Garment')}
            </a>
            <div class="card-price-row" style="margin-bottom: 14px;">
              <span class="price-current ${isSale ? 'sale' : ''}">
                ${Shopy.formatPrice(currentPrice)}
              </span>
              ${isSale
                ? `<span class="price-original">${Shopy.formatPrice(p.price)}</span>`
                : ''
              }
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="button"
                      class="btn-shopy-primary btn-move-cart"
                      data-product-id="${productId}"
                      style="flex: 1; padding: 9px 14px; font-size: 10px;">
                ADD TO BAG
              </button>
              <button type="button"
                      class="btn-shopy-outline btn-remove-wish"
                      data-remove-id="${productId}"
                      style="padding: 9px 12px; font-size: 10px;"
                      title="Remove">
                ✕
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach remove handlers
    container.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-remove-id');
        await removeWishlistItem(id);
      });
    });

    // Attach Add to Bag handlers
    container.querySelectorAll('.btn-move-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-product-id');
        btn.disabled = true;
        btn.textContent = 'Adding...';
        const success = await Shopy.addToCart(id, 1);
        btn.disabled = false;
        btn.textContent = 'ADD TO BAG';
      });
    });
  }

  async function removeWishlistItem(productId) {
    try {
      const res = await Shopy.apiFetch(`/wishlist/remove?productId=${productId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Could not remove from wishlist');

      Shopy.showToast('Removed from wishlist.', 'info');
      await loadWishlist();
    } catch (err) {
      console.error('Remove wishlist error:', err);
      Shopy.showToast('Could not remove piece', 'error');
    }
  }

  window.loadWishlist = loadWishlist;
})();