import io
import pandas as pd
import shap
from fastapi import HTTPException
from logging_config import get_logger

logger = get_logger(__name__)

# We need an object that has a .shap_values() method for the production pipeline
class ShapExplainerWrapper:
    def __init__(self, model_predict_func, background):
        # Use the most generic Explainer
        self.explainer = shap.Explainer(model_predict_func, background)
    
    def shap_values(self, X):
        # The production pipeline expects a list [class0_values, class1_values]
        # or a single array for regression/some boosters.
        # We'll provide a list to match the existing logic's expectation.
        explanation = self.explainer(X)
        # explanation.values has shape (N, features, 2) for binary predict_proba
        if len(explanation.values.shape) == 3: # (N, features, 2)
            return [explanation.values[:,:,0], explanation.values[:,:,1]]
        else: # (N, features)
            # If it's (N, features), it's likely already class 1 impact
            return [None, explanation.values]

REQUIRED_FEATURES = [
    "Hour", "HR", "O2Sat", "Temp", "SBP",
    "MAP", "Resp", "WBC", "Creatinine", "Glucose", "Age", "ICULOS"
]

FEATURE_DISPLAY_NAMES = {
    "Hour": "Hour of Day",
    "HR": "Heart Rate",
    "O2Sat": "Oxygen Saturation",
    "Temp": "Temperature",
    "SBP": "Systolic Blood Pressure",
    "MAP": "Mean Arterial Pressure",
    "Resp": "Respiratory Rate",
    "WBC": "White Blood Cell Count",
    "Creatinine": "Creatinine",
    "Glucose": "Glucose",
    "Age": "Age",
    "ICULOS": "ICU Length of Stay",
}


def parse_and_validate_csv(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """
    Parse uploaded CSV bytes into a validated DataFrame.
    Raises HTTP 422 if structure is invalid.
    Returns DataFrame with exactly REQUIRED_FEATURES columns,
    rows ordered as uploaded.
    """
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=422,
            detail="Only .csv files are accepted."
        )

    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as exc:
        logger.warning("CSV parse error: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse CSV: {str(exc)}"
        )

    if df.empty:
        raise HTTPException(
            status_code=422,
            detail="Uploaded CSV contains no data rows."
        )

    missing_cols = [c for c in REQUIRED_FEATURES if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=422,
            detail=(
                f"CSV is missing required columns: {missing_cols}. "
                f"Required: {REQUIRED_FEATURES}"
            )
        )

    df = df[REQUIRED_FEATURES].copy()
    df = df.apply(pd.to_numeric, errors="coerce")

    logger.info(
        "CSV validated: %d rows, %d cols, file=%s",
        len(df), len(df.columns), filename
    )
    return df


def dataframe_to_records(df: pd.DataFrame) -> list[dict]:
    """Convert DataFrame to list of dicts, replacing NaN with None."""
    return [
        {
            k: (None if pd.isna(v) else float(v))
            for k, v in row.items()
        }
        for row in df.to_dict(orient="records")
    ]


def get_display_name(feature: str) -> str:
    return FEATURE_DISPLAY_NAMES.get(feature, feature)