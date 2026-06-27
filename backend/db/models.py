import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Uuid
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

class ScanResult(Base):
    __tablename__ = "scans"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    url = Column(String, index=True, nullable=False)
    verdict = Column(String, index=True, nullable=False)  # SAFE, SUSPICIOUS, PHISHING
    confidence = Column(Float, nullable=False)
    
    # Feature engineering and ML explanation payloads
    features = Column(JSON, nullable=True)  # Lexical features extracted
    shap_values = Column(JSON, nullable=True)  # SHAP explanation data
    
    # Enrichment payloads
    whois_data = Column(JSON, nullable=True)
    ssl_data = Column(JSON, nullable=True)
    redirect_data = Column(JSON, nullable=True)
    phishtank_data = Column(JSON, nullable=True)
    brand_match_data = Column(JSON, nullable=True)
    page_data = Column(JSON, nullable=True)
    
    # UI displays & alerts
    security_tips = Column(JSON, nullable=True)  
    phishtank_override = Column(Boolean, default=False)
    
    scanned_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationship to user feedback
    feedbacks = relationship("Feedback", back_populates="scan", cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    scan_id = Column(Uuid(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    correct_verdict = Column(String, nullable=False)  # SAFE, PHISHING
    comment = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to scan
    scan = relationship("ScanResult", back_populates="feedbacks")
