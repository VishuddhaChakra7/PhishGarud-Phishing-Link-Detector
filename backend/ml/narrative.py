class NarrativeGenerator:
    def generate(self, whois: dict, ssl: dict, redirects: dict, page: dict, brand: dict, ml_proba: float) -> dict:
        """
        Synthesizes a human-readable threat analysis narrative divided into:
        1. Findings (what we saw)
        2. Attack Pattern (what the attacker is doing)
        3. Recommendation (what the user should do)
        """
        findings = []
        attack_pattern = ""
        recommendations = []

        # 1. Gather Factual Findings
        # Brand similarity findings
        brand_match = brand.get("best_match")
        distance = brand.get("distance", 999)
        is_typo = brand.get("is_suspicious", False)
        
        if is_typo and distance > 0:
            findings.append(f"This domain closely resembles the legitimate brand '{brand_match}' (edit distance of {distance}), suggesting an impersonation or typosquatting attempt.")
        elif min_distance := brand.get("distance", 999) == 0:
            findings.append(f"The domain matches the registered brand '{brand_match}' perfectly.")

        # WHOIS findings
        domain_age = whois.get("domain_age_days", -1)
        if 0 <= domain_age < 30:
            findings.append(f"The domain was registered very recently ({domain_age} days ago). Phishing campaigns often deploy brand-new domains to avoid reputational blocks.")
        elif domain_age >= 365:
            findings.append(f"The domain has a stable registration history (active for {domain_age // 365} year(s)).")

        # SSL findings
        ssl_age = ssl.get("cert_age_days", -1)
        is_self_signed = ssl.get("is_self_signed", False) or ssl.get("ssl_is_self_signed", 0) == 1
        if is_self_signed:
            findings.append("The server uses a self-signed or invalid SSL certificate, which does not guarantee identity verification.")
        elif 0 <= ssl_age < 7:
            findings.append(f"The SSL certificate is exceptionally new (issued {ssl_age} days ago). Phishers frequently request automated certificates right before sending lure emails.")

        # Redirect findings
        hop_count = redirects.get("hop_count", 0)
        crosses_domain = redirects.get("crosses_domain", False)
        if hop_count >= 3:
            findings.append(f"The URL redirects through a chain of {hop_count} hops before landing. Redirect chains are heavily utilized to bypass automated email gateways and lexical filters.")
        if crosses_domain:
            findings.append("The redirection path crosses multiple domain boundaries, transferring your browser context to external authorities.")

        # Page content findings
        has_login = page.get("has_login_form", False)
        external_action = page.get("form_action_is_external", False)
        script_count = page.get("count_scripts", 0)
        iframe_count = page.get("count_iframes", 0)
        right_click_locked = page.get("right_click_disabled", False)
        favicon_external = page.get("has_favicon_from_external", False)
        
        if has_login:
            findings.append("We detected a credential input form (password field) on this page.")
        if external_action:
            findings.append("The login form's submission target (action URL) points to a different domain, which will transmit entered credentials offsite.")
        if right_click_locked:
            findings.append("The page disables right-clicking or context menus, a tactic phishers use to prevent users from inspecting the HTML source code.")
        if favicon_external:
            findings.append("The site clones a favicon hosted on a legitimate external domain, which is a common visual replication technique.")

        # 2. Determine Attack Pattern Category
        # Pattern A: Credential Harvesting
        if has_login and (external_action or is_typo):
            attack_pattern = "Credential Harvesting: This site replicates brand markings and contains login portals designed to intercept your credentials and transmit them directly to an unauthorized third party."
            recommendations.append("Do NOT input any usernames, passwords, or personal detail fields on this page.")
            recommendations.append("If you already submitted credentials, navigate to the official service website immediately, reset your password, and enable multi-factor authentication (MFA).")
            
        # Pattern B: Drive-by Download or Script Injection
        elif (script_count > 15 or iframe_count > 3) and not has_login:
            attack_pattern = "Potential Drive-by-Download or Malicious Script Injection: The page contains an unusually high script-to-content ratio and multiple embedded frames. This configuration is often used to run browser exploits or inject background downloads."
            recommendations.append("Avoid interactively clicking elements, executing popups, or downloading files from this site.")
            recommendations.append("Run a local malware/antivirus scan on your device if any prompt triggered a background download.")

        # Pattern C: Redirect Chain Obfuscation
        elif hop_count >= 3 and crosses_domain:
            attack_pattern = "Redirect Obfuscation Chain: The link uses multiple domain-crossing hops to hide its final landing destination. This obfuscation is characteristic of exploit kits, spam redirectors, or delivery networks."
            recommendations.append("Be extremely cautious of the landing page. Inspect the address bar to ensure it matches the domain you intended to visit.")

        # Pattern D: Typosquatting / Domain Impersonation
        elif is_typo:
            attack_pattern = "Domain Impersonation (Typosquatting): The URL uses homoglyphs, minor spelling variations, or nested subdomains to impersonate a trusted service, aiming to deceive users by exploiting visual similarity."
            recommendations.append(f"Check the exact spelling in the address bar. It looks like it is attempting to mimic '{brand_match}'. Always type official URLs manually.")

        # Pattern E: Generic Phishing or suspicious young domain
        elif ml_proba > 0.5 or (0 <= domain_age < 30):
            attack_pattern = "Newly Registered Suspicious Domain: The site has no established reputation history, is hosted on a very young domain, and displays lexical cues commonly associated with malicious links."
            recommendations.append("Treat this site as untrusted. Do not enter personal or financial details.")

        else:
            attack_pattern = "Legitimate Profile: Factual features and historical lookups suggest this domain is stable and aligns with standard safe web characteristics."
            recommendations.append("No immediate threats were detected. However, always exercise baseline caution when inputting critical credentials.")

        # Fallback if no specific findings
        if not findings:
            findings.append("No critical lexical anomalies or enrichment anomalies were detected.")

        return {
            "findings": " ".join(findings),
            "attack_pattern": attack_pattern,
            "recommendation": " ".join(recommendations)
        }

# Facade helper
_generator = None
def generate_narrative(whois: dict, ssl: dict, redirects: dict, page: dict, brand: dict, ml_proba: float) -> dict:
    global _generator
    if _generator is None:
        _generator = NarrativeGenerator()
    return _generator.generate(whois, ssl, redirects, page, brand, ml_proba)
