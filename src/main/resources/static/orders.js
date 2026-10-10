/**
 * SHOPY — Orders Controller
 * Fetches real customer orders from /api/orders/user and line items via
 * /api/orders/{id}/items with direct tracking navigation.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!Shopy.requireAuth('/orders.html')) return;

    loadOrders();
  });

  async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    try {
      const res = await Shopy.apiFetch('/orders/user');

      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }

      if (!res.ok) throw new Error('Could not retrieve orders');

      const data = await res.json();
      const orders = Array.isArray(data) ? data : (data.content || data.orders || []);
      renderOrders(orders, container);

    } catch (err) {
      console.error('Orders error:', err);
      container.innerHTML = `
        <div style="text-align: center; padding: 70px 24px; background: white; border: 1px solid var(--line); border-radius: 8px;">
          <p class="eyebrow-label">ERROR</p>
          <h2 style="font-family: var(--serif); font-size: 28px; margin: 8px 0 14px;">Unable to load your orders.</h2>
          <p style="color: var(--muted); margin-bottom: 24px;">Please check your server connection and try again.</p>
          <button class="btn-shopy-primary" onclick="window.location.reload()">RETRY</button>
        </div>
      `;
    }
  }

  function renderOrders(orders, container) {
    if (!orders.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 80px 24px; background: white; border: 1px solid var(--line); border-radius: 8px;">
          <p class="eyebrow-label">PURCHASE HISTORY</p>
          <h2 style="font-family: var(--serif); font-size: 34px; margin: 8px 0 14px;">No orders placed yet.</h2>
          <p style="color: var(--muted); max-width: 380px; margin: 0 auto 28px;">
            You haven't completed any orders yet. Discover timeless silhouettes in our new collection.
          </p>
          <a href="/" class="btn-shopy-primary">EXPLORE NEW ARRIVALS</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => {
      const dateFormatted = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : 'Recent';

      const status = (order.status || 'PLACED').toUpperCase();
      const statusColor = status === 'DELIVERED' ? '#2e7d32' : (status === 'CANCELLED' ? '#c62828' : 'var(--wine)');

      return `
        <article style="
          background: white;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        ">
          <!-- Card Header -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid var(--line);
            padding-bottom: 18px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 12px;
          ">
            <div>
              <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: var(--muted); text-transform: uppercase;">
                ORDER #${order.id} · ${dateFormatted}
              </span>
              <h3 style="font-family: var(--serif); font-size: 22px; font-weight: 500; margin: 4px 0 0;">
                ${Shopy.formatPrice(order.totalAmount)}
              </h3>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1px;
                text-transform: uppercase;
                padding: 6px 14px;
                border-radius: 999px;
                background: var(--paper);
                color: ${statusColor};
                border: 1px solid var(--line);
              ">
                ● ${status}
              </span>
            </div>
          </div>

          <!-- Card Body: Destination & Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px; margin-bottom: 24px;">
            <div>
              <span style="display: block; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: var(--muted); text-transform: uppercase; margin-bottom: 4px;">Destination</span>
              <strong style="display: block; color: var(--ink);">${Shopy.esc(order.fullName || order.username || 'Recipient')}</strong>
              <p style="margin: 0; color: #555; line-height: 1.4;">
                ${Shopy.esc(order.addressLine || '')}, ${Shopy.esc(order.city || '')}, ${Shopy.esc(order.state || '')} – ${Shopy.esc(order.postalCode || '')}
              </p>
            </div>
            <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; gap: 10px;">
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button type="button"
                        class="btn-toggle-items btn-shopy-outline"
                        data-order-id="${order.id}"
                        style="padding: 10px 18px; font-size: 10px;">
                  VIEW PIECES ▼
                </button>
                <a href="/tracking.html?orderId=${order.id}"
                   class="btn-shopy-primary"
                   style="padding: 10px 18px; font-size: 10px;">
                  TRACK SHIPMENT →
                </a>
                ${status === 'PLACED' ? `
                  <a href="/payment.html?orderId=${order.id}"
                     class="btn-shopy-wine"
                     style="padding: 10px 18px; font-size: 10px;">
                    COMPLETE PAYMENT
                  </a>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Expandable Items Drawer -->
          <div id="items-drawer-${order.id}" style="display: none; border-top: 1px dashed var(--line); padding-top: 20px; margin-top: 10px;">
            <p style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; margin: 0 0 12px;">Garments in this order:</p>
            <div id="items-content-${order.id}" style="display: flex; flex-direction: column; gap: 8px;">
              <p style="font-size: 12px; color: var(--muted);">Loading garments...</p>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach Toggle Items handlers
    container.querySelectorAll('.btn-toggle-items').forEach(btn => {
      btn.addEventListener('click', async () => {
        const oId = btn.getAttribute('data-order-id');
        const drawer = document.getElementById(`items-drawer-${oId}`);
        const content = document.getElementById(`items-content-${oId}`);
        if (!drawer) return;

        const isHidden = drawer.style.display === 'none';
        drawer.style.display = isHidden ? 'block' : 'none';
        btn.textContent = isHidden ? 'HIDE PIECES ▲' : 'VIEW PIECES ▼';

        if (isHidden && content) {
          try {
            const res = await Shopy.apiFetch(`/orders/${oId}/items`);
            if (res.ok) {
              const items = await res.json();
              if (Array.isArray(items) && items.length) {
                content.innerHTML = items.map(it => `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--paper); font-size:13px;">
                    <div>
                      <strong>${Shopy.esc(it.productName || 'Garment')}</strong>
                      <span style="color:var(--muted); font-size:12px;"> × ${it.quantity}</span>
                    </div>
                    <strong style="color:var(--ink);">${Shopy.formatPrice(it.price * it.quantity)}</strong>
                  </div>
                `).join('');
              } else {
                content.innerHTML = '<p style="color:var(--muted); font-size:12px;">No line item records.</p>';
              }
            }
          } catch (e) {
            content.innerHTML = '<p style="color:var(--muted); font-size:12px;">Could not load piece details.</p>';
          }
        }
      });
    });
  }

})();