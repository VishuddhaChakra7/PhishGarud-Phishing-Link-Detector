import requests
import tldextract
from urllib.parse import urlparse

# Common suspicious TLDs frequently used in phishing campaigns
SUSPICIOUS_TLDS = {
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "club", "info", "icu", "work",
    "click", "fit", "gdn", "faith", "loan", "cricket", "date", "space", "bid",
    "stream", "win", "men", "party", "download", "link", "zip", "app", "live"
}

def trace_redirects(url: str, max_redirects: int = 10, timeout: int = 5) -> dict:
    """
    Follows the HTTP redirect chain of a URL up to max_redirects.
    Returns the hops (url and status code), final URL, hop count,
    whether it crosses domain boundaries, and any suspicious TLD jumps.
    """
    result = {
        "hops": [],
        "final_url": url,
        "hop_count": 0,
        "crosses_domain": False,
        "suspicious_hops": [],
        "error": None
    }
    
    # Track domains to check for boundary crossing
    domains_seen = []
    
    try:
        session = requests.Session()
        session.max_redirects = max_redirects
        
        # We manually trace redirects by disabling allow_redirects and loop
        # to capture individual status codes and redirect paths accurately.
        current_url = url
        
        for i in range(max_redirects):
            # Extract registered domain of current hop
            ext = tldextract.extract(current_url)
            reg_domain = f"{ext.domain}.{ext.suffix}".lower()
            domains_seen.append(reg_domain)
            
            # Check TLD suspicion
            tld = ext.suffix.lower()
            if tld in SUSPICIOUS_TLDS:
                result["suspicious_hops"].append(i)
            
            # Perform request without following automatically
            # Use HEAD request first for speed, falling back to GET
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            try:
                response = session.head(current_url, timeout=timeout, headers=headers, allow_redirects=False)
            except Exception:
                # If HEAD fails, try GET (some servers block HEAD)
                response = session.get(current_url, timeout=timeout, headers=headers, allow_redirects=False)
            
            # Record current hop status
            # Wait, the response url is the URL we requested, and response.status_code is the code it returned
            status_code = response.status_code
            
            # Check if this is a redirect status code (3xx) and a Location header exists
            if status_code in (301, 302, 303, 307, 308) and "Location" in response.headers:
                next_url = response.headers["Location"]
                
                # Resolve relative redirect URLs
                if next_url.startswith("/"):
                    parsed_orig = urlparse(current_url)
                    next_url = f"{parsed_orig.scheme}://{parsed_orig.netloc}{next_url}"
                elif not next_url.startswith("http"):
                    # Resolve other relative path structures
                    parsed_orig = urlparse(current_url)
                    base_path = "/".join(parsed_orig.path.split("/")[:-1])
                    next_url = f"{parsed_orig.scheme}://{parsed_orig.netloc}{base_path}/{next_url}"
                
                result["hops"].append({
                    "url": current_url,
                    "status_code": status_code
                })
                
                current_url = next_url
            else:
                # No more redirects
                result["hops"].append({
                    "url": current_url,
                    "status_code": status_code
                })
                result["final_url"] = current_url
                break
        else:
            # Reached max redirects limit
            result["hops"].append({
                "url": current_url,
                "status_code": 302
            })
            result["final_url"] = current_url
            
    except Exception as e:
        result["error"] = str(e)
        # If there's an error mid-chain, we keep the hops we have resolved so far
        if not result["hops"]:
            result["hops"].append({
                "url": url,
                "status_code": 0
            })
            
    result["hop_count"] = len(result["hops"]) - 1 if len(result["hops"]) > 0 else 0
    
    # Determine if redirect chain crosses domain boundaries
    # Ignore initial empty states or single hop structures
    unique_domains = set(d for d in domains_seen if d and not d.startswith("."))
    if len(unique_domains) > 1:
        result["crosses_domain"] = True
        
    return result
