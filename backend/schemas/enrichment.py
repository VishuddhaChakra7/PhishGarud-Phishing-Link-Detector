from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class WhoisSchema(BaseModel):
    registered_date: Optional[str] = None
    expiry_date: Optional[str] = None
    registrar: Optional[str] = None
    country: Optional[str] = None
    domain_age_days: int = -1
    domain_expiry_days: int = -1
    is_private: bool = False
    error: Optional[str] = None

class SslSchema(BaseModel):
    issuer: Optional[str] = None
    issued_date: Optional[str] = None
    expiry_date: Optional[str] = None
    cert_age_days: int = -1
    days_until_expiry: int = -1
    is_self_signed: bool = False
    ssl_is_lets_encrypt: int = 0
    ssl_is_self_signed: int = 0
    ssl_wildcard: int = 0
    error: Optional[str] = None

class RedirectHop(BaseModel):
    url: str
    status_code: int

class RedirectSchema(BaseModel):
    hops: List[RedirectHop] = []
    final_url: str
    hop_count: int
    crosses_domain: bool = False
    suspicious_hops: List[int] = []
    error: Optional[str] = None

class ThreatFeedsSchema(BaseModel):
    is_phishing: bool = False
    verified: bool = False
    phish_detail_url: Optional[str] = None
    submission_time: Optional[str] = None
    urlhaus_hit: bool = False
    phishtank_hit: bool = False
    openphish_hit: bool = False
    error: Optional[str] = None

class BrandMatchSchema(BaseModel):
    best_match: Optional[str] = None
    distance: int = 999
    is_suspicious: bool = False
    risk_score: float = 0.0
    all_matches: List[Dict[str, Any]] = []

class PageSchema(BaseModel):
    has_login_form: bool = False
    form_action_is_external: bool = False
    count_iframes: int = 0
    has_favicon_from_external: bool = False
    count_scripts: int = 0
    right_click_disabled: bool = False
    has_mouseover_trick: bool = False
    has_meta_refresh: bool = False
    count_external_resources: int = 0
    error: Optional[str] = None
