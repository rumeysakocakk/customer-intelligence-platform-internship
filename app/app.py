import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

from flask import (
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from google import genai
from google.genai import types
from werkzeug.security import check_password_hash, generate_password_hash

from src.database import (
    create_organization,
    create_user,
    get_analytics_summary,
    get_category_statistics,
    get_dashboard_metrics,
    get_delivery_statistics,
    get_payment_statistics,
    get_prediction_history,
    get_recent_predictions,
    get_risk_distribution,
    get_satisfaction_trend,
    get_state_statistics,
    get_user_by_email,
    get_user_by_id,
    get_user_organization,
    save_prediction,
)

from src.database import get_database_connection


from src.predictor import (
    predict_customer_satisfaction,
)


# ============================================================
# APPLICATION
# ============================================================

app = Flask(__name__)

# Session secret must be supplied through the environment in production.
# A development fallback keeps the local project usable while testing.
app.config["SECRET_KEY"] = os.getenv(
    "FLASK_SECRET_KEY",
    "customer-intelligence-local-development-key-change-me",
)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False


# ============================================================
# ORGANIZATION ROLE LABELS
# ============================================================

ORGANIZATION_ROLE_LABELS = {
    "owner": "Hesap Sahibi",
    "admin": "Yönetici",
    "analyst": "Analist",
    "operator": "Operasyon",
    "viewer": "Görüntüleyici",
}


def get_role_label(role):
    """
    Return the Turkish display label for an organization role.
    """

    normalized_role = str(
        role or ""
    ).strip().lower()

    return ORGANIZATION_ROLE_LABELS.get(
        normalized_role,
        "Kullanıcı",
    )


def set_authenticated_session(user):
    """
    Store the authenticated user's current organization context
    in the Flask session.

    Organization membership is the source of truth for role data.
    """

    session.clear()

    session["user_id"] = int(
        user["id"]
    )

    session["user_name"] = user[
        "full_name"
    ]

    session["user_email"] = user[
        "email"
    ]

    role = (
        user.get("organization_role")
        or user.get("role")
        or "viewer"
    )

    session["user_role"] = role

    session["user_role_label"] = (
        get_role_label(role)
    )

    organization_id = user.get(
        "organization_id"
    )

    if organization_id is not None:
        session["organization_id"] = int(
            organization_id
        )

    organization_name = user.get(
        "organization_name"
    )

    if organization_name:
        session["organization_name"] = (
            organization_name
        )

    organization_slug = user.get(
        "organization_slug"
    )

    if organization_slug:
        session["organization_slug"] = (
            organization_slug
        )




# ============================================================
# GEMINI CONFIGURATION
# ============================================================

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.5-flash-lite",
)


def get_gemini_client():
    """
    Gemini istemcisini oluşturur.

    API anahtarı kaynak kodda tutulmaz.
    GEMINI_API_KEY ortam değişkeninden okunur.
    """

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY ortam değişkeni bulunamadı."
        )

    return genai.Client(
        api_key=api_key
    )


# ============================================================
# AI ASSISTANT SETTINGS
# ============================================================

AI_SYSTEM_INSTRUCTION = """
Sen Customer Intelligence Platform içinde çalışan yapay zeka
destekli analiz asistanısın.

İki farklı türde soruyu cevaplayabilirsin:

1. Platformla ilgili sorular:
   - Model tahminlerini açıkla.
   - Risk seviyelerini yorumla.
   - Dashboard, analiz ve MySQL verilerini özetle.
   - Müşteri deneyimini geliştirecek uygulanabilir öneriler sun.
   - Model performans metriklerini sade şekilde açıkla.
   - Platformun kullanımıyla ilgili soruları cevapla.

2. Genel bilgi soruları:
   - Platformla ilgisi olmayan normal bilgi sorularını doğrudan cevapla.
   - Böyle bir soruda platform verilerini zorla kullanmaya çalışma.
   - Örneğin coğrafya, tarih, teknoloji veya genel kültür sorularına
     normal bir yapay zeka asistanı gibi yanıt ver.

Kurallar:

- Platform sorularında yalnızca sana verilen gerçek platform verilerini temel al.
- Veritabanında olmayan müşteri veya sipariş bilgilerini uydurma.
- Bir platform verisi mevcut değilse açıkça belirt.
- Tahmini kendinin ürettiğini söyleme.
- Tahminler sistemdeki makine öğrenmesi modeli tarafından üretilir.
- Genel bilgi sorularında platform verisi yok diye cevap vermeyi reddetme.
- Önerileri kısa, açık ve uygulanabilir tut.
- API anahtarı, veritabanı şifresi veya sistem kimlik bilgisi paylaşma.
- Kullanıcı İngilizce yazmadığı sürece Türkçe cevap ver.
"""


# ============================================================
# AI CONTEXT
# ============================================================

def build_ai_platform_context():
    """
    Asistana gönderilecek güncel platform verilerini hazırlar.

    Bir veri kaynağında hata oluşursa diğer verilerin
    kullanılmaya devam etmesi sağlanır.
    """

    try:
        metrics = get_dashboard_metrics()

    except Exception as error:
        app.logger.warning(
            "AI context metrics could not be loaded: %s",
            error,
        )

        metrics = {}


    try:
        risk_distribution = get_risk_distribution()

    except Exception as error:
        app.logger.warning(
            "AI context risk distribution could not be loaded: %s",
            error,
        )

        risk_distribution = {}


    try:
        recent_predictions = get_recent_predictions(
            limit=5
        )

    except Exception as error:
        app.logger.warning(
            "AI context recent predictions could not be loaded: %s",
            error,
        )

        recent_predictions = []


    try:
        category_statistics = get_category_statistics()

    except Exception as error:
        app.logger.warning(
            "AI context category statistics could not be loaded: %s",
            error,
        )

        category_statistics = []


    return {
        "metrics": metrics,
        "risk_distribution": risk_distribution,
        "recent_predictions": recent_predictions,
        "category_statistics": category_statistics,
    }


def is_platform_question(message):
    """
    Sorunun platform verileriyle ilişkili olup olmadığını belirler.

    Genel bilgi sorularında gereksiz yere veritabanı bağlamı
    gönderilmemesi için basit ve kontrollü bir anahtar kelime
    kontrolü kullanılır.
    """

    normalized_message = str(message).lower()

    platform_keywords = (
        "platform",
        "dashboard",
        "tahmin",
        "prediction",
        "müşteri",
        "memnuniyet",
        "memnuniyetsizlik",
        "risk",
        "sipariş",
        "order",
        "kategori",
        "category",
        "teslimat",
        "delivery",
        "ödeme",
        "payment",
        "model",
        "performans",
        "accuracy",
        "precision",
        "recall",
        "f1",
        "veri",
        "database",
        "mysql",
        "analiz",
        "analytics",
        "rapor",
        "geçmiş",
        "olasılık",
        "probability",
    )

    return any(
        keyword in normalized_message
        for keyword in platform_keywords
    )


def build_ai_prompt(
    message,
    platform_context=None,
):
    """
    Kullanıcı mesajını Gemini için hazırlar.

    Platformla ilgili sorularda güncel MySQL verileri prompt içine
    eklenir. Genel bilgi sorularında ise yalnızca kullanıcının sorusu
    gönderilir.
    """

    if not is_platform_question(message):

        return f"""
KULLANICI SORUSU:

{message}


CEVAP KURALLARI:

- Bu soru Customer Intelligence Platform verileriyle ilgili değil.
- Soruyu genel bilginle doğrudan ve doğru şekilde cevapla.
- Platform verilerinden, tahminlerden veya MySQL kayıtlarından gereksiz yere bahsetme.
- Kullanıcı İngilizce yazmadığı sürece Türkçe cevap ver.
- Kullanıcı özel olarak istemedikçe gereksiz derecede uzun cevap verme.
"""

    context_json = json.dumps(
        platform_context or {},
        ensure_ascii=False,
        indent=2,
        default=str,
    )

    return f"""
KULLANICI SORUSU:

{message}


PLATFORMDAKİ GÜNCEL MYSQL VERİLERİ:

{context_json}


CEVAP KURALLARI:

- Soruyu yukarıdaki gerçek platform verilerine göre cevapla.
- Veriler arasında bulunmayan müşteri veya sipariş bilgilerini uydurma.
- Risk, müşteri memnuniyeti, tahmin, analiz ve model metriklerini gerektiğinde açıkla.
- Veriler yetersizse bunu açıkça belirt.
- Yönetici tarafından okunabilecek net ve profesyonel bir dil kullan.
- Kullanıcı özel olarak istemedikçe gereksiz derecede uzun cevap verme.
"""

# ============================================================
# AUTHENTICATION
# ============================================================

def login_required(view_function):
    """
    Protect a page or API endpoint that requires an authenticated user.
    """

    @wraps(view_function)
    def wrapped_view(*args, **kwargs):

        user_id = session.get(
            "user_id"
        )

        if not user_id:

            if request.path.startswith("/api/") or request.path == "/predict":

                return jsonify({
                    "success": False,
                    "error": "Bu işlem için oturum açmanız gerekiyor.",
                }), 401

            return redirect(
                url_for(
                    "login",
                    next=request.full_path
                    if request.query_string
                    else request.path,
                )
            )

        try:

            user = get_user_by_id(
                user_id
            )

        except Exception:

            user = None

        if (
            not user
            or not user.get("is_active")
            or not user.get("organization_id")
            or user.get("membership_is_active") is False
            or user.get("organization_is_active") is False
        ):

            session.clear()

            if request.path.startswith("/api/") or request.path == "/predict":

                return jsonify({
                    "success": False,
                    "error": "Oturum veya organizasyon üyeliği artık geçerli değil.",
                }), 401

            flash(
                "Oturumunuzun yeniden doğrulanması gerekiyor.",
                "warning",
            )

            return redirect(
                url_for("login")
            )

        return view_function(*args, **kwargs)

    return wrapped_view


def role_required(*allowed_roles):
    """
    Protect a page or API endpoint by organization role.

    The current role is reloaded from the database on every request,
    so the Flask session is not treated as the source of truth for authorization.
    """

    allowed_roles_normalized = {
        str(role).strip().lower()
        for role in allowed_roles
    }

    def decorator(view_function):

        @wraps(view_function)
        def wrapped_view(*args, **kwargs):

            user_id = session.get("user_id")

            if not user_id:

                if request.path.startswith("/api/") or request.path == "/predict":

                    return jsonify({
                        "success": False,
                        "error": "Bu işlem için oturum açmanız gerekiyor.",
                    }), 401

                return redirect(
                    url_for(
                        "login",
                        next=request.full_path
                        if request.query_string
                        else request.path,
                    )
                )

            try:
                user = get_user_by_id(user_id)
            except Exception:
                user = None

            if (
                not user
                or not user.get("is_active")
                or not user.get("organization_id")
                or user.get("membership_is_active") is False
                or user.get("organization_is_active") is False
            ):

                session.clear()

                if request.path.startswith("/api/") or request.path == "/predict":
                    return jsonify({
                        "success": False,
                        "error": "Oturum veya organizasyon üyeliği geçerli değil.",
                    }), 401

                flash(
                    "Oturumunuzun yeniden doğrulanması gerekiyor.",
                    "warning",
                )
                return redirect(url_for("login"))

            current_role = str(
                user.get("organization_role")
                or user.get("role")
                or ""
            ).strip().lower()

            if current_role not in allowed_roles_normalized:

                if request.path.startswith("/api/") or request.path == "/predict":
                    return jsonify({
                        "success": False,
                        "error": "Bu işlem için yetkiniz bulunmuyor.",
                        "required_roles": sorted(allowed_roles_normalized),
                    }), 403

                return render_template(
                    "403.html",
                    active_page=None,
                    required_roles=sorted(allowed_roles_normalized),
                ), 403

            return view_function(*args, **kwargs)

        return wrapped_view

    return decorator


@app.context_processor
def inject_authenticated_user():
    """
    Make the signed-in user available to all Jinja templates.
    """

    user = None
    user_id = session.get("user_id")

    if user_id:

        try:
            user = get_user_by_id(user_id)

        except Exception as error:
            app.logger.warning(
                "Authenticated user could not be loaded: %s",
                error,
            )

    current_role = None
    current_role_label = None
    current_organization = None

    if user:

        current_role = (
            user.get("organization_role")
            or user.get("role")
        )

        current_role_label = (
            get_role_label(
                current_role
            )
        )

        if user.get("organization_id"):

            current_organization = {
                "id":
                    user.get(
                        "organization_id"
                    ),

                "name":
                    user.get(
                        "organization_name"
                    ),

                "slug":
                    user.get(
                        "organization_slug"
                    ),
            }

    return {
        "current_user":
            user,

        "is_authenticated":
            bool(user),

        "current_role":
            current_role,

        "current_role_label":
            current_role_label,

        "current_organization":
            current_organization,
    }


@app.route(
    "/register",
    methods=["GET", "POST"],
)
def register():
    """
    Create a new platform account.

    The first user of a newly created organization automatically
    becomes that organization's owner.
    """

    if session.get("user_id"):
        return redirect(
            url_for("dashboard")
        )

    if request.method == "GET":

        return render_template(
            "register.html",
            active_page=None,
        )

    full_name = str(
        request.form.get(
            "full_name",
            "",
        )
    ).strip()

    email = str(
        request.form.get(
            "email",
            "",
        )
    ).strip().lower()

    organization_name = str(
        request.form.get(
            "organization_name",
            "",
        )
    ).strip()

    password = str(
        request.form.get(
            "password",
            "",
        )
    )

    password_confirm = str(
        request.form.get(
            "password_confirm",
            "",
        )
    )

    form_data = {
        "full_name":
            full_name,

        "email":
            email,

        "organization_name":
            organization_name,
    }

    if len(full_name) < 2:

        flash(
            "Ad soyad en az 2 karakter olmalıdır.",
            "error",
        )

        return render_template(
            "register.html",
            active_page=None,
            form_data=form_data,
        ), 400

    if (
        "@" not in email
        or "." not in email.rsplit("@", 1)[-1]
    ):

        flash(
            "Geçerli bir e-posta adresi girin.",
            "error",
        )

        return render_template(
            "register.html",
            active_page=None,
            form_data=form_data,
        ), 400

    if len(password) < 8:

        flash(
            "Parola en az 8 karakter olmalıdır.",
            "error",
        )

        return render_template(
            "register.html",
            active_page=None,
            form_data=form_data,
        ), 400

    if password != password_confirm:

        flash(
            "Parolalar eşleşmiyor.",
            "error",
        )

        return render_template(
            "register.html",
            active_page=None,
            form_data=form_data,
        ), 400

    try:

        existing_user = get_user_by_email(
            email
        )

        if existing_user:

            flash(
                "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
                "error",
            )

            return render_template(
                "register.html",
                active_page=None,
                form_data=form_data,
            ), 409

        password_hash = (
            generate_password_hash(
                password
            )
        )

        user_id = create_user(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
        )

        if not organization_name:

            organization_name = (
                f"{full_name} Organizasyonu"
            )

        create_organization(
            name=organization_name,
            owner_user_id=user_id,
        )

        user = get_user_by_id(
            user_id
        )

        if not user:

            raise RuntimeError(
                "Yeni kullanıcı bilgileri yüklenemedi."
            )

        if not user.get(
            "organization_id"
        ):

            raise RuntimeError(
                "Yeni organizasyon üyeliği yüklenemedi."
            )

        set_authenticated_session(
            user
        )

        flash(
            "Hesabınız ve organizasyonunuz başarıyla oluşturuldu.",
            "success",
        )

        return redirect(
            url_for("dashboard")
        )

    except Exception as error:

        app.logger.exception(
            "User registration failed."
        )

        flash(
            "Hesap oluşturulamadı. Lütfen tekrar deneyin.",
            "error",
        )

        return render_template(
            "register.html",
            active_page=None,
            form_data=form_data,
        ), 500


@app.route(
    "/login",
    methods=["GET", "POST"],
)
def login():
    """
    Authenticate an existing platform user and load the user's
    active organization membership into the session.
    """

    if session.get("user_id"):
        return redirect(
            url_for("dashboard")
        )

    if request.method == "GET":

        return render_template(
            "login.html",
            active_page=None,
        )

    email = str(
        request.form.get(
            "email",
            "",
        )
    ).strip().lower()

    password = str(
        request.form.get(
            "password",
            "",
        )
    )

    try:

        user = get_user_by_email(
            email
        )

    except Exception as error:

        app.logger.exception(
            "User lookup failed during login."
        )

        flash(
            "Giriş işlemi şu anda tamamlanamadı.",
            "error",
        )

        return render_template(
            "login.html",
            active_page=None,
            email=email,
        ), 500

    if (
        not user
        or not user.get("is_active")
        or not check_password_hash(
            user.get(
                "password_hash",
                "",
            ),
            password,
        )
    ):

        flash(
            "E-posta adresi veya parola hatalı.",
            "error",
        )

        return render_template(
            "login.html",
            active_page=None,
            email=email,
        ), 401

    if (
        user.get("membership_is_active") is False
        or user.get("organization_is_active") is False
    ):

        flash(
            "Organizasyon üyeliğiniz aktif değil.",
            "error",
        )

        return render_template(
            "login.html",
            active_page=None,
            email=email,
        ), 403

    if not user.get(
        "organization_id"
    ):

        flash(
            "Bu kullanıcı aktif bir organizasyona bağlı değil.",
            "error",
        )

        return render_template(
            "login.html",
            active_page=None,
            email=email,
        ), 403

    set_authenticated_session(
        user
    )

    next_url = request.args.get(
        "next",
        "",
    )

    if (
        not next_url
        or not next_url.startswith("/")
        or next_url.startswith("//")
    ):
        next_url = url_for(
            "dashboard"
        )

    return redirect(
        next_url
    )


@app.route(
    "/logout",
    methods=["GET", "POST"],
)
def logout():
    """
    End the current authenticated session and remove organization
    context from the browser session.
    """

    session.clear()

    flash(
        "Oturumunuz güvenli şekilde kapatıldı.",
        "success",
    )

    return redirect(
        url_for("login")
    )


# ============================================================
# ORGANIZATION INVITATIONS
# ============================================================

INVITATION_TTL_HOURS = int(
    os.getenv(
        "INVITATION_TTL_HOURS",
        "72",
    )
)


def hash_invitation_token(token):
    """
    Store only a SHA-256 hash of invitation tokens in MySQL.
    """

    return hashlib.sha256(
        str(token).encode("utf-8")
    ).hexdigest()


def create_invitation_token():
    """
    Return a cryptographically secure invitation token.
    """

    return secrets.token_urlsafe(32)


def get_invitation_by_token(token):
    """
    Load a valid invitation by raw token.
    """

    token_hash = hash_invitation_token(
        token
    )

    connection = None
    cursor = None

    try:

        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                oi.id,
                oi.organization_id,
                oi.user_id,
                oi.invited_by_user_id,
                oi.expires_at,
                oi.accepted_at,
                oi.created_at,
                o.name AS organization_name,
                u.full_name,
                u.email,
                om.role,
                om.is_active AS membership_is_active
            FROM organization_invitations oi
            INNER JOIN organizations o
                ON o.id = oi.organization_id
            INNER JOIN users u
                ON u.id = oi.user_id
            INNER JOIN organization_members om
                ON om.organization_id = oi.organization_id
               AND om.user_id = oi.user_id
            WHERE oi.token_hash = %s
            LIMIT 1
            """,
            (
                token_hash,
            ),
        )

        invitation = cursor.fetchone()

        if not invitation:
            return None

        return invitation

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# ORGANIZATION MANAGEMENT
# ============================================================

ORGANIZATION_MANAGE_ROLES = {
    "owner",
    "admin",
}

ORGANIZATION_ASSIGNABLE_ROLES = {
    "admin",
    "analyst",
    "operator",
    "viewer",
}


def get_current_organization_context():
    """
    Return the signed-in user's current organization membership.
    """

    user_id = session.get("user_id")

    if not user_id:
        return None

    user = get_user_by_id(user_id)

    if (
        not user
        or not user.get("organization_id")
        or user.get("membership_is_active") is False
        or user.get("organization_is_active") is False
    ):
        return None

    return user


def can_manage_current_organization(user):
    """
    Owners and admins may manage organization members.
    """

    if not user:
        return False

    role = str(
        user.get("organization_role")
        or user.get("role")
        or ""
    ).strip().lower()

    return role in ORGANIZATION_MANAGE_ROLES


def organization_permission_error():
    return jsonify({
        "success": False,
        "error": "Bu işlem için organizasyon yönetim yetkiniz bulunmuyor.",
    }), 403


@app.route(
    "/api/organization",
    methods=["GET", "PATCH"],
)
@login_required
def organization_api():
    """
    Read or update the current organization.
    """

    current_user = get_current_organization_context()

    if not current_user:
        return jsonify({
            "success": False,
            "error": "Aktif organizasyon bulunamadı.",
        }), 404

    organization_id = int(
        current_user["organization_id"]
    )

    if request.method == "GET":

        return jsonify({
            "success": True,
            "organization": {
                "id": organization_id,
                "name": current_user.get(
                    "organization_name"
                ),
                "slug": current_user.get(
                    "organization_slug"
                ),
                "role": (
                    current_user.get(
                        "organization_role"
                    )
                    or current_user.get("role")
                ),
                "role_label": get_role_label(
                    current_user.get(
                        "organization_role"
                    )
                    or current_user.get("role")
                ),
            },
        }), 200

    if not can_manage_current_organization(
        current_user
    ):
        return organization_permission_error()

    request_data = request.get_json(
        silent=True
    )

    if not isinstance(request_data, dict):
        return jsonify({
            "success": False,
            "error": "Geçerli JSON verisi gönderilmelidir.",
        }), 400

    organization_name = str(
        request_data.get(
            "name",
            "",
        )
    ).strip()

    if len(organization_name) < 2:
        return jsonify({
            "success": False,
            "error": "Organizasyon adı en az 2 karakter olmalıdır.",
        }), 400

    if len(organization_name) > 120:
        return jsonify({
            "success": False,
            "error": "Organizasyon adı en fazla 120 karakter olabilir.",
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            UPDATE organizations
            SET name = %s
            WHERE id = %s
              AND is_active = 1
            """,
            (
                organization_name,
                organization_id,
            ),
        )

        if cursor.rowcount == 0:

            connection.rollback()

            return jsonify({
                "success": False,
                "error": "Organizasyon bulunamadı veya aktif değil.",
            }), 404

        connection.commit()

        session["organization_name"] = (
            organization_name
        )

        return jsonify({
            "success": True,
            "organization": {
                "id": organization_id,
                "name": organization_name,
            },
        }), 200

    except Exception as error:

        if connection:
            connection.rollback()

        app.logger.exception(
            "Organization update failed."
        )

        return jsonify({
            "success": False,
            "error": "Organizasyon güncellenemedi.",
            "details": str(error),
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route(
    "/api/organization/members",
    methods=["GET", "POST"],
)
@login_required
def organization_members_api():
    """
    List organization members or add an existing/new user.
    """

    current_user = get_current_organization_context()

    if not current_user:
        return jsonify({
            "success": False,
            "error": "Aktif organizasyon bulunamadı.",
        }), 404

    if not can_manage_current_organization(
        current_user
    ):
        return organization_permission_error()

    organization_id = int(
        current_user["organization_id"]
    )

    current_user_id = int(
        current_user["id"]
    )

    if request.method == "GET":

        connection = None
        cursor = None

        try:

            connection = get_database_connection()

            cursor = connection.cursor(
                dictionary=True
            )

            cursor.execute(
                """
                SELECT
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    u.is_active AS user_is_active,
                    om.role,
                    om.is_active AS membership_is_active,
                    om.joined_at,
                    (
                        SELECT COUNT(*)
                        FROM organization_invitations oi
                        WHERE
                            oi.organization_id = om.organization_id
                            AND oi.user_id = om.user_id
                            AND oi.accepted_at IS NULL
                            AND oi.expires_at > CURRENT_TIMESTAMP
                    ) AS pending_invitation_count
                FROM organization_members om
                INNER JOIN users u
                    ON u.id = om.user_id
                WHERE om.organization_id = %s
                ORDER BY
                    CASE om.role
                        WHEN 'owner' THEN 1
                        WHEN 'admin' THEN 2
                        WHEN 'analyst' THEN 3
                        WHEN 'operator' THEN 4
                        WHEN 'viewer' THEN 5
                        ELSE 6
                    END,
                    u.full_name ASC,
                    u.id ASC
                """,
                (
                    organization_id,
                ),
            )

            rows = cursor.fetchall()

            members = []

            for row in rows:

                members.append({
                    "user_id": int(
                        row["user_id"]
                    ),
                    "full_name": row[
                        "full_name"
                    ],
                    "email": row[
                        "email"
                    ],
                    "role": row[
                        "role"
                    ],
                    "role_label": get_role_label(
                        row["role"]
                    ),
                    "is_active": bool(
                        row[
                            "user_is_active"
                        ]
                        and row[
                            "membership_is_active"
                        ]
                    ),
                    "is_current_user": (
                        int(
                            row["user_id"]
                        )
                        == current_user_id
                    ),
                    "invitation_pending": bool(
                        row.get(
                            "pending_invitation_count"
                        )
                    ),
                })

            return jsonify({
                "success": True,
                "members": members,
            }), 200

        except Exception as error:

            app.logger.exception(
                "Organization members could not be loaded."
            )

            return jsonify({
                "success": False,
                "error": "Ekip üyeleri yüklenemedi.",
                "details": str(error),
            }), 500

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    request_data = request.get_json(
        silent=True
    )

    if not isinstance(request_data, dict):
        return jsonify({
            "success": False,
            "error": "Geçerli JSON verisi gönderilmelidir.",
        }), 400

    full_name = str(
        request_data.get(
            "full_name",
            "",
        )
    ).strip()

    email = str(
        request_data.get(
            "email",
            "",
        )
    ).strip().lower()

    role = str(
        request_data.get(
            "role",
            "viewer",
        )
    ).strip().lower()

    requested_active = (
        request_data.get(
            "is_active",
            True,
        )
        is not False
    )

    if len(full_name) < 2:
        return jsonify({
            "success": False,
            "error": "Üye adı en az 2 karakter olmalıdır.",
        }), 400

    if (
        "@" not in email
        or "." not in email.rsplit(
            "@",
            1,
        )[-1]
    ):
        return jsonify({
            "success": False,
            "error": "Geçerli bir e-posta adresi girin.",
        }), 400

    if role not in ORGANIZATION_ASSIGNABLE_ROLES:
        return jsonify({
            "success": False,
            "error": "Geçersiz organizasyon rolü.",
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                id,
                full_name,
                email,
                is_active
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (
                email,
            ),
        )

        target_user = cursor.fetchone()

        if target_user:

            target_user_id = int(
                target_user["id"]
            )

            cursor.execute(
                """
                SELECT
                    id,
                    organization_id,
                    role,
                    is_active
                FROM organization_members
                WHERE user_id = %s
                LIMIT 1
                """,
                (
                    target_user_id,
                ),
            )

            existing_membership = (
                cursor.fetchone()
            )

            if existing_membership:

                if (
                    int(
                        existing_membership[
                            "organization_id"
                        ]
                    )
                    == organization_id
                ):

                    return jsonify({
                        "success": False,
                        "error": "Bu kullanıcı zaten organizasyonun üyesi.",
                    }), 409

                return jsonify({
                    "success": False,
                    "error": (
                        "Bu kullanıcı başka bir organizasyona bağlı. "
                        "Mevcut veritabanı yapısında kullanıcı aynı anda "
                        "tek organizasyonda olabilir."
                    ),
                }), 409

            cursor.execute(
                """
                UPDATE users
                SET
                    full_name = %s,
                    is_active = %s
                WHERE id = %s
                """,
                (
                    full_name,
                    1,
                    target_user_id,
                ),
            )

        else:

            temporary_password_hash = (
                generate_password_hash(
                    os.urandom(32).hex()
                )
            )

            cursor.execute(
                """
                INSERT INTO users (
                    full_name,
                    email,
                    password_hash,
                    is_active
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    full_name,
                    email,
                    temporary_password_hash,
                    1,
                ),
            )

            target_user_id = int(
                cursor.lastrowid
            )

        cursor.execute(
            """
            INSERT INTO organization_members (
                organization_id,
                user_id,
                role,
                is_active
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                organization_id,
                target_user_id,
                role,
                0,
            ),
        )

        invitation_token = (
            create_invitation_token()
        )

        invitation_token_hash = (
            hash_invitation_token(
                invitation_token
            )
        )

        invitation_expires_at = (
            datetime.now()
            + timedelta(
                hours=
                    INVITATION_TTL_HOURS
            )
        )

        cursor.execute(
            """
            UPDATE organization_invitations
            SET
                accepted_at = COALESCE(
                    accepted_at,
                    CURRENT_TIMESTAMP
                )
            WHERE
                organization_id = %s
                AND user_id = %s
                AND accepted_at IS NULL
            """,
            (
                organization_id,
                target_user_id,
            ),
        )

        cursor.execute(
            """
            INSERT INTO organization_invitations (
                organization_id,
                user_id,
                token_hash,
                invited_by_user_id,
                expires_at,
                accepted_at
            )
            VALUES (%s, %s, %s, %s, %s, NULL)
            """,
            (
                organization_id,
                target_user_id,
                invitation_token_hash,
                current_user_id,
                invitation_expires_at,
            ),
        )

        connection.commit()

        invitation_url = url_for(
            "accept_invitation",
            token=invitation_token,
            _external=True,
        )

        return jsonify({
            "success": True,
            "message": "Davet oluşturuldu.",
            "member": {
                "user_id": target_user_id,
                "full_name": full_name,
                "email": email,
                "role": role,
                "role_label": get_role_label(
                    role
                ),
                "is_active": False,
                "is_current_user": False,
                "invitation_pending": True,
            },
            "invitation": {
                "url": invitation_url,
                "expires_at":
                    invitation_expires_at.isoformat(
                        timespec="seconds"
                    ),
            },
        }), 201

    except Exception as error:

        if connection:
            connection.rollback()

        app.logger.exception(
            "Organization member creation failed."
        )

        return jsonify({
            "success": False,
            "error": "Ekip üyesi eklenemedi.",
            "details": str(error),
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route(
    "/api/organization/members/<int:user_id>",
    methods=["PATCH"],
)
@login_required
def organization_member_api(user_id):
    """
    Change a member's role or active status.
    """

    current_user = get_current_organization_context()

    if not current_user:
        return jsonify({
            "success": False,
            "error": "Aktif organizasyon bulunamadı.",
        }), 404

    if not can_manage_current_organization(
        current_user
    ):
        return organization_permission_error()

    organization_id = int(
        current_user["organization_id"]
    )

    current_user_id = int(
        current_user["id"]
    )

    if user_id == current_user_id:
        return jsonify({
            "success": False,
            "error": "Kendi rolünüzü veya üyelik durumunuzu buradan değiştiremezsiniz.",
        }), 400

    request_data = request.get_json(
        silent=True
    )

    if not isinstance(request_data, dict):
        return jsonify({
            "success": False,
            "error": "Geçerli JSON verisi gönderilmelidir.",
        }), 400

    requested_role = (
        request_data.get("role")
        if "role" in request_data
        else None
    )

    requested_active = (
        request_data.get("is_active")
        if "is_active" in request_data
        else None
    )

    if (
        requested_role is None
        and requested_active is None
    ):
        return jsonify({
            "success": False,
            "error": "Güncellenecek rol veya durum gönderilmelidir.",
        }), 400

    if requested_role is not None:

        requested_role = str(
            requested_role
        ).strip().lower()

        if requested_role not in ORGANIZATION_ASSIGNABLE_ROLES:
            return jsonify({
                "success": False,
                "error": "Geçersiz organizasyon rolü.",
            }), 400

    if (
        requested_active is not None
        and not isinstance(
            requested_active,
            bool,
        )
    ):
        return jsonify({
            "success": False,
            "error": "is_active alanı true veya false olmalıdır.",
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                om.id AS membership_id,
                om.role,
                om.is_active AS membership_is_active,
                u.id AS user_id,
                u.full_name,
                u.email,
                u.is_active AS user_is_active
            FROM organization_members om
            INNER JOIN users u
                ON u.id = om.user_id
            WHERE
                om.organization_id = %s
                AND om.user_id = %s
            LIMIT 1
            """,
            (
                organization_id,
                user_id,
            ),
        )

        member = cursor.fetchone()

        if not member:
            return jsonify({
                "success": False,
                "error": "Organizasyon üyesi bulunamadı.",
            }), 404

        if str(
            member.get("role") or ""
        ).lower() == "owner":
            return jsonify({
                "success": False,
                "error": "Hesap sahibinin rolü veya üyelik durumu değiştirilemez.",
            }), 400

        if requested_role is not None:

            cursor.execute(
                """
                UPDATE organization_members
                SET role = %s
                WHERE
                    organization_id = %s
                    AND user_id = %s
                """,
                (
                    requested_role,
                    organization_id,
                    user_id,
                ),
            )

        if requested_active is not None:

            cursor.execute(
                """
                UPDATE organization_members
                SET is_active = %s
                WHERE
                    organization_id = %s
                    AND user_id = %s
                """,
                (
                    1 if requested_active else 0,
                    organization_id,
                    user_id,
                ),
            )

        connection.commit()

        final_role = (
            requested_role
            if requested_role is not None
            else member["role"]
        )

        final_active = (
            requested_active
            if requested_active is not None
            else bool(
                member[
                    "membership_is_active"
                ]
            )
        )

        return jsonify({
            "success": True,
            "message": "Organizasyon üyesi güncellendi.",
            "member": {
                "user_id": user_id,
                "full_name": member[
                    "full_name"
                ],
                "email": member[
                    "email"
                ],
                "role": final_role,
                "role_label": get_role_label(
                    final_role
                ),
                "is_active": final_active,
                "is_current_user": False,
            },
        }), 200

    except Exception as error:

        if connection:
            connection.rollback()

        app.logger.exception(
            "Organization member update failed."
        )

        return jsonify({
            "success": False,
            "error": "Organizasyon üyesi güncellenemedi.",
            "details": str(error),
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# INVITATION ACCEPTANCE
# ============================================================

@app.route(
    "/invite/<token>",
    methods=["GET", "POST"],
)
def accept_invitation(token):
    """
    Let an invited team member create their password and activate
    the organization membership.
    """

    invitation = get_invitation_by_token(
        token
    )

    invitation_valid = True
    invitation_error = None

    if not invitation:

        invitation_valid = False
        invitation_error = (
            "Davet bağlantısı geçersiz."
        )

    elif invitation.get(
        "accepted_at"
    ) is not None:

        invitation_valid = False
        invitation_error = (
            "Bu davet bağlantısı daha önce kullanılmış."
        )

    else:

        expires_at = invitation.get(
            "expires_at"
        )

        if (
            expires_at
            and expires_at < datetime.now()
        ):

            invitation_valid = False
            invitation_error = (
                "Bu davet bağlantısının süresi dolmuş."
            )

    if request.method == "GET":

        return render_template(
            "invite.html",
            active_page=None,
            invitation=invitation,
            invitation_valid=invitation_valid,
            invitation_error=invitation_error,
        )

    if not invitation_valid:

        return render_template(
            "invite.html",
            active_page=None,
            invitation=invitation,
            invitation_valid=False,
            invitation_error=invitation_error,
        ), 400

    password = str(
        request.form.get(
            "password",
            "",
        )
    )

    password_confirm = str(
        request.form.get(
            "password_confirm",
            "",
        )
    )

    if len(password) < 8:

        flash(
            "Parola en az 8 karakter olmalıdır.",
            "error",
        )

        return render_template(
            "invite.html",
            active_page=None,
            invitation=invitation,
            invitation_valid=True,
            invitation_error=None,
        ), 400

    if password != password_confirm:

        flash(
            "Parolalar eşleşmiyor.",
            "error",
        )

        return render_template(
            "invite.html",
            active_page=None,
            invitation=invitation,
            invitation_valid=True,
            invitation_error=None,
        ), 400

    connection = None
    cursor = None

    try:

        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        password_hash = (
            generate_password_hash(
                password
            )
        )

        cursor.execute(
            """
            UPDATE users
            SET
                password_hash = %s,
                is_active = 1
            WHERE id = %s
            """,
            (
                password_hash,
                invitation["user_id"],
            ),
        )

        cursor.execute(
            """
            UPDATE organization_members
            SET is_active = 1
            WHERE
                organization_id = %s
                AND user_id = %s
            """,
            (
                invitation[
                    "organization_id"
                ],
                invitation[
                    "user_id"
                ],
            ),
        )

        cursor.execute(
            """
            UPDATE organization_invitations
            SET accepted_at = CURRENT_TIMESTAMP
            WHERE
                id = %s
                AND accepted_at IS NULL
            """,
            (
                invitation["id"],
            ),
        )

        if cursor.rowcount == 0:

            connection.rollback()

            flash(
                "Bu davet artık kullanılamıyor.",
                "error",
            )

            return render_template(
                "invite.html",
                active_page=None,
                invitation=invitation,
                invitation_valid=False,
                invitation_error=(
                    "Bu davet artık kullanılamıyor."
                ),
            ), 409

        connection.commit()

        flash(
            "Davet kabul edildi. Şifreniz oluşturuldu; şimdi giriş yapabilirsiniz.",
            "success",
        )

        return redirect(
            url_for(
                "login"
            )
        )

    except Exception as error:

        if connection:
            connection.rollback()

        app.logger.exception(
            "Invitation acceptance failed."
        )

        return render_template(
            "invite.html",
            active_page=None,
            invitation=invitation,
            invitation_valid=True,
            invitation_error=(
                "Davet kabul edilirken bir hata oluştu."
            ),
        ), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# DASHBOARD
# ============================================================

@app.route(
    "/",
    methods=["GET"],
)
@login_required
def dashboard():
    """
    Ana dashboard ekranını gerçek MySQL tahmin verileriyle açar.
    """

    metrics = get_dashboard_metrics()

    recent_predictions = get_recent_predictions(
        limit=5
    )

    risk_distribution = get_risk_distribution()

    category_statistics = get_category_statistics()

    satisfaction_trend = get_satisfaction_trend(
        days=7
    )

    return render_template(
        "dashboard.html",

        active_page="dashboard",

        metrics=metrics,

        recent_predictions=recent_predictions,

        risk_distribution=risk_distribution,

        category_statistics=category_statistics,

        satisfaction_trend=satisfaction_trend,
    )


# ============================================================
# SETTINGS
# ============================================================

@app.route(
    "/settings",
    methods=["GET"],
)
@login_required
def settings():
    """
    Kullanıcının profil ve organizasyon ayarları ekranını açar.
    Organizasyon/ekip değiştiren işlemler backend tarafında
    ayrıca owner/admin yetkisiyle korunur.
    """
    return render_template(
        "settings.html",
        active_page="settings",
    )


# ============================================================
# NEW PREDICTION PAGE
# ============================================================

@app.route(
    "/prediction",
    methods=["GET"],
)
@role_required(
    "owner",
    "admin",
    "operator",
)
def prediction_page():
    """
    Yeni müşteri memnuniyeti tahmini ekranını açar.
    """

    return render_template(
        "prediction.html",
        active_page="prediction",
    )


# ============================================================
# PREDICTION HISTORY
# ============================================================

@app.route(
    "/history",
    methods=["GET"],
)
@login_required
def history():
    """
    Veritabanındaki tahmin geçmişini gösterir.
    """

    predictions = get_prediction_history()

    return render_template(
        "history.html",

        active_page="history",

        predictions=predictions,
    )


# ============================================================
# DATA ANALYTICS
# ============================================================

@app.route(
    "/analytics",
    methods=["GET"],
)
@role_required(
    "owner",
    "admin",
    "analyst",
    "viewer",
)
def analytics():
    """
    MySQL tahmin kayıtlarından oluşturulan analiz ekranını açar.
    """

    metrics = get_dashboard_metrics()

    analytics_summary = get_analytics_summary()

    risk_distribution = get_risk_distribution()

    category_statistics = get_category_statistics()

    state_statistics = get_state_statistics()

    payment_statistics = get_payment_statistics()

    delivery_statistics = get_delivery_statistics()

    satisfaction_trend = get_satisfaction_trend(
        days=30
    )

    return render_template(
        "analytics.html",

        active_page="analytics",

        metrics=metrics,

        analytics_summary=analytics_summary,

        risk_distribution=risk_distribution,

        category_statistics=category_statistics,

        state_statistics=state_statistics,

        payment_statistics=payment_statistics,

        delivery_statistics=delivery_statistics,

        satisfaction_trend=satisfaction_trend,
    )


# ============================================================
# MODEL PERFORMANCE
# ============================================================

@app.route(
    "/model-performance",
    methods=["GET"],
)
@role_required(
    "owner",
    "admin",
    "analyst",
)
def model_performance():
    """
    Model performans sonuçlarını gösterir.
    """

    return render_template(
        "model_performance.html",
        active_page="model_performance",
    )


# ============================================================
# REPORTS
# ============================================================

@app.route(
    "/reports",
    methods=["GET"],
)
@role_required(
    "owner",
    "admin",
    "analyst",
    "viewer",
)
def reports():
    """
    Tahmin kayıtlarından oluşturulan rapor ekranını açar.
    """

    metrics = get_dashboard_metrics()

    risk_distribution = get_risk_distribution()

    category_statistics = get_category_statistics()

    recent_predictions = get_recent_predictions(
        limit=10
    )

    return render_template(
        "reports.html",

        active_page="reports",

        metrics=metrics,

        risk_distribution=risk_distribution,

        category_statistics=category_statistics,

        recent_predictions=recent_predictions,
    )


# ============================================================
# AI ASSISTANT PAGE
# ============================================================

@app.route(
    "/assistant",
    methods=["GET"],
)
@role_required(
    "owner",
    "admin",
    "analyst",
    "operator",
)
def assistant_page():
    """
    Yapay zeka asistan ekranını açar.
    """

    return render_template(
        "assistant.html",
        active_page="assistant",
    )


# ============================================================
# PREDICTION API
# ============================================================

@app.route(
    "/predict",
    methods=["POST"],
)
@role_required(
    "owner",
    "admin",
    "operator",
)
def predict():
    """
    Tahmin oluşturur ve sonucu MySQL veritabanına kaydeder.
    """

    try:

        customer_data = request.get_json(
            silent=True
        )


        if customer_data is None:

            return jsonify({
                "error":
                    "Request body must contain valid JSON."
            }), 400


        if not isinstance(
            customer_data,
            dict,
        ):

            return jsonify({
                "error":
                    "Customer data must be a JSON object."
            }), 400


        if not customer_data:

            return jsonify({
                "error":
                    "Customer data is required."
            }), 400


        # Model tahminini oluşturuyorum.

        result = predict_customer_satisfaction(
            customer_data
        )


        # Oluşan tahmini MySQL tarafına kaydediyorum.

        prediction_id = save_prediction(
            customer_data=customer_data,
            prediction_result=result,
        )


        response_data = {

            "prediction_id":
                prediction_id,

            "prediction":
                result[
                    "prediction"
                ],

            "satisfied_probability":
                result[
                    "satisfied_probability"
                ],

            "unsatisfied_probability":
                result[
                    "unsatisfied_probability"
                ],
        }


        return jsonify(
            response_data
        ), 200


    except ValueError as error:

        return jsonify({
            "error":
                str(error)
        }), 400


    except Exception as error:

        app.logger.exception(
            "Prediction request failed."
        )

        return jsonify({

            "error":
                "Prediction could not be completed.",

            "details":
                str(error),

        }), 500


# ============================================================
# SCENARIO PREDICTION API
# ============================================================

@app.route(
    "/api/scenario-prediction",
    methods=["POST"],
)
@role_required(
    "owner",
    "admin",
    "operator",
)
def scenario_prediction():
    """
    What-if senaryosu için tahmin oluşturur.

    Bu endpoint yalnızca model sonucunu döndürür.
    Senaryo tahminleri MySQL veritabanına kaydedilmez.
    """

    try:

        customer_data = request.get_json(
            silent=True
        )


        if customer_data is None:

            return jsonify({
                "error":
                    "Request body must contain valid JSON."
            }), 400


        if not isinstance(
            customer_data,
            dict,
        ):

            return jsonify({
                "error":
                    "Customer data must be a JSON object."
            }), 400


        if not customer_data:

            return jsonify({
                "error":
                    "Customer data is required."
            }), 400


        result = predict_customer_satisfaction(
            customer_data
        )


        response_data = {

            "prediction":
                result[
                    "prediction"
                ],

            "satisfied_probability":
                result[
                    "satisfied_probability"
                ],

            "unsatisfied_probability":
                result[
                    "unsatisfied_probability"
                ],

            "saved":
                False,

            "scenario":
                True,
        }


        return jsonify(
            response_data
        ), 200


    except ValueError as error:

        return jsonify({
            "error":
                str(error)
        }), 400


    except Exception as error:

        app.logger.exception(
            "Scenario prediction request failed."
        )

        return jsonify({

            "error":
                "Scenario prediction could not be completed.",

            "details":
                str(error),

        }), 500


# ============================================================
# GEMINI AI ASSISTANT API
# ============================================================

@app.route(
    "/api/ai-assistant",
    methods=["POST"],
)
@role_required(
    "owner",
    "admin",
    "analyst",
    "operator",
)
def ai_assistant():
    """
    Kullanıcı mesajını platformdaki güncel verilerle birlikte
    Gemini API'ye gönderir.
    """

    try:

        request_data = request.get_json(
            silent=True
        )


        if request_data is None:

            return jsonify({
                "error":
                    "Request body must contain valid JSON."
            }), 400


        if not isinstance(
            request_data,
            dict,
        ):

            return jsonify({
                "error":
                    "Request body must be a JSON object."
            }), 400


        message = str(
            request_data.get(
                "message",
                "",
            )
        ).strip()


        if not message:

            return jsonify({
                "error":
                    "AI assistant message is required."
            }), 400


        if len(message) > 2000:

            return jsonify({
                "error":
                    "Message is too long."
            }), 400


        # Platform sorularında güncel MySQL verilerini kullanıyorum.
        # Genel bilgi sorularında gereksiz veritabanı sorgusu çalıştırmıyorum.

        platform_context = None

        if is_platform_question(message):
            platform_context = build_ai_platform_context()


        # Kullanıcı sorusunu uygun bağlamla Gemini için hazırlıyorum.

        prompt = build_ai_prompt(
            message=message,
            platform_context=platform_context,
        )


        # Gemini bağlantısını oluşturuyorum.

        client = get_gemini_client()


        # Gemini'den yanıt alıyorum.

        response = client.models.generate_content(

            model=GEMINI_MODEL,

            contents=prompt,

            config=types.GenerateContentConfig(

                system_instruction=
                    AI_SYSTEM_INSTRUCTION,

                temperature=0.4,

                max_output_tokens=1500,
            ),
        )


        answer = getattr(
            response,
            "text",
            None,
        )


        if not answer:

            answer = (
                "Şu anda bir yanıt oluşturamadım. "
                "Lütfen sorunuzu tekrar deneyin."
            )


        return jsonify({

            "success":
                True,

            "answer":
                answer,

            "provider":
                "Google Gemini",

            "model":
                GEMINI_MODEL,

        }), 200


    except RuntimeError as error:

        return jsonify({

            "success":
                False,

            "error":
                str(error),

        }), 503


    except Exception as error:

        app.logger.exception(
            "Gemini AI assistant request failed."
        )

        return jsonify({

            "success":
                False,

            "error":
                "AI assistant request could not be completed.",

            "details":
                str(error),

        }), 500


# ============================================================
# AI HEALTH CHECK
# ============================================================

@app.route(
    "/api/ai-health",
    methods=["GET"],
)
def ai_health_check():
    """
    Gemini yapılandırmasının hazır olup olmadığını kontrol eder.
    API anahtarı response içinde gösterilmez.
    """

    configured = bool(
        os.getenv(
            "GEMINI_API_KEY"
        )
    )

    return jsonify({

        "provider":
            "Google Gemini",

        "configured":
            configured,

        "model":
            GEMINI_MODEL,

    }), 200


# ============================================================
# API - DASHBOARD DATA
# ============================================================

@app.route(
    "/api/dashboard",
    methods=["GET"],
)
@login_required
def dashboard_api():
    """
    Dashboard verilerini JSON olarak döndürür.
    """

    try:

        return jsonify({

            "metrics":
                get_dashboard_metrics(),

            "risk_distribution":
                get_risk_distribution(),

            "category_statistics":
                get_category_statistics(),

            "satisfaction_trend":
                get_satisfaction_trend(
                    days=7
                ),

            "recent_predictions":
                get_recent_predictions(
                    limit=5
                ),

        }), 200


    except Exception as error:

        app.logger.exception(
            "Dashboard data could not be loaded."
        )

        return jsonify({

            "error":
                "Dashboard data could not be loaded.",

            "details":
                str(error),

        }), 500


# ============================================================
# API - ANALYTICS DATA
# ============================================================

@app.route(
    "/api/analytics",
    methods=["GET"],
)
@role_required(
    "owner",
    "admin",
    "analyst",
    "viewer",
)
def analytics_api():
    """
    Analytics ekranında kullanılan verileri JSON olarak döndürür.
    """

    try:

        return jsonify({

            "metrics":
                get_dashboard_metrics(),

            "analytics_summary":
                get_analytics_summary(),

            "risk_distribution":
                get_risk_distribution(),

            "category_statistics":
                get_category_statistics(),

            "state_statistics":
                get_state_statistics(),

            "payment_statistics":
                get_payment_statistics(),

            "delivery_statistics":
                get_delivery_statistics(),

            "satisfaction_trend":
                get_satisfaction_trend(
                    days=30
                ),

        }), 200


    except Exception as error:

        app.logger.exception(
            "Analytics data could not be loaded."
        )

        return jsonify({

            "error":
                "Analytics data could not be loaded.",

            "details":
                str(error),

        }), 500


# ============================================================
# API - PREDICTION HISTORY
# ============================================================

@app.route(
    "/api/predictions",
    methods=["GET"],
)
@login_required
def predictions_api():
    """
    Veritabanındaki tahmin geçmişini JSON olarak döndürür.
    """

    try:

        predictions = get_prediction_history()


        return jsonify({

            "count":
                len(predictions),

            "predictions":
                predictions,

        }), 200


    except Exception as error:

        app.logger.exception(
            "Prediction history could not be loaded."
        )

        return jsonify({

            "error":
                "Prediction history could not be loaded.",

            "details":
                str(error),

        }), 500


# ============================================================
# APPLICATION HEALTH CHECK
# ============================================================

@app.route(
    "/api/health",
    methods=["GET"],
)
def health_check():
    """
    Flask uygulaması ve Gemini yapılandırmasının durumunu döndürür.
    """

    gemini_configured = bool(
        os.getenv(
            "GEMINI_API_KEY"
        )
    )


    return jsonify({

        "application":
            "Customer Intelligence Platform",

        "status":
            "running",

        "gemini_configured":
            gemini_configured,

    }), 200


# ============================================================
# DEVELOPMENT SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )