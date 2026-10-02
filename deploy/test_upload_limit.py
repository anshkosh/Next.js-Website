import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location("upload_limit", pathlib.Path(__file__).with_name("set-upload-limit.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class UploadLimitTest(unittest.TestCase):
    def test_preserves_routing_and_adds_scoped_limits(self):
        original = "server {\n server_name anshkosh.com www.anshkosh.com;\n location / { proxy_pass http://127.0.0.1:3000; }\n}\n"
        result = module.updated_config(original)
        self.assertIn("client_max_body_size 6m;", result)
        self.assertIn("proxy_pass http://127.0.0.1:3000;", result)

    def test_replaces_narrower_limits_and_is_idempotent(self):
        original = "server {\n server_name www.anshkosh.com anshkosh.com;\n client_max_body_size 1m;\n location / {\n client_max_body_size 2m;\n }\n}\n"
        result = module.updated_config(original)
        self.assertEqual(result.count("client_max_body_size"), 1)
        self.assertEqual(module.updated_config(result), result)

    def test_refuses_unrelated_or_missing_domain_config(self):
        for original in ["server { server_name other.example; }", "# no servers", "server_name *.anshkosh.com;"]:
            with self.assertRaises(ValueError):
                module.updated_config(original)


if __name__ == "__main__":
    unittest.main()
