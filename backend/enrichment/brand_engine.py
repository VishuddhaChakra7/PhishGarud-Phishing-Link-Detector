import os
import pandas as pd
import Levenshtein

class BrandEngine:
    def __init__(self):
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

    def check_brand_similarity(self, domain_without_tld: str) -> dict:
        """
        Computes the Levenshtein distance between the input domain and 500 protected brand domains.
        Returns:
            best_match: closest brand domain
            distance: minimum edit distance
            is_suspicious: true if 0 < distance <= 2 (exact matches, i.e., distance=0, is legitimate and not suspicious)
            risk_score: float risk score mapped from distance (0 -> 0.0, 1 -> 0.95, 2 -> 0.70, 3 -> 0.30, >3 -> 0.0)
            all_matches: top 5 matches with distances
        """
        domain_clean = domain_without_tld.lower().strip()
        
        result = {
            "best_match": None,
            "distance": 999,
            "is_suspicious": False,
            "risk_score": 0.0,
            "all_matches": []
        }
        
        if not self.brands or not domain_clean:
            return result
            
        matches_list = []
        for brand in self.brands:
            brand_clean = str(brand).lower().strip()
            dist = Levenshtein.distance(domain_clean, brand_clean)
            matches_list.append((brand_clean, dist))
            
        # Sort matches by distance ascending
        matches_list.sort(key=lambda x: x[1])
        
        best_match, min_dist = matches_list[0]
        result["best_match"] = best_match
        result["distance"] = min_dist
        
        # Mapping risk_score:
        # 0 distance maps to 0.0 (it is the exact legitimate domain)
        # 1 distance maps to 0.95
        # 2 distance maps to 0.70
        # 3 distance maps to 0.30
        # anything else maps to 0.0
        if min_dist == 0:
            result["risk_score"] = 0.0
            result["is_suspicious"] = False
        elif min_dist == 1:
            result["risk_score"] = 0.95
            result["is_suspicious"] = True
        elif min_dist == 2:
            result["risk_score"] = 0.70
            result["is_suspicious"] = True
        elif min_dist == 3:
            result["risk_score"] = 0.30
            result["is_suspicious"] = False  # edit distance 3 is generally not treated as immediate typosquatting
        else:
            result["risk_score"] = 0.0
            result["is_suspicious"] = False
            
        # Top 5 matches
        result["all_matches"] = [{"brand": item[0], "distance": item[1]} for item in matches_list[:5]]
        
        return result

# Facade function
_engine = None
def check_brand(domain: str) -> dict:
    global _engine
    if _engine is None:
        _engine = BrandEngine()
    return _engine.check_brand_similarity(domain)
