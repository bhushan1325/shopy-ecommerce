const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);

// First try URL orderId
let orderId = params.get("orderId");

// If URL does not contain orderId, use saved active order
if (!orderId) {
    orderId = localStorage.getItem("activeOrderId");
}


// =====================================
// CHECK LOGIN
// =====================================

if (!token) {

    alert("Please login to track your order.");

    window.location.href = "/login.html";
}


// =====================================
// CHECK ORDER ID
// =====================================

if (!orderId) {

    alert("No active order found.");

    window.location.href = "/orders.html";
}


// =====================================
// LOAD TRACKING
// =====================================

async function loadTracking() {

    const container =
        document.getElementById("trackingContainer");

    try {

        const response =
            await fetch(
                `/api/orders/${orderId}/tracking`,
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


        if (response.status === 403) {

            container.innerHTML = `

                <h2>
                    Access denied
                </h2>

                <p>
                    You cannot view this order.
                </p>

            `;

            return;
        }


        if (response.status === 404) {

            container.innerHTML = `

                <div class="empty-products">

                    <h3>
                        Order not found
                    </h3>

                    <p>
                        This order does not exist or does not belong to your account.
                    </p>

                    <button
                        class="primary-button"
                        onclick="window.location.href='/orders.html'"
                    >
                        My Orders
                    </button>

                </div>

            `;

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Tracking information unavailable"
            );
        }


        const data =
            await response.json();


        displayTracking(data);


    } catch (error) {

        console.error(
            "Tracking error:",
            error
        );


        container.innerHTML = `

            <div class="empty-products">

                <h3>
                    Unable to load tracking
                </h3>

                <p>
                    Please try again later.
                </p>

                <button
                    class="primary-button"
                    onclick="loadTracking()"
                >
                    Try Again
                </button>

            </div>

        `;
    }
}


// =====================================
// DISPLAY TRACKING
// =====================================

function displayTracking(data) {

    const container =
        document.getElementById("trackingContainer");


    const status =
        String(
            data.status || "PLACED"
        ).toUpperCase();


    const message =
        data.message ||
        getDefaultMessage(status);


    const steps = [
        "PLACED",
        "CONFIRMED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED"
    ];


    const currentIndex =
        getStatusIndex(status);


    container.innerHTML = `

        <h2>
            Order #${escapeHtml(orderId)}
        </h2>


        <p
            style="
                margin-top:10px;
                color:#6b7280;
            "
        >
            ${escapeHtml(message)}
        </p>


        <div
            style="
                margin-top:35px;
            "
        >

            ${steps.map(
                (step, index) => {

                    const completed =
                        index <= currentIndex;


                    return `

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                margin-bottom:25px;
                            "
                        >

                            <div
                                style="
                                    width:38px;
                                    height:38px;
                                    border-radius:50%;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    background:${
                                        completed
                                            ? "#16803c"
                                            : "#d1d5db"
                                    };
                                    color:white;
                                    font-weight:bold;
                                    flex-shrink:0;
                                "
                            >
                                ${
                                    completed
                                        ? "✓"
                                        : index + 1
                                }
                            </div>


                            <div
                                style="
                                    margin-left:15px;
                                "
                            >

                                <strong>
                                    ${escapeHtml(
                                        formatStepName(step)
                                    )}
                                </strong>

                                <p
                                    style="
                                        color:#6b7280;
                                        margin-top:4px;
                                    "
                                >
                                    ${escapeHtml(
                                        getStepMessage(step)
                                    )}
                                </p>

                            </div>

                        </div>

                    `;

                }
            ).join("")}

        </div>


        <div
            style="
                margin-top:25px;
                padding:18px;
                background:#f3f4f6;
                border-radius:8px;
            "
        >

            <strong>
                Current Status:
            </strong>

            <span
                style="
                    color:#16803c;
                    font-weight:bold;
                    margin-left:5px;
                "
            >
                ${escapeHtml(formatStepName(status))}
            </span>

        </div>


        <div
            style="
                margin-top:25px;
                display:flex;
                gap:10px;
                flex-wrap:wrap;
            "
        >

            <button
                class="primary-button"
                onclick="window.location.href='/orders.html'"
            >
                My Orders
            </button>


            <button
                onclick="window.location.href='/'"
                style="
                    padding:11px 20px;
                    background:white;
                    border:1px solid #d1d5db;
                    border-radius:6px;
                    cursor:pointer;
                "
            >
                Continue Shopping
            </button>

        </div>

    `;
}


// =====================================
// STATUS INDEX
// =====================================

function getStatusIndex(status) {

    switch (status) {

        case "PLACED":
        case "CREATED":
            return 0;

        case "CONFIRMED":
            return 1;

        case "SHIPPED":
            return 2;

        case "OUT_FOR_DELIVERY":
            return 3;

        case "DELIVERED":
            return 4;

        default:
            return 0;
    }
}


// =====================================
// STATUS MESSAGE
// =====================================

function getDefaultMessage(status) {

    switch (status) {

        case "CONFIRMED":
            return "Your payment has been confirmed and your order is being prepared.";

        case "SHIPPED":
            return "Your order has been shipped.";

        case "OUT_FOR_DELIVERY":
            return "Your order is out for delivery.";

        case "DELIVERED":
            return "Your order has been delivered.";

        case "CANCELLED":
            return "Your order has been cancelled.";

        default:
            return "Your order has been placed successfully.";
    }
}


// =====================================
// STEP MESSAGE
// =====================================

function getStepMessage(step) {

    switch (step) {

        case "PLACED":
            return "Order received.";

        case "CONFIRMED":
            return "Payment confirmed.";

        case "SHIPPED":
            return "Package is on its way.";

        case "OUT_FOR_DELIVERY":
            return "Package is out for delivery.";

        case "DELIVERED":
            return "Package delivered.";

        default:
            return "";
    }
}


// =====================================
// FORMAT STATUS
// =====================================

function formatStepName(step) {

    return String(step)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            character => character.toUpperCase()
        );
}


// =====================================
// UNAUTHORIZED
// =====================================

function handleUnauthorized() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem("activeOrderId");

    alert(
        "Your login session has expired. Please login again."
    );

    window.location.href =
        "/login.html";
}


// =====================================
// ESCAPE HTML
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

        loadTracking();

    }
);