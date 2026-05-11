import numpy as np
import pandas as pd
import shap
from logging_config import get_logger
from utils import get_display_name

# Import feature engineering from predictor
from predictor import _engineer_features

logger = get_logger(__name__)

_explainer = None
_pipeline = None


# ----------------------------------------------------------
# LOAD EXPLAINER
# ----------------------------------------------------------

def load_explainer(pipeline) -> None:
    """
    Create SHAP explainer on-the-fly from the trained model.
    
    Instead of loading from disk (unreliable across versions),
    we create a fresh TreeExplainer from the pipeline's estimator.
    This avoids pickle deserialization issues and ensures compatibility.
    """

    global _explainer, _pipeline

    if pipeline is None:
        logger.warning("Pipeline is None — cannot create SHAP explainer.")
        return

    try:
        _pipeline = pipeline
        
        # Extract the XGBoost model from the sklearn pipeline
        # Typical structure: Pipeline -> [preprocessor, xgb_model]
        # We need the estimator (usually the last step named 'model' or similar)
        if hasattr(pipeline, 'named_steps'):
            # It's a sklearn Pipeline
            estimator = pipeline.named_steps.get('model') or pipeline.steps[-1][1]
            logger.info("Extracted estimator from pipeline: %s", type(estimator).__name__)
        else:
            # It's a standalone model
            estimator = pipeline
            logger.info("Using pipeline as estimator: %s", type(estimator).__name__)
        
        # Create TreeExplainer for XGBoost model
        _explainer = shap.TreeExplainer(estimator)
        
        logger.info("SHAP TreeExplainer created successfully.")
        logger.info("Explainer type: %s", type(_explainer).__name__)

    except Exception as exc:
        logger.error(
            "Failed to create SHAP explainer: %s",
            exc,
            exc_info=True
        )


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

        # Handle different SHAP output formats
        # TreeExplainer for binary XGBoost returns list: [class_0_values, class_1_values]
        if isinstance(shap_values, list):
            logger.info(
                "SHAP returned list with length: %d",
                len(shap_values),
            )
            
            if len(shap_values) >= 2:
                # Binary classifier: use class 1 (positive/sepsis class)
                class_1_values = shap_values[1]
                values = class_1_values[0]  # First (only) sample
                logger.info(
                    "Using class-1 SHAP values (sepsis risk)"
                )
            else:
                # Fallback: use first class if only one available
                values = shap_values[0][0]
                logger.warning(
                    "Only one class in SHAP output, using class-0"
                )

        elif isinstance(shap_values, np.ndarray):
            # numpy array output (regression or single output)
            logger.info(
                "SHAP returned numpy array with shape: %s",
                shap_values.shape,
            )
            if len(shap_values.shape) == 2:
                # Shape: (n_samples, n_features)
                values = shap_values[0]
            else:
                # Unexpected shape
                logger.error(
                    "Unexpected SHAP array shape: %s",
                    shap_values.shape,
                )
                return []

        else:
            logger.error(
                "Unexpected SHAP values type: %s",
                type(shap_values).__name__,
            )
            return []

        feature_names = list(feature_row.columns)

        logger.info(
            "Number of feature names: %d, Number of SHAP values: %d",
            len(feature_names),
            len(values),
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