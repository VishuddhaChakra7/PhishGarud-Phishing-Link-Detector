import whois
import json
import redis
from datetime import datetime
import os

# Safe Redis initialization
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.Redis.from_url(REDIS_URL, socket_timeout=2)
except Exception:
    redis_client = None

def check_whois(domain: str) -> dict:
    """
    Performs a WHOIS inspection for the given domain.
    Returns registrar info, creation date, country, domain age, and privacy masking indicators.
    Caches results in Redis with a 24-hour TTL.
    """
    cache_key = f"whois:{domain.lower()}"
    
    # 1. Try Cache lookup
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data.decode("utf-8"))
        except Exception:
            pass  # Fallback if Redis fails

    # 2. Perform raw WHOIS lookup
    result = {
        "registered_date": None,
        "expiry_date": None,
        "registrar": None,
        "country": None,
        "domain_age_days": -1,
        "domain_expiry_days": -1,
        "is_private": False,
        "error": None
    }
    
    try:
        w = whois.whois(domain)
        
        # Parse registered/creation date
        creation_date = w.creation_date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
        
        if isinstance(creation_date, datetime):
            if creation_date.tzinfo is not None:
                creation_date = creation_date.replace(tzinfo=None)
            result["registered_date"] = creation_date.isoformat()
            result["domain_age_days"] = max(0, (datetime.now() - creation_date).days)
            
        # Parse expiration date
        expiration_date = w.expiration_date
        if isinstance(expiration_date, list):
            expiration_date = expiration_date[0]
            
        if isinstance(expiration_date, datetime):
            if expiration_date.tzinfo is not None:
                expiration_date = expiration_date.replace(tzinfo=None)
            result["expiry_date"] = expiration_date.isoformat()
            result["domain_expiry_days"] = max(0, (expiration_date - datetime.now()).days)

        # Registrar
        result["registrar"] = w.registrar if w.registrar else None
        
        # Country
        result["country"] = w.country if w.country else None
        
        # Privacy masking check
        privacy_keywords = {"privacy", "proxy", "protected", "redacted", "mask", "withheld", "hidden"}
        fields_to_check = [w.name, w.emails, w.org, w.registrar]
        
        is_masked = False
        for field in fields_to_check:
            if not field:
                continue
            field_str = str(field).lower()
            if any(kw in field_str for kw in privacy_keywords):
                is_masked = True
                break
        result["is_private"] = is_masked
        
    except Exception as e:
        result["error"] = str(e)
        result["domain_age_days"] = -1
        result["domain_expiry_days"] = -1

    # 3. Cache the successful result or errors for a short duration
    if redis_client:
        try:
            # Cache successfully parsed or failed whois for 24 hours (86400 seconds)
            redis_client.set(cache_key, json.dumps(result), ex=86400)
        except Exception:
            pass

    return result
