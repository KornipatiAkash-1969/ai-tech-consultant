import os
import httpx
from typing import List, Dict, Any, Optional

class Task1Client:
    """HTTP Client for Task 1 Knowledge Brain API"""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or os.getenv("TASK1_API_URL", "http://localhost:8001")).rstrip("/")
        self.timeout = 1.5

    async def search(self, query: str, top_k: int = 3, category: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/search",
                    json={"query": query, "top_k": top_k, "category": category, "min_score": 0.20}
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            print(f"[Task3 -> Task1Client] Search failed ({e}). Proceeding with heuristic fallback.")
        return []

    async def chat(self, question: str) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/chat",
                    json={"question": question}
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            print(f"[Task3 -> Task1Client] Chat query failed: {e}")
        return None

    async def is_healthy(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.base_url}/health")
                return resp.status_code == 200
        except Exception:
            return False
