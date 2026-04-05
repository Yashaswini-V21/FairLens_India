from __future__ import annotations

from typing import Any, Dict, Iterable

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from sklearn.base import clone

try:
    from fairlearn.reductions import DemographicParity, EqualizedOdds, ExponentiatedGradient
except ImportError:  # pragma: no cover - optional dependency during bootstrap
    DemographicParity = None
    EqualizedOdds = None
    ExponentiatedGradient = None

from .fairness_scorer import compute_fairness_metrics


def _to_series(values: Any, index: pd.Index | None = None) -> pd.Series:
    if isinstance(values, pd.Series):
        return values
    return pd.Series(values, index=index)


def _base_estimator(model: Any) -> Any:
    try:
        return clone(model)
    except Exception:
        return model


def _constraint_from_name(constraint: str) -> Any:
    if constraint.lower() == "equalizedodds" and EqualizedOdds is not None:
        return EqualizedOdds()
    return DemographicParity() if DemographicParity is not None else None


def correct_model(
    model: Any,
    X: pd.DataFrame,
    y: Iterable[Any],
    sensitive_feature: Any,
    constraint: str = "DemographicParity",
) -> Dict[str, Any]:
    frame = X.copy()
    y_series = _to_series(y, index=frame.index)
    sensitive = frame[sensitive_feature] if isinstance(sensitive_feature, str) and sensitive_feature in frame.columns else _to_series(sensitive_feature, index=frame.index)
    features = frame.drop(columns=[sensitive_feature], errors="ignore")

    before_metrics = compute_fairness_metrics(model, features, y_series, sensitive)
    before_accuracy = _accuracy_or_none(model, features, y_series)

    constraint_obj = _constraint_from_name(constraint)
    if ExponentiatedGradient is None or constraint_obj is None:
        corrected_model = _fallback_corrected_model(model, features, y_series)
    else:
        corrected_model = ExponentiatedGradient(_base_estimator(model), constraints=constraint_obj)
        corrected_model.fit(features, y_series, sensitive_features=sensitive)

    after_predictions = _predict(corrected_model, features)
    after_metrics = compute_fairness_metrics(_PredictionWrapper(after_predictions), features, y_series, sensitive)
    after_accuracy = float((np.asarray(after_predictions) == np.asarray(y_series)).mean())

    before_dp = abs(float(before_metrics.get("demographic_parity_difference", 0.0)))
    after_dp = abs(float(after_metrics.get("demographic_parity_difference", 0.0)))
    fairness_improvement_pct = ((before_dp - after_dp) / before_dp * 100.0) if before_dp else 0.0

    return {
        "corrected_model": corrected_model,
        "before_metrics": before_metrics,
        "after_metrics": after_metrics,
        "accuracy_before": before_accuracy,
        "accuracy_after": after_accuracy,
        "fairness_improvement_pct": fairness_improvement_pct,
    }


def _predict(model: Any, X: pd.DataFrame) -> np.ndarray:
    if hasattr(model, "predict"):
        return np.asarray(model.predict(X))
    raise AttributeError("Corrected model must provide predict().")


def _accuracy_or_none(model: Any, X: pd.DataFrame, y: pd.Series) -> float:
    try:
        predictions = _predict(model, X)
        return float((np.asarray(predictions) == np.asarray(y)).mean())
    except Exception:
        return 0.0


def _fallback_corrected_model(model: Any, X: pd.DataFrame, y: pd.Series) -> Any:
    try:
        fitted = _base_estimator(model)
        fitted.fit(X, y)
        return fitted
    except Exception:
        return model


class _PredictionWrapper:
    def __init__(self, predictions: Iterable[Any]):
        self._predictions = np.asarray(list(predictions))

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if len(self._predictions) == len(X):
            return self._predictions
        return np.resize(self._predictions, len(X))


def plot_before_after(result: Dict[str, Any]) -> Dict[str, Any]:
    before = result.get("before_metrics", {})
    after = result.get("after_metrics", {})
    metrics = [
        "demographic_parity_difference",
        "equalized_odds_difference",
        "equal_opportunity_difference",
    ]
    labels = [
        "Demographic parity",
        "Equalized odds",
        "Equal opportunity",
    ]
    before_values = [abs(float(before.get(metric, 0.0))) for metric in metrics]
    after_values = [abs(float(after.get(metric, 0.0))) for metric in metrics]
    improvement = []
    for before_value, after_value in zip(before_values, after_values):
        if before_value == 0:
            improvement.append(0.0)
        else:
            improvement.append(max(0.0, (before_value - after_value) / before_value * 100.0))

    figure = go.Figure()
    figure.add_bar(name="Before", x=labels, y=before_values, marker_color="#ef4444")
    figure.add_bar(name="After", x=labels, y=after_values, marker_color="#22c55e")
    for label, before_value, after_value, pct in zip(labels, before_values, after_values, improvement):
        figure.add_annotation(
            x=label,
            y=max(before_value, after_value),
            text=f"-{pct:.1f}%",
            showarrow=False,
            yshift=10,
        )
    figure.update_layout(
        title="Bias Before vs After Correction",
        barmode="group",
        template="plotly_white",
        yaxis_title="Absolute metric gap",
        height=420,
        margin=dict(l=50, r=30, t=60, b=80),
    )
    return figure.to_dict()
