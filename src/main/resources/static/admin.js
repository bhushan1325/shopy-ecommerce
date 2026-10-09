const ADMIN_API = "/api/admin";

let allProducts = [];
let filteredProducts = [];


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    checkAdminAccess();

    loadDashboardStats();
    loadProducts();

    setupProductForm();
    setupCategoryForm();

    setupOrderSearch();
    setupUserSearch();

});


// ======================================================
// ADMIN ACCESS
// ======================================================

function checkAdminAccess() {

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        window.location.href = "/login.html";
        return;
    }

    try {

        const user = JSON.parse(userData);

        if (user.role !== "ADMIN") {

            alert("Access denied. Admin account required.");

            window.location.href = "/";

            return;
        }

        const adminName =
            document.getElementById("adminName");

        if (adminName) {

            adminName.textContent =
                user.name ||
                user.username ||
                "Administrator";

        }

    } catch (error) {

        console.error("Invalid user data:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login.html";
    }
}


// ======================================================
// AUTH HEADERS
// ======================================================

function getAuthHeaders() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


// ======================================================
// SIDEBAR
// ======================================================

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}


// ======================================================
// SECTION NAVIGATION
// ======================================================

function showSection(
    sectionName,
    clickedButton = null
) {

    const sections =
        document.querySelectorAll(".admin-section");

    sections.forEach(function (section) {

        section.classList.remove(
            "active-section"
        );

    });

    const selectedSection =
        document.getElementById(sectionName);

    if (selectedSection) {

        selectedSection.classList.add(
            "active-section"
        );

    }

    const navButtons =
        document.querySelectorAll(".nav-item");

    navButtons.forEach(function (button) {

        button.classList.remove("active");

    });

    if (clickedButton) {

        clickedButton.classList.add("active");

    }

    const titles = {

        dashboard: "Admin Dashboard",
        products: "Products",
        categories: "Categories",
        orders: "Orders",
        users: "Users",
        inventory: "Inventory"

    };

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionName] ||
            "Admin Dashboard";

    }

    const sidebar =
        document.getElementById("sidebar");

    if (sidebar) {

        sidebar.classList.remove("open");

    }

    if (sectionName === "inventory") {

        loadInventory();

    }

}


// ======================================================
// DASHBOARD STATISTICS
// ======================================================

async function loadDashboardStats() {

    try {

        const response =
            await fetch(
                `${ADMIN_API}/stats`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            console.error(
                "Admin statistics access denied."
            );

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Failed to load dashboard statistics."
            );

        }

        const stats =
            await response.json();

        const totalProducts =
            document.getElementById(
                "totalProducts"
            );

        const totalUsers =
            document.getElementById(
                "totalUsers"
            );

        const totalOrders =
            document.getElementById(
                "totalOrders"
            );

        const totalRevenue =
            document.getElementById(
                "totalRevenue"
            );

        if (totalProducts) {

            totalProducts.textContent =
                stats.totalProducts ?? 0;

        }

        if (totalUsers) {

            totalUsers.textContent =
                stats.totalUsers ?? 0;

        }

        if (totalOrders) {

            totalOrders.textContent =
                stats.totalOrders ?? 0;

        }

        if (totalRevenue) {

            totalRevenue.textContent =
                "₹" +
                Number(
                    stats.totalRevenue ?? 0
                ).toLocaleString("en-IN");

        }

    } catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );

    }

}


// ======================================================
// REFRESH DASHBOARD
// ======================================================

function refreshDashboard() {

    loadDashboardStats();
    loadProducts();

}


// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "/api/products?page=0&size=100&sortBy=id&direction=desc",
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load products."
            );

        }

        const data =
            await response.json();

        allProducts =
            data.content || [];

        filteredProducts =
            [...allProducts];

        renderProducts(
            filteredProducts
        );

    } catch (error) {

        console.error(
            "Products loading error:",
            error
        );

    }

}


// ======================================================
// RENDER PRODUCTS
// ======================================================

function renderProducts(products) {

    const tableBody =
        document.getElementById(
            "productsTable"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (products.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-table"
                >

                    No products found.

                </td>

            </tr>

        `;

        return;
    }

    products.forEach(function (product) {

        const row =
            document.createElement("tr");

        const categoryName =
            product.category &&
            product.category.name
                ? product.category.name
                : "-";

        const stock =
            Number(product.stock || 0);

        let stockClass = "";
        let stockText = "";

        if (stock === 0) {

            stockClass = "stock-out";
            stockText = "Out of Stock";

        } else if (stock <= 5) {

            stockClass = "stock-low";
            stockText = `${stock} - Low`;

        } else {

            stockClass = "stock-good";
            stockText = `${stock} - In Stock`;

        }

        row.innerHTML = `

            <td>
                ${product.id ?? "-"}
            </td>

            <td>

                <div class="admin-product-name">

                    ${
                        product.imageUrl
                        ?
                        `
                        <img
                            src="${escapeHtml(
                                product.imageUrl
                            )}"
                            alt="${escapeHtml(
                                product.name ||
                                "Product"
                            )}"
                            onerror="
                                this.style.display='none'
                            "
                        >
                        `
                        :
                        ""
                    }

                    <div>

                        <div>
                            ${escapeHtml(
                                product.name ||
                                "-"
                            )}
                        </div>

                        <button
                            type="button"
                            class="mobile-edit-button"
                            onclick="
                                editProduct(
                                    ${product.id}
                                )
                            "
                        >
                            Edit Product
                        </button>

                    </div>

                </div>

            </td>

            <td>
                ${escapeHtml(
                    product.brand || "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    categoryName
                )}
            </td>

            <td>

                ₹${Number(
                    product.price || 0
                ).toLocaleString("en-IN")}

            </td>

            <td>

                <span
                    class="${stockClass}"
                >

                    ${stockText}

                </span>

            </td>

            <td>

                <button
                    type="button"
                    onclick="
                        editProduct(
                            ${product.id}
                        )
                    "
                >
                    Edit
                </button>

                <button
                    type="button"
                    onclick="
                        deleteProduct(
                            ${product.id}
                        )
                    "
                >
                    Delete
                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });

}


// ======================================================
// SEARCH
// ======================================================

function searchProducts() {

    applyProductFilters();

}


function filterProducts() {

    applyProductFilters();

}


function sortProducts() {

    applyProductFilters();

}


// ======================================================
// FILTER + SEARCH + SORT
// ======================================================

function applyProductFilters() {

    const searchInput =
        document.getElementById(
            "productSearch"
        );

    const categoryFilter =
        document.getElementById(
            "productCategoryFilter"
        );

    const sortSelect =
        document.getElementById(
            "productSort"
        );

    const keyword =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value
            : "";

    filteredProducts =
        allProducts.filter(function (product) {

            const name =
                (product.name || "")
                    .toLowerCase();

            const brand =
                (product.brand || "")
                    .toLowerCase();

            const productCategory =
                product.category &&
                product.category.name
                    ? product.category.name
                    : "";

            const matchesSearch =
                !keyword ||
                name.includes(keyword) ||
                brand.includes(keyword);

            const matchesCategory =
                !category ||
                productCategory === category;

            return (
                matchesSearch &&
                matchesCategory
            );

        });

    const sortValue =
        sortSelect
            ? sortSelect.value
            : "id";

    if (sortValue === "name") {

        filteredProducts.sort(
            function (a, b) {

                return (a.name || "")
                    .localeCompare(
                        b.name || ""
                    );

            }
        );

    }

    else if (sortValue === "price-low") {

        filteredProducts.sort(
            function (a, b) {

                return Number(
                    a.price || 0
                ) -
                Number(
                    b.price || 0
                );

            }
        );

    }

    else if (sortValue === "price-high") {

        filteredProducts.sort(
            function (a, b) {

                return Number(
                    b.price || 0
                ) -
                Number(
                    a.price || 0
                );

            }
        );

    }

    else if (sortValue === "stock-low") {

        filteredProducts.sort(
            function (a, b) {

                return Number(
                    a.stock || 0
                ) -
                Number(
                    b.stock || 0
                );

            }
        );

    }

    else if (sortValue === "stock-high") {

        filteredProducts.sort(
            function (a, b) {

                return Number(
                    b.stock || 0
                ) -
                Number(
                    a.stock || 0
                );

            }
        );

    }

    else {

        filteredProducts.sort(
            function (a, b) {

                return Number(
                    b.id || 0
                ) -
                Number(
                    a.id || 0
                );

            }
        );

    }

    renderProducts(
        filteredProducts
    );

}


// ======================================================
// OPEN ADD PRODUCT MODAL
// ======================================================

function openAddProductModal() {

    const modal =
        document.getElementById(
            "productModal"
        );

    const form =
        document.getElementById(
            "productForm"
        );

    if (form) {

        form.reset();

    }

    const editingId =
        document.getElementById(
            "editingProductId"
        );

    if (editingId) {

        editingId.value = "";

    }

    const title =
        document.getElementById(
            "productModalTitle"
        );

    if (title) {

        title.textContent =
            "Add Product";

    }

    const description =
        document.getElementById(
            "productModalDescription"
        );

    if (description) {

        description.textContent =
            "Create a new Shopora product.";

    }

    const submitButton =
        document.getElementById(
            "productSubmitButton"
        );

    if (submitButton) {

        submitButton.textContent =
            "Add Product";

    }

    if (modal) {

        /*
         * IMPORTANT:
         * admin.css uses .show
         */
        modal.classList.add("show");

    }

}


// ======================================================
// CLOSE PRODUCT MODAL
// ======================================================

function closeProductModal() {

    const modal =
        document.getElementById(
            "productModal"
        );

    if (modal) {

        modal.classList.remove("show");

    }

}


// ======================================================
// PRODUCT FORM
// ======================================================

function setupProductForm() {

    const form =
        document.getElementById(
            "productForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        saveProduct
    );

}


// ======================================================
// SAVE PRODUCT
// ======================================================

async function saveProduct(event) {

    event.preventDefault();

    const editingElement =
        document.getElementById(
            "editingProductId"
        );

    const editingId =
        editingElement
            ? editingElement.value
            : "";

    const name =
        document.getElementById(
            "productName"
        ).value.trim();

    const brand =
        document.getElementById(
            "productBrand"
        ).value.trim();

    const price =
        document.getElementById(
            "productPrice"
        ).value;

    const stock =
        document.getElementById(
            "productStock"
        ).value;

    const imageUrl =
        document.getElementById(
            "productImage"
        ).value.trim();

    const description =
        document.getElementById(
            "productDescription"
        ).value.trim();

    const categoryId =
        document.getElementById(
            "productCategory"
        ).value;

    if (
        !name ||
        !brand ||
        price === "" ||
        stock === "" ||
        !categoryId
    ) {

        alert(
            "Please fill all required product fields."
        );

        return;
    }

    if (Number(price) < 0) {

        alert(
            "Price cannot be negative."
        );

        return;
    }

    if (Number(stock) < 0) {

        alert(
            "Stock cannot be negative."
        );

        return;
    }

    const product = {

        name: name,

        brand: brand,

        price: Number(price),

        stock: Number(stock),

        imageUrl: imageUrl,

        description: description,

        category: {
            id: Number(categoryId)
        }

    };

    try {

        let response;

        if (editingId) {

            response =
                await fetch(
                    `/api/products/${editingId}`,
                    {
                        method: "PUT",
                        headers:
                            getAuthHeaders(),
                        body:
                            JSON.stringify(
                                product
                            )
                    }
                );

        } else {

            response =
                await fetch(
                    "/api/products",
                    {
                        method: "POST",
                        headers:
                            getAuthHeaders(),
                        body:
                            JSON.stringify(
                                product
                            )
                    }
                );

        }

        if (!response.ok) {

            const message =
                await response.text();

            throw new Error(
                message ||
                "Failed to save product."
            );

        }

        if (editingId) {

            alert(
                "Product updated successfully."
            );

        } else {

            alert(
                "Product added successfully."
            );

        }

        closeProductModal();

        await loadProducts();

        await loadDashboardStats();

    } catch (error) {

        console.error(
            "Product save error:",
            error
        );

        alert(
            "Failed to save product."
        );

    }

}


// ======================================================
// EDIT PRODUCT
// ======================================================

function editProduct(id) {

    const product =
        allProducts.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );

    if (!product) {

        alert(
            "Product information not found."
        );

        return;
    }

    const editingId =
        document.getElementById(
            "editingProductId"
        );

    if (editingId) {

        editingId.value =
            product.id;

    }

    const name =
        document.getElementById(
            "productName"
        );

    if (name) {

        name.value =
            product.name || "";

    }

    const brand =
        document.getElementById(
            "productBrand"
        );

    if (brand) {

        brand.value =
            product.brand || "";

    }

    const price =
        document.getElementById(
            "productPrice"
        );

    if (price) {

        price.value =
            product.price ?? "";

    }

    const stock =
        document.getElementById(
            "productStock"
        );

    if (stock) {

        stock.value =
            product.stock ?? "";

    }

    const image =
        document.getElementById(
            "productImage"
        );

    if (image) {

        image.value =
            product.imageUrl || "";

    }

    const description =
        document.getElementById(
            "productDescription"
        );

    if (description) {

        description.value =
            product.description || "";

    }

    const category =
        document.getElementById(
            "productCategory"
        );

    if (category) {

        category.value =
            product.category
                ? product.category.id
                : "";

    }

    const title =
        document.getElementById(
            "productModalTitle"
        );

    if (title) {

        title.textContent =
            "Edit Product";

    }

    const modalDescription =
        document.getElementById(
            "productModalDescription"
        );

    if (modalDescription) {

        modalDescription.textContent =
            "Update this Shopora product.";

    }

    const submitButton =
        document.getElementById(
            "productSubmitButton"
        );

    if (submitButton) {

        submitButton.textContent =
            "Save Changes";

    }

    const modal =
        document.getElementById(
            "productModal"
        );

    if (modal) {

        modal.classList.add("show");

        modal.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(id) {

    const product =
        allProducts.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );

    const productName =
        product
            ? product.name
            : "this product";

    const confirmed =
        confirm(
            `Are you sure you want to delete "${productName}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/products/${id}`,
                {
                    method: "DELETE",
                    headers:
                        getAuthHeaders()
                }
            );

        if (!response.ok) {

            throw new Error(
                "Failed to delete product."
            );

        }

        alert(
            "Product deleted successfully."
        );

        await loadProducts();

        await loadDashboardStats();

    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(
            "Failed to delete product."
        );

    }

}


// ======================================================
// CATEGORY MODAL
// ======================================================

function openCategoryModal() {

    const modal =
        document.getElementById(
            "categoryModal"
        );

    if (modal) {

        modal.classList.add("show");

    }

}


function closeCategoryModal() {

    const modal =
        document.getElementById(
            "categoryModal"
        );

    if (modal) {

        modal.classList.remove("show");

    }

}


// ======================================================
// CATEGORY FORM
// ======================================================

function setupCategoryForm() {

    const form =
        document.getElementById(
            "categoryForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        saveCategory
    );

}


async function saveCategory(event) {

    event.preventDefault();

    const name =
        document.getElementById(
            "categoryName"
        ).value.trim();

    const description =
        document.getElementById(
            "categoryDescription"
        ).value.trim();

    if (!name) {

        alert(
            "Category name is required."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "/api/categories",
                {
                    method: "POST",
                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({
                            name:
                                name,
                            description:
                                description
                        })
                }
            );

        if (!response.ok) {

            throw new Error(
                "Failed to create category."
            );

        }

        alert(
            "Category created successfully."
        );

        const form =
            document.getElementById(
                "categoryForm"
            );

        if (form) {
            form.reset();
        }

        closeCategoryModal();

    } catch (error) {

        console.error(
            "Category error:",
            error
        );

        alert(
            "Failed to create category."
        );

    }

}


// ======================================================
// INVENTORY
// ======================================================

function loadInventory() {

    const inventoryTotal =
        document.getElementById(
            "inventoryTotal"
        );

    const inventoryLow =
        document.getElementById(
            "inventoryLow"
        );

    const inventoryOut =
        document.getElementById(
            "inventoryOut"
        );

    const inventoryTable =
        document.getElementById(
            "inventoryTable"
        );

    let totalItems = 0;
    let lowStock = 0;
    let outOfStock = 0;

    allProducts.forEach(
        function (product) {

            const stock =
                Number(
                    product.stock || 0
                );

            totalItems += stock;

            if (stock === 0) {

                outOfStock++;

            } else if (stock <= 5) {

                lowStock++;

            }

        }
    );

    if (inventoryTotal) {

        inventoryTotal.textContent =
            totalItems;

    }

    if (inventoryLow) {

        inventoryLow.textContent =
            lowStock;

    }

    if (inventoryOut) {

        inventoryOut.textContent =
            outOfStock;

    }

    if (!inventoryTable) {
        return;
    }

    inventoryTable.innerHTML = "";

    if (allProducts.length === 0) {

        inventoryTable.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-table"
                >
                    No inventory data.
                </td>

            </tr>

        `;

        return;
    }

    allProducts.forEach(
        function (product) {

            const stock =
                Number(
                    product.stock || 0
                );

            const status =
                getStockStatus(stock);

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        product.name || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        product.brand || "-"
                    )}
                </td>

                <td>
                    ${stock}
                </td>

                <td>
                    ${status}
                </td>

                <td>

                    <button
                        type="button"
                        onclick="
                            editProduct(
                                ${product.id}
                            )
                        "
                    >
                        Edit
                    </button>

                </td>

            `;

            inventoryTable.appendChild(row);

        }
    );

}


// ======================================================
// STOCK STATUS
// ======================================================

function getStockStatus(stock) {

    stock =
        Number(stock || 0);

    if (stock === 0) {

        return "Out of Stock";

    }

    if (stock <= 5) {

        return "Low Stock";

    }

    return "In Stock";

}


// ======================================================
// ORDER SEARCH
// ======================================================

function setupOrderSearch() {

    const input =
        document.getElementById(
            "orderSearch"
        );

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        function () {

            console.log(
                "Order search:",
                input.value
            );

        }
    );

}


// ======================================================
// USER SEARCH
// ======================================================

function setupUserSearch() {

    const input =
        document.getElementById(
            "userSearch"
        );

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        function () {

            console.log(
                "User search:",
                input.value
            );

        }
    );

}


// ======================================================
// GO TO STORE
// ======================================================

function goToStore() {

    window.location.href =
        "/index.html";

}


// ======================================================
// LOGOUT
// ======================================================

function logoutAdmin() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );

    window.location.href =
        "/login.html";

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.toggleSidebar =
    toggleSidebar;

window.showSection =
    showSection;

window.refreshDashboard =
    refreshDashboard;

window.openAddProductModal =
    openAddProductModal;

window.closeProductModal =
    closeProductModal;

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.searchProducts =
    searchProducts;

window.filterProducts =
    filterProducts;

window.sortProducts =
    sortProducts;

window.openCategoryModal =
    openCategoryModal;

window.closeCategoryModal =
    closeCategoryModal;

window.goToStore =
    goToStore;

window.logoutAdmin =
    logoutAdmin;