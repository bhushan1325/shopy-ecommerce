// =====================================
// SHOPORA ORDER SUCCESS
// =====================================


// =====================================
// LOGIN
// =====================================

const token =
    localStorage.getItem("token");


// =====================================
// GET ORDER ID
// =====================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


let orderId =
    urlParams.get("orderId");


if (!orderId) {

    orderId =
        localStorage.getItem(
            "currentOrderId"
        );
}


// Keep order ID available.

if (orderId) {

    localStorage.setItem(
        "currentOrderId",
        String(orderId)
    );
}


// =====================================
// LAST PAYMENT
// =====================================

const lastPayment =
    JSON.parse(
        localStorage.getItem(
            "lastPayment"
        ) || "null"
    );


// =====================================
// CHECK LOGIN
// =====================================

if (!token) {

    window.location.href =
        "/login.html";
}


// =====================================
// LOAD ORDER DETAILS
// =====================================

async function loadOrderDetails() {

    const container =
        document.getElementById(
            "orderDetails"
        );


    if (!container) {
        return;
    }


    if (!orderId) {

        container.innerHTML = `
            <p>
                Order information is unavailable.
            </p>
        `;

        return;
    }


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


        if (order) {

            displayOrder(order);

        } else {

            displayPaymentOnly();
        }


    } catch (error) {

        console.error(
            "Order details error:",
            error
        );


        displayPaymentOnly();
    }
}


// =====================================
// DISPLAY ORDER
// =====================================

function displayOrder(order) {

    const container =
        document.getElementById(
            "orderDetails"
        );


    if (!container) {
        return;
    }


    const payment =
        lastPayment;


    const amount =
        Number(
            order?.totalAmount ??
            order?.total ??
            payment?.amount ??
            0
        );


    const status =
        order?.status ||
        "PLACED";


    const transactionId =
        payment?.transactionId ||
        "Completed";


    const paymentMethod =
        payment?.method ||
        "Completed";


    container.innerHTML = `

        <div
            style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                margin-bottom:12px;
            "
        >

            <strong>
                Order ID
            </strong>

            <span>
                #${orderId}
            </span>

        </div>


        <div
            style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                margin-bottom:12px;
            "
        >

            <strong>
                Amount
            </strong>

            <span>
                ₹${amount.toLocaleString("en-IN")}
            </span>

        </div>


        <div
            style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                margin-bottom:12px;
            "
        >

            <strong>
                Payment
            </strong>

            <span>
                ${paymentMethod}
            </span>

        </div>


        <div
            style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                margin-bottom:12px;
            "
        >

            <strong>
                Transaction ID
            </strong>

            <span>
                ${transactionId}
            </span>

        </div>


        <div
            style="
                display:flex;
                justify-content:space-between;
                gap:15px;
            "
        >

            <strong>
                Status
            </strong>

            <span
                style="
                    color:#16803c;
                    font-weight:bold;
                "
            >
                ${status}
            </span>

        </div>

    `;
}


// =====================================
// PAYMENT-ONLY FALLBACK
// =====================================

function displayPaymentOnly() {

    const container =
        document.getElementById(
            "orderDetails"
        );


    if (!container) {
        return;
    }


    if (!lastPayment) {

        container.innerHTML = `

            <p>
                <strong>
                    Order ID:
                </strong>

                #${orderId}
            </p>

            <p
                style="
                    margin-top:10px;
                    color:#16803c;
                    font-weight:bold;
                "
            >
                Order created successfully.
            </p>

        `;

        return;
    }


    const amount =
        Number(
            lastPayment.amount || 0
        );


    container.innerHTML = `

        <p>

            <strong>
                Order ID:
            </strong>

            #${orderId}

        </p>


        <p style="margin-top:10px;">

            <strong>
                Amount:
            </strong>

            ₹${amount.toLocaleString("en-IN")}

        </p>


        <p style="margin-top:10px;">

            <strong>
                Payment:
            </strong>

            ${lastPayment.method || "Completed"}

        </p>


        <p style="margin-top:10px;">

            <strong>
                Transaction ID:
            </strong>

            ${lastPayment.transactionId || "Completed"}

        </p>


        <p
            style="
                margin-top:10px;
                color:#16803c;
                font-weight:bold;
            "
        >
            Payment successful
        </p>

    `;
}


// =====================================
// TRACK ORDER
// =====================================

function trackOrder() {

    if (!orderId) {

        alert(
            "Order ID is unavailable."
        );

        return;
    }


    window.location.href =
        `/tracking.html?orderId=${orderId}`;
}


// =====================================
// MY ORDERS
// =====================================

function viewOrders() {

    window.location.href =
        "/orders.html";
}


// =====================================
// CONTINUE SHOPPING
// =====================================

function continueShopping() {

    window.location.href =
        "/";
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

        loadOrderDetails();

    }
);