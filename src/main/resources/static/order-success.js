/**
 * SHOPY — Order Confirmation Controller
 * Displays verified order details, transaction ID, and provides
 * navigation to tracking and order history.
 */

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || localStorage.getItem('currentOrderId');

  document.addEventListener('DOMContentLoaded', () => {
    if (!Shopy.requireAuth()) return;

    loadConfirmation();
    bindActions();
  });

  function bindActions() {
    const trackBtn = document.getElementById('trackBtn');
    const ordersBtn = document.getElementById('ordersBtn');

    if (trackBtn) {
      trackBtn.addEventListener('click', () => {
        window.location.href = `/tracking.html?orderId=${orderId || ''}`;
      });
    }

    if (ordersBtn) {
      ordersBtn.addEventListener('click', () => {
        window.location.href = '/orders.html';
      });
    }
  }

  async function loadConfirmation() {
    const container = document.getElementById('orderDetails');
    if (!container || !orderId) return;

    let lastPayment = null;
    try {
      lastPayment = JSON.parse(localStorage.getItem('lastPayment') || 'null');
    } catch (e) {}

    try {
      const res = await Shopy.apiFetch('/orders/user');
      if (!res.ok) throw new Error('Could not retrieve order details');

      const data = await res.json();
      const orders = Array.isArray(data) ? data : (data.content || data.orders || []);
      const order = orders.find(o => Number(o.id) === Number(orderId));

      if (order) {
        renderOrderSummary(order, lastPayment, container);
      } else {
        renderFallbackSummary(lastPayment, container);
      }

      // Sync header bag count (should now be 0 as order is placed)
      Shopy.syncHeaderState();

    } catch (err) {
      console.warn('Confirmation fetch error:', err);
      renderFallbackSummary(lastPayment, container);
    }
  }

  function renderOrderSummary(order, payment, container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 12px;">
        <span style="color:var(--muted); font-size:12px; font-weight:700; text-transform:uppercase;">Order Reference</span>
        <strong style="color:var(--ink);">#${order.id}</strong>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 12px;">
        <span style="color:var(--muted); font-size:12px; font-weight:700; text-transform:uppercase;">Recipient</span>
        <strong>${Shopy.esc(order.fullName || order.username || 'Client')}</strong>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 12px;">
        <span style="color:var(--muted); font-size:12px; font-weight:700; text-transform:uppercase;">Delivery Destination</span>
        <span style="text-align:right; max-width:280px; color:#444;">
          ${Shopy.esc(order.addressLine || '')}, ${Shopy.esc(order.city || '')}
        </span>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 12px;">
        <span style="color:var(--muted); font-size:12px; font-weight:700; text-transform:uppercase;">Status</span>
        <strong style="color:var(--wine);">${Shopy.esc(order.status || 'CONFIRMED')}</strong>
      </div>

      ${payment && payment.transactionId ? `
        <div style="display:flex; justify-content:space-between; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 12px;">
          <span style="color:var(--muted); font-size:12px; font-weight:700; text-transform:uppercase;">Transaction ID</span>
          <code style="font-size:12px; background:white; padding:2px 6px; border-radius:3px;">${Shopy.esc(payment.transactionId)}</code>
        </div>
      ` : ''}

      <div style="display:flex; justify-content:space-between; margin-top: 16px; font-size: 16px;">
        <span style="font-weight:800; text-transform:uppercase; letter-spacing:0.8px;">Total Paid</span>
        <strong style="color:var(--ink);">${Shopy.formatPrice(order.totalAmount)}</strong>
      </div>
    `;
  }

  function renderFallbackSummary(payment, container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom: 12px;">
        <span style="color:var(--muted); font-size:12px; font-weight:700; text-transform:uppercase;">Order ID</span>
        <strong>#${orderId || '—'}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom: 12px;">
        <span style="color:var(--muted); font-size:12px; font-weight:700; text-transform:uppercase;">Status</span>
        <strong style="color:var(--wine);">CONFIRMED</strong>
      </div>
      ${payment && payment.amount ? `
        <div style="display:flex; justify-content:space-between; font-size: 16px; margin-top: 14px; border-top: 1px solid var(--line); padding-top: 12px;">
          <span style="font-weight:800; text-transform:uppercase;">Total Amount</span>
          <strong>${Shopy.formatPrice(payment.amount)}</strong>
        </div>
      ` : ''}
    `;
  }

})();