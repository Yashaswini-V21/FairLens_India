from __future__ import annotations

import os
import tempfile
from datetime import datetime
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


def _safe_text(value: Any, fallback: str = "N/A") -> str:
    if value is None:
        return fallback
    if isinstance(value, str) and not value.strip():
        return fallback
    return str(value)


def _verdict(metrics: Dict[str, Any], threshold: float = 0.05) -> str:
    gaps = [abs(float(metrics.get(key, 0.0))) for key in ["demographic_parity_difference", "equalized_odds_difference", "equal_opportunity_difference"]]
    worst_gap = max(gaps) if gaps else 0.0
    if worst_gap < threshold:
        return "FAIR"
    if worst_gap <= 0.10:
        return "BORDERLINE"
    return "BIASED"


def _dataset_hash(state: Dict[str, Any]) -> str:
    basis = f"{state.get('model_path', '')}|{state.get('dataset_path', '')}|{state.get('report_path', '')}|{state.get('status', '')}"
    return sha256(basis.encode("utf-8")).hexdigest()[:16]


def generate_pdf(state: Dict[str, Any]) -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    output_dir = Path(os.environ.get("FAIRLENS_REPORT_DIR", tempfile.gettempdir()))
    output_path = output_dir / f"fairlens_audit_{timestamp}.pdf"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CenterTitle", parent=styles["Title"], alignment=TA_CENTER, fontSize=24, leading=28, spaceAfter=16))
    styles.add(ParagraphStyle(name="Section", parent=styles["Heading2"], spaceBefore=12, spaceAfter=8))
    styles.add(ParagraphStyle(name="Body", parent=styles["BodyText"], leading=16, spaceAfter=8))
    styles.add(ParagraphStyle(name="SmallCenter", parent=styles["BodyText"], alignment=TA_CENTER, fontSize=9, textColor=colors.grey))

    shap_results = state.get("shap_results", {}) or {}
    fairness_metrics = state.get("fairness_metrics", {}) or {}
    correction_results = state.get("correction_results", {}) or {}

    verdict = _verdict(correction_results.get("after_metrics", fairness_metrics))
    sensitive_cols = state.get("sensitive_cols", []) or []
    explanation = _safe_text(state.get("gemini_explanation"), "No explanation was generated.")
    hindi = _safe_text(state.get("hindi_explanation"))

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    story = []
    story.append(Paragraph("FairLens India - AI Fairness Audit Report", styles["CenterTitle"]))
    story.append(Paragraph(f"Generated on {_safe_text(datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'))}", styles["SmallCenter"]))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph(f"Dataset: {_safe_text(state.get('dataset_path'))}", styles["Body"]))
    story.append(Paragraph(f"Model: {_safe_text(state.get('model_path'))}", styles["Body"]))
    story.append(Paragraph(f"ML Readiness Score: {_readiness_score(fairness_metrics):.0f}/100", styles["Body"]))
    story.append(Paragraph(f"Verdict: <b>{verdict}</b>", styles["Body"]))
    story.append(Spacer(1, 0.15 * inch))

    summary_table = Table(
        [
            ["Rows audited", _safe_text(state.get("rows_audited"))],
            ["Columns checked", _safe_text(state.get("columns_checked"))],
            ["Sensitive columns", ", ".join(map(str, sensitive_cols)) if sensitive_cols else "None detected"],
        ],
        colWidths=[2.1 * inch, 3.8 * inch],
    )
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
            ]
        )
    )
    story.append(summary_table)
    story.append(PageBreak())

    story.append(Paragraph("Executive Summary", styles["Section"]))
    story.append(Paragraph(explanation, styles["Body"]))
    if hindi and hindi != "N/A":
        story.append(Paragraph(f"Hindi translation: {hindi}", styles["Body"]))
    story.append(Spacer(1, 0.1 * inch))

    metric_rows = [["Metric", "Value", "Rating"]]
    for key in ["demographic_parity_difference", "equalized_odds_difference", "equal_opportunity_difference"]:
        value = float(abs(fairness_metrics.get(key, 0.0)))
        rating = _rating_label(value)
        metric_rows.append([key.replace("_", " ").title(), f"{value:.4f}", rating])
    findings = Table(metric_rows, colWidths=[2.8 * inch, 1.2 * inch, 1.5 * inch])
    findings.setStyle(_metric_table_style(metric_rows))
    story.append(Paragraph("Bias Findings", styles["Section"]))
    story.append(findings)
    story.append(Spacer(1, 0.15 * inch))

    before = correction_results.get("before_metrics", fairness_metrics)
    after = correction_results.get("after_metrics", fairness_metrics)
    comparison_rows = [["Metric", "Before", "After", "Improvement %"]]
    for key in ["demographic_parity_difference", "equalized_odds_difference", "equal_opportunity_difference"]:
        before_value = abs(float(before.get(key, 0.0)))
        after_value = abs(float(after.get(key, 0.0)))
        improvement = ((before_value - after_value) / before_value * 100.0) if before_value else 0.0
        comparison_rows.append([key.replace("_", " ").title(), f"{before_value:.4f}", f"{after_value:.4f}", f"{improvement:.1f}%"])
    comparison = Table(comparison_rows, colWidths=[2.4 * inch, 1.2 * inch, 1.2 * inch, 1.4 * inch])
    comparison.setStyle(_metric_table_style(comparison_rows))
    story.append(PageBreak())
    story.append(Paragraph("Before vs After Correction", styles["Section"]))
    story.append(comparison)
    story.append(Paragraph(f"Accuracy before: {_safe_text(correction_results.get('accuracy_before'), 'N/A')}", styles["Body"]))
    story.append(Paragraph(f"Accuracy after: {_safe_text(correction_results.get('accuracy_after'), 'N/A')}", styles["Body"]))
    story.append(Paragraph(f"Fairness improvement: {_safe_text(correction_results.get('fairness_improvement_pct'), 'N/A')}%", styles["Body"]))
    story.append(PageBreak())

    story.append(Paragraph("Certification", styles["Section"]))
    story.append(Paragraph(_cert_text(verdict), styles["Body"]))
    story.append(Paragraph(f"Dataset hash: {_dataset_hash(state)}", styles["Body"]))
    story.append(Paragraph(f"Sensitive feature count: {len(sensitive_cols)}", styles["Body"]))
    story.append(Paragraph(f"SHAP features reviewed: {len(shap_results.get('feature_names', []))}", styles["Body"]))

    doc.build(story)
    return str(output_path)


def _metric_table_style(rows: list[list[Any]]) -> TableStyle:
    style_commands = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
    ]
    for row_index, row in enumerate(rows[1:], start=1):
        rating = str(row[-1]).upper() if row else ""
        color = colors.HexColor("#dcfce7") if rating == "FAIR" else colors.HexColor("#fef3c7") if rating == "BORDERLINE" else colors.HexColor("#fee2e2")
        style_commands.append(("BACKGROUND", (0, row_index), (-1, row_index), color))
    return TableStyle(style_commands)


def _rating_label(value: float) -> str:
    if value < 0.05:
        return "FAIR"
    if value <= 0.10:
        return "BORDERLINE"
    return "BIASED"


def _readiness_score(fairness_metrics: Dict[str, Any]) -> float:
    gaps = [abs(float(fairness_metrics.get(key, 0.0))) for key in ["demographic_parity_difference", "equalized_odds_difference", "equal_opportunity_difference"]]
    if not gaps:
        return 100.0
    penalty = min(100.0, sum(gaps) * 300.0)
    return max(0.0, 100.0 - penalty)


def _cert_text(verdict: str) -> str:
    if verdict == "FAIR":
        return "FAIRNESS CERTIFIED - All tracked fairness metrics are below the approval threshold."
    return "REMEDIATION REQUIRED - One or more fairness metrics still exceed the certification threshold."
