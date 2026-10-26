import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location("http2", pathlib.Path(__file__).with_name("enable-http2.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

BASE = """server {
    listen 80;
    server_name anshkosh.com;
    return 301 https://www.anshkosh.com$request_uri;
}
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.anshkosh.com;
    client_max_body_size 6m;
    ssl_protocols TLSv1.2 TLSv1.3;
    location /_next/static/ { alias /var/www/anshkosh-shared/static/; }
    location / { proxy_pass http://127.0.0.1:3012; }
}
"""


class Http2Test(unittest.TestCase):
    def test_changes_only_tls_listeners_and_is_idempotent(self):
        updated = module.updated_config(BASE)
        self.assertEqual(updated, BASE.replace("443 ssl;", "443 ssl http2;"))
        self.assertEqual(module.updated_config(updated), updated)

    def test_refuses_unrelated_domain_or_missing_route(self):
        for original in [BASE.replace("www.anshkosh.com;", "other.example;"), BASE.replace("proxy_pass", "unknown"), BASE.replace("alias", "unknown"), BASE.replace("443 ssl", "8443 ssl")]:
            with self.assertRaises(ValueError):
                module.updated_config(original)


if __name__ == "__main__":
    unittest.main()
