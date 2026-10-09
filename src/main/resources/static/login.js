document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            if (!username || !password) {

                alert(
                    "Please enter username and password."
                );

                return;
            }


            const submitButton =
                event.target.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerText =
                    "Logging in...";
            }


            try {

                const response =
                    await fetch(
                        "/api/users/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                username: username,
                                password: password
                            })
                        }
                    );


                let data = {};

                try {

                    data =
                        await response.json();

                } catch (error) {

                    console.error(
                        "Invalid server response",
                        error
                    );
                }


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Invalid username or password."
                    );

                    return;
                }


                if (!data.token) {

                    alert(
                        "Login failed: server did not return a token."
                    );

                    return;
                }


                // ==========================
                // SAVE JWT TOKEN
                // ==========================

                localStorage.setItem(
                    "token",
                    data.token
                );


                // ==========================
                // SAVE USER INFORMATION
                // ==========================

                if (data.user) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );

                }


                // ==========================
                // VERIFY TOKEN
                // ==========================

                const savedToken =
                    localStorage.getItem(
                        "token"
                    );


                if (!savedToken) {

                    alert(
                        "Login succeeded, but the login session could not be saved."
                    );

                    return;
                }


                alert(
                    "Login successful!"
                );


                // ==========================
                // RETURN TO HOME
                // ==========================

                window.location.replace("/");


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                alert(
                    "Unable to connect to Shopora. Make sure the Spring Boot server is running."
                );


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerText =
                        "Login";
                }

            }

        }
    );