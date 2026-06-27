import unittest
import os
import sys
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app, get_db
from db.models import Base
from db.session import sync_engine

# Create a mock database session to prevent actual database write failures during local testing
class MockSession:
    def add(self, obj):
        pass
    async def commit(self):
        pass
    async def rollback(self):
        pass
    async def refresh(self, obj):
        obj.scanned_at = datetime.now(timezone.utc)

async def override_get_db():
    yield MockSession()

# Apply the dependency override
app.dependency_overrides[get_db] = override_get_db

class TestAPI(unittest.TestCase):
    def setUp(self):
        # Create SQLite tables for background tasks queries during tests
        Base.metadata.create_all(bind=sync_engine)
        self.client = TestClient(app)

    def tearDown(self):
        # Clear tables
        Base.metadata.drop_all(bind=sync_engine)

    def test_scan_fast_phase(self):
        # Test scanning a URL
        response = self.client.post("/api/scan", json={"url": "http://google.com"})
        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        self.assertIn("scan_id", res_json)
        self.assertIn("verdict", res_json)
        self.assertIn("confidence", res_json)
        self.assertIn("stream_url", res_json)
        self.assertEqual(res_json["verdict"], "SAFE") # Lexical check on google.com should be SAFE

    def test_bulk_scan(self):
        # Mock CSV contents
        csv_content = "url\nhttp://google.com\nhttp://yahoo.com\n"
        files = {"file": ("test.csv", csv_content, "text/csv")}
        response = self.client.post("/api/scan/bulk", files=files)
        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        self.assertIn("summary", res_json)
        self.assertIn("scans", res_json)
        self.assertEqual(len(res_json["scans"]), 2)

    def test_email_scan(self):
        email_body = "Hello, please click here http://evil.com/login and also check http://google.com for safety."
        response = self.client.post("/api/scan/email", json={"email_text": email_body})
        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        self.assertIn("total_links_found", res_json)
        self.assertIn("scans", res_json)
        self.assertEqual(res_json["total_links_found"], 2)

if __name__ == "__main__":
    unittest.main()
