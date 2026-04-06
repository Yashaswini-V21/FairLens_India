from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
import requests
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


def generate_sample_assets(output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    dataset_path = output_dir / "sample_dataset.csv"
    model_path = output_dir / "sample_model.pkl"

    # Synthetic but realistic loan data for a fast demo audit.
    rows = [
        {"income": 62000, "age": 31, "loan_amount": 250000, "credit_score": 742, "gender": "M", "location": "Urban", "approved": 1},
        {"income": 54000, "age": 29, "loan_amount": 220000, "credit_score": 701, "gender": "F", "location": "Rural", "approved": 0},
        {"income": 72000, "age": 40, "loan_amount": 320000, "credit_score": 780, "gender": "M", "location": "Urban", "approved": 1},
        {"income": 47000, "age": 27, "loan_amount": 180000, "credit_score": 676, "gender": "F", "location": "Tier3", "approved": 0},
        {"income": 69000, "age": 36, "loan_amount": 290000, "credit_score": 755, "gender": "M", "location": "Tier2", "approved": 1},
        {"income": 50000, "age": 33, "loan_amount": 210000, "credit_score": 692, "gender": "F", "location": "Rural", "approved": 0},
        {"income": 81000, "age": 45, "loan_amount": 360000, "credit_score": 801, "gender": "M", "location": "Urban", "approved": 1},
        {"income": 45000, "age": 26, "loan_amount": 170000, "credit_score": 661, "gender": "F", "location": "Tier3", "approved": 0},
        {"income": 76000, "age": 39, "loan_amount": 340000, "credit_score": 788, "gender": "M", "location": "Tier2", "approved": 1},
        {"income": 52000, "age": 30, "loan_amount": 200000, "credit_score": 700, "gender": "F", "location": "Rural", "approved": 0},
        {"income": 83000, "age": 46, "loan_amount": 380000, "credit_score": 816, "gender": "M", "location": "Urban", "approved": 1},
        {"income": 48000, "age": 28, "loan_amount": 190000, "credit_score": 684, "gender": "F", "location": "Tier3", "approved": 0},
    ]

    frame = pd.DataFrame(rows)
    frame.to_csv(dataset_path, index=False)

    X = frame.drop(columns=["approved"])
    y = frame["approved"]
    categorical = ["gender", "location"]
    numeric = ["income", "age", "loan_amount", "credit_score"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("numeric", "passthrough", numeric),
        ]
    )
    model = Pipeline(
        steps=[
            ("prep", preprocessor),
            ("rf", RandomForestClassifier(n_estimators=80, random_state=42)),
        ]
    )
    model.fit(X, y)
    joblib.dump(model, model_path)

    return model_path, dataset_path


def _check_response_keys(payload: dict, expected: list[str], endpoint: str) -> None:
    missing = [key for key in expected if key not in payload]
    if missing:
        raise RuntimeError(f"{endpoint} missing keys: {', '.join(missing)}")


def run_smoke_test(base_url: str, model_path: Path, dataset_path: Path) -> None:
    timeout = 180

    health = requests.get(f"{base_url}/health", timeout=timeout)
    health.raise_for_status()
    health_payload = health.json()
    _check_response_keys(health_payload, ["status", "service"], "/health")

    with model_path.open("rb") as model_file, dataset_path.open("rb") as dataset_file:
        audit = requests.post(
            f"{base_url}/audit",
            files={
                "model_file": (model_path.name, model_file, "application/octet-stream"),
                "dataset_file": (dataset_path.name, dataset_file, "text/csv"),
            },
            data={"sensitive_cols": "gender,location", "fairness_threshold": "0.10"},
            timeout=timeout,
        )
    audit.raise_for_status()
    audit_payload = audit.json()
    _check_response_keys(
        audit_payload,
        [
            "status",
            "sensitive_cols",
            "bias_flags",
            "shap_results",
            "fairness_metrics",
            "gemini_explanation",
            "correction_results",
            "report_path",
        ],
        "/audit",
    )

    with model_path.open("rb") as model_file, dataset_path.open("rb") as dataset_file:
        correct = requests.post(
            f"{base_url}/correct",
            files={
                "model_file": (model_path.name, model_file, "application/octet-stream"),
                "dataset_file": (dataset_path.name, dataset_file, "text/csv"),
            },
            data={"sensitive_feature": "gender"},
            timeout=timeout,
        )
    correct.raise_for_status()
    correct_payload = correct.json()
    _check_response_keys(
        correct_payload,
        ["before_metrics", "after_metrics", "accuracy_before", "accuracy_after", "fairness_improvement_pct"],
        "/correct",
    )

    summary = {
        "health": health_payload,
        "audit_status": audit_payload.get("status"),
        "audit_report_path": audit_payload.get("report_path"),
        "audit_sensitive_cols": audit_payload.get("sensitive_cols"),
        "correct_improvement_pct": correct_payload.get("fairness_improvement_pct"),
    }
    print(json.dumps(summary, indent=2))
    print("SMOKE TEST PASSED")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run FairLens API smoke test with auto-generated sample files.")
    parser.add_argument("--base-url", default="http://localhost:8080", help="FastAPI base URL")
    parser.add_argument(
        "--assets-dir",
        default="samples",
        help="Directory where sample_model.pkl and sample_dataset.csv are generated",
    )
    args = parser.parse_args()

    assets_dir = Path(args.assets_dir)
    model_path, dataset_path = generate_sample_assets(assets_dir)
    run_smoke_test(args.base_url.rstrip("/"), model_path, dataset_path)


if __name__ == "__main__":
    main()
