import unittest
import os
import sys

# Ensure backend directory is in the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features import FeatureExtractor

class TestFeatureExtractor(unittest.TestCase):
    def setUp(self):
        self.extractor = FeatureExtractor()

    def test_lexical_feature_keys(self):
        # Verify exactly 30 features are returned
        features = self.extractor.extract_lexical("http://example.com")
        self.assertEqual(len(features), 30)

    def test_url_lengths(self):
        url = "http://www.example.com/path/to/page.html?query=1#hash"
        features = self.extractor.extract_lexical(url)
        self.assertEqual(features["url_length"], len(url))
        self.assertEqual(features["hostname_length"], len("www.example.com"))
        self.assertEqual(features["path_length"], len("/path/to/page.html"))
        self.assertEqual(features["query_length"], len("query=1"))
        self.assertEqual(features["fragment_length"], len("hash"))

    def test_ip_address(self):
        url_ip = "http://192.168.1.1/login"
        features = self.extractor.extract_lexical(url_ip)
        self.assertEqual(features["has_ip_address"], 1)

        url_normal = "http://google.com/search"
        features_normal = self.extractor.extract_lexical(url_normal)
        self.assertEqual(features_normal["has_ip_address"], 0)

    def test_is_shortened(self):
        url_short = "https://bit.ly/xyz123"
        features = self.extractor.extract_lexical(url_short)
        self.assertEqual(features["is_shortened"], 1)

        url_normal = "https://google.com/search"
        features_normal = self.extractor.extract_lexical(url_normal)
        self.assertEqual(features_normal["is_shortened"], 0)

    def test_at_sign(self):
        url_at = "http://legitimate.com@evil.com/login"
        features = self.extractor.extract_lexical(url_at)
        self.assertEqual(features["has_at_in_url"], 1)
        self.assertEqual(features["count_at_signs"], 1)

    def test_double_slash_in_path(self):
        url = "http://example.com/path//to//page"
        features = self.extractor.extract_lexical(url)
        self.assertEqual(features["double_slash_in_path"], 1)

    def test_port(self):
        url_port = "http://localhost:8080/dashboard"
        features = self.extractor.extract_lexical(url_port)
        self.assertEqual(features["has_port"], 1)
        self.assertEqual(features["port_number"], 8080)

    def test_tld_in_path(self):
        url = "http://example.com/download/file.com/setup"
        features = self.extractor.extract_lexical(url)
        self.assertEqual(features["tld_in_path"], 1)

    def test_subdomain_is_ip_like(self):
        url = "http://123.456.78.com/login"
        features = self.extractor.extract_lexical(url)
        self.assertEqual(features["subdomain_is_ip_like"], 1)

if __name__ == "__main__":
    unittest.main()
