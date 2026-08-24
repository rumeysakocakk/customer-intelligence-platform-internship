from pathlib import Path


# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Model directory
MODEL_DIR = PROJECT_ROOT / "models"

# Final production model
MODEL_PATH = MODEL_DIR / "customer_satisfaction_model.joblib"