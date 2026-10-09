// =====================================
// SHOPORA PAYMENT
// =====================================


// =====================================
// GET TOKEN
// =====================================

const token =
    localStorage.getItem("token");


// =====================================
// GET ORDER ID
// =====================================

// First try URL
const urlParams =
    new URLSearchParams(
        window.location.search
    );


// Get orderId from:
// /payment.html?orderId=7

let orderId =
    urlParams.get("orderId");


// If URL does not contain orderId,
// use localStorage as backup.

if (!orderId) {

    orderId =
        localStorage.getItem(
            "currentOrderId"
        );
}


// Save it for the success page.

if (orderId) {

    localStorage.setItem(
        "currentOrderId",
        String(orderId)
    );
}


// =====================================
// CHECK LOGIN
// =====================================

if (!token) {

    alert(
        "Please login first."
    );

    window.location.href =
        "/login.html";
}


// =====================================
// CHECK ORDER
// =====================================

if (!orderId) {

    alert(
        "No active order found."
    );

    window.location.href =
        "/orders.html";
}


// =====================================
// LOAD ORDER
// =====================================

async function loadOrder() {

    try {

        const response =
            await fetch(
                "/api/orders/user",
                {
                    method: "GET",

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
                "Unable to load orders"
            );
        }


        const data =
            await response.json();


        const orders =
            Array.isArray(data)
                ? data
                : (
                    data.content ||
                    data.orders ||
                    []
                );


        const order =
            orders.find(
                item =>
                    Number(item.id) ===
                    Number(orderId)
            );


        if (!order) {

            throw new Error(
                "Order not found"
            );
        }


        displayOrder(order);


    } catch (error) {

        console.error(
            "Load order error:",
            error
        );


        const orderIdElement =
            document.getElementById(
                "orderId"
            );


        const amountElement =
            document.getElementById(
                "paymentAmount"
            );


        if (orderIdElement) {

            orderIdElement.innerText =
                "Order ID: #" + orderId;
        }


        if (amountElement) {

            amountElement.innerText =
                "Amount: Unable to load";
        }


        alert(
            "Unable to load this order. Please check My Orders."
        );
    }
}


// =====================================
// DISPLAY ORDER
// =====================================

function displayOrder(order) {

    const orderIdElement =
        document.getElementById(
            "orderId"
        );


    const amountElement =
        document.getElementById(
            "paymentAmount"
        );


    if (orderIdElement) {

        orderIdElement.innerText =
            "Order ID: #" +
            order.id;
    }


    const amount =
        Number(
            order.totalAmount ??
            order.total ??
            0
        );


    if (
        amountElement &&
        !Number.isNaN(amount)
    ) {

        amountElement.innerText =
            "Amount: ₹" +
            amount.toLocaleString(
                "en-IN"
            );
    }
}


// =====================================
// MAKE PAYMENT
// =====================================

async function makePayment(event) {

    event.preventDefault();


    if (!token) {

        handleUnauthorized();

        return;
    }


    if (!orderId) {

        alert(
            "Order information is missing."
        );

        return;
    }


    const selectedMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    if (!selectedMethod) {

        alert(
            "Please select a payment method."
        );

        return;
    }


    const method =
        selectedMethod.value;


    const button =
        document.getElementById(
            "payButton"
        );


    if (button) {

        button.disabled = true;

        button.innerText =
            "Processing Payment...";
    }


    try {

        const response =
            await fetch(
                "/api/payments",
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body: JSON.stringify({

                        orderId:
                            Number(orderId),

                        method:
                            method

                    })
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
                "Payment failed"
            );
        }


        const payment =
            await response.json();


        // =====================================
        // SAVE PAYMENT
        // =====================================

        localStorage.setItem(
            "lastPayment",
            JSON.stringify(payment)
        );


        // =====================================
        // KEEP ORDER ID
        // =====================================

        localStorage.setItem(
            "currentOrderId",
            String(orderId)
        );


        // =====================================
        // SUCCESS PAGE
        // =====================================

        window.location.href =
            `/order-success.html?orderId=${orderId}`;


    } catch (error) {

        console.error(
            "Payment error:",
            error
        );


        alert(
            "Payment failed:\n" +
            error.message
        );


        if (button) {

            button.disabled = false;

            button.innerText =
                "Pay Now";
        }
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
                "paymentForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                makePayment
            );
        }


        loadOrder();

    }
);