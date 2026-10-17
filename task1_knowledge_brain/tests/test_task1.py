import sys
import os
sys.path.insert(0, os.path.abspath("."))
import asyncio
from task1_knowledge_brain.app.vector_store import VectorStore
from task1_knowledge_brain.app.escalation_manager import EscalationManager
from task1_knowledge_brain.app.rag_engine import RAGEngine
from task1_knowledge_brain.app.models import ChatRequest, Article, ImageMetadata

def test_vector_search():
    store = VectorStore()
    assert store.get_article_count() > 0, "Vector store should have articles loaded"
    
    # Query for member import
    results = store.search("how to import members via CSV", top_k=3)
    assert len(results) > 0, "Should find results for member import"
    assert any("import" in r.title.lower() for r in results), "Top result should mention import"
    assert results[0].score > 0.3, "Confidence score should be reasonable"

def test_rag_and_escalation():
    store = VectorStore()
    esc_manager = EscalationManager(store)
    rag = RAGEngine(store, esc_manager)
    
    res_unknown = None
    try:
        # 1. Test answerable question
        req = ChatRequest(question="How do I import members into Brilliant Directories using a CSV?")
        res = asyncio.run(rag.answer_question(req))
        assert res.confidence_score >= 0.4
        assert len(res.sources) > 0
        assert not res.escalated

        # 2. Test unknown question triggers escalation
        req_unknown = ChatRequest(question="What is the internal quantum entanglement protocol for orbital satellite sync?")
        res_unknown = asyncio.run(rag.answer_question(req_unknown))
        assert res_unknown.escalated is True
        assert res_unknown.escalation_id is not None
        
        # 3. Test resolving escalation flows into memory
        resolved = esc_manager.resolve_escalation(
            escalation_id=res_unknown.escalation_id,
            expert_answer="The system uses standard HTTPS REST webhooks, not orbital quantum entanglement.",
            expert_name="Lead Engineer Sarah"
        )
        assert resolved.status == "resolved"
        
        # Verify it now appears in search!
        res_search = store.search("quantum entanglement orbital satellite")
        assert len(res_search) > 0
        assert any("Lead Engineer Sarah" in r.snippet or "quantum" in r.title.lower() for r in res_search)
    finally:
        if res_unknown and res_unknown.escalation_id:
            store.delete_article(f"expert_{res_unknown.escalation_id}")

def test_article_deletion_stops_appearing():
    store = VectorStore()
    dummy_article = Article(
        id="dummy_test_article_999",
        url="https://support.brilliantdirectories.com/support/dummy-test",
        title="SuperUniqueSecretWidgetConfiguration999",
        category="Test",
        folder="Unit",
        content="This contains a very specific secret token: XYZ_ALPHA_BETA_999."
    )
    store.index_article(dummy_article)
    
    # Search finds it
    assert len(store.search("SuperUniqueSecretWidgetConfiguration999")) > 0
    
    # Delete it
    store.delete_article("dummy_test_article_999")
    
    # Must stop appearing!
    results = store.search("SuperUniqueSecretWidgetConfiguration999")
    assert len(results) == 0, "Deleted article must stop appearing in answers"

if __name__ == "__main__":
    print("Running Task 1 tests...")
    test_vector_search()
    print("PASS: Vector Search")
    test_rag_and_escalation()
    print("PASS: RAG & Escalation Flowback")
    test_article_deletion_stops_appearing()
    print("PASS: Article Deletion & Removal")
    print("ALL TASK 1 TESTS PASSED!")
