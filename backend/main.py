import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from database import init_db
from logging_config import setup_logging, get_logger
import predictor
import shap_explainer

from routes import patients, predictions, alerts, copilot

# ─── Logging must be configured before anything else ─────────────────────────
setup_logging()
logger = get_logger(__name__)
settings = get_settings()


# ─── Lifespan: startup + shutdown ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: initialise DB, load ML model and SHAP explainer.
    Shutdown: log clean exit.
    """
    logger.info("PranRakshak backend starting up...")

    init_db()

    try:
        predictor.load_model()
    except FileNotFoundError as exc:
        logger.warning(
            "Model file missing — predictions will fail until model is trained. %s", exc
        )

    try:
        shap_explainer.load_explainer(predictor._pipeline)
    except Exception as exc:
        logger.warning("SHAP explainer failed to load: %s", exc)

    logger.info(
        "Startup complete. ENV=%s FRONTEND=%s",
        settings.env,
        settings.frontend_origin,
    )

    yield

    logger.info("PranRakshak backend shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="PranRakshak API",
    description="Intelligent ICU patient risk monitoring and decision support system.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global exception handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method, request.url.path, exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error.",
            "detail": str(exc) if settings.env == "development" else None,
        },
    )


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "model_loaded": predictor._pipeline is not None,
        "shap_loaded": shap_explainer._explainer is not None,
        "env": settings.env,
    }


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(patients.router)
app.include_router(predictions.router)
app.include_router(alerts.router)
app.include_router(copilot.router)

