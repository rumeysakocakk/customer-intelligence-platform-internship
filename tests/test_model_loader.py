from src.model_loader import load_model


def test_model_loads_successfully():
    model = load_model()

    assert model is not None