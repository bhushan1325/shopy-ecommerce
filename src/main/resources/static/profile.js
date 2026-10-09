const token = localStorage.getItem("token");

if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
}

const API_BASE = "";

document.addEventListener("DOMContentLoaded", () => {

    loadProfile();
    loadAddresses();

    const profileForm =
        document.getElementById("profileForm");

    const addressForm =
        document.getElementById("addressForm");

    const addAddressBtn =
        document.getElementById("addAddressBtn");

    const cancelAddressBtn =
        document.getElementById("cancelAddressBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");


    if (profileForm) {
        profileForm.addEventListener(
            "submit",
            updateProfile
        );
    }

    if (addressForm) {
        addressForm.addEventListener(
            "submit",
            saveAddress
        );
    }

    if (addAddressBtn) {
        addAddressBtn.addEventListener(
            "click",
            showAddAddressForm
        );
    }

    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener(
            "click",
            hideAddressForm
        );
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            logout
        );
    }
});


async function loadProfile() {

    try {

        const response = await fetch(
            `${API_BASE}/api/users/profile`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(
                "Unable to load profile"
            );
        }

        const user = await response.json();

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        displayUser(user);

    } catch (error) {

        console.error(error);

        const savedUser =
            localStorage.getItem("user");

        if (savedUser) {
            displayUser(
                JSON.parse(savedUser)
            );
        }
    }
}


function displayUser(user) {

    document.getElementById("name").value =
        user.name || "";

    document.getElementById("username").value =
        user.username || "";

    document.getElementById("email").value =
        user.email || "";
}


async function updateProfile(event) {

    event.preventDefault();

    const name =
        document.getElementById("name").value.trim();

    const email =
        document.getElementById("email").value.trim();


    if (!name || !email) {
        alert("Please fill all fields.");
        return;
    }


    try {

        const response = await fetch(
            `${API_BASE}/api/users/profile`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    name: name,
                    email: email
                })
            }
        );


        if (response.status === 401) {
            handleUnauthorized();
            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to update profile."
            );

            return;
        }


        localStorage.setItem(
            "user",
            JSON.stringify(data)
        );

        displayUser(data);

        alert(
            "Profile updated successfully!"
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to server."
        );
    }
}


/* =========================
   ADDRESS MANAGEMENT
========================= */


async function loadAddresses() {

    const addressList =
        document.getElementById("addressList");

    try {

        const response = await fetch(
            `${API_BASE}/api/addresses`,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {
            handleUnauthorized();
            return;
        }


        if (!response.ok) {
            throw new Error(
                "Unable to load addresses"
            );
        }


        const addresses =
            await response.json();


        if (!addresses ||
            addresses.length === 0) {

            addressList.innerHTML = `
                <p>No saved addresses yet.</p>
            `;

            return;
        }


        addressList.innerHTML =
            addresses.map(address => `

                <div class="address-card">

                    <strong>
                        ${escapeHtml(
                            address.fullName || ""
                        )}
                    </strong>

                    <div>
                        ${escapeHtml(
                            address.phone || ""
                        )}
                    </div>

                    <div>
                        ${escapeHtml(
                            address.addressLine || ""
                        )}
                    </div>

                    <div>
                        ${escapeHtml(
                            address.city || ""
                        )},
                        ${escapeHtml(
                            address.state || ""
                        )}
                        -
                        ${escapeHtml(
                            address.postalCode || ""
                        )}
                    </div>

                    <div>
                        ${escapeHtml(
                            address.country || ""
                        )}
                    </div>

                    <div class="address-actions">

                        <button
                            type="button"
                            class="profile-btn"
                            onclick="editAddress(${address.id})">

                            Edit

                        </button>

                        <button
                            type="button"
                            class="profile-btn danger-btn"
                            onclick="deleteAddress(${address.id})">

                            Delete

                        </button>

                    </div>

                </div>

            `).join("");


    } catch (error) {

        console.error(error);

        addressList.innerHTML = `
            <p>
                Unable to load addresses.
            </p>
        `;
    }
}


function showAddAddressForm() {

    document.getElementById(
        "addressFormContainer"
    ).classList.remove("hidden");

    document.getElementById(
        "addressFormTitle"
    ).textContent = "Add Address";

    document.getElementById(
        "addressForm"
    ).reset();

    document.getElementById(
        "addressId"
    ).value = "";

    document.getElementById(
        "addressCountry"
    ).value = "India";
}


function hideAddressForm() {

    document.getElementById(
        "addressFormContainer"
    ).classList.add("hidden");
}


async function editAddress(id) {

    try {

        const response = await fetch(
            `${API_BASE}/api/addresses/${id}`,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {
            handleUnauthorized();
            return;
        }


        const address =
            await response.json();


        if (!response.ok) {

            alert(
                address.message ||
                "Unable to load address."
            );

            return;
        }


        document.getElementById(
            "addressFormContainer"
        ).classList.remove("hidden");


        document.getElementById(
            "addressFormTitle"
        ).textContent =
            "Edit Address";


        document.getElementById(
            "addressId"
        ).value =
            address.id || "";


        document.getElementById(
            "addressFullName"
        ).value =
            address.fullName || "";


        document.getElementById(
            "addressPhone"
        ).value =
            address.phone || "";


        document.getElementById(
            "addressLine"
        ).value =
            address.addressLine || "";


        document.getElementById(
            "addressCity"
        ).value =
            address.city || "";


        document.getElementById(
            "addressState"
        ).value =
            address.state || "";


        document.getElementById(
            "addressPostalCode"
        ).value =
            address.postalCode || "";


        document.getElementById(
            "addressCountry"
        ).value =
            address.country || "India";


    } catch (error) {

        console.error(error);

        alert(
            "Unable to load address."
        );
    }
}


async function saveAddress(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "addressId"
        ).value;


    const address = {

        fullName:
            document.getElementById(
                "addressFullName"
            ).value.trim(),

        phone:
            document.getElementById(
                "addressPhone"
            ).value.trim(),

        addressLine:
            document.getElementById(
                "addressLine"
            ).value.trim(),

        city:
            document.getElementById(
                "addressCity"
            ).value.trim(),

        state:
            document.getElementById(
                "addressState"
            ).value.trim(),

        postalCode:
            document.getElementById(
                "addressPostalCode"
            ).value.trim(),

        country:
            document.getElementById(
                "addressCountry"
            ).value.trim()
    };


    try {

        const url = id
            ? `${API_BASE}/api/addresses/${id}`
            : `${API_BASE}/api/addresses`;


        const method = id
            ? "PUT"
            : "POST";


        const response = await fetch(
            url,
            {
                method: method,

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                },

                body: JSON.stringify(address)
            }
        );


        if (response.status === 401) {
            handleUnauthorized();
            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to save address."
            );

            return;
        }


        alert(
            id
                ? "Address updated successfully!"
                : "Address added successfully!"
        );


        hideAddressForm();

        loadAddresses();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to server."
        );
    }
}


async function deleteAddress(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this address?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_BASE}/api/addresses/${id}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {
            handleUnauthorized();
            return;
        }


        if (!response.ok) {

            const data =
                await response.json();

            alert(
                data.message ||
                "Unable to delete address."
            );

            return;
        }


        alert(
            "Address deleted successfully!"
        );

        loadAddresses();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to server."
        );
    }
}


/* =========================
   LOGOUT
========================= */


function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentOrderId");
    localStorage.removeItem("lastPayment");

    window.location.href =
        "login.html";
}


/* =========================
   AUTH
========================= */


function handleUnauthorized() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert(
        "Your session has expired. Please login again."
    );

    window.location.href =
        "login.html";
}


/* =========================
   SECURITY
========================= */


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}