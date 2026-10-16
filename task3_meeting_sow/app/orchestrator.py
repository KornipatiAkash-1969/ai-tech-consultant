import uuid
from typing import Dict, Optional, List
from datetime import datetime

from .models import ScopeOfWork, SOWGenerateRequest, SOWDiffRequest
from .task1_client import Task1Client
from .agents.senior_consultant import SeniorConsultantAgent
from .agents.feature_matcher import FeatureMatcherAgent
from .agents.developer_estimator import DeveloperEstimatorAgent
from .agents.scope_diff import ScopeDiffAgent
from .agents.proposal_generator import ProposalGeneratorAgent

class MultiAgentSOWOrchestrator:
    """Orchestrates the 5 specialized AI agents to generate SOWs, task lists, and proposals"""

    def __init__(self, task1_client: Optional[Task1Client] = None):
        self.task1_client = task1_client or Task1Client()
        self.senior_consultant = SeniorConsultantAgent()
        self.feature_matcher = FeatureMatcherAgent(self.task1_client)
        self.developer_estimator = DeveloperEstimatorAgent()
        self.scope_diff_agent = ScopeDiffAgent()
        self.proposal_generator = ProposalGeneratorAgent()
        self.sow_store: Dict[str, ScopeOfWork] = {}

    async def generate_from_transcript(self, req: SOWGenerateRequest) -> ScopeOfWork:
        sow_id = f"sow_{uuid.uuid4().hex[:8]}"

        # Step 1: Senior Consultant Agent
        summary, raw_reqs, questions = self.senior_consultant.analyze_transcript(req.transcript_text)

        # Step 2: Feature Matcher Agent (Queries Task 1 Knowledge Brain)
        evaluated_reqs = await self.feature_matcher.evaluate_requirements(raw_reqs)

        # Step 3: Developer Estimator Agent
        tasks, low_hrs, high_hrs, exp_hrs, savings = self.developer_estimator.generate_task_breakdown(evaluated_reqs)

        client_name = req.client_name or "Metro Doctors Directory"
        project_name = req.project_name or "Medical Specialist Directory"

        # Step 4: Proposal Generator Agent
        proposal_md = self.proposal_generator.generate_proposal_markdown(
            client_name=client_name,
            project_name=project_name,
            meeting_name=req.meeting_name or "Discovery Call",
            requirements=evaluated_reqs,
            tasks=tasks,
            questions=questions,
            diff_items=[],
            hours_low=low_hrs,
            hours_high=high_hrs,
            hours_expected=exp_hrs,
            savings_usd=savings
        )

        sow = ScopeOfWork(
            id=sow_id,
            client_name=client_name,
            project_name=project_name,
            meeting_source=req.meeting_name or "Discovery Call",
            executive_summary=summary,
            consultant_questions=questions,
            requirements=evaluated_reqs,
            developer_tasks=tasks,
            total_hours_low=low_hrs,
            total_hours_high=high_hrs,
            total_hours_expected=exp_hrs,
            built_in_savings_usd=savings,
            diff_items=[],
            proposal_markdown=proposal_md,
            status="draft"
        )

        self.sow_store[sow_id] = sow
        return sow

    async def generate_diff_sow(self, req: SOWDiffRequest) -> ScopeOfWork:
        base_sow = self.sow_store.get(req.base_sow_id)
        if not base_sow:
            # Create a synthetic baseline if testing directly
            dummy_base = SOWGenerateRequest(
                transcript_text="Dr. Marcus Vance requested specialty search, 1500 doctor CSV import, 2 tiers ($99/mo Stripe), verified badges, and lead forms.",
                client_name="Metro Doctors Directory",
                project_name="Medical Specialist Directory"
            )
            base_sow = await self.generate_from_transcript(dummy_base)

        # Step 1: Senior Consultant Agent
        summary, raw_reqs, questions = self.senior_consultant.analyze_transcript(req.new_transcript_text)

        # Step 2: Feature Matcher Agent
        evaluated_reqs = await self.feature_matcher.evaluate_requirements(raw_reqs)

        # Step 3: Developer Estimator Agent
        tasks, low_hrs, high_hrs, exp_hrs, savings = self.developer_estimator.generate_task_breakdown(evaluated_reqs)

        # Step 4: Scope Diff & Creep Detector Agent
        diff_items = self.scope_diff_agent.compute_diff(base_sow, req.new_transcript_text)

        # Recalculate hours including extra scope items
        extra_billable_hours = sum(d.extra_hours for d in diff_items if d.is_billable_extra)
        revised_low = round(low_hrs + extra_billable_hours * 0.85, 1)
        revised_high = round(high_hrs + extra_billable_hours * 1.30, 1)
        revised_exp = round(exp_hrs + extra_billable_hours, 1)

        # Step 5: Proposal Generator Agent
        proposal_md = self.proposal_generator.generate_proposal_markdown(
            client_name=base_sow.client_name,
            project_name=base_sow.project_name,
            meeting_name=req.meeting_name or "Meeting 2 (Scope Change)",
            requirements=evaluated_reqs,
            tasks=tasks,
            questions=questions,
            diff_items=diff_items,
            hours_low=revised_low,
            hours_high=revised_high,
            hours_expected=revised_exp,
            savings_usd=savings
        )

        sow_id = f"sow_diff_{uuid.uuid4().hex[:6]}"
        diff_sow = ScopeOfWork(
            id=sow_id,
            client_name=base_sow.client_name,
            project_name=base_sow.project_name,
            meeting_source=req.meeting_name or "Follow-Up Meeting 2",
            executive_summary=f"Scope revision update for {base_sow.client_name}. Flagged {len(diff_items)} scope deltas including change orders.",
            consultant_questions=questions,
            requirements=evaluated_reqs,
            developer_tasks=tasks,
            total_hours_low=revised_low,
            total_hours_high=revised_high,
            total_hours_expected=revised_exp,
            built_in_savings_usd=savings,
            diff_items=diff_items,
            proposal_markdown=proposal_md,
            status="draft"
        )

        self.sow_store[sow_id] = diff_sow
        return diff_sow

    def approve_sow(self, sow_id: str, approver_name: str = "Senior Technical Consultant") -> Optional[ScopeOfWork]:
        sow = self.sow_store.get(sow_id)
        if not sow:
            return None
        sow.status = "human_approved"
        sow.approved_by = approver_name
        sow.approved_at = datetime.utcnow().isoformat() + "Z"
        # Update proposal markdown header to reflect approval
        sow.proposal_markdown = sow.proposal_markdown.replace(
            "Status: Human Consultant Review Pending",
            f"Status: APPROVED BY {approver_name.upper()} ({sow.approved_at[:10]})"
        )
        return sow

    def get_sow(self, sow_id: str) -> Optional[ScopeOfWork]:
        return self.sow_store.get(sow_id)

    def list_sows(self) -> List[ScopeOfWork]:
        return list(self.sow_store.values())
