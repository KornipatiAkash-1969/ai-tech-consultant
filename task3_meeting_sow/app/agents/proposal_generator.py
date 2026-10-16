from typing import List
from ..models import ScopeOfWork, ClientRequirement, DeveloperTask, ConsultantQuestion, ScopeItemDiff

class ProposalGeneratorAgent:
    """Agent 5: Generates client-ready proposal, Scope of Work, and itemized fee breakdown"""

    def generate_proposal_markdown(
        self,
        client_name: str,
        project_name: str,
        meeting_name: str,
        requirements: List[ClientRequirement],
        tasks: List[DeveloperTask],
        questions: List[ConsultantQuestion],
        diff_items: List[ScopeItemDiff],
        hours_low: float,
        hours_high: float,
        hours_expected: float,
        savings_usd: float
    ) -> str:
        rate_per_hour = 125.0
        est_min_cost = round(hours_low * rate_per_hour, 2)
        est_max_cost = round(hours_high * rate_per_hour, 2)
        est_exp_cost = round(hours_expected * rate_per_hour, 2)

        md = []
        md.append(f"# Technical Scope of Work & Implementation Proposal")
        md.append(f"**Client:** {client_name}  ")
        md.append(f"**Project:** {project_name}  ")
        md.append(f"**Meeting Session:** {meeting_name}  ")
        md.append(f"**Consulting Agency:** BusinessLabs Applied AI Practice  ")
        md.append(f"Status: Human Consultant Review Pending  ")
        md.append("\n---\n")

        # 1. Executive Summary
        md.append("## 1. Executive Summary")
        md.append(
            f"BusinessLabs has developed this technical Scope of Work (SOW) for **{client_name}** to deliver "
            f"a modern, high-performance directory solution. By maximizing **native Brilliant Directories platform capabilities**, "
            f"we have reduced unnecessary custom development, delivering **${savings_usd:,.2f} in immediate cost savings** "
            f"while ensuring a faster time to market."
        )
        md.append("")

        # 2. Built-in vs Custom Architecture
        md.append("## 2. Platform Architecture: Built-in Settings vs Custom Engineering")
        md.append("| Requirement | Solution Approach | Platform Setting / Path | Dev Hours | Client Savings |")
        md.append("| :--- | :--- | :--- | :---: | :---: |")
        for req in requirements:
            approach_badge = {
                "built_in_setting": "🟢 Native Setting",
                "hybrid_tweak": "🟡 Hybrid UI Tweak",
                "custom_code": "🔴 Custom Code"
            }.get(req.solution_type, "Custom")
            
            savings_txt = f"${req.cost_savings_usd:,.0f}" if req.cost_savings_usd > 0 else "$0"
            md.append(f"| **{req.title}** | {approach_badge} | {req.bd_feature_ref or 'Custom Module'} | {req.estimated_hours}h | {savings_txt} |")
        md.append("")
        md.append(f"> **Total Client Capital Preserved via Native Features:** ${savings_usd:,.2f}")
        md.append("")

        # 3. Scope Diff & Change Order (if present)
        if diff_items:
            md.append("## 3. Scope Delta & Change Order Analysis")
            md.append("Comparing latest meeting specifications against baseline agreement:")
            md.append("")
            md.append("| Feature | Status | Previous Scope | Revised Scope | Extra Hours | Impact |")
            md.append("| :--- | :---: | :--- | :--- | :---: | :--- |")
            for diff in diff_items:
                badge = {
                    "UNCHANGED": "⚪ Unchanged",
                    "MODIFIED": "🟡 Modified",
                    "NEW_IN_SCOPE": "🔵 New In-Scope",
                    "OUT_OF_SCOPE_CREEP": "🚨 Scope Creep (Extra)"
                }.get(diff.status, diff.status)
                
                extra_str = f"+{diff.extra_hours}h" if diff.extra_hours > 0 else "0h"
                md.append(f"| **{diff.title}** | {badge} | {diff.previous_spec or 'N/A'} | {diff.new_spec} | {extra_str} | {diff.rationale} |")
            md.append("")

        # 4. Itemized Developer Tasks
        md.append("## 4. Itemized Developer Work Breakdown")
        md.append("| Task ID | Domain | Work Description | Est. Hours |")
        md.append("| :---: | :---: | :--- | :---: |")
        for t in tasks:
            domain_emoji = {"frontend": "🎨 FE", "backend": "⚙️ BE", "database": "💾 DB", "integration": "🔌 INT", "qa": "🧪 QA"}.get(t.domain, t.domain)
            md.append(f"| `{t.id}` | {domain_emoji} | **{t.title}**: {t.description} | {t.hours}h |")
        md.append("")

        # 5. Clarifying Questions from Senior Consultant
        if questions:
            md.append("## 5. Senior Consultant Clarification Inquiries")
            md.append("The following technical questions require client alignment prior to engineering kickoff:")
            for q in questions:
                md.append(f"- **{q.topic}**: {q.question}")
                md.append(f"  *Rationale:* {q.rationale} (*Estimate impact: {q.impact_on_estimate}*)")
            md.append("")

        # 6. Investment & Delivery Estimate
        md.append("## 6. Budget & Timeline Summary")
        md.append(f"- **Total Estimated Developer Hours:** {hours_low}h (Low) to {hours_high}h (High) | **Expected: {hours_expected} hours**")
        md.append(f"- **Blended Engineering Rate:** ${rate_per_hour:,.2f} / hour")
        md.append(f"- **Total Estimated Project Cost:** ${est_min_cost:,.2f} - ${est_max_cost:,.2f} USD (**Expected: ${est_exp_cost:,.2f} USD**)")
        md.append(f"- **Target Delivery Timeline:** 2 to 3 Calendar Weeks from sign-off")
        md.append("\n---\n")

        # 7. Human Review & Approval Block
        md.append("## 7. Quality Assurance & Consultant Approval")
        md.append("> **Governance Protocol:** Nothing reaches the client until formally approved by a Senior Technical Consultant.")
        md.append("- [ ] Technical Architecture Checked against Brilliant Directories Standards")
        md.append("- [ ] Hour Estimates Verified by Lead Developer")
        md.append("- [ ] Scope Boundary & Change Orders Audited")
        md.append("\n**Approved By:** ___________________________  **Date:** _______________")

        return "\n".join(md)
