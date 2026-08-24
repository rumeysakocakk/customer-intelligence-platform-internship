document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // AYARLAR
    // =========================================================

    const STORAGE_KEY = "customer_intelligence_ai_chats";

    const MAX_MESSAGE_LENGTH = 2000;
    const MAX_TITLE_LENGTH = 70;


    // =========================================================
    // ELEMENTLER
    // =========================================================

    const page =
        document.getElementById("assistant-page");

    const messagesContainer =
        document.getElementById("assistant-messages");

    const chatScroll =
        document.getElementById("assistant-chat-scroll");

    const welcome =
        document.getElementById("assistant-welcome");

    const input =
        document.getElementById("assistant-input");

    const sendButton =
        document.getElementById("assistant-send");

    const characterCount =
        document.getElementById("assistant-character-count");


    // Sohbet geçmişi

    const historyList =
        document.getElementById("assistant-history-list");

    const historyEmpty =
        document.getElementById("assistant-history-empty");

    const historySearch =
        document.getElementById("assistant-history-search");

    const dateFilter =
        document.getElementById("assistant-history-date-filter");

    const categoryFilter =
        document.getElementById("assistant-history-category-filter");

    const sortFilter =
        document.getElementById("assistant-history-sort");

    const resetFiltersButton =
        document.getElementById("assistant-reset-filters");


    // Sohbet başlığı

    const currentChatTitle =
        document.getElementById("assistant-current-chat-title");

    const renameButton =
        document.getElementById("assistant-rename-chat");


    // Yeni sohbet

    const newChatButton =
        document.getElementById("assistant-new-chat");

    const newChatWideButton =
        document.getElementById("assistant-new-chat-wide");


    // Sohbet araçları

    const scrollBottomButton =
        document.getElementById("assistant-scroll-bottom");

    const clearChatButton =
        document.getElementById("assistant-clear-chat");


    // Silme modalı

    const deleteModal =
        document.getElementById("assistant-delete-modal");

    const deleteCancel =
        document.getElementById("assistant-delete-cancel");

    const deleteConfirm =
        document.getElementById("assistant-delete-confirm");

    const deleteCloseButton =
        document.querySelector("[data-close-delete]");


    // Yeniden adlandırma modalı

    const renameModal =
        document.getElementById("assistant-rename-modal");

    const renameInput =
        document.getElementById("assistant-rename-input");

    const renameCancel =
        document.getElementById("assistant-rename-cancel");

    const renameConfirm =
        document.getElementById("assistant-rename-confirm");

    const renameCloseButton =
        document.querySelector("[data-close-rename]");


    // AI durum alanı

    const serviceStatus =
        document.getElementById("assistant-service-status");

    const serviceText =
        document.getElementById("assistant-service-text");

    const modelName =
        document.getElementById("assistant-model-name");


    // Hazır sorular

    const suggestionButtons =
        document.querySelectorAll(
            ".assistant-suggestion-card"
        );


    // =========================================================
    // DURUM
    // =========================================================

    let conversations = [];

    let activeConversationId = null;

    let pendingDeleteConversationId = null;

    let sending = false;


    // =========================================================
    // YARDIMCI FONKSİYONLAR
    // =========================================================

    function generateId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 9)
        );

    }


    function nowIso() {

        return new Date().toISOString();

    }


    function formatTime(value) {

        const date =
            value
                ? new Date(value)
                : new Date();

        return date.toLocaleTimeString(
            "tr-TR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function normalizeText(value) {

        return String(value || "")
            .toLocaleLowerCase("tr-TR")
            .replace(/\s+/g, " ")
            .trim();

    }


    function truncateText(
        value,
        maxLength = 46
    ) {

        const text =
            String(value || "")
                .replace(/\s+/g, " ")
                .trim();


        if (!text) {

            return "Yeni Sohbet";

        }


        if (
            text.length <= maxLength
        ) {

            return text;

        }


        return (
            text.substring(
                0,
                maxLength
            ) +
            "..."
        );

    }


    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value ?? "";

        return div.innerHTML;

    }


    function startOfToday() {

        const date =
            new Date();

        date.setHours(
            0,
            0,
            0,
            0
        );

        return date;

    }


    function isValidDate(value) {

        const date =
            new Date(value);

        return !Number.isNaN(
            date.getTime()
        );

    }


    // =========================================================
    // LOCAL STORAGE
    // =========================================================

    function loadConversations() {

        try {

            const stored =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!stored) {

                conversations = [];

                return;

            }


            const parsed =
                JSON.parse(stored);


            if (
                !Array.isArray(parsed)
            ) {

                conversations = [];

                return;

            }


            conversations =
                parsed.map(
                    function (conversation) {

                        return {

                            id:
                                conversation.id ||
                                generateId(),

                            title:
                                conversation.title ||
                                "Yeni Sohbet",

                            customTitle:
                                Boolean(
                                    conversation.customTitle
                                ),

                            createdAt:
                                conversation.createdAt ||
                                nowIso(),

                            updatedAt:
                                conversation.updatedAt ||
                                conversation.createdAt ||
                                nowIso(),

                            messages:
                                Array.isArray(
                                    conversation.messages
                                )
                                    ? conversation.messages
                                    : []

                        };

                    }
                );


        } catch (error) {

            console.warn(
                "Sohbet geçmişi yüklenemedi:",
                error
            );

            conversations = [];

        }

    }


    function saveConversations() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    conversations
                )
            );


        } catch (error) {

            console.warn(
                "Sohbet geçmişi kaydedilemedi:",
                error
            );

        }

    }


    // =========================================================
    // SOHBET YÖNETİMİ
    // =========================================================

    function getActiveConversation() {

        return conversations.find(
            function (conversation) {

                return (
                    conversation.id ===
                    activeConversationId
                );

            }
        );

    }


    function createConversation() {

        const conversation = {

            id:
                generateId(),

            title:
                "Yeni Sohbet",

            customTitle:
                false,

            createdAt:
                nowIso(),

            updatedAt:
                nowIso(),

            messages:
                []

        };


        conversations.unshift(
            conversation
        );


        activeConversationId =
            conversation.id;


        saveConversations();

        renderHistory();

        renderConversation();

        focusMessageInput();


        return conversation;

    }


    function ensureConversation() {

        const existing =
            getActiveConversation();


        if (existing) {

            return existing;

        }


        return createConversation();

    }


    function updateAutomaticTitle(
        conversation
    ) {

        if (
            !conversation ||
            conversation.customTitle
        ) {

            return;

        }


        const firstUserMessage =
            conversation.messages.find(
                function (message) {

                    return (
                        message.role ===
                        "user"
                    );

                }
            );


        conversation.title =
            firstUserMessage
                ? truncateText(
                    firstUserMessage.content,
                    46
                )
                : "Yeni Sohbet";

    }


    function updateDisplayedTitle() {

        const conversation =
            getActiveConversation();


        if (!currentChatTitle) {

            return;

        }


        currentChatTitle.textContent =
            conversation
                ? conversation.title
                : "Yeni Sohbet";

    }


    function startNewChat() {

        const emptyConversation =
            conversations.find(
                function (conversation) {

                    return (
                        !conversation.messages ||
                        conversation.messages.length === 0
                    );

                }
            );


        if (emptyConversation) {

            activeConversationId =
                emptyConversation.id;

            renderHistory();

            renderConversation();

            focusMessageInput();

            return;

        }


        createConversation();

    }


    // =========================================================
    // SOHBET KATEGORİSİ
    // =========================================================

    function classifyConversation(
        conversation
    ) {

        const text =
            normalizeText(
                [
                    conversation.title,
                    ...(conversation.messages || [])
                        .map(
                            function (message) {

                                return message.content;

                            }
                        )
                ].join(" ")
            );


        const riskWords = [

            "risk",
            "yüksek risk",
            "orta risk",
            "düşük risk",
            "riskli",
            "unsatisfied",
            "memnuniyetsizlik"

        ];


        const satisfactionWords = [

            "memnuniyet",
            "müşteri memnuniyeti",
            "satisfaction",
            "memnun",
            "müşteri deneyimi"

        ];


        const predictionWords = [

            "tahmin",
            "prediction",
            "model tahmini",
            "olasılık",
            "skor"

        ];


        const reportWords = [

            "rapor",
            "report",
            "özet",
            "yönetici özeti",
            "istatistik"

        ];


        if (
            riskWords.some(
                function (word) {

                    return text.includes(word);

                }
            )
        ) {

            return "risk";

        }


        if (
            satisfactionWords.some(
                function (word) {

                    return text.includes(word);

                }
            )
        ) {

            return "satisfaction";

        }


        if (
            predictionWords.some(
                function (word) {

                    return text.includes(word);

                }
            )
        ) {

            return "prediction";

        }


        if (
            reportWords.some(
                function (word) {

                    return text.includes(word);

                }
            )
        ) {

            return "report";

        }


        return "general";

    }


    // =========================================================
    // TARİH GRUPLARI
    // =========================================================

    function getDateGroup(
        value
    ) {

        if (!isValidDate(value)) {

            return "Diğer";

        }


        const date =
            new Date(value);

        const today =
            startOfToday();


        const dateStart =
            new Date(date);

        dateStart.setHours(
            0,
            0,
            0,
            0
        );


        if (
            dateStart.getTime() ===
            today.getTime()
        ) {

            return "Bugün";

        }


        const yesterday =
            new Date(today);

        yesterday.setDate(
            yesterday.getDate() - 1
        );


        if (
            dateStart.getTime() ===
            yesterday.getTime()
        ) {

            return "Dün";

        }


        return date.toLocaleDateString(
            "tr-TR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }


    // =========================================================
    // TARİH FİLTRESİ
    // =========================================================

    function matchesDateFilter(
        conversation
    ) {

        if (!dateFilter) {

            return true;

        }


        const filterValue =
            dateFilter.value;


        if (
            !filterValue ||
            filterValue === "all"
        ) {

            return true;

        }


        const date =
            new Date(
                conversation.updatedAt
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return false;

        }


        const today =
            startOfToday();


        if (
            filterValue === "today"
        ) {

            return date >= today;

        }


        if (
            filterValue === "yesterday"
        ) {

            const yesterday =
                new Date(today);

            yesterday.setDate(
                yesterday.getDate() - 1
            );


            return (
                date >= yesterday &&
                date < today
            );

        }


        if (
            filterValue === "7days"
        ) {

            const sevenDaysAgo =
                new Date(today);

            sevenDaysAgo.setDate(
                sevenDaysAgo.getDate() - 7
            );


            return (
                date >= sevenDaysAgo
            );

        }


        if (
            filterValue === "30days"
        ) {

            const thirtyDaysAgo =
                new Date(today);

            thirtyDaysAgo.setDate(
                thirtyDaysAgo.getDate() - 30
            );


            return (
                date >= thirtyDaysAgo
            );

        }


        return true;

    }


    // =========================================================
    // FİLTRELENMİŞ SOHBETLER
    // =========================================================

    function getFilteredConversations() {

        const query =
            historySearch
                ? normalizeText(
                    historySearch.value
                )
                : "";


        const selectedCategory =
            categoryFilter
                ? categoryFilter.value
                : "all";


        let result =
            conversations.filter(
                function (conversation) {

                    const searchableText =
                        normalizeText(
                            conversation.title +
                            " " +
                            (conversation.messages || [])
                                .map(
                                    function (message) {

                                        return message.content;

                                    }
                                )
                                .join(" ")
                        );


                    const matchesSearch =
                        !query ||
                        searchableText.includes(
                            query
                        );


                    const conversationCategory =
                        classifyConversation(
                            conversation
                        );


                    const matchesCategory =
                        selectedCategory === "all" ||
                        selectedCategory ===
                        conversationCategory;


                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesDateFilter(
                            conversation
                        )
                    );

                }
            );


        const sortValue =
            sortFilter
                ? sortFilter.value
                : "newest";


        // En eski

        if (
            sortValue === "oldest"
        ) {

            result.sort(
                function (a, b) {

                    return (
                        new Date(
                            a.updatedAt
                        ) -
                        new Date(
                            b.updatedAt
                        )
                    );

                }
            );


        // Başlığa göre A-Z

        } else if (
            sortValue === "alphabetical"
        ) {

            result.sort(
                function (a, b) {

                    return String(
                        a.title || ""
                    ).localeCompare(
                        String(
                            b.title || ""
                        ),
                        "tr",
                        {
                            sensitivity:
                                "base"
                        }
                    );

                }
            );


        // Varsayılan: En yeni

        } else {

            result.sort(
                function (a, b) {

                    return (
                        new Date(
                            b.updatedAt
                        ) -
                        new Date(
                            a.updatedAt
                        )
                    );

                }
            );

        }


        return result;

    }


    // =========================================================
    // SOHBET GEÇMİŞİ
    // =========================================================

    function renderHistory() {

        if (!historyList) {

            return;

        }


        historyList.innerHTML =
            "";


        const items =
            getFilteredConversations();


        if (
            items.length === 0
        ) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "assistant-history-empty";


            const hasConversations =
                conversations.length > 0;


            empty.innerHTML = `

                <div class="assistant-empty-icon">

                    <i class="${
                        hasConversations
                            ? "fa-solid fa-magnifying-glass"
                            : "fa-regular fa-comments"
                    }"></i>

                </div>

                <strong>

                    ${
                        hasConversations
                            ? "Sonuç bulunamadı"
                            : "Henüz sohbet yok"
                    }

                </strong>

                <span>

                    ${
                        hasConversations
                            ? "Arama veya filtre kriterlerinize uygun bir sohbet bulunamadı."
                            : "İlk konuşmanız başladığında burada görünecek."
                    }

                </span>

            `;


            historyList.appendChild(
                empty
            );


            updateDisplayedTitle();

            return;

        }


        let currentGroup =
            null;


        items.forEach(
            function (conversation) {

                const group =
                    getDateGroup(
                        conversation.updatedAt
                    );


                if (
                    group !== currentGroup
                ) {

                    currentGroup =
                        group;


                    const groupTitle =
                        document.createElement(
                            "div"
                        );


                    groupTitle.className =
                        "assistant-history-group-title";


                    groupTitle.textContent =
                        group;


                    historyList.appendChild(
                        groupTitle
                    );

                }


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "assistant-history-item";


                if (
                    conversation.id ===
                    activeConversationId
                ) {

                    item.classList.add(
                        "is-active"
                    );

                }


                item.dataset.conversationId =
                    conversation.id;


                const icon =
                    document.createElement(
                        "div"
                    );


                icon.className =
                    "assistant-history-item-icon";


                icon.innerHTML =
                    '<i class="fa-regular fa-message"></i>';


                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "assistant-history-item-content";


                const title =
                    document.createElement(
                        "div"
                    );


                title.className =
                    "assistant-history-item-title";


                title.textContent =
                    conversation.title ||
                    "Yeni Sohbet";


                const time =
                    document.createElement(
                        "div"
                    );


                time.className =
                    "assistant-history-item-time";


                const category =
                    classifyConversation(
                        conversation
                    );


                const categoryLabels = {

                    risk:
                        "Risk",

                    satisfaction:
                        "Memnuniyet",

                    prediction:
                        "Tahmin",

                    report:
                        "Rapor",

                    general:
                        "Genel"

                };


                time.textContent =
                    formatTime(
                        conversation.updatedAt
                    ) +
                    " · " +
                    categoryLabels[
                        category
                    ];


                content.appendChild(
                    title
                );


                content.appendChild(
                    time
                );


                const deleteButton =
                    document.createElement(
                        "button"
                    );


                deleteButton.className =
                    "assistant-history-delete";


                deleteButton.type =
                    "button";


                deleteButton.title =
                    "Sohbeti sil";


                deleteButton.setAttribute(
                    "aria-label",
                    "Sohbeti sil"
                );


                deleteButton.innerHTML =
                    '<i class="fa-regular fa-trash-can"></i>';


                item.appendChild(
                    icon
                );


                item.appendChild(
                    content
                );


                item.appendChild(
                    deleteButton
                );


                item.addEventListener(
                    "click",
                    function () {

                        activeConversationId =
                            conversation.id;


                        renderHistory();

                        renderConversation();

                    }
                );


                deleteButton.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        openDeleteModal(
                            conversation.id
                        );

                    }
                );


                historyList.appendChild(
                    item
                );

            }
        );


        updateDisplayedTitle();

    }


    // =========================================================
    // MARKDOWN
    // =========================================================

    function formatMarkdown(
        text
    ) {

        if (!text) {

            return "";

        }


        let safe =
            escapeHtml(text);


        // Kod blokları

        safe =
            safe.replace(
                /```([\s\S]*?)```/g,
                function (_, code) {

                    return (
                        "<pre><code>" +
                        code.trim() +
                        "</code></pre>"
                    );

                }
            );


        // Başlıklar

        safe =
            safe.replace(
                /^####\s+(.+)$/gm,
                "<h4>$1</h4>"
            );


        safe =
            safe.replace(
                /^###\s+(.+)$/gm,
                "<h3>$1</h3>"
            );


        safe =
            safe.replace(
                /^##\s+(.+)$/gm,
                "<h2>$1</h2>"
            );


        safe =
            safe.replace(
                /^#\s+(.+)$/gm,
                "<h1>$1</h1>"
            );


        // Kalın

        safe =
            safe.replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>"
            );


        // Inline code

        safe =
            safe.replace(
                /`([^`]+)`/g,
                "<code>$1</code>"
            );


        // Quote

        safe =
            safe.replace(
                /^&gt;\s?(.+)$/gm,
                "<blockquote>$1</blockquote>"
            );


        const lines =
            safe.split("\n");


        let html =
            "";


        let inBulletList =
            false;


        let inOrderedList =
            false;


        function closeLists() {

            if (inBulletList) {

                html += "</ul>";

                inBulletList =
                    false;

            }


            if (inOrderedList) {

                html += "</ol>";

                inOrderedList =
                    false;

            }

        }


        lines.forEach(
            function (line) {

                const trimmed =
                    line.trim();


                if (!trimmed) {

                    closeLists();

                    return;

                }


                if (
                    trimmed.startsWith(
                        "<h1>"
                    ) ||
                    trimmed.startsWith(
                        "<h2>"
                    ) ||
                    trimmed.startsWith(
                        "<h3>"
                    ) ||
                    trimmed.startsWith(
                        "<h4>"
                    ) ||
                    trimmed.startsWith(
                        "<blockquote>"
                    ) ||
                    trimmed.startsWith(
                        "<pre>"
                    )
                ) {

                    closeLists();

                    html += trimmed;

                    return;

                }


                const bullet =
                    trimmed.match(
                        /^[-*•]\s+(.+)$/
                    );


                if (bullet) {

                    if (
                        inOrderedList
                    ) {

                        html += "</ol>";

                        inOrderedList =
                            false;

                    }


                    if (
                        !inBulletList
                    ) {

                        html += "<ul>";

                        inBulletList =
                            true;

                    }


                    html +=
                        "<li>" +
                        bullet[1] +
                        "</li>";


                    return;

                }


                const numbered =
                    trimmed.match(
                        /^\d+[.)]\s+(.+)$/
                    );


                if (numbered) {

                    if (
                        inBulletList
                    ) {

                        html += "</ul>";

                        inBulletList =
                            false;

                    }


                    if (
                        !inOrderedList
                    ) {

                        html += "<ol>";

                        inOrderedList =
                            true;

                    }


                    html +=
                        "<li>" +
                        numbered[1] +
                        "</li>";


                    return;

                }


                closeLists();


                html +=
                    "<p>" +
                    trimmed +
                    "</p>";

            }
        );


        closeLists();


        return html;

    }


    // =========================================================
    // MESAJ GÖRÜNTÜLEME
    // =========================================================

    function renderMessage(
        message
    ) {

        if (!messagesContainer) {

            return null;

        }


        if (
            welcome &&
            welcome.parentNode ===
            messagesContainer
        ) {

            welcome.remove();

        }


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "assistant-message " +
            message.role;


        row.dataset.messageId =
            message.id;


        const avatar =
            document.createElement(
                "div"
            );


        avatar.className =
            "assistant-message-avatar";


        avatar.innerHTML =
            message.role === "user"
                ? '<i class="fa-regular fa-user"></i>'
                : '<i class="fa-solid fa-sparkles"></i>';


        const body =
            document.createElement(
                "div"
            );


        body.className =
            "assistant-message-body";


        const meta =
            document.createElement(
                "div"
            );


        meta.className =
            "assistant-message-meta";


        const author =
            document.createElement(
                "strong"
            );


        author.textContent =
            message.role === "user"
                ? "Siz"
                : "Customer Intelligence AI";


        const time =
            document.createElement(
                "span"
            );


        time.textContent =
            message.time ||
            formatTime(
                message.createdAt
            );


        meta.appendChild(
            author
        );


        meta.appendChild(
            time
        );


        const content =
            document.createElement(
                "div"
            );


        content.className =
            "assistant-message-content";


        if (
            message.role ===
            "assistant"
        ) {

            content.innerHTML =
                formatMarkdown(
                    message.content
                );

        } else {

            content.textContent =
                message.content;

        }


        body.appendChild(
            meta
        );


        body.appendChild(
            content
        );


        row.appendChild(
            avatar
        );


        row.appendChild(
            body
        );


        messagesContainer.appendChild(
            row
        );


        return row;

    }


    // =========================================================
    // AKTİF SOHBET
    // =========================================================

    function renderConversation() {

        if (!messagesContainer) {

            return;

        }


        messagesContainer.innerHTML =
            "";


        const conversation =
            getActiveConversation();


        updateDisplayedTitle();


        if (
            !conversation ||
            !conversation.messages ||
            conversation.messages.length === 0
        ) {

            if (welcome) {

                messagesContainer.appendChild(
                    welcome
                );

                welcome.style.display =
                    "block";

            }


            return;

        }


        conversation.messages.forEach(
            function (message) {

                renderMessage(
                    message
                );

            }
        );


        scrollToBottom(
            false
        );

    }


    // =========================================================
    // MESAJ KAYDET
    // =========================================================

    function addMessage(
        role,
        content
    ) {

        const conversation =
            ensureConversation();


        const message = {

            id:
                generateId(),

            role:
                role,

            content:
                content,

            createdAt:
                nowIso(),

            time:
                formatTime(
                    new Date()
                )

        };


        conversation.messages.push(
            message
        );


        conversation.updatedAt =
            nowIso();


        updateAutomaticTitle(
            conversation
        );


        saveConversations();


        return message;

    }


    // =========================================================
    // DÜŞÜNÜYOR ANİMASYONU
    // =========================================================

    function renderThinking() {

        if (!messagesContainer) {

            return null;

        }


        if (
            welcome &&
            welcome.parentNode ===
            messagesContainer
        ) {

            welcome.remove();

        }


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "assistant-message";


        row.innerHTML = `

            <div class="assistant-message-avatar">
                <i class="fa-solid fa-sparkles"></i>
            </div>

            <div class="assistant-message-body">

                <div class="assistant-message-meta">

                    <strong>
                        Customer Intelligence AI
                    </strong>

                    <span>
                        düşünüyor...
                    </span>

                </div>

                <div class="assistant-message-content">

                    <div class="assistant-thinking">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                </div>

            </div>

        `;


        messagesContainer.appendChild(
            row
        );


        scrollToBottom();


        return row;

    }


    // =========================================================
    // MESAJ GÖNDER
    // =========================================================

    async function sendMessage(
        customText = null
    ) {

        if (sending) {

            return;

        }


        const text =
            customText !== null
                ? String(
                    customText
                ).trim()
                : input.value.trim();


        if (!text) {

            return;

        }


        if (
            text.length >
            MAX_MESSAGE_LENGTH
        ) {

            return;

        }


        sending =
            true;


        if (sendButton) {

            sendButton.disabled =
                true;

        }


        const userMessage =
            addMessage(
                "user",
                text
            );


        renderMessage(
            userMessage
        );


        renderHistory();

        updateDisplayedTitle();


        if (input) {

            input.value =
                "";

        }


        updateComposer();

        scrollToBottom();


        const loader =
            renderThinking();


        try {

            const response =
                await fetch(
                    "/api/ai-assistant",
                    {
                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        body:
                            JSON.stringify({
                                message:
                                    text
                            })

                    }
                );


            let data;


            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "Sunucudan geçerli JSON yanıtı alınamadı."
                );

            }


            if (loader) {

                loader.remove();

            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.details ||
                    "AI yanıtı alınamadı."
                );

            }


            const answer =
                String(
                    data.answer || ""
                ).trim();


            if (!answer) {

                throw new Error(
                    "AI servisi boş yanıt döndürdü."
                );

            }


            const assistantMessage =
                addMessage(
                    "assistant",
                    answer
                );


            renderMessage(
                assistantMessage
            );


            renderHistory();

            scrollToBottom();


        } catch (error) {

            if (
                loader &&
                loader.parentNode
            ) {

                loader.remove();

            }


            const errorMessage =
                addMessage(
                    "assistant",
                    "İstek tamamlanamadı. " +
                    (
                        error.message ||
                        "Bilinmeyen bir hata oluştu."
                    )
                );


            renderMessage(
                errorMessage
            );


            renderHistory();

            scrollToBottom();


        } finally {

            sending =
                false;


            if (sendButton) {

                sendButton.disabled =
                    false;

            }


            focusMessageInput();

        }

    }


    // =========================================================
    // SCROLL
    // =========================================================

    function scrollToBottom(
        smooth = true
    ) {

        if (!chatScroll) {

            return;

        }


        chatScroll.scrollTo({

            top:
                chatScroll.scrollHeight,

            behavior:
                smooth
                    ? "smooth"
                    : "auto"

        });

    }


    // =========================================================
    // TEXTAREA
    // =========================================================

    function updateComposer() {

        if (!input) {

            return;

        }


        input.style.height =
            "auto";


        input.style.height =
            Math.min(
                input.scrollHeight,
                125
            ) +
            "px";


        if (characterCount) {

            characterCount.textContent =
                input.value.length +
                " / " +
                MAX_MESSAGE_LENGTH;

        }

    }


    function focusMessageInput() {

        if (!input) {

            return;

        }


        setTimeout(
            function () {

                input.focus();

            },
            30
        );

    }


    // =========================================================
    // DELETE MODAL
    // =========================================================

    function openDeleteModal(
        conversationId
    ) {

        if (!deleteModal) {

            return;

        }


        pendingDeleteConversationId =
            conversationId;


        deleteModal.classList.add(
            "is-open"
        );


        deleteModal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";

    }


    function closeDeleteModal() {

        if (!deleteModal) {

            return;

        }


        deleteModal.classList.remove(
            "is-open"
        );


        deleteModal.setAttribute(
            "aria-hidden",
            "true"
        );


        pendingDeleteConversationId =
            null;


        document.body.style.overflow =
            "";

    }


    function confirmDeleteConversation() {

        if (
            !pendingDeleteConversationId
        ) {

            closeDeleteModal();

            return;

        }


        const conversationId =
            pendingDeleteConversationId;


        conversations =
            conversations.filter(
                function (conversation) {

                    return (
                        conversation.id !==
                        conversationId
                    );

                }
            );


        if (
            activeConversationId ===
            conversationId
        ) {

            const sorted =
                [...conversations]
                    .sort(
                        function (a, b) {

                            return (
                                new Date(
                                    b.updatedAt
                                ) -
                                new Date(
                                    a.updatedAt
                                )
                            );

                        }
                    );


            activeConversationId =
                sorted.length
                    ? sorted[0].id
                    : null;

        }


        saveConversations();


        closeDeleteModal();


        renderHistory();

        renderConversation();

    }


    // =========================================================
    // RENAME MODAL
    // =========================================================

    function openRenameModal() {

        const conversation =
            getActiveConversation();


        if (
            !conversation ||
            !renameModal ||
            !renameInput
        ) {

            return;

        }


        renameInput.value =
            conversation.title ||
            "";


        renameModal.classList.add(
            "is-open"
        );


        renameModal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";


        setTimeout(
            function () {

                renameInput.focus();

                renameInput.select();

            },
            60
        );

    }


    function closeRenameModal() {

        if (!renameModal) {

            return;

        }


        renameModal.classList.remove(
            "is-open"
        );


        renameModal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";

    }


    function saveRename() {

        const conversation =
            getActiveConversation();


        if (
            !conversation ||
            !renameInput
        ) {

            closeRenameModal();

            return;

        }


        const newTitle =
            renameInput.value
                .trim()
                .substring(
                    0,
                    MAX_TITLE_LENGTH
                );


        if (!newTitle) {

            renameInput.focus();

            return;

        }


        conversation.title =
            newTitle;


        conversation.customTitle =
            true;


        conversation.updatedAt =
            nowIso();


        saveConversations();


        closeRenameModal();


        renderHistory();

        renderConversation();

    }


    // =========================================================
    // AI DURUMU
    // =========================================================

    async function checkAIStatus() {

        if (
            !serviceStatus ||
            !serviceText ||
            !modelName
        ) {

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/ai-health",
                    {
                        method:
                            "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                throw new Error();

            }


            const data =
                await response.json();


            if (
                data.configured
            ) {

                serviceStatus
                    .classList
                    .remove(
                        "is-offline"
                    );


                serviceText.textContent =
                    "AI servisi hazır";


                modelName.textContent =
                    data.model ||
                    "Gemini";


            } else {

                throw new Error();

            }


        } catch {

            serviceStatus
                .classList
                .add(
                    "is-offline"
                );


            serviceText.textContent =
                "AI servisine ulaşılamıyor";


            modelName.textContent =
                "Bağlantı yok";

        }

    }


    // =========================================================
    // TEMA SENKRONİZASYONU
    // =========================================================

    function detectCurrentTheme() {

        const html =
            document.documentElement;


        const body =
            document.body;


        const candidates = [

            html.dataset.theme,

            body.dataset.theme,

            localStorage.getItem(
                "theme"
            ),

            localStorage.getItem(
                "selectedTheme"
            ),

            localStorage.getItem(
                "dashboardTheme"
            )

        ];


        const activeThemeButton =
            document.querySelector(
                ".theme-button.active"
            );


        if (
            activeThemeButton &&
            activeThemeButton.dataset.theme
        ) {

            candidates.unshift(
                activeThemeButton.dataset.theme
            );

        }


        const classText =
            (
                html.className +
                " " +
                body.className
            )
                .toLowerCase();


        if (
            classText.includes(
                "midnight"
            ) ||
            classText.includes(
                "dark"
            )
        ) {

            candidates.unshift(
                "midnight"
            );

        }


        if (
            classText.includes(
                "slate"
            )
        ) {

            candidates.unshift(
                "slate"
            );

        }


        for (
            const candidate
            of candidates
        ) {

            if (!candidate) {

                continue;

            }


            const value =
                String(candidate)
                    .toLowerCase();


            if (
                value.includes(
                    "midnight"
                ) ||
                value === "dark"
            ) {

                return "midnight";

            }


            if (
                value.includes(
                    "slate"
                )
            ) {

                return "slate";

            }


            if (
                value.includes(
                    "light"
                )
            ) {

                return "light";

            }

        }


        return "light";

    }


    function applyAssistantTheme() {

        if (!page) {

            return;

        }


        const theme =
            detectCurrentTheme();


        page.dataset.aiTheme =
            theme;


        document.documentElement
            .setAttribute(
                "data-ai-theme",
                theme
            );

    }


    function observeThemeChanges() {

        applyAssistantTheme();


        const observer =
            new MutationObserver(
                function () {

                    applyAssistantTheme();

                }
            );


        observer.observe(
            document.documentElement,
            {
                attributes:
                    true,

                attributeFilter: [
                    "class",
                    "data-theme"
                ]
            }
        );


        observer.observe(
            document.body,
            {
                attributes:
                    true,

                attributeFilter: [
                    "class",
                    "data-theme"
                ]
            }
        );


        document
            .querySelectorAll(
                ".theme-button"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            setTimeout(
                                applyAssistantTheme,
                                30
                            );

                        }
                    );

                }
            );

    }


    // =========================================================
    // FİLTRE TEMİZLE
    // =========================================================

    function resetFilters() {

        if (historySearch) {

            historySearch.value =
                "";

        }


        if (dateFilter) {

            dateFilter.value =
                "all";

        }


        if (categoryFilter) {

            categoryFilter.value =
                "all";

        }


        if (sortFilter) {

            sortFilter.value =
                "newest";

        }


        renderHistory();

    }


    // =========================================================
    // EVENTLER
    // =========================================================

    if (input) {

        input.addEventListener(
            "input",
            updateComposer
        );


        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    if (sendButton) {

        sendButton.addEventListener(
            "click",
            function () {

                sendMessage();

            }
        );

    }


    suggestionButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const question =
                        button.dataset.question;


                    if (question) {

                        sendMessage(
                            question
                        );

                    }

                }
            );

        }
    );


    if (newChatButton) {

        newChatButton.addEventListener(
            "click",
            startNewChat
        );

    }


    if (newChatWideButton) {

        newChatWideButton.addEventListener(
            "click",
            startNewChat
        );

    }


    if (scrollBottomButton) {

        scrollBottomButton.addEventListener(
            "click",
            function () {

                scrollToBottom();

            }
        );

    }


    if (clearChatButton) {

        clearChatButton.addEventListener(
            "click",
            function () {

                const conversation =
                    getActiveConversation();


                if (conversation) {

                    openDeleteModal(
                        conversation.id
                    );

                }

            }
        );

    }


    if (renameButton) {

        renameButton.addEventListener(
            "click",
            openRenameModal
        );

    }


    // =========================================================
    // SİLME MODALI
    // =========================================================

    if (deleteCancel) {

        deleteCancel.addEventListener(
            "click",
            closeDeleteModal
        );

    }


    if (deleteConfirm) {

        deleteConfirm.addEventListener(
            "click",
            confirmDeleteConversation
        );

    }


    if (deleteCloseButton) {

        deleteCloseButton.addEventListener(
            "click",
            closeDeleteModal
        );

    }


    if (deleteModal) {

        deleteModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    deleteModal
                ) {

                    closeDeleteModal();

                }

            }
        );

    }


    // =========================================================
    // BAŞLIK DÜZENLEME MODALI
    // =========================================================

    if (renameCancel) {

        renameCancel.addEventListener(
            "click",
            closeRenameModal
        );

    }


    if (renameConfirm) {

        renameConfirm.addEventListener(
            "click",
            saveRename
        );

    }


    if (renameCloseButton) {

        renameCloseButton.addEventListener(
            "click",
            closeRenameModal
        );

    }


    if (renameModal) {

        renameModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    renameModal
                ) {

                    closeRenameModal();

                }

            }
        );

    }


    if (renameInput) {

        renameInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    saveRename();

                }

            }
        );

    }


    // =========================================================
    // FİLTRELER
    // =========================================================

    if (historySearch) {

        historySearch.addEventListener(
            "input",
            renderHistory
        );

    }


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            renderHistory
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            renderHistory
        );

    }


    if (sortFilter) {

        sortFilter.addEventListener(
            "change",
            renderHistory
        );

    }


    if (resetFiltersButton) {

        resetFiltersButton.addEventListener(
            "click",
            resetFilters
        );

    }


    // =========================================================
    // ESC İLE MODAL KAPATMA
    // =========================================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            if (
                deleteModal &&
                deleteModal.classList.contains(
                    "is-open"
                )
            ) {

                closeDeleteModal();

            }


            if (
                renameModal &&
                renameModal.classList.contains(
                    "is-open"
                )
            ) {

                closeRenameModal();

            }

        }
    );


    // =========================================================
    // BAŞLANGIÇ
    // =========================================================

    function initializeAssistant() {

        loadConversations();


        if (
            conversations.length > 0
        ) {

            const sorted =
                [...conversations]
                    .sort(
                        function (a, b) {

                            return (
                                new Date(
                                    b.updatedAt
                                ) -
                                new Date(
                                    a.updatedAt
                                )
                            );

                        }
                    );


            activeConversationId =
                sorted[0].id;

        }


        observeThemeChanges();


        renderHistory();


        renderConversation();


        updateComposer();


        checkAIStatus();

    }


    initializeAssistant();

});