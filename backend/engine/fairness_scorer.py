from __future__ import annotations

from typing import Any, Dict, Iterable

import numpy as np
import pandas as pd
import plotly.graph_objects as go

try:
    from fairlearn.metrics import (
        MetricFrame,
        demographic_parity_difference,
        equal_opportunity_difference,
        equalized_odds_difference,
        selection_rate,
    )
except ImportError:  # pragma: no cover - optional dependency during bootstrap
    MetricFrame = None
    demographic_parity_difference = None
    equal_opportunity_difference = None
    equalized_odds_difference = None
    selection_rate = None


def _ensure_series(values: Any, index: pd.Index | None = None) -> pd.Series:
    if isinstance(values, pd.Series):
        return values
    return pd.Series(values, index=index)


def _predictions(model: Any, X: pd.DataFrame) -> np.ndarray:
    if hasattr(model, "predict"):
        return np.asarray(model.predict(X))
    raise AttributeError("Model must provide predict().")


def rate_metric(value: float) -> tuple[str, str]:
    value = abs(float(value))
    if value < 0.05:
        return "FAIR", "#22c55e"
    if value <= 0.10:
        return "BORDERLINE", "#f59e0b"
    return "BIASED", "#ef4444"


def compute_fairness_metrics(model: Any, X: pd.DataFrame, y_true: Iterable[Any], sensitive_col: Any) -> Dict[str, Any]:
    frame = X.copy()
    y_true_series = _ensure_series(y_true, index=frame.index)
    sensitive = frame[sensitive_col] if isinstance(sensitive_col, str) and sensitive_col in frame.columns else _ensure_series(sensitive_col, index=frame.index)
    predictions = _predictions(model, frame)

    if MetricFrame is not None and selection_rate is not None:
        metric_frame = MetricFrame(
            metrics={"selection_rate": selection_rate},
            y_true=y_true_series,
            y_pred=predictions,
            sensitive_features=sensitive,
        )
        group_rates = metric_frame.by_group["selection_rate"].dropna()
    else:
        group_rates = _manual_selection_rates(predictions, sensitive)

    metrics = {
        "demographic_parity_difference": _metric_or_fallback(
            demographic_parity_difference,
            y_true_series,
            predictions,
            sensitive,
        ),
        "equalized_odds_difference": _metric_or_fallback(
            equalized_odds_difference,
            y_true_series,
            predictions,
            sensitive,
        ),
        "equal_opportunity_difference": _metric_or_fallback(
            equal_opportunity_difference,
            y_true_series,
            predictions,
            sensitive,
        ),
        "selection_rate_by_group": {str(index): float(value) for index, value in group_rates.items()},
    }

    if len(group_rates) > 0:
        best_group = str(group_rates.idxmax())
        worst_group = str(group_rates.idxmin())
        max_rate = float(group_rates.max())
        min_rate = float(group_rates.min())
        disparity_ratio = float(max_rate / min_rate) if min_rate else float("inf")
    else:
        best_group = None
        worst_group = None
        disparity_ratio = 1.0

    metrics.update(
        {
            "best_group": best_group,
            "worst_group": worst_group,
            "disparity_ratio": disparity_ratio,
        }
    )
    return metrics


def _metric_or_fallback(metric_fn: Any, y_true: pd.Series, y_pred: np.ndarray, sensitive: pd.Series) -> float:
    if metric_fn is not None:
        try:
            return float(metric_fn(y_true, y_pred, sensitive_features=sensitive))
        except Exception:
            pass
    return float(_manual_parity_gap(y_pred, sensitive))


def _manual_parity_gap(y_pred: np.ndarray, sensitive: pd.Series) -> float:
    series = _ensure_series(sensitive)
    rates = _manual_selection_rates(y_pred, series)
    if rates.empty:
        return 0.0
    return float(rates.max() - rates.min())


def _manual_selection_rates(y_pred: np.ndarray, sensitive: pd.Series) -> pd.Series:
    frame = pd.DataFrame({"prediction": np.asarray(y_pred), "sensitive": sensitive})
    grouped = frame.groupby("sensitive")["prediction"].mean()
    return grouped.astype(float)


def plot_group_rates(metric_results: Dict[str, Any]) -> Dict[str, Any]:
    rates = metric_results.get("selection_rate_by_group", {})
    groups = list(rates.keys())
    values = [float(item) for item in rates.values()]

    figure = go.Figure(
        go.Bar(
            x=groups,
            y=values,
            marker_color="#0ea5e9",
            text=[f"{value:.3f}" for value in values],
            textposition="outside",
        )
    )
    figure.update_layout(
        title="Selection Rate by Group",
        xaxis_title="Demographic Group",
        yaxis_title="Selection Rate",
        template="plotly_white",
        height=420,
        margin=dict(l=50, r=30, t=60, b=80),
    )
    return figure.to_dict()


if __name__ == "__main__":
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier

    iris = load_iris(as_frame=True)
    data = iris.frame.copy()
    data["sensitive"] = np.where(data.index % 2 == 0, "A", "B")
    X = data.drop(columns=["target"])
    y = data["target"]
    model = RandomForestClassifier(random_state=42).fit(X.drop(columns=["sensitive"]), y)
    X_model = X.drop(columns=["sensitive"])
    results = compute_fairness_metrics(model, X_model, y, data["sensitive"])
    print(results)
