document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("login-username").value;
            const password = document.getElementById("login-password").value;

            if (username === "" || password === "") {
                alert("Please fill in all fields.");
                return;
            }

            alert("Login successful!");
            // Redirect or process login
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("register-username").value;
            const password = document.getElementById("register-password").value;
            const confirmPassword = document.getElementById("confirm-password").value;

            if (username === "" || password === "" || confirmPassword === "") {
                alert("Please fill in all fields.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            alert("Registration successful!");
            // Redirect or process registration
        });
    }
});
