from fastapi import APIRouter, UploadFile, File, HTTPException
import database
import predictor
import shap_explainer
import alert_engine
from utils import parse_and_validate_csv, dataframe_to_records
from models import PredictionResult
from logging_config import get_logger
from datetime import datetime

router = APIRouter(prefix="/patients", tags=["Predictions"])
logger = get_logger(__name__)


@router.post("/{patient_id}/predict", response_model=PredictionResult)
async def rerun_prediction(
    patient_id: int,
    file: UploadFile = File(...),
):
    """
    Re-run the prediction pipeline for an existing patient
    with a new CSV upload. Replaces stored vitals and prediction.
    Returns the new prediction result including SHAP factors.
    """
    patient = database.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # 1. Parse and validate new CSV
    file_bytes = await file.read()
    df = parse_and_validate_csv(file_bytes, file.filename)

    # 2. Overwrite vitals in DB
    database.save_vitals_batch(patient_id, dataframe_to_records(df))

    # 3. Run prediction + explanation
    pred = predictor.predict(df)
    shap_factors = shap_explainer.explain(df)

    # 4. Save new prediction
    database.save_prediction(
        patient_id=patient_id,
        probability=pred["probability"],
        risk_level=pred["risk_level"],
        shap_factors=shap_factors,
    )

    # 5. Alert check
    alert_engine.check_and_trigger(
        patient_id=patient_id,
        patient_name=patient["name"],
        bed_number=patient["bed_number"],
        new_risk_level=pred["risk_level"],
        probability=pred["probability"],
    )

    now = datetime.utcnow().isoformat()

    logger.info(
        "Re-run prediction patient_id=%d risk=%s prob=%.4f",
        patient_id, pred["risk_level"], pred["probability"]
    )

    return {
        "patient_id": patient_id,
        "sepsis_probability": pred["probability"],
        "risk_level": pred["risk_level"],
        "shap_factors": shap_factors,
        "predicted_at": now,
    }