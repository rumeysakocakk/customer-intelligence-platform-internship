"use strict";


const CURRENT_ROLE =
    String(
        document.body?.dataset?.userRole ||
        "viewer"
    )
        .trim()
        .toLowerCase();

const ROLE_CAPABILITIES = {
    owner: {
    label: "Hesap Sahibi",
    title: "Owner Merkezi",
    description: "Organizasyon, ekip, tahmin ve analiz yönetiminin tamamına erişebilirsiniz.",
    shortcuts: [
        { label: "Organizasyonu Yönet", icon: "fa-solid fa-users-gear", action: "organization" },
        { label: "Yeni Tahmin", icon: "fa-solid fa-wand-magic-sparkles", url: "/prediction" },
        { label: "Veri Analizi", icon: "fa-solid fa-chart-line", url: "/analytics" },
        { label: "Raporlar", icon: "fa-regular fa-file-lines", url: "/reports" }
    ],
    tasks: [
        "Organizasyon üyelerini ve rollerini yönet",
        "Yüksek riskli müşteri tahminlerini incele",
        "Genel analiz ve rapor sonuçlarını kontrol et"
    ]
},
    admin: {
        label: "Yönetici",
        title: "Yönetim Merkezi",
        description: "Ekip üyelerini yönetin, operasyonu takip edin ve raporlara erişin.",
        shortcuts: [
            { label: "Ekip Yönetimi", icon: "fa-solid fa-users-gear", action: "organization" },
            { label: "Yeni Tahmin", icon: "fa-solid fa-wand-magic-sparkles", url: "/prediction" },
            { label: "Model Performansı", icon: "fa-solid fa-gauge-high", url: "/model-performance" },
            { label: "AI Asistan", icon: "fa-solid fa-wand-magic-sparkles", url: "/assistant" }
        ]
    },
    analyst: {
        label: "Analist",
        title: "Analist Çalışma Alanı",
        description: "Riskleri inceleyin, model performansını yorumlayın ve karar destek analizleri hazırlayın.",
        shortcuts: [
            { label: "Veri Analizi", icon: "fa-solid fa-chart-line", url: "/analytics" },
            { label: "Model Performansı", icon: "fa-solid fa-gauge-high", url: "/model-performance" },
            { label: "Raporları İncele", icon: "fa-regular fa-file-lines", url: "/reports" },
            { label: "AI ile Yorumla", icon: "fa-solid fa-wand-magic-sparkles", url: "/assistant" }
        ],
        tasks: [
            "Yüksek riskli tahminleri incele",
            "Model performansındaki değişimleri kontrol et",
            "Analiz bulgularını raporla"
        ]
    },
    operator: {
        label: "Operasyon",
        title: "Operasyon Çalışma Alanı",
        description: "Yeni müşteri tahminleri oluşturun ve günlük operasyon akışını yönetin.",
        shortcuts: [
            { label: "Yeni Tahmin", icon: "fa-solid fa-wand-magic-sparkles", url: "/prediction" },
            { label: "Tahmin Geçmişi", icon: "fa-solid fa-clock-rotate-left", url: "/history" },
            { label: "Raporlar", icon: "fa-regular fa-file-lines", url: "/reports" },
            { label: "AI Asistan", icon: "fa-solid fa-wand-magic-sparkles", url: "/assistant" }
        ],
        tasks: [
            "Yeni müşteri kayıtlarını değerlendir",
            "Riskli sonuçları ilgili ekibe aktar",
            "Günlük tahmin akışını kontrol et"
        ]
    },
  viewer: {
    label: "Görüntüleyici",
    title: "İzleme Alanı",
    description: "Platform sonuçlarını salt-okuma modunda takip edin.",
    shortcuts: [
        { label: "Genel Bakış", icon: "fa-solid fa-chart-pie", url: "/" },
        { label: "Tahmin Geçmişi", icon: "fa-solid fa-clock-rotate-left", url: "/history" },
        { label: "Veri Analizi", icon: "fa-solid fa-chart-line", url: "/analytics" },
        { label: "Raporlar", icon: "fa-regular fa-file-lines", url: "/reports" }
    ],
    tasks: [
        "Genel performans göstergelerini takip et",
        "Tahmin geçmişindeki değişimleri incele",
        "Analiz ve rapor sonuçlarını görüntüle"
    ]
}
};

function getRoleCapability() {
    return ROLE_CAPABILITIES[CURRENT_ROLE] || ROLE_CAPABILITIES.viewer;
}

function canCurrentRoleAccessUrl(url) {
    if (url === "/prediction") {
        return ["owner", "admin", "operator"].includes(CURRENT_ROLE);
    }

    if (url === "/analytics") {
        return ["owner", "admin", "analyst", "viewer"].includes(CURRENT_ROLE);
    }

    if (url === "/model-performance") {
        return ["owner", "admin", "analyst"].includes(CURRENT_ROLE);
    }

    if (url === "/assistant") {
        return ["owner", "admin", "analyst", "operator"].includes(CURRENT_ROLE);
    }

    return true;
}


/* =========================================================
   CUSTOMER INTELLIGENCE PLATFORM
   GLOBAL APPLICATION JAVASCRIPT
========================================================= */

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toast-message");


const sidebar =
    document.getElementById("sidebar");

const openMenuButton =
    document.getElementById("open-menu");

const closeMenuButton =
    document.getElementById("close-menu");


/* =========================================================
   NOTIFICATION CENTER
========================================================= */

const notificationButton =
    document.getElementById(
        "notification-button"
    );

const notificationPanel =
    document.getElementById(
        "notification-panel"
    );

const notificationList =
    document.getElementById(
        "notification-list"
    );

const notificationDot =
    document.getElementById(
        "notification-dot"
    );

const notificationUnreadCount =
    document.getElementById(
        "notification-unread-count"
    );

const notificationSummaryTitle =
    document.getElementById(
        "notification-summary-title"
    );

const notificationSummaryText =
    document.getElementById(
        "notification-summary-text"
    );

const markAllNotificationsReadButton =
    document.getElementById(
        "mark-all-notifications-read"
    );

const clearNotificationsButton =
    document.getElementById(
        "clear-notifications"
    );

const closeNotificationPanelButton =
    document.getElementById(
        "close-notification-panel"
    );

const notificationFilterButtons =
    document.querySelectorAll(
        "[data-notification-filter]"
    );


/* =========================================================
   GENERAL ACTIONS
========================================================= */

const roleWorkspaceButton =
    document.getElementById(
        "role-workspace-button"
    );

const settingsButton =
    document.getElementById(
        "settings-button"
    );

const helpButton =
    document.getElementById(
        "help-button"
    );

const profileButton =
    document.getElementById(
        "profile-button"
    );

const profileMenu =
    document.getElementById(
        "profile-menu"
    );

const themeButtons =
    document.querySelectorAll(
        ".theme-button"
    );

const globalSearchInput =
    document.getElementById(
        "global-search"
    );


/* =========================================================
   ACCOUNT SETTINGS
========================================================= */

const accountModal =
    document.getElementById(
        "account-modal"
    );

const profileSettingsButton =
    document.getElementById(
        "profile-settings-button"
    );

const closeAccountModalButton =
    document.getElementById(
        "close-account-modal"
    );

const cancelAccountSettingsButton =
    document.getElementById(
        "cancel-account-settings"
    );

const accountSettingsForm =
    document.getElementById(
        "account-settings-form"
    );

const accountNameInput =
    document.getElementById(
        "account-name"
    );

const accountEmailInput =
    document.getElementById(
        "account-email"
    );

const accountLanguageSelect =
    document.getElementById(
        "account-language"
    );

const defaultPeriodSelect =
    document.getElementById(
        "default-period"
    );

const accountEmailStatus =
    document.getElementById(
        "account-email-status"
    );

const emailVerificationStatus =
    document.getElementById(
        "email-verification-status"
    );


/* =========================================================
   ORGANIZATION & TEAM
========================================================= */

const organizationSettingsButton =
    document.getElementById(
        "organization-settings-button"
    );

const openOrganizationFromAccountButton =
    document.getElementById(
        "open-organization-from-account"
    );

const organizationModal =
    document.getElementById(
        "organization-modal"
    );

const closeOrganizationModalButton =
    document.getElementById(
        "close-organization-modal"
    );

const closeOrganizationModalFooterButton =
    document.getElementById(
        "close-organization-modal-footer"
    );

const organizationNameInput =
    document.getElementById(
        "organization-name-input"
    );

const organizationSummaryName =
    document.getElementById(
        "organization-summary-name"
    );

const saveOrganizationSettingsButton =
    document.getElementById(
        "save-organization-settings"
    );

const organizationMembersList =
    document.getElementById(
        "organization-members-list"
    );

const organizationMembersEmpty =
    document.getElementById(
        "organization-members-empty"
    );

const organizationMemberForm =
    document.getElementById(
        "organization-member-form"
    );

const organizationMemberNameInput =
    document.getElementById(
        "organization-member-name"
    );

const organizationMemberEmailInput =
    document.getElementById(
        "organization-member-email"
    );

const organizationMemberRoleSelect =
    document.getElementById(
        "organization-member-role"
    );

const organizationMemberStatusSelect =
    document.getElementById(
        "organization-member-status"
    );

const cancelOrganizationMemberButton =
    document.getElementById(
        "cancel-organization-member"
    );

const ORGANIZATION_API = {
    details: "/api/organization",
    members: "/api/organization/members"
};


/* =========================================================
   SECURITY
========================================================= */

const securityButton =
    document.getElementById(
        "security-button"
    );

const securityModal =
    document.getElementById(
        "security-modal"
    );

const closeSecurityModalButton =
    document.getElementById(
        "close-security-modal"
    );

const cancelSecuritySettingsButton =
    document.getElementById(
        "cancel-security-settings"
    );

const passwordForm =
    document.getElementById(
        "password-form"
    );

const currentPasswordInput =
    document.getElementById(
        "current-password"
    );

const newPasswordInput =
    document.getElementById(
        "new-password"
    );

const confirmPasswordInput =
    document.getElementById(
        "confirm-password"
    );

const passwordToggleButtons =
    document.querySelectorAll(
        ".password-toggle"
    );


/* =========================================================
   EMAIL
========================================================= */

const emailSettingsButton =
    document.getElementById(
        "email-settings-button"
    );

const emailModal =
    document.getElementById(
        "email-modal"
    );

const closeEmailModalButton =
    document.getElementById(
        "close-email-modal"
    );

const cancelEmailSettingsButton =
    document.getElementById(
        "cancel-email-settings"
    );

const emailSettingsForm =
    document.getElementById(
        "email-settings-form"
    );

const emailSettingsAddressInput =
    document.getElementById(
        "email-settings-address"
    );

const emailModalCurrentAddress =
    document.getElementById(
        "email-modal-current-address"
    );

const emailModalStatus =
    document.getElementById(
        "email-modal-status"
    );

const sendVerificationEmailButton =
    document.getElementById(
        "send-verification-email"
    );


/* =========================================================
   HELP
========================================================= */

const helpModal =
    document.getElementById(
        "help-modal"
    );

const closeHelpModalButton =
    document.getElementById(
        "close-help-modal"
    );

const closeHelpModalFooterButton =
    document.getElementById(
        "close-help-modal-footer"
    );


/* =========================================================
   PROFILE ACTIONS
========================================================= */

const notificationSettingsButton =
    document.getElementById(
        "notification-settings-button"
    );

const logoutButton =
    document.getElementById(
        "logout-button"
    );


/* =========================================================
   2. CONSTANTS
========================================================= */

const THEME_STORAGE_KEY =
    "customer-intelligence-theme";

const ACCOUNT_STORAGE_KEY =
    "customer-intelligence-account-preferences";

const NOTIFICATION_STORAGE_KEY =
    "customer-intelligence-notifications";

const ALLOWED_THEMES = [
    "midnight",
    "light",
    "slate"
];

const ALLOWED_NOTIFICATION_FILTERS = [
    "all",
    "unread",
    "risk",
    "system"
];

const ALLOWED_NOTIFICATION_TYPES = [
    "risk",
    "system",
    "assistant",
    "scenario",
    "report",
    "account"
];

const ALLOWED_NOTIFICATION_LEVELS = [
    "info",
    "success",
    "warning",
    "danger",
    "risk",
    "system"
];

const MAX_NOTIFICATION_HISTORY =
    100;


/* =========================================================
   GLOBAL SEARCH INDEX
========================================================= */

const SEARCH_ITEMS = [

    {
        title: "Genel Bakış",

        keywords: [
            "genel",
            "genel bakış",
            "dashboard",
            "ana sayfa",
            "overview",
            "özet",
            "istatistik"
        ],

        type: "page",

        url: "/"
    },


    {
        title: "Yeni Tahmin",

        keywords: [
            "tahmin",
            "yeni tahmin",
            "prediction",
            "müşteri tahmini",
            "memnuniyet tahmini",
            "form"
        ],

        type: "page",

        url: "/prediction"
    },


    {
        title: "Tahmin Geçmişi",

        keywords: [
            "geçmiş",
            "history",
            "kayıt",
            "kayıtlar",
            "tahmin geçmişi",
            "eski tahminler"
        ],

        type: "page",

        url: "/history"
    },


    {
        title: "Veri Analizi",

        keywords: [
            "analiz",
            "analytics",
            "veri analizi",
            "kategori",
            "eyalet",
            "ödeme",
            "teslimat",
            "risk analizi"
        ],

        type: "page",

        url: "/analytics"
    },


    {
        title: "Model Performansı",

        keywords: [
            "model",
            "performans",
            "model performansı",
            "accuracy",
            "precision",
            "recall",
            "f1",
            "auc",
            "roc",
            "lightgbm"
        ],

        type: "page",

        url: "/model-performance"
    },


    {
        title: "Raporlar",

        keywords: [
            "rapor",
            "raporlar",
            "reports",
            "pdf",
            "yazdır",
            "indir",
            "indirme"
        ],

        type: "page",

        url: "/reports"
    },


    {
        title: "AI Asistan",

        keywords: [
            "ai",
            "yapay zeka",
            "asistan",
            "ai asistan",
            "gemini",
            "assistant"
        ],

        type: "page",

        url: "/assistant"
    },


    {        title: "Ayarlar",

        keywords: [
            "ayar",
            "ayarlar",
            "settings",
            "hesap",
            "hesap ayarları",
            "profil",
            "profil ayarları",
            "tercihler"
        ],

        type: "action",

        action: "settings"
    },


    {
        title: "Yardım",

        keywords: [
            "yardım",
            "help",
            "destek",
            "yardım merkezi",
            "nasıl kullanılır"
        ],

        type: "action",

        action: "help"
    },


    {
        title: "Güvenlik",

        keywords: [
            "güvenlik",
            "security",
            "şifre",
            "password",
            "şifre değiştir",
            "hesap güvenliği"
        ],

        type: "action",

        action: "security"
    },


    {
        title: "E-posta Ayarları",

        keywords: [
            "email",
            "e-posta",
            "mail",
            "eposta",
            "e-posta ayarları",
            "mail ayarları"
        ],

        type: "action",

        action: "email"
    },


    {
        title: "Bildirimler",

        keywords: [
            "bildirim",
            "bildirimler",
            "notification",
            "notifications",
            "uyarı",
            "uyarılar",
            "risk uyarıları"
        ],

        type: "action",

        action: "notifications"
    }

];


const ROLE_SEARCH_ITEMS =
    SEARCH_ITEMS.filter(function (item) {

        return (
            !item.url ||
            canCurrentRoleAccessUrl(
                item.url
            )
        );
    });


/* =========================================================
   APPLICATION STATE
========================================================= */

let toastTimer =
    null;

let lastFocusedElement =
    null;

let notifications =
    [];

let activeNotificationFilter =
    "all";


/* =========================================================
   3. LOCAL STORAGE
========================================================= */

function getLocalStorageValue(key) {

    try {

        return localStorage.getItem(
            key
        );

    } catch (error) {

        console.warn(
            "Local storage okunamadı:",
            error
        );

        return null;
    }
}


function setLocalStorageValue(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            value
        );

        return true;

    } catch (error) {

        console.warn(
            "Local storage yazılamadı:",
            error
        );

        return false;
    }
}


/* =========================================================
   4. TOAST
   Küçük işlem geri bildirimleri için kullanılır.
   Bildirim merkezi bunun üzerinden çalışmaz.
========================================================= */

function showToast(message) {

    if (!toast) {

        console.info(message);

        return;
    }


    if (toastMessage) {

        toastMessage.textContent =
            message;
    }


    toast.classList.add(
        "visible"
    );


    if (toastTimer) {

        clearTimeout(
            toastTimer
        );
    }


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "visible"
                );

            },
            2800
        );
}


/* =========================================================
   5. HELPERS
========================================================= */

function getInitials(name) {

    if (
        !name ||
        !name.trim()
    ) {

        return "CI";
    }


    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        words.length === 0
    ) {

        return "CI";
    }


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(
                0,
                2
            )
            .toUpperCase();
    }


    return (
        words[0][0] +
        words[
            words.length - 1
        ][0]
    ).toUpperCase();
}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


function normalizeSearchText(value) {

    return String(
        value || ""
    )
        .toLocaleLowerCase(
            "tr-TR"
        )
        .trim();
}


/* =========================================================
   ROLE WORKSPACE
========================================================= */

function ensureRoleWorkspaceModal() {

    let modal =
        document.getElementById(
            "role-workspace-modal"
        );


    if (modal) {

        return modal;
    }


    const capability =
        getRoleCapability();


    const shortcutHtml =
        (capability.shortcuts || [])
            .map(
                function (item) {

                    const attrs =
                        item.url
                            ? `data-role-workspace-url="${item.url}"`
                            : `data-role-workspace-action="${item.action || ""}"`;


                    return `
                        <button
                            class="role-workspace-shortcut"
                            type="button"
                            ${attrs}
                        >
                            <i class="${item.icon}"></i>
                            <span>${item.label}</span>
                        </button>
                    `;
                }
            )
            .join("");


    const taskHtml =
        (capability.tasks || []).length
            ? `
                <div class="role-workspace-tasks">

                    <span class="role-workspace-section-label">
                        ÖNERİLEN GÖREVLER
                    </span>

                    ${(capability.tasks || [])
                        .map(
                            function (task) {

                                return `
                                    <div class="role-workspace-task">
                                        <i class="fa-regular fa-circle-check"></i>
                                        <span>${task}</span>
                                    </div>
                                `;
                            }
                        )
                        .join("")}

                </div>
            `
            : "";


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "role-workspace-modal";


    modal.className =
        "modal-backdrop modal-overlay role-workspace-modal";


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    modal.innerHTML = `
        <div
            class="account-modal role-workspace-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-workspace-title"
        >

            <div class="account-modal-header">

                <div>

                    <span class="modal-eyebrow">
                        ${capability.label}
                    </span>

                    <h2 id="role-workspace-title">
                        ${capability.title}
                    </h2>

                    <p>
                        ${capability.description}
                    </p>

                </div>


                <button
                    class="modal-close"
                    type="button"
                    data-role-workspace-close
                    aria-label="Çalışma alanını kapat"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <div class="role-workspace-content">

                <div class="role-workspace-shortcuts">
                    ${shortcutHtml}
                </div>

                ${taskHtml}

            </div>


            <div class="modal-footer">

                <button
                    class="modal-primary-button"
                    type="button"
                    data-role-workspace-close
                >
                    Tamam
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            "[data-role-workspace-close]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        closeModal(
                            modal
                        );
                    }
                );
            }
        );


    modal
        .querySelectorAll(
            "[data-role-workspace-url]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const url =
                            button.dataset
                                .roleWorkspaceUrl;


                        if (
                            canCurrentRoleAccessUrl(
                                url
                            )
                        ) {

                            window.location.href =
                                url;

                        } else {

                            showToast(
                                "Bu sayfa için yetkiniz bulunmuyor."
                            );
                        }
                    }
                );
            }
        );


    modal
        .querySelectorAll(
            "[data-role-workspace-action]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        if (
                            button.dataset
                                .roleWorkspaceAction ===
                                "organization" &&
                            [
                                "owner",
                                "admin"
                            ].includes(
                                CURRENT_ROLE
                            ) &&
                            organizationSettingsButton
                        ) {

                            closeModal(
                                modal
                            );


                            organizationSettingsButton
                                .click();
                        }
                    }
                );
            }
        );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeModal(
                    modal
                );
            }
        }
    );


    return modal;
}


function openRoleWorkspace() {

    openModal(
        ensureRoleWorkspaceModal()
    );
}


if (roleWorkspaceButton) {

    roleWorkspaceButton
        .addEventListener(
            "click",
            openRoleWorkspace
        );
}


/* =========================================================
   6. PROFILE MENU
========================================================= */

function openProfileMenu() {

    if (
        !profileMenu ||
        !profileButton
    ) {

        return;
    }


    closeNotificationPanel();


    profileMenu.classList.add(
        "open"
    );


    profileButton.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeProfileMenu() {

    if (
        !profileMenu ||
        !profileButton
    ) {

        return;
    }


    profileMenu.classList.remove(
        "open"
    );


    profileButton.setAttribute(
        "aria-expanded",
        "false"
    );
}


function toggleProfileMenu(event) {

    if (
        !profileMenu ||
        !profileButton
    ) {

        return;
    }


    event.preventDefault();

    event.stopPropagation();


    const opened =
        profileMenu
            .classList
            .contains(
                "open"
            );


    if (opened) {

        closeProfileMenu();

    } else {

        openProfileMenu();
    }
}


if (
    profileButton &&
    profileMenu
) {

    profileButton
        .addEventListener(
            "click",
            toggleProfileMenu
        );


    profileMenu
        .addEventListener(
            "click",
            function (event) {

                event.stopPropagation();
            }
        );
}


/* =========================================================
   7. MODAL MANAGER
========================================================= */

function getOpenModals() {

    return document
        .querySelectorAll(
            ".modal-backdrop.open, .modal-overlay.open"
        );
}


function updateBodyScroll() {

    document.body.style.overflow =
        getOpenModals().length > 0
            ? "hidden"
            : "";
}


function closeAllModals(
    exceptModal = null
) {

    getOpenModals()
        .forEach(
            function (modal) {

                if (
                    modal !==
                    exceptModal
                ) {

                    modal
                        .classList
                        .remove(
                            "open"
                        );


                    modal
                        .setAttribute(
                            "aria-hidden",
                            "true"
                        );
                }
            }
        );


    updateBodyScroll();
}


function openModal(
    modal,
    focusElement = null
) {

    if (!modal) {

        console.warn(
            "Modal bulunamadı."
        );

        return;
    }


    lastFocusedElement =
        document.activeElement;


    closeProfileMenu();

    closeNotificationPanel();

    closeAllModals(
        modal
    );


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    updateBodyScroll();


    if (focusElement) {

        setTimeout(
            function () {

                focusElement.focus();
            },
            100
        );
    }
}


function closeModal(modal) {

    if (!modal) {

        return;
    }


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    updateBodyScroll();


    if (
        lastFocusedElement &&
        typeof lastFocusedElement.focus ===
        "function"
    ) {

        setTimeout(
            function () {

                lastFocusedElement.focus();
            },
            50
        );
    }
}


/* =========================================================
   8. SIDEBAR
========================================================= */

function openSidebar() {

    if (sidebar) {

        sidebar.classList.add(
            "open"
        );
    }
}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );
    }
}


if (openMenuButton) {

    openMenuButton
        .addEventListener(
            "click",
            openSidebar
        );
}


if (closeMenuButton) {

    closeMenuButton
        .addEventListener(
            "click",
            closeSidebar
        );
}


document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        function (item) {

            item.addEventListener(
                "click",
                function () {

                    if (
                        window.innerWidth <=
                        900
                    ) {

                        closeSidebar();
                    }
                }
            );
        }
    );


/* =========================================================
   9. THEME
========================================================= */

function setTheme(
    theme,
    notify = false
) {

    const selectedTheme =
        ALLOWED_THEMES
            .includes(theme)
            ? theme
            : "midnight";


    document.body.dataset.theme =
        selectedTheme;


    document.documentElement
        .setAttribute(
            "data-theme",
            selectedTheme
        );


    setLocalStorageValue(
        THEME_STORAGE_KEY,
        selectedTheme
    );


    themeButtons
        .forEach(
            function (button) {

                button
                    .classList
                    .toggle(
                        "active",
                        button.dataset.theme ===
                        selectedTheme
                    );
            }
        );


    if (notify) {

        showToast(
            "Tema tercihi güncellendi."
        );
    }
}


themeButtons
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    setTheme(
                        button.dataset.theme,
                        true
                    );
                }
            );
        }
    );


/* =========================================================
   10. ACCOUNT STORAGE
========================================================= */

function getDefaultAccountPreferences() {

    const serverName =
        document
            .getElementById(
                "top-profile-name"
            )
            ?.textContent
            ?.trim() ||
        "Kullanıcı";


    const serverEmail =
        document
            .getElementById(
                "menu-profile-email"
            )
            ?.textContent
            ?.trim() ||
        "";


    return {

        displayName:
            serverName,

        email:
            serverEmail,

        language:
            "tr",

        defaultPeriod:
            "30",

        emailVerified:
            false
    };
}


function getStoredAccountPreferences() {

    const defaults =
        getDefaultAccountPreferences();


    const saved =
        getLocalStorageValue(
            ACCOUNT_STORAGE_KEY
        );


    if (!saved) {

        return defaults;
    }


    try {

        const parsed =
            JSON.parse(saved);


        return {

            ...defaults,

            language:
                parsed.language ||
                defaults.language,

            defaultPeriod:
                parsed.defaultPeriod ||
                defaults.defaultPeriod,

            emailVerified:
                parsed.emailVerified ===
                true
        };


    } catch (error) {

        console.error(
            "Hesap tercihleri okunamadı:",
            error
        );


        return defaults;
    }
}


function saveAccountPreferences(
    preferences
) {

    return setLocalStorageValue(

        ACCOUNT_STORAGE_KEY,

        JSON.stringify(
            preferences
        )
    );
}


/* =========================================================
   11. PROFILE PRESENTATION
========================================================= */

function updateProfilePresentation(
    displayName,
    email
) {

    const safeName =
        displayName?.trim() ||
        document
            .getElementById(
                "top-profile-name"
            )
            ?.textContent
            ?.trim() ||
        "Kullanıcı";


    const topProfileName =
        document.getElementById(
            "top-profile-name"
        ) ||
        document.querySelector(
            ".profile-info strong"
        );


    const menuProfileName =
        document.getElementById(
            "menu-profile-name"
        ) ||
        document.querySelector(
            ".profile-menu-header strong"
        );


    const menuProfileEmail =
        document.getElementById(
            "menu-profile-email"
        );


    const accountSummaryName =
        document.getElementById(
            "account-summary-name"
        );


    if (topProfileName) {

        topProfileName.textContent =
            safeName;
    }


    if (menuProfileName) {

        menuProfileName.textContent =
            safeName;
    }


    if (
        menuProfileEmail &&
        email
    ) {

        menuProfileEmail.textContent =
            email;
    }


    if (accountSummaryName) {

        accountSummaryName.textContent =
            safeName;
    }


    const initials =
        getInitials(
            safeName
        );


    [
        "top-profile-avatar",
        "menu-profile-avatar",
        "account-summary-avatar"
    ]
        .forEach(
            function (id) {

                const element =
                    document
                        .getElementById(
                            id
                        );


                if (element) {

                    element.textContent =
                        initials;
                }
            }
        );
}


/* =========================================================
   12. EMAIL VERIFICATION
========================================================= */

function updateEmailVerificationUI(
    isVerified
) {

    const verified =
        isVerified === true;


    if (emailModalStatus) {

        emailModalStatus.className =
            verified
                ? "email-status-pill verified"
                : "email-status-pill pending";


        emailModalStatus.innerHTML =
            verified
                ? '<i class="fa-solid fa-circle-check"></i> Doğrulandı'
                : '<i class="fa-solid fa-circle-exclamation"></i> Doğrulanmadı';
    }


    if (accountEmailStatus) {

        accountEmailStatus.textContent =
            verified
                ? "Doğrulandı"
                : "Doğrulama gerekli";
    }


    if (emailVerificationStatus) {

        emailVerificationStatus
            .className =
                verified
                    ? "email-verification-status verified"
                    : "email-verification-status pending";


        emailVerificationStatus
            .innerHTML =
                verified
                    ? '<i class="fa-solid fa-circle-check"></i> Doğrulandı'
                    : '<i class="fa-solid fa-circle-exclamation"></i> Doğrulama gerekli';
    }
}


/* =========================================================
   13. LOAD ACCOUNT
========================================================= */

function loadSavedAccountPreferences() {

    const account =
        getStoredAccountPreferences();


    if (accountNameInput) {

        accountNameInput.value =
            account.displayName;
    }


    if (accountEmailInput) {

        accountEmailInput.value =
            account.email;
    }


    if (accountLanguageSelect) {

        accountLanguageSelect.value =
            account.language;
    }


    if (defaultPeriodSelect) {

        defaultPeriodSelect.value =
            account.defaultPeriod;
    }


    updateProfilePresentation(
        account.displayName,
        account.email
    );


    updateEmailVerificationUI(
        account.emailVerified
    );
}


/* =========================================================
   14. ACCOUNT MODAL
========================================================= */

function populateAccountModal() {

    const account =
        getStoredAccountPreferences();


    if (accountNameInput) {

        accountNameInput.value =
            account.displayName;
    }


    if (accountEmailInput) {

        accountEmailInput.value =
            account.email;
    }


    if (accountLanguageSelect) {

        accountLanguageSelect.value =
            account.language;
    }


    if (defaultPeriodSelect) {

        defaultPeriodSelect.value =
            account.defaultPeriod;
    }


    updateEmailVerificationUI(
        account.emailVerified
    );
}


function openAccountModal() {

    populateAccountModal();


    openModal(
        accountModal,
        accountNameInput
    );
}


function closeAccountModal() {

    closeModal(
        accountModal
    );
}


if (settingsButton) {

    settingsButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                openAccountModal();
            }
        );
}


if (profileSettingsButton) {

    profileSettingsButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                openAccountModal();
            }
        );
}


if (closeAccountModalButton) {

    closeAccountModalButton
        .addEventListener(
            "click",
            closeAccountModal
        );
}


if (cancelAccountSettingsButton) {

    cancelAccountSettingsButton
        .addEventListener(
            "click",
            closeAccountModal
        );
}


if (accountModal) {

    accountModal
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    accountModal
                ) {

                    closeAccountModal();
                }
            }
        );
}


/* =========================================================
   15. SAVE ACCOUNT
========================================================= */

if (accountSettingsForm) {

    accountSettingsForm
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const displayName =
                    accountNameInput
                        ?.value
                        .trim() ||
                    "";


                const email =
                    accountEmailInput
                        ?.value
                        .trim() ||
                    "";


                if (
                    displayName.length <
                    2
                ) {

                    showToast(
                        "Görünen ad en az 2 karakter olmalıdır."
                    );


                    accountNameInput
                        ?.focus();


                    return;
                }


                if (
                    !isValidEmail(
                        email
                    )
                ) {

                    showToast(
                        "Geçerli bir e-posta adresi girin."
                    );


                    accountEmailInput
                        ?.focus();


                    return;
                }


                const oldPreferences =
                    getStoredAccountPreferences();


                const emailChanged =
                    oldPreferences.email
                        .toLowerCase() !==
                    email.toLowerCase();


                const preferences = {

                    displayName:
                        displayName,

                    email:
                        email,

                    language:
                        accountLanguageSelect
                            ?.value ||
                        "tr",

                    defaultPeriod:
                        defaultPeriodSelect
                            ?.value ||
                        "30",

                    emailVerified:
                        emailChanged
                            ? false
                            : oldPreferences
                                .emailVerified ===
                                true
                };


                if (
                    !saveAccountPreferences(
                        preferences
                    )
                ) {

                    showToast(
                        "Tercihler kaydedilemedi."
                    );

                    return;
                }


                updateProfilePresentation(
                    preferences.displayName,
                    preferences.email
                );


                updateEmailVerificationUI(
                    preferences.emailVerified
                );


                closeAccountModal();


                if (
                    oldPreferences.language !==
                    preferences.language
                ) {

                    showToast(
                        "Dil tercihi kaydedildi."
                    );

                } else {

                    showToast(
                        "Hesap tercihleri kaydedildi."
                    );
                }
            }
        );
}


/* =========================================================
   16. ORGANIZATION & TEAM
========================================================= */

function normalizeOrganizationRole(role) {

    const normalized =
        String(role || "")
            .trim()
            .toLowerCase();


    const aliases = {
        manager: "admin",
        yonetici: "admin",
        yönetici: "admin",
        goruntuleyici: "viewer",
        görüntüleyici: "viewer",
        analist: "analyst",
        operasyon: "operator"
    };


    return aliases[normalized] || normalized;
}


function getOrganizationRoleLabel(role) {

    const labels = {
        owner: "Hesap Sahibi",
        admin: "Yönetici",
        analyst: "Analist",
        operator: "Operasyon",
        viewer: "Görüntüleyici"
    };


    return (
        labels[
            normalizeOrganizationRole(role)
        ] ||
        "Kullanıcı"
    );
}


function getOrganizationRoleOptions(
    selectedRole = "viewer",
    allowOwner = false
) {

    const selected =
        normalizeOrganizationRole(
            selectedRole
        );


    const roles = [
        {
            value: "admin",
            label: "Yönetici"
        },
        {
            value: "analyst",
            label: "Analist"
        },
        {
            value: "operator",
            label: "Operasyon"
        },
        {
            value: "viewer",
            label: "Görüntüleyici"
        }
    ];


    if (allowOwner) {

        roles.unshift({
            value: "owner",
            label: "Hesap Sahibi"
        });
    }


    return roles
        .map(
            function (item) {

                const isSelected =
                    item.value ===
                    selected;


                return (
                    '<option value="' +
                    item.value +
                    '"' +
                    (
                        isSelected
                            ? " selected"
                            : ""
                    ) +
                    ">" +
                    item.label +
                    "</option>"
                );
            }
        )
        .join("");
}


function configureOrganizationRoleSelect() {

    if (!organizationMemberRoleSelect) {

        return;
    }


    organizationMemberRoleSelect.innerHTML =
        getOrganizationRoleOptions(
            "analyst",
            false
        );
}


async function fetchJson(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                credentials:
                    "same-origin",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json",

                    ...(
                        options.headers ||
                        {}
                    )
                },

                ...options
            }
        );


    let payload = null;


    try {

        payload =
            await response.json();

    } catch (error) {

        payload = null;
    }


    if (!response.ok) {

        const message =
            payload?.error ||
            payload?.message ||
            "İşlem gerçekleştirilemedi.";


        const requestError =
            new Error(
                message
            );


        requestError.status =
            response.status;


        throw requestError;
    }


    return payload || {};
}


function escapeOrganizationHtml(value) {

    return String(
        value ?? ""
    )
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


function getCurrentOrganizationRole() {

    const roleText =
        document
            .getElementById(
                "organization-current-role"
            )
            ?.textContent
            ?.trim()
            ?.toLocaleLowerCase(
                "tr-TR"
            ) ||
        "";


    if (
        roleText.includes(
            "hesap sahibi"
        )
    ) {

        return "owner";
    }


    if (
        roleText.includes(
            "yönetici"
        )
    ) {

        return "admin";
    }


    if (
        roleText.includes(
            "analist"
        )
    ) {

        return "analyst";
    }


    if (
        roleText.includes(
            "operasyon"
        )
    ) {

        return "operator";
    }


    if (
        roleText.includes(
            "görüntüleyici"
        )
    ) {

        return "viewer";
    }


    return "";
}


function canManageOrganization() {

    const role =
        CURRENT_ROLE ||
        getCurrentOrganizationRole();


    return (
        role === "owner" ||
        role === "admin"
    );
}function setOrganizationManagementAccess() {

    const canManage =
        canManageOrganization();


    if (
        organizationNameInput
    ) {

        organizationNameInput.disabled =
            !canManage;
    }


    if (
        saveOrganizationSettingsButton
    ) {

        saveOrganizationSettingsButton.disabled =
            !canManage;
    }


    if (
        organizationMemberForm
    ) {

        organizationMemberForm
            .querySelectorAll(
                "input, select, button"
            )
            .forEach(
                function (element) {

                    element.disabled =
                        !canManage;
                }
            );
    }
}


function updateOrganizationNamePresentation(
    organizationName
) {

    const safeName =
        String(
            organizationName ||
            ""
        )
            .trim();


    if (!safeName) {
        return;
    }


    [
        "organization-summary-name",
        "account-organization-name",
        "profile-organization-name"
    ]
        .forEach(
            function (id) {

                const element =
                    document
                        .getElementById(
                            id
                        );


                if (element) {

                    element.textContent =
                        safeName;
                }
            }
        );


    const topProfileRole =
        document
            .getElementById(
                "top-profile-role"
            );


    if (topProfileRole) {

        topProfileRole.title =
            safeName;
    }


    if (organizationNameInput) {

        organizationNameInput.value =
            safeName;
    }
}



function ensureInvitationResultModal() {

    let modal =
        document.getElementById(
            "organization-invitation-result-modal"
        );


    if (modal) {
        return modal;
    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "organization-invitation-result-modal";


    modal.className =
        "modal-backdrop modal-overlay";


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    modal.innerHTML = `
        <div
            class="account-modal organization-invitation-result-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="organization-invitation-result-title"
            style="max-width: 620px;"
        >
            <div class="account-modal-header">
                <div>
                    <span class="modal-eyebrow">
                        Ekip Daveti
                    </span>

                    <h2 id="organization-invitation-result-title">
                        Davet bağlantısı oluşturuldu
                    </h2>

                    <p>
                        Bu bağlantıyı ekip üyesine güvenli bir kanaldan iletin.
                        Kullanıcı bağlantıyı açıp kendi şifresini belirlediğinde
                        üyeliği aktifleşir.
                    </p>
                </div>

                <button
                    class="modal-close"
                    type="button"
                    data-invitation-close
                    aria-label="Davet penceresini kapat"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="settings-section">
                <div class="settings-section-title">
                    <div class="settings-section-icon">
                        <i class="fa-solid fa-link"></i>
                    </div>

                    <div>
                        <h3>
                            Davet Bağlantısı
                        </h3>

                        <p id="organization-invitation-result-recipient">
                            Davet hazır.
                        </p>
                    </div>
                </div>

                <div class="settings-field full-width">
                    <label for="organization-invitation-result-url">
                        Bağlantı
                    </label>

                    <div
                        style="
                            display:grid;
                            grid-template-columns:minmax(0,1fr) auto;
                            gap:10px;
                            align-items:center;
                        "
                    >
                        <input
                            id="organization-invitation-result-url"
                            type="text"
                            readonly
                            autocomplete="off"
                        >

                        <button
                            class="modal-primary-button"
                            id="copy-organization-invitation-url"
                            type="button"
                        >
                            <i class="fa-regular fa-copy"></i>
                            Kopyala
                        </button>
                    </div>

                    <small
                        class="settings-helper"
                        id="organization-invitation-result-expiry"
                    >
                        Davet bağlantısı sınırlı süre geçerlidir.
                    </small>
                </div>
            </div>

            <div class="modal-footer">
                <button
                    class="modal-primary-button"
                    type="button"
                    data-invitation-close
                >
                    <i class="fa-solid fa-check"></i>
                    Tamam
                </button>
            </div>
        </div>
    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            "[data-invitation-close]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        closeModal(
                            modal
                        );
                    }
                );
            }
        );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeModal(
                    modal
                );
            }
        }
    );


    const copyButton =
        modal.querySelector(
            "#copy-organization-invitation-url"
        );


    if (copyButton) {

        copyButton.addEventListener(
            "click",
            async function () {

                const input =
                    modal.querySelector(
                        "#organization-invitation-result-url"
                    );


                const invitationUrl =
                    input?.value || "";


                if (!invitationUrl) {

                    showToast(
                        "Kopyalanacak davet bağlantısı bulunamadı."
                    );

                    return;
                }


                try {

                    await navigator.clipboard.writeText(
                        invitationUrl
                    );


                    showToast(
                        "Davet bağlantısı kopyalandı."
                    );

                } catch (error) {

                    if (input) {

                        input.focus();

                        input.select();

                        document.execCommand(
                            "copy"
                        );

                        showToast(
                            "Davet bağlantısı kopyalandı."
                        );
                    }
                }
            }
        );
    }


    return modal;
}


function showOrganizationInvitationResult(
    invitation,
    member
) {

    const invitationUrl =
        String(
            invitation?.url ||
            ""
        )
            .trim();


    if (!invitationUrl) {

        showToast(
            "Davet oluşturuldu ancak bağlantı alınamadı."
        );

        return;
    }


    const modal =
        ensureInvitationResultModal();


    const urlInput =
        modal.querySelector(
            "#organization-invitation-result-url"
        );


    const recipient =
        modal.querySelector(
            "#organization-invitation-result-recipient"
        );


    const expiry =
        modal.querySelector(
            "#organization-invitation-result-expiry"
        );


    if (urlInput) {

        urlInput.value =
            invitationUrl;
    }


    if (recipient) {

        const fullName =
            String(
                member?.full_name ||
                "Ekip üyesi"
            )
                .trim();


        const email =
            String(
                member?.email ||
                ""
            )
                .trim();


        recipient.textContent =
            email
                ? `${fullName} (${email}) için davet hazır.`
                : `${fullName} için davet hazır.`;
    }


    if (expiry) {

        const expiresAt =
            invitation?.expires_at;


        if (expiresAt) {

            const date =
                new Date(
                    expiresAt
                );


            expiry.textContent =
                Number.isNaN(
                    date.getTime()
                )
                    ? "Davet bağlantısı sınırlı süre geçerlidir."
                    : `Davet ${date.toLocaleString("tr-TR")} tarihine kadar geçerlidir.`;

        } else {

            expiry.textContent =
                "Davet bağlantısı sınırlı süre geçerlidir.";
        }
    }


    openModal(
        modal,
        urlInput
    );


    if (urlInput) {

        setTimeout(
            function () {

                urlInput.select();
            },
            120
        );
    }
}


function buildOrganizationMemberCard(
    member
) {

    const userId =
        Number(
            member.user_id ||
            member.id ||
            0
        );


    const fullName =
        String(
            member.full_name ||
            member.name ||
            "Kullanıcı"
        )
            .trim();


    const email =
        String(
            member.email ||
            ""
        )
            .trim();


    const role =
        normalizeOrganizationRole(
            member.role
        ) ||
        "viewer";


    const isActive =
        member.is_active === true ||
        member.is_active === 1 ||
        member.is_active === "1";


    const isCurrentUser =
        member.is_current_user ===
        true;


    const invitationPending =
        member.invitation_pending === true ||
        member.invitation_pending === 1 ||
        member.invitation_pending === "1";


    const canManage =
        canManageOrganization();


    const isOwner =
        role ===
        "owner";


    const initials =
        getInitials(
            fullName
        );


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "organization-member-card";


    card.dataset.userId =
        String(
            userId
        );


    const disabled =
        (
            !canManage ||
            isCurrentUser ||
            isOwner
        )
            ? " disabled"
            : "";


    const roleControl =
        (
            canManage &&
            !isCurrentUser &&
            !isOwner
        )
            ? (
                '<select class="organization-member-role-select" ' +
                'data-member-action="role"' +
                disabled +
                ">" +
                getOrganizationRoleOptions(
                    role,
                    false
                ) +
                "</select>"
            )
            : (
                '<span class="organization-role-badge">' +
                escapeOrganizationHtml(
                    getOrganizationRoleLabel(
                        role
                    )
                ) +
                "</span>"
            );


    const statusControl =
        invitationPending
            ? (
                '<span class="organization-member-status pending" ' +
                'title="Kullanıcı daveti kabul edip şifresini belirlediğinde üyelik aktifleşir">' +
                '<i class="fa-regular fa-clock"></i> Davet Bekliyor' +
                "</span>"
            )
            : (
                (
                    canManage &&
                    !isCurrentUser &&
                    !isOwner
                )
                    ? (
                        '<button type="button" ' +
                        'class="organization-member-status-button" ' +
                        'data-member-action="status" ' +
                        'data-active="' +
                        (
                            isActive
                                ? "1"
                                : "0"
                        ) +
                        '">' +
                        (
                            isActive
                                ? "Aktif"
                                : "Pasif"
                        ) +
                        "</button>"
                    )
                    : (
                        '<span class="organization-member-status ' +
                        (
                            isActive
                                ? "active"
                                : "inactive"
                        ) +
                        '">' +
                        (
                            isActive
                                ? "Aktif"
                                : "Pasif"
                        ) +
                        "</span>"
                    )
            );


    card.innerHTML =
        '<div class="organization-member-avatar">' +
        escapeOrganizationHtml(
            initials
        ) +
        "</div>" +

        '<div class="organization-member-info">' +
        "<strong>" +
        escapeOrganizationHtml(
            fullName
        ) +
        "</strong>" +
        "<span>" +
        escapeOrganizationHtml(
            email
        ) +
        "</span>" +
        "</div>" +

        '<div class="organization-member-role">' +
        roleControl +
        (
            isCurrentUser
                ? "<small>Siz</small>"
                : ""
        ) +
        "</div>" +

        '<div class="organization-member-actions">' +
        statusControl +
        "</div>";


    return card;
}


function renderOrganizationMembers(
    members
) {

    if (!organizationMembersList) {
        return;
    }


    organizationMembersList.innerHTML =
        "";


    const safeMembers =
        Array.isArray(
            members
        )
            ? members
            : [];


    if (
        safeMembers.length ===
        0
    ) {

        const emptyState =
            document.createElement(
                "div"
            );


        emptyState.className =
            "notification-empty-state";


        emptyState.innerHTML =
            '<div class="notification-empty-icon">' +
            '<i class="fa-solid fa-users"></i>' +
            "</div>" +
            "<strong>Henüz ekip üyesi yok</strong>" +
            "<span>Organizasyona üye eklendiğinde burada görüntülenecek.</span>";


        organizationMembersList
            .appendChild(
                emptyState
            );


        return;
    }


    safeMembers
        .forEach(
            function (member) {

                organizationMembersList
                    .appendChild(
                        buildOrganizationMemberCard(
                            member
                        )
                    );
            }
        );
}


async function loadOrganizationManagementData() {

    if (!organizationModal) {
        return;
    }


    setOrganizationManagementAccess();


    try {

        const [
            organizationResponse,
            membersResponse
        ] =
            await Promise.all([
                fetchJson(
                    ORGANIZATION_API.details,
                    {
                        method: "GET"
                    }
                ),

                fetchJson(
                    ORGANIZATION_API.members,
                    {
                        method: "GET"
                    }
                )
            ]);


        const organization =
            organizationResponse.organization ||
            organizationResponse.data ||
            organizationResponse;


        if (
            organization?.name
        ) {

            updateOrganizationNamePresentation(
                organization.name
            );
        }


        const members =
            membersResponse.members ||
            membersResponse.data ||
            [];


        renderOrganizationMembers(
            members
        );

    } catch (error) {

        if (
            error.status ===
            404
        ) {

            return;
        }


        console.error(
            "Organizasyon bilgileri yüklenemedi:",
            error
        );


        showToast(
            error.message ||
            "Organizasyon bilgileri yüklenemedi."
        );
    }
}


async function openOrganizationModal() {

    configureOrganizationRoleSelect();


    openModal(
        organizationModal,
        organizationNameInput
    );


    await loadOrganizationManagementData();
}


function closeOrganizationModal() {

    closeModal(
        organizationModal
    );
}


if (
    organizationSettingsButton &&
    ["owner", "admin"].includes(
        CURRENT_ROLE
    )
) {

    organizationSettingsButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                openOrganizationModal();
            }
        );
}


if (
    openOrganizationFromAccountButton &&
    ["owner", "admin"].includes(
        CURRENT_ROLE
    )
) {

    openOrganizationFromAccountButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                closeAccountModal();


                setTimeout(
                    function () {

                        openOrganizationModal();
                    },
                    80
                );
            }
        );
}


if (
    closeOrganizationModalButton
) {

    closeOrganizationModalButton
        .addEventListener(
            "click",
            closeOrganizationModal
        );
}


if (
    closeOrganizationModalFooterButton
) {

    closeOrganizationModalFooterButton
        .addEventListener(
            "click",
            closeOrganizationModal
        );
}


if (
    organizationModal
) {

    organizationModal
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    organizationModal
                ) {

                    closeOrganizationModal();
                }
            }
        );
}


if (
    cancelOrganizationMemberButton
) {

    cancelOrganizationMemberButton
        .addEventListener(
            "click",
            function () {

                organizationMemberForm
                    ?.reset();


                configureOrganizationRoleSelect();


                organizationMemberNameInput
                    ?.focus();
            }
        );
}if (
    saveOrganizationSettingsButton
) {

    saveOrganizationSettingsButton
        .addEventListener(
            "click",
            async function () {

                if (
                    !canManageOrganization()
                ) {

                    showToast(
                        "Bu işlem için yönetim yetkiniz bulunmuyor."
                    );

                    return;
                }


                const organizationName =
                    organizationNameInput
                        ?.value
                        .trim() ||
                    "";


                if (
                    organizationName.length <
                    2
                ) {

                    showToast(
                        "Organizasyon adı en az 2 karakter olmalıdır."
                    );


                    organizationNameInput
                        ?.focus();


                    return;
                }


                saveOrganizationSettingsButton.disabled =
                    true;


                try {

                    const response =
                        await fetchJson(
                            ORGANIZATION_API.details,
                            {
                                method: "PATCH",

                                body:
                                    JSON.stringify({
                                        name:
                                            organizationName
                                    })
                            }
                        );


                    const savedName =
                        response.organization
                            ?.name ||
                        response.name ||
                        organizationName;


                    updateOrganizationNamePresentation(
                        savedName
                    );


                    showToast(
                        "Organizasyon bilgileri güncellendi."
                    );

                } catch (error) {

                    showToast(
                        error.message ||
                        "Organizasyon güncellenemedi."
                    );

                } finally {

                    saveOrganizationSettingsButton.disabled =
                        !canManageOrganization();
                }
            }
        );
}


if (
    organizationMemberForm
) {

    organizationMemberForm
        .addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (
                    !canManageOrganization()
                ) {

                    showToast(
                        "Üye eklemek için yönetim yetkiniz bulunmuyor."
                    );

                    return;
                }


                const fullName =
                    organizationMemberNameInput
                        ?.value
                        .trim() ||
                    "";


                const email =
                    organizationMemberEmailInput
                        ?.value
                        .trim() ||
                    "";


                const role =
                    normalizeOrganizationRole(
                        organizationMemberRoleSelect
                            ?.value
                    ) ||
                    "viewer";


                const isActive =
                    organizationMemberStatusSelect
                        ?.value !==
                    "inactive";


                if (
                    fullName.length <
                    2
                ) {

                    showToast(
                        "Üye adı en az 2 karakter olmalıdır."
                    );


                    organizationMemberNameInput
                        ?.focus();


                    return;
                }


                if (
                    !isValidEmail(
                        email
                    )
                ) {

                    showToast(
                        "Geçerli bir e-posta adresi girin."
                    );


                    organizationMemberEmailInput
                        ?.focus();


                    return;
                }


                const submitButton =
                    organizationMemberForm
                        .querySelector(
                            'button[type="submit"]'
                        );


                if (submitButton) {

                    submitButton.disabled =
                        true;
                }


                try {

                    const response =
                        await fetchJson(
                            ORGANIZATION_API.members,
                            {
                                method: "POST",

                                body:
                                    JSON.stringify({
                                        full_name:
                                            fullName,

                                        email:
                                            email,

                                        role:
                                            role,

                                        is_active:
                                            isActive
                                    })
                            }
                        );


                    organizationMemberForm
                        .reset();


                    configureOrganizationRoleSelect();


                    await loadOrganizationManagementData();


                    if (
                        response.invitation
                            ?.url
                    ) {

                        showOrganizationInvitationResult(
                            response.invitation,
                            response.member || {
                                full_name:
                                    fullName,

                                email:
                                    email
                            }
                        );


                        showToast(
                            "Davet oluşturuldu. Bağlantıyı ekip üyesiyle paylaşın."
                        );

                    } else {

                        showToast(
                            response.message ||
                            "Ekip üyesi organizasyona eklendi."
                        );
                    }

                } catch (error) {

                    showToast(
                        error.message ||
                        "Ekip üyesi eklenemedi."
                    );

                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            !canManageOrganization();
                    }
                }
            }
        );
}


if (
    organizationMembersList
) {

    organizationMembersList
        .addEventListener(
            "change",
            async function (event) {

                const select =
                    event.target
                        .closest(
                            '[data-member-action="role"]'
                        );


                if (!select) {
                    return;
                }


                const card =
                    select.closest(
                        ".organization-member-card"
                    );


                if (
                    card?.querySelector(
                        ".organization-member-status.pending"
                    )
                ) {

                    showToast(
                        "Davet kabul edilmeden rol değişikliği yapılamaz."
                    );

                    await loadOrganizationManagementData();

                    return;
                }


                const userId =
                    Number(
                        card
                            ?.dataset
                            .userId ||
                        0
                    );


                if (!userId) {
                    return;
                }


                select.disabled =
                    true;


                try {

                    await fetchJson(
                        ORGANIZATION_API.members +
                        "/" +
                        userId,
                        {
                            method: "PATCH",

                            body:
                                JSON.stringify({
                                    role:
                                        normalizeOrganizationRole(
                                            select.value
                                        )
                                })
                        }
                    );


                    await loadOrganizationManagementData();


                    showToast(
                        "Kullanıcı rolü güncellendi."
                    );

                } catch (error) {

                    showToast(
                        error.message ||
                        "Rol güncellenemedi."
                    );


                    await loadOrganizationManagementData();

                } finally {

                    select.disabled =
                        false;
                }
            }
        );


    organizationMembersList
        .addEventListener(
            "click",
            async function (event) {

                const button =
                    event.target
                        .closest(
                            '[data-member-action="status"]'
                        );


                if (!button) {
                    return;
                }


                const card =
                    button.closest(
                        ".organization-member-card"
                    );


                const userId =
                    Number(
                        card
                            ?.dataset
                            .userId ||
                        0
                    );


                if (!userId) {
                    return;
                }


                const currentActive =
                    button.dataset.active ===
                    "1";


                button.disabled =
                    true;


                try {

                    await fetchJson(
                        ORGANIZATION_API.members +
                        "/" +
                        userId,
                        {
                            method: "PATCH",

                            body:
                                JSON.stringify({
                                    is_active:
                                        !currentActive
                                })
                        }
                    );


                    await loadOrganizationManagementData();


                    showToast(
                        !currentActive
                            ? "Kullanıcı aktif hale getirildi."
                            : "Kullanıcı pasif hale getirildi."
                    );

                } catch (error) {

                    showToast(
                        error.message ||
                        "Kullanıcı durumu güncellenemedi."
                    );


                    await loadOrganizationManagementData();

                } finally {

                    button.disabled =
                        false;
                }
            }
        );
}


/* =========================================================
   17. SECURITY MODAL
========================================================= */

function clearPasswordFields() {

    if (currentPasswordInput) {

        currentPasswordInput.value =
            "";
    }


    if (newPasswordInput) {

        newPasswordInput.value =
            "";
    }


    if (confirmPasswordInput) {

        confirmPasswordInput.value =
            "";
    }
}


function resetPasswordVisibility() {

    passwordToggleButtons
        .forEach(
            function (button) {

                const targetId =
                    button.dataset.target;


                const input =
                    document.getElementById(
                        targetId
                    );


                if (input) {

                    input.type =
                        "password";
                }


                const icon =
                    button.querySelector(
                        "i"
                    );


                if (icon) {

                    icon.className =
                        "fa-regular fa-eye";
                }


                button.setAttribute(
                    "aria-label",
                    "Şifreyi göster"
                );
            }
        );
}


function openSecurityModal() {

    clearPasswordFields();

    resetPasswordVisibility();


    openModal(
        securityModal,
        currentPasswordInput
    );
}


function closeSecurityModal() {

    closeModal(
        securityModal
    );
}


if (securityButton) {

    securityButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                openSecurityModal();
            }
        );
}


if (closeSecurityModalButton) {

    closeSecurityModalButton
        .addEventListener(
            "click",
            closeSecurityModal
        );
}


if (cancelSecuritySettingsButton) {

    cancelSecuritySettingsButton
        .addEventListener(
            "click",
            closeSecurityModal
        );
}


if (securityModal) {

    securityModal
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    securityModal
                ) {

                    closeSecurityModal();
                }
            }
        );
}


/* =========================================================
   18. PASSWORD VISIBILITY
========================================================= */

passwordToggleButtons
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const targetId =
                        button.dataset.target;


                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (!input) {

                        return;
                    }


                    const icon =
                        button.querySelector(
                            "i"
                        );


                    const shouldShow =
                        input.type ===
                        "password";


                    input.type =
                        shouldShow
                            ? "text"
                            : "password";


                    if (icon) {

                        icon.className =
                            shouldShow
                                ? "fa-regular fa-eye-slash"
                                : "fa-regular fa-eye";
                    }


                    button.setAttribute(
                        "aria-label",
                        shouldShow
                            ? "Şifreyi gizle"
                            : "Şifreyi göster"
                    );
                }
            );
        }
    );


/* =========================================================
   19. PASSWORD FORM
========================================================= */

if (passwordForm) {

    passwordForm
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const currentPassword =
                    currentPasswordInput
                        ?.value ||
                    "";


                const newPassword =
                    newPasswordInput
                        ?.value ||
                    "";


                const confirmPassword =
                    confirmPasswordInput
                        ?.value ||
                    "";


                if (
                    currentPassword.length ===
                    0
                ) {

                    showToast(
                        "Mevcut şifrenizi girin."
                    );


                    currentPasswordInput
                        ?.focus();


                    return;
                }


                if (
                    newPassword.length <
                    8
                ) {

                    showToast(
                        "Yeni şifre en az 8 karakter olmalıdır."
                    );


                    newPasswordInput
                        ?.focus();


                    return;
                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    showToast(
                        "Yeni şifreler eşleşmiyor."
                    );


                    confirmPasswordInput
                        ?.focus();


                    return;
                }


                if (
                    currentPassword ===
                    newPassword
                ) {

                    showToast(
                        "Yeni şifre mevcut şifreden farklı olmalıdır."
                    );


                    newPasswordInput
                        ?.focus();


                    return;
                }


                /*
                   Burada backend parola değiştirme endpointi
                   bağlanabilir.

                   Şimdilik arayüz validasyonu ve modal akışı
                   korunuyor.
                */


                clearPasswordFields();

                resetPasswordVisibility();

                closeSecurityModal();


                showToast(
                    "Şifre güncelleme isteği hazır."
                );
            }
        );
}


/* =========================================================
   20. EMAIL MODAL
========================================================= */

function populateEmailModal() {

    const account =
        getStoredAccountPreferences();


    if (
        emailSettingsAddressInput
    ) {

        emailSettingsAddressInput.value =
            account.email;
    }


    if (
        emailModalCurrentAddress
    ) {

        emailModalCurrentAddress.textContent =
            account.email ||
            "E-posta adresi tanımlı değil";
    }


    updateEmailVerificationUI(
        account.emailVerified
    );
}


function openEmailModal() {

    populateEmailModal();


    openModal(
        emailModal,
        emailSettingsAddressInput
    );
}


function closeEmailModal() {

    closeModal(
        emailModal
    );
}


if (emailSettingsButton) {

    emailSettingsButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                openEmailModal();
            }
        );
}


if (closeEmailModalButton) {

    closeEmailModalButton
        .addEventListener(
            "click",
            closeEmailModal
        );
}


if (cancelEmailSettingsButton) {

    cancelEmailSettingsButton
        .addEventListener(
            "click",
            closeEmailModal
        );
}


if (emailModal) {

    emailModal
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    emailModal
                ) {

                    closeEmailModal();
                }
            }
        );
}/* =========================================================
   22. UPDATE EMAIL
========================================================= */

if (emailSettingsForm) {

    emailSettingsForm
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const newEmail =
                    emailSettingsAddressInput
                        ?.value
                        .trim() ||
                    "";


                if (
                    !isValidEmail(
                        newEmail
                    )
                ) {

                    showToast(
                        "Geçerli bir e-posta adresi girin."
                    );

                    return;
                }


                const preferences =
                    getStoredAccountPreferences();


                preferences.email =
                    newEmail;


                preferences.emailVerified =
                    false;


                if (
                    !saveAccountPreferences(
                        preferences
                    )
                ) {

                    showToast(
                        "E-posta kaydedilemedi."
                    );

                    return;
                }


                if (
                    accountEmailInput
                ) {

                    accountEmailInput.value =
                        newEmail;
                }


                if (
                    emailModalCurrentAddress
                ) {

                    emailModalCurrentAddress
                        .textContent =
                            newEmail;
                }


                updateProfilePresentation(
                    preferences.displayName,
                    newEmail
                );


                updateEmailVerificationUI(
                    false
                );


                createNotification({
                    type: "account",
                    level: "warning",
                    title: "E-posta doğrulaması gerekli",
                    message:
                        "Hesap e-posta adresi değiştirildi. Yeni adres doğrulanana kadar doğrulama durumu beklemede kalacaktır.",
                    dedupeKey:
                        "account-email-verification-required"
                });


                closeEmailModal();


                showToast(
                    "E-posta adresi güncellendi."
                );
            }
        );
}


/* =========================================================
   23. EMAIL VERIFICATION
========================================================= */

if (
    sendVerificationEmailButton
) {

    sendVerificationEmailButton
        .addEventListener(
            "click",
            function () {

                showToast(
                    "E-posta doğrulama servisi henüz backend'e bağlanmadı."
                );
            }
        );
}


/* =========================================================
   24. PROFESSIONAL NOTIFICATION CENTER
========================================================= */


/* ---------------------------------------------------------
   STORAGE
--------------------------------------------------------- */

function loadNotifications() {

    const saved =
        getLocalStorageValue(
            NOTIFICATION_STORAGE_KEY
        );


    if (!saved) {

        notifications = [];

        return;
    }


    try {

        const parsed =
            JSON.parse(saved);


        if (
            !Array.isArray(
                parsed
            )
        ) {

            notifications = [];

            return;
        }


        notifications =
            parsed
                .filter(
                    function (notification) {

                        return (
                            notification &&
                            typeof notification ===
                            "object" &&
                            notification.id
                        );
                    }
                )
                .map(
                    function (notification) {

                        return {

                            id:
                                String(
                                    notification.id
                                ),

                            type:
                                ALLOWED_NOTIFICATION_TYPES
                                    .includes(
                                        notification.type
                                    )
                                        ? notification.type
                                        : "system",

                            level:
                                ALLOWED_NOTIFICATION_LEVELS
                                    .includes(
                                        notification.level
                                    )
                                        ? notification.level
                                        : "info",

                            title:
                                String(
                                    notification.title ||
                                    "Bildirim"
                                ),

                            message:
                                String(
                                    notification.message ||
                                    ""
                                ),

                            createdAt:
                                notification.createdAt ||
                                new Date()
                                    .toISOString(),

                            read:
                                notification.read ===
                                true,

                            url:
                                typeof notification.url ===
                                "string" &&
                                notification.url
                                    .startsWith(
                                        "/"
                                    )
                                    ? notification.url
                                    : null,

                            dedupeKey:
                                notification.dedupeKey
                                    ? String(
                                        notification.dedupeKey
                                    )
                                    : null
                        };
                    }
                )
                .slice(
                    0,
                    MAX_NOTIFICATION_HISTORY
                );


    } catch (error) {

        console.warn(
            "Bildirim geçmişi okunamadı:",
            error
        );


        notifications = [];
    }
}


function saveNotifications() {

    return setLocalStorageValue(

        NOTIFICATION_STORAGE_KEY,

        JSON.stringify(
            notifications
        )
    );
}


/* ---------------------------------------------------------
   CREATE NOTIFICATION
--------------------------------------------------------- */

function createNotification({
    type = "system",
    level = "info",
    title = "Bildirim",
    message = "",
    url = null,
    dedupeKey = null
} = {}) {

    const normalizedType =
        ALLOWED_NOTIFICATION_TYPES
            .includes(type)
                ? type
                : "system";


    const normalizedLevel =
        ALLOWED_NOTIFICATION_LEVELS
            .includes(level)
                ? level
                : "info";


    const normalizedTitle =
        String(
            title ||
            "Bildirim"
        )
            .trim()
            .substring(
                0,
                120
            );


    const normalizedMessage =
        String(
            message ||
            ""
        )
            .trim()
            .substring(
                0,
                500
            );


    const normalizedUrl =
        typeof url ===
        "string" &&
        url.startsWith("/")
            ? url
            : null;


    const normalizedDedupeKey =
        dedupeKey
            ? String(
                dedupeKey
            )
            : null;


    /*
       Aynı olayın kısa süre içinde birden fazla kez
       gönderilmesi durumunda bildirim merkezinin
       yinelenen kayıtlarla dolmasını engeller.
    */

    if (normalizedDedupeKey) {

        const duplicate =
            notifications
                .find(
                    function (notification) {

                        if (
                            notification.dedupeKey !==
                            normalizedDedupeKey
                        ) {

                            return false;
                        }


                        const createdAt =
                            new Date(
                                notification.createdAt
                            )
                                .getTime();


                        return (
                            Number.isFinite(
                                createdAt
                            ) &&
                            (
                                Date.now() -
                                createdAt
                            ) <
                            5000
                        );
                    }
                );


        if (duplicate) {

            return duplicate;
        }
    }


    const notification = {

        id:
            (
                Date.now()
                    .toString(36) +
                Math.random()
                    .toString(36)
                    .substring(
                        2,
                        8
                    )
            ),

        type:
            normalizedType,

        level:
            normalizedLevel,

        title:
            normalizedTitle,

        message:
            normalizedMessage,

        createdAt:
            new Date()
                .toISOString(),

        read:
            false,

        url:
            normalizedUrl,

        dedupeKey:
            normalizedDedupeKey
    };


    notifications.unshift(
        notification
    );


    if (
        notifications.length >
        MAX_NOTIFICATION_HISTORY
    ) {

        notifications =
            notifications.slice(
                0,
                MAX_NOTIFICATION_HISTORY
            );
    }


    saveNotifications();

    renderNotifications();


    return notification;
}


/* ---------------------------------------------------------
   EXTERNAL NOTIFICATION API
--------------------------------------------------------- */

window.CustomerIntelligenceNotifications = {

    add:
        createNotification,

    addRisk:
        function ({
            level = "danger",
            title = "Risk Uyarısı",
            message = "",
            url = "/history",
            dedupeKey = null
        } = {}) {

            return createNotification({
                type: "risk",
                level,
                title,
                message,
                url,
                dedupeKey
            });
        },

    addSystem:
        function ({
            level = "info",
            title = "Sistem Bildirimi",
            message = "",
            url = null,
            dedupeKey = null
        } = {}) {

            return createNotification({
                type: "system",
                level,
                title,
                message,
                url,
                dedupeKey
            });
        },

    addAssistant:
        function ({
            level = "info",
            title = "AI Asistan",
            message = "",
            url = "/assistant",
            dedupeKey = null
        } = {}) {

            return createNotification({
                type: "assistant",
                level,
                title,
                message,
                url,
                dedupeKey
            });
        },

    addScenario:
        function ({
            level = "info",
            title = "Senaryo Analizi",
            message = "",
            url = "/prediction",
            dedupeKey = null
        } = {}) {

            return createNotification({
                type: "scenario",
                level,
                title,
                message,
                url,
                dedupeKey
            });
        },

    addReport:
        function ({
            level = "success",
            title = "Rapor",
            message = "",
            url = "/reports",
            dedupeKey = null
        } = {}) {

            return createNotification({
                type: "report",
                level,
                title,
                message,
                url,
                dedupeKey
            });
        },

    addAccount:
        function ({
            level = "info",
            title = "Hesap",
            message = "",
            url = null,
            dedupeKey = null
        } = {}) {

            return createNotification({
                type: "account",
                level,
                title,
                message,
                url,
                dedupeKey
            });
        },

    getAll:
        function () {

            return [
                ...notifications
            ];
        },

    getUnreadCount:
        getUnreadNotificationCount,

    markAllRead:
        markAllNotificationsAsRead,

    refresh:
        renderNotifications
};


/*
   Diğer JS dosyaları isterse şöyle bildirim ekleyebilir:

   window.CustomerIntelligenceNotifications.add({
       type: "risk",
       level: "danger",
       title: "Yüksek Riskli Tahmin",
       message: "Yeni yüksek riskli müşteri tahmini oluşturuldu.",
       url: "/history"
   });
*/


window.addEventListener(
    "customer-intelligence:notification",
    function (event) {

        const detail =
            event.detail;


        if (
            detail &&
            typeof detail ===
            "object"
        ) {

            createNotification(
                detail
            );
        }
    }
);


/* ---------------------------------------------------------
   COUNTERS
--------------------------------------------------------- */

function getUnreadNotificationCount() {

    return notifications
        .filter(
            function (notification) {

                return (
                    notification.read !==
                    true
                );
            }
        )
        .length;
}


/* ---------------------------------------------------------
   ICON
--------------------------------------------------------- */

function getNotificationIcon(
    notification
) {

    if (
        notification.type ===
        "risk" ||
        notification.level ===
        "danger" ||
        notification.level ===
        "risk"
    ) {

        return "fa-solid fa-triangle-exclamation";
    }


    if (
        notification.type ===
        "assistant"
    ) {

        return "fa-solid fa-brain";
    }


    if (
        notification.type ===
        "scenario"
    ) {

        return "fa-solid fa-chart-line";
    }


    if (
        notification.type ===
        "report"
    ) {

        return "fa-solid fa-file-lines";
    }


    if (
        notification.type ===
        "account"
    ) {

        return "fa-solid fa-user-shield";
    }


    if (
        notification.level ===
        "warning"
    ) {

        return "fa-solid fa-circle-exclamation";
    }


    if (
        notification.level ===
        "success"
    ) {

        return "fa-solid fa-circle-check";
    }


    if (
        notification.type ===
        "system"
    ) {

        return "fa-solid fa-shield-halved";
    }


    return "fa-regular fa-bell";
}


function getNotificationLevelClass(
    notification
) {

    if (
        notification.type ===
        "risk"
    ) {

        return "risk";
    }


    if (
        notification.level ===
        "danger"
    ) {

        return "danger";
    }


    if (
        notification.level ===
        "warning"
    ) {

        return "warning";
    }


    if (
        notification.level ===
        "success"
    ) {

        return "success";
    }


    if (
        notification.type ===
        "system"
    ) {

        return "system";
    }


    return "info";
}


function getNotificationTypeLabel(
    notification
) {

    const labels = {

        risk:
            "RİSK",

        system:
            "SİSTEM",

        assistant:
            "AI",

        scenario:
            "SENARYO",

        report:
            "RAPOR",

        account:
            "HESAP"
    };


    return (
        labels[
            notification.type
        ] ||
        "SİSTEM"
    );
}


/* ---------------------------------------------------------
   DATE FORMAT
--------------------------------------------------------- */

function formatNotificationTime(
    createdAt
) {

    const date =
        new Date(
            createdAt
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    const now =
        new Date();


    const difference =
        Math.max(
            0,
            now.getTime() -
            date.getTime()
        );


    const minute =
        60 * 1000;


    const hour =
        60 * minute;


    const day =
        24 * hour;


    if (
        difference <
        minute
    ) {

        return "Şimdi";
    }


    if (
        difference <
        hour
    ) {

        return (
            Math.floor(
                difference /
                minute
            ) +
            " dk önce"
        );
    }


    if (
        difference <
        day
    ) {

        return (
            Math.floor(
                difference /
                hour
            ) +
            " sa önce"
        );
    }


    if (
        difference <
        7 * day
    ) {

        return (
            Math.floor(
                difference /
                day
            ) +
            " gün önce"
        );
    }


    return date
        .toLocaleDateString(
            "tr-TR",
            {
                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric"
            }
        );
}


/* ---------------------------------------------------------
   FILTER
--------------------------------------------------------- */

function getFilteredNotifications() {

    if (
        activeNotificationFilter ===
        "unread"
    ) {

        return notifications
            .filter(
                function (notification) {

                    return (
                        notification.read !==
                        true
                    );
                }
            );
    }


    if (
        activeNotificationFilter ===
        "risk"
    ) {

        return notifications
            .filter(
                function (notification) {

                    return (
                        notification.type ===
                        "risk"
                    );
                }
            );
    }


    if (
        activeNotificationFilter ===
        "system"
    ) {

        return notifications
            .filter(
                function (notification) {

                    return (
                        notification.type !==
                        "risk"
                    );
                }
            );
    }


    return [
        ...notifications
    ];
}function updateNotificationSummary() {

    const unreadCount =
        getUnreadNotificationCount();


    if (
        notificationUnreadCount
    ) {

        notificationUnreadCount
            .textContent =
                String(
                    unreadCount
                );
    }


    if (
        notificationDot
    ) {

        notificationDot.hidden =
            unreadCount === 0;


        notificationDot
            .classList
            .toggle(
                "is-hidden",
                unreadCount === 0
            );
    }


    if (
        notificationSummaryTitle
    ) {

        if (
            notifications.length ===
            0
        ) {

            notificationSummaryTitle
                .textContent =
                    "Bildirim bulunmuyor";

        } else if (
            unreadCount ===
            0
        ) {

            notificationSummaryTitle
                .textContent =
                    "Tüm bildirimler okundu";

        } else {

            notificationSummaryTitle
                .textContent =
                    `${unreadCount} okunmamış bildirim`;
        }
    }


    if (
        notificationSummaryText
    ) {

        notificationSummaryText
            .textContent =
                notifications.length ===
                0
                    ? "Yeni sistem olayları ve önemli risk uyarıları burada görüntülenecek."
                    : "Sistem olaylarını ve önemli risk uyarılarını buradan takip edebilirsiniz.";
    }
}


/* ---------------------------------------------------------
   EMPTY STATE
--------------------------------------------------------- */

function createNotificationEmptyState() {

    const emptyState =
        document.createElement(
            "div"
        );


    emptyState.className =
        "notification-empty-state";


    const icon =
        document.createElement(
            "div"
        );


    icon.className =
        "notification-empty-icon";


    const iconElement =
        document.createElement(
            "i"
        );


    iconElement.className =
        "fa-regular fa-bell-slash";


    icon.appendChild(
        iconElement
    );


    const title =
        document.createElement(
            "strong"
        );


    const text =
        document.createElement(
            "span"
        );


    if (
        notifications.length ===
        0
    ) {

        title.textContent =
            "Bildirim bulunmuyor";


        text.textContent =
            "Yeni bir sistem olayı veya önemli tahmin uyarısı oluştuğunda burada görünecek.";

    } else {

        title.textContent =
            "Bu filtrede bildirim yok";


        text.textContent =
            "Başka bir filtre seçerek diğer bildirimleri görüntüleyebilirsiniz.";
    }


    emptyState.append(
        icon,
        title,
        text
    );


    return emptyState;
}


/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */

function renderNotifications() {

    if (
        !notificationList
    ) {

        return;
    }


    updateNotificationSummary();


    notificationList
        .replaceChildren();


    const items =
        getFilteredNotifications()
            .sort(
                function (a, b) {

                    return (
                        new Date(
                            b.createdAt
                        ) -
                        new Date(
                            a.createdAt
                        )
                    );
                }
            );


    if (
        items.length ===
        0
    ) {

        notificationList
            .appendChild(
                createNotificationEmptyState()
            );


        return;
    }


    items.forEach(
        function (notification) {


            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                "notification-item";


            if (
                notification.read !==
                true
            ) {

                item.classList.add(
                    "unread"
                );
            }


            item.dataset.notificationId =
                notification.id;


            const icon =
                document.createElement(
                    "span"
                );


            icon.className =
                (
                    "notification-item-icon " +
                    getNotificationLevelClass(
                        notification
                    )
                );


            const iconElement =
                document.createElement(
                    "i"
                );


            iconElement.className =
                getNotificationIcon(
                    notification
                );


            icon.appendChild(
                iconElement
            );


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "notification-item-content";


            const titleRow =
                document.createElement(
                    "div"
                );


            titleRow.className =
                "notification-item-title-row";


            const title =
                document.createElement(
                    "strong"
                );


            title.className =
                "notification-item-title";


            title.textContent =
                notification.title;


            const badge =
                document.createElement(
                    "span"
                );


            badge.className =
                "notification-item-badge";


            badge.textContent =
                getNotificationTypeLabel(
                    notification
                );


            titleRow.append(
                title,
                badge
            );


            const message =
                document.createElement(
                    "p"
                );


            message.className =
                "notification-item-message";


            message.textContent =
                notification.message;


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "notification-item-meta";


            const time =
                document.createElement(
                    "span"
                );


            const timeIcon =
                document.createElement(
                    "i"
                );


            timeIcon.className =
                "fa-regular fa-clock";


            time.append(
                timeIcon,
                document.createTextNode(
                    formatNotificationTime(
                        notification.createdAt
                    )
                )
            );


            const status =
                document.createElement(
                    "span"
                );


            const statusIcon =
                document.createElement(
                    "i"
                );


            statusIcon.className =
                notification.read
                    ? "fa-solid fa-check"
                    : "fa-solid fa-circle";


            status.append(
                statusIcon,
                document.createTextNode(
                    notification.read
                        ? "Okundu"
                        : "Okunmamış"
                )
            );


            meta.append(
                time,
                status
            );


            content.append(
                titleRow,
                message,
                meta
            );


            const action =
                document.createElement(
                    "span"
                );


            action.className =
                "notification-item-action";


            const actionIcon =
                document.createElement(
                    "i"
                );


            actionIcon.className =
                notification.url
                    ? "fa-solid fa-arrow-up-right-from-square"
                    : (
                        notification.read
                            ? "fa-regular fa-envelope"
                            : "fa-regular fa-envelope-open"
                    );


            action.appendChild(
                actionIcon
            );


            item.append(
                icon,
                content,
                action
            );


            item.addEventListener(
                "click",
                function () {

                    markNotificationAsRead(
                        notification.id
                    );


                    if (
                        notification.url
                    ) {

                        closeNotificationPanel();


                        window.location.href =
                            notification.url;
                    }
                }
            );


            notificationList
                .appendChild(
                    item
                );
        }
    );
}


/* ---------------------------------------------------------
   MARK READ
--------------------------------------------------------- */

function markNotificationAsRead(
    notificationId
) {

    const target =
        notifications.find(
            function (notification) {

                return (
                    notification.id ===
                    notificationId
                );
            }
        );


    if (!target) {

        return;
    }


    if (
        target.read !==
        true
    ) {

        target.read =
            true;


        saveNotifications();

        renderNotifications();
    }
}


function markAllNotificationsAsRead() {

    let changed =
        false;


    notifications
        .forEach(
            function (notification) {

                if (
                    notification.read !==
                    true
                ) {

                    notification.read =
                        true;


                    changed =
                        true;
                }
            }
        );


    if (changed) {

        saveNotifications();
    }


    renderNotifications();
}


/* ---------------------------------------------------------
   CLEAR
--------------------------------------------------------- */

function clearNotifications() {

    if (
        notifications.length ===
        0
    ) {

        return;
    }


    const confirmed =
        window.confirm(
            "Tüm bildirimleri temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        );


    if (!confirmed) {

        return;
    }


    notifications =
        [];


    saveNotifications();


    activeNotificationFilter =
        "all";


    notificationFilterButtons
        .forEach(
            function (button) {

                button
                    .classList
                    .toggle(
                        "active",
                        button.dataset
                            .notificationFilter ===
                        "all"
                    );
            }
        );


    renderNotifications();
}


/* ---------------------------------------------------------
   OPEN / CLOSE
--------------------------------------------------------- */

function openNotificationPanel() {

    if (
        !notificationPanel ||
        !notificationButton
    ) {

        return;
    }


    closeProfileMenu();

    closeAllModals();


    notificationPanel
        .classList
        .add(
            "open"
        );


    notificationPanel
        .setAttribute(
            "aria-hidden",
            "false"
        );


    notificationButton
        .setAttribute(
            "aria-expanded",
            "true"
        );


    renderNotifications();
}


function closeNotificationPanel() {

    if (
        !notificationPanel ||
        !notificationButton
    ) {

        return;
    }


    notificationPanel
        .classList
        .remove(
            "open"
        );


    notificationPanel
        .setAttribute(
            "aria-hidden",
            "true"
        );


    notificationButton
        .setAttribute(
            "aria-expanded",
            "false"
        );
}


function toggleNotificationPanel(
    event
) {

    if (
        !notificationPanel ||
        !notificationButton
    ) {

        return;
    }


    if (event) {

        event.preventDefault();

        event.stopPropagation();
    }


    const isOpen =
        notificationPanel
            .classList
            .contains(
                "open"
            );


    if (isOpen) {

        closeNotificationPanel();

    } else {

        openNotificationPanel();
    }
}


/* ---------------------------------------------------------
   BUTTON EVENTS
--------------------------------------------------------- */

if (
    notificationButton &&
    notificationPanel
) {

    notificationButton
        .addEventListener(
            "click",
            toggleNotificationPanel
        );


    notificationPanel
        .addEventListener(
            "click",
            function (event) {

                event.stopPropagation();
            }
        );
}


if (
    closeNotificationPanelButton
) {

    closeNotificationPanelButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeNotificationPanel();
            }
        );
}


if (
    markAllNotificationsReadButton
) {

    markAllNotificationsReadButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                markAllNotificationsAsRead();
            }
        );
}


if (
    clearNotificationsButton
) {

    clearNotificationsButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                clearNotifications();
            }
        );
}


/* ---------------------------------------------------------
   FILTER EVENTS
--------------------------------------------------------- */

notificationFilterButtons
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const filter =
                        button.dataset
                            .notificationFilter ||
                        "all";


                    activeNotificationFilter =
                        ALLOWED_NOTIFICATION_FILTERS
                            .includes(
                                filter
                            )
                            ? filter
                            : "all";


                    notificationFilterButtons
                        .forEach(
                            function (
                                otherButton
                            ) {

                                otherButton
                                    .classList
                                    .toggle(
                                        "active",
                                        otherButton ===
                                        button
                                    );
                            }
                        );


                    renderNotifications();
                }
            );
        }
    );


/* ---------------------------------------------------------
   OUTSIDE CLICK
--------------------------------------------------------- */

document.addEventListener(
    "click",
    function (event) {

        if (
            !notificationPanel
                ?.classList
                .contains(
                    "open"
                )
        ) {

            return;
        }


        const wrapper =
            notificationButton
                ?.closest(
                    ".notification-wrapper"
                );


        if (
            wrapper &&
            !wrapper.contains(
                event.target
            )
        ) {

            closeNotificationPanel();
        }
    }
);/* ---------------------------------------------------------
   PROFILE NOTIFICATION SETTINGS
--------------------------------------------------------- */

if (
    notificationSettingsButton
) {

    notificationSettingsButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                closeProfileMenu();


                openNotificationPanel();
            }
        );
}


/* =========================================================
   24. HELP CENTER
========================================================= */

function openHelpModal() {

    openModal(
        helpModal,
        closeHelpModalButton
    );
}


function closeHelpModal() {

    closeModal(
        helpModal
    );
}


if (helpButton) {

    helpButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                openHelpModal();
            }
        );
}


if (closeHelpModalButton) {

    closeHelpModalButton
        .addEventListener(
            "click",
            closeHelpModal
        );
}


if (closeHelpModalFooterButton) {

    closeHelpModalFooterButton
        .addEventListener(
            "click",
            closeHelpModal
        );
}


if (helpModal) {

    helpModal
        .addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    helpModal
                ) {

                    closeHelpModal();
                }
            }
        );
}


/* =========================================================
   25. GLOBAL SEARCH
========================================================= */

function findSearchResult(query) {

    const normalizedQuery =
        normalizeSearchText(
            query
        );


    if (!normalizedQuery) {

        return null;
    }


    let bestResult =
        null;


    let bestScore =
        0;


    ROLE_SEARCH_ITEMS
        .forEach(
            function (item) {

                const title =
                    normalizeSearchText(
                        item.title
                    );


                const keywords =
                    item.keywords
                        .map(
                            normalizeSearchText
                        );


                let score =
                    0;


                if (
                    title ===
                    normalizedQuery
                ) {

                    score =
                        100;
                }


                else if (
                    keywords.includes(
                        normalizedQuery
                    )
                ) {

                    score =
                        90;
                }


                else if (
                    title.startsWith(
                        normalizedQuery
                    )
                ) {

                    score =
                        80;
                }


                else if (
                    keywords.some(
                        function (keyword) {

                            return keyword
                                .startsWith(
                                    normalizedQuery
                                );
                        }
                    )
                ) {

                    score =
                        70;
                }


                else if (
                    title.includes(
                        normalizedQuery
                    )
                ) {

                    score =
                        60;
                }


                else if (
                    keywords.some(
                        function (keyword) {

                            return keyword
                                .includes(
                                    normalizedQuery
                                );
                        }
                    )
                ) {

                    score =
                        50;
                }


                if (
                    score >
                    bestScore
                ) {

                    bestScore =
                        score;


                    bestResult =
                        item;
                }
            }
        );


    return bestResult;
}


function executeSearchAction(
    result
) {

    if (!result) {

        return;
    }


    if (
        result.type ===
        "page"
    ) {

        if (
            result.url &&
            !canCurrentRoleAccessUrl(
                result.url
            )
        ) {

            showToast(
                "Bu sayfa için yetkiniz bulunmuyor."
            );

            return;
        }


        window.location.href =
            result.url;


        return;
    }


    if (
        result.type !==
        "action"
    ) {

        return;
    }


    switch (
        result.action
    ) {

        case "settings":

            openAccountModal();

            break;


        case "help":

            openHelpModal();

            break;


        case "security":

            openSecurityModal();

            break;


        case "email":

            openEmailModal();

            break;


        case "notifications":

            openNotificationPanel();

            break;


        default:

            showToast(
                "Bu işlem henüz kullanılamıyor."
            );
    }
}


function runGlobalSearch() {

    if (
        !globalSearchInput
    ) {

        return;
    }


    const query =
        globalSearchInput
            .value
            .trim();


    if (!query) {

        showToast(
            "Aramak istediğiniz bölümü yazın."
        );


        globalSearchInput
            .focus();


        return;
    }


    const result =
        findSearchResult(
            query
        );


    if (!result) {

        showToast(
            `"${query}" için sonuç bulunamadı.`
        );


        return;
    }


    globalSearchInput.value =
        "";


    executeSearchAction(
        result
    );
}


if (globalSearchInput) {

    globalSearchInput
        .addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Enter"
                ) {

                    return;
                }


                event.preventDefault();


                runGlobalSearch();
            }
        );


    globalSearchInput
        .addEventListener(
            "search",
            function () {

                if (
                    !globalSearchInput.value
                ) {

                    globalSearchInput
                        .blur();
                }
            }
        );
}


/* =========================================================
   26. LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                closeProfileMenu();


                const logoutUrl =
                    logoutButton
                        .dataset
                        .logoutUrl ||
                    "/logout";


                logoutButton.disabled =
                    true;


                logoutButton.setAttribute(
                    "aria-busy",
                    "true"
                );


                window.location.assign(
                    logoutUrl
                );
            }
        );
}


/* =========================================================
   28. ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !==
            "Escape"
        ) {

            return;
        }


        const roleWorkspaceModal =
            document.getElementById(
                "role-workspace-modal"
            );


        if (
            roleWorkspaceModal
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeModal(
                roleWorkspaceModal
            );

            return;
        }


        if (
            notificationPanel
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeNotificationPanel();

            return;
        }


        if (
            helpModal
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeHelpModal();

            return;
        }


        if (
            emailModal
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeEmailModal();

            return;
        }


        if (
            securityModal
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeSecurityModal();

            return;
        }


        if (
            organizationModal
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeOrganizationModal();

            return;
        }


        if (
            accountModal
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeAccountModal();

            return;
        }


        if (
            profileMenu
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeProfileMenu();

            return;
        }


        if (
            sidebar
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeSidebar();

            return;
        }


        if (
            document.activeElement ===
            globalSearchInput
        ) {

            globalSearchInput.value =
                "";


            globalSearchInput.blur();
        }
    }
);


/* =========================================================
   NOTIFICATION STORAGE SYNC
   Aynı uygulamanın birden fazla sekmesi açıksa bildirim
   geçmişinin sekmeler arasında güncel kalmasını sağlar.
========================================================= */

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key !==
            NOTIFICATION_STORAGE_KEY
        ) {

            return;
        }


        loadNotifications();

        renderNotifications();
    }
);


/* =========================================================
   29. WINDOW EVENTS
========================================================= */

window.addEventListener(
    "resize",
    function () {

        if (
            window.innerWidth >
            900
        ) {

            closeSidebar();
        }
    }
);/* =========================================================
   30. INITIALIZATION
========================================================= */


function ensureOrganizationInvitationStyles() {

    if (
        document.getElementById(
            "organization-invitation-runtime-styles"
        )
    ) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "organization-invitation-runtime-styles";


    style.textContent = `
        .organization-member-status.pending {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-height: 27px;
            padding: 0 9px;
            border: 1px solid rgba(215, 161, 50, 0.18);
            border-radius: 999px;
            background: rgba(215, 161, 50, 0.08);
            color: #e1b65c;
            font-size: 7px;
            font-weight: 800;
            white-space: nowrap;
        }

        .organization-invitation-result-modal
            #organization-invitation-result-url {
            width: 100%;
            min-width: 0;
        }

        body[data-theme="light"]
            .organization-member-status.pending {
            border-color: rgba(164, 111, 0, 0.2);
            background: rgba(164, 111, 0, 0.07);
            color: #8a5f00;
        }
    `;


    document.head.appendChild(
        style
    );
}


function initializeApplication() {

    ensureOrganizationInvitationStyles();


    /* -----------------------------------------------------
       THEME
    ----------------------------------------------------- */

    const savedTheme =
        getLocalStorageValue(
            THEME_STORAGE_KEY
        );


    setTheme(
        savedTheme ||
        "midnight",
        false
    );


    /* -----------------------------------------------------
       ACCOUNT
       Kullanıcı kimliği backend/Jinja tarafından gelir.
       LocalStorage yalnızca arayüz tercihleri için kullanılır.
    ----------------------------------------------------- */

    loadSavedAccountPreferences();


    /* -----------------------------------------------------
       ORGANIZATION
    ----------------------------------------------------- */

    configureOrganizationRoleSelect();

    setOrganizationManagementAccess();


    /* -----------------------------------------------------
       PASSWORDS
    ----------------------------------------------------- */

    resetPasswordVisibility();


    /* -----------------------------------------------------
       RESET MODALS
    ----------------------------------------------------- */

    document
        .querySelectorAll(
            ".modal-backdrop.open, .modal-overlay.open"
        )
        .forEach(
            function (modal) {

                modal
                    .classList
                    .remove(
                        "open"
                    );


                modal
                    .setAttribute(
                        "aria-hidden",
                        "true"
                    );
            }
        );


    document.body.style.overflow =
        "";


    /* -----------------------------------------------------
       NOTIFICATION CENTER
    ----------------------------------------------------- */

    loadNotifications();


    activeNotificationFilter =
        "all";


    notificationFilterButtons
        .forEach(
            function (button) {

                button
                    .classList
                    .toggle(
                        "active",
                        button.dataset
                            .notificationFilter ===
                        "all"
                    );
            }
        );


    closeNotificationPanel();


    renderNotifications();


    /* -----------------------------------------------------
       ROLE WORKSPACE
    ----------------------------------------------------- */

    if (
        roleWorkspaceButton
    ) {

        roleWorkspaceButton
            .setAttribute(
                "data-role",
                CURRENT_ROLE
            );
    }


    /* -----------------------------------------------------
       DEBUG
    ----------------------------------------------------- */

    console.info(
        "Customer Intelligence Platform initialized."
    );


    console.info(
        "Current role:",
        CURRENT_ROLE
    );


    console.info(
        "Settings button:",
        Boolean(
            settingsButton
        )
    );


    console.info(
        "Account modal:",
        Boolean(
            accountModal
        )
    );


    console.info(
        "Help modal:",
        Boolean(
            helpModal
        )
    );


    console.info(
        "Notification center:",
        Boolean(
            notificationPanel
        )
    );


    console.info(
        "Global search:",
        Boolean(
            globalSearchInput
        )
    );


    console.info(
        "Role workspace:",
        Boolean(
            roleWorkspaceButton
        )
    );
}


/* =========================================================
   31. START APPLICATION
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApplication,
        {
            once: true
        }
    );

} else {

    initializeApplication();
}