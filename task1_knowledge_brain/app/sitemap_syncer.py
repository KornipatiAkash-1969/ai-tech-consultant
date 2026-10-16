import os
import sqlite3
import logging
from typing import Dict, Any, List
from datetime import datetime

from .config import settings
from .crawler import PoliteCrawler
from .vector_store import VectorStore
from .models import SyncStatus

logger = logging.getLogger("knowledge_brain.syncer")

class SitemapSyncer:
    """Daily Differential Sitemap Synchronizer"""
    
    def __init__(self, crawler: PoliteCrawler, vector_store: VectorStore):
        self.crawler = crawler
        self.vector_store = vector_store
        self.db_path = settings.checkpoint_db_path
        self.last_sync_status: SyncStatus = SyncStatus()

    async def run_differential_sync(self, sitemap_url: str = settings.sitemap_url) -> SyncStatus:
        """Compares sitemap against local index to add, update, and remove articles"""
        self.last_sync_status.is_syncing = True
        self.last_sync_status.message = "Fetching remote sitemap..."
        
        try:
            # 1. Fetch remote sitemap
            sitemap_entries = await self.crawler.fetch_sitemap_urls(sitemap_url)
            remote_url_map = {url: lastmod for url, lastmod in sitemap_entries}
            
            # 2. Get local indexed articles from DB
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT url, status, content_hash FROM crawler_checkpoint")
                local_rows = cursor.fetchall()
            
            local_urls = {row[0]: {"status": row[1], "hash": row[2]} for row in local_rows}
            
            # 3. Detect Added, Updated, Removed
            added_urls = [u for u in remote_url_map.keys() if u not in local_urls]
            
            # For removed: URLs locally recorded as 'scraped' that are no longer in sitemap
            removed_urls = [u for u, data in local_urls.items() if u not in remote_url_map and data["status"] == "scraped"]
            
            # Updated URLs: queue for re-crawl
            updated_urls = []
            for u in remote_url_map.keys():
                if u in local_urls and local_urls[u]["status"] == "scraped":
                    # If lastmod differs or scheduled for update
                    pass

            logger.info(f"Differential sync detected: {len(added_urls)} added, {len(updated_urls)} updated, {len(removed_urls)} removed.")
            
            # 4. Handle REMOVED articles (must stop appearing in answers!)
            removed_count = 0
            for r_url in removed_urls:
                # Find article_id
                article_id = self._get_article_id_by_url(r_url)
                if article_id:
                    self.vector_store.delete_article(article_id)
                # Update checkpoint
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("UPDATE crawler_checkpoint SET status = 'removed' WHERE url = ?", (r_url,))
                    conn.commit()
                removed_count += 1
            
            # 5. Handle ADDED articles
            added_count = 0
            if added_urls:
                self.crawler.register_urls(added_urls)
                newly_scraped = await self.crawler.batch_crawl(max_articles=len(added_urls))
                for art in newly_scraped:
                    self.vector_store.index_article(art)
                    added_count += 1

            self.last_sync_status = SyncStatus(
                last_sync_time=datetime.utcnow().isoformat() + "Z",
                total_sitemap_urls=len(remote_url_map),
                indexed_articles=self.vector_store.get_article_count(),
                added_count=added_count,
                updated_count=len(updated_urls),
                removed_count=removed_count,
                is_syncing=False,
                message=f"Sync complete. {added_count} added, {removed_count} removed, {len(updated_urls)} updated."
            )
            return self.last_sync_status

        except Exception as e:
            logger.error(f"Sync failed: {e}")
            self.last_sync_status.is_syncing = False
            self.last_sync_status.message = f"Sync failed: {str(e)}"
            return self.last_sync_status

    def _get_article_id_by_url(self, url: str) -> str:
        match = re.search(r'/articles/(\d+)', url)
        if match:
            return match.group(1)
        return hashlib.md5(url.encode()).hexdigest()[:12]
