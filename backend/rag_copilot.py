import base64
import json
from typing import Optional

import httpx

import database
from config import get_settings
from logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

_guidelines_cache: Optional[str] = None


def _load_guidelines() -> str:
    global _guidelines_cache
    if _guidelines_cache is not None:
        return _guidelines_cache
    try:
        with open(settings.guidelines_path, "r", encoding="utf-8") as f:
            _guidelines_cache = f.read()
        logger.info("Clinical guidelines loaded from %s", settings.guidelines_path)
    except FileNotFoundError:
        logger.warning(
            "guidelines.txt not found at %s — copilot will work without guidelines.",
            settings.guidelines_path
        )
        _guidelines_cache = "No additional clinical guidelines available."
    return _guidelines_cache


def _build_patient_context(patient_id: int) -> str:
    """
    Retrieve patient data from database and format as
    a structured text block for the LLM system prompt.

    This version includes:
    - Safe numeric formatting
    - Defensive handling of missing data
    - Reliable SHAP formatting
    - Production-safe behavior for demos
    """

    logger.info("Building patient context for patient_id=%d", patient_id)

    patient = database.get_patient_by_id(patient_id)

    if not patient:
        logger.warning("Patient not found for id=%d", patient_id)
        return "Patient data not found."

    pred = database.get_latest_prediction(patient_id)
    vitals = database.get_vitals_for_patient(patient_id)

    # --------------------------------------------------
    # Latest vitals row
    # --------------------------------------------------

    latest = vitals[-1] if vitals else {}

    # --------------------------------------------------
    # Safe formatting for prediction values
    # --------------------------------------------------

    if pred:

        probability = pred.get("sepsis_probability")

        if probability is not None:
            prob_str = f"{probability:.3f}"
        else:
            prob_str = "N/A"

        risk_level_str = pred.get(
            "risk_level",
            "Not yet assessed",
        )

        predicted_at_str = pred.get(
            "predicted_at",
            "N/A",
        )

    else:

        prob_str = "N/A"
        risk_level_str = "Not yet assessed"
        predicted_at_str = "N/A"

    # --------------------------------------------------
    # Format SHAP factors
    # --------------------------------------------------

    shap_text = "No explanation available."

    if pred and pred.get("shap_factors"):

        factors = pred["shap_factors"]

        lines = []

        for f in factors[:5]:

            feature_name = f.get(
                "display_name",
                f.get("feature", "Unknown feature"),
            )

            impact = f.get("impact")

            if impact is not None:
                impact_str = f"{impact:.3f}"
            else:
                impact_str = "N/A"

            direction = (
                "↑ increases risk"
                if f.get("direction") == "increases_risk"
                else "↓ decreases risk"
            )

            lines.append(
                f"  - {feature_name}: "
                f"impact={impact_str} ({direction})"
            )

        shap_text = "\n".join(lines)

    # --------------------------------------------------
    # Build context string
    # --------------------------------------------------

    context = f"""
PATIENT INFORMATION:
  Name: {patient.get('name', 'Unknown')}
  Age: {patient.get('age', 'Unknown')} years
  Gender: {patient.get('gender', 'Unknown')}
  Bed Number: {patient.get('bed_number', 'Unknown')}
  Admitted: {patient.get('created_at', 'Unknown')}

CURRENT RISK ASSESSMENT:
  Sepsis Probability: {prob_str}
  Risk Level: {risk_level_str}
  Last Assessed: {predicted_at_str}

TOP CONTRIBUTING FACTORS (SHAP Analysis):
{shap_text}

LATEST VITAL SIGNS:
  Heart Rate: {latest.get('hr', 'N/A')} bpm
  Systolic BP: {latest.get('sbp', 'N/A')} mmHg
  Mean Arterial Pressure: {latest.get('map_val', 'N/A')} mmHg
  Temperature: {latest.get('temp', 'N/A')} °C
  Respiratory Rate: {latest.get('resp', 'N/A')} breaths/min
  Oxygen Saturation: {latest.get('o2sat', 'N/A')} %
  WBC Count: {latest.get('wbc', 'N/A')} x10^9/L
  Creatinine: {latest.get('creatinine', 'N/A')} mg/dL
  Glucose: {latest.get('glucose', 'N/A')} mg/dL
  ICU Length of Stay: {latest.get('iculos', 'N/A')} hours
""".strip()

    logger.info(
        "Patient context built successfully for patient_id=%d",
        patient_id,
    )

    return context

def _build_system_prompt() -> str:
    guidelines = _load_guidelines()
    return f"""You are PranRakshak's clinical decision support AI assistant.

You assist ICU doctors by answering questions about specific patients using their real-time data and established clinical guidelines.

RULES:
1. Answer ONLY based on the patient data and guidelines provided to you.
2. Be concise, clinically accurate, and direct.
3. Never speculate beyond the data provided.
4. If you see an uploaded lab report image, extract and interpret all visible values.
5. Always end every response with this exact line:
   "⚠️ Final clinical decisions rest with the treating physician."

CLINICAL GUIDELINES:
{guidelines}"""


async def answer(
    patient_id: int,
    question: str,
    image_base64: Optional[str] = None,
    image_media_type: str = "image/jpeg",
) -> str:
    """
    Generate a clinical answer using Groq's LLM.

    For text-only queries: sends patient context + question as text.
    For image queries (OCR): includes the base64 image in the message.
    The vision model reads the image directly — no separate OCR step.

    IMPORTANT: Image output is NEVER fed into the ML prediction pipeline.
    This function is purely for the doctor's information via chat.
    """
    patient_context = _build_patient_context(patient_id)
    system_prompt = _build_system_prompt()

    # Build user message content
    if image_base64:
        # Vision message — model reads the image (lab report photo)
        user_content = [
            {
                "type": "text",
                "text": (
                    f"PATIENT CONTEXT:\n{patient_context}\n\n"
                    f"The doctor has uploaded a lab report image.\n"
                    f"Please read all visible values from the image, then answer:\n\n"
                    f"DOCTOR'S QUESTION: {question}"
                ),
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image_media_type};base64,{image_base64}"
                },
            },
        ]
    else:
        # Text-only message
        user_content = (
            f"PATIENT CONTEXT:\n{patient_context}\n\n"
            f"DOCTOR'S QUESTION: {question}"
        )

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": 512,
        "temperature": 0.2,
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            answer_text = data["choices"][0]["message"]["content"].strip()
            logger.info(
                "Copilot answered patient_id=%d image=%s tokens=%s",
                patient_id,
                bool(image_base64),
                data.get("usage", {}).get("total_tokens", "?"),
            )
            return answer_text

    except httpx.HTTPStatusError as exc:
        logger.error(
            "Groq API HTTP error %d: %s",
            exc.response.status_code,
            exc.response.text,
        )
        return (
            "The AI assistant is temporarily unavailable. "
            "Please try again in a moment. "
            "⚠️ Final clinical decisions rest with the treating physician."
        )
    except Exception as exc:
        logger.error("Groq API unexpected error: %s", exc)
        return (
            "An error occurred while generating the response. "
            "⚠️ Final clinical decisions rest with the treating physician."
        )