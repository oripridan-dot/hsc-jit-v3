"""
Progress Tracker for Scraping Operations
========================================
Real-time progress tracking that writes to JSON for UI consumption.
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, asdict


@dataclass
class ScrapeProgress:
    """Scraping progress data structure"""
    brand: str
    status: str  # "idle" | "running" | "complete" | "error"
    current_product: int
    total_products: int
    current_file: str
    files_scraped: list[str]
    start_time: str
    elapsed_seconds: float
    estimated_seconds_remaining: Optional[float]
    last_update: str
    errors: list[str]
    
    def to_dict(self):
        return asdict(self)


class ProgressTracker:
    """Track scraping progress and write to JSON file"""
    
    def __init__(self, progress_file: Path):
        self.progress_file = progress_file
        self.progress_file.parent.mkdir(parents=True, exist_ok=True)
        
    def update(self, progress: ScrapeProgress):
        """Write progress update to JSON file"""
        try:
            with open(self.progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress.to_dict(), f, indent=2)
        except Exception as e:
            print(f"Warning: Could not write progress file: {e}")
    
    def start(self, brand: str, total_products: int):
        """Initialize progress tracking"""
        progress = ScrapeProgress(
            brand=brand,
            status="running",
            current_product=0,
            total_products=total_products,
            current_file="Initializing...",
            files_scraped=[],
            start_time=datetime.utcnow().isoformat() + "Z",
            elapsed_seconds=0.0,
            estimated_seconds_remaining=None,
            last_update=datetime.utcnow().isoformat() + "Z",
            errors=[]
        )
        self.update(progress)
        return progress
    
    def update_product(self, progress: ScrapeProgress, product_name: str, product_num: int, start_time: datetime):
        """Update progress for a new product"""
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        
        # Calculate time estimate
        if product_num > 0:
            avg_time_per_product = elapsed / product_num
            remaining = progress.total_products - product_num
            estimated_remaining = avg_time_per_product * remaining
        else:
            estimated_remaining = None
        
        progress.current_product = product_num
        progress.current_file = product_name
        progress.files_scraped.append(product_name)
        progress.elapsed_seconds = elapsed
        progress.estimated_seconds_remaining = estimated_remaining
        progress.last_update = datetime.utcnow().isoformat() + "Z"
        
        self.update(progress)
    
    def add_error(self, progress: ScrapeProgress, error: str):
        """Add error to progress"""
        progress.errors.append(error)
        self.update(progress)
    
    def complete(self, progress: ScrapeProgress, start_time: datetime):
        """Mark scraping as complete"""
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        progress.status = "complete"
        progress.elapsed_seconds = elapsed
        progress.estimated_seconds_remaining = 0
        progress.last_update = datetime.utcnow().isoformat() + "Z"
        self.update(progress)
    
    def error(self, progress: ScrapeProgress, error: str):
        """Mark scraping as errored"""
        progress.status = "error"
        progress.errors.append(error)
        progress.last_update = datetime.utcnow().isoformat() + "Z"
        self.update(progress)
    
    def read(self) -> Optional[dict]:
        """Read current progress"""
        try:
            if self.progress_file.exists():
                with open(self.progress_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception:
            pass
        return None
