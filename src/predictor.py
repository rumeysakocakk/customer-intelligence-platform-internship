import pandas as pd

from src.model_loader import load_model


# Load the trained production model when the module is initialized.
# This prevents the model file from being reloaded for every prediction.
model = load_model()


def predict_customer_satisfaction(customer_data):
    """
    Predict customer satisfaction using the trained production pipeline.

    Parameters
    ----------
    customer_data : dict
        Input features for a single customer observation.

    Returns
    -------
    dict
        Predicted class together with satisfied and unsatisfied probabilities.
    """

    # Convert the input dictionary into the tabular format expected by the pipeline.
    input_df = pd.DataFrame([customer_data])

    # Generate the predicted class.
    prediction = int(model.predict(input_df)[0])

    # Retrieve the probability associated with each target class.
    probabilities = model.predict_proba(input_df)[0]

    # Return prediction results in a format suitable for downstream applications.
    return {
        "prediction": prediction,
        "unsatisfied_probability": float(probabilities[0]),
        "satisfied_probability": float(probabilities[1]),
    }