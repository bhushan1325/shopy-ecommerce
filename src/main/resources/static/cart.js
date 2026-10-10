/**
 * SHOPY — Cart / Shopping Bag Controller
 * Directly connects to /api/cart/items, /api/cart/total, and handles line item
 * updates, removals, and checkout transitions.
 */

(function () {
  'use strict';

  let currentCartItems = [];
  let currentTotal = 0;
  const productCache = new Map();

  document.addEventListener('DOMContentLoaded', () => {
    loadCart();
  });

  async function loadCart() {
    const container = document.getElementById('cartContainer');
    if (!container) return;

    if (!Shopy.isLoggedIn()) {
      renderLoginPrompt(container);
      updateSummary(0, 0);
      return;
    }

    container.innerHTML = `
      <div class="loading-card" style="text-align:center;padding:50px 20px;">
        <p style="font-size:12px;font-weight:700;letter-spacing:1px;color:var(--muted);">RETRIEVING SHOPPING BAG</p>
        <p style="font-family:var(--serif);font-size:22px;margin:8px 0;">Loading your selected pieces...</p>
      </div>
    `;

    try {
      // 1. Fetch real cart items from /api/cart/items
      const itemsRes = await Shopy.apiFetch('/cart/items');
      if (itemsRes.status === 401) {
        renderLoginPrompt(container);
        return;
      }
      if (!itemsRes.ok) {
        throw new Error('Unable to retrieve cart items');
      }

      currentCartItems = await itemsRes.json();
      if (!Array.isArray(currentCartItems)) {
        currentCartItems = [];
      }

      // 2. Fetch real cart total from /api/cart/total
      try {
        const totalRes = await Shopy.apiFetch('/cart/total');
        if (totalRes.ok) {
          const totalData = await totalRes.json();
          currentTotal = Number(totalData.total || 0);
        } else {
          currentTotal = currentCartItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
        }
      } catch (err) {
        currentTotal = currentCartItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      }

      // 3. Render items
      renderCart(currentCartItems, container);

      // 4. Update header counter
      Shopy.syncHeaderState();

    } catch (error) {
      console.error('Cart load error:', error);
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;background:var(--paper);border-radius:8px;">
          <p style="font-size:11px;font-weight:800;letter-spacing:1px;color:var(--muted);">SERVICE NOTICE</p>
          <h3 style="font-family:var(--serif);font-size:24px;margin:8px 0 16px;">Unable to load shopping bag</h3>
          <p style="color:var(--muted);margin-bottom:24px;">Please check your server connection and try again.</p>
          <button class="btn-shopy-primary" onclick="window.location.reload()">TRY AGAIN</button>
        </div>
      `;
    }
  }

  function renderLoginPrompt(container) {
    container.innerHTML = `
      <div style="text-align:center;padding:70px 24px;background:var(--paper);border-radius:12px;">
        <p style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:var(--muted);">AUTHENTICATION REQUIRED</p>
        <h2 style="font-family:var(--serif);font-size:32px;margin:8px 0 14px;">Sign in to view your bag.</h2>
        <p style="color:var(--muted);max-width:380px;margin:0 auto 28px;font-size:14px;">
          Sign in to access your saved garments, sync across devices, and proceed to checkout.
        </p>
        <button class="btn-shopy-primary" onclick="window.location.href='/login.html'">SIGN IN TO SHOPY</button>
      </div>
    `;
  }

  function renderCart(items, container) {
    if (!items.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:70px 24px;background:var(--paper);border-radius:12px;">
          <p style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:var(--muted);">YOUR BAG IS EMPTY</p>
          <h2 style="font-family:var(--serif);font-size:32px;margin:8px 0 14px;">Style awaits.</h2>
          <p style="color:var(--muted);max-width:360px;margin:0 auto 28px;font-size:14px;">
            You have no pieces in your shopping bag. Explore our latest arrivals across all generations.
          </p>
          <a href="/" class="btn-shopy-primary">EXPLORE COLLECTIONS</a>
        </div>
      `;
      updateSummary(0, 0);
      return;
    }

    const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    updateSummary(totalQty, currentTotal);

    container.innerHTML = `
      <div class="cart-items-list" style="display:flex;flex-direction:column;gap:18px;">
        ${items.map(item => `
          <div class="cart-item-card" data-item-id="${item.id}" style="
            display: grid;
            grid-template-columns: 100px 1fr auto;
            gap: 20px;
            padding: 20px;
            border: 1px solid var(--shopy-line);
            border-radius: 8px;
            background: #fff;
            align-items: center;
          ">
            <!-- Thumbnail Image -->
            <div style="aspect-ratio:3/4;background:var(--paper);border-radius:4px;overflow:hidden;">
              <img id="cart-item-img-${item.id}"
                   src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=75"
                   alt="${Shopy.esc(item.productName)}"
                   style="width:100%;height:100%;object-fit:cover;"/>
            </div>

            <!-- Details -->
            <div>
              <p style="font-size:10px;font-weight:800;letter-spacing:1.5px;color:var(--muted);margin:0 0 4px;">SHOPY PIECE</p>
              <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;">
                <a href="/product.html?id=${item.productId}" style="color:var(--ink);">
                  ${Shopy.esc(item.productName)}
                </a>
              </h3>
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:var(--ink);">
                ${Shopy.formatPrice(item.price)}
                <span style="font-size:12px;font-weight:400;color:var(--muted);"> each</span>
              </p>

              <!-- Quantity Controls -->
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="display:inline-flex;align-items:center;border:1px solid var(--shopy-line);border-radius:4px;">
                  <button type="button"
                          class="btn-qty-minus"
                          data-item-id="${item.id}"
                          data-qty="${item.quantity}"
                          style="width:32px;height:32px;background:none;border:none;cursor:pointer;font-weight:700;font-size:14px;">
                    –
                  </button>
                  <span style="min-width:32px;text-align:center;font-size:13px;font-weight:700;">
                    ${item.quantity}
                  </span>
                  <button type="button"
                          class="btn-qty-plus"
                          data-item-id="${item.id}"
                          data-qty="${item.quantity}"
                          style="width:32px;height:32px;background:none;border:none;cursor:pointer;font-weight:700;font-size:14px;">
                    +
                  </button>
                </div>

                <button type="button"
                        class="btn-remove-item"
                        data-item-id="${item.id}"
                        style="background:none;border:none;color:var(--muted);font-size:12px;text-decoration:underline;cursor:pointer;padding:4px 8px;">
                  Remove
                </button>
              </div>
            </div>

            <!-- Line Total -->
            <div style="text-align:right;">
              <span style="font-size:11px;color:var(--muted);display:block;">SUBTOTAL</span>
              <strong style="font-size:16px;color:var(--ink);">
                ${Shopy.formatPrice(Number(item.price) * Number(item.quantity))}
              </strong>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Attach quantity minus
    container.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = btn.getAttribute('data-item-id');
        const currentQty = Number(btn.getAttribute('data-qty'));
        if (currentQty <= 1) {
          await removeItem(itemId);
        } else {
          await updateQuantity(itemId, currentQty - 1);
        }
      });
    });

    // Attach quantity plus
    container.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = btn.getAttribute('data-item-id');
        const currentQty = Number(btn.getAttribute('data-qty'));
        await updateQuantity(itemId, currentQty + 1);
      });
    });

    // Attach remove
    container.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = btn.getAttribute('data-item-id');
        await removeItem(itemId);
      });
    });

    // Asynchronously enrich product images
    items.forEach(async item => {
      try {
        let img = productCache.get(item.productId);
        if (!img) {
          const pRes = await Shopy.apiFetch(`/products/${item.productId}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            img = pData.imageUrl;
            if (img) productCache.set(item.productId, img);
          }
        }
        if (img) {
          const imgEl = document.getElementById(`cart-item-img-${item.id}`);
          if (imgEl) imgEl.src = img;
        }
      } catch (e) {}
    });
  }

  async function updateQuantity(itemId, newQty) {
    try {
      const res = await Shopy.apiFetch(`/cart/items/${itemId}`, {
        method: 'PUT',
        body: { quantity: Number(newQty) }
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to update quantity');
      }
      Shopy.showToast('Bag updated.', 'info', 1800);
      await loadCart();
    } catch (err) {
      console.error('Update quantity error:', err);
      Shopy.showToast(err.message || 'Could not update quantity', 'error');
    }
  }

  async function removeItem(itemId) {
    try {
      const res = await Shopy.apiFetch(`/cart/items/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Could not remove item');
      }
      Shopy.showToast('Item removed from bag.', 'info', 1800);
      await loadCart();
    } catch (err) {
      console.error('Remove item error:', err);
      Shopy.showToast('Could not remove item from bag', 'error');
    }
  }

  function updateSummary(itemCount, total) {
    const summaryItems = document.getElementById('summaryItems');
    const cartItemCount = document.getElementById('cartItemCount');
    const cartTotalEl = document.getElementById('cartTotal');

    if (summaryItems) summaryItems.textContent = `${itemCount} piece${itemCount === 1 ? '' : 's'}`;
    if (cartItemCount) cartItemCount.textContent = `Items: ${itemCount}`;
    if (cartTotalEl) cartTotalEl.textContent = Shopy.formatPrice(total);
  }

  window.goToCheckout = function () {
    if (!Shopy.isLoggedIn()) {
      window.location.href = '/login.html';
      return;
    }
    if (!currentCartItems.length) {
      Shopy.showToast('Your shopping bag is empty.', 'error');
      return;
    }
    window.location.href = '/checkout.html';
  };

  window.handleCartSearch = function (e) {
    if (e.key === 'Enter') goToSearch();
  };

  window.goToSearch = function () {
    const val = document.getElementById('cartSearchInput')?.value.trim();
    if (val) window.location.href = `/?search=${encodeURIComponent(val)}`;
  };

})();