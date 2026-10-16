from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

SolutionType = Literal["built_in_setting", "hybrid_tweak", "custom_code"]
DiffStatus = Literal["UNCHANGED", "MODIFIED", "NEW_IN_SCOPE", "OUT_OF_SCOPE_CREEP"]

class ConsultantQuestion(BaseModel):
    id: str
    topic: str
    question: str
    rationale: str
    impact_on_estimate: str

class ClientRequirement(BaseModel):
    id: str
    title: str
    raw_quote: str
    functional_spec: str
    solution_type: SolutionType
    bd_feature_ref: Optional[str] = None
    bd_article_url: Optional[str] = None
    cost_savings_usd: float = 0.0
    estimated_hours: float = 0.0

class DeveloperTask(BaseModel):
    id: str
    requirement_id: str
    title: str
    domain: Literal["frontend", "backend", "database", "integration", "qa"]
    description: str
    hours: float

class ScopeItemDiff(BaseModel):
    id: str
    title: str
    status: DiffStatus
    previous_spec: Optional[str] = None
    new_spec: str
    is_billable_extra: bool = False
    extra_hours: float = 0.0
    rationale: str

class ScopeOfWork(BaseModel):
    id: str
    client_name: str
    project_name: str
    meeting_source: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    executive_summary: str
    consultant_questions: List[ConsultantQuestion] = Field(default_factory=list)
    requirements: List[ClientRequirement] = Field(default_factory=list)
    developer_tasks: List[DeveloperTask] = Field(default_factory=list)
    total_hours_low: float = 0.0
    total_hours_high: float = 0.0
    total_hours_expected: float = 0.0
    built_in_savings_usd: float = 0.0
    diff_items: List[ScopeItemDiff] = Field(default_factory=list)
    proposal_markdown: str = ""
    status: Literal["draft", "human_approved"] = "draft"
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None

class SOWGenerateRequest(BaseModel):
    transcript_text: str
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    meeting_name: Optional[str] = "Discovery Meeting"

class SOWDiffRequest(BaseModel):
    base_sow_id: str
    new_transcript_text: str
    meeting_name: Optional[str] = "Follow-Up Meeting"
