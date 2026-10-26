import importlib.util
import pathlib
import subprocess
import tempfile
import types
import unittest
from unittest.mock import patch

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

    def run_helper(self, fail_validation=False):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory).resolve()
            config = root / "anshkosh.conf"
            config.write_text(BASE)
            backups = root / "backups"
            calls = []
            failed = False

            # This signature deliberately matches the Python 3.6 subprocess API.
            def legacy_run(args, check=False, stdout=None, stderr=None, universal_newlines=False):
                nonlocal failed
                calls.append(args)
                if fail_validation and args == ["/usr/sbin/nginx", "-t"] and not failed:
                    failed = True
                    raise subprocess.CalledProcessError(1, args)
                return types.SimpleNamespace(stdout="", stderr="--with-http_v2_module")

            fcntl = types.SimpleNamespace(flock=lambda *_: None, LOCK_EX=2, LOCK_NB=4)
            with patch.object(module, "CONFIG", config), patch.object(module, "BACKUPS", backups), \
                    patch.object(module, "LOCK", root / "deploy.lock"), \
                    patch.object(module.os, "geteuid", return_value=0, create=True), \
                    patch.object(module.subprocess, "run", side_effect=legacy_run), \
                    patch.dict("sys.modules", {"fcntl": fcntl}):
                if fail_validation:
                    with self.assertRaises(subprocess.CalledProcessError):
                        module.main()
                else:
                    module.main()
            self.assertEqual(len(list(backups.iterdir())), 1)
            self.assertEqual(next(backups.iterdir()).read_text(), BASE)
            return config.read_text(), calls

    def test_python36_compatible_activation_preserves_backup(self):
        updated, calls = self.run_helper()
        self.assertEqual(updated, BASE.replace("443 ssl;", "443 ssl http2;"))
        self.assertEqual(calls.count(["/usr/bin/systemctl", "reload", "nginx"]), 1)

    def test_validation_failure_restores_the_original_before_reload(self):
        restored, calls = self.run_helper(fail_validation=True)
        self.assertEqual(restored, BASE)
        self.assertEqual(calls.count(["/usr/sbin/nginx", "-t"]), 2)
        self.assertEqual(calls.count(["/usr/bin/systemctl", "reload", "nginx"]), 1)


if __name__ == "__main__":
    unittest.main()
