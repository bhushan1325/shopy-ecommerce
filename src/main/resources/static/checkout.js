/**
 * SHOPY — Checkout Controller
 * Verifies cart, offers saved address selection or new address capture,
 * creates the real order via /api/orders/create, and proceeds to payment.
 */

(function () {
  'use strict';

  let checkoutItems = [];
  let checkoutTotalAmount = 0;
  let savedAddresses = [];
  let selectedAddressId = null;

  document.addEventListener('DOMContentLoaded', () => {
    if (!Shopy.requireAuth('/checkout.html')) return;

    loadCheckoutData();
    bindEvents();
  });

  function bindEvents() {
    const placeOrderBtn = document.getElementById('placeOrderButton');
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', handleContinueToPayment);
    }
  }

  async function loadCheckoutData() {
    // 1. Fetch Cart Items
    try {
      const itemsRes = await Shopy.apiFetch('/cart/items');
      if (itemsRes.status === 401) return;
      if (!itemsRes.ok) throw new Error('Could not retrieve bag items');

      checkoutItems = await itemsRes.json();
      if (!Array.isArray(checkoutItems) || !checkoutItems.length) {
        Shopy.showToast('Your shopping bag is empty. Please add items first.', 'error');
        setTimeout(() => { window.location.href = '/cart.html'; }, 800);
        return;
      }

      // 2. Fetch Cart Total
      try {
        const totalRes = await Shopy.apiFetch('/cart/total');
        if (totalRes.ok) {
          const tData = await totalRes.json();
          checkoutTotalAmount = Number(tData.total || 0);
        } else {
          checkoutTotalAmount = checkoutItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
        }
      } catch (e) {
        checkoutTotalAmount = checkoutItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      }

      const totalQty = checkoutItems.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
      const countEl = document.getElementById('checkoutItemCount');
      const totalEl = document.getElementById('checkoutTotal');

      if (countEl) countEl.textContent = `${totalQty} piece${totalQty === 1 ? '' : 's'}`;
      if (totalEl) totalEl.textContent = Shopy.formatPrice(checkoutTotalAmount);

      // 3. Load Saved Addresses
      loadSavedAddresses();

    } catch (err) {
      console.error('Checkout initialization error:', err);
      Shopy.showToast('Unable to prepare checkout session.', 'error');
    }
  }

  async function loadSavedAddresses() {
    try {
      const res = await Shopy.apiFetch('/addresses');
      if (!res.ok) return;

      savedAddresses = await res.json();
      if (Array.isArray(savedAddresses) && savedAddresses.length > 0) {
        renderSavedAddresses(savedAddresses);
      }
    } catch (err) {
      console.warn('Could not load saved addresses:', err);
    }
  }

  function renderSavedAddresses(addresses) {
    const section = document.getElementById('savedAddressesSection');
    const container = document.getElementById('savedAddressesContainer');
    if (!section || !container) return;

    section.style.display = 'block';

    container.innerHTML = addresses.map((addr, idx) => `
      <label style="
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 6px;
        cursor: pointer;
        background: ${idx === 0 ? 'var(--paper)' : 'white'};
      ">
        <input type="radio" name="savedAddressRadio" value="${addr.id}" ${idx === 0 ? 'checked' : ''} style="margin-top: 3px;"/>
        <div>
          <strong style="font-size: 14px; display: block; margin-bottom: 2px;">${Shopy.esc(addr.fullName)}</strong>
          <p style="margin: 0; font-size: 12px; color: #555; line-height: 1.4;">
            ${Shopy.esc(addr.addressLine)}, ${Shopy.esc(addr.city)}, ${Shopy.esc(addr.state)} – ${Shopy.esc(addr.postalCode)}
          </p>
          <span style="font-size: 11px; color: var(--muted);">Ph: ${Shopy.esc(addr.phone)}</span>
        </div>
      </label>
    `).join('') + `
      <label style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border: 1px dashed var(--line); border-radius: 6px; cursor: pointer;">
        <input type="radio" name="savedAddressRadio" value="new" style="margin: 0;"/>
        <span style="font-size: 13px; font-weight: 700;">+ Enter a different address below</span>
      </label>
    `;

    selectedAddressId = addresses[0].id;

    // Listen for radio change
    container.querySelectorAll('input[name="savedAddressRadio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'new') {
          selectedAddressId = null;
        } else {
          selectedAddressId = Number(radio.value);
        }
      });
    });
  }

  async function handleContinueToPayment() {
    const btn = document.getElementById('placeOrderButton');
    if (!checkoutItems.length) {
      Shopy.showToast('Your shopping bag is empty.', 'error');
      return;
    }

    let finalAddressId = selectedAddressId;

    // If no existing address selected, validate and save new address
    if (!finalAddressId) {
      const fullName = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const addressLine = document.getElementById('addressLine').value.trim();
      const city = document.getElementById('city').value.trim();
      const state = document.getElementById('state').value.trim();
      const postalCode = document.getElementById('postalCode').value.trim();
      const country = document.getElementById('country').value.trim() || 'India';

      if (!fullName) { Shopy.showToast('Please enter recipient full name.', 'error'); return; }
      if (!/^[0-9]{10}$/.test(phone)) { Shopy.showToast('Please enter a valid 10-digit mobile number.', 'error'); return; }
      if (!addressLine) { Shopy.showToast('Please enter your street address.', 'error'); return; }
      if (!city) { Shopy.showToast('Please enter your city.', 'error'); return; }
      if (!state) { Shopy.showToast('Please enter your state.', 'error'); return; }
      if (!/^[0-9]{6}$/.test(postalCode)) { Shopy.showToast('Please enter a valid 6-digit PIN code.', 'error'); return; }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'SAVING ADDRESS...';
      }

      try {
        const addrRes = await Shopy.apiFetch('/addresses', {
          method: 'POST',
          body: { fullName, phone, addressLine, city, state, postalCode, country }
        });

        if (!addrRes.ok) {
          const errText = await addrRes.text();
          throw new Error(errText || 'Failed to register delivery address');
        }

        const savedAddr = await addrRes.json();
        finalAddressId = savedAddr.id;
      } catch (err) {
        console.error('Save address error:', err);
        Shopy.showToast(err.message || 'Unable to save delivery address.', 'error');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'CONTINUE TO PAYMENT →';
        }
        return;
      }
    }

    // Now create real order via POST /api/orders/create?addressId={id}
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'RESERVING ORDER...';
    }

    try {
      const orderRes = await Shopy.apiFetch(`/orders/create?addressId=${finalAddressId}`, {
        method: 'POST'
      });

      if (!orderRes.ok) {
        const orderErr = await orderRes.text();
        throw new Error(orderErr || 'Could not create order reservation');
      }

      const orderData = await orderRes.json();
      const orderId = orderData.id || orderData.orderId;

      if (!orderId) {
        throw new Error('Server confirmed order but omitted order reference ID');
      }

      // Store current order ID
      localStorage.setItem('currentOrderId', String(orderId));
      Shopy.showToast('Order reserved. Directing to payment...', 'success');

      setTimeout(() => {
        window.location.href = `/payment.html?orderId=${orderId}`;
      }, 500);

    } catch (orderErr) {
      console.error('Order creation error:', orderErr);
      Shopy.showToast(orderErr.message || 'Unable to create order.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'CONTINUE TO PAYMENT →';
      }
    }
  }

})();