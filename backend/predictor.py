import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from fastapi import HTTPException

from config import get_settings
from logging_config import get_logger
from utils import REQUIRED_FEATURES

logger = get_logger(__name__)
settings = get_settings()

_pipeline = None


# ----------------------------------------------------------
# MODEL LOADING
# ----------------------------------------------------------

def load_model():
    """
    Load the trained sklearn Pipeline once at startup.
    """
    global _pipeline

    path = Path(settings.model_path)

    if not path.exists():
        logger.error("Model file not found at %s", path)
        raise FileNotFoundError(f"Model not found: {path}")

    _pipeline = joblib.load(path)

    logger.info("Model loaded from %s", path)

    # Debug once — helps confirm schema
    try:
        logger.info(
            "Model expects features: %s",
            list(_pipeline.feature_names_in_)
        )
    except Exception:
        pass

    return _pipeline


# ----------------------------------------------------------
# RISK LOGIC
# ----------------------------------------------------------

def _probability_to_risk(probability: float) -> str:
    if probability >= 0.75:
        return "HIGH"
    elif probability >= 0.40:
        return "MEDIUM"
    return "LOW"


# ----------------------------------------------------------
# FEATURE ENGINEERING
# ----------------------------------------------------------

BASE_FEATURES = [
    "HR",
    "O2Sat",
    "Temp",
    "SBP",
    "MAP",
    "Resp",
    "WBC",
    "Creatinine",
    "Glucose",
]


def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert raw time-series vitals into model-required features.

    Generates:
        HR_last
        HR_mean
        HR_std
        HR_trend
        etc.
    """

    features = {}

    for col in BASE_FEATURES:

        if col not in df.columns:
            continue

        series = df[col].dropna()

        if len(series) == 0:
            continue

        # Last value
        features[f"{col}_last"] = float(series.iloc[-1])

        # Mean
        features[f"{col}_mean"] = float(series.mean())

        # Standard deviation
        features[f"{col}_std"] = float(series.std())

        # Trend (slope)
        if len(series) > 1:
            x = np.arange(len(series))
            slope = np.polyfit(x, series, 1)[0]
        else:
            slope = 0.0

        features[f"{col}_trend"] = float(slope)

    # Required static features
    if "Age" in df.columns:
        features["Age"] = float(df["Age"].iloc[-1])

    if "ICULOS" in df.columns:
        features["ICULOS"] = float(df["ICULOS"].iloc[-1])

    return pd.DataFrame([features])


# ----------------------------------------------------------
# PREDICTION
# ----------------------------------------------------------

def predict(df: pd.DataFrame) -> dict:
    """
    Run sepsis prediction on validated patient time-series.

    Args:
        df: Raw patient DataFrame (multiple rows)

    Returns:
        {
            probability: float,
            risk_level: str
        }
    """

    if _pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Prediction model is not loaded."
        )

    try:
        # Step 1 — Engineer features
        features_df = _engineer_features(df)

        logger.debug(
            "Engineered features columns: %s",
            list(features_df.columns)
        )

        # Step 2 — Run prediction
        prob_array = _pipeline.predict_proba(features_df)

        probability = float(prob_array[0][1])

    except Exception as exc:
        logger.error("Prediction failed: %s", exc)

        raise HTTPException(
            status_code=500,
            detail=f"Prediction pipeline error: {str(exc)}"
        )

    risk_level = _probability_to_risk(probability)

    logger.info(
        "Prediction complete: prob=%.4f risk=%s rows_in_csv=%d",
        probability,
        risk_level,
        len(df),
    )

    return {
        "probability": round(probability, 4),
        "risk_level": risk_level,
    }