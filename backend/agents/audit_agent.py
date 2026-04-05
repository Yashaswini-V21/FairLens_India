from __future__ import annotations

from typing import Any, List, Optional, TypedDict

import pandas as pd

from ..engine import bias_detector, gemini_explainer, model_corrector
from ..utils import firebase_handler, report_generator

try:
    from langgraph.graph import END, StateGraph
except ImportError:  # pragma: no cover - optional dependency during bootstrap
    END = "END"

    class StateGraph:  # type: ignore[override]
        def __init__(self, state_type: Any):
            self._nodes = {}
            self._entry = None
            self._edges = []

        def add_node(self, name: str, fn: Any) -> None:
            self._nodes[name] = fn

        def set_entry_point(self, name: str) -> None:
            self._entry = name

        def add_edge(self, source: str, target: str) -> None:
            self._edges.append((source, target))

        def compile(self) -> Any:
            return _FallbackWorkflow(self._entry, self._nodes, self._edges)


class AuditState(TypedDict, total=False):
    model_path: str
    dataset_path: str
    sensitive_cols: List[str]
    fairness_threshold: float
    shap_results: Optional[dict]
    fairness_metrics: Optional[dict]
    gemini_explanation: Optional[str]
    correction_results: Optional[dict]
    report_path: Optional[str]
    firebase_logged: bool
    status: str
    error: Optional[str]
    hindi_explanation: Optional[str]
    rows_audited: int
    columns_checked: int


def detect_bias_node(state: AuditState) -> AuditState:
    model = bias_detector.load_model(state["model_path"])
    dataset = pd.read_csv(state["dataset_path"])
    frame = dataset.copy()
    target_column = _infer_target_column(frame)
    y_true = frame.pop(target_column) if target_column else pd.Series([0] * len(frame))
    sensitive_cols = state.get("sensitive_cols") or bias_detector.auto_detect_sensitive_cols(frame)
    shap_results = bias_detector.compute_shap_values(model, frame)
    bias_flags = bias_detector.detect_sensitive_bias(shap_results, sensitive_cols, threshold=state.get("fairness_threshold", 0.10))
    fairness_metrics = {
        "bias_flags": bias_flags,
        "demographic_parity_difference": max(bias_flags.get("contributions", {}).values(), default=0.0),
        "equalized_odds_difference": max(bias_flags.get("contributions", {}).values(), default=0.0),
        "equal_opportunity_difference": max(bias_flags.get("contributions", {}).values(), default=0.0),
    }
    state.update(
        {
            "shap_results": shap_results,
            "fairness_metrics": fairness_metrics,
            "sensitive_cols": sensitive_cols,
            "rows_audited": len(frame),
            "columns_checked": len(frame.columns),
            "status": "detecting",
        }
    )
    return state


def explain_bias_node(state: AuditState) -> AuditState:
    explanation = gemini_explainer.explain_bias(
        None,
        state.get("shap_results", {}),
        state.get("fairness_metrics", {}),
        context="credit risk",
    )
    state.update(
        {
            "gemini_explanation": explanation,
            "hindi_explanation": gemini_explainer.translate_to_hindi(None, explanation),
            "status": "explaining",
        }
    )
    return state


def correct_model_node(state: AuditState) -> AuditState:
    model = bias_detector.load_model(state["model_path"])
    dataset = pd.read_csv(state["dataset_path"])
    target_column = _infer_target_column(dataset)
    y_true = dataset[target_column] if target_column else pd.Series([0] * len(dataset))
    features = dataset.drop(columns=[target_column], errors="ignore")
    sensitive_cols = state.get("sensitive_cols") or bias_detector.auto_detect_sensitive_cols(features)
    sensitive_feature = sensitive_cols[0] if sensitive_cols else features.columns[0]
    correction = model_corrector.correct_model(
        model,
        features,
        y_true,
        sensitive_feature=sensitive_feature,
    )
    state.update({"correction_results": correction, "status": "correcting"})
    return state


def generate_report_node(state: AuditState) -> AuditState:
    report_path = report_generator.generate_pdf(state)
    state.update({"report_path": report_path, "status": "reporting"})
    return state


def log_firebase_node(state: AuditState) -> AuditState:
    db = firebase_handler.init_firebase()
    firebase_handler.log_audit(
        db,
        {
            "model_path": state.get("model_path"),
            "dataset_path": state.get("dataset_path"),
            "status": state.get("status"),
            "timestamp": pd.Timestamp.utcnow().isoformat(),
        },
    )
    firebase_handler.increment_counter(db)
    state.update({"firebase_logged": True, "status": "done"})
    return state


def _infer_target_column(df: pd.DataFrame) -> Optional[str]:
    for candidate in ["target", "label", "y", "outcome", "approved", "decision"]:
        if candidate in df.columns:
            return candidate
    return df.columns[-1] if len(df.columns) > 1 else None


def _with_error_handler(node_fn: Any):
    def wrapper(state: AuditState) -> AuditState:
        try:
            return node_fn(state)
        except Exception as exc:  # pragma: no cover - runtime safeguard
            state["error"] = str(exc)
            state["status"] = "error"
            return state

    return wrapper


class _FallbackWorkflow:
    def __init__(self, entry: str, nodes: dict[str, Any], edges: list[tuple[str, str]]):
        self.entry = entry
        self.nodes = nodes
        self.edges = edges

    def invoke(self, state: AuditState) -> AuditState:
        order = [self.entry]
        edge_map = {source: target for source, target in self.edges}
        current = self.entry
        while current and current != END:
            node = self.nodes[current]
            state = node(state)
            current = edge_map.get(current)
            if state.get("error"):
                break
        return state


workflow = StateGraph(AuditState)
workflow.add_node("detect", _with_error_handler(detect_bias_node))
workflow.add_node("explain", _with_error_handler(explain_bias_node))
workflow.add_node("correct", _with_error_handler(correct_model_node))
workflow.add_node("report", _with_error_handler(generate_report_node))
workflow.add_node("log", _with_error_handler(log_firebase_node))
workflow.set_entry_point("detect")
workflow.add_edge("detect", "explain")
workflow.add_edge("explain", "correct")
workflow.add_edge("correct", "report")
workflow.add_edge("report", "log")
workflow.add_edge("log", END)
audit_app = workflow.compile()
