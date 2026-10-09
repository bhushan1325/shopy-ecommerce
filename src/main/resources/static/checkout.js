// =====================================
// SHOPORA CHECKOUT
// =====================================

function getToken() {
    return localStorage.getItem("token");
}

let cartItems = [];
let cartTotal = 0;


// =====================================
// LOAD CART
// =====================================

async function loadCheckoutCart() {

    const token = getToken();

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {

        const itemsResponse = await fetch(
            "/api/cart/items",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (itemsResponse.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!itemsResponse.ok) {
            throw new Error("Unable to load cart items");
        }

        cartItems = await itemsResponse.json();


        const totalResponse = await fetch(
            "/api/cart/total",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (totalResponse.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!totalResponse.ok) {
            throw new Error("Unable to load cart total");
        }

        const totalData = await totalResponse.json();

        cartTotal = Number(totalData.total || 0);

        updateCheckoutSummary();

    } catch (error) {

        console.error(
            "Checkout cart error:",
            error
        );

        const countElement =
            document.getElementById("checkoutItemCount");

        const totalElement =
            document.getElementById("checkoutTotal");

        if (countElement) {
            countElement.textContent = "Items: 0";
        }

        if (totalElement) {
            totalElement.textContent = "Total: ₹0";
        }

        disablePlaceOrder();

        alert(
            "Unable to load your cart. Please return to the cart page."
        );
    }
}


// =====================================
// UPDATE CHECKOUT SUMMARY
// =====================================

function updateCheckoutSummary() {

    const itemCount =
        cartItems.reduce(
            (total, item) =>
                total + Number(item.quantity || 0),
            0
        );

    const countElement =
        document.getElementById("checkoutItemCount");

    const totalElement =
        document.getElementById("checkoutTotal");

    if (countElement) {
        countElement.textContent =
            "Items: " + itemCount;
    }

    if (totalElement) {
        totalElement.textContent =
            "Total: ₹" +
            cartTotal.toLocaleString("en-IN");
    }

    if (itemCount <= 0) {
        disablePlaceOrder();
    } else {
        enablePlaceOrder();
    }
}


// =====================================
// ENABLE PLACE ORDER
// =====================================

function enablePlaceOrder() {

    const button =
        document.getElementById("placeOrderButton");

    if (!button) return;

    button.disabled = false;
    button.textContent = "Place Order";
}


// =====================================
// DISABLE PLACE ORDER
// =====================================

function disablePlaceOrder() {

    const button =
        document.getElementById("placeOrderButton");

    if (!button) return;

    button.disabled = true;
    button.textContent = "Cart is Empty";
}


// =====================================
// PLACE ORDER
// =====================================

async function placeOrder(event) {

    if (event) {
        event.preventDefault();
    }

    const token = getToken();

    if (!token) {

        alert("Please login first.");

        window.location.href =
            "/login.html";

        return;
    }


    if (
        !Array.isArray(cartItems) ||
        cartItems.length === 0
    ) {

        alert("Your cart is empty.");

        return;
    }


    const fullName =
        document.getElementById("fullName").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const addressLine =
        document.getElementById("addressLine").value.trim();

    const city =
        document.getElementById("city").value.trim();

    const state =
        document.getElementById("state").value.trim();

    const postalCode =
        document.getElementById("postalCode").value.trim();

    const country =
        document.getElementById("country").value.trim();


    // =====================================
    // VALIDATION
    // =====================================

    if (!fullName) {
        alert("Please enter your full name.");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    if (!addressLine) {
        alert("Please enter your address.");
        return;
    }

    if (!city) {
        alert("Please enter your city.");
        return;
    }

    if (!state) {
        alert("Please enter your state.");
        return;
    }

    if (!/^[0-9]{6}$/.test(postalCode)) {
        alert("Please enter a valid 6-digit postal code.");
        return;
    }

    if (!country) {
        alert("Please enter your country.");
        return;
    }


    const button =
        document.getElementById("placeOrderButton");

    if (button) {

        button.disabled = true;

        button.textContent =
            "Processing...";
    }


    try {

        // =====================================
        // SAVE ADDRESS
        // =====================================

        const addressResponse =
            await fetch(
                "/api/addresses",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body: JSON.stringify({
                        fullName,
                        phone,
                        addressLine,
                        city,
                        state,
                        postalCode,
                        country
                    })
                }
            );


        if (addressResponse.status === 401) {

            handleUnauthorized();

            return;
        }


        if (!addressResponse.ok) {

            const errorText =
                await addressResponse.text();

            throw new Error(
                errorText ||
                "Unable to save address."
            );
        }


        const address =
            await addressResponse.json();


        const addressId =
            address.id;


        if (!addressId) {

            throw new Error(
                "Address was saved but no address ID was returned."
            );
        }


        // =====================================
        // CREATE ORDER
        // =====================================

        const orderResponse =
            await fetch(
                `/api/orders/create?addressId=${addressId}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (orderResponse.status === 401) {

            handleUnauthorized();

            return;
        }


        if (!orderResponse.ok) {

            const errorText =
                await orderResponse.text();

            throw new Error(
                errorText ||
                "Unable to create order."
            );
        }


        const order =
            await orderResponse.json();


        const orderId =
            order.id ||
            order.orderId;


        if (!orderId) {

            throw new Error(
                "Order was created but no order ID was returned."
            );
        }


        // =====================================
        // IMPORTANT:
        // SAVE CURRENT ORDER ID
        // =====================================

        localStorage.setItem(
            "currentOrderId",
            String(orderId)
        );


        // =====================================
        // GO TO PAYMENT
        // =====================================

        window.location.href =
            `/payment.html?orderId=${orderId}`;


    } catch (error) {

        console.error(
            "Place order error:",
            error
        );


        alert(
            error.message ||
            "Unable to place order."
        );


        enablePlaceOrder();
    }
}


// =====================================
// UNAUTHORIZED
// =====================================

function handleUnauthorized() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem(
        "currentOrderId"
    );

    alert(
        "Your login session has expired. Please login again."
    );

    window.location.href =
        "/login.html";
}


// =====================================
// PAGE START
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById(
                "checkoutForm"
            );

        if (form) {

            form.addEventListener(
                "submit",
                placeOrder
            );
        }

        loadCheckoutCart();
    }
);