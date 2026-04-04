from fastapi import APIRouter
from models import AlertResponse
import database

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=list[AlertResponse])
def get_alerts():
    """
    Return all alert records ordered by most recent first.
    Only HIGH risk escalations produce alerts.
    Maximum 50 returned.
    """
    return database.get_all_alerts()