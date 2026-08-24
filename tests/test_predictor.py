from src.model_loader import load_model


EXPECTED_FEATURES = [
    "customer_state",
    "total_price",
    "total_freight",
    "total_products",
    "average_product_price",
    "approval_time_days",
    "delivery_time_days",
    "carrier_delivery_days",
    "delivery_delay_days",
    "total_payment",
    "payment_installments",
    "payment_type",
    "unique_products",
    "unique_categories",
    "primary_product_category",
    "average_product_weight",
    "average_product_length",
    "average_product_height",
    "average_product_width",
    "average_product_photos",
    "purchase_year",
    "purchase_month",
    "purchase_day",
    "purchase_day_of_week",
    "purchase_hour",
    "is_weekend",
    "absolute_delivery_difference_days",
]


def test_model_expected_features():
    """Verify that the persisted model expects the production feature schema."""

    model = load_model()

    assert model.feature_names_in_.tolist() == EXPECTED_FEATURES
    assert len(EXPECTED_FEATURES) == 27


from src.predictor import predict_customer_satisfaction


def test_prediction_output_structure():
    """Verify that the predictor returns a valid prediction response."""

    sample_customer = {
        "customer_state": "SP",
        "total_price": 150.0,
        "total_freight": 20.0,
        "total_products": 1,
        "average_product_price": 150.0,
        "approval_time_days": 0.5,
        "delivery_time_days": 8.0,
        "carrier_delivery_days": 6.0,
        "delivery_delay_days": 0.0,
        "total_payment": 170.0,
        "payment_installments": 2,
        "payment_type": "credit_card",
        "unique_products": 1,
        "unique_categories": 1,
        "primary_product_category": "bed_bath_table",
        "average_product_weight": 1200.0,
        "average_product_length": 30.0,
        "average_product_height": 15.0,
        "average_product_width": 25.0,
        "average_product_photos": 2.0,
        "purchase_year": 2018,
        "purchase_month": 5,
        "purchase_day": 15,
        "purchase_day_of_week": 1,
        "purchase_hour": 14,
        "is_weekend": 0,
        "absolute_delivery_difference_days": 3.0,
    }

    result = predict_customer_satisfaction(sample_customer)

    assert result["prediction"] in [0, 1]
    assert 0.0 <= result["unsatisfied_probability"] <= 1.0
    assert 0.0 <= result["satisfied_probability"] <= 1.0

    assert abs(
        result["unsatisfied_probability"]
        + result["satisfied_probability"]
        - 1.0
    ) < 1e-6