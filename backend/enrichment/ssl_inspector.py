import socket
import ssl
from datetime import datetime, timezone

def check_ssl(hostname: str) -> dict:
    """
    Inspects the SSL certificate details of a hostname on port 443.
    Returns details like issuer, dates, age, and indicators for Let's Encrypt,
    wildcard status, and self-signed certificates.
    """
    result = {
        "issuer": None,
        "issued_date": None,
        "expiry_date": None,
        "cert_age_days": -1,
        "days_until_expiry": -1,
        "is_self_signed": False,
        "ssl_is_lets_encrypt": 0,
        "ssl_is_self_signed": 0,
        "ssl_wildcard": 0,
        "error": None
    }
    
    # 1. Try standard verified connection
    try:
        context = ssl.create_default_context()
        # Reduce timeout to 5 seconds
        with socket.create_connection((hostname, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                
                # Parse issuer organization or common name
                issuer_tuple = cert.get("issuer", ())
                issuer_name = "Unknown"
                for rdns in issuer_tuple:
                    for attr in rdns:
                        if attr[0] == "organizationName":
                            issuer_name = attr[1]
                            break
                    if issuer_name != "Unknown":
                        break
                if issuer_name == "Unknown" and issuer_tuple:
                    # fallback to commonName
                    for rdns in issuer_tuple:
                        for attr in rdns:
                            if attr[0] == "commonName":
                                issuer_name = attr[1]
                                break
                
                result["issuer"] = issuer_name
                
                # Parse dates
                not_before = cert.get("notBefore")
                not_after = cert.get("notAfter")
                date_fmt = "%b %d %H:%M:%S %Y %Z"
                
                utc_now = datetime.now(timezone.utc).replace(tzinfo=None)
                
                if not_before:
                    issued_dt = datetime.strptime(not_before, date_fmt)
                    result["issued_date"] = issued_dt.isoformat()
                    result["cert_age_days"] = max(0, (utc_now - issued_dt).days)
                
                if not_after:
                    expiry_dt = datetime.strptime(not_after, date_fmt)
                    result["expiry_date"] = expiry_dt.isoformat()
                    result["days_until_expiry"] = max(0, (expiry_dt - utc_now).days)
                
                # Wildcard check
                subject = cert.get("subject", ())
                common_name = ""
                for rdns in subject:
                    for attr in rdns:
                        if attr[0] == "commonName":
                            common_name = attr[1]
                            break
                result["ssl_wildcard"] = 1 if common_name.startswith("*.") else 0
                
                # Let's Encrypt check
                result["ssl_is_lets_encrypt"] = 1 if "let's encrypt" in issuer_name.lower() else 0
                
                return result
                
    except ssl.SSLCertVerificationError as e:
        # Verification failed (e.g. self-signed or expired)
        result["error"] = f"Certificate verification failed: {e}"
        result["is_self_signed"] = True
        result["ssl_is_self_signed"] = 1
        
        # Try unverified fetch to at least get details (issuer/dates) if possible
        try:
            unverified_context = ssl._create_unverified_context()
            with socket.create_connection((hostname, 443), timeout=5) as sock:
                with unverified_context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    # For unverified, getpeercert() returns empty dict unless we use binary_form
                    # But we can get certificate in PEM using get_server_certificate
                    pem_cert = ssl.get_server_certificate((hostname, 443), timeout=5)
                    # We can mark it self-signed or invalid
                    result["is_self_signed"] = True
                    result["ssl_is_self_signed"] = 1
        except Exception:
            pass
        return result
        
    except Exception as e:
        result["error"] = str(e)
        return result
