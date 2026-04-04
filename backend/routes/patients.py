import database
import predictor
import shap_explainer
import alert_engine

from utils import parse_and_validate_csv, dataframe_to_records
from models import PatientSummary, PatientDetail
from logging_config import get_logger

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime
from typing import Optional
import time

router = APIRouter(prefix="/patients", tags=["Patients"])
logger = get_logger(__name__)


# ─────────────────────────────────────────────────────────
# CREATE PATIENT
# ─────────────────────────────────────────────────────────

@router.post("", response_model=PatientDetail, status_code=201)
async def create_patient(
    name: str = Form(...),
    bed_number: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Create a new patient and run full prediction pipeline.
    """

    start_time = time.time()

    logger.info(
        "Creating patient: name=%s bed=%s",
        name,
        bed_number,
    )

    # ------------------------------------------------------
    # 1. Parse CSV
    # ------------------------------------------------------

    file_bytes = await file.read()

    df = parse_and_validate_csv(
        file_bytes,
        file.filename,
    )

    logger.info(
        "CSV parsed successfully: rows=%d",
        len(df),
    )

    # ------------------------------------------------------
    # 2. Create patient
    # ------------------------------------------------------

    patient_id = database.create_patient(
        name,
        bed_number,
        age,
        gender,
    )

    logger.info(
        "Patient created with id=%d",
        patient_id,
    )

    # ------------------------------------------------------
    # 3. Save vitals
    # ------------------------------------------------------

    vitals_records = dataframe_to_records(df)

    database.save_vitals_batch(
        patient_id,
        vitals_records,
    )

    logger.info(
        "Vitals saved: count=%d",
        len(vitals_records),
    )

    # ------------------------------------------------------
    # 4. Prediction
    # ------------------------------------------------------

    logger.info("Starting prediction...")

    pred = predictor.predict(df)

    logger.info(
        "Prediction complete: prob=%.4f risk=%s",
        pred["probability"],
        pred["risk_level"],
    )

    # ------------------------------------------------------
    # 5. SHAP explanation
    # ------------------------------------------------------

    logger.info("Starting SHAP explanation...")

    shap_factors = shap_explainer.explain(df)

    logger.info(
        "SHAP factors generated: count=%d",
        len(shap_factors),
    )

    # ------------------------------------------------------
    # 6. Save prediction
    # ------------------------------------------------------

    database.save_prediction(
        patient_id=patient_id,
        probability=pred["probability"],
        risk_level=pred["risk_level"],
        shap_factors=shap_factors,
    )

    logger.info(
        "Prediction saved to database."
    )

    # ------------------------------------------------------
    # 7. Alert check
    # ------------------------------------------------------

    alert_engine.check_and_trigger(
        patient_id=patient_id,
        patient_name=name,
        bed_number=bed_number,
        new_risk_level=pred["risk_level"],
        probability=pred["probability"],
    )

    # ------------------------------------------------------
    # 8. Response assembly
    # ------------------------------------------------------

    patient = database.get_patient_by_id(
        patient_id
    )

    vitals = database.get_vitals_for_patient(
        patient_id
    )

    latest_pred = database.get_latest_prediction(
        patient_id
    )

    elapsed = round(
        time.time() - start_time,
        2,
    )

    logger.info(
        "Patient pipeline completed in %.2f seconds",
        elapsed,
    )

    return _build_patient_detail(
        patient,
        latest_pred,
        vitals,
    )


# ─────────────────────────────────────────────────────────
# LIST PATIENTS
# ─────────────────────────────────────────────────────────

@router.get("", response_model=list[PatientSummary])
def list_patients():

    rows = database.get_all_patients()

    return rows


# ─────────────────────────────────────────────────────────
# GET SINGLE PATIENT
# ─────────────────────────────────────────────────────────

@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient(patient_id: int):

    patient = database.get_patient_by_id(
        patient_id
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    latest_pred = database.get_latest_prediction(
        patient_id
    )

    vitals = database.get_vitals_for_patient(
        patient_id
    )

    return _build_patient_detail(
        patient,
        latest_pred,
        vitals,
    )


# ─────────────────────────────────────────────────────────
# INTERNAL HELPER
# ─────────────────────────────────────────────────────────

def _build_patient_detail(
    patient: dict,
    prediction: Optional[dict],
    vitals: list[dict],
) -> dict:

    return {
        "id": patient["id"],
        "name": patient["name"],
        "bed_number": patient["bed_number"],
        "age": patient["age"],
        "gender": patient["gender"],
        "created_at": patient["created_at"],

        "latest_probability":
            prediction["sepsis_probability"]
            if prediction
            else None,

        "latest_risk_level":
            prediction["risk_level"]
            if prediction
            else None,

        "latest_predicted_at":
            prediction["predicted_at"]
            if prediction
            else None,

        "shap_factors":
            prediction["shap_factors"]
            if prediction
            else [],

        "vitals":
            vitals,
    }