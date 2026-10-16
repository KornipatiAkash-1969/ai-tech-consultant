import os
import asyncio
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .models import (
    SearchQuery, SearchResult, ChatRequest, ChatResponse,
    Escalation, ResolveEscalationRequest, SyncStatus, Article
)
from .vector_store import VectorStore
from .escalation_manager import EscalationManager
from .rag_engine import RAGEngine
from .crawler import PoliteCrawler
from .sitemap_syncer import SitemapSyncer

# Core singletons
vector_store = VectorStore()
escalation_manager = EscalationManager(vector_store)
rag_engine = RAGEngine(vector_store, escalation_manager)
crawler = PoliteCrawler()
syncer = SitemapSyncer(crawler, vector_store)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure checkpoint DB and seed data loaded
    print(f"[Knowledge Brain] Initialized with {vector_store.get_article_count()} articles in memory.")
    yield
    print("[Knowledge Brain] Shutting down cleanly.")

app = FastAPI(
    title="AI Tech Consultant - Knowledge Brain API",
    description=(
        "The single source of truth for Brilliant Directories help center documentation, "
        "multimodal screenshot understanding, daily differential sitemap synchronization, "
        "and human-in-the-loop expert escalations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
async def root():
    return {
        "service": "AI Tech Consultant - The Knowledge Brain",
        "status": "online",
        "documentation": "/docs",
        "version": "1.0.0",
        "articles_indexed": vector_store.get_article_count(),
        "endpoints": [
            "POST /api/v1/search",
            "POST /api/v1/chat",
            "GET /api/v1/escalations",
            "POST /api/v1/escalations/{id}/resolve",
            "POST /api/v1/sync",
            "GET /api/v1/sync/status",
            "GET /api/v1/stats"
        ]
    }

@app.get("/health", tags=["General"])
async def health():
    return {
        "status": "healthy",
        "articles_count": vector_store.get_article_count(),
        "checkpoint_stats": crawler.get_checkpoint_stats()
    }

@app.post("/api/v1/search", response_model=List[SearchResult], tags=["Search & Retrieval"])
async def search_knowledge_base(query: SearchQuery):
    """
    Search articles by query using hybrid BM25 and semantic matching.
    Tasks 2 and 3 use this endpoint to find relevant product capabilities.
    """
    results = vector_store.search(
        query=query.query,
        top_k=query.top_k,
        category=query.category,
        min_score=query.min_score
    )
    return results

@app.post("/api/v1/chat", response_model=ChatResponse, tags=["RAG & Chatbot"])
async def chat_with_knowledge_brain(req: ChatRequest):
    """
    Query the chatbot with a technical question.
    Returns verified answers, direct article citations, and associated screenshots.
    If knowledge is insufficient, automatically creates a human expert escalation.
    """
    return await rag_engine.answer_question(req)

@app.get("/api/v1/escalations", response_model=List[Escalation], tags=["Escalations"])
async def list_escalations(status: Optional[str] = Query(None, description="Filter by 'pending' or 'resolved'")):
    """List customer questions that could not be answered with high confidence"""
    return escalation_manager.list_escalations(status=status)

@app.get("/api/v1/escalations/{escalation_id}", response_model=Escalation, tags=["Escalations"])
async def get_escalation(escalation_id: str):
    esc = escalation_manager.get_escalation(escalation_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return esc

@app.post("/api/v1/escalations/{escalation_id}/resolve", response_model=Escalation, tags=["Escalations"])
async def resolve_escalation(escalation_id: str, req: ResolveEscalationRequest):
    """
    Submit an expert answer for an escalation.
    Crucially, this answer flows directly back into the Knowledge Brain vector memory.
    """
    resolved = escalation_manager.resolve_escalation(
        escalation_id=escalation_id,
        expert_answer=req.expert_answer,
        expert_name=req.expert_name,
        category=req.category or "Expert Resolution"
    )
    if not resolved:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return resolved

@app.post("/api/v1/sync", response_model=SyncStatus, tags=["Sitemap & Synchronization"])
async def trigger_sitemap_sync(background_tasks: BackgroundTasks):
    """
    Trigger differential synchronization with the live sitemap.
    Detects added, updated, and removed articles, immediately pruning removed ones.
    """
    # Run sync in background so the API stays responsive
    background_tasks.add_task(syncer.run_differential_sync)
    return SyncStatus(
        is_syncing=True,
        message="Differential sitemap synchronization started in background."
    )

@app.get("/api/v1/sync/status", response_model=SyncStatus, tags=["Sitemap & Synchronization"])
async def get_sync_status():
    """Get the current or most recent sitemap sync status"""
    return syncer.last_sync_status

@app.get("/api/v1/stats", tags=["General"])
async def get_statistics():
    """Detailed statistics on knowledge coverage and crawler progress"""
    articles = list(vector_store.articles.values())
    categories = list(set(a.category for a in articles))
    total_images = sum(len(a.images) for a in articles)
    return {
        "total_articles": len(articles),
        "total_categories": len(categories),
        "categories_list": categories,
        "total_images_indexed": total_images,
        "crawler_stats": crawler.get_checkpoint_stats(),
        "pending_escalations": len(escalation_manager.list_escalations(status="pending")),
        "resolved_escalations": len(escalation_manager.list_escalations(status="resolved"))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("task1_knowledge_brain.app.main:app", host="0.0.0.0", port=settings.port, reload=True)
