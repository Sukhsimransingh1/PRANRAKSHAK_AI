import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from config import get_settings
from logging_config import get_logger
from utils import get_display_name

# Import feature engineering from predictor
from predictor import _engineer_features

logger = get_logger(__name__)
settings = get_settings()

_explainer = None
_pipeline = None


# ----------------------------------------------------------
# LOAD EXPLAINER
# ----------------------------------------------------------

def load_explainer(pipeline) -> None:
    """
    Load SHAP explainer from disk.
    """

    global _explainer, _pipeline

    path = Path(settings.shap_explainer_path)

    logger.info("Attempting to load SHAP explainer from: %s", path)

    if not path.exists():
        logger.warning(
            "SHAP explainer not found at %s — explanations will be skipped.",
            path,
        )
        return

    try:
        _explainer = joblib.load(path)
        _pipeline = pipeline

        logger.info("SHAP explainer loaded successfully.")
        logger.info("Explainer type: %s", type(_explainer))

    except Exception as exc:
        logger.error("Failed to load SHAP explainer: %s", exc)


# ----------------------------------------------------------
# EXPLAIN
# ----------------------------------------------------------

def explain(df: pd.DataFrame) -> list[dict]:
    """
    Generate top-5 SHAP explanations using engineered features.
    """

    logger.info("=== SHAP explain() ENTERED ===")

    logger.info("Explainer loaded: %s", _explainer is not None)
    logger.info("Pipeline loaded: %s", _pipeline is not None)

    if _explainer is None:
        logger.warning("SHAP explainer is None — returning empty list.")
        return []

    try:
        # --------------------------------------------------
        # STEP 1 — Engineer features
        # --------------------------------------------------

        logger.info("Starting feature engineering...")

        feature_row = _engineer_features(df)

        logger.info(
            "Feature engineering completed."
        )

        logger.info(
            "Feature row shape: %s",
            feature_row.shape,
        )

        logger.info(
            "Number of features: %d",
            len(feature_row.columns),
        )

        logger.info(
            "First 5 feature names: %s",
            list(feature_row.columns)[:5],
        )

        # --------------------------------------------------
        # STEP 2 — Run SHAP
        # --------------------------------------------------

        logger.info("Running SHAP computation...")

        shap_values = _explainer.shap_values(feature_row)

        logger.info(
            "SHAP computation completed."
        )

        logger.info(
            "Type of shap_values: %s",
            type(shap_values),
        )

        if isinstance(shap_values, list):

            logger.info(
                "SHAP returned list with length: %d",
                len(shap_values),
            )

            values = shap_values[1][0]

            logger.info(
                "Class-1 SHAP values shape: %s",
                np.array(values).shape,
            )

        else:

            values = shap_values[0]

            logger.info(
                "SHAP values array shape: %s",
                np.array(values).shape,
            )

        feature_names = list(feature_row.columns)

        logger.info(
            "Number of feature names: %d",
            len(feature_names),
        )

        # --------------------------------------------------
        # VALIDATION CHECK
        # --------------------------------------------------

        if len(feature_names) != len(values):

            logger.error(
                "Mismatch: feature_names=%d shap_values=%d",
                len(feature_names),
                len(values),
            )

            return []

    except Exception as exc:

        logger.error(
            "SHAP explanation failed: %s",
            exc,
            exc_info=True,
        )

        return []

    # ------------------------------------------------------
    # STEP 3 — Build explanation factors
    # ------------------------------------------------------

    logger.info("Building SHAP factors...")

    factors = []

    for feature, impact in zip(feature_names, values):

        factors.append({
            "feature": feature,
            "display_name": get_display_name(feature),
            "impact": round(float(impact), 4),
            "direction":
                "increases_risk"
                if impact > 0
                else "decreases_risk",
        })

    logger.info(
        "Total factors created: %d",
        len(factors),
    )

    # ------------------------------------------------------
    # STEP 4 — Sort and select top 5
    # ------------------------------------------------------

    factors.sort(
        key=lambda x: abs(x["impact"]),
        reverse=True,
    )

    top5 = factors[:5]

    logger.info(
        "Top 5 SHAP factors generated: %d",
        len(top5),
    )

    if len(top5) > 0:

        logger.info(
            "Top factor: %s impact=%.4f",
            top5[0]["feature"],
            top5[0]["impact"],
        )

    else:

        logger.warning(
            "SHAP returned zero factors."
        )

    return top5