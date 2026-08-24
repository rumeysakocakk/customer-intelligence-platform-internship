import joblib

from src.config import MODEL_PATH


def load_model():
    """
    Load the trained customer satisfaction model from disk.

    Returns
    -------
    model
        The persisted preprocessing and classification pipeline.
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )

    model = joblib.load(MODEL_PATH)

    return model