/**
 * SHOPY — Profile & Address Book Controller
 * Complete integration with /api/users/profile and /api/addresses CRUD.
 */

(function () {
  'use strict';

  let addressListCache = [];

  document.addEventListener('DOMContentLoaded', () => {
    if (!Shopy.requireAuth('/profile.html')) return;

    loadProfile();
    loadAddresses();
    bindEvents();
  });

  function bindEvents() {
    const profileForm = document.getElementById('profileForm');
    const addressForm = document.getElementById('addressForm');
    const addAddressBtn = document.getElementById('addAddressBtn');
    const cancelAddressBtn = document.getElementById('cancelAddressBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileForm) {
      profileForm.addEventListener('submit', updateProfile);
    }

    if (addressForm) {
      addressForm.addEventListener('submit', saveAddress);
    }

    if (addAddressBtn) {
      addAddressBtn.addEventListener('click', () => showAddressForm(null));
    }

    if (cancelAddressBtn) {
      cancelAddressBtn.addEventListener('click', hideAddressForm);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Shopy.clearAuth();
        Shopy.showToast('You have been signed out.', 'info');
        setTimeout(() => { window.location.href = '/'; }, 500);
      });
    }
  }

  /* ==========================================================================
     1. PROFILE DETAILS
     ========================================================================== */
  async function loadProfile() {
    try {
      const res = await Shopy.apiFetch('/users/profile');
      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      if (!res.ok) throw new Error('Could not load profile');

      const user = await res.json();
      document.getElementById('name').value = user.name || '';
      document.getElementById('username').value = user.username || '';
      document.getElementById('email').value = user.email || '';

      // Update cached user in storage
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      console.error('Profile fetch error:', err);
      Shopy.showToast('Unable to load client profile details.', 'error');
    }
  }

  async function updateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !email) {
      Shopy.showToast('Name and email cannot be empty.', 'error');
      return;
    }

    try {
      const res = await Shopy.apiFetch('/users/profile', {
        method: 'PUT',
        body: { name, email }
      });

      if (!res.ok) throw new Error('Could not update profile');

      const updated = await res.json();
      localStorage.setItem('user', JSON.stringify(updated));
      Shopy.showToast('Profile information saved.', 'success');
      Shopy.syncHeaderState();
    } catch (err) {
      console.error('Update profile error:', err);
      Shopy.showToast('Failed to update profile.', 'error');
    }
  }

  /* ==========================================================================
     2. ADDRESS BOOK CRUD
     ========================================================================== */
  async function loadAddresses() {
    const listContainer = document.getElementById('addressList');
    if (!listContainer) return;

    try {
      const res = await Shopy.apiFetch('/addresses');
      if (res.status === 401) return;
      if (!res.ok) throw new Error('Could not load addresses');

      addressListCache = await res.json();
      renderAddressList(Array.isArray(addressListCache) ? addressListCache : [], listContainer);
    } catch (err) {
      console.error('Addresses fetch error:', err);
      listContainer.innerHTML = '<p style="color:var(--muted);font-size:13px;">Unable to load addresses.</p>';
    }
  }

  function renderAddressList(addresses, container) {
    if (!addresses.length) {
      container.innerHTML = `
        <div style="padding: 24px; background: var(--paper); border-radius: 6px; text-align: center;">
          <p style="margin: 0 0 8px; font-weight: 700; font-size: 14px;">No addresses saved yet</p>
          <p style="margin: 0; font-size: 12px; color: var(--muted);">Add a delivery destination for express one-click checkout.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = addresses.map(addr => `
      <div style="border: 1px solid var(--shopy-line); border-radius: 6px; padding: 18px; display: flex; justify-content: space-between; align-items: flex-start; background: var(--paper);">
        <div>
          <strong style="display: block; font-size: 15px; margin-bottom: 4px; color: var(--ink);">
            ${Shopy.esc(addr.fullName)}
          </strong>
          <p style="margin: 0 0 4px; font-size: 13px; color: #555; line-height: 1.4;">
            ${Shopy.esc(addr.addressLine)}, ${Shopy.esc(addr.city)}, ${Shopy.esc(addr.state)} – ${Shopy.esc(addr.postalCode)}
          </p>
          <span style="font-size: 12px; color: var(--muted); font-weight: 600;">
            Phone: ${Shopy.esc(addr.phone)} · ${Shopy.esc(addr.country || 'India')}
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn-edit-addr" data-id="${addr.id}" style="background: none; border: 1px solid var(--line); border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 700;">
            Edit
          </button>
          <button type="button" class="btn-del-addr" data-id="${addr.id}" style="background: none; border: 1px solid var(--wine); color: var(--wine); border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 700;">
            Delete
          </button>
        </div>
      </div>
    `).join('');

    // Attach Edit Handlers
    container.querySelectorAll('.btn-edit-addr').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        const addr = addressListCache.find(a => Number(a.id) === id);
        if (addr) showAddressForm(addr);
      });
    });

    // Attach Delete Handlers
    container.querySelectorAll('.btn-del-addr').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this address?')) {
          await deleteAddress(id);
        }
      });
    });
  }

  function showAddressForm(addr) {
    const box = document.getElementById('addressFormBox');
    const title = document.getElementById('addressFormTitle');
    if (!box) return;

    box.style.display = 'block';

    if (addr) {
      if (title) title.textContent = 'Edit Destination Address';
      document.getElementById('addressId').value = addr.id;
      document.getElementById('addressFullName').value = addr.fullName || '';
      document.getElementById('phone').value = addr.phone || '';
      document.getElementById('addressLine').value = addr.addressLine || '';
      document.getElementById('city').value = addr.city || '';
      document.getElementById('state').value = addr.state || '';
      document.getElementById('postalCode').value = addr.postalCode || '';
      document.getElementById('country').value = addr.country || 'India';
    } else {
      if (title) title.textContent = 'Add New Delivery Address';
      document.getElementById('addressForm').reset();
      document.getElementById('addressId').value = '';
      document.getElementById('country').value = 'India';
    }

    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAddressForm() {
    const box = document.getElementById('addressFormBox');
    if (box) box.style.display = 'none';
  }

  async function saveAddress(e) {
    e.preventDefault();

    const id = document.getElementById('addressId').value;
    const fullName = document.getElementById('addressFullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const addressLine = document.getElementById('addressLine').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const country = document.getElementById('country').value.trim() || 'India';

    if (!fullName || !phone || !addressLine || !city || !state || !postalCode) {
      Shopy.showToast('Please fill all required address fields.', 'error');
      return;
    }

    const payload = { fullName, phone, addressLine, city, state, postalCode, country };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/addresses/${id}` : '/addresses';

    try {
      const res = await Shopy.apiFetch(endpoint, {
        method,
        body: payload
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Could not save address');
      }

      Shopy.showToast(id ? 'Address updated.' : 'New address saved.', 'success');
      hideAddressForm();
      await loadAddresses();
    } catch (err) {
      console.error('Save address error:', err);
      Shopy.showToast('Unable to save address.', 'error');
    }
  }

  async function deleteAddress(id) {
    try {
      const res = await Shopy.apiFetch(`/addresses/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Could not delete address');

      Shopy.showToast('Address removed.', 'info');
      await loadAddresses();
    } catch (err) {
      console.error('Delete address error:', err);
      Shopy.showToast('Failed to delete address.', 'error');
    }
  }

})();