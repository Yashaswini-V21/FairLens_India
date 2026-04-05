from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Iterable, List

import joblib
import numpy as np
import pandas as pd
import plotly.graph_objects as go

try:
    import shap
except ImportError:  # pragma: no cover - optional dependency during bootstrap
    shap = None


SENSITIVE_NAME_HINTS = {
    "gender",
    "sex",
    "age",
    "location",
    "district",
    "state",
    "caste",
    "religion",
    "language",
    "region",
    "zone",
    "tier",
    "urban",
    "rural",
}


def load_model(path: str | Path) -> Any:
    return joblib.load(path)


def _ensure_dataframe(X: pd.DataFrame | np.ndarray | Iterable[Any]) -> pd.DataFrame:
    if isinstance(X, pd.DataFrame):
        return X.copy()
    if isinstance(X, pd.Series):
        return X.to_frame()
    if isinstance(X, np.ndarray):
        if X.ndim == 1:
            return pd.DataFrame(X, columns=["feature_0"])
        return pd.DataFrame(X, columns=[f"feature_{index}" for index in range(X.shape[1])])
    return pd.DataFrame(X)


def _predict_like(model: Any, X: pd.DataFrame) -> np.ndarray:
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        if isinstance(proba, list):
            proba = np.asarray(proba)
        if getattr(proba, "ndim", 1) == 2:
            if proba.shape[1] == 1:
                return proba[:, 0]
            return proba[:, -1]
    predictions = model.predict(X)
    return np.asarray(predictions)


def compute_shap_values(model: Any, X: pd.DataFrame) -> Dict[str, Any]:
    frame = _ensure_dataframe(X)
    feature_names = list(frame.columns)

    if shap is None:
        fallback = np.abs(frame.select_dtypes(include=[np.number]).fillna(0).to_numpy())
        if fallback.size == 0:
            fallback = np.zeros((len(frame), len(feature_names)))
        if fallback.shape[1] != len(feature_names):
            fallback = np.zeros((len(frame), len(feature_names)))
        mean_abs_shap = fallback.mean(axis=0).tolist()
        return {
            "values": fallback.tolist(),
            "feature_names": feature_names,
            "mean_abs_shap": mean_abs_shap,
            "top_5_features": _top_features(feature_names, mean_abs_shap),
            "explainer": "fallback",
        }

    values = None
    explainer_name = "tree"
    try:
        explainer = shap.TreeExplainer(model)
        raw_values = explainer.shap_values(frame)
        values = _normalize_shap_values(raw_values)
    except Exception:
        explainer_name = "kernel"
        background = shap.sample(frame, min(len(frame), 50), random_state=42)
        explainer = shap.KernelExplainer(lambda data: _predict_like(model, pd.DataFrame(data, columns=feature_names)), background)
        raw_values = explainer.shap_values(frame, nsamples=100)
        values = _normalize_shap_values(raw_values)

    mean_abs_shap = np.abs(values).mean(axis=0).tolist() if values.size else [0.0] * len(feature_names)
    return {
        "values": values.tolist(),
        "feature_names": feature_names,
        "mean_abs_shap": mean_abs_shap,
        "top_5_features": _top_features(feature_names, mean_abs_shap),
        "explainer": explainer_name,
    }


def _normalize_shap_values(raw_values: Any) -> np.ndarray:
    if isinstance(raw_values, list):
        if not raw_values:
            return np.zeros((0, 0))
        if len(raw_values) == 1:
            return np.asarray(raw_values[0])
        stacked = np.stack([np.asarray(item) for item in raw_values], axis=0)
        return np.mean(stacked, axis=0)
    return np.asarray(raw_values)


def _top_features(feature_names: List[str], mean_abs_shap: List[float]) -> List[Dict[str, Any]]:
    ranking = sorted(
        zip(feature_names, mean_abs_shap),
        key=lambda item: item[1],
        reverse=True,
    )[:5]
    return [{"feature": name, "mean_abs_shap": float(score)} for name, score in ranking]


def auto_detect_sensitive_cols(df: pd.DataFrame) -> List[str]:
    detected: List[str] = []
    for column in df.columns:
        lower_name = column.lower()
        if any(hint in lower_name for hint in SENSITIVE_NAME_HINTS):
            detected.append(column)
            continue
        unique_values = df[column].dropna().unique()
        if len(unique_values) == 2:
            detected.append(column)
    return list(dict.fromkeys(detected))


def detect_sensitive_bias(shap_results: Dict[str, Any], sensitive_cols: List[str], threshold: float = 0.15) -> Dict[str, Any]:
    feature_names = shap_results.get("feature_names", [])
    mean_abs_shap = shap_results.get("mean_abs_shap", [])
    totals = {feature: float(score) for feature, score in zip(feature_names, mean_abs_shap)}
    total_contribution = sum(totals.values()) or 1.0

    contributions: Dict[str, float] = {}
    flags: List[str] = []
    severity: Dict[str, str] = {}
    for column in sensitive_cols:
        contribution = float(totals.get(column, 0.0)) / total_contribution
        contributions[column] = contribution
        if contribution > threshold:
            flags.append(column)
            severity[column] = "high" if contribution > threshold * 1.5 else "moderate"
        else:
            severity[column] = "low"

    return {
        "flags": flags,
        "severity": severity,
        "contributions": contributions,
        "threshold": threshold,
        "total_contribution": total_contribution,
    }


def plot_shap_waterfall(shap_results: Dict[str, Any], bias_flags: Dict[str, Any]) -> Dict[str, Any]:
    feature_names = shap_results.get("feature_names", [])
    mean_abs_shap = shap_results.get("mean_abs_shap", [])
    flagged = set(bias_flags.get("flags", []))

    ordered = sorted(zip(feature_names, mean_abs_shap), key=lambda item: item[1], reverse=True)
    labels = [name for name, _ in ordered]
    scores = [float(score) for _, score in ordered]
    colors = ["#ef4444" if name in flagged else "#3b82f6" for name in labels]

    figure = go.Figure(
        go.Bar(
            x=scores,
            y=labels,
            orientation="h",
            marker_color=colors,
            text=[f"{score:.4f}" for score in scores],
            textposition="outside",
        )
    )
    figure.update_layout(
        title="SHAP Feature Contribution",
        xaxis_title="Mean Absolute SHAP",
        yaxis_title="Feature",
        template="plotly_white",
        height=max(420, 30 * len(labels) + 160),
        margin=dict(l=120, r=30, t=60, b=50),
    )
    return figure.to_dict()


if __name__ == "__main__":
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier

    iris = load_iris(as_frame=True)
    X = iris.frame.drop(columns=["target"])
    y = iris.frame["target"]
    model = RandomForestClassifier(random_state=42).fit(X, y)
    shap_output = compute_shap_values(model, X)
    sensitive = auto_detect_sensitive_cols(X)
    flags = detect_sensitive_bias(shap_output, sensitive)
    print({"top_5_features": shap_output["top_5_features"], "flags": flags})
