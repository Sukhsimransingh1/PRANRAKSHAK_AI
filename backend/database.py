import os
import json
from datetime import datetime
from typing import Optional

from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import desc

from config import get_settings
from logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Use environment variable if set, otherwise fallback to local settings
DATABASE_URL = os.environ.get("DATABASE_URL", settings.database_url)

# Convert "postgres://" to "postgresql://" for SQLAlchemy compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Check if SQLite is used
is_sqlite = "sqlite" in DATABASE_URL or DATABASE_URL.endswith(".db")

if is_sqlite and not DATABASE_URL.startswith("sqlite:///"):
    DATABASE_URL = f"sqlite:///{DATABASE_URL}"

# Setup engine with connection pool pre-ping
engine_kwargs = {"pool_pre_ping": True}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

if is_sqlite:
    from sqlalchemy import event
    from sqlalchemy.engine import Engine

    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        if type(dbapi_connection).__module__ == "sqlite3":
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# --- Models ---

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    bed_number = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    created_at = Column(String, nullable=False)


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    sepsis_probability = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    shap_json = Column(String, nullable=False)
    predicted_at = Column(String, nullable=False)


class Vital(Base):
    __tablename__ = "vitals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    hour = Column(Float)
    hr = Column(Float)
    o2sat = Column(Float)
    temp = Column(Float)
    sbp = Column(Float)
    map_val = Column(Float)
    resp = Column(Float)
    wbc = Column(Float)
    creatinine = Column(Float)
    glucose = Column(Float)
    age = Column(Float)
    iculos = Column(Float)
    row_index = Column(Integer, nullable=False)
    recorded_at = Column(String, nullable=False)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    patient_name = Column(String, nullable=False)
    bed_number = Column(String, nullable=False)
    old_risk_level = Column(String)
    new_risk_level = Column(String, nullable=False)
    probability = Column(Float, nullable=False)
    triggered_at = Column(String, nullable=False)


def init_db() -> None:
    """Create all tables if they do not exist."""
    Base.metadata.create_all(bind=engine)
    display_url = DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL
    logger.info("Database initialized with SQLAlchemy at %s", display_url)


# ─── Patient helpers ──────────────────────────────────────────────────────────

def create_patient(name: str, bed_number: str, age: int, gender: str) -> int:
    now = datetime.utcnow().isoformat()
    db = SessionLocal()
    try:
        new_patient = Patient(
            name=name,
            bed_number=bed_number,
            age=age,
            gender=gender,
            created_at=now
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        patient_id = new_patient.id
        logger.info("Created patient id=%d name=%s", patient_id, name)
        return patient_id
    finally:
        db.close()


def get_all_patients() -> list[dict]:
    db = SessionLocal()
    try:
        query = text("""
            SELECT
                p.id, p.name, p.bed_number, p.age, p.gender, p.created_at,
                pr.sepsis_probability  AS latest_probability,
                pr.risk_level          AS latest_risk_level,
                pr.predicted_at        AS latest_predicted_at
            FROM patients p
            LEFT JOIN predictions pr ON pr.id = (
                SELECT id FROM predictions
                WHERE patient_id = p.id
                ORDER BY predicted_at DESC LIMIT 1
            )
            ORDER BY
                CASE pr.risk_level
                    WHEN 'HIGH'   THEN 1
                    WHEN 'MEDIUM' THEN 2
                    WHEN 'LOW'    THEN 3
                    ELSE 4
                END,
                pr.sepsis_probability DESC
        """)
        rows = db.execute(query).mappings().all()
        return [dict(r) for r in rows]
    finally:
        db.close()


def get_patient_by_id(patient_id: int) -> Optional[dict]:
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            return {
                "id": patient.id,
                "name": patient.name,
                "bed_number": patient.bed_number,
                "age": patient.age,
                "gender": patient.gender,
                "created_at": patient.created_at
            }
        return None
    finally:
        db.close()


def delete_patient(patient_id: int) -> bool:
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return False
        
        # Cascade delete related records
        db.query(Vital).filter(Vital.patient_id == patient_id).delete()
        db.query(Prediction).filter(Prediction.patient_id == patient_id).delete()
        db.query(Alert).filter(Alert.patient_id == patient_id).delete()
        db.delete(patient)
        db.commit()
        logger.info("Deleted patient id=%d and all related records", patient_id)
        return True
    finally:
        db.close()


# ─── Prediction helpers ───────────────────────────────────────────────────────

def save_prediction(
    patient_id: int,
    probability: float,
    risk_level: str,
    shap_factors: list[dict]
) -> int:
    now = datetime.utcnow().isoformat()
    shap_json = json.dumps(shap_factors)
    db = SessionLocal()
    try:
        prediction = Prediction(
            patient_id=patient_id,
            sepsis_probability=round(probability, 4),
            risk_level=risk_level,
            shap_json=shap_json,
            predicted_at=now
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        pred_id = prediction.id
        logger.info(
            "Saved prediction patient_id=%d risk=%s prob=%.3f",
            patient_id, risk_level, probability
        )
        return pred_id
    finally:
        db.close()


def get_latest_prediction(patient_id: int) -> Optional[dict]:
    db = SessionLocal()
    try:
        pred = db.query(Prediction).filter(Prediction.patient_id == patient_id).order_by(desc(Prediction.predicted_at)).first()
        if not pred:
            return None
        
        return {
            "id": pred.id,
            "patient_id": pred.patient_id,
            "sepsis_probability": pred.sepsis_probability,
            "risk_level": pred.risk_level,
            "shap_factors": json.loads(pred.shap_json),
            "predicted_at": pred.predicted_at
        }
    finally:
        db.close()


# ─── Vitals helpers ───────────────────────────────────────────────────────────

def save_vitals_batch(patient_id: int, rows: list[dict]) -> None:
    now = datetime.utcnow().isoformat()
    db = SessionLocal()
    try:
        vitals = [
            Vital(
                patient_id=patient_id,
                hour=r.get("Hour"),
                hr=r.get("HR"),
                o2sat=r.get("O2Sat"),
                temp=r.get("Temp"),
                sbp=r.get("SBP"),
                map_val=r.get("MAP"),
                resp=r.get("Resp"),
                wbc=r.get("WBC"),
                creatinine=r.get("Creatinine"),
                glucose=r.get("Glucose"),
                age=r.get("Age"),
                iculos=r.get("ICULOS"),
                row_index=idx,
                recorded_at=now
            )
            for idx, r in enumerate(rows)
        ]
        db.bulk_save_objects(vitals)
        db.commit()
        logger.info("Saved %d vitals rows for patient_id=%d", len(rows), patient_id)
    finally:
        db.close()


def get_vitals_for_patient(patient_id: int) -> list[dict]:
    db = SessionLocal()
    try:
        vitals = db.query(Vital).filter(Vital.patient_id == patient_id).order_by(Vital.row_index).all()
        return [
            {
                "hour": v.hour,
                "hr": v.hr,
                "o2sat": v.o2sat,
                "temp": v.temp,
                "sbp": v.sbp,
                "map_val": v.map_val,
                "resp": v.resp,
                "wbc": v.wbc,
                "creatinine": v.creatinine,
                "glucose": v.glucose,
                "age": v.age,
                "iculos": v.iculos,
                "row_index": v.row_index
            }
            for v in vitals
        ]
    finally:
        db.close()


# ─── Alert helpers ────────────────────────────────────────────────────────────

def save_alert(
    patient_id: int,
    patient_name: str,
    bed_number: str,
    old_risk_level: Optional[str],
    new_risk_level: str,
    probability: float
) -> None:
    now = datetime.utcnow().isoformat()
    db = SessionLocal()
    try:
        alert = Alert(
            patient_id=patient_id,
            patient_name=patient_name,
            bed_number=bed_number,
            old_risk_level=old_risk_level,
            new_risk_level=new_risk_level,
            probability=round(probability, 4),
            triggered_at=now
        )
        db.add(alert)
        db.commit()
        logger.info(
            "Alert saved patient=%s %s → %s",
            patient_name, old_risk_level, new_risk_level
        )
    finally:
        db.close()


def get_all_alerts() -> list[dict]:
    db = SessionLocal()
    try:
        alerts = db.query(Alert).order_by(desc(Alert.triggered_at)).limit(50).all()
        return [
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "patient_name": a.patient_name,
                "bed_number": a.bed_number,
                "old_risk_level": a.old_risk_level,
                "new_risk_level": a.new_risk_level,
                "probability": a.probability,
                "triggered_at": a.triggered_at
            }
            for a in alerts
        ]
    finally:
        db.close()