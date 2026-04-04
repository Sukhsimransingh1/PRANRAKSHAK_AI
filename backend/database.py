import sqlite3
import json
from datetime import datetime
from typing import Optional
from contextlib import contextmanager

from config import get_settings
from logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()

DB_PATH = settings.database_url


@contextmanager
def get_connection():
    """Context manager for database connections."""
    conn = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Create all tables if they do not exist."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS patients (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                bed_number  TEXT    NOT NULL,
                age         INTEGER NOT NULL,
                gender      TEXT    NOT NULL,
                created_at  TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS predictions (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id          INTEGER NOT NULL REFERENCES patients(id),
                sepsis_probability  REAL    NOT NULL,
                risk_level          TEXT    NOT NULL,
                shap_json           TEXT    NOT NULL,
                predicted_at        TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vitals (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id  INTEGER NOT NULL REFERENCES patients(id),
                hour        REAL,
                hr          REAL,
                o2sat       REAL,
                temp        REAL,
                sbp         REAL,
                map_val     REAL,
                resp        REAL,
                wbc         REAL,
                creatinine  REAL,
                glucose     REAL,
                age         REAL,
                iculos      REAL,
                row_index   INTEGER NOT NULL,
                recorded_at TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id      INTEGER NOT NULL REFERENCES patients(id),
                patient_name    TEXT    NOT NULL,
                bed_number      TEXT    NOT NULL,
                old_risk_level  TEXT,
                new_risk_level  TEXT    NOT NULL,
                probability     REAL    NOT NULL,
                triggered_at    TEXT    NOT NULL
            );
        """)
    logger.info("Database initialized at %s", DB_PATH)


# ─── Patient helpers ──────────────────────────────────────────────────────────

def create_patient(name: str, bed_number: str, age: int, gender: str) -> int:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO patients (name, bed_number, age, gender, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (name, bed_number, age, gender, now)
        )
    logger.info("Created patient id=%d name=%s", cursor.lastrowid, name)
    return cursor.lastrowid


def get_all_patients() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("""
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
        """).fetchall()
    return [dict(r) for r in rows]


def get_patient_by_id(patient_id: int) -> Optional[dict]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
    return dict(row) if row else None


# ─── Prediction helpers ───────────────────────────────────────────────────────

def save_prediction(
    patient_id: int,
    probability: float,
    risk_level: str,
    shap_factors: list[dict]
) -> int:
    now = datetime.utcnow().isoformat()
    shap_json = json.dumps(shap_factors)
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO predictions "
            "(patient_id, sepsis_probability, risk_level, shap_json, predicted_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (patient_id, round(probability, 4), risk_level, shap_json, now)
        )
    logger.info(
        "Saved prediction patient_id=%d risk=%s prob=%.3f",
        patient_id, risk_level, probability
    )
    return cursor.lastrowid


def get_latest_prediction(patient_id: int) -> Optional[dict]:
    with get_connection() as conn:
        row = conn.execute("""
            SELECT * FROM predictions
            WHERE patient_id = ?
            ORDER BY predicted_at DESC LIMIT 1
        """, (patient_id,)).fetchone()
    if not row:
        return None
    result = dict(row)
    result["shap_factors"] = json.loads(result.pop("shap_json"))
    return result


# ─── Vitals helpers ───────────────────────────────────────────────────────────

def save_vitals_batch(patient_id: int, rows: list[dict]) -> None:
    now = datetime.utcnow().isoformat()
    records = [
        (
            patient_id,
            r.get("Hour"), r.get("HR"), r.get("O2Sat"), r.get("Temp"),
            r.get("SBP"), r.get("MAP"), r.get("Resp"), r.get("WBC"),
            r.get("Creatinine"), r.get("Glucose"), r.get("Age"),
            r.get("ICULOS"), idx, now
        )
        for idx, r in enumerate(rows)
    ]
    with get_connection() as conn:
        conn.executemany("""
            INSERT INTO vitals
            (patient_id, hour, hr, o2sat, temp, sbp, map_val, resp,
             wbc, creatinine, glucose, age, iculos, row_index, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)
    logger.info("Saved %d vitals rows for patient_id=%d", len(rows), patient_id)


def get_vitals_for_patient(patient_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT hour, hr, o2sat, temp, sbp, map_val, resp,
                   wbc, creatinine, glucose, age, iculos, row_index
            FROM vitals
            WHERE patient_id = ?
            ORDER BY row_index ASC
        """, (patient_id,)).fetchall()
    return [dict(r) for r in rows]


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
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO alerts
            (patient_id, patient_name, bed_number,
             old_risk_level, new_risk_level, probability, triggered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (patient_id, patient_name, bed_number,
               old_risk_level, new_risk_level, round(probability, 4), now))
    logger.info(
        "Alert saved patient=%s %s → %s",
        patient_name, old_risk_level, new_risk_level
    )


def get_all_alerts() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT * FROM alerts
            ORDER BY triggered_at DESC
            LIMIT 50
        """).fetchall()
    return [dict(r) for r in rows]