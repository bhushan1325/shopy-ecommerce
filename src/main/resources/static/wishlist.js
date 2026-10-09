const token =
    localStorage.getItem("token");


// =====================================
// LOAD WISHLIST
// =====================================

async function loadWishlist() {

    const container =
        document.getElementById(
            "wishlistContainer"
        );


    if (!token) {

        container.innerHTML = `
            <div class="empty-products">

                <h3>
                    Login required
                </h3>

                <p>
                    Please login to view your wishlist.
                </p>

                <button
                    class="primary-button"
                    onclick="window.location.href='/login.html'"
                >
                    Login
                </button>

            </div>
        `;

        return;
    }


    try {

        const response =
            await fetch(
                "/api/wishlist",
                {
                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load wishlist"
            );
        }


        const items =
            await response.json();


        displayWishlist(items);


    } catch (error) {

        console.error(error);


        container.innerHTML = `
            <div class="empty-products">

                <h3>
                    Unable to load wishlist
                </h3>

                <p>
                    Please try again.
                </p>

                <button
                    class="primary-button"
                    onclick="loadWishlist()"
                >
                    Try Again
                </button>

            </div>
        `;
    }
}


// =====================================
// DISPLAY WISHLIST
// =====================================

function displayWishlist(items) {

    const container =
        document.getElementById(
            "wishlistContainer"
        );


    if (!items || items.length === 0) {

        container.innerHTML = `
            <div class="empty-products">

                <h3>
                    Your wishlist is empty ❤️
                </h3>

                <p>
                    Save products you want to buy later.
                </p>

                <button
                    class="primary-button"
                    onclick="window.location.href='/'"
                >
                    Explore Products
                </button>

            </div>
        `;

        return;
    }


    container.innerHTML = "";


    items.forEach(item => {

        const product =
            item.product || {};


        const productId =
            product.id ||
            item.productId;


        const productName =
            product.name ||
            "Product";


        const price =
            Number(
                product.price || 0
            );


        const stock =
            Number(
                product.stock || 0
            );


        const card =
            document.createElement("div");


        card.className =
            "product-card";


        card.innerHTML = `

            <div
                onclick="openProduct(${productId})"
                style="cursor:pointer;"
            >

                <div
                    style="
                        height:180px;
                        background:#f3f4f6;
                        border-radius:8px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        margin-bottom:15px;
                    "
                >

                    ${
                        product.imageUrl
                        ?
                        `<img
                            src="${escapeHtml(product.imageUrl)}"
                            alt="${escapeHtml(productName)}"
                            style="
                                width:100%;
                                height:100%;
                                object-fit:contain;
                            "
                        >`
                        :
                        `<span
                            style="font-size:65px;"
                        >
                            🛍️
                        </span>`
                    }

                </div>


                <h3>
                    ${escapeHtml(productName)}
                </h3>


                <p class="product-price">
                    ₹${price.toLocaleString("en-IN")}
                </p>


                <p>
                    ${
                        stock > 0
                        ? `Stock: ${stock}`
                        : "Out of stock"
                    }
                </p>

            </div>


            <button
                onclick="addWishlistProductToCart(${productId})"
                ${
                    stock <= 0
                    ? "disabled"
                    : ""
                }
            >
                ${
                    stock > 0
                    ? "Add to Cart"
                    : "Out of Stock"
                }
            </button>


            <button
                onclick="removeFromWishlist(${productId})"
                style="
                    margin-top:8px;
                    background:#e74c3c;
                    color:white;
                "
            >
                Remove from Wishlist
            </button>

        `;


        if (stock <= 0) {

            const addButton =
                card.querySelector(
                    "button"
                );


            if (addButton) {

                addButton.style.background =
                    "#9ca3af";

                addButton.style.cursor =
                    "not-allowed";
            }
        }


        container.appendChild(card);

    });
}


// =====================================
// ADD TO CART
// =====================================

async function addWishlistProductToCart(
    productId
) {

    if (!token) {

        handleUnauthorized();

        return;
    }


    try {

        const response =
            await fetch(
                `/api/cart/add?productId=${productId}&quantity=1`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                await response.text()
            );
        }


        alert(
            "Product added to cart!"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to add product to cart."
        );
    }
}


// =====================================
// REMOVE WISHLIST
// =====================================

async function removeFromWishlist(
    productId
) {

    if (!token) {

        handleUnauthorized();

        return;
    }


    const confirmed =
        confirm(
            "Remove this product from your wishlist?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/wishlist/remove?productId=${productId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                await response.text()
            );
        }


        await loadWishlist();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to remove product from wishlist."
        );
    }
}


// =====================================
// OPEN PRODUCT
// =====================================

function openProduct(productId) {

    window.location.href =
        `/product.html?id=${productId}`;
}


// =====================================
// SEARCH
// =====================================

function searchProducts() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const keyword =
        input.value.trim();


    if (!keyword) {

        window.location.href = "/";

        return;
    }


    window.location.href =
        "/?search=" +
        encodeURIComponent(
            keyword
        );
}


function handleSearchKey(event) {

    if (event.key === "Enter") {

        searchProducts();
    }
}


// =====================================
// UNAUTHORIZED
// =====================================

function handleUnauthorized() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    alert(
        "Your login session has expired. Please login again."
    );

    window.location.href =
        "/login.html";
}


// =====================================
// HTML SECURITY
// =====================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================
// START
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadWishlist();

    }
);