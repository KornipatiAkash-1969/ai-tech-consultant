import os
import json
import uuid
from typing import List, Optional, Dict
from datetime import datetime

from .models import Escalation, Article
from .config import settings
from .vector_store import VectorStore

class EscalationManager:
    """Manages human-in-the-loop expert escalations and memory feedback loop"""

    def __init__(self, vector_store: VectorStore, db_path: Optional[str] = None):
        self.vector_store = vector_store
        self.db_path = db_path or settings.escalations_db_path
        self.escalations: Dict[str, Escalation] = {}
        self.load()

    def load(self):
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        esc = Escalation(**item)
                        self.escalations[esc.id] = esc
            except Exception as e:
                print(f"Error loading escalations from {self.db_path}: {e}")

    def save(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump([esc.model_dump() for esc in self.escalations.values()], f, indent=2)

    def create_escalation(self, question: str, context: str = "", confidence_score: float = 0.0) -> Escalation:
        esc_id = f"esc_{uuid.uuid4().hex[:8]}"
        escalation = Escalation(
            id=esc_id,
            question=question,
            context=context,
            confidence_score=round(confidence_score, 3),
            status="pending"
        )
        self.escalations[esc_id] = escalation
        self.save()
        return escalation

    def list_escalations(self, status: Optional[str] = None) -> List[Escalation]:
        items = list(self.escalations.values())
        if status:
            items = [item for item in items if item.status == status]
        return sorted(items, key=lambda x: x.created_at, reverse=True)

    def get_escalation(self, escalation_id: str) -> Optional[Escalation]:
        return self.escalations.get(escalation_id)

    def resolve_escalation(self, escalation_id: str, expert_answer: str, expert_name: str = "Senior Support Specialist", category: str = "Expert Resolution") -> Optional[Escalation]:
        esc = self.escalations.get(escalation_id)
        if not esc:
            return None

        esc.status = "resolved"
        esc.expert_answer = expert_answer
        esc.expert_name = expert_name
        esc.resolved_at = datetime.utcnow().isoformat() + "Z"
        self.save()

        # Feedback loop: expert's answer flows back into Knowledge Brain memory!
        article_id = f"expert_{escalation_id}"
        resolved_article = Article(
            id=article_id,
            url=f"https://support.brilliantdirectories.com/support/expert-resolutions/{escalation_id}",
            title=f"Expert Guide: {esc.question}",
            category=category,
            folder="Expert Knowledge Base",
            content=f"Question: {esc.question}\n\nExpert Verified Solution:\n{expert_answer}\n\nResolved by: {expert_name}",
            markdown=f"# Expert Resolution: {esc.question}\n\n**Verified Solution by {expert_name}:**\n\n{expert_answer}",
            images=[],
            content_hash=uuid.uuid4().hex
        )
        self.vector_store.index_article(resolved_article)
        return esc
