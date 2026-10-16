import os
import re
import time
import hashlib
import sqlite3
import asyncio
import logging
from typing import List, Dict, Optional, Tuple
import httpx
from bs4 import BeautifulSoup

from .models import Article, ImageMetadata
from .config import settings
from .vision_parser import VisionParser

logger = logging.getLogger("knowledge_brain.crawler")

class PoliteCrawler:
    """Polite, resumable crawler with checkpointing and multimodal parsing"""
    
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.checkpoint_db_path
        self.rate_limit = settings.crawl_rate_limit
        self.user_agent = settings.user_agent
        self.vision_parser = VisionParser()
        self._init_checkpoint_db()

    def _init_checkpoint_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS crawler_checkpoint (
                    url TEXT PRIMARY KEY,
                    status TEXT, -- pending, scraped, failed, skipped
                    http_status INTEGER,
                    last_scraped_at TEXT,
                    content_hash TEXT,
                    title TEXT,
                    category TEXT,
                    folder TEXT,
                    retry_count INTEGER DEFAULT 0,
                    error_msg TEXT
                )
            """)
            conn.commit()

    def get_checkpoint_stats(self) -> Dict[str, int]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT status, count(*) FROM crawler_checkpoint GROUP BY status")
            counts = dict(cursor.fetchall())
            cursor.execute("SELECT count(*) FROM crawler_checkpoint")
            total = cursor.fetchone()[0]
            return {
                "total": total,
                "scraped": counts.get("scraped", 0),
                "pending": counts.get("pending", 0),
                "failed": counts.get("failed", 0),
                "skipped": counts.get("skipped", 0)
            }

    def register_urls(self, urls: List[str]):
        """Queue URLs into checkpoint DB if not already registered"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            for url in urls:
                cursor.execute("""
                    INSERT OR IGNORE INTO crawler_checkpoint (url, status, retry_count)
                    VALUES (?, 'pending', 0)
                """, (url,))
            conn.commit()

    async def fetch_sitemap_urls(self, sitemap_url: Optional[str] = None) -> List[Tuple[str, Optional[str]]]:
        """Fetch and parse all URLs and lastmod timestamps from sitemap"""
        target_url = sitemap_url or settings.sitemap_url
        headers = {"User-Agent": self.user_agent}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(target_url, headers=headers)
            if resp.status_code != 200:
                raise RuntimeError(f"Failed to fetch sitemap: {resp.status_code}")
            
            import xml.etree.ElementTree as ET
            root = ET.fromstring(resp.content)
            entries = []
            ns_loc = "{http://www.sitemaps.org/schemas/sitemap/0.9}loc"
            ns_mod = "{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod"
            for elem in root:
                loc = elem.find(ns_loc)
                lastmod = elem.find(ns_mod)
                if loc is not None and loc.text:
                    url = loc.text.strip()
                    mod = lastmod.text.strip() if (lastmod is not None and lastmod.text) else None
                    if "/solutions/articles/" in url:
                        entries.append((url, mod))
            return entries

    async def crawl_single_article(self, client: httpx.AsyncClient, url: str) -> Optional[Article]:
        """Scrape and parse a single article with polite delays and error handling"""
        try:
            resp = await client.get(url, headers={"User-Agent": self.user_agent})
            if resp.status_code != 200:
                self._update_checkpoint(url, status="failed", http_status=resp.status_code, error=f"HTTP {resp.status_code}")
                return None
            
            html = resp.text
            content_hash = hashlib.sha256(html.encode("utf-8")).hexdigest()
            
            soup = BeautifulSoup(html, "html.parser")
            
            # Title
            title_el = soup.find("h1") or soup.find("title")
            title = title_el.get_text(strip=True) if title_el else "Brilliant Directories Documentation"
            title = re.sub(r'[\r\n\t]+', ' ', title).strip()

            # Breadcrumbs (Category -> Folder -> Article)
            breadcrumbs = [a.get_text(strip=True) for a in soup.select(".breadcrumb li, .breadcrumb a, nav.breadcrumb a")]
            category = "General"
            folder = "General"
            if len(breadcrumbs) >= 2:
                cat_cand = breadcrumbs[1].replace("Section:", "").strip()
                if cat_cand and cat_cand.lower() != "solution home":
                    category = cat_cand
            if len(breadcrumbs) >= 3:
                folder_cand = breadcrumbs[2].strip()
                if folder_cand:
                    folder = folder_cand

            # Body content
            article_body = soup.find("div", class_="article-body") or soup.find("article") or soup.find("div", class_="content")
            if not article_body:
                article_body = soup.find("main") or soup.find("body")

            body_text = article_body.get_text(separator="\n", strip=True) if article_body else ""
            # Clean extra whitespaces
            body_text = re.sub(r'\n{3,}', '\n\n', body_text)

            # Images / screenshots
            img_urls = []
            if article_body:
                for img in article_body.find_all("img"):
                    src = img.get("src")
                    if src and not src.startswith("data:"):
                        img_urls.append(src)

            # Vision parser for screenshots
            images = await self.vision_parser.parse_article_images(
                article_title=title,
                category=category,
                folder=folder,
                image_urls=img_urls,
                surrounding_context=body_text[:500]
            )

            # Extract article ID from URL
            match = re.search(r'/articles/(\d+)', url)
            article_id = match.group(1) if match else hashlib.md5(url.encode()).hexdigest()[:12]

            article = Article(
                id=article_id,
                url=url,
                title=title,
                category=category,
                folder=folder,
                content=body_text,
                markdown=f"# {title}\n\n**Category:** {category} > {folder}\n\n{body_text}",
                images=images,
                content_hash=content_hash,
                created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            )

            self._update_checkpoint(
                url, 
                status="scraped", 
                http_status=200, 
                content_hash=content_hash,
                title=title,
                category=category,
                folder=folder
            )
            return article

        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            self._update_checkpoint(url, status="failed", error=str(e))
            return None

    def _update_checkpoint(self, url: str, status: str, http_status: int = 0, content_hash: str = "", title: str = "", category: str = "", folder: str = "", error: str = ""):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE crawler_checkpoint
                SET status = ?, http_status = ?, last_scraped_at = datetime('now'),
                    content_hash = ?, title = ?, category = ?, folder = ?, error_msg = ?
                WHERE url = ?
            """, (status, http_status, content_hash, title, category, folder, error, url))
            conn.commit()

    async def batch_crawl(self, max_articles: int = 50, progress_callback=None) -> List[Article]:
        """Polite batch crawling with rate limits and resumption"""
        # Get pending or retryable URLs
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT url FROM crawler_checkpoint 
                WHERE status IN ('pending', 'failed') AND retry_count < 3
                LIMIT ?
            """, (max_articles,))
            rows = cursor.fetchall()

        urls = [r[0] for r in rows]
        if not urls:
            logger.info("No pending URLs to crawl.")
            return []

        logger.info(f"Starting polite batch crawl of {len(urls)} articles...")
        crawled_articles: List[Article] = []

        async with httpx.AsyncClient(timeout=20.0) as client:
            for i, url in enumerate(urls):
                article = await self.crawl_single_article(client, url)
                if article:
                    crawled_articles.append(article)
                if progress_callback:
                    await progress_callback(i + 1, len(urls), url, article)
                # Polite rate limit delay
                await asyncio.sleep(self.rate_limit)

        return crawled_articles
