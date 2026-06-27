from pydantic import BaseModel, HttpUrl, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class ScanRequest(BaseModel):
    url: str = Field(..., description="The raw URL string to scan")

class ScanResponse(BaseModel):
    scan_id: UUID
    url: str
    verdict: str  # SAFE, SUSPICIOUS, PHISHING
    confidence: float
    features: Dict[str, Any]
    shap_values: List[Dict[str, Any]]
    stream_url: str
    scanned_at: datetime

    class Config:
        from_attributes = True

class FeedbackRequest(BaseModel):
    scan_id: UUID = Field(..., description="The UUID of the scanned URL")
    correct_verdict: str = Field(..., description="Corrected verdict, e.g. SAFE or PHISHING")
    comment: Optional[str] = Field(default=None, description="Optional user commentary")

class EmailScanRequest(BaseModel):
    email_text: str = Field(..., description="Raw text or source of the email to extract links from")

class EmailScanResponse(BaseModel):
    total_links_found: int
    phishing_count: int
    safe_count: int
    most_dangerous_url: Optional[str]
    scans: List[ScanResponse]
