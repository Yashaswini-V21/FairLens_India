from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from backend.agents.audit_agent import audit_app, AuditState
from backend.engine import bias_detector, fairness_scorer, gemini_explainer, model_corrector
from backend.utils.firebase_handler import get_count, init_firebase, verify_id_token
from backend.utils.report_generator import generate_pdf


def _get_cors_origins() -> tuple[list[str], bool]:
    raw = os.environ.get("CORS_ORIGINS", "*").strip()
    if not raw or raw == "*":
        # Keep demo-friendly wildcard for local/hackathon runs.
        return ["*"], False

    origins = [item.strip() for item in raw.split(",") if item.strip()]
    return origins or ["*"], bool(origins)


cors_origins, cors_allow_credentials = _get_cors_origins()


app = FastAPI(title="FairLens India API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _is_truthy(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def require_api_key(
    x_api_key: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
) -> None:
    expected_api_key = os.environ.get("FAIRLENS_API_KEY", "").strip()
    firebase_required = _is_truthy(os.environ.get("FIREBASE_AUTH_REQUIRED", "false"))

    bearer_token = ""
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization[7:].strip()
    decoded = verify_id_token(bearer_token)
    if decoded is not None:
        return

    if not expected_api_key:
        if firebase_required:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return
    if x_api_key != expected_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "fairlens-india"}


@app.get("/counter")
def counter() -> dict:
    db = init_firebase()
    return {"audits_today": get_count(db), "source": "firestore" if db is not None else "local"}


@app.post("/audit")
async def audit(
    _: None = Depends(require_api_key),
    model_file: UploadFile = File(...),
    dataset_file: UploadFile = File(...),
    sensitive_cols: str = Form(""),
    fairness_threshold: float = Form(0.10),
) -> dict:
    model_path, dataset_path = await _persist_uploads(model_file, dataset_file)
    dataset = pd.read_csv(dataset_path)
    model = bias_detector.load_model(model_path)
    features, target = _split_features_target(dataset)

    selected_sensitive = [item.strip() for item in sensitive_cols.split(",") if item.strip()]
    if not selected_sensitive:
        selected_sensitive = bias_detector.auto_detect_sensitive_cols(features)

    shap_results = bias_detector.compute_shap_values(model, features)
    bias_flags = bias_detector.detect_sensitive_bias(shap_results, selected_sensitive, fairness_threshold)
    fairness_metrics = {}
    if selected_sensitive:
        fairness_metrics = fairness_scorer.compute_fairness_metrics(
            model,
            features,
            target,
            selected_sensitive[0],
        )
    else:
        fairness_metrics = {
            "demographic_parity_difference": 0.0,
            "equalized_odds_difference": 0.0,
            "equal_opportunity_difference": 0.0,
            "selection_rate_by_group": {},
            "best_group": None,
            "worst_group": None,
            "disparity_ratio": 1.0,
        }

    explanation = gemini_explainer.fallback_explanation(fairness_metrics)
    correction = model_corrector.correct_model(
        model,
        dataset,
        target,
        sensitive_feature=selected_sensitive[0] if selected_sensitive else dataset.columns[0],
    )
    correction.pop("corrected_model", None)
    state: AuditState = {
        "model_path": model_path,
        "dataset_path": dataset_path,
        "sensitive_cols": selected_sensitive,
        "fairness_threshold": fairness_threshold,
        "shap_results": shap_results,
        "fairness_metrics": fairness_metrics,
        "gemini_explanation": explanation,
        "correction_results": correction,
        "firebase_logged": False,
        "status": "done",
        "rows_audited": int(len(dataset)),
        "columns_checked": int(len(dataset.columns)),
    }
    report_path = generate_pdf(state)
    state["report_path"] = report_path
    return {
        "status": "done",
        "sensitive_cols": selected_sensitive,
        "bias_flags": bias_flags,
        "shap_results": shap_results,
        "fairness_metrics": fairness_metrics,
        "gemini_explanation": explanation,
        "correction_results": correction,
        "report_path": report_path,
    }


@app.post("/correct")
async def correct(
    _: None = Depends(require_api_key),
    model_file: UploadFile = File(...),
    dataset_file: UploadFile = File(...),
    sensitive_feature: str = Form(...),
) -> dict:
    model_path, dataset_path = await _persist_uploads(model_file, dataset_file)
    dataset = pd.read_csv(dataset_path)
    model = bias_detector.load_model(model_path)
    target = _split_features_target(dataset)[1]
    results = model_corrector.correct_model(model, dataset, target, sensitive_feature=sensitive_feature)
    results.pop("corrected_model", None)
    return results


@app.get("/report")
def report() -> dict:
    return {"detail": "Use POST /audit to generate a new report, or fetch the generated report_path from the audit response."}


@app.post("/report")
def generate_report_endpoint(payload: dict, _: None = Depends(require_api_key)) -> dict:
    report_path = generate_pdf(payload)
    return {"report_path": report_path}


def _split_features_target(dataset: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    target_column = None
    for candidate in ["target", "label", "y", "outcome", "approved", "decision"]:
        if candidate in dataset.columns:
            target_column = candidate
            break
    if target_column is None:
        target_column = dataset.columns[-1]
    target = dataset[target_column]
    features = dataset.drop(columns=[target_column])
    return features, target


async def _persist_uploads(model_file: UploadFile, dataset_file: UploadFile) -> tuple[str, str]:
    upload_dir = Path(tempfile.mkdtemp(prefix="fairlens_"))
    model_path = upload_dir / model_file.filename
    dataset_path = upload_dir / dataset_file.filename
    with model_path.open("wb") as model_handle:
        shutil.copyfileobj(model_file.file, model_handle)
    with dataset_path.open("wb") as dataset_handle:
        shutil.copyfileobj(dataset_file.file, dataset_handle)
    return str(model_path), str(dataset_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
