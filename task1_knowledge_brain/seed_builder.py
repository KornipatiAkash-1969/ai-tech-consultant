import os
import sys
import json
import asyncio
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from task1_knowledge_brain.app.crawler import PoliteCrawler
from task1_knowledge_brain.app.models import Article, ImageMetadata
from task1_knowledge_brain.app.config import settings

async def build_seed_dataset():
    print("[Seed Builder] Initializing polite crawler for Brilliant Directories Solution Center...")
    crawler = PoliteCrawler()
    
    # 1. Fetch URLs from sitemap
    print("[Seed Builder] Fetching sitemap from support.brilliantdirectories.com...")
    sitemap_entries = await crawler.fetch_sitemap_urls()
    print(f"[Seed Builder] Found {len(sitemap_entries)} total solution articles in sitemap.")
    
    # Select diverse articles covering essential business areas:
    # Payments, Settings, Members, Emails, Design, Forms, Add-ons
    keywords = [
        "payment", "stripe", "refund", "paypal", "currency",
        "settings", "social-media", "google-map", "domain",
        "member", "signup", "search", "lead", "badge",
        "email", "campaign", "forwarder", "smtp",
        "design", "widget", "menu", "css",
        "form", "webhook", "zapier",
        "claim", "coupon", "add-on"
    ]
    
    selected_urls = []
    seen = set()
    
    for url, mod in sitemap_entries:
        lower_url = url.lower()
        for kw in keywords:
            if kw in lower_url and url not in seen:
                selected_urls.append(url)
                seen.add(url)
                break
        if len(selected_urls) >= 25:
            break
            
    print(f"[Seed Builder] Selected {len(selected_urls)} high-impact articles across core topics.")
    
    # Register with crawler checkpoint
    crawler.register_urls(selected_urls)
    
    print("[Seed Builder] Scraping articles politely with screenshot analysis...")
    articles = await crawler.batch_crawl(max_articles=len(selected_urls))
    
    print(f"[Seed Builder] Successfully scraped {len(articles)} articles!")
    
    # Save to seed_articles.json
    output_path = settings.seed_data_path
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([art.model_dump() for art in articles], f, indent=2)
        
    print(f"[Seed Builder] Seed data saved to {output_path} ({len(articles)} articles).")

if __name__ == "__main__":
    asyncio.run(build_seed_dataset())
