import requests
import json
import redis
import os
from datetime import datetime

# Safe Redis initialization
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.Redis.from_url(REDIS_URL, socket_timeout=2)
except Exception:
    redis_client = None

def check_threat_feeds(url: str) -> dict:
    """
    Queries multiple threat feeds (PhishTank, URLhaus, OpenPhish) to verify
    if a URL is a confirmed threat. Caches the combined response in Redis for 1 hour.
    """
    cache_key = f"threats:{url}"
    
    # 1. Try cache lookup
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data.decode("utf-8"))
        except Exception:
            pass
            
    result = {
        "is_phishing": False,
        "verified": False,
        "phish_detail_url": None,
        "submission_time": None,
        "urlhaus_hit": False,
        "phishtank_hit": False,
        "openphish_hit": False,
        "error": None
    }
    
    # 2. Query URLhaus (abuse.ch)
    # This is a free, fast API endpoint that checks URLs
    try:
        urlhaus_api = "https://urlhaus-api.abuse.ch/v1/url/"
        data = {"url": url}
        response = requests.post(urlhaus_api, data=data, timeout=4)
        if response.status_code == 200:
            res_json = response.json()
            if res_json.get("query_status") == "ok":
                result["is_phishing"] = True
                result["verified"] = True
                result["urlhaus_hit"] = True
                result["phish_detail_url"] = res_json.get("urlhaus_reference")
                result["submission_time"] = res_json.get("date_added")
    except Exception as e:
        # Silently record error but continue to next feed
        result["error"] = f"URLhaus query error: {e}"

    # 3. Query PhishTank
    # The checkurl endpoint is public, though heavily rate-limited without a key.
    # We query it and handle rate limits (429) gracefully.
    try:
        phishtank_api = "https://checkurl.phishtank.com/checkurl/"
        headers = {"User-Agent": "Mozilla/5.0"}
        data = {
            "url": url,
            "format": "json"
        }
        # Add API key if available
        pt_key = os.getenv("PHISHTANK_API_KEY")
        if pt_key:
            data["app_key"] = pt_key
            
        response = requests.post(phishtank_api, data=data, headers=headers, timeout=4)
        if response.status_code == 429:
            # Rate limited
            pass
        elif response.status_code == 200:
            res_json = response.json()
            # If URL is in PhishTank database, it returns detailed info
            meta = res_json.get("results", {})
            if meta.get("in_database") is True:
                result["phishtank_hit"] = True
                result["is_phishing"] = True
                result["verified"] = meta.get("verified") == "yes"
                result["phish_detail_url"] = meta.get("phish_detail_page")
                result["submission_time"] = meta.get("verified_at") or meta.get("submission_time")
    except Exception as e:
        if result["error"]:
            result["error"] += f" | PhishTank query error: {e}"
        else:
            result["error"] = f"PhishTank query error: {e}"

    # 4. Check OpenPhish (local or downloaded list lookup)
    # Since OpenPhish list is large, we check if the domain or URL matches the OpenPhish cached feed.
    # For local testing, we look for 'openphish_domains' set in Redis. If empty, we skip.
    if redis_client:
        try:
            # Check if domain matches cached OpenPhish domains
            from urllib.parse import urlparse
            hostname = urlparse(url).netloc.lower()
            if redis_client.sismember("openphish_domains", hostname):
                result["openphish_hit"] = True
                result["is_phishing"] = True
                result["verified"] = True
        except Exception:
            pass

    # 5. Cache the final result in Redis for 1 hour (3600 seconds)
    if redis_client:
        try:
            redis_client.set(cache_key, json.dumps(result), ex=3600)
        except Exception:
            pass
            
    return result
