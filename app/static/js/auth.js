"use strict";


/* =========================================================
   CUSTOMER INTELLIGENCE PLATFORM
   AUTHENTICATION JAVASCRIPT
   Login + Register
========================================================= */


/* =========================================================
   1. DOM HELPERS
========================================================= */

function getElement(id) {

    return document.getElementById(
        id
    );
}


function setInputState(
    input,
    state
) {

    if (!input) {
        return;
    }


    input.classList.remove(
        "is-valid",
        "is-invalid"
    );


    if (
        state ===
        "valid"
    ) {

        input.classList.add(
            "is-valid"
        );
    }


    if (
        state ===
        "invalid"
    ) {

        input.classList.add(
            "is-invalid"
        );
    }
}


/* =========================================================
   2. PASSWORD VISIBILITY
========================================================= */

function initializePasswordToggles() {

    const passwordToggleButtons =
        document.querySelectorAll(
            "[data-password-target]"
        );


    passwordToggleButtons
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const targetId =
                            button.dataset
                                .passwordTarget;


                        const input =
                            getElement(
                                targetId
                            );


                        if (!input) {
                            return;
                        }


                        const showPassword =
                            input.type ===
                            "password";


                        input.type =
                            showPassword
                                ? "text"
                                : "password";


                        button.setAttribute(
                            "aria-pressed",
                            String(
                                showPassword
                            )
                        );


                        button.setAttribute(
                            "aria-label",
                            showPassword
                                ? "Parolayı gizle"
                                : "Parolayı göster"
                        );


                        const icon =
                            button.querySelector(
                                "i"
                            );


                        if (icon) {

                            icon.className =
                                showPassword
                                    ? "fa-regular fa-eye-slash"
                                    : "fa-regular fa-eye";
                        }


                        input.focus();
                    }
                );
            }
        );
}


/* =========================================================
   3. LOGIN PASSWORD TOGGLE FALLBACK
========================================================= */

function initializeLoginPasswordToggle() {

    const loginPassword =
        getElement(
            "loginPassword"
        );


    const loginPasswordToggle =
        getElement(
            "passwordToggle"
        );


    if (
        !loginPassword ||
        !loginPasswordToggle
    ) {

        return;
    }


    loginPasswordToggle
        .addEventListener(
            "click",
            function () {

                const showPassword =
                    loginPassword.type ===
                    "password";


                loginPassword.type =
                    showPassword
                        ? "text"
                        : "password";


                loginPasswordToggle
                    .setAttribute(
                        "aria-pressed",
                        String(
                            showPassword
                        )
                    );


                loginPasswordToggle
                    .setAttribute(
                        "aria-label",
                        showPassword
                            ? "Parolayı gizle"
                            : "Parolayı göster"
                    );


                const icon =
                    loginPasswordToggle
                        .querySelector(
                            "i"
                        );


                if (icon) {

                    icon.className =
                        showPassword
                            ? "fa-regular fa-eye-slash"
                            : "fa-regular fa-eye";
                }


                loginPassword.focus();
            }
        );
}


/* =========================================================
   4. EMAIL VALIDATION
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            String(
                email ||
                ""
            ).trim()
        );
}


/* =========================================================
   5. PASSWORD STRENGTH
========================================================= */

function calculatePasswordStrength(
    password
) {

    const value =
        String(
            password ||
            ""
        );


    if (!value) {
        return 0;
    }


    let score =
        0;


    if (
        value.length >=
        8
    ) {

        score++;
    }


    if (
        /[a-z]/.test(value) &&
        /[A-Z]/.test(value)
    ) {

        score++;
    }


    if (
        /\d/.test(value)
    ) {

        score++;
    }


    if (
        /[^A-Za-z0-9]/.test(
            value
        )
    ) {

        score++;
    }


    return Math.min(
        4,
        score
    );
}


function getPasswordStrengthLabel(
    strength
) {

    switch (strength) {

        case 1:
            return "Zayıf";

        case 2:
            return "Orta";

        case 3:
            return "İyi";

        case 4:
            return "Güçlü";

        default:
            return "";
    }
}


/* =========================================================
   6. REGISTER PASSWORD STRENGTH UI
========================================================= */

function initializePasswordStrength() {

    const passwordInput =
        getElement(
            "registerPassword"
        );


    const strengthContainer =
        getElement(
            "passwordStrength"
        );


    const strengthLabel =
        getElement(
            "passwordStrengthLabel"
        );


    if (
        !passwordInput ||
        !strengthContainer
    ) {

        return;
    }


    passwordInput
        .addEventListener(
            "input",
            function () {

                const value =
                    passwordInput.value;


                const strength =
                    calculatePasswordStrength(
                        value
                    );


                if (!value) {

                    strengthContainer
                        .classList
                        .remove(
                            "visible"
                        );


                    strengthContainer
                        .removeAttribute(
                            "data-strength"
                        );


                    if (
                        strengthLabel
                    ) {

                        strengthLabel.textContent =
                            "";
                    }


                    setInputState(
                        passwordInput,
                        null
                    );


                    return;
                }


                strengthContainer
                    .classList
                    .add(
                        "visible"
                    );


                strengthContainer
                    .setAttribute(
                        "data-strength",
                        String(
                            strength
                        )
                    );


                if (
                    strengthLabel
                ) {

                    strengthLabel.textContent =
                        getPasswordStrengthLabel(
                            strength
                        );
                }


                if (
                    value.length >=
                    8
                ) {

                    setInputState(
                        passwordInput,
                        "valid"
                    );

                } else {

                    setInputState(
                        passwordInput,
                        "invalid"
                    );
                }
            }
        );
}


/* =========================================================
   7. REGISTER PASSWORD CONFIRMATION
========================================================= */

function initializePasswordConfirmation() {

    const passwordInput =
        getElement(
            "registerPassword"
        );


    const confirmInput =
        getElement(
            "registerPasswordConfirm"
        );


    const errorElement =
        getElement(
            "passwordMatchError"
        );


    if (
        !passwordInput ||
        !confirmInput
    ) {

        return;
    }


    function validateMatch() {

        const password =
            passwordInput.value;


        const confirmation =
            confirmInput.value;


        if (!confirmation) {

            setInputState(
                confirmInput,
                null
            );


            if (
                errorElement
            ) {

                errorElement
                    .classList
                    .remove(
                        "visible"
                    );
            }


            return true;
        }


        const matches =
            password ===
            confirmation;


        setInputState(
            confirmInput,
            matches
                ? "valid"
                : "invalid"
        );


        if (
            errorElement
        ) {

            errorElement
                .classList
                .toggle(
                    "visible",
                    !matches
                );
        }


        return matches;
    }


    passwordInput
        .addEventListener(
            "input",
            validateMatch
        );


    confirmInput
        .addEventListener(
            "input",
            validateMatch
        );
}


/* =========================================================
   8. REGISTER EMAIL VALIDATION
========================================================= */

function initializeRegisterEmailValidation() {

    const emailInput =
        getElement(
            "registerEmail"
        );


    if (!emailInput) {
        return;
    }


    emailInput
        .addEventListener(
            "blur",
            function () {

                const email =
                    emailInput.value
                        .trim();


                if (!email) {

                    setInputState(
                        emailInput,
                        null
                    );

                    return;
                }


                setInputState(
                    emailInput,
                    isValidEmail(email)
                        ? "valid"
                        : "invalid"
                );
            }
        );
}


/* =========================================================
   9. REGISTER NAME VALIDATION
========================================================= */

function initializeRegisterNameValidation() {

    const nameInput =
        getElement(
            "fullName"
        );


    if (!nameInput) {
        return;
    }


    nameInput
        .addEventListener(
            "blur",
            function () {

                const name =
                    nameInput.value
                        .trim();


                if (!name) {

                    setInputState(
                        nameInput,
                        null
                    );

                    return;
                }


                setInputState(
                    nameInput,
                    name.length >= 2
                        ? "valid"
                        : "invalid"
                );
            }
        );
}


/* =========================================================
   10. REGISTER ORGANIZATION VALIDATION
========================================================= */

function initializeOrganizationValidation() {

    const organizationInput =
        getElement(
            "organizationName"
        );


    if (!organizationInput) {
        return;
    }


    organizationInput
        .addEventListener(
            "blur",
            function () {

                const organizationName =
                    organizationInput.value
                        .trim();


                if (!organizationName) {

                    setInputState(
                        organizationInput,
                        null
                    );

                    return;
                }


                setInputState(
                    organizationInput,
                    organizationName.length >= 2
                        ? "valid"
                        : "invalid"
                );
            }
        );
}


/* =========================================================
   11. LOGIN FORM
========================================================= */

function initializeLoginForm() {

    const loginForm =
        document.querySelector(
            'form[action*="/login"]'
        );


    const emailInput =
        getElement(
            "loginEmail"
        );


    const passwordInput =
        getElement(
            "loginPassword"
        );


    const submitButton =
        getElement(
            "loginSubmitButton"
        );


    if (!loginForm) {
        return;
    }


    if (emailInput) {

        emailInput.addEventListener(
            "blur",
            function () {

                const email =
                    emailInput.value
                        .trim();


                if (!email) {

                    setInputState(
                        emailInput,
                        null
                    );

                    return;
                }


                setInputState(
                    emailInput,
                    isValidEmail(email)
                        ? "valid"
                        : "invalid"
                );
            }
        );
    }


    loginForm.addEventListener(
        "submit",
        function (event) {

            const email =
                emailInput
                    ?.value
                    .trim() ||
                "";


            const password =
                passwordInput
                    ?.value ||
                "";


            if (
                !isValidEmail(
                    email
                )
            ) {

                event.preventDefault();


                setInputState(
                    emailInput,
                    "invalid"
                );


                emailInput
                    ?.focus();


                return;
            }


            if (!password) {

                event.preventDefault();


                setInputState(
                    passwordInput,
                    "invalid"
                );


                passwordInput
                    ?.focus();


                return;
            }


            if (
                submitButton
            ) {

                submitButton.disabled =
                    true;


                submitButton.innerHTML =
                    '<i class="fa-solid fa-circle-notch fa-spin auth-spinner"></i>' +
                    '<span>Giriş yapılıyor...</span>';
            }
        }
    );
}


/* =========================================================
   12. REGISTER FORM
========================================================= */

function initializeRegisterForm() {

    const registerForm =
        document.querySelector(
            'form[action*="/register"]'
        );


    const nameInput =
        getElement(
            "fullName"
        );


    const organizationInput =
        getElement(
            "organizationName"
        );


    const emailInput =
        getElement(
            "registerEmail"
        );


    const passwordInput =
        getElement(
            "registerPassword"
        );


    const confirmInput =
        getElement(
            "registerPasswordConfirm"
        );


    const submitButton =
        getElement(
            "registerSubmitButton"
        );


    if (!registerForm) {
        return;
    }


    registerForm.addEventListener(
        "submit",
        function (event) {

            const fullName =
                nameInput
                    ?.value
                    .trim() ||
                "";


            const organizationName =
                organizationInput
                    ?.value
                    .trim() ||
                "";


            const email =
                emailInput
                    ?.value
                    .trim() ||
                "";


            const password =
                passwordInput
                    ?.value ||
                "";


            const confirmation =
                confirmInput
                    ?.value ||
                "";


            if (
                fullName.length <
                2
            ) {

                event.preventDefault();


                setInputState(
                    nameInput,
                    "invalid"
                );


                nameInput
                    ?.focus();


                return;
            }


            if (
                organizationName.length <
                2
            ) {

                event.preventDefault();


                setInputState(
                    organizationInput,
                    "invalid"
                );


                organizationInput
                    ?.focus();


                return;
            }


            if (
                !isValidEmail(
                    email
                )
            ) {

                event.preventDefault();


                setInputState(
                    emailInput,
                    "invalid"
                );


                emailInput
                    ?.focus();


                return;
            }


            if (
                password.length <
                8
            ) {

                event.preventDefault();


                setInputState(
                    passwordInput,
                    "invalid"
                );


                passwordInput
                    ?.focus();


                return;
            }


            if (
                password !==
                confirmation
            ) {

                event.preventDefault();


                setInputState(
                    confirmInput,
                    "invalid"
                );


                confirmInput
                    ?.focus();


                return;
            }


            if (
                submitButton
            ) {

                submitButton.disabled =
                    true;


                submitButton.innerHTML =
                    '<i class="fa-solid fa-circle-notch fa-spin auth-spinner"></i>' +
                    '<span>Hesap ve organizasyon oluşturuluyor...</span>';
            }
        }
    );
}


/* =========================================================
   13. FORGOT PASSWORD
========================================================= */

function initializeForgotPassword() {

    const forgotPasswordLink =
        getElement(
            "forgotPasswordLink"
        );


    if (!forgotPasswordLink) {
        return;
    }


    forgotPasswordLink
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                window.alert(
                    "Parola sıfırlama özelliği henüz etkinleştirilmedi."
                );
            }
        );
}


/* =========================================================
   14. INITIALIZATION
========================================================= */

function initializeAuthenticationUI() {

    initializePasswordToggles();

    initializeLoginPasswordToggle();

    initializePasswordStrength();

    initializePasswordConfirmation();

    initializeRegisterEmailValidation();

    initializeRegisterNameValidation();

    initializeOrganizationValidation();

    initializeLoginForm();

    initializeRegisterForm();

    initializeForgotPassword();
}


/* =========================================================
   15. START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAuthenticationUI,
        {
            once: true
        }
    );

} else {

    initializeAuthenticationUI();
}