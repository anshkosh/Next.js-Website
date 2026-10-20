import tempfile
import gzip
from pathlib import Path
import unittest

from redact_auth_log import inspect_log, redact_line, write_redacted_archive, apply_archive_redaction


class AuthLogRedactionTests(unittest.TestCase):
    def test_rotated_archive_preserves_all_records_and_compression(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "original.gz"
            target = Path(folder) / "redacted.gz"
            original = b'/discover?q=normal\n/login?email=fixture&password=synthetic HTTP/1.1\n'
            with gzip.open(source, "wb") as output:
                output.write(original)
            self.assertEqual(inspect_log(source)["exposed_records"], 1)
            self.assertEqual(write_redacted_archive(source, target), (2, 1))
            self.assertEqual(inspect_log(target)["exposed_records"], 0)
            with gzip.open(target, "rb") as result:
                self.assertEqual(result.read(), b'/discover?q=normal\n/login?email=REDACTED&password=REDACTED HTTP/1.1\n')
            self.assertEqual(inspect_log(source)["exposed_records"], 1)

    def test_archive_apply_rejects_paths_outside_exact_log_directory(self):
        for value in ["/tmp/access.log-20261020.gz", "/var/log/nginx/access.log", "/var/log/nginx/other.gz", "/var/log/nginx/../access.log-20261020.gz"]:
            with self.assertRaises(RuntimeError):
                apply_archive_redaction(Path(value), 1, "fixture")
    def test_preserves_records_and_redacts_only_credentials_on_exposed_lines(self):
        line = '192.0.2.1 - - [date] "GET /login?email=test%40example.test&password=synthetic&next=%2Fdashboard HTTP/1.1" 200 42 "-" "Browser"\n'
        clean, changed = redact_line(line)
        self.assertTrue(changed)
        self.assertNotIn("synthetic", clean)
        self.assertNotIn("test%40example.test", clean)
        self.assertIn("next=%2Fdashboard HTTP/1.1", clean)
        self.assertTrue(clean.endswith('200 42 "-" "Browser"\n'))
        self.assertEqual(redact_line(clean), (clean, False))

    def test_encoded_referer_and_query_order_are_supported(self):
        clean, changed = redact_line('/register?password=synthetic&email=a%40example.test "https://example.test/login?name=Tester%26PASSWORD%3Dsecret%26next%3Dhome"')
        self.assertTrue(changed)
        self.assertNotIn("secret", clean)
        self.assertNotIn("synthetic", clean)
        self.assertIn('"https://example.test/login?', clean)

    def test_encoded_ampersands_do_not_leave_a_password_suffix(self):
        clean, changed = redact_line('/login?password=first%26second%26third&next=home')
        self.assertTrue(changed)
        for part in ["first", "second", "third"]:
            self.assertNotIn(part, clean)
        self.assertIn("&next=home", clean)
        clean, changed = redact_line('"https://example.test/login%3Femail%3Da%2540example.test%26password%3Dhidden%26next%3Dhome"')
        self.assertTrue(changed)
        self.assertNotIn("hidden", clean)

    def test_normal_requests_and_empty_passwords_are_unchanged(self):
        for line in ['/search?q=password', '/contact?email=public@example.test', '/login?password=']:
            self.assertEqual(redact_line(line), (line, False))

    def test_preview_never_changes_file_and_returns_no_values(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "fixture.log"
            original = b'/login?password=synthetic\n/discover?q=normal\n'
            path.write_bytes(original)
            result = inspect_log(path)
            self.assertEqual(result["exposed_records"], 1)
            self.assertEqual(result["records"], 2)
            self.assertNotIn("synthetic", str(result))
            self.assertEqual(path.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
