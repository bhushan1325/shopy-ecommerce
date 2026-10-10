/**
 * SHOPY — Product Details Controller
 * Accurate backend integration with /api/products, /api/variants, /api/reviews,
 * size/color variant selection, dynamic pricing, and reliable add-to-bag dispatch.
 */

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  let currentProduct = null;
  let productVariants = [];
  let selectedSizeVariant = null;
  let selectedColor = null;

  const $ = selector => document.querySelector(selector);

  document.addEventListener('DOMContentLoaded', () => {
    initSizeGuideModal();
    initHeaderControls();
    loadProductDetails();
  });

  /* ==========================================================================
     1. HEADER INTERACTIONS
     ========================================================================== */
  function initHeaderControls() {
    const searchBtn = $('#searchBtn');
    const searchBox = $('#searchBox');
    const searchForm = $('#searchForm');
    const searchInput = $('#searchInput');
    const menuBtn = $('#menuBtn');
    const mobileNav = $('#mobileNav');

    if (searchBtn && searchBox) {
      searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = searchBox.classList.toggle('open');
        if (isOpen && searchInput) setTimeout(() => searchInput.focus(), 100);
      });
      document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target) && !searchBtn.contains(e.target)) {
          searchBox.classList.remove('open');
        }
      });
    }

    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = searchInput ? searchInput.value.trim() : '';
        if (q) window.location.href = `/?search=${encodeURIComponent(q)}`;
      });
    }

    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileNav.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!mobileNav.contains(e.target) && !menuBtn.contains(e.target)) {
          mobileNav.classList.remove('open');
        }
      });
    }
  }

  /* ==========================================================================
     2. LOAD PRODUCT FROM BACKEND
     ========================================================================== */
  async function loadProductDetails() {
    const stateEl = $('#productState');
    const viewEl = $('#productView');

    if (!productId) {
      if (stateEl) {
        stateEl.innerHTML = `
          <div style="padding: 60px 0;">
            <p style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:var(--muted);">NOTICE</p>
            <h2 style="font-family:var(--serif);font-size:28px;">No product specified.</h2>
            <a href="/" class="btn-shopy-primary" style="margin-top:20px;">EXPLORE CATALOG</a>
          </div>
        `;
      }
      return;
    }

    try {
      // 1. Fetch Product
      const productRes = await Shopy.apiFetch(`/products/${productId}`);
      if (!productRes.ok) {
        throw new Error('Product not found or unavailable');
      }
      currentProduct = await productRes.json();

      // 2. Fetch Product Variants (correct endpoint: /api/variants/product/{id})
      try {
        const variantRes = await Shopy.apiFetch(`/variants/product/${productId}`);
        if (variantRes.ok) {
          productVariants = await variantRes.json();
        } else {
          productVariants = [];
        }
      } catch (err) {
        console.warn('Variants could not be fetched:', err);
        productVariants = [];
      }

      // 3. Fetch Reviews
      let reviews = [];
      try {
        const revRes = await Shopy.apiFetch(`/reviews/product/${productId}`);
        if (revRes.ok) {
          reviews = await revRes.json();
        }
      } catch (err) {
        reviews = [];
      }

      // 4. Render Details
      renderProduct(currentProduct, productVariants, reviews);

      if (stateEl) stateEl.classList.add('hidden');
      if (viewEl) viewEl.classList.remove('hidden');

    } catch (error) {
      console.error('Failed to load product:', error);
      if (stateEl) {
        stateEl.innerHTML = `
          <div style="padding: 60px 0;">
            <p style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:var(--muted);">UNAVAILABLE</p>
            <h2 style="font-family:var(--serif);font-size:28px;">This piece could not be retrieved.</h2>
            <p style="color:var(--muted);margin-bottom:24px;">It may have been removed or is temporarily out of stock.</p>
            <a href="/" class="btn-shopy-primary">RETURN TO CATALOG</a>
          </div>
        `;
      }
    }
  }

  /* ==========================================================================
     3. RENDER PRODUCT DETAILS & VARIANTS
     ========================================================================== */
  function renderProduct(p, variants, reviews) {
    // Breadcrumbs
    if ($('#crumbName')) $('#crumbName').textContent = p.name;
    if ($('#crumbCategory')) {
      const catName = p.category ? p.category.name : (p.ageGroup || 'Catalog');
      $('#crumbCategory').textContent = catName;
    }

    // Details
    if ($('#brand')) $('#brand').textContent = p.brand || 'SHOPY EDIT';
    if ($('#name')) $('#name').textContent = p.name;
    if ($('#description')) $('#description').textContent = p.description || 'Premium wardrobe essential crafted with exquisite attention to silhouette and durability.';

    // Specifications
    if ($('#material')) $('#material').textContent = p.material || 'Premium Natural Fiber';
    if ($('#fit')) $('#fit').textContent = p.style || 'Regular Contemporary';
    if ($('#style')) $('#style').textContent = p.subcategory || 'Signature';

    const stock = Number(p.stock || 0);
    if ($('#availability')) {
      $('#availability').textContent = stock > 0 ? `In Stock (${stock} units)` : 'Sold Out';
      if (stock <= 0) $('#availability').style.color = 'var(--wine)';
    }

    // Pricing
    updatePriceDisplay(p, null);

    // Rating
    if ($('#rating')) {
      const ratingVal = p.rating || 0;
      $('#rating').textContent = ratingVal > 0 ? `★ ${Number(ratingVal).toFixed(1)}` : '';
    }
    if ($('#reviews')) {
      const reviewCount = Array.isArray(reviews) ? reviews.length : (p.reviewCount || 0);
      $('#reviews').textContent = reviewCount > 0 ? `(${reviewCount} client reviews)` : '';
    }

    // Gallery
    renderGallery(p);

    // Variants (Sizes & Colors)
    renderVariants(variants);

    // Wishlist Button state
    initWishlistButton(p.id);

    // Order Action Buttons
    initActionButtons(p);
  }

  function updatePriceDisplay(product, variant) {
    const isSale = product.salePrice && product.salePrice < product.price;
    const basePrice = isSale ? product.salePrice : product.price;
    const extraPrice = variant && variant.additionalPrice ? Number(variant.additionalPrice) : 0;
    const finalPrice = basePrice + extraPrice;

    if ($('#salePrice')) {
      $('#salePrice').textContent = Shopy.formatPrice(finalPrice);
    }

    if (isSale && $('#price')) {
      $('#price').textContent = Shopy.formatPrice(product.price + extraPrice);
      $('#price').style.display = 'inline';
      if ($('#discount')) {
        const discountPct = Math.round(((product.price - product.salePrice) / product.price) * 100);
        $('#discount').textContent = `${discountPct}% OFF`;
        $('#discount').style.display = 'inline-block';
      }
    } else {
      if ($('#price')) $('#price').style.display = 'none';
      if ($('#discount')) $('#discount').style.display = 'none';
    }
  }

  function renderGallery(p) {
    const mainImg = $('#mainImage');
    const thumbsContainer = $('#thumbs');
    const badgeEl = $('#badge');

    const fallbackImg = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85';
    const primaryImg = p.imageUrl || fallbackImg;

    if (mainImg) {
      mainImg.src = primaryImg;
      mainImg.alt = p.name;
    }

    if (badgeEl) {
      if (p.salePrice && p.salePrice < p.price) {
        badgeEl.textContent = 'Sale';
        badgeEl.className = 'badge card-badge sale';
        badgeEl.classList.remove('hidden');
      } else if (p.badge) {
        badgeEl.textContent = p.badge;
        badgeEl.className = 'badge card-badge';
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }

    if (thumbsContainer) {
      thumbsContainer.innerHTML = '';
      const imageList = [primaryImg];

      // Provide alternate perspective mock images if only one exists
      if (imageList.length === 1) {
        imageList.push(primaryImg);
      }

      imageList.forEach((url, idx) => {
        const thumbBtn = document.createElement('button');
        thumbBtn.type = 'button';
        thumbBtn.className = `thumb-btn ${idx === 0 ? 'active' : ''}`;
        thumbBtn.style.cssText = 'border: 1px solid var(--line); border-radius: 4px; overflow: hidden; width: 64px; height: 80px; padding: 0; cursor: pointer; background: #fff;';
        thumbBtn.innerHTML = `<img src="${Shopy.esc(url)}" alt="" style="width:100%;height:100%;object-fit:cover;"/>`;
        thumbBtn.addEventListener('click', () => {
          if (mainImg) mainImg.src = url;
          thumbsContainer.querySelectorAll('.thumb-btn').forEach(btn => btn.style.borderColor = 'var(--line)');
          thumbBtn.style.borderColor = 'var(--ink)';
        });
        thumbsContainer.appendChild(thumbBtn);
      });
    }
  }

  function renderVariants(variants) {
    const sizeContainer = $('#sizes');
    const colorContainer = $('#colors');

    // 1. Size variants
    const sizeVariants = variants.filter(v => (v.variantName || '').toLowerCase() === 'size');

    if (sizeContainer) {
      sizeContainer.innerHTML = '';

      if (sizeVariants.length > 0) {
        sizeVariants.forEach(variant => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-size';
          btn.textContent = variant.value;
          btn.style.cssText = `
            min-width: 44px;
            height: 44px;
            padding: 0 14px;
            border: 1px solid var(--line);
            border-radius: 4px;
            background: var(--white);
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            transition: all 160ms ease;
          `;

          const stock = Number(variant.stock !== undefined ? variant.stock : 10);
          if (stock <= 0) {
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Size out of stock';
          }

          btn.addEventListener('click', () => {
            selectedSizeVariant = variant;
            sizeContainer.querySelectorAll('.btn-size').forEach(b => {
              b.style.borderColor = 'var(--line)';
              b.style.background = 'var(--white)';
              b.style.color = 'var(--ink)';
            });
            btn.style.borderColor = 'var(--ink)';
            btn.style.background = 'var(--ink)';
            btn.style.color = 'var(--white)';

            // Update price in case variant has additionalPrice
            updatePriceDisplay(currentProduct, variant);
          });

          sizeContainer.appendChild(btn);
        });

        // Auto-select first in-stock variant by default
        const firstAvailable = sizeContainer.querySelector('.btn-size:not([disabled])');
        if (firstAvailable) {
          firstAvailable.click();
        }
      } else {
        sizeContainer.innerHTML = '<span style="font-size:13px;color:var(--muted);padding:8px 0;">Standard Sizing (One Size)</span>';
        selectedSizeVariant = null;
      }
    }

    // 2. Color variants
    const colorVariants = variants.filter(v => (v.variantName || '').toLowerCase() === 'color');

    if (colorContainer) {
      colorContainer.innerHTML = '';

      if (colorVariants.length > 0) {
        colorVariants.forEach(variant => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-color';
          btn.textContent = variant.value;
          btn.style.cssText = `
            padding: 8px 16px;
            border: 1px solid var(--line);
            border-radius: 999px;
            background: var(--white);
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 160ms ease;
          `;

          btn.addEventListener('click', () => {
            selectedColor = variant.value;
            if ($('#selectedColor')) $('#selectedColor').textContent = variant.value;
            colorContainer.querySelectorAll('.btn-color').forEach(b => {
              b.style.borderColor = 'var(--line)';
              b.style.background = 'var(--white)';
              b.style.color = 'var(--ink)';
            });
            btn.style.borderColor = 'var(--ink)';
            btn.style.background = 'var(--ink)';
            btn.style.color = 'var(--white)';
          });

          colorContainer.appendChild(btn);
        });

        // Auto-select first color
        const firstColor = colorContainer.querySelector('.btn-color');
        if (firstColor) firstColor.click();
      } else {
        if ($('#selectedColor')) $('#selectedColor').textContent = 'Original Edit';
      }
    }
  }

  /* ==========================================================================
     4. WISHLIST INTEGRATION
     ========================================================================== */
  async function initWishlistButton(pId) {
    const wishBtn = $('#wish');
    const galleryWishBtn = $('#galleryWish');

    if (Shopy.isLoggedIn()) {
      try {
        const wishRes = await Shopy.apiFetch('/wishlist');
        if (wishRes.ok) {
          const items = await wishRes.json();
          const isWishlisted = Array.isArray(items) && items.some(item => {
            const id = item.product ? item.product.id : item.productId;
            return Number(id) === Number(pId);
          });

          if (isWishlisted) {
            if (wishBtn) { wishBtn.innerHTML = '♥'; wishBtn.style.color = 'var(--wine)'; }
            if (galleryWishBtn) { galleryWishBtn.classList.add('active'); galleryWishBtn.style.color = 'var(--wine)'; }
          }
        }
      } catch (e) {}
    }

    const handleWishClick = async (e) => {
      e.preventDefault();
      const success = await Shopy.toggleWishlist(pId, wishBtn);
      if (success) {
        const active = wishBtn.innerHTML === '♥';
        if (galleryWishBtn) {
          galleryWishBtn.style.color = active ? 'var(--wine)' : '';
        }
      }
    };

    if (wishBtn) wishBtn.addEventListener('click', handleWishClick);
    if (galleryWishBtn) galleryWishBtn.addEventListener('click', handleWishClick);
  }

  /* ==========================================================================
     5. ADD TO BAG & BUY NOW ACTIONS
     ========================================================================== */
  function initActionButtons(product) {
    const addBagBtn = $('#addBag');
    const buyNowBtn = $('#buyNow');

    const handleAddToCart = async (isBuyNow = false) => {
      const variantId = selectedSizeVariant ? selectedSizeVariant.id : null;

      // Disable button during execution
      if (addBagBtn) addBagBtn.disabled = true;
      if (buyNowBtn) buyNowBtn.disabled = true;

      const success = await Shopy.addToCart(product.id, 1, variantId);

      if (addBagBtn) addBagBtn.disabled = false;
      if (buyNowBtn) buyNowBtn.disabled = false;

      if (success && isBuyNow) {
        window.location.href = '/cart.html';
      }
    };

    if (addBagBtn) {
      addBagBtn.addEventListener('click', () => handleAddToCart(false));
    }

    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', () => handleAddToCart(true));
    }
  }

  /* ==========================================================================
     6. SIZE GUIDE MODAL CONTROLS
     ========================================================================== */
  function initSizeGuideModal() {
    const guideBtn = $('#sizeGuide');
    const modal = $('#sizeModal');
    const closeBtn = $('#closeModal');
    const cancelBtn = $('#cancelSizeGuide');

    const openModal = () => {
      if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    };

    const closeModal = () => {
      if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    };

    if (guideBtn) guideBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

})();