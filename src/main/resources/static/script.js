/**
 * SHOPY — Homepage & Catalog Controller
 * Real backend integration, responsive header interactions, and robust state management.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderInteractions();
  initSearch();
  initNewsletter();
  loadCatalogProducts();
});

/* ==========================================================================
   1. HEADER & NAVIGATION INTERACTIONS
   ========================================================================== */
function initHeaderInteractions() {
  const header = document.getElementById('siteHeader');
  const menuBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');

  // Sticky header scroll shadow
  const handleScroll = () => {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 12);
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile drawer toggle
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      drawer.setAttribute('aria-hidden', String(!isOpen));
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!drawer.contains(e.target) && !menuBtn.contains(e.target)) {
        drawer.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Active category navigation indicator
  const params = new URLSearchParams(window.location.search);
  const activeCat = params.get('category');
  const isSale = params.get('sale') === 'true';

  document.querySelectorAll('.main-nav .nav-link').forEach(link => {
    const cat = link.getAttribute('data-cat');
    if (isSale && cat === 'Sale') {
      link.classList.add('active');
    } else if (!isSale && activeCat && cat && cat.toLowerCase() === activeCat.toLowerCase()) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ==========================================================================
   2. SEARCH INTERACTION
   ========================================================================== */
function initSearch() {
  const searchBtn = document.getElementById('searchToggleBtn');
  const dropdown = document.getElementById('searchDropdown');
  const form = document.getElementById('globalSearchForm');
  const input = document.getElementById('globalSearchInput');

  if (searchBtn && dropdown) {
    searchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      searchBtn.setAttribute('aria-expanded', String(isOpen));
      dropdown.setAttribute('aria-hidden', String(!isOpen));
      if (isOpen && input) {
        setTimeout(() => input.focus(), 100);
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !searchBtn.contains(e.target)) {
        dropdown.classList.remove('open');
        searchBtn.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Search submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input ? input.value.trim() : '';
      if (query) {
        window.location.href = `/?search=${encodeURIComponent(query)}`;
      }
    });
  }

  // Suggestion pills
  document.querySelectorAll('.suggestion-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      if (q) {
        window.location.href = `/?search=${encodeURIComponent(q)}`;
      }
    });
  });
}

/* ==========================================================================
   3. NEWSLETTER SUBSCRIPTION
   ========================================================================== */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      Shopy.showToast("You've been added to the private SHOPY list.", 'success');
      form.reset();
    });
  }
}

/* ==========================================================================
   4. REAL CATALOG PRODUCTS LOADING
   ========================================================================== */
async function loadCatalogProducts() {
  const container = document.getElementById('productsGrid');
  const sectionHeading = document.getElementById('arrivalsHeading');
  const subHeading = document.getElementById('arrivalsSubheading');

  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const searchKeyword = (params.get('search') || '').trim();
  const categoryParam = (params.get('category') || '').trim();
  const isSaleOnly = params.get('sale') === 'true';

  // Customize headings based on filter
  if (searchKeyword) {
    if (subHeading) subHeading.textContent = 'SEARCH RESULTS';
    if (sectionHeading) sectionHeading.textContent = `“${searchKeyword}”`;
  } else if (categoryParam && categoryParam.toLowerCase() !== 'all') {
    if (subHeading) subHeading.textContent = 'COLLECTION';
    if (sectionHeading) sectionHeading.textContent = `${categoryParam}’s Edit`;
  } else if (isSaleOnly) {
    if (subHeading) subHeading.textContent = 'SEASONAL SALE';
    if (sectionHeading) sectionHeading.textContent = 'Curated Reductions.';
  }

  try {
    // 1. Fetch active products from backend
    const response = await Shopy.apiFetch('/products/active?page=0&size=30');

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    let productList = Array.isArray(data) ? data : (data.content || []);

    // 2. Fetch user's wishlist if logged in to show active heart states
    let wishlistProductIds = new Set();
    if (Shopy.isLoggedIn()) {
      try {
        const wishRes = await Shopy.apiFetch('/wishlist');
        if (wishRes.ok) {
          const wishItems = await wishRes.json();
          if (Array.isArray(wishItems)) {
            wishItems.forEach(item => {
              const pid = item.product ? item.product.id : item.productId;
              if (pid) wishlistProductIds.add(Number(pid));
            });
          }
        }
      } catch (err) {
        console.warn('Could not load user wishlist state:', err);
      }
    }

    // 3. Filter by search keyword
    if (searchKeyword) {
      const q = searchKeyword.toLowerCase();
      productList = productList.filter(item => {
        const searchFields = [
          item.name,
          item.brand,
          item.description,
          item.subcategory,
          item.style,
          item.ageGroup,
          item.category ? item.category.name : ''
        ];
        return searchFields.some(field => String(field || '').toLowerCase().includes(q));
      });
    }

    // 4. Filter by Category / Age Group
    if (categoryParam && categoryParam.toLowerCase() !== 'all') {
      const target = categoryParam.toLowerCase();
      productList = productList.filter(item => {
        const catName = item.category ? item.category.name.toLowerCase() : '';
        const ageGroup = (item.ageGroup || '').toLowerCase();
        return catName === target || ageGroup === target;
      });
    }

    // 5. Filter by Sale
    if (isSaleOnly) {
      productList = productList.filter(item => item.salePrice && item.salePrice < item.price);
    }

    // 6. Render results
    renderProducts(productList, wishlistProductIds, container);

  } catch (error) {
    console.error('Failed to load products from backend:', error);
    renderErrorState(container);
  }
}

/* ==========================================================================
   5. RENDER PRODUCT CARDS
   ========================================================================== */
function renderProducts(products, wishlistProductIds, container) {
  if (!products.length) {
    container.innerHTML = `
      <div class="state-box">
        <p class="eyebrow-label">NO PIECES FOUND</p>
        <h3>No matching garments currently available.</h3>
        <p style="color:var(--muted);margin-bottom:24px;">Try refining your search terms or explore our complete seasonal collections.</p>
        <a href="/" class="btn-shopy-primary">EXPLORE ALL COLLECTIONS</a>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => {
    const isSale = product.salePrice && product.salePrice < product.price;
    const currentPrice = isSale ? product.salePrice : product.price;
    const isWishlisted = wishlistProductIds.has(Number(product.id));

    // Curated high quality fashion fallback images per category
    const fallbackImage = getEditorialFallback(product);
    const imageUrl = product.imageUrl || fallbackImage;

    return `
      <article class="product-card-item" data-product-id="${product.id}">
        <div class="card-media">
          <a href="/product.html?id=${product.id}" aria-label="View ${Shopy.esc(product.name)}">
            <img src="${Shopy.esc(imageUrl)}"
                 alt="${Shopy.esc(product.name)}"
                 loading="lazy"
                 onerror="this.src='${fallbackImage}'"/>
          </a>

          ${isSale
            ? `<span class="card-badge sale">Sale</span>`
            : product.badge
              ? `<span class="card-badge">${Shopy.esc(product.badge)}</span>`
              : `<span class="card-badge">New</span>`
          }

          <button type="button"
                  class="btn-card-wish ${isWishlisted ? 'active' : ''}"
                  data-wish-id="${product.id}"
                  aria-label="${isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}">
            ${isWishlisted ? '♥' : '♡'}
          </button>

          <button type="button"
                  class="quick-add-btn"
                  data-add-id="${product.id}"
                  aria-label="Add ${Shopy.esc(product.name)} to shopping bag">
            + Quick Add
          </button>
        </div>

        <div class="card-details">
          <span class="card-brand">${Shopy.esc(product.brand || 'SHOPY')}</span>
          <a href="/product.html?id=${product.id}" class="card-title">
            ${Shopy.esc(product.name)}
          </a>
          <div class="card-price-row">
            <span class="price-current ${isSale ? 'sale' : ''}">
              ${Shopy.formatPrice(currentPrice)}
            </span>
            ${isSale
              ? `<span class="price-original">${Shopy.formatPrice(product.price)}</span>`
              : ''
            }
          </div>
          ${product.rating && product.rating > 0
            ? `<div class="card-rating">★ ${Number(product.rating).toFixed(1)} ${product.reviewCount ? `(${product.reviewCount})` : ''}</div>`
            : ''
          }
        </div>
      </article>
    `;
  }).join('');

  // Attach Wishlist event listeners
  container.querySelectorAll('.btn-card-wish').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-wish-id');
      await Shopy.toggleWishlist(id, btn);
    });
  });

  // Attach Quick Add event listeners
  container.querySelectorAll('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-add-id');
      btn.disabled = true;
      btn.textContent = 'Adding...';
      await Shopy.addToCart(id, 1);
      btn.disabled = false;
      btn.textContent = '+ Quick Add';
    });
  });
}

function renderErrorState(container) {
  container.innerHTML = `
    <div class="state-box">
      <p class="eyebrow-label">CONNECTION NOTICE</p>
      <h3>Unable to load catalog from store server.</h3>
      <p style="color:var(--muted);margin-bottom:24px;">Please check your server connection and try again.</p>
      <button type="button" class="btn-shopy-primary" onclick="loadCatalogProducts()">
        RETRY LOADING
      </button>
    </div>
  `;
}

function getEditorialFallback(product) {
  const age = String(product.ageGroup || '').toLowerCase();
  const map = {
    women: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
    men: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    teens: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
    kids: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80',
    babies: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80'
  };
  return map[age] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80';
}