/**
 * SHOPY — Admin Console JavaScript
 * Connects directly to Spring Boot backend APIs with JWT authentication.
 */

let allProducts = [];
let filteredProducts = [];
let allCategories = [];
let allOrders = [];
let filteredOrders = [];
let allUsers = [];
let filteredUsers = [];

// ======================================================
// PAGE INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", async function () {
    if (!checkAdminAccess()) return;

    // Load initial data
    await loadCategories();
    await loadDashboardStats();
    await loadProducts();
    await loadOrders();
    await loadUsers();
    loadInventory();

    setupProductForm();
    setupCategoryForm();
});

// ======================================================
// ADMIN ACCESS VERIFICATION
// ======================================================

function checkAdminAccess() {
    const token = Shopy.getToken();
    const user = Shopy.getUser();

    if (!token || !user) {
        window.location.href = "/login.html?redirect=" + encodeURIComponent(window.location.pathname);
        return false;
    }

    if (user.role !== "ADMIN") {
        if (typeof Shopy.toast === "function") {
            Shopy.toast("Access denied: Administrative privileges required", "error");
        } else {
            alert("Access denied: Administrative privileges required");
        }
        window.location.href = "/index.html";
        return false;
    }

    const adminNameEl = document.getElementById("adminName");
    const adminAvatarEl = document.getElementById("adminAvatar");

    if (adminNameEl) {
        adminNameEl.textContent = user.name || user.username || "Administrator";
    }
    if (adminAvatarEl) {
        const initial = (user.name || user.username || "A").charAt(0).toUpperCase();
        adminAvatarEl.textContent = initial;
    }

    return true;
}

function getAuthHeaders() {
    const token = Shopy.getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}

// ======================================================
// NAVIGATION & SIDEBAR
// ======================================================

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("open");
}

function showSection(sectionName, clickedButton = null) {
    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active-section"));

    const targetSection = document.getElementById(sectionName);
    if (targetSection) targetSection.classList.add("active-section");

    document.querySelectorAll(".sidebar-nav .nav-item").forEach(btn => btn.classList.remove("active"));
    if (clickedButton) {
        clickedButton.classList.add("active");
    } else {
        const btn = document.querySelector(`.sidebar-nav .nav-item[onclick*="'${sectionName}'"]`);
        if (btn) btn.classList.add("active");
    }

    const titles = {
        dashboard: "Dashboard Overview",
        products: "Product Catalog",
        categories: "Taxonomy & Categories",
        orders: "Customer Orders",
        users: "Customer Accounts",
        inventory: "Inventory Control"
    };

    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || "Admin Console";
    }

    const sidebar = document.getElementById("sidebar");
    if (sidebar && window.innerWidth <= 840) {
        sidebar.classList.remove("open");
    }

    if (sectionName === "inventory") loadInventory();
    if (sectionName === "orders") loadOrders();
    if (sectionName === "users") loadUsers();
    if (sectionName === "categories") loadCategories();
    if (sectionName === "products") loadProducts();
}

function goToStore() {
    window.location.href = "/index.html";
}

function logoutAdmin() {
    Shopy.logout();
    window.location.href = "/login.html";
}

// ======================================================
// DASHBOARD METRICS
// ======================================================

async function loadDashboardStats() {
    try {
        const res = await fetch("/api/admin/dashboard", {
            method: "GET",
            headers: getAuthHeaders()
        });

        let stats = null;
        if (res.ok) {
            stats = await res.json();
        } else {
            // Fallback to /api/admin/stats
            const fallbackRes = await fetch("/api/admin/stats", {
                method: "GET",
                headers: getAuthHeaders()
            });
            if (fallbackRes.ok) stats = await fallbackRes.json();
        }

        if (stats) {
            const totalProdEl = document.getElementById("totalProducts");
            const totalUsersEl = document.getElementById("totalUsers");
            const totalOrdersEl = document.getElementById("totalOrders");
            const totalRevEl = document.getElementById("totalRevenue");

            if (totalProdEl) totalProdEl.textContent = stats.totalProducts ?? 0;
            if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers ?? 0;
            if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders ?? 0;
            if (totalRevEl) {
                totalRevEl.textContent = Shopy.formatPrice(stats.totalRevenue || 0);
            }
        }
    } catch (err) {
        console.error("Dashboard stats error:", err);
    }
}

async function refreshDashboard() {
    await loadDashboardStats();
    await loadProducts();
    await loadOrders();
    loadInventory();
    Shopy.toast("Dashboard data refreshed", "info");
}

// ======================================================
// PRODUCTS MANAGEMENT
// ======================================================

async function loadProducts() {
    try {
        const res = await fetch("/api/products?page=0&size=500&sortBy=id&direction=desc", {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Failed to load products");

        const data = await res.json();
        allProducts = data.content || (Array.isArray(data) ? data : []);
        filteredProducts = [...allProducts];

        renderProducts(filteredProducts);
        renderLowStockAlerts(allProducts);
        loadInventory();
    } catch (err) {
        console.error("Error loading products:", err);
        const tbody = document.getElementById("productsTable");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-table">Error loading products: ${Shopy.escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function renderProducts(products) {
    const tbody = document.getElementById("productsTable");
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-table">No matching products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const stock = Number(p.stock || 0);
        let stockBadge = "";
        if (stock === 0) {
            stockBadge = `<span class="stock-out">Out of stock (0)</span>`;
        } else if (stock <= 5) {
            stockBadge = `<span class="stock-low">Low: ${stock} units</span>`;
        } else {
            stockBadge = `<span class="stock-good">${stock} in stock</span>`;
        }

        const categoryName = p.category?.name || "Unassigned";
        const img = p.imageUrl ? `<img src="${Shopy.escapeHtml(p.imageUrl)}" alt="${Shopy.escapeHtml(p.name)}" onerror="this.style.display='none'">` : "";

        return `
            <tr>
                <td>#${p.id}</td>
                <td>
                    <div class="admin-product-name">
                        ${img}
                        <div>
                            <strong>${Shopy.escapeHtml(p.name)}</strong>
                            <button type="button" class="mobile-edit-button" onclick="editProduct(${p.id})">Edit</button>
                        </div>
                    </div>
                </td>
                <td>${Shopy.escapeHtml(p.brand || "—")}</td>
                <td><span style="font-size:12px; color:var(--admin-text-muted);">${Shopy.escapeHtml(categoryName)}</span></td>
                <td><strong>${Shopy.formatPrice(p.price || 0)}</strong></td>
                <td>${stockBadge}</td>
                <td>
                    <button type="button" onclick="editProduct(${p.id})">Edit</button>
                    <button type="button" class="btn-danger-sm" onclick="deleteProduct(${p.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join("");
}

function renderLowStockAlerts(products) {
    const container = document.getElementById("lowStockList");
    if (!container) return;

    const lowStockItems = products.filter(p => Number(p.stock || 0) <= 5);

    if (lowStockItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>✓</span>
                <p>All catalog products are adequately stocked.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = lowStockItems.slice(0, 5).map(p => {
        const stock = Number(p.stock || 0);
        const tag = stock === 0 
            ? `<span style="color:var(--admin-danger); font-weight:700;">OUT OF STOCK</span>` 
            : `<span style="color:#B45309; font-weight:600;">${stock} left</span>`;
        return `
            <div class="low-stock-item">
                <div>
                    <strong>${Shopy.escapeHtml(p.name)}</strong>
                    <span>${Shopy.escapeHtml(p.brand || "SHOPY")}</span>
                </div>
                <div style="text-align:right;">
                    ${tag}
                    <div style="margin-top:4px;">
                        <button type="button" style="font-size:11px; padding:2px 8px;" onclick="editProduct(${p.id})">Restock</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function searchProducts() { applyProductFilters(); }
function filterProducts() { applyProductFilters(); }
function sortProducts() { applyProductFilters(); }

function applyProductFilters() {
    const searchVal = (document.getElementById("productSearch")?.value || "").toLowerCase().trim();
    const catVal = document.getElementById("productCategoryFilter")?.value || "";
    const sortVal = document.getElementById("productSort")?.value || "id";

    filteredProducts = allProducts.filter(p => {
        const name = (p.name || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const catName = p.category?.name || "";

        const matchSearch = !searchVal || name.includes(searchVal) || brand.includes(searchVal);
        const matchCategory = !catVal || catName === catVal;

        return matchSearch && matchCategory;
    });

    if (sortVal === "name") {
        filteredProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortVal === "price-low") {
        filteredProducts.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortVal === "price-high") {
        filteredProducts.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortVal === "stock-low") {
        filteredProducts.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
    } else {
        filteredProducts.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    renderProducts(filteredProducts);
}

// Modal handling for Product
function openAddProductModal() {
    const modal = document.getElementById("productModal");
    const form = document.getElementById("productForm");
    if (form) form.reset();

    const editId = document.getElementById("editingProductId");
    if (editId) editId.value = "";

    const title = document.getElementById("productModalTitle");
    if (title) title.textContent = "Add Product";

    const submitBtn = document.getElementById("productSubmitButton");
    if (submitBtn) submitBtn.textContent = "Save Product";

    populateCategoryDropdown();

    if (modal) modal.classList.add("show");
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.classList.remove("show");
}

function editProduct(id) {
    const product = allProducts.find(p => Number(p.id) === Number(id));
    if (!product) {
        Shopy.toast("Product record not found", "error");
        return;
    }

    populateCategoryDropdown();

    document.getElementById("editingProductId").value = product.id;
    document.getElementById("productName").value = product.name || "";
    document.getElementById("productBrand").value = product.brand || "";
    document.getElementById("productPrice").value = product.price ?? "";
    document.getElementById("productStock").value = product.stock ?? "";
    document.getElementById("productImage").value = product.imageUrl || "";
    document.getElementById("productDescription").value = product.description || "";

    const catSelect = document.getElementById("productCategory");
    if (catSelect && product.category?.id) {
        catSelect.value = product.category.id;
    }

    document.getElementById("productModalTitle").textContent = "Edit Product #" + product.id;
    document.getElementById("productSubmitButton").textContent = "Update Product";

    const modal = document.getElementById("productModal");
    if (modal) modal.classList.add("show");
}

function setupProductForm() {
    const form = document.getElementById("productForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const editId = document.getElementById("editingProductId").value.trim();
        const name = document.getElementById("productName").value.trim();
        const brand = document.getElementById("productBrand").value.trim();
        const price = parseFloat(document.getElementById("productPrice").value);
        const stock = parseInt(document.getElementById("productStock").value, 10);
        const imageUrl = document.getElementById("productImage").value.trim();
        const description = document.getElementById("productDescription").value.trim();
        const categoryId = document.getElementById("productCategory").value;

        if (!name || !brand || isNaN(price) || isNaN(stock) || !categoryId) {
            Shopy.toast("Please fill in all required fields", "warning");
            return;
        }

        const payload = {
            name,
            brand,
            price,
            stock,
            imageUrl,
            description,
            category: { id: Number(categoryId) }
        };

        try {
            const url = editId ? `/api/products/${editId}` : `/api/products`;
            const method = editId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to save product");
            }

            Shopy.toast(editId ? "Product updated successfully" : "Product added successfully", "success");
            closeProductModal();
            await loadProducts();
            await loadDashboardStats();
        } catch (err) {
            console.error("Save product error:", err);
            Shopy.toast("Failed to save product: " + err.message, "error");
        }
    });
}

async function deleteProduct(id) {
    const product = allProducts.find(p => Number(p.id) === Number(id));
    const confirmName = product ? `"${product.name}"` : "this product";

    if (!confirm(`Are you sure you want to permanently delete ${confirmName}?`)) return;

    try {
        const res = await fetch(`/api/products/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Failed to delete product from database");

        Shopy.toast("Product deleted successfully", "success");
        await loadProducts();
        await loadDashboardStats();
    } catch (err) {
        console.error("Delete product error:", err);
        Shopy.toast("Delete failed: " + err.message, "error");
    }
}

// ======================================================
// CATEGORIES MANAGEMENT
// ======================================================

async function loadCategories() {
    try {
        const res = await fetch("/api/categories", {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Failed to load categories");

        allCategories = await res.json();
        renderCategories(allCategories);
        populateCategoryFilters(allCategories);
        populateCategoryDropdown();
    } catch (err) {
        console.error("Categories error:", err);
    }
}

function renderCategories(categories) {
    const grid = document.getElementById("categoryGrid");
    if (!grid) return;

    if (!categories || categories.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>No categories defined.</p></div>`;
        return;
    }

    grid.innerHTML = categories.map(cat => `
        <div class="category-admin-card">
            <div>
                <span class="cat-badge">#${cat.id}</span>
                <h3>${Shopy.escapeHtml(cat.name)}</h3>
                <p>${Shopy.escapeHtml(cat.description || "No description provided.")}</p>
            </div>
            <div class="category-actions">
                <button type="button" onclick="editCategory(${cat.id})">Edit</button>
                <button type="button" class="danger-outline" onclick="deleteCategory(${cat.id}, '${Shopy.escapeHtml(cat.name)}')">Delete</button>
            </div>
        </div>
    `).join("");
}

function populateCategoryFilters(categories) {
    const filterSelect = document.getElementById("productCategoryFilter");
    if (!filterSelect) return;

    const currentVal = filterSelect.value;
    filterSelect.innerHTML = `<option value="">All Categories</option>` + 
        categories.map(c => `<option value="${Shopy.escapeHtml(c.name)}">${Shopy.escapeHtml(c.name)}</option>`).join("");
    if (currentVal) filterSelect.value = currentVal;
}

function populateCategoryDropdown() {
    const catSelect = document.getElementById("productCategory");
    if (!catSelect) return;

    const currentVal = catSelect.value;
    catSelect.innerHTML = `<option value="">Select Category</option>` + 
        allCategories.map(c => `<option value="${c.id}">${Shopy.escapeHtml(c.name)}</option>`).join("");
    if (currentVal) catSelect.value = currentVal;
}

function openCategoryModal() {
    const modal = document.getElementById("categoryModal");
    const form = document.getElementById("categoryForm");
    if (form) form.reset();

    document.getElementById("editingCategoryId").value = "";
    document.getElementById("categoryModalTitle").textContent = "Add Category";
    document.getElementById("categorySubmitBtn").textContent = "Save Category";

    if (modal) modal.classList.add("show");
}

function closeCategoryModal() {
    const modal = document.getElementById("categoryModal");
    if (modal) modal.classList.remove("show");
}

function editCategory(id) {
    const cat = allCategories.find(c => Number(c.id) === Number(id));
    if (!cat) return;

    document.getElementById("editingCategoryId").value = cat.id;
    document.getElementById("categoryName").value = cat.name || "";
    document.getElementById("categoryDescription").value = cat.description || "";

    document.getElementById("categoryModalTitle").textContent = "Edit Category #" + cat.id;
    document.getElementById("categorySubmitBtn").textContent = "Update Category";

    const modal = document.getElementById("categoryModal");
    if (modal) modal.classList.add("show");
}

function setupCategoryForm() {
    const form = document.getElementById("categoryForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const editId = document.getElementById("editingCategoryId").value.trim();
        const name = document.getElementById("categoryName").value.trim();
        const description = document.getElementById("categoryDescription").value.trim();

        if (!name) {
            Shopy.toast("Category name is required", "warning");
            return;
        }

        const payload = { name, description };

        try {
            const url = editId ? `/api/categories/${editId}` : `/api/categories`;
            const method = editId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save category");

            Shopy.toast(editId ? "Category updated" : "Category created", "success");
            closeCategoryModal();
            await loadCategories();
        } catch (err) {
            console.error("Save category error:", err);
            Shopy.toast("Save category failed: " + err.message, "error");
        }
    });
}

async function deleteCategory(id, name) {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
        const res = await fetch(`/api/categories/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Failed to delete category");

        Shopy.toast("Category removed", "success");
        await loadCategories();
    } catch (err) {
        console.error("Delete category error:", err);
        Shopy.toast("Cannot delete category: " + err.message, "error");
    }
}

// ======================================================
// ORDERS MANAGEMENT
// ======================================================

async function loadOrders() {
    try {
        const res = await fetch("/api/admin/orders", {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Failed to load orders");

        allOrders = await res.json();
        // Sort descending by id
        allOrders.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        filteredOrders = [...allOrders];

        renderOrders(filteredOrders);
        renderRecentOrders(allOrders);
    } catch (err) {
        console.error("Orders error:", err);
        const tbody = document.getElementById("ordersTable");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-table">Error loading orders: ${Shopy.escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function renderOrders(orders) {
    const tbody = document.getElementById("ordersTable");
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-table">No orders found.</td></tr>`;
        return;
    }

    const statuses = ["PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

    tbody.innerHTML = orders.map(ord => {
        const status = ord.status || "PLACED";
        const badgeClass = `badge-${status.toLowerCase().replace(/_/g, "-")}`;
        const dateStr = ord.orderDate ? new Date(ord.orderDate).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        }) : "—";
        const destination = ord.city ? `${ord.city}, ${ord.state || ""}` : (ord.country || "India");

        const options = statuses.map(s => 
            `<option value="${s}" ${s === status ? "selected" : ""}>${s.replace(/_/g, " ")}</option>`
        ).join("");

        return `
            <tr>
                <td><strong>#${ord.id}</strong></td>
                <td>
                    <strong>${Shopy.escapeHtml(ord.customerName || ord.username || "Customer")}</strong>
                    <div style="font-size:11.5px; color:var(--admin-text-muted);">ID: ${ord.userId || "—"}</div>
                </td>
                <td>${Shopy.escapeHtml(destination)}</td>
                <td>${dateStr}</td>
                <td><strong>${Shopy.formatPrice(ord.totalAmount || 0)}</strong></td>
                <td><span class="badge-status ${badgeClass}">${status.replace(/_/g, " ")}</span></td>
                <td>
                    <select style="height:32px; font-size:12px; padding:0 8px; border-radius:4px; border:1px solid var(--admin-border);"
                            onchange="updateOrderStatus(${ord.id}, this.value)">
                        ${options}
                    </select>
                </td>
            </tr>
        `;
    }).join("");
}

function renderRecentOrders(orders) {
    const tbody = document.getElementById("recentOrders");
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-table">No recent transactions.</td></tr>`;
        return;
    }

    const recent = orders.slice(0, 5);
    tbody.innerHTML = recent.map(ord => {
        const status = ord.status || "PLACED";
        const badgeClass = `badge-${status.toLowerCase().replace(/_/g, "-")}`;

        return `
            <tr>
                <td><strong>#${ord.id}</strong></td>
                <td>${Shopy.escapeHtml(ord.customerName || ord.username || "Customer")}</td>
                <td><strong>${Shopy.formatPrice(ord.totalAmount || 0)}</strong></td>
                <td><span class="badge-status ${badgeClass}">${status.replace(/_/g, " ")}</span></td>
            </tr>
        `;
    }).join("");
}

function filterOrders() {
    const searchVal = (document.getElementById("orderSearch")?.value || "").toLowerCase().trim();
    const statusVal = document.getElementById("orderStatusFilter")?.value || "";

    filteredOrders = allOrders.filter(ord => {
        const customer = (ord.customerName || ord.username || "").toLowerCase();
        const city = (ord.city || "").toLowerCase();
        const idStr = String(ord.id);

        const matchSearch = !searchVal || customer.includes(searchVal) || city.includes(searchVal) || idStr.includes(searchVal);
        const matchStatus = !statusVal || ord.status === statusVal;

        return matchSearch && matchStatus;
    });

    renderOrders(filteredOrders);
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Failed to update status");
        }

        Shopy.toast(`Order #${orderId} marked as ${newStatus}`, "success");
        await loadOrders();
        await loadDashboardStats();
    } catch (err) {
        console.error("Order status update error:", err);
        Shopy.toast("Status update failed: " + err.message, "error");
        await loadOrders(); // revert dropdown UI
    }
}

// ======================================================
// USERS MANAGEMENT
// ======================================================

async function loadUsers() {
    try {
        const res = await fetch("/api/admin/users", {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Failed to load customer list");

        allUsers = await res.json();
        filteredUsers = [...allUsers];

        renderUsers(filteredUsers);
    } catch (err) {
        console.error("Users error:", err);
        const tbody = document.getElementById("usersTable");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-table">Error loading users: ${Shopy.escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function renderUsers(users) {
    const tbody = document.getElementById("usersTable");
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-table">No matching accounts found.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => {
        const isAdm = u.role === "ADMIN";
        const roleBadge = isAdm
            ? `<span style="background:rgba(100,31,43,0.1); color:var(--admin-primary-accent); padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700;">ADMIN</span>`
            : `<span style="background:#F0EEE8; color:var(--admin-text-muted); padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">CUSTOMER</span>`;

        return `
            <tr>
                <td>#${u.id}</td>
                <td><strong>${Shopy.escapeHtml(u.name || "—")}</strong></td>
                <td>${Shopy.escapeHtml(u.username || "—")}</td>
                <td><a href="mailto:${Shopy.escapeHtml(u.email || "")}" style="color:inherit; text-decoration:underline;">${Shopy.escapeHtml(u.email || "—")}</a></td>
                <td>${roleBadge}</td>
            </tr>
        `;
    }).join("");
}

function filterUsers() {
    const searchVal = (document.getElementById("userSearch")?.value || "").toLowerCase().trim();

    filteredUsers = allUsers.filter(u => {
        const name = (u.name || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        const email = (u.email || "").toLowerCase();

        return !searchVal || name.includes(searchVal) || username.includes(searchVal) || email.includes(searchVal);
    });

    renderUsers(filteredUsers);
}

// ======================================================
// INVENTORY CONTROL
// ======================================================

function loadInventory() {
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    allProducts.forEach(p => {
        const count = Number(p.stock || 0);
        totalStock += count;
        if (count === 0) outOfStock++;
        else if (count <= 5) lowStock++;
    });

    const totalEl = document.getElementById("inventoryTotal");
    const lowEl = document.getElementById("inventoryLow");
    const outEl = document.getElementById("inventoryOut");

    if (totalEl) totalEl.textContent = totalStock;
    if (lowEl) lowEl.textContent = lowStock;
    if (outEl) outEl.textContent = outOfStock;

    renderInventoryTable(allProducts);
}

function renderInventoryTable(products) {
    const tbody = document.getElementById("inventoryTable");
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-table">No inventory items.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const stock = Number(p.stock || 0);
        let statusBadge = "";
        if (stock === 0) {
            statusBadge = `<span class="stock-out">Out of Stock</span>`;
        } else if (stock <= 5) {
            statusBadge = `<span class="stock-low">Low Stock</span>`;
        } else {
            statusBadge = `<span class="stock-good">In Stock</span>`;
        }

        return `
            <tr>
                <td><strong>${Shopy.escapeHtml(p.name)}</strong></td>
                <td>${Shopy.escapeHtml(p.brand || "—")}</td>
                <td><strong>${stock} units</strong></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="quick-stock-form">
                        <input type="number" min="0" value="${stock}" id="stockInput_${p.id}">
                        <button type="button" onclick="updateInventoryStock(${p.id})">Update</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

async function updateInventoryStock(productId) {
    const input = document.getElementById(`stockInput_${productId}`);
    if (!input) return;

    const newStock = parseInt(input.value, 10);
    if (isNaN(newStock) || newStock < 0) {
        Shopy.toast("Please enter a valid stock value", "warning");
        return;
    }

    try {
        const res = await fetch(`/api/admin/inventory/product/${productId}?stock=${newStock}`, {
            method: "PUT",
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Failed to update inventory count");

        Shopy.toast(`Stock updated for item #${productId}`, "success");
        await loadProducts();
    } catch (err) {
        console.error("Inventory update error:", err);
        Shopy.toast("Failed to update stock: " + err.message, "error");
    }
}

// Global exposes for template HTML events
window.toggleSidebar = toggleSidebar;
window.showSection = showSection;
window.refreshDashboard = refreshDashboard;
window.goToStore = goToStore;
window.logoutAdmin = logoutAdmin;

window.openAddProductModal = openAddProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.searchProducts = searchProducts;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;

window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;

window.loadOrders = loadOrders;
window.filterOrders = filterOrders;
window.updateOrderStatus = updateOrderStatus;

window.loadUsers = loadUsers;
window.filterUsers = filterUsers;

window.loadInventory = loadInventory;
window.updateInventoryStock = updateInventoryStock;