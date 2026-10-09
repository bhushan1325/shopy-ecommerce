const token = localStorage.getItem("token");


// =====================================
// LOAD CART
// =====================================

async function loadCart() {

    const container =
        document.getElementById("cartContainer");

    if (!container) {
        return;
    }


    if (!token) {

        container.innerHTML = `
            <div class="empty-products">

                <h3>
                    Please login first
                </h3>

                <p>
                    You need to login to view your cart.
                </p>

                <button
                    class="primary-button"
                    onclick="window.location.href='/login.html'"
                >
                    Login
                </button>

            </div>
        `;

        updateSummary(0, 0);

        return;
    }


    container.innerHTML = `
        <div class="empty-products">
            <h3>Loading cart...</h3>
        </div>
    `;


    try {

        const response =
            await fetch(
                "/api/cart",
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
                "Unable to load cart"
            );
        }


        const data =
            await response.json();


        displayCart(data);


    } catch (error) {

        console.error(error);


        container.innerHTML = `
            <div class="empty-products">

                <h3>
                    Unable to load cart
                </h3>

                <p>
                    Please try again.
                </p>

                <button
                    class="primary-button"
                    onclick="loadCart()"
                >
                    Try Again
                </button>

            </div>
        `;
    }
}


// =====================================
// DISPLAY CART
// =====================================

function displayCart(data) {

    const container =
        document.getElementById(
            "cartContainer"
        );


    if (!container) {
        return;
    }


    /*
     * The backend may return either:
     *
     * 1. An array
     * 2. { items: [...] }
     * 3. { cartItems: [...] }
     *
     * This handles all three.
     */

    let items = [];


    if (Array.isArray(data)) {

        items = data;

    } else if (
        data &&
        Array.isArray(data.items)
    ) {

        items = data.items;

    } else if (
        data &&
        Array.isArray(data.cartItems)
    ) {

        items = data.cartItems;

    }


    if (items.length === 0) {

        container.innerHTML = `
            <div class="empty-products">

                <h3>
                    Your cart is empty
                </h3>

                <p>
                    Add some products to your cart.
                </p>

                <button
                    class="primary-button"
                    onclick="continueShopping()"
                >
                    Start Shopping
                </button>

            </div>
        `;

        updateSummary(0, 0);

        return;
    }


    container.innerHTML = "";


    let totalItems = 0;

    let calculatedTotal = 0;


    items.forEach(item => {

        const product =
            item.product || {};


        const productName =
            product.name ||
            item.productName ||
            "Product";


        const price =
            Number(
                item.price ??
                product.price ??
                item.productPrice ??
                0
            );


        const quantity =
            Number(
                item.quantity || 1
            );


        const itemId =
            item.id;


        totalItems += quantity;

        calculatedTotal +=
            price * quantity;


        const cartItem =
            document.createElement("div");


        cartItem.className =
            "cart-item";


        cartItem.innerHTML = `

            <div>

                <h3>
                    ${escapeHtml(productName)}
                </h3>

                <p>
                    Price:
                    ₹${price.toLocaleString("en-IN")}
                </p>

                <p>
                    Quantity:
                    <strong>
                        ${quantity}
                    </strong>
                </p>

                <p>
                    Subtotal:
                    <strong>
                        ₹${(
                            price * quantity
                        ).toLocaleString("en-IN")}
                    </strong>
                </p>

            </div>


            <div
                style="
                    display:flex;
                    flex-direction:column;
                    gap:8px;
                    min-width:130px;
                "
            >

                <button
                    onclick="increaseQuantity(${itemId}, ${quantity})"
                    style="
                        background:#ff9900;
                        color:#111827;
                    "
                >
                    + Quantity
                </button>


                <button
                    onclick="decreaseQuantity(${itemId}, ${quantity})"
                    style="
                        background:#6b7280;
                        color:white;
                    "
                >
                    - Quantity
                </button>


                <button
                    onclick="removeCartItem(${itemId})"
                >
                    Remove
                </button>

            </div>

        `;


        container.appendChild(
            cartItem
        );

    });


    updateSummary(
        totalItems,
        calculatedTotal
    );


    // Load exact backend total
    loadBackendTotal();
}


// =====================================
// BACKEND TOTAL
// =====================================

async function loadBackendTotal() {

    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/cart/total",
                {
                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (
            data &&
            data.total !== undefined
        ) {

            const totalElement =
                document.getElementById(
                    "cartTotal"
                );


            if (totalElement) {

                totalElement.innerText =
                    "Total: ₹" +
                    Number(
                        data.total
                    ).toLocaleString(
                        "en-IN"
                    );
            }
        }


    } catch (error) {

        console.error(
            "Unable to load backend total:",
            error
        );
    }
}


// =====================================
// UPDATE SUMMARY
// =====================================

function updateSummary(
    itemCount,
    total
) {

    const countElement =
        document.getElementById(
            "cartItemCount"
        );


    const totalElement =
        document.getElementById(
            "cartTotal"
        );


    if (countElement) {

        countElement.innerText =
            "Items: " + itemCount;
    }


    if (totalElement) {

        totalElement.innerText =
            "Total: ₹" +
            Number(
                total
            ).toLocaleString(
                "en-IN"
            );
    }
}


// =====================================
// INCREASE QUANTITY
// =====================================

async function increaseQuantity(
    cartItemId,
    currentQuantity
) {

    await updateQuantity(
        cartItemId,
        currentQuantity + 1
    );
}


// =====================================
// DECREASE QUANTITY
// =====================================

async function decreaseQuantity(
    cartItemId,
    currentQuantity
) {

    if (currentQuantity <= 1) {

        const remove =
            confirm(
                "Quantity is already 1. Remove this item?"
            );


        if (remove) {

            await removeCartItem(
                cartItemId
            );
        }


        return;
    }


    await updateQuantity(
        cartItemId,
        currentQuantity - 1
    );
}


// =====================================
// UPDATE QUANTITY
// =====================================

async function updateQuantity(
    cartItemId,
    quantity
) {

    if (!token) {

        handleUnauthorized();

        return;
    }


    try {

        const response =
            await fetch(
                `/api/cart/${cartItemId}?quantity=${quantity}`,
                {
                    method: "PUT",

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

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Unable to update quantity"
            );
        }


        await loadCart();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to update cart quantity."
        );
    }
}


// =====================================
// REMOVE CART ITEM
// =====================================

async function removeCartItem(
    cartItemId
) {

    if (!token) {

        handleUnauthorized();

        return;
    }


    const confirmed =
        confirm(
            "Remove this product from your cart?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/cart/${cartItemId}`,
                {
                    method: "DELETE",

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

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Unable to remove item"
            );
        }


        await loadCart();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to remove product."
        );
    }
}


// =====================================
// CHECKOUT
// =====================================

function goToCheckout() {

    if (!token) {

        alert(
            "Please login before checkout."
        );

        window.location.href =
            "/login.html";

        return;
    }


    window.location.href =
        "/checkout.html";
}


// =====================================
// CONTINUE SHOPPING
// =====================================

function continueShopping() {

    window.location.href = "/";
}


// =====================================
// SEARCH FROM CART
// =====================================

function goToSearch() {

    const input =
        document.getElementById(
            "cartSearchInput"
        );


    const keyword =
        input
            ? input.value.trim()
            : "";


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


// =====================================
// SEARCH ENTER KEY
// =====================================

function handleCartSearch(event) {

    if (event.key === "Enter") {

        goToSearch();
    }
}


// =====================================
// UNAUTHORIZED
// =====================================

function handleUnauthorized() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );


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
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// =====================================
// PAGE START
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCart();

    }
);