/**
 * SHOPY — Payment Controller
 * Connects to /api/payments, handles verification of active order amount,
 * and securely confirms transactions with the Spring Boot backend.
 */

(function () {
  'use strict';

  const urlParams = new URLSearchParams(window.location.search);
  let orderId = urlParams.get('orderId') || localStorage.getItem('currentOrderId');

  document.addEventListener('DOMContentLoaded', () => {
    if (!Shopy.requireAuth(`/payment.html?orderId=${orderId || ''}`)) return;

    if (!orderId) {
      Shopy.showToast('No active order selected for payment.', 'error');
      setTimeout(() => { window.location.href = '/orders.html'; }, 800);
      return;
    }

    loadOrderInfo();
    bindPaymentForm();
  });

  async function loadOrderInfo() {
    const orderIdEl = document.getElementById('orderId');
    const amountEl = document.getElementById('paymentAmount');

    try {
      const res = await Shopy.apiFetch('/orders/user');
      if (!res.ok) throw new Error('Could not retrieve order details');

      const data = await res.json();
      const orders = Array.isArray(data) ? data : (data.content || data.orders || []);
      const currentOrder = orders.find(o => Number(o.id) === Number(orderId));

      if (!currentOrder) {
        throw new Error('Order not found in your account.');
      }

      if (orderIdEl) orderIdEl.textContent = `Order #${currentOrder.id}`;
      if (amountEl) amountEl.textContent = Shopy.formatPrice(currentOrder.totalAmount);

    } catch (err) {
      console.error('Payment order fetch error:', err);
      Shopy.showToast(err.message || 'Unable to verify order amount.', 'error');
      if (orderIdEl) orderIdEl.textContent = `Order #${orderId}`;
    }
  }

  function bindPaymentForm() {
    const form = document.getElementById('paymentForm');
    const payBtn = document.getElementById('payButton');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const selectedMethodEl = form.querySelector('input[name="paymentMethod"]:checked');
      const method = selectedMethodEl ? selectedMethodEl.value : 'UPI';

      if (payBtn) {
        payBtn.disabled = true;
        payBtn.textContent = 'AUTHORIZING PAYMENT...';
      }

      try {
        const response = await Shopy.apiFetch('/payments', {
          method: 'POST',
          body: {
            orderId: Number(orderId),
            method: method
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || 'Transaction authorization declined');
        }

        const paymentData = await response.json();
        localStorage.setItem('lastPayment', JSON.stringify(paymentData));
        localStorage.setItem('currentOrderId', String(orderId));

        Shopy.showToast('Payment approved! Confirming order...', 'success');

        setTimeout(() => {
          window.location.href = `/order-success.html?orderId=${orderId}`;
        }, 600);

      } catch (error) {
        console.error('Payment error:', error);
        Shopy.showToast(error.message || 'Payment processing failed. Please try again.', 'error');

        if (payBtn) {
          payBtn.disabled = false;
          payBtn.textContent = 'AUTHORIZE & COMPLETE PAYMENT';
        }
      }
    });
  }

})();