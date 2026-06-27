import os
import re
import math
import urllib.parse
import ipaddress
import pandas as pd
import tldextract

class FeatureExtractor:
    def __init__(self):
        # Load shortening services list
        self.shorteners = {
            "bit.ly", "tinyurl.com", "t.co", "ow.ly", "goo.gl", "is.gd", "buff.ly", 
            "dlvr.it", "tr.im", "rebrandly.com", "bit.do", "lnkd.in", "db.tt", 
            "qr.ae", "adf.ly", "goo.by", "bl.ink", "sniply.io", "short.io", 
            "shorte.st", "tiny.cc", "clck.ru", "cutt.ly", "t2mio.com", "rb.gy", 
            "vk.cc", "urlr.me", "sur.ly", "bitly.com", "t.ly", "v.gd", "polr.me", 
            "zapier.com", "mzl.la", "fb.me", "wp.me", "po.st", "bc.vc", "linktree", 
            "l.co", "s.co", "y2u.be", "g.co", "mcaf.ee", "su.pr", "fur.ly", 
            "plu.sh", "tny.im", "cli.re", "hootsuite.com", "owly", "shorturl.at"
        }
        
        # Load brand list for Levenshtein distance checks
        brand_csv = os.path.join(os.path.dirname(__file__), "..", "data", "brand_domains.csv")
        if os.path.exists(brand_csv):
            try:
                self.brand_df = pd.read_csv(brand_csv)
                self.brands = self.brand_df["domain"].dropna().tolist()
            except Exception:
                self.brands = []
        else:
            self.brands = []

    def extract_lexical(self, url: str) -> dict:
        """
        Extracts 30 lexical features from a raw URL string without any network requests.
        """
        features = {}
        try:
            # Clean URL
            url = url.strip()
            
            # Ensure protocol is present for parsing, but do not modify original URL length computation
            parsed_url = urllib.parse.urlparse(url)
            if not parsed_url.scheme:
                # Parse as if http if no scheme
                parsed_url = urllib.parse.urlparse("http://" + url)
            
            hostname = parsed_url.netloc or ""
            path = parsed_url.path or ""
            query = parsed_url.query or ""
            fragment = parsed_url.fragment or ""
            
            # Extract domain parts
            ext = tldextract.extract(url)
            subdomain = ext.subdomain
            registered_domain = ext.domain
            
            # Feature 1: url_length
            features["url_length"] = len(url)
            
            # Feature 2: hostname_length
            features["hostname_length"] = len(hostname)
            
            # Feature 3: path_length
            features["path_length"] = len(path)
            
            # Feature 4: query_length
            features["query_length"] = len(query)
            
            # Feature 5: fragment_length
            features["fragment_length"] = len(fragment)
            
            # Feature 6: count_dots
            features["count_dots"] = url.count(".")
            
            # Feature 7: count_hyphens
            features["count_hyphens"] = url.count("-")
            
            # Feature 8: count_underscores
            features["count_underscores"] = url.count("_")
            
            # Feature 9: count_slashes
            features["count_slashes"] = url.count("/")
            
            # Feature 10: count_question_marks
            features["count_question_marks"] = url.count("?")
            
            # Feature 11: count_equals
            features["count_equals"] = url.count("=")
            
            # Feature 12: count_ampersands
            features["count_ampersands"] = url.count("&")
            
            # Feature 13: count_at_signs
            features["count_at_signs"] = url.count("@")
            
            # Feature 14: count_percent_encoding
            features["count_percent_encoding"] = url.count("%")
            
            # Feature 15: count_digits_in_domain
            features["count_digits_in_domain"] = sum(c.isdigit() for c in registered_domain)
            
            # Feature 16: count_subdomains
            subdomain_parts = [p for p in subdomain.split(".") if p]
            features["count_subdomains"] = len(subdomain_parts)
            
            # Feature 17: has_ip_address
            # Try parsing netloc/hostname as IP
            has_ip = 0
            # Strip port if any
            host_only = hostname.split(":")[0] if ":" in hostname else hostname
            try:
                ipaddress.ip_address(host_only)
                has_ip = 1
            except ValueError:
                pass
            features["has_ip_address"] = has_ip
            
            # Feature 18: is_shortened
            # Check if domain matches known shorteners
            full_domain = f"{ext.domain}.{ext.suffix}".lower()
            features["is_shortened"] = 1 if (full_domain in self.shorteners or host_only in self.shorteners) else 0
            
            # Feature 19: has_at_in_url
            features["has_at_in_url"] = 1 if "@" in url else 0
            
            # Feature 20: double_slash_in_path
            features["double_slash_in_path"] = 1 if "//" in path else 0
            
            # Feature 21: has_port
            features["has_port"] = 1 if parsed_url.port is not None else 0
            
            # Feature 22: port_number
            features["port_number"] = parsed_url.port if parsed_url.port is not None else 0
            
            # Feature 23: TLD in path
            # Simple check for common TLDs with surrounding boundaries (slashes or dots or hyphens)
            tld_pattern = r'\.(com|net|org|edu|gov|info|biz|co|xyz|online|shop|club|site|app|cc|tv)\b'
            features["tld_in_path"] = 1 if re.search(tld_pattern, path, re.IGNORECASE) else 0
            
            # Feature 24: https_token_in_domain
            features["https_token_in_domain"] = 1 if "https" in hostname.lower() else 0
            
            # Feature 25: subdomain_is_ip_like
            subdomain_ip_like = 0
            for part in subdomain_parts:
                if re.match(r'^\d+$', part):  # all digits
                    subdomain_ip_like = 1
                    break
            features["subdomain_is_ip_like"] = subdomain_ip_like
            
            # Feature 26: special_char_ratio (non-alphanumeric, non-dot characters)
            special_chars = sum(not (c.isalnum() or c == '.') for c in url)
            features["special_char_ratio"] = special_chars / len(url) if len(url) > 0 else 0.0
            
            # Feature 27: digit_ratio_in_url
            digits = sum(c.isdigit() for c in url)
            features["digit_ratio_in_url"] = digits / len(url) if len(url) > 0 else 0.0
            
            # Feature 28: subdomain_entropy
            features["subdomain_entropy"] = self._calculate_entropy(subdomain)
            
            # Extract words for word length features
            words = re.findall(r'[a-zA-Z]+', url)
            word_lengths = [len(w) for w in words]
            
            # Feature 29: longest_word_length
            features["longest_word_length"] = max(word_lengths) if word_lengths else 0
            
            # Feature 30: avg_word_length
            features["avg_word_length"] = sum(word_lengths) / len(word_lengths) if word_lengths else 0.0
            
        except Exception:
            # Fallback safe defaults for all 30 features
            defaults = {
                "url_length": 0, "hostname_length": 0, "path_length": 0, "query_length": 0,
                "fragment_length": 0, "count_dots": 0, "count_hyphens": 0, "count_underscores": 0,
                "count_slashes": 0, "count_question_marks": 0, "count_equals": 0, "count_ampersands": 0,
                "count_at_signs": 0, "count_percent_encoding": 0, "count_digits_in_domain": 0,
                "count_subdomains": 0, "has_ip_address": 0, "is_shortened": 0, "has_at_in_url": 0,
                "double_slash_in_path": 0, "has_port": 0, "port_number": 0, "tld_in_path": 0,
                "https_token_in_domain": 0, "subdomain_is_ip_like": 0, "special_char_ratio": 0.0,
                "digit_ratio_in_url": 0.0, "subdomain_entropy": 0.0, "longest_word_length": 0,
                "avg_word_length": 0.0
            }
            return defaults

        return features

    def _calculate_entropy(self, s: str) -> float:
        if not s:
            return 0.0
        counts = {}
        for char in s:
            counts[char] = counts.get(char, 0) + 1
        entropy = 0.0
        total_len = len(s)
        for count in counts.values():
            p = count / total_len
            entropy -= p * math.log2(p)
        return entropy

    def extract(self, url: str) -> dict:
        """
        Facade to extract features. For XGBoost prediction, it returns the 30 lexical features.
        """
        return self.extract_lexical(url)
