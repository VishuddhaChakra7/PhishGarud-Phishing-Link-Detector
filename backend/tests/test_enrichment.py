import unittest
import os
import sys

# Ensure backend directory is in the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from enrichment.whois import check_whois
from enrichment.ssl_inspector import check_ssl
from enrichment.redirect_tracer import trace_redirects
from enrichment.page_analyzer import analyze_page
from enrichment.brand_engine import check_brand
from enrichment.brand_engine import BrandEngine
from enrichment.threat_feeds import check_threat_feeds

class TestEnrichment(unittest.TestCase):
    def test_whois_parsing(self):
        # Test whois on google.com (a very stable domain)
        print("Testing WHOIS...")
        res = check_whois("google.com")
        self.assertIn("registered_date", res)
        self.assertNotEqual(res["domain_age_days"], -1)
        self.assertEqual(res["error"], None)

    def test_ssl_inspector(self):
        # Test SSL inspection on google.com
        print("Testing SSL inspector...")
        res = check_ssl("google.com")
        self.assertIn("issuer", res)
        self.assertIsNotNone(res["issuer"])
        self.assertEqual(res["error"], None)

    def test_redirect_tracer(self):
        # Test redirect tracing on a domain that redirects, e.g. http://google.com -> https://www.google.com/
        print("Testing redirect tracer...")
        res = trace_redirects("http://google.com")
        self.assertIn("hops", res)
        self.assertGreaterEqual(res["hop_count"], 0)
        self.assertEqual(res["error"], None)

    def test_page_analyzer(self):
        # Test parsing raw HTML content
        print("Testing page analyzer...")
        html = """
        <html>
            <head><link rel="shortcut icon" href="http://otherdomain.com/fav.ico"></head>
            <body>
                <form action="https://external-login.com/post" method="POST">
                    <input type="text" name="username">
                    <input type="password" name="password">
                </form>
                <iframe></iframe>
                <script>
                    document.oncontextmenu = function() { return false; };
                </script>
            </body>
        </html>
        """
        res = analyze_page("https://mypagedomain.com", html_content=html)
        self.assertTrue(res["has_login_form"])
        self.assertTrue(res["form_action_is_external"])
        self.assertEqual(res["count_iframes"], 1)
        self.assertTrue(res["has_favicon_from_external"])
        self.assertTrue(res["right_click_disabled"])

    def test_brand_engine(self):
        print("Testing brand engine...")
        # Test exact match
        engine = BrandEngine()
        # Mock brands list for testing
        engine.brands = ["paypal", "google", "amazon", "microsoft"]
        
        # Test brand matching distance
        res_exact = engine.check_brand_similarity("paypal")
        self.assertEqual(res_exact["best_match"], "paypal")
        self.assertEqual(res_exact["distance"], 0)
        self.assertEqual(res_exact["risk_score"], 0.0)
        self.assertFalse(res_exact["is_suspicious"])

        # Test typosquatting (distance 1)
        res_typo = engine.check_brand_similarity("paypa1")
        self.assertEqual(res_typo["best_match"], "paypal")
        self.assertEqual(res_typo["distance"], 1)
        self.assertEqual(res_typo["risk_score"], 0.95)
        self.assertTrue(res_typo["is_suspicious"])

    def test_threat_feeds(self):
        print("Testing threat feeds...")
        res = check_threat_feeds("http://example.com")
        self.assertIn("is_phishing", res)

if __name__ == "__main__":
    unittest.main()
