const token = localStorage.getItem("token");


// =====================================================
// CHECK LOGIN
// =====================================================

if (!token) {

    alert("Please login to view your orders.");

    window.location.href = "/login.html";
}


// =====================================================
// LOAD ORDERS
// =====================================================

async function loadOrders() {

    const container =
        document.getElementById("ordersContainer");


    try {

        const response =
            await fetch(
                "/api/orders/user",
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


        displayOrders(orders);


    } catch (error) {

        console.error(
            "Orders error:",
            error
        );


        container.innerHTML = `

            <div class="orders-error">

                <h3>
                    Unable to load orders
                </h3>

                <p>
                    Something went wrong while loading your orders.
                </p>

                <button
                    class="order-button track-button"
                    onclick="loadOrders()"
                >
                    Try Again
                </button>

            </div>

        `;
    }
}


// =====================================================
// DISPLAY ORDERS
// =====================================================

function displayOrders(orders) {

    const container =
        document.getElementById(
            "ordersContainer"
        );


    container.innerHTML = "";


    if (
        !orders ||
        orders.length === 0
    ) {

        container.innerHTML = `

            <div class="orders-empty">

                <div class="empty-icon">
                    🛍
                </div>

                <h3>
                    No orders yet
                </h3>

                <p>
                    You haven't placed any orders yet.
                </p>

                <button
                    class="order-button track-button"
                    onclick="continueShopping()"
                >
                    Start Shopping
                </button>

            </div>

        `;

        return;
    }


    orders.forEach(order => {

        const card =
            document.createElement("article");


        card.className =
            "order-card";


        const amount =
            Number(
                order.totalAmount ??
                order.total ??
                0
            );


        const status =
            String(
                order.status ||
                "PLACED"
            ).toUpperCase();


        const date =
            formatDate(
                order.createdAt ||
                order.orderDate ||
                order.date
            );


        const statusClass =
            getStatusClass(status);


        const deliveryCity =
            order.address &&
            order.address.city
                ? escapeHtml(
                    order.address.city
                )
                : "Address on file";


        card.innerHTML = `

            <div class="order-card-header">

                <div class="order-id-block">

                    <div class="order-label">
                        Order
                    </div>

                    <h2 class="order-id">
                        #${escapeHtml(order.id)}
                    </h2>

                    <div class="order-date">
                        ${escapeHtml(date)}
                    </div>

                </div>


                <span
                    class="order-status ${statusClass}"
                >
                    ${escapeHtml(status)}
                </span>

            </div>


            <div class="order-card-body">

                <div class="order-info-grid">

                    <div class="order-info-item">

                        <div class="order-info-label">
                            Order total
                        </div>

                        <div class="order-total">
                            ₹${amount.toLocaleString("en-IN")}
                        </div>

                    </div>


                    <div class="order-info-item">

                        <div class="order-info-label">
                            Delivery
                        </div>

                        <div class="order-delivery">
                            ${deliveryCity}
                        </div>

                    </div>

                </div>


                <div class="order-actions">

                    <button
                        class="order-button track-button"
                        onclick="trackOrder(${order.id})"
                    >
                        Track Order
                    </button>


                    <button
                        class="order-button items-button"
                        onclick="viewOrderItems(${order.id})"
                    >
                        View Items
                    </button>

                </div>

            </div>

        `;


        container.appendChild(card);

    });
}


// =====================================================
// TRACK ORDER
// =====================================================

function trackOrder(orderId) {

    localStorage.setItem(
        "activeOrderId",
        orderId
    );


    window.location.href =
        `/tracking.html?orderId=${orderId}`;
}


// =====================================================
// VIEW ORDER ITEMS
// =====================================================

function viewOrderItems(orderId) {

    localStorage.setItem(
        "activeOrderId",
        orderId
    );


    window.location.href =
        `/tracking.html?orderId=${orderId}`;
}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(status) {

    switch (
        String(status).toUpperCase()
    ) {

        case "CONFIRMED":
            return "status-confirmed";

        case "SHIPPED":
            return "status-shipped";

        case "DELIVERED":
            return "status-delivered";

        case "CANCELLED":
            return "status-cancelled";

        case "PLACED":
        case "CREATED":
        default:
            return "status-placed";
    }
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "Date unavailable";
    }


    try {

        return new Date(
            dateValue
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch (error) {

        return "Date unavailable";
    }
}


// =====================================================
// CONTINUE SHOPPING
// =====================================================

function continueShopping() {

    window.location.href = "/";
}


// =====================================================
// UNAUTHORIZED
// =====================================================

function handleUnauthorized() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem(
        "activeOrderId"
    );


    alert(
        "Your login session has expired. Please login again."
    );


    window.location.href =
        "/login.html";
}


// =====================================================
// ESCAPE HTML
// =====================================================

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


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadOrders();

    }
);