from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ImageMetadata(BaseModel):
    url: str
    alt: Optional[str] = None
    caption: str = ""
    visual_features: Optional[str] = None

class Article(BaseModel):
    id: str
    url: str
    title: str
    category: str = "General"
    folder: str = "General"
    content: str
    markdown: str = ""
    images: List[ImageMetadata] = Field(default_factory=list)
    last_modified: Optional[str] = None
    content_hash: str = ""
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5
    category: Optional[str] = None
    min_score: float = 0.25

class SearchResult(BaseModel):
    article_id: str
    title: str
    url: str
    category: str
    folder: str
    snippet: str
    score: float
    matched_images: List[ImageMetadata] = Field(default_factory=list)

class ChatRequest(BaseModel):
    question: str
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    model: Optional[str] = None  # claude-3-5-sonnet, claude-3-5-haiku, or local/mock

class SourceCitation(BaseModel):
    title: str
    url: str
    category: str
    folder: str
    relevance_score: float

class ChatResponse(BaseModel):
    answer: str
    confidence_score: float
    sources: List[SourceCitation] = Field(default_factory=list)
    images_used: List[ImageMetadata] = Field(default_factory=list)
    escalated: bool = False
    escalation_id: Optional[str] = None
    model_used: str = "claude-3-5-sonnet"
    latency_ms: float = 0.0
    tokens_used: int = 0
    cost_usd: float = 0.0

class Escalation(BaseModel):
    id: str
    question: str
    context: str = ""
    confidence_score: float = 0.0
    status: str = "pending"  # pending, resolved
    expert_answer: Optional[str] = None
    expert_name: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    resolved_at: Optional[str] = None

class ResolveEscalationRequest(BaseModel):
    expert_answer: str
    expert_name: str = "Senior Support Specialist"
    category: Optional[str] = "Expert Resolution"

class SyncStatus(BaseModel):
    last_sync_time: Optional[str] = None
    total_sitemap_urls: int = 0
    indexed_articles: int = 0
    added_count: int = 0
    updated_count: int = 0
    removed_count: int = 0
    is_syncing: bool = False
    message: str = "Idle"
