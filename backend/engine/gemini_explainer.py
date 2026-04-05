from __future__ import annotations

import os
from typing import Any, Dict

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency during bootstrap
    genai = None


def setup_gemini() -> Any:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or genai is None:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.0-flash")


def explain_bias(model: Any, shap_results: Dict[str, Any], fairness_metrics: Dict[str, Any], context: str = "credit risk") -> str:
    gemini_model = model or setup_gemini()
    if gemini_model is None:
        return fallback_explanation(fairness_metrics)

    prompt = (
        "You are FairLens India, a bias audit assistant. "
        f"Context: {context}. "
        f"SHAP summary: {shap_results}. "
        f"Fairness metrics: {fairness_metrics}. "
        "Write exactly 3 plain English sentences. "
        "Sentence 1: state what bias exists, which group is affected, and include exact numbers. "
        "Sentence 2: say how severe it is and the likely real-world consequence. "
        "Sentence 3: recommend one single most impactful fix. "
        "Do not use bullet points, headings, or jargon."
    )
    try:
        response = gemini_model.generate_content(prompt)
        text = getattr(response, "text", "") or ""
        if text.strip():
            return _three_sentence_normalize(text)
    except Exception:
        pass
    return fallback_explanation(fairness_metrics)


def translate_to_hindi(model: Any, text: str) -> str:
    gemini_model = model or setup_gemini()
    if gemini_model is None:
        return "यह एक निष्पक्षता ऑडिट सारांश है: " + text
    prompt = (
        "Translate the following text into simple Hindi while preserving meaning and keeping it concise. "
        f"Text: {text}"
    )
    try:
        response = gemini_model.generate_content(prompt)
        translated = getattr(response, "text", "") or ""
        if translated.strip():
            return translated.strip()
    except Exception:
        pass
    return "यह एक निष्पक्षता ऑडिट सारांश है: " + text


def fallback_explanation(fairness_metrics: Dict[str, Any]) -> str:
    dp = float(abs(fairness_metrics.get("demographic_parity_difference", 0.0)))
    eo = float(abs(fairness_metrics.get("equalized_odds_difference", 0.0)))
    worst_group = fairness_metrics.get("worst_group") or "one group"
    disparity_ratio = fairness_metrics.get("disparity_ratio", 1.0)
    rating = "borderline" if dp <= 0.10 else "biased"
    if dp < 0.05:
        fix = "keep the current model and monitor it"
    else:
        fix = "retrain with Fairlearn constraints such as DemographicParity"
    return (
        f"The model is {rating} because demographic parity differs by {dp:.3f} and equalized odds differs by {eo:.3f}, with {worst_group} most affected. "
        f"This can create unfair rejections or approvals, and the disparity ratio is {disparity_ratio:.2f}. "
        f"The most effective fix is to {fix}."
    )


def _three_sentence_normalize(text: str) -> str:
    pieces = [part.strip() for part in text.replace("\n", " ").split(".") if part.strip()]
    if len(pieces) >= 3:
        return ". ".join(pieces[:3]).rstrip(".") + "."
    if text.strip().endswith("."):
        return text.strip()
    return text.strip() + "."
