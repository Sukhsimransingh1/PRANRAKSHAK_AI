from typing import Optional
from logging_config import get_logger
import database

logger = get_logger(__name__)

RISK_ORDER = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}


def check_and_trigger(
    patient_id: int,
    patient_name: str,
    bed_number: str,
    new_risk_level: str,
    probability: float,
) -> bool:
    """
    Compare new risk level against the previous prediction.
    If risk has escalated, save an alert and return True.
    Returns False if no escalation occurred.
    """
    previous = database.get_latest_prediction(patient_id)
    old_risk_level: Optional[str] = None

    if previous:
        old_risk_level = previous.get("risk_level")
        old_order = RISK_ORDER.get(old_risk_level, 0)
        new_order = RISK_ORDER.get(new_risk_level, 0)

        if new_order <= old_order:
            logger.info(
                "No escalation for patient_id=%d (%s → %s)",
                patient_id, old_risk_level, new_risk_level
            )
            return False

    # First prediction always saves if HIGH
    if not previous and new_risk_level != "HIGH":
        return False

    database.save_alert(
        patient_id=patient_id,
        patient_name=patient_name,
        bed_number=bed_number,
        old_risk_level=old_risk_level,
        new_risk_level=new_risk_level,
        probability=probability,
    )
    logger.info(
        "Alert triggered: patient=%s %s → %s prob=%.3f",
        patient_name, old_risk_level, new_risk_level, probability
    )
    return True