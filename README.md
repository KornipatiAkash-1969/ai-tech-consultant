# AI Tech Consultant

The **AI Tech Consultant** is a unified system that replaces expensive manual developer discovery and support with high-precision automation. It ingests public SaaS help centers, resolves customer support inboxes with human-in-the-loop learning, and transforms messy client meeting transcripts into itemized Scopes of Work (SOWs) and proposals in minutes instead of days.

---

## What It Does

1. **Task 1 — The Knowledge Brain (Python / FastAPI)**:
   - Indexes the live **Brilliant Directories Solution Center** via polite rate-limited crawling and SQLite checkpointing.
   - Extracts screenshots and performs multimodal visual parsing to answer questions that rely on UI visual evidence.
   - Runs daily differential sitemap synchronization (`sitemap.xml`) to add, update, and prune removed articles.
   - Answers questions via hybrid BM25 + semantic RAG with citations, escalating low-confidence queries to human experts whose resolutions flow back into memory.

2. **Task 2 — The Inbox Agent (Strict TypeScript / Node.js)**:
   - Reads customer inquiries across 6 categories (how-to, new project, refund, complaint, quote, follow-up) using a 50-email realistic dataset.
   - Queries Task 1 API to ground replies in official documentation.
   - Learns from human draft edits using a diff-learning engine, storing measurable and undoable preferences.
   - Unlocks full autonomous sending once 20 consecutive drafts of a category are approved unchanged, with an instant safety regression rollback if quality drops.

3. **Task 3 — Meeting to Scope of Work (Python)**:
   - Deploys a 5-agent team (Senior Consultant, Feature Matcher, Estimator, Scope Diff, Proposal Generator).
   - Validates client requests against Task 1 Knowledge Brain to identify native platform settings, saving clients thousands in unnecessary custom code.
   - Diffs follow-up meetings against baseline scopes to catch scope creep and generate billable change orders.
   - Enforces a human sign-off gate before any proposal reaches the client.

---

## One-Command Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Launch Everything
**Windows (PowerShell):**
```powershell
.\run.ps1
```

**Linux / macOS (Bash):**
```bash
chmod +x run.sh
./run.sh
```

**Docker Compose:**
```bash
docker-compose up --build
```

---

## Service Endpoints & UI

| Component | Language / Framework | Local URL | Documentation |
| :--- | :--- | :--- | :--- |
| **Unified Dashboard** | HTML5 / Vanilla JS / CSS3 | Open `dashboard/index.html` in browser | Interactive Screen |
| **Task 1 Knowledge Brain** | Python / FastAPI (Async) | `http://localhost:8001` | `http://localhost:8001/docs` |
| **Task 2 Inbox Agent** | Strict TypeScript / Node.js | `http://localhost:8002` | Endpoints listed on root `/` |
| **Task 3 Meeting to SOW** | Python / FastAPI (Async) | `http://localhost:8003` | `http://localhost:8003/docs` |

---

## Running Verification Tests & Evals

Run all automated unit and integration tests:
```bash
# Task 1 Tests (Vector search, sitemap deletion, escalation memory flowback)
python task1_knowledge_brain/tests/test_task1.py

# Task 2 Tests (Classification, drafting, diff learning, 20-approval autonomy)
npm --prefix task2_inbox_agent test

# Task 3 Tests (Multi-agent SOW, native vs custom feature matcher, scope diff)
python task3_meeting_sow/tests/test_task3.py

# 60-Case Model Benchmark Suite (Sonnet vs Haiku quality, cost, speed)
python evals/run_all_evals.py
```
