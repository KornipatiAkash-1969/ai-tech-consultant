import sys
import os
from pathlib import Path
sys.path.insert(0, os.path.abspath("."))
import asyncio

from task3_meeting_sow.app.orchestrator import MultiAgentSOWOrchestrator
from task3_meeting_sow.app.models import SOWGenerateRequest, SOWDiffRequest

def test_meeting_sow_pipeline():
    print("--- RUNNING TASK 3 MULTI-AGENT SOW TESTS ---")
    orchestrator = MultiAgentSOWOrchestrator()
    data_dir = Path(__file__).resolve().parent.parent / "data"

    # Load Meeting 1
    m1_path = data_dir / "meeting_1_discovery.txt"
    assert m1_path.exists(), "Meeting 1 transcript must exist"
    m1_text = m1_path.read_text(encoding="utf-8")

    # 1. Generate SOW from Meeting 1
    req1 = SOWGenerateRequest(
        transcript_text=m1_text,
        client_name="Metro Doctors Directory",
        project_name="Specialist Directory & Telehealth Onboarding",
        meeting_name="Meeting 1: Discovery"
    )
    sow1 = asyncio.run(orchestrator.generate_from_transcript(req1))
    
    assert sow1.id.startswith("sow_")
    assert len(sow1.requirements) >= 4, "Should extract core requirements"
    assert len(sow1.consultant_questions) >= 3, "Senior consultant should ask clarifying questions"
    assert sow1.built_in_savings_usd >= 4000.0, "Should showcase significant native platform savings"
    assert sow1.total_hours_expected > 0.0
    assert "Executive Summary" in sow1.proposal_markdown
    assert "Platform Architecture" in sow1.proposal_markdown
    print(f"PASS: Meeting 1 SOW generated. Expected hours: {sow1.total_hours_expected}h, Built-in Savings: ${sow1.built_in_savings_usd:,.2f}")

    # 2. Scope Diff with Meeting 2 (Scope Change & Creep)
    m2_path = data_dir / "meeting_2_scope_change.txt"
    assert m2_path.exists(), "Meeting 2 transcript must exist"
    m2_text = m2_path.read_text(encoding="utf-8")

    req2 = SOWDiffRequest(
        base_sow_id=sow1.id,
        new_transcript_text=m2_text,
        meeting_name="Meeting 2: Scope Revision"
    )
    diff_sow = asyncio.run(orchestrator.generate_diff_sow(req2))

    assert len(diff_sow.diff_items) > 0, "Should detect diff items"
    
    # Check for MODIFIED items
    modified = [d for d in diff_sow.diff_items if d.status == "MODIFIED"]
    assert len(modified) >= 1, "Should identify modified requirements (e.g. polygon map)"

    # Check for OUT_OF_SCOPE_CREEP (Twilio SMS)
    creep = [d for d in diff_sow.diff_items if d.status == "OUT_OF_SCOPE_CREEP"]
    assert len(creep) >= 1, "Should catch out-of-scope creep (Twilio SMS)"
    assert any("twilio" in d.title.lower() or "sms" in d.title.lower() for d in creep)

    print(f"PASS: Meeting 2 Diff. Detected {len(modified)} modified specs and {len(creep)} scope creep items!")

    # 3. Human Approval Gate
    assert diff_sow.status == "draft"
    approved = orchestrator.approve_sow(diff_sow.id, approver_name="Alex Rivera, Senior Partner")
    assert approved.status == "human_approved"
    assert approved.approved_by == "Alex Rivera, Senior Partner"
    assert "APPROVED BY" in approved.proposal_markdown
    print("PASS: Human Consultant Sign-Off Protocol")

    print("--- ALL TASK 3 TESTS PASSED! ---")

if __name__ == "__main__":
    test_meeting_sow_pipeline()
