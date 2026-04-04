from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# ─── Shared ───────────────────────────────────────────────────────────────────

class ShapFactor(BaseModel):
    feature: str
    impact: float
    direction: str  # "increases_risk" | "decreases_risk"


# ─── Patient ──────────────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    bed_number: str = Field(..., min_length=1, max_length=20)
    age: int = Field(..., ge=0, le=120)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")


class PatientSummary(BaseModel):
    id: int
    name: str
    bed_number: str
    age: int
    gender: str
    created_at: str
    latest_probability: Optional[float] = None
    latest_risk_level: Optional[str] = None
    latest_predicted_at: Optional[str] = None


class VitalsRow(BaseModel):
    hour: Optional[float] = None
    hr: Optional[float] = None
    o2sat: Optional[float] = None
    temp: Optional[float] = None
    sbp: Optional[float] = None
    map_val: Optional[float] = None
    resp: Optional[float] = None
    wbc: Optional[float] = None
    creatinine: Optional[float] = None
    glucose: Optional[float] = None
    age: Optional[float] = None
    iculos: Optional[float] = None
    row_index: int


class PatientDetail(PatientSummary):
    shap_factors: Optional[list[ShapFactor]] = None
    vitals: list[VitalsRow] = []


# ─── Prediction ───────────────────────────────────────────────────────────────

class PredictionResult(BaseModel):
    patient_id: int
    sepsis_probability: float
    risk_level: str
    shap_factors: list[ShapFactor]
    predicted_at: str


# ─── Alert ────────────────────────────────────────────────────────────────────

class AlertResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    bed_number: str
    old_risk_level: Optional[str] = None
    new_risk_level: str
    probability: float
    triggered_at: str


# ─── Copilot ──────────────────────────────────────────────────────────────────

class CopilotResponse(BaseModel):
    patient_id: int
    question: str
    answer: str


# ─── Generic responses ────────────────────────────────────────────────────────

class SuccessResponse(BaseModel):
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None