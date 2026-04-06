from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Optional

try:
    import firebase_admin
    from firebase_admin import auth, credentials, firestore
except ImportError:  # pragma: no cover - optional dependency during bootstrap
    firebase_admin = None
    auth = None
    credentials = None
    firestore = None


@dataclass
class _LocalCounter:
    total_audits: int = 0
    audits_today: int = 0


_fallback_counter = _LocalCounter()


def init_firebase() -> Any:
    if firebase_admin is None or firestore is None:
        return None
    if not firebase_admin._apps:
        cred_dict = {
            "type": "service_account",
            "project_id": os.environ.get("FIREBASE_PROJECT_ID", ""),
            "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", ""),
            "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL", ""),
        }
        firebase_admin.initialize_app(credentials.Certificate(cred_dict))
    return firestore.client()


def verify_id_token(id_token: str) -> Optional[dict]:
    token = (id_token or "").strip()
    if not token or firebase_admin is None or auth is None:
        return None
    try:
        if not firebase_admin._apps:
            init_firebase()
        return auth.verify_id_token(token)
    except Exception:
        return None


def increment_counter(db: Any) -> None:
    global _fallback_counter
    if db is None:
        _fallback_counter.total_audits += 1
        _fallback_counter.audits_today += 1
        return
    db.collection("stats").document("global").set(
        {
            "total_audits": firestore.Increment(1),
            "audits_today": firestore.Increment(1),
        },
        merge=True,
    )


def get_count(db: Any) -> int:
    if db is None:
        return _fallback_counter.total_audits
    doc = db.collection("stats").document("global").get()
    return doc.to_dict().get("total_audits", 0) if doc.exists else 0


def log_audit(db: Any, payload: Optional[dict] = None) -> None:
    if db is None:
        return
    db.collection("audit_logs").add(payload or {})
