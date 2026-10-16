import os
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

from .models import ScopeOfWork, SOWGenerateRequest, SOWDiffRequest
from .orchestrator import MultiAgentSOWOrchestrator

app = FastAPI(
    title="AI Tech Consultant - Meeting to Scope of Work API",
    description=(
        "Multi-agent AI consulting team that transforms messy meeting transcripts into "
        "accurate scopes of work, task lists with developer hour estimates, and client-ready proposals. "
        "Validates built-in platform capabilities vs custom code via Task 1 Knowledge Brain, "
        "detects scope creep across multiple meetings, and enforces human consultant approval gates."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = MultiAgentSOWOrchestrator()
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

@app.get("/", tags=["General"])
async def root():
    return {
        "service": "AI Tech Consultant - Meeting to Scope of Work",
        "version": "1.0.0",
        "active_sows": len(orchestrator.list_sows()),
        "endpoints": [
            "GET /api/v1/transcripts",
            "POST /api/v1/sow/generate",
            "POST /api/v1/sow/diff",
            "GET /api/v1/sow",
            "POST /api/v1/sow/{id}/approve"
        ]
    }

@app.get("/health", tags=["General"])
async def health():
    t1_healthy = await orchestrator.task1_client.is_healthy()
    return {
        "status": "healthy",
        "task1_api_connected": t1_healthy,
        "sows_count": len(orchestrator.list_sows())
    }

@app.get("/api/v1/transcripts", tags=["Transcripts"])
async def list_transcripts():
    """Retrieve pre-loaded realistic client meeting transcripts"""
    transcripts = {}
    files = {
        "meeting_1": DATA_DIR / "meeting_1_discovery.txt",
        "meeting_2": DATA_DIR / "meeting_2_scope_change.txt",
        "meeting_3": DATA_DIR / "meeting_3_restaurant_portal.txt"
    }
    for key, path in files.items():
        if path.exists():
            transcripts[key] = path.read_text(encoding="utf-8")
        else:
            transcripts[key] = f"Transcript file {path.name} not found."
    return transcripts

@app.post("/api/v1/sow/generate", response_model=ScopeOfWork, tags=["Scope of Work"])
async def generate_sow(req: SOWGenerateRequest):
    """
    Ingest a meeting transcript and execute the 5-agent pipeline:
    1. Senior Consultant: requirements & edge cases
    2. Feature Matcher: built-in settings vs custom code via Task 1
    3. Estimator: task breakdowns & hours
    4. Proposal Generator: client-ready Markdown proposal
    """
    return await orchestrator.generate_from_transcript(req)

@app.post("/api/v1/sow/diff", response_model=ScopeOfWork, tags=["Scope of Work"])
async def diff_sow(req: SOWDiffRequest):
    """
    Ingest follow-up meeting transcript, compare against baseline SOW,
    and detect modified specs and out-of-scope creep.
    """
    return await orchestrator.generate_diff_sow(req)

@app.get("/api/v1/sow", response_model=List[ScopeOfWork], tags=["Scope of Work"])
async def list_sows():
    return orchestrator.list_sows()

@app.get("/api/v1/sow/{sow_id}", response_model=ScopeOfWork, tags=["Scope of Work"])
async def get_sow(sow_id: str):
    sow = orchestrator.get_sow(sow_id)
    if not sow:
        raise HTTPException(status_code=404, detail="SOW not found")
    return sow

@app.post("/api/v1/sow/{sow_id}/approve", response_model=ScopeOfWork, tags=["Scope of Work"])
async def approve_sow(sow_id: str, approver_name: str = Body("Senior Technical Consultant", embed=True)):
    """
    Human-in-the-loop sign-off:
    Ensures nothing reaches the client until approved by a human consultant.
    """
    approved = orchestrator.approve_sow(sow_id, approver_name)
    if not approved:
        raise HTTPException(status_code=404, detail="SOW not found")
    return approved

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("task3_meeting_sow.app.main:app", host="0.0.0.0", port=8003, reload=True)
