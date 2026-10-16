import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    app_name: str = "AI Tech Consultant - Knowledge Brain"
    environment: str = "development"
    port: int = 8001
    host: str = "0.0.0.0"
    
    # Sitemap & Crawler settings
    sitemap_url: str = "https://support.brilliantdirectories.com/support/sitemap.xml"
    user_agent: str = "AITechConsultantBot/1.0 (Polite Help Center Indexer; +https://businesslabs.ai)"
    crawl_rate_limit: float = 1.0  # seconds between requests (polite)
    max_concurrent_requests: int = 2
    max_seed_articles: int = 150
    
    # LLM Settings
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    default_llm_model: str = "claude-3-5-sonnet-20241022"
    fast_llm_model: str = "claude-3-5-haiku-20241022"
    confidence_threshold: float = 0.40
    
    # Storage paths
    checkpoint_db_path: str = str(DATA_DIR / "crawler_checkpoint.db")
    seed_data_path: str = str(DATA_DIR / "seed_articles.json")
    chroma_persist_dir: str = str(DATA_DIR / "chroma_db")
    escalations_db_path: str = str(DATA_DIR / "escalations.json")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
