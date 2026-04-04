import base64
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from typing import Optional

import rag_copilot
from models import CopilotResponse
from logging_config import get_logger
import database

router = APIRouter(prefix="/copilot", tags=["Copilot"])
logger = get_logger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_MB = 10


@router.post("", response_model=CopilotResponse)
async def ask_copilot(
    patient_id: int = Form(...),
    question: str = Form(..., min_length=1, max_length=1000),
    image: Optional[UploadFile] = File(default=None),
):
    """
    Ask the RAG copilot a clinical question about a specific patient.

    Supports:
    - Text-only queries (standard clinical questions)
    - Image + text queries (lab report OCR via vision model)

    The image is passed directly to the vision LLM for reading.
    OCR output is NEVER fed into the prediction pipeline.
    """
    # Validate patient exists
    patient = database.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    image_base64: Optional[str] = None
    image_media_type: str = "image/jpeg"

    if image is not None:
        # Validate image type
        content_type = image.content_type or ""
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Unsupported image type: {content_type}. "
                    f"Allowed: {ALLOWED_IMAGE_TYPES}"
                ),
            )

        # Validate image size
        image_bytes = await image.read()
        size_mb = len(image_bytes) / (1024 * 1024)
        if size_mb > MAX_IMAGE_SIZE_MB:
            raise HTTPException(
                status_code=422,
                detail=f"Image too large: {size_mb:.1f}MB. Maximum: {MAX_IMAGE_SIZE_MB}MB.",
            )

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        image_media_type = content_type

        logger.info(
            "Image received for patient_id=%d size=%.2fMB type=%s",
            patient_id, size_mb, content_type,
        )

    answer = await rag_copilot.answer(
        patient_id=patient_id,
        question=question,
        image_base64=image_base64,
        image_media_type=image_media_type,
    )

    return {
        "patient_id": patient_id,
        "question": question,
        "answer": answer,
    }