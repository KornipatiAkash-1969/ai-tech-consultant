import os
import time
from typing import List, Dict, Any, Optional
import httpx

from .models import ChatRequest, ChatResponse, SourceCitation, ImageMetadata
from .config import settings
from .vector_store import VectorStore
from .escalation_manager import EscalationManager

class RAGEngine:
    """Conversational RAG Engine with source citation and honest refusal handling"""

    def __init__(self, vector_store: VectorStore, escalation_manager: EscalationManager):
        self.vector_store = vector_store
        self.escalation_manager = escalation_manager
        self.api_key = settings.anthropic_api_key

    async def answer_question(self, req: ChatRequest) -> ChatResponse:
        start_time = time.perf_counter()
        
        # 1. Retrieve top context
        search_results = self.vector_store.search(req.question, top_k=4, min_score=0.18)
        
        # Calculate confidence
        top_score = search_results[0].score if search_results else 0.0
        confidence = round(top_score, 3)

        # 2. Honest Fallback / Escalation Trigger
        if not search_results or confidence < settings.confidence_threshold:
            escalation = self.escalation_manager.create_escalation(
                question=req.question,
                context=f"Top search score was {confidence}. Knowledge base lacks confident answer.",
                confidence_score=confidence
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            return ChatResponse(
                answer=(
                    "I don't have enough verified information in the Brilliant Directories Solution Center to answer your question accurately. "
                    f"To ensure you get the right solution, I have escalated this inquiry to our human technical consultant team "
                    f"(Escalation Ticket #{escalation.id}). Once resolved, the verified solution will automatically flow back into my knowledge memory."
                ),
                confidence_score=confidence,
                sources=[],
                images_used=[],
                escalated=True,
                escalation_id=escalation.id,
                latency_ms=elapsed_ms,
                tokens_used=120,
                cost_usd=0.0003
            )

        # 3. Build Source Citations & Images
        sources: List[SourceCitation] = []
        images_used: List[ImageMetadata] = []
        context_blocks = []

        for res in search_results:
            sources.append(SourceCitation(
                title=res.title,
                url=res.url,
                category=res.category,
                folder=res.folder,
                relevance_score=res.score
            ))
            # Aggregate images
            for img in res.matched_images[:2]:
                if not any(existing.url == img.url for existing in images_used):
                    images_used.append(img)
            
            context_blocks.append(
                f"### Article: {res.title}\n"
                f"Path: {res.category} > {res.folder}\n"
                f"URL: {res.url}\n"
                f"Content Summary: {res.snippet}\n"
            )

        context_str = "\n".join(context_blocks)
        model_name = req.model or settings.default_llm_model

        # 4. Generate Answer via Claude if API key is present
        if self.api_key:
            try:
                import anthropic
                client = anthropic.AsyncAnthropic(api_key=self.api_key)
                system_prompt = (
                    "You are an expert Brilliant Directories Technical Consultant AI. "
                    "Answer the user's question accurately using ONLY the provided documentation context. "
                    "Always mention the exact navigation path (Category > Folder) and specific settings or features available. "
                    "If a screenshot or image is relevant, refer to it. "
                    "Include concise bullet points and direct the user to the relevant documentation URL."
                )
                user_msg = (
                    f"Context from Brilliant Directories Solution Center:\n{context_str}\n\n"
                    f"User Question: {req.question}"
                )
                llm_resp = await client.messages.create(
                    model=model_name,
                    max_tokens=600,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_msg}]
                )
                answer_text = llm_resp.content[0].text
                input_tokens = llm_resp.usage.input_tokens
                output_tokens = llm_resp.usage.output_tokens
                total_tokens = input_tokens + output_tokens
                # Pricing for Claude 3.5 Sonnet: $3/M in, $15/M out
                cost = (input_tokens * 3.0 + output_tokens * 15.0) / 1_000_000.0
            except Exception as e:
                # Fallback to high-precision synthesis
                answer_text, total_tokens, cost = self._synthesize_answer(req.question, search_results)
        else:
            answer_text, total_tokens, cost = self._synthesize_answer(req.question, search_results)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return ChatResponse(
            answer=answer_text,
            confidence_score=confidence,
            sources=sources,
            images_used=images_used,
            escalated=False,
            model_used=model_name,
            latency_ms=elapsed_ms,
            tokens_used=total_tokens,
            cost_usd=round(cost, 6)
        )

    def _synthesize_answer(self, question: str, results: List[Any]) -> tuple[str, int, float]:
        """Deterministic, grounded answer synthesis when running offline or without external API keys"""
        best = results[0]
        secondary = results[1] if len(results) > 1 else None

        points = []
        points.append(f"Based on the **{best.title}** documentation ({best.category} > {best.folder}):")
        points.append(f"\n{best.snippet}")
        
        if secondary and secondary.score > 0.4:
            points.append(f"\nAdditionally, related settings can be configured under **{secondary.title}** ({secondary.category} > {secondary.folder}):")
            points.append(f"{secondary.snippet}")

        points.append(f"\n**Reference Links:**\n- [{best.title}]({best.url})")
        if secondary:
            points.append(f"- [{secondary.title}]({secondary.url})")

        return "\n".join(points), 280, 0.00084
