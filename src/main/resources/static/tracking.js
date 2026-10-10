/**
 * SHOPY — Order Tracking Controller
 * Connects directly to /api/orders/{id}/tracking and displays a visual delivery
 * progress timeline.
 */

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || localStorage.getItem('currentOrderId');

  document.addEventListener('DOMContentLoaded', () => {
    if (!Shopy.requireAuth(`/tracking.html?orderId=${orderId || ''}`)) return;

    if (!orderId) {
      const container = document.getElementById('trackingContainer');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px 20px;">
            <p class="eyebrow-label">NO ORDER SELECTED</p>
            <h2 style="font-family: var(--serif); font-size: 26px; margin: 8px 0 16px;">Please choose an order to track.</h2>
            <a href="/orders.html" class="btn-shopy-primary">GO TO MY ORDERS</a>
          </div>
        `;
      }
      return;
    }

    loadTracking();
  });

  async function loadTracking() {
    const container = document.getElementById('trackingContainer');
    if (!container) return;

    try {
      const res = await Shopy.apiFetch(`/orders/${orderId}/tracking`);

      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }

      if (res.status === 404) {
        throw new Error('Order tracking information not found or unauthorized.');
      }

      if (!res.ok) {
        throw new Error('Could not retrieve tracking status.');
      }

      const tracking = await res.json();
      renderTracking(tracking, container);

    } catch (err) {
      console.error('Tracking fetch error:', err);
      container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px;">
          <p class="eyebrow-label">TRACKING STATUS</p>
          <h2 style="font-family: var(--serif); font-size: 26px; margin: 8px 0 14px;">Order #${Shopy.esc(orderId)}</h2>
          <p style="color: var(--muted); margin-bottom: 24px;">${Shopy.esc(err.message)}</p>
          <a href="/orders.html" class="btn-shopy-primary">RETURN TO MY ORDERS</a>
        </div>
      `;
    }
  }

  function renderTracking(tracking, container) {
    const status = (tracking.status || 'PLACED').toUpperCase();
    const message = tracking.message || 'Your order is currently being processed by our dispatch team.';

    const steps = [
      { key: 'PLACED', label: 'Order Placed', desc: 'Order received & logged' },
      { key: 'CONFIRMED', label: 'Payment Confirmed', desc: 'Garments verified & reserved' },
      { key: 'SHIPPED', label: 'Dispatched', desc: 'Handed over to express courier' },
      { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Courier out on local route' },
      { key: 'DELIVERED', label: 'Delivered', desc: 'Package received by client' }
    ];

    const isCancelled = status === 'CANCELLED';
    const statusIdx = steps.findIndex(s => s.key === status);
    const activeStepIdx = statusIdx !== -1 ? statusIdx : 0;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 20px; margin-bottom: 28px; flex-wrap: wrap; gap: 12px;">
        <div>
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: var(--muted); text-transform: uppercase;">SHIPMENT REFERENCE</span>
          <h2 style="font-family: var(--serif); font-size: 28px; font-weight: 500; margin: 4px 0 0;">Order #${tracking.orderId}</h2>
        </div>
        <span style="
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 8px 16px;
          border-radius: 999px;
          background: var(--paper);
          color: ${isCancelled ? '#c62828' : 'var(--wine)'};
          border: 1px solid var(--line);
        ">
          ● ${status}
        </span>
      </div>

      <!-- Current Status Alert -->
      <div style="
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 20px;
        margin-bottom: 36px;
        display: flex;
        gap: 16px;
        align-items: center;
      ">
        <span style="font-size: 24px;">📦</span>
        <div>
          <strong style="font-size: 14px; display: block; color: var(--ink); margin-bottom: 2px;">
            ${isCancelled ? 'Order Cancelled' : 'Current Status Message'}
          </strong>
          <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.4;">${Shopy.esc(message)}</p>
        </div>
      </div>

      <!-- Stepper Timeline -->
      ${!isCancelled ? `
        <div style="display: flex; flex-direction: column; gap: 24px; position: relative; padding-left: 12px;">
          ${steps.map((step, idx) => {
            const isCompleted = idx <= activeStepIdx;
            const isCurrent = idx === activeStepIdx;

            return `
              <div style="display: flex; gap: 20px; align-items: flex-start; position: relative;">
                <div style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${isCompleted ? 'var(--ink)' : 'white'};
                  color: ${isCompleted ? 'white' : 'var(--muted)'};
                  border: 2px solid ${isCompleted ? 'var(--ink)' : 'var(--line)'};
                  display: grid;
                  place-items: center;
                  font-size: 12px;
                  font-weight: 700;
                  z-index: 2;
                ">
                  ${isCompleted ? '✓' : idx + 1}
                </div>

                <div style="padding-top: 4px;">
                  <strong style="display: block; font-size: 14px; color: ${isCompleted ? 'var(--ink)' : 'var(--muted)'}; ${isCurrent ? 'color: var(--wine);' : ''}">
                    ${step.label} ${isCurrent ? '— Current Stage' : ''}
                  </strong>
                  <span style="font-size: 12px; color: var(--muted);">${step.desc}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <p style="color: #c62828; font-size: 14px; text-align: center;">This order has been cancelled and will not proceed with shipping.</p>
      `}

      <div style="display: flex; justify-content: center; gap: 14px; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--line);">
        <a href="/orders.html" class="btn-shopy-outline">BACK TO MY ORDERS</a>
        <a href="/" class="btn-shopy-primary">CONTINUE SHOPPING</a>
      </div>
    `;
  }

})();