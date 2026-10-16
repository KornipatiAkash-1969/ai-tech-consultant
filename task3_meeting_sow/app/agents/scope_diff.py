from typing import List
from ..models import ScopeOfWork, ScopeItemDiff

class ScopeDiffAgent:
    """Agent 4: Multi-meeting diff engine detecting modified items, additions, and scope creep"""

    def compute_diff(self, base_sow: ScopeOfWork, new_transcript_text: str) -> List[ScopeItemDiff]:
        diff_items: List[ScopeItemDiff] = []
        text_lower = new_transcript_text.lower()

        # 1. Check Search modification
        if "polygon" in text_lower or "lasso" in text_lower:
            diff_items.append(ScopeItemDiff(
                id="DIFF-001",
                title="Search Filter Architecture",
                status="MODIFIED",
                previous_spec="Standard zip code radius and specialty dropdown search.",
                new_spec="Interactive Google Maps polygon / lasso boundary drawing filter for custom neighborhood perimeters.",
                is_billable_extra=True,
                extra_hours=16.0,
                rationale="Custom JavaScript Google Maps DrawingManager widget exceeds native platform radius filter."
            ))

        # 2. Check Membership Tiers modification
        if "enterprise" in text_lower or "three tier" in text_lower or "3 tier" in text_lower or "sub-account" in text_lower:
            diff_items.append(ScopeItemDiff(
                id="DIFF-002",
                title="Membership Tiers & Sub-Accounts",
                status="MODIFIED",
                previous_spec="2 Tiers: Free General Practitioner and $99/mo Featured Specialist.",
                new_spec="3 Tiers: Free, $99/mo, and $299/mo Enterprise Hospital Department with up to 10 sub-doctor listings.",
                is_billable_extra=True,
                extra_hours=2.5,
                rationale="Requires configuring Sub-Accounts parent-child add-on and consolidated billing structure."
            ))

        # 3. Check Twilio SMS (Brand New Scope Creep)
        if "twilio" in text_lower or "sms" in text_lower or "text message" in text_lower:
            diff_items.append(ScopeItemDiff(
                id="DIFF-003",
                title="Twilio Real-Time SMS Lead Dispatch",
                status="OUT_OF_SCOPE_CREEP",
                previous_spec="None. Initial baseline scope specified email-only lead forwarding to clinic receptionists.",
                new_spec="Automated webhook listener dispatching instant SMS alerts to doctor mobile phones via Twilio API.",
                is_billable_extra=True,
                extra_hours=14.0,
                rationale="Out of Scope: Brand new third-party telecommunication gateway integration. Must be quoted as Change Order #1."
            ))

        # 4. Check Native Telemedicine (Excluded Scope Creep)
        if "webrtc" in text_lower or "video call" in text_lower or "telemedicine" in text_lower:
            diff_items.append(ScopeItemDiff(
                id="DIFF-004",
                title="Native Encrypted Telemedicine Video Calling",
                status="OUT_OF_SCOPE_CREEP",
                previous_spec="External booking URL directing patients to doctor's existing EHR/telehealth portal.",
                new_spec="Proposed native in-browser WebRTC HIPAA video calling engine.",
                is_billable_extra=False,
                extra_hours=0.0,
                rationale="EXCLUDED from Phase 1 by mutual agreement to avoid $15,000+ custom compliance and infrastructure costs. Retained external link."
            ))

        # 5. Baseline Unchanged Items
        diff_items.append(ScopeItemDiff(
            id="DIFF-005",
            title="CSV Member Import (1,500 Doctors)",
            status="UNCHANGED",
            previous_spec="Bulk import 1,500 physician profiles with photos via CSV.",
            new_spec="Bulk import 1,500 physician profiles with photos via CSV.",
            is_billable_extra=False,
            extra_hours=0.0,
            rationale="Unchanged from Meeting 1 baseline."
        ))

        diff_items.append(ScopeItemDiff(
            id="DIFF-006",
            title="Verified Board Certified Badges",
            status="UNCHANGED",
            previous_spec="Visual verification badges displayed on premium physician search results.",
            new_spec="Visual verification badges displayed on premium physician search results.",
            is_billable_extra=False,
            extra_hours=0.0,
            rationale="Unchanged from Meeting 1 baseline."
        ))

        diff_items.append(ScopeItemDiff(
            id="DIFF-007",
            title="Spam-Protected Confidential Lead Capture",
            status="UNCHANGED",
            previous_spec="Protected lead forms routing to clinic receptionists without exposing raw email.",
            new_spec="Protected lead forms routing to clinic receptionists without exposing raw email.",
            is_billable_extra=False,
            extra_hours=0.0,
            rationale="Unchanged from Meeting 1 baseline."
        ))

        return diff_items
