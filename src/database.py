import json
import os
import uuid
from datetime import datetime

import mysql.connector
from dotenv import load_dotenv
from mysql.connector import Error


# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================

# Load database credentials from the .env file located
# in the project root.
load_dotenv()


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_database_connection():
    """
    Create and return a MySQL database connection.

    Returns
    -------
    mysql.connector.connection.MySQLConnection
        Active MySQL connection.
    """

    return mysql.connector.connect(
        host=os.getenv(
            "DB_HOST",
            "localhost",
        ),
        port=int(
            os.getenv(
                "DB_PORT",
                "3306",
            )
        ),
        database=os.getenv(
            "DB_NAME",
            "customer_intelligence",
        ),
        user=os.getenv(
            "DB_USER",
            "root",
        ),
        password=os.getenv(
            "DB_PASSWORD",
        ),
        charset="utf8mb4",
        autocommit=False,
    )


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

def test_database_connection():
    """
    Test whether the application can connect to MySQL.

    Returns
    -------
    bool
        True if the connection succeeds.
    """

    connection = None
    cursor = None

    try:
        connection = get_database_connection()

        if not connection.is_connected():
            print(
                "Database connection could not be established."
            )
            return False

        cursor = connection.cursor()

        cursor.execute(
            "SELECT DATABASE();"
        )

        database_name = (
            cursor.fetchone()[0]
        )

        print(
            "MySQL connection successful. "
            f"Database: {database_name}"
        )

        return True

    except Error as error:
        print(
            f"MySQL connection failed: {error}"
        )

        return False

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# RISK CLASSIFICATION
# ============================================================

def determine_risk_level(
    unsatisfied_probability,
):
    """
    Convert model dissatisfaction probability into an
    operational risk category.

    Parameters
    ----------
    unsatisfied_probability : float
        Probability that the customer will be dissatisfied.

    Returns
    -------
    str
        low, medium or high.
    """

    probability = float(
        unsatisfied_probability
    )

    if probability >= 0.60:
        return "high"

    if probability >= 0.40:
        return "medium"

    return "low"


# ============================================================
# SAVE PREDICTION
# ============================================================

def save_prediction(
    customer_data,
    prediction_result,
):
    """
    Save a completed machine-learning prediction to MySQL.

    Parameters
    ----------
    customer_data : dict
        Input features sent to the production model.

    prediction_result : dict
        Prediction returned by predict_customer_satisfaction().

    Returns
    -------
    str
        Unique prediction identifier.
    """

    connection = None
    cursor = None

    # Human-readable unique application identifier.
    prediction_id = (
        "PRD-"
        + uuid.uuid4()
        .hex[:12]
        .upper()
    )

    prediction = int(
        prediction_result[
            "prediction"
        ]
    )

    satisfied_probability = float(
        prediction_result[
            "satisfied_probability"
        ]
    )

    unsatisfied_probability = float(
        prediction_result[
            "unsatisfied_probability"
        ]
    )

    risk_level = (
        determine_risk_level(
            unsatisfied_probability
        )
    )

    # Store the complete model payload as JSON as well.
    # This means features not represented as individual
    # database columns are still preserved.
    input_data_json = json.dumps(
        customer_data,
        ensure_ascii=False,
        default=str,
    )

    query = """
        INSERT INTO predictions (
            prediction_id,
            customer_state,
            payment_type,
            payment_installments,
            is_weekend,

            total_price,
            total_freight,
            total_products,
            unique_categories,

            delivery_time_days,
            delivery_delay_days,

            primary_product_category,
            average_product_price,
            average_product_weight,
            average_product_photos,

            prediction,
            satisfied_probability,
            unsatisfied_probability,
            risk_level,

            input_data_json
        )
        VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s
        )
    """

    values = (
        prediction_id,

        customer_data.get(
            "customer_state"
        ),

        customer_data.get(
            "payment_type"
        ),

        customer_data.get(
            "payment_installments"
        ),

        customer_data.get(
            "is_weekend"
        ),

        customer_data.get(
            "total_price"
        ),

        customer_data.get(
            "total_freight"
        ),

        customer_data.get(
            "total_products"
        ),

        customer_data.get(
            "unique_categories"
        ),

        customer_data.get(
            "delivery_time_days"
        ),

        customer_data.get(
            "delivery_delay_days"
        ),

        customer_data.get(
            "primary_product_category"
        ),

        customer_data.get(
            "average_product_price"
        ),

        customer_data.get(
            "average_product_weight"
        ),

        customer_data.get(
            "average_product_photos"
        ),

        prediction,

        satisfied_probability,

        unsatisfied_probability,

        risk_level,

        input_data_json,
    )

    try:
        connection = (
            get_database_connection()
        )

        cursor = connection.cursor()

        cursor.execute(
            query,
            values,
        )

        connection.commit()

        return prediction_id

    except Error:
        if connection is not None:
            connection.rollback()

        raise

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# DASHBOARD METRICS
# ============================================================

def get_dashboard_metrics():
    """
    Calculate dashboard KPI values using real prediction
    records stored in MySQL.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            COUNT(*) AS total_predictions,

            AVG(
                satisfied_probability
            ) AS average_satisfaction,

            SUM(
                CASE
                    WHEN risk_level = 'high'
                    THEN 1
                    ELSE 0
                END
            ) AS high_risk_predictions,

            AVG(
                delivery_delay_days
            ) AS average_delivery_delay

        FROM predictions
    """

    try:
        connection = (
            get_database_connection()
        )

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(query)

        row = cursor.fetchone()

        total_predictions = int(
            row[
                "total_predictions"
            ] or 0
        )

        average_satisfaction = float(
            row[
                "average_satisfaction"
            ] or 0
        )

        high_risk_predictions = int(
            row[
                "high_risk_predictions"
            ] or 0
        )

        average_delivery_delay = float(
            row[
                "average_delivery_delay"
            ] or 0
        )

        high_risk_percentage = 0.0

        if total_predictions > 0:
            high_risk_percentage = (
                high_risk_predictions
                / total_predictions
            ) * 100

        return {
            "total_predictions":
                total_predictions,

            "average_satisfaction":
                round(
                    average_satisfaction
                    * 100,
                    1,
                ),

            "high_risk_predictions":
                high_risk_predictions,

            "high_risk_percentage":
                round(
                    high_risk_percentage,
                    1,
                ),

            "average_delivery_delay":
                round(
                    average_delivery_delay,
                    1,
                ),
        }

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# RECENT PREDICTIONS
# ============================================================

def get_recent_predictions(
    limit=5,
):
    """
    Return the most recently generated model predictions.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            id,
            prediction_id,
            created_at,
            customer_state,
            primary_product_category,
            payment_type,

            total_price,
            total_freight,

            delivery_delay_days,

            prediction,
            satisfied_probability,
            unsatisfied_probability,
            risk_level

        FROM predictions

        ORDER BY created_at DESC, id DESC

        LIMIT %s
    """

    try:
        connection = (
            get_database_connection()
        )

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            query,
            (int(limit),),
        )

        rows = cursor.fetchall()

        predictions = []

        for row in rows:

            predictions.append({
                "id":
                    row["id"],

                "prediction_id":
                    row["prediction_id"],

                "created_at":
                    row["created_at"],

                "customer_state":
                    row["customer_state"],

                "primary_product_category":
                    row[
                        "primary_product_category"
                    ],

                "payment_type":
                    row["payment_type"],

                "total_price":
                    float(
                        row[
                            "total_price"
                        ] or 0
                    ),

                "total_freight":
                    float(
                        row[
                            "total_freight"
                        ] or 0
                    ),

                "delivery_delay_days":
                    float(
                        row[
                            "delivery_delay_days"
                        ] or 0
                    ),

                "prediction":
                    int(
                        row["prediction"]
                    ),

                "satisfied_probability":
                    round(
                        float(
                            row[
                                "satisfied_probability"
                            ]
                        ) * 100,
                        1,
                    ),

                "unsatisfied_probability":
                    round(
                        float(
                            row[
                                "unsatisfied_probability"
                            ]
                        ) * 100,
                        1,
                    ),

                "risk_level":
                    row["risk_level"],
            })

        return predictions

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# FULL PREDICTION HISTORY
# ============================================================

def get_prediction_history():
    """
    Return all saved predictions for the history page.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            id,
            prediction_id,
            created_at,

            customer_state,
            payment_type,
            payment_installments,
            is_weekend,

            total_price,
            total_freight,
            total_products,
            unique_categories,

            delivery_time_days,
            delivery_delay_days,

            primary_product_category,
            average_product_price,
            average_product_weight,
            average_product_photos,

            prediction,
            satisfied_probability,
            unsatisfied_probability,
            risk_level

        FROM predictions

        ORDER BY created_at DESC, id DESC
    """

    try:
        connection = (
            get_database_connection()
        )

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(query)

        rows = cursor.fetchall()

        predictions = []

        for row in rows:

            row[
                "satisfied_probability"
            ] = round(
                float(
                    row[
                        "satisfied_probability"
                    ]
                ) * 100,
                1,
            )

            row[
                "unsatisfied_probability"
            ] = round(
                float(
                    row[
                        "unsatisfied_probability"
                    ]
                ) * 100,
                1,
            )

            numeric_fields = [
                "total_price",
                "total_freight",
                "delivery_time_days",
                "delivery_delay_days",
                "average_product_price",
                "average_product_weight",
                "average_product_photos",
            ]

            for field in numeric_fields:

                if row[field] is not None:
                    row[field] = float(
                        row[field]
                    )

            predictions.append(row)

        return predictions

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# RISK DISTRIBUTION
# ============================================================

def get_risk_distribution():
    """
    Aggregate predictions by operational risk level.
    """

    connection = None
    cursor = None

    result = {
        "low": 0,
        "medium": 0,
        "high": 0,
    }

    query = """
        SELECT
            risk_level,
            COUNT(*) AS total

        FROM predictions

        GROUP BY risk_level
    """

    try:
        connection = (
            get_database_connection()
        )

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(query)

        rows = cursor.fetchall()

        for row in rows:

            risk_level = (
                row["risk_level"]
            )

            if risk_level in result:
                result[risk_level] = int(
                    row["total"]
                )

        total = sum(
            result.values()
        )

        percentages = {
            "low": 0.0,
            "medium": 0.0,
            "high": 0.0,
        }

        if total > 0:

            for risk_level in percentages:

                percentages[
                    risk_level
                ] = round(
                    (
                        result[
                            risk_level
                        ]
                        / total
                    )
                    * 100,
                    1,
                )

        return {
            "total": total,
            "counts": result,
            "percentages": percentages,
        }

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# CATEGORY STATISTICS
# ============================================================

def get_category_statistics():
    """
    Aggregate model results by product category.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            primary_product_category,

            COUNT(*) AS prediction_count,

            AVG(
                satisfied_probability
            ) AS average_satisfaction,

            AVG(
                unsatisfied_probability
            ) AS average_unsatisfaction

        FROM predictions

        WHERE
            primary_product_category
            IS NOT NULL

        GROUP BY
            primary_product_category

        ORDER BY
            prediction_count DESC,
            average_satisfaction DESC
    """

    try:
        connection = (
            get_database_connection()
        )

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(query)

        rows = cursor.fetchall()

        categories = []

        for row in rows:

            categories.append({
                "category":
                    row[
                        "primary_product_category"
                    ],

                "prediction_count":
                    int(
                        row[
                            "prediction_count"
                        ]
                    ),

                "average_satisfaction":
                    round(
                        float(
                            row[
                                "average_satisfaction"
                            ]
                            or 0
                        )
                        * 100,
                        1,
                    ),

                "average_unsatisfaction":
                    round(
                        float(
                            row[
                                "average_unsatisfaction"
                            ]
                            or 0
                        )
                        * 100,
                        1,
                    ),
            })

        return categories

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# SATISFACTION TREND
# ============================================================

def get_satisfaction_trend(
    days=7,
):
    """
    Return daily average satisfaction probability for the
    requested period.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            DATE(created_at) AS prediction_date,

            COUNT(*) AS prediction_count,

            AVG(
                satisfied_probability
            ) AS average_satisfaction

        FROM predictions

        WHERE
            created_at >=
            DATE_SUB(
                CURDATE(),
                INTERVAL %s DAY
            )

        GROUP BY
            DATE(created_at)

        ORDER BY
            prediction_date ASC
    """

    try:
        connection = (
            get_database_connection()
        )

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            query,
            (int(days),),
        )

        rows = cursor.fetchall()

        trend = []

        for row in rows:

            trend.append({
                "date":
                    row[
                        "prediction_date"
                    ],

                "prediction_count":
                    int(
                        row[
                            "prediction_count"
                        ]
                    ),

                "average_satisfaction":
                    round(
                        float(
                            row[
                                "average_satisfaction"
                            ]
                            or 0
                        )
                        * 100,
                        1,
                    ),
            })

        return trend

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()
# ============================================================
# ANALYTICS - STATE STATISTICS
# ============================================================

def get_state_statistics():
    """
    Aggregate prediction results by customer state.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            customer_state,

            COUNT(*) AS prediction_count,

            AVG(
                satisfied_probability
            ) AS average_satisfaction,

            AVG(
                delivery_delay_days
            ) AS average_delivery_delay,

            SUM(
                CASE
                    WHEN risk_level = 'high'
                    THEN 1
                    ELSE 0
                END
            ) AS high_risk_count

        FROM predictions

        WHERE
            customer_state IS NOT NULL
            AND customer_state <> ''

        GROUP BY
            customer_state

        ORDER BY
            prediction_count DESC,
            average_satisfaction DESC
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(query)

        rows = cursor.fetchall()

        states = []

        for row in rows:

            prediction_count = int(
                row["prediction_count"] or 0
            )

            high_risk_count = int(
                row["high_risk_count"] or 0
            )

            high_risk_percentage = 0.0

            if prediction_count > 0:
                high_risk_percentage = (
                    high_risk_count
                    / prediction_count
                ) * 100

            states.append({
                "state":
                    row["customer_state"],

                "prediction_count":
                    prediction_count,

                "average_satisfaction":
                    round(
                        float(
                            row["average_satisfaction"]
                            or 0
                        ) * 100,
                        1,
                    ),

                "average_delivery_delay":
                    round(
                        float(
                            row["average_delivery_delay"]
                            or 0
                        ),
                        1,
                    ),

                "high_risk_count":
                    high_risk_count,

                "high_risk_percentage":
                    round(
                        high_risk_percentage,
                        1,
                    ),
            })

        return states

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# ANALYTICS - PAYMENT STATISTICS
# ============================================================

def get_payment_statistics():
    """
    Aggregate prediction results by payment type.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            payment_type,

            COUNT(*) AS prediction_count,

            AVG(
                satisfied_probability
            ) AS average_satisfaction,

            AVG(
                total_price
            ) AS average_order_value,

            AVG(
                payment_installments
            ) AS average_installments

        FROM predictions

        WHERE
            payment_type IS NOT NULL
            AND payment_type <> ''

        GROUP BY
            payment_type

        ORDER BY
            prediction_count DESC,
            average_satisfaction DESC
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(query)

        rows = cursor.fetchall()

        payments = []

        for row in rows:

            payments.append({
                "payment_type":
                    row["payment_type"],

                "prediction_count":
                    int(
                        row["prediction_count"]
                        or 0
                    ),

                "average_satisfaction":
                    round(
                        float(
                            row["average_satisfaction"]
                            or 0
                        ) * 100,
                        1,
                    ),

                "average_order_value":
                    round(
                        float(
                            row["average_order_value"]
                            or 0
                        ),
                        2,
                    ),

                "average_installments":
                    round(
                        float(
                            row["average_installments"]
                            or 0
                        ),
                        1,
                    ),
            })

        return payments

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# ANALYTICS - DELIVERY STATISTICS
# ============================================================

def get_delivery_statistics():
    """
    Return delivery-related analytics from saved predictions.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            COUNT(*) AS total_predictions,

            AVG(
                delivery_time_days
            ) AS average_delivery_time,

            AVG(
                delivery_delay_days
            ) AS average_delivery_delay,

            SUM(
                CASE
                    WHEN delivery_delay_days > 0
                    THEN 1
                    ELSE 0
                END
            ) AS delayed_predictions,

            SUM(
                CASE
                    WHEN delivery_delay_days = 0
                    THEN 1
                    ELSE 0
                END
            ) AS on_time_predictions,

            SUM(
                CASE
                    WHEN delivery_delay_days < 0
                    THEN 1
                    ELSE 0
                END
            ) AS early_predictions

        FROM predictions
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(query)

        row = cursor.fetchone()

        total_predictions = int(
            row["total_predictions"] or 0
        )

        delayed_predictions = int(
            row["delayed_predictions"] or 0
        )

        on_time_predictions = int(
            row["on_time_predictions"] or 0
        )

        early_predictions = int(
            row["early_predictions"] or 0
        )

        delayed_percentage = 0.0
        on_time_percentage = 0.0
        early_percentage = 0.0

        if total_predictions > 0:

            delayed_percentage = (
                delayed_predictions
                / total_predictions
            ) * 100

            on_time_percentage = (
                on_time_predictions
                / total_predictions
            ) * 100

            early_percentage = (
                early_predictions
                / total_predictions
            ) * 100

        return {
            "total_predictions":
                total_predictions,

            "average_delivery_time":
                round(
                    float(
                        row["average_delivery_time"]
                        or 0
                    ),
                    1,
                ),

            "average_delivery_delay":
                round(
                    float(
                        row["average_delivery_delay"]
                        or 0
                    ),
                    1,
                ),

            "delayed_predictions":
                delayed_predictions,

            "on_time_predictions":
                on_time_predictions,

            "early_predictions":
                early_predictions,

            "delayed_percentage":
                round(
                    delayed_percentage,
                    1,
                ),

            "on_time_percentage":
                round(
                    on_time_percentage,
                    1,
                ),

            "early_percentage":
                round(
                    early_percentage,
                    1,
                ),
        }

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# ANALYTICS - GENERAL BUSINESS STATISTICS
# ============================================================

def get_analytics_summary():
    """
    Return broader analytics metrics for the analytics page.
    """

    connection = None
    cursor = None

    query = """
        SELECT
            COUNT(*) AS total_predictions,

            AVG(
                total_price
            ) AS average_order_value,

            AVG(
                total_freight
            ) AS average_freight,

            AVG(
                total_products
            ) AS average_products,

            AVG(
                unique_categories
            ) AS average_categories,

            AVG(
                average_product_price
            ) AS average_product_price,

            AVG(
                average_product_weight
            ) AS average_product_weight,

            AVG(
                average_product_photos
            ) AS average_product_photos

        FROM predictions
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(query)

        row = cursor.fetchone()

        return {
            "total_predictions":
                int(
                    row["total_predictions"]
                    or 0
                ),

            "average_order_value":
                round(
                    float(
                        row["average_order_value"]
                        or 0
                    ),
                    2,
                ),

            "average_freight":
                round(
                    float(
                        row["average_freight"]
                        or 0
                    ),
                    2,
                ),

            "average_products":
                round(
                    float(
                        row["average_products"]
                        or 0
                    ),
                    1,
                ),

            "average_categories":
                round(
                    float(
                        row["average_categories"]
                        or 0
                    ),
                    1,
                ),

            "average_product_price":
                round(
                    float(
                        row["average_product_price"]
                        or 0
                    ),
                    2,
                ),

            "average_product_weight":
                round(
                    float(
                        row["average_product_weight"]
                        or 0
                    ),
                    1,
                ),

            "average_product_photos":
                round(
                    float(
                        row["average_product_photos"]
                        or 0
                    ),
                    1,
                ),
        }

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()

# ============================================================
# USER AUTHENTICATION & ORGANIZATION MANAGEMENT
# ============================================================

VALID_ORGANIZATION_ROLES = {
    "owner",
    "admin",
    "analyst",
    "operator",
    "viewer",
}


def _normalize_email(email):
    """Normalize an e-mail address before database operations."""
    return str(email or "").strip().lower()


def _normalize_organization_role(role):
    """Validate and normalize an organization membership role."""
    normalized_role = str(role or "").strip().lower()

    if normalized_role not in VALID_ORGANIZATION_ROLES:
        raise ValueError(
            "Geçersiz organizasyon rolü. "
            "İzin verilen roller: "
            "owner, admin, analyst, operator, viewer."
        )

    return normalized_role


def _generate_organization_slug(name):
    """
    Generate a simple URL-friendly organization slug.

    A UUID suffix is added to prevent collisions between
    organizations with similar names.
    """
    normalized_name = str(name or "").strip().lower()

    slug = "".join(
        character if character.isalnum() else "-"
        for character in normalized_name
    )

    slug = "-".join(
        part
        for part in slug.split("-")
        if part
    )

    if not slug:
        slug = "organization"

    unique_suffix = uuid.uuid4().hex[:8]

    return f"{slug}-{unique_suffix}"


# ============================================================
# USER CREATION
# ============================================================

def create_user(
    full_name,
    email,
    password_hash,
    role=None,
):
    """
    Create a new application user.

    Organization authorization is no longer controlled by
    users.role. Organization roles are stored in
    organization_members.

    The legacy users.role column is still populated temporarily
    for backwards compatibility with existing code.
    """
    connection = None
    cursor = None

    normalized_name = str(full_name or "").strip()
    normalized_email = _normalize_email(email)

    if not normalized_name:
        raise ValueError(
            "Kullanıcı adı boş bırakılamaz."
        )

    if not normalized_email:
        raise ValueError(
            "E-posta adresi boş bırakılamaz."
        )

    if not password_hash:
        raise ValueError(
            "Parola özeti boş bırakılamaz."
        )

    legacy_role = (
        str(role).strip()
        if role
        else "Kullanıcı"
    )

    query = """
        INSERT INTO users (
            full_name,
            email,
            password_hash,
            role,
            is_active
        )
        VALUES (%s, %s, %s, %s, TRUE)
    """

    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        cursor.execute(
            query,
            (
                normalized_name,
                normalized_email,
                password_hash,
                legacy_role,
            ),
        )

        connection.commit()

        return int(cursor.lastrowid)

    except Error:
        if connection is not None:
            connection.rollback()

        raise

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# USER LOOKUP
# ============================================================

def get_user_by_email(email):
    """
    Return a user together with organization membership data.

    If the user belongs to an organization, the effective role is
    obtained from organization_members rather than users.role.
    """
    connection = None
    cursor = None

    normalized_email = _normalize_email(email)

    if not normalized_email:
        return None

    query = """
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.password_hash,
            u.is_active,
            u.created_at,
            u.updated_at,

            u.role AS legacy_role,

            om.role AS organization_role,
            om.organization_id,
            om.is_active AS membership_is_active,

            o.name AS organization_name,
            o.slug AS organization_slug,
            o.is_active AS organization_is_active

        FROM users u

        LEFT JOIN organization_members om
            ON om.user_id = u.id
            AND om.is_active = TRUE

        LEFT JOIN organizations o
            ON o.id = om.organization_id
            AND o.is_active = TRUE

        WHERE LOWER(u.email) = %s

        ORDER BY
            CASE om.role
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'analyst' THEN 3
                WHEN 'operator' THEN 4
                WHEN 'viewer' THEN 5
                ELSE 6
            END

        LIMIT 1
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            query,
            (normalized_email,),
        )

        user = cursor.fetchone()

        if user is None:
            return None

        user["role"] = (
            user.get("organization_role")
            or user.get("legacy_role")
        )

        return user

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


def get_user_by_id(user_id):
    """
    Return a user together with organization membership data.
    """
    connection = None
    cursor = None

    try:
        normalized_user_id = int(user_id)

    except (TypeError, ValueError):
        return None

    query = """
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.is_active,
            u.created_at,
            u.updated_at,

            u.role AS legacy_role,

            om.role AS organization_role,
            om.organization_id,
            om.is_active AS membership_is_active,

            o.name AS organization_name,
            o.slug AS organization_slug,
            o.is_active AS organization_is_active

        FROM users u

        LEFT JOIN organization_members om
            ON om.user_id = u.id
            AND om.is_active = TRUE

        LEFT JOIN organizations o
            ON o.id = om.organization_id
            AND o.is_active = TRUE

        WHERE u.id = %s

        ORDER BY
            CASE om.role
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'analyst' THEN 3
                WHEN 'operator' THEN 4
                WHEN 'viewer' THEN 5
                ELSE 6
            END

        LIMIT 1
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            query,
            (normalized_user_id,),
        )

        user = cursor.fetchone()

        if user is None:
            return None

        user["role"] = (
            user.get("organization_role")
            or user.get("legacy_role")
        )

        return user

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


def user_email_exists(email):
    """Check whether an e-mail address is already registered."""
    return get_user_by_email(email) is not None


def update_user_last_login(user_id):
    """
    Compatibility helper for the authentication layer.

    The current users table does not yet contain a last_login
    column, so this function currently verifies that the user
    exists without changing the database.
    """
    return get_user_by_id(user_id) is not None


# ============================================================
# ORGANIZATION LOOKUP
# ============================================================

def get_organization_by_id(organization_id):
    """Return an organization by database id."""
    connection = None
    cursor = None

    try:
        normalized_id = int(organization_id)

    except (TypeError, ValueError):
        return None

    query = """
        SELECT
            id,
            name,
            slug,
            is_active,
            created_at,
            updated_at
        FROM organizations
        WHERE id = %s
        LIMIT 1
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            query,
            (normalized_id,),
        )

        return cursor.fetchone()

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


def get_user_organization(user_id):
    """Return the primary active organization membership of a user."""
    connection = None
    cursor = None

    try:
        normalized_user_id = int(user_id)

    except (TypeError, ValueError):
        return None

    query = """
        SELECT
            om.id AS membership_id,
            om.organization_id,
            om.user_id,
            om.role,
            om.is_active,
            om.joined_at,
            om.updated_at,

            o.name AS organization_name,
            o.slug AS organization_slug

        FROM organization_members om

        INNER JOIN organizations o
            ON o.id = om.organization_id

        WHERE
            om.user_id = %s
            AND om.is_active = TRUE
            AND o.is_active = TRUE

        ORDER BY
            CASE om.role
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'analyst' THEN 3
                WHEN 'operator' THEN 4
                WHEN 'viewer' THEN 5
                ELSE 6
            END

        LIMIT 1
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            query,
            (normalized_user_id,),
        )

        return cursor.fetchone()

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# ORGANIZATION CREATION
# ============================================================

def create_organization(
    name,
    owner_user_id,
    slug=None,
):
    """
    Create an organization and assign its creator as owner.

    Both operations are performed in the same transaction.
    """
    connection = None
    cursor = None

    normalized_name = str(name or "").strip()

    if not normalized_name:
        raise ValueError(
            "Organizasyon adı boş bırakılamaz."
        )

    try:
        normalized_owner_id = int(owner_user_id)

    except (TypeError, ValueError):
        raise ValueError(
            "Geçerli bir kullanıcı kimliği gereklidir."
        )

    normalized_slug = (
        str(slug).strip().lower()
        if slug
        else _generate_organization_slug(
            normalized_name
        )
    )

    organization_query = """
        INSERT INTO organizations (
            name,
            slug,
            is_active
        )
        VALUES (%s, %s, TRUE)
    """

    membership_query = """
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            is_active
        )
        VALUES (%s, %s, 'owner', TRUE)
    """

    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        cursor.execute(
            organization_query,
            (
                normalized_name,
                normalized_slug,
            ),
        )

        organization_id = int(
            cursor.lastrowid
        )

        cursor.execute(
            membership_query,
            (
                organization_id,
                normalized_owner_id,
            ),
        )

        connection.commit()

        return organization_id

    except Error:
        if connection is not None:
            connection.rollback()

        raise

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


# ============================================================
# ORGANIZATION MEMBERSHIP MANAGEMENT
# ============================================================

def add_user_to_organization(
    organization_id,
    user_id,
    role="viewer",
):
    """Add an existing user to an organization."""
    connection = None
    cursor = None

    normalized_role = _normalize_organization_role(
        role
    )

    try:
        normalized_organization_id = int(
            organization_id
        )
        normalized_user_id = int(
            user_id
        )

    except (TypeError, ValueError):
        raise ValueError(
            "Geçerli organizasyon ve kullanıcı kimliği gereklidir."
        )

    query = """
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            is_active
        )
        VALUES (%s, %s, %s, TRUE)
    """

    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        cursor.execute(
            query,
            (
                normalized_organization_id,
                normalized_user_id,
                normalized_role,
            ),
        )

        connection.commit()

        return int(cursor.lastrowid)

    except Error:
        if connection is not None:
            connection.rollback()

        raise

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


def update_organization_member_role(
    organization_id,
    user_id,
    role,
):
    """
    Change a user's role inside an organization.

    The last active owner cannot be demoted accidentally.
    """
    connection = None
    cursor = None

    normalized_role = _normalize_organization_role(
        role
    )

    try:
        normalized_organization_id = int(
            organization_id
        )
        normalized_user_id = int(
            user_id
        )

    except (TypeError, ValueError):
        raise ValueError(
            "Geçerli organizasyon ve kullanıcı kimliği gereklidir."
        )

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                id,
                role
            FROM organization_members
            WHERE
                organization_id = %s
                AND user_id = %s
                AND is_active = TRUE
            LIMIT 1
            """,
            (
                normalized_organization_id,
                normalized_user_id,
            ),
        )

        membership = cursor.fetchone()

        if membership is None:
            raise ValueError(
                "Organizasyon üyeliği bulunamadı."
            )

        current_role = membership["role"]

        if (
            current_role == "owner"
            and normalized_role != "owner"
        ):
            cursor.execute(
                """
                SELECT
                    COUNT(*) AS owner_count
                FROM organization_members
                WHERE
                    organization_id = %s
                    AND role = 'owner'
                    AND is_active = TRUE
                """,
                (normalized_organization_id,),
            )

            owner_row = cursor.fetchone()

            owner_count = int(
                owner_row["owner_count"] or 0
            )

            if owner_count <= 1:
                raise ValueError(
                    "Organizasyonun son hesap sahibi "
                    "başka bir role dönüştürülemez."
                )

        cursor.execute(
            """
            UPDATE organization_members
            SET role = %s
            WHERE
                organization_id = %s
                AND user_id = %s
            """,
            (
                normalized_role,
                normalized_organization_id,
                normalized_user_id,
            ),
        )

        connection.commit()

        return cursor.rowcount > 0

    except Exception:
        if connection is not None:
            connection.rollback()

        raise

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()


def get_organization_members(
    organization_id,
):
    """Return all users belonging to an organization."""
    connection = None
    cursor = None

    try:
        normalized_organization_id = int(
            organization_id
        )

    except (TypeError, ValueError):
        return []

    query = """
        SELECT
            om.id AS membership_id,
            om.organization_id,
            om.user_id,
            om.role,
            om.is_active,
            om.joined_at,

            u.full_name,
            u.email,
            u.is_active AS user_is_active

        FROM organization_members om

        INNER JOIN users u
            ON u.id = om.user_id

        WHERE
            om.organization_id = %s

        ORDER BY
            CASE om.role
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'analyst' THEN 3
                WHEN 'operator' THEN 4
                WHEN 'viewer' THEN 5
                ELSE 6
            END,
            u.full_name ASC
    """

    try:
        connection = get_database_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            query,
            (normalized_organization_id,),
        )

        return cursor.fetchall()

    finally:
        if cursor is not None:
            cursor.close()

        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()