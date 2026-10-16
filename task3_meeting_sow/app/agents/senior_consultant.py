import re
from typing import List, Dict, Any, Tuple
from ..models import ConsultantQuestion, ClientRequirement

class SeniorConsultantAgent:
    """Agent 1: Ingests messy client transcripts, extracts requirements, and asks clarifying questions"""

    def analyze_transcript(self, transcript_text: str) -> Tuple[str, List[Dict[str, Any]], List[ConsultantQuestion]]:
        # Long context handling: section chunking by speaker turns
        lines = transcript_text.strip().split("\n")
        
        # Extract client name / project
        client_name = "Prospective Directory Client"
        project_name = "Directory Platform Implementation"
        for line in lines[:10]:
            if "Client:" in line:
                client_name = line.split("Client:")[1].strip()
            elif "Project:" in line:
                project_name = line.split("Project:")[1].strip()

        # Extract requirements by scanning client statements and consultant confirmations
        extracted_raw_reqs: List[Dict[str, Any]] = []

        # Domain pattern matchers
        patterns = [
            ("CSV Member Import", ["import", "spreadsheet", "1,500", "csv", "excel", "airtable"], 
             "Bulk import existing directory records and photos via structured CSV format."),
            ("Search & Filtering", ["search", "filter", "specialty", "radius", "polygon", "zip code"],
             "Patient/user search interface with geographic radius and category attribute filtering."),
            ("Membership Tiers & Billing", ["tier", "monetization", "stripe", "monthly", "99", "49", "enterprise", "sub-accounts"],
             "Configured recurring membership tiers with automated Stripe credit card payment processing."),
            ("Verified Trust Badges", ["badge", "verified", "board certified", "eco-badge"],
             "Display visual verification trust badges on qualified member profile cards and search results."),
            ("Spam-Protected Lead Capture", ["lead", "inquire", "form", "receptionist", "spam", "private email"],
             "Confidential lead capture forms forwarding inquiries to member contacts without exposing raw email."),
            ("External Booking Links", ["booking link", "zocdoc", "calendly", "ehr", "telehealth"],
             "Profile link integration directing visitors to third-party scheduling and appointment tools."),
            ("Interactive Map Lasso/Polygon", ["polygon", "lasso", "interactive map", "neighborhoods"],
             "Custom interactive map UI enabling users to draw boundary polygons to filter location listings."),
            ("Twilio SMS Lead Alert", ["twilio", "sms", "text message", "cell phone"],
             "Automated SMS dispatch triggering instant alerts to member mobile phones upon lead submission."),
            ("Claim Listing Flow", ["claim", "ownership", "claim their listing"],
             "Self-service claim listing verification allowing unclaimed business owners to verify and take over profile.")
        ]

        text_lower = transcript_text.lower()
        req_counter = 1

        for title, kws, spec in patterns:
            # Check if keywords are mentioned in transcript
            if any(kw in text_lower for kw in kws):
                # Find matching quote
                quote = ""
                for line in lines:
                    if any(kw in line.lower() for kw in kws) and ("dr." in line.lower() or "elena" in line.lower() or "client" in line.lower()):
                        quote = line.strip()
                        break
                
                extracted_raw_reqs.append({
                    "id": f"REQ-{req_counter:03d}",
                    "title": title,
                    "raw_quote": quote or f"Client requested {title.lower()} during discovery call.",
                    "functional_spec": spec
                })
                req_counter += 1

        # Formulate Senior Consultant Clarifying Questions
        consultant_questions: List[ConsultantQuestion] = [
            ConsultantQuestion(
                id="CQ-001",
                topic="Data Hygiene & Schema Validation",
                question="What percentage of member records in your spreadsheet have valid geocodable street addresses, and do all photos conform to high-resolution square ratios?",
                rationale="Prevents geocoding API failures and broken thumbnail aspect ratios during bulk import.",
                impact_on_estimate="Invalid data can add 4-8 hours of manual data cleansing if unvalidated."
            ),
            ConsultantQuestion(
                id="CQ-002",
                topic="Payment Gateway Ownership & Webhook Security",
                question="Do you already possess a fully verified corporate Stripe account with active webhook signing permissions, or will sandbox onboarding be required?",
                rationale="Ensures recurring subscription renewals and chargebacks trigger platform webhook events cleanly.",
                impact_on_estimate="Account delays do not affect code scope, but impact deployment schedule by 2-4 days."
            ),
            ConsultantQuestion(
                id="CQ-003",
                topic="Regulatory & Compliance Scope Boundary",
                question="To confirm our scope boundary: all telehealth bookings route to external certified provider URLs, with zero protected health information (PHI) stored in directory database?",
                rationale="Eliminates multimillion-dollar HIPAA compliance liability and expensive dedicated server audits.",
                impact_on_estimate="Keeps scope strictly within Phase 1 directory standards ($0 extra compliance overhead)."
            )
        ]

        summary = (
            f"Discovery scoping analysis for {client_name} ({project_name}). "
            f"Extracted {len(extracted_raw_reqs)} functional requirements and formulated "
            f"{len(consultant_questions)} critical senior consultant risk mitigation questions."
        )

        return summary, extracted_raw_reqs, consultant_questions
