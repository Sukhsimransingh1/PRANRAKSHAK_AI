
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import database
import json

# Extract all patients and alerts
patients = database.get_all_patients()

# Get full detail for each patient (including vitals, shap, etc.)
detailed_patients = []
for p in patients:
    patient = database.get_patient_by_id(p['id'])
    latest_pred = database.get_latest_prediction(p['id'])
    vitals = database.get_vitals_for_patient(p['id'])
    
    detailed = {
        "id": patient["id"],
        "name": patient["name"],
        "bed_number": patient["bed_number"],
        "age": patient["age"],
        "gender": patient["gender"],
        "created_at": patient["created_at"],
        "latest_probability": latest_pred["sepsis_probability"] if latest_pred else None,
        "latest_risk_level": latest_pred["risk_level"] if latest_pred else None,
        "latest_predicted_at": latest_pred["predicted_at"] if latest_pred else None,
        "shap_factors": latest_pred["shap_factors"] if latest_pred else [],
        "vitals": vitals,
        "latest_probability": latest_pred["sepsis_probability"] if latest_pred else None,
        "latest_risk_level": latest_pred["risk_level"] if latest_pred else None,
        "latest_predicted_at": latest_pred["predicted_at"] if latest_pred else None,
        "shap_factors": latest_pred["shap_factors"] if latest_pred else [],
        "vitals": vitals,
    }
    detailed_patients.append(detailed)

alerts = database.get_all_alerts()

# Save to frontend data directory
frontend_data_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend",
    "src",
    "data"
)
os.makedirs(frontend_data_dir, exist_ok=True)

with open(os.path.join(frontend_data_dir, "demoPatients.json"), "w", encoding="utf-8") as f:
    json.dump(detailed_patients, f, ensure_ascii=False, indent=2, default=str)

with open(os.path.join(frontend_data_dir, "demoAlerts.json"), "w", encoding="utf-8") as f:
    json.dump(alerts, f, ensure_ascii=False, indent=2, default=str)

print(f"Extracted {len(detailed_patients)} patients and {len(alerts)} alerts!")
print(f"Data saved to: {frontend_data_dir}")

