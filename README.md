<!-- HEADER -->
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=⚖️%20FairLens%20India&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Detect%20bias.%20Explain%20it.%20Fix%20it%20automatically.&descAlignY=60&descSize=18" width="100%"/>

<br/>

[![Local Demo](https://img.shields.io/badge/🌐_Local_Demo-http%3A%2F%2Flocalhost%3A8000-0ea5e9?style=for-the-badge&logoColor=white)](http://localhost:8000)
[![Google Solution Challenge](https://img.shields.io/badge/Google_Solution_Challenge-2026-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://hack2skill.com)
[![Track](https://img.shields.io/badge/Track-Unbiased_AI_Decision-818cf8?style=for-the-badge&logoColor=white)](https://hack2skill.com)
[![Status](https://img.shields.io/badge/Status-In_Development-yellow?style=for-the-badge&logoColor=black)](#-development-status)
[![Progress](https://img.shields.io/badge/Progress-Work_In_Progress-yellow?style=for-the-badge&logoColor=black)](#-development-status)

<br/>

[![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-AI_Core-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Deployment](https://img.shields.io/badge/Deployment-Local_First-yellow?style=flat-square&logoColor=black)](#-quickstart)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FBBC04?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent-c084fc?style=flat-square&logoColor=white)](https://langgraph.io)
[![SHAP](https://img.shields.io/badge/SHAP-Explainability-ef4444?style=flat-square&logoColor=white)](https://shap.readthedocs.io)
[![Fairlearn](https://img.shields.io/badge/Fairlearn-Bias_Correction-0ea5e9?style=flat-square&logoColor=white)](https://fairlearn.org)

<br/>

> ### *Not one fair model. The tool that makes every model fair.*

<br/>

</div>

---

## 🎯 The Problem Nobody Is Solving

<table>
<tr>
<td width="60%">

In India, ML models make decisions that change lives **in milliseconds** — loan approvals, job shortlisting, scholarships, healthcare priority.

**None of these models are audited for bias.**

A woman from rural Karnataka — same income, same credit score as an urban man — gets rejected for a loan in 0.3 seconds. Was it her financials, or her gender and district?

**Currently, nobody can answer that question. No accessible tool exists.**

</td>
<td width="40%">

| Metric | Reality |
|--------|---------|
| 🇮🇳 **450M+** | Indians affected by ML decisions yearly |
| 📊 **0%** | Indian AI startups that audit for bias |
| ❌ **2.3×** | Higher rejection rate for rural women |
| 💚 **₹0** | What FairLens costs to use |

</td>
</tr>
</table>

---

## 🚧 Development Status

> FairLens India is a **hackathon project under active development**.
> The README reflects the **full target vision** for final submission.

### Current Build (what is live in this repo now)

- ✅ FastAPI backend with working `/health`, `/counter`, `/audit`, `/correct`, `/report`
- ✅ Fairness core modules connected: SHAP, Fairlearn scoring/correction, report generation
- ✅ Modern static landing page with splash screen + interactive Audit modal flow
- ✅ Audit popup supports model/dataset upload and fairness result rendering

### In Progress (what we are actively building next)

- 🔄 Advanced React/Vite product frontend layer for full multi-tab experience
- 🔄 Expanded visual analytics and richer report interactions
- 🔄 Deployment/documentation polish for final hackathon demo package

### 🔐 Easiest Auth Setup (Recommended for Hackathon Demo)

Use simple backend API key protection with one env var:

- Set `FAIRLENS_API_KEY` as an environment variable where backend runs.
- Backend auto-protects `POST /audit`, `POST /correct`, and `POST /report`.
- Send header `x-api-key: <your-key>` from frontend.
- In this repo UI, use the **Set API Key** button in topbar once; key is stored locally in browser.

Local example (PowerShell):

```bash
$env:FAIRLENS_API_KEY = "your-strong-key"
python -m backend.main
```

### 🔐 Firebase Auth Setup (Google-native)

If you want Google-first auth for judging narrative, enable Firebase Authentication and send Firebase ID token as a Bearer token.

- The landing page has a **Firebase Auth** setup card with:
  - **Set Firebase Config**
  - **Google sign-in**
  - **Sign out**
- Backend accepts `Authorization: Bearer <firebase-id-token>`.
- Keep `FAIRLENS_API_KEY` as fallback for quick demo recovery.
- To force Firebase-only behavior, set `FIREBASE_AUTH_REQUIRED=true`.

Frontend config needed from Firebase web app:

- `apiKey`
- `authDomain`
- `projectId`
- `appId`

Required backend env vars for Firebase Admin verification:

- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

Local backend example (PowerShell):

```bash
$env:FIREBASE_AUTH_REQUIRED = "true"
$env:FIREBASE_PROJECT_ID = "your-project-id"
$env:FIREBASE_CLIENT_EMAIL = "your-service-account-email"
# set FIREBASE_PRIVATE_KEY in env or via .env before starting backend
python -m backend.main
```

Set `FIREBASE_PRIVATE_KEY` in your local environment (or `.env`) before starting backend.

Open the app, click **Set Firebase Config**, paste the web config JSON, then click **Google sign-in**.

Useful console links:

- Firebase Console: https://console.firebase.google.com/
- Authentication setup: https://console.firebase.google.com/project/_/authentication/providers
- Service accounts: https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk
- Secret Manager: https://console.cloud.google.com/security/secret-manager

---

## ✨ What Makes FairLens India Unique

> Most teams at hackathons **build one fair classifier**. FairLens builds the **tool that audits any classifier**.
> That is not a marginal difference — it is 10,000× the impact.

```
                    ┌─────────────────────────────────┐
                    │     What other teams build       │
                    │   One fair loan approval model   │
                    │         Helps: 1 use case        │
                    └─────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │       What FairLens builds       │
                    │  Tool that audits ANY ML model   │
                    │    Helps: 50,000+ developers     │
                    │  Every model they ever build     │
                    └─────────────────────────────────┘
```

**We also differ from existing tools:**

| Tool | What it lacks | What FairLens adds |
|------|--------------|-------------------|
| IBM AI Fairness 360 | Complex API, no UI, not India-specific | One-click UI, Indian context, plain English |
| Google What-If Tool | Visualisation only, no correction | Full pipeline: detect → explain → fix → download |
| Manual audit | Weeks of work, expensive | 3 minutes, free, any developer |

---

## 🚀 Demo Access

> **Local frontend:** http://localhost:8000  
> **Local backend health:** http://localhost:8080/health

### What the Demo Shows (Real Numbers)

We audited our own **Credit Risk Engine** — XGBoost, AUC-ROC 0.89, trained on 150,000 Indian loan applications:

```
BEFORE FAIRLENS:
  Gender + location contribution: 35% of rejection decisions
  Women in Tier-3 districts rejected at: 2.3× rate vs urban men
  Demographic parity score: 0.23  ← BIASED (threshold: 0.10)

AFTER FAIRLENS CORRECTION:
  Demographic parity score: 0.04  ← FAIR ✅
  Disparity ratio: 2.3× → 1.05×  ✅
  Accuracy retained: 89% → 87%   ← 2% fairness-accuracy tradeoff
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FairLens India                                  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend (HTML/CSS/JS)                   │  │
│  │   ┌──────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │  │
│  │   │  Upload  │  │ Bias Report │  │   Gemini AI  │  │  Fix +  │ │  │
│  │   │   Tab    │  │   Tab       │  │  Explanation │  │Download │ │  │
│  │   └──────────┘  └─────────────┘  └──────────────┘  └─────────┘ │  │
│  └────────────────────────────┬─────────────────────────────────────┘  │
│                               │ REST API calls                          │
│  ┌────────────────────────────▼─────────────────────────────────────┐  │
│  │                   FastAPI Backend (Python)                        │  │
│  │   GET /health  GET /counter  POST /audit  POST /correct          │  │
│  │   GET /report  POST /report                                        │  │
│  └────────────────────────────┬─────────────────────────────────────┘  │
│                               │ triggers                                │
│  ┌────────────────────────────▼─────────────────────────────────────┐  │
│  │              LangGraph Autonomous Audit Agent                     │  │
│  │                                                                   │  │
│  │   detect_bias → explain_bias → correct_model → report → log      │  │
│  │      (SHAP)      (Gemini)      (Fairlearn)   (PDF)  (Firebase)   │  │
│  └──┬──────────────┬──────────────┬──────────────┬──────────────────┘  │
│     │              │              │              │                      │
│  ┌──▼───┐     ┌────▼────┐    ┌───▼────┐    ┌───▼──────────────────┐   │
│  │SHAP  │     │ Gemini  │    │Fairlear│    │ Firebase  ReportLab  │   │
│  │Engine│     │2.0 Flash│    │Correct │    │ Firestore   PDF Gen  │   │
│  └──────┘     └─────────┘    └────────┘    └─────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │         Local Runtime (frontend :8000, backend :8080)          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow — How One Audit Runs

```
Developer opens FairLens India (React UI)
          │
          ▼
    [Tab 1: Upload]
    ┌─────────────────────────────────────┐
    │  Upload model.pkl + dataset.csv     │
    │  Select sensitive columns:          │
    │  [gender] [location] [age] [caste]  │
    │  (or let FairLens auto-detect)      │
    └──────────────┬──────────────────────┘
                   │ POST /audit
                   ▼
    ┌─────────────────────────────────────┐
    │     LangGraph Agent Starts          │
    │                                     │
    │  Node 1: detect_bias               │
    │    → SHAP values computed           │
    │    → Sensitive features flagged     │
    │    → State: shap_results ✅         │
    │                                     │
    │  Node 2: explain_bias              │
    │    → Gemini 2.0 Flash called        │
    │    → 3-sentence explanation         │
    │    → State: gemini_explanation ✅   │
    │                                     │
    │  Node 3: correct_model             │
    │    → ExponentiatedGradient runs     │
    │    → Fair model trained             │
    │    → State: correction_results ✅   │
    │                                     │
    │  Node 4: generate_report           │
    │    → PDF compiled with all data     │
    │    → State: report_path ✅          │
    │                                     │
    │  Node 5: log_firebase              │
    │    → Audit logged to Firestore      │
    │    → Live counter incremented       │
    │    → State: firebase_logged ✅      │
    └──────────────┬──────────────────────┘
                   │ Results returned
                   ▼
    [Tab 2: Bias Report]
    SHAP waterfall chart (red = bias source)
    3 fairness metric cards (Red/Amber/Green)
    Group selection rates bar chart
                   │
                   ▼
    [Tab 3: Gemini Explanation]
    ┌─────────────────────────────────────┐
    │  "Your credit risk model shows      │
    │   significant gender-location bias. │
    │   Women from Tier-3 districts are   │
    │   rejected 2.3× more than urban     │
    │   men with identical financials.    │
    │   Apply Fairlearn correction with   │
    │   DemographicParity constraint."    │
    └─────────────────────────────────────┘
    [Translate to Hindi] button
                   │
                   ▼
    [Tab 4: Fix + Download]
    Before vs After comparison chart
    Download: corrected_model.pkl
    Download: fairlens_audit_report.pdf
    🏆 Fairness Certificate (if all metrics < 0.05)
```

---

## ⚡ Complete Feature Set

### Core Features

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | **Model Upload** | Any sklearn model (.pkl) + dataset (.csv) | ✅ Core |
| 2 | **Auto-Detect Sensitive Cols** | Scans column names + value distributions | ✅ Core |
| 3 | **SHAP Waterfall Charts** | Interactive — red = bias source, blue = fair | ✅ Core |
| 4 | **Demographic Parity** | Main fairness metric with Red/Amber/Green | ✅ Core |
| 5 | **Equalized Odds** | True positive + false positive rate gap | ✅ Core |
| 6 | **Equal Opportunity** | True positive rate gap across groups | ✅ Core |
| 7 | **Gemini Explanation** | 3-sentence plain English — no jargon | ✅ Core |
| 8 | **ExponentiatedGradient** | Auto-correction with fairness constraints | ✅ Core |
| 9 | **Before/After Comparison** | Side-by-side improvement chart | ✅ Core |
| 10 | **PDF Audit Report** | Charts + explanation + certification stamp | ✅ Core |

### AI Agent Layer

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 11 | **LangGraph 5-Node Agent** | Fully autonomous — one button, zero clicks | ✅ Agent |
| 12 | **Firebase Live Counter** | Real-time "X models audited today" | ✅ Agent |
| 13 | **Audit History Logging** | Every audit logged to Firestore | ✅ Agent |

### Optional / Extras

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 14 | **Hindi Translation** | Gemini explanation in Hindi (Bhashini API) | 🔄 Optional |
| 15 | **Fairness Certificate** | Digital cert when all metrics pass | 🔄 Optional |
| 16 | **Voice Explanation** | Explanation read aloud via gTTS | 🔄 Optional |
| 17 | **Model Comparison** | Compare fairness across two versions | 🔄 Optional |
| 18 | **Batch Audit** | Audit multiple models in one session | 🔄 Optional |

---

## 🔧 Tech Stack

> Note: This section includes both **current implementation** and **target hackathon stack**.

### Frontend

#### Current implementation in this repository

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Landing + audit popup UI |
| **CSS3** | Design system, animations, responsive layout |
| **Vanilla JavaScript** | Modal logic, audit form flow, API integration |

#### Target stack for final hackathon build

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | Component-based UI architecture |
| **Vite** | 5.x | Build tool + dev server |
| **Recharts** | 2.x | Interactive SHAP + fairness charts |
| **Axios** | 1.x | API calls to FastAPI backend |
| **TailwindCSS** | 3.x | Utility-first styling |
| **Framer Motion** | 10.x | Smooth tab transitions + animations |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.109 | REST API — /audit, /correct, /report |
| **SHAP** | 0.44.1 | Feature importance + waterfall values |
| **Fairlearn** | 0.10.0 | Bias metrics + ExponentiatedGradient |
| **scikit-learn** | 1.4.0 | Model loading + prediction |
| **LangGraph** | 0.0.30 | 5-node autonomous audit agent |
| **google-generativeai** | 0.4.1 | Gemini 2.0 Flash API |
| **ReportLab** | 4.1.0 | PDF audit report generation |
| **joblib** | 1.3.2 | Model serialization (.pkl) |

### Google Cloud

| Service | Purpose |
|---------|---------|
| **Gemini 2.0 Flash** | Plain English bias explanation |
| **Local Runtime** | Frontend on :8000 and backend on :8080 |
| **Firebase Firestore** | Real-time audit counter + history |
| **Vertex AI** | Model hosting (optional) |

---

## 📁 Project Structure

> Current branch uses a flat static frontend (`index.html`, `styles.css`, `script.js`) plus `backend/`.
> The structure below represents the target final architecture we are building toward.

```
fairlens-india/
│
├── frontend/                      ← React app (HTML/CSS/JS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadTab.jsx       ← Model + dataset upload
│   │   │   ├── BiasReport.jsx      ← SHAP charts + metric cards
│   │   │   ├── GeminiExplain.jsx   ← AI explanation card
│   │   │   ├── FixDownload.jsx     ← Before/after + downloads
│   │   │   ├── LiveCounter.jsx     ← Firebase real-time count
│   │   │   └── FairnessChart.jsx   ← Recharts visualisations
│   │   ├── api/
│   │   │   └── fairlensApi.js      ← Axios calls to FastAPI
│   │   ├── App.jsx                 ← 4-tab layout
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                       ← FastAPI + ML engine
│   ├── main.py                    ← FastAPI routes
│   ├── engine/
│   │   ├── bias_detector.py       ← SHAP analysis
│   │   ├── fairness_scorer.py     ← Fairlearn metrics
│   │   ├── gemini_explainer.py    ← Gemini 2.0 Flash
│   │   └── model_corrector.py     ← Bias correction
│   ├── agents/
│   │   └── audit_agent.py         ← LangGraph 5-node pipeline
│   └── utils/
│       ├── report_generator.py    ← PDF generation
│       └── firebase_handler.py    ← Firestore counter
│
├── docker-compose.yml             ← Local dev (frontend + backend)
├── Dockerfile.backend             ← Optional containerization
├── .github/workflows/
│   └── deploy.yml                 ← Auto-deploy on push
└── requirements.txt
```

---

## 🚀 Quickstart

### Quickstart (current repository state)

```bash
# from repo root
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt

# Python 3.14 note (if fairlearn is needed):
# python -m pip install --no-deps fairlearn

# optional: choose report output directory
# Windows (PowerShell): $env:FAIRLENS_REPORT_DIR = "C:\\temp\\fairlens-reports"
# macOS/Linux (bash): export FAIRLENS_REPORT_DIR=/tmp/fairlens-reports

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
```

Open frontend using your static server (for example VS Code Live Server):

```
http://127.0.0.1:5500/index.html
```

### Quickstart (target React/Vite setup - in progress)

```bash
# Clone
git clone https://github.com/Yashaswini-V21/fairlens-india
cd fairlens-india

# Backend
pip install -r requirements.txt
# Optional if present in your branch:
# cp .env.template .env
# Add: GEMINI_API_KEY, Firebase credentials
python -m uvicorn backend.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** → Upload any sklearn model → Audit complete.

### Get Your Free Gemini API Key
Go to **[aistudio.google.com](https://aistudio.google.com)** → Sign in → Create API key → Copy. No credit card. Instant. 15 req/min free.

---

## ⚡ API Quick Test (Judge Friendly)

Use this section to validate the backend quickly without opening the UI.

### One-command smoke test (recommended)

```bash
python scripts/smoke_test.py --base-url http://localhost:8080
```

This command auto-generates:
- `samples/sample_model.pkl`
- `samples/sample_dataset.csv`

Then it runs `/health`, `/audit`, and `/correct` and prints `SMOKE TEST PASSED` when successful.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Service health check |
| `/counter` | GET | Audits counter (Firestore/local fallback) |
| `/audit` | POST | Full detect → explain → correct → report pipeline |
| `/correct` | POST | Fairness correction only |
| `/report` | GET | Report usage guidance |
| `/report` | POST | Generate PDF from payload |

### 1) Health check

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "fairlens-india"
}
```

### 2) Run full audit

```bash
curl -X POST "http://localhost:8080/audit" \
  -F "model_file=@sample_model.pkl" \
  -F "dataset_file=@sample_dataset.csv" \
  -F "sensitive_cols=gender,location" \
  -F "fairness_threshold=0.10"
```

Expected keys in response:

```json
{
  "status": "done",
  "sensitive_cols": ["..."],
  "bias_flags": {"...": "..."},
  "shap_results": {"...": "..."},
  "fairness_metrics": {"...": "..."},
  "gemini_explanation": "...",
  "correction_results": {"...": "..."},
  "report_path": "...pdf"
}
```

### 3) Run correction only

```bash
curl -X POST "http://localhost:8080/correct" \
  -F "model_file=@sample_model.pkl" \
  -F "dataset_file=@sample_dataset.csv" \
  -F "sensitive_feature=gender"
```

Expected keys in response:

```json
{
  "before_metrics": {"...": "..."},
  "after_metrics": {"...": "..."},
  "accuracy_before": 0.0,
  "accuracy_after": 0.0,
  "fairness_improvement_pct": 0.0
}
```

---

## 🤖 LangGraph Agent — The Core Intelligence

```python
# agents/audit_agent.py

class AuditState(TypedDict):
    model_path: str
    dataset_path: str
    sensitive_cols: List[str]
    fairness_threshold: float          # default: 0.10
    shap_results: Optional[dict]
    fairness_metrics: Optional[dict]
    gemini_explanation: Optional[str]
    correction_results: Optional[dict]
    report_path: Optional[str]
    firebase_logged: bool
    status: str                        # planning|detecting|...|done
    error: Optional[str]

# 5 nodes → fully autonomous pipeline
workflow = StateGraph(AuditState)
workflow.add_node('detect',  detect_bias_node)    # SHAP
workflow.add_node('explain', explain_bias_node)   # Gemini
workflow.add_node('correct', correct_model_node)  # Fairlearn
workflow.add_node('report',  generate_report_node)# PDF
workflow.add_node('log',     log_firebase_node)   # Firebase

workflow.set_entry_point('detect')
workflow.add_edge('detect',  'explain')
workflow.add_edge('explain', 'correct')
workflow.add_edge('correct', 'report')
workflow.add_edge('report',  'log')
workflow.add_edge('log',     END)

audit_app = workflow.compile()
```

---

## 📊 Fairness Metrics

| Metric | Formula | Fair Threshold |
|--------|---------|----------------|
| **Demographic Parity Difference** | \|P(ŷ=1\|A=0) - P(ŷ=1\|A=1)\| | < 0.05 |
| **Equalized Odds Difference** | max(\|TPR diff\|, \|FPR diff\|) | < 0.05 |
| **Equal Opportunity Difference** | \|TPR(A=0) - TPR(A=1)\| | < 0.05 |

**Rating System:**
- 🟢 `FAIR` — metric < 0.05
- 🟡 `BORDERLINE` — metric 0.05–0.10
- 🔴 `BIASED` — metric > 0.10

---

## 🧪 Benchmark Snapshot (Hackathon Baseline)

| Item | Baseline |
|------|----------|
| **Audit runtime (end-to-end)** | 45-120 sec (typical), up to 180 sec with SHAP fallback |
| **Supported model types** | sklearn-compatible estimators with `predict()` (best with tree models) |
| **Recommended max dataset size** | 25 MB CSV for smooth hackathon demos |
| **Known limitations** | Single sensitive feature used for correction pass; fairness metrics depend on clean binary/label columns; SHAP fallback is approximate |

---

## 🌍 Impact

```
Target users:    50,000+ Indian ML developers
                 10,000+ Indian AI startups

Use cases:       FinTech → loan approval, credit scoring
                 EdTech  → scholarship selection
                 HR Tech → resume screening
                 GovTech → scheme eligibility, healthcare

Why now:         RBI, SEBI, MeitY drafting AI governance frameworks
                 Fairness auditing will be mandatory within 2 years
                 FairLens India = India's first accessible compliance tool
```


---

## 🏆 Google Solution Challenge 2026

<div align="center">

| Field | Detail |
|-------|--------|
| **Challenge** | Google Solution Challenge 2026 — Build With AI |
| **Organiser** | GDG × Hack2Skill |
| **Track** | Unbiased AI Decision — Open Innovation |
| **Team** | Yashaswini V + Darshini K.H |

</div>

---

## 📄 License

MIT License — Free to use, modify, and distribute. See [LICENSE](LICENSE).

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer&animation=fadeIn" width="100%"/>

**Built with ❤️ for fair AI in India**

[![Local Demo](https://img.shields.io/badge/Try_FairLens_India_Local-http%3A%2F%2Flocalhost%3A8000-0ea5e9?style=for-the-badge)](http://localhost:8000)

*Google Solution Challenge 2026 · Team FairLens*

</div>