"""Offline regression tests; never use production credentials or call the API."""

import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
import urllib.error

spec = importlib.util.spec_from_file_location("edgeone_purge", Path(__file__).with_name("edgeone-purge.py"))
purge = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = purge
spec.loader.exec_module(purge)

CONFIG = purge.Config("example-id", "example-key", "zone-test123")
JOB_ID = "job-test123"


def tasks(*statuses, total=None, job_id=JOB_ID):
    return {
        "TotalCount": len(statuses) if total is None else total,
        "Tasks": [{"JobId": job_id, "Status": status} for status in statuses],
    }


class FakeClient:
    config = CONFIG

    def __init__(self, *responses):
        self.responses = iter(responses)
        self.calls = []

    def call(self, action, payload, timeout=20):
        self.calls.append((action, payload, timeout))
        return next(self.responses)


class FakeClock:
    now = 0

    def time(self):
        return self.now

    def sleep(self, seconds):
        self.now += seconds


class PurgeTests(unittest.TestCase):
    def run_refresh(self, client, max_wait=20):
        clock = FakeClock()
        return purge.purge_and_wait(client, max_wait=max_wait, clock=clock.time,
                                    sleep=clock.sleep, log=lambda _: None)

    def test_only_refreshes_blog_host_and_queries_its_job(self):
        client = FakeClient({"JobId": JOB_ID}, tasks("success"))
        self.assertEqual(self.run_refresh(client), JOB_ID)
        self.assertEqual(client.calls[0][:2], ("CreatePurgeTask", {
            "ZoneId": CONFIG.zone_id, "Type": "purge_host",
            "Method": "invalidate", "Targets": ["pasule.com"],
        }))
        self.assertEqual(client.calls[1][1], {
            "ZoneId": CONFIG.zone_id,
            "Filters": [{"Name": "job-id", "Values": [JOB_ID]}], "Limit": 1000,
        })

    def test_waits_for_visibility_and_all_tasks_to_succeed(self):
        client = FakeClient({"JobId": JOB_ID}, tasks(), tasks("processing"),
                            tasks("success", total=2), tasks("success", "success"))
        self.assertEqual(self.run_refresh(client), JOB_ID)
        self.assertEqual(len(client.calls), 5)

    def test_empty_tasks_are_not_success(self):
        client = FakeClient({"JobId": JOB_ID}, tasks(), tasks())
        with self.assertRaisesRegex(purge.PurgeError, "did not finish"):
            self.run_refresh(client, max_wait=10)

    def test_processing_has_bounded_deadline(self):
        client = FakeClient({"JobId": JOB_ID}, tasks("processing"), tasks("processing"))
        with self.assertRaisesRegex(purge.PurgeError, "within 10s"):
            self.run_refresh(client, max_wait=10)

    def test_terminal_failure_is_not_success(self):
        for status in ("failed", "timeout", "canceled", "invalid"):
            with self.subTest(status=status):
                client = FakeClient({"JobId": JOB_ID}, tasks(status))
                with self.assertRaisesRegex(purge.PurgeError, "failed"):
                    self.run_refresh(client)

    def test_rejected_targets_stop_before_polling(self):
        client = FakeClient({"JobId": JOB_ID, "FailedList": ["pasule.com"]})
        with self.assertRaisesRegex(purge.PurgeError, "rejected"):
            self.run_refresh(client)
        self.assertEqual(len(client.calls), 1)

    def test_missing_job_id_is_not_success(self):
        for result in ({}, {"JobId": ""}, {"JobId": 123}):
            with self.subTest(result=result):
                with self.assertRaisesRegex(purge.PurgeError, "task ID"):
                    self.run_refresh(FakeClient(result))

    def test_unrelated_job_is_not_success(self):
        with self.assertRaisesRegex(purge.PurgeError, "different"):
            self.run_refresh(FakeClient({"JobId": JOB_ID}, tasks("success", job_id="other-job")))


class ConfigurationTests(unittest.TestCase):
    def test_missing_secrets_fail_without_printing_values(self):
        with patch.dict(os.environ, {"TENCENTCLOUD_SECRET_ID": "private-value"}, clear=True):
            with self.assertRaises(purge.PurgeError) as raised:
                purge.Config.from_environment()
        self.assertIn("TENCENTCLOUD_SECRET_KEY", str(raised.exception))
        self.assertNotIn("private-value", str(raised.exception))

    def test_invalid_zone_is_rejected(self):
        with patch.dict(os.environ, {
            "TENCENTCLOUD_SECRET_ID": "example-id", "TENCENTCLOUD_SECRET_KEY": "example-key",
            "EDGEONE_ZONE_ID": "pasule.com",
        }, clear=True):
            with self.assertRaisesRegex(purge.PurgeError, "site ID"):
                purge.Config.from_environment()

    def test_config_repr_omits_credentials(self):
        self.assertNotIn("example-id", repr(CONFIG))
        self.assertNotIn("example-key", repr(CONFIG))

    def test_check_is_offline(self):
        with patch.object(purge.Config, "from_environment", return_value=CONFIG), \
                patch.object(purge.EdgeOne, "call") as call, \
                patch.object(sys, "argv", ["edgeone-purge.py", "--check"]), \
                patch("sys.stdout", new_callable=io.StringIO):
            self.assertEqual(purge.main(), 0)
        call.assert_not_called()


class RequestTests(unittest.TestCase):
    def test_tc3_signature_matches_independent_node_crypto_fixture(self):
        request = purge.signed_request(CONFIG, "CreatePurgeTask", {
            "ZoneId": CONFIG.zone_id, "Type": "purge_host",
            "Method": "invalidate", "Targets": ["pasule.com"],
        }, timestamp=1551113065)
        self.assertEqual(request.full_url, "https://teo.tencentcloudapi.com/")
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.get_header("X-tc-version"), "2022-09-01")
        self.assertEqual(request.get_header("Authorization"),
                         "TC3-HMAC-SHA256 Credential=example-id/2019-02-25/teo/tc3_request, "
                         "SignedHeaders=content-type;host, "
                         "Signature=1795fb0d796ab9aa271c6a4b8c848e949e3c407a5ec83984b8995499c3c4f078")

    def test_optional_temporary_token_is_sent(self):
        request = purge.signed_request(purge.Config("id", "key", "zone-test", "example-token"),
                                       "DescribePurgeTasks", {}, timestamp=1551113065)
        self.assertEqual(request.get_header("X-tc-token"), "example-token")

    def test_valid_api_response(self):
        def open_request(request, timeout):
            self.assertEqual(timeout, 7)
            return io.BytesIO(json.dumps({"Response": {"JobId": JOB_ID}}).encode())
        self.assertEqual(purge.EdgeOne(CONFIG, open_request).call("CreatePurgeTask", {}, 7),
                         {"JobId": JOB_ID})

    def test_api_error_message_does_not_leak_credentials(self):
        body = json.dumps({"Response": {"Error": {
            "Code": "AuthFailure.SignatureFailure", "Message": "example-key must stay private",
        }, "RequestId": "test-request"}}).encode()
        client = purge.EdgeOne(CONFIG, lambda *args, **kwargs: io.BytesIO(body))
        with self.assertRaisesRegex(purge.PurgeError, "AuthFailure.SignatureFailure") as raised:
            client.call("CreatePurgeTask", {})
        self.assertIn("test-request", str(raised.exception))
        self.assertNotIn("example-key", str(raised.exception))

    def test_network_errors_are_sanitized(self):
        for error in (urllib.error.URLError("example-key"), TimeoutError("example-key"),
                      urllib.error.HTTPError("https://example-key", 403, "example-key", {}, None)):
            with self.subTest(error=type(error).__name__):
                def open_request(*args, **kwargs):
                    raise error
                with self.assertRaises(purge.PurgeError) as raised:
                    purge.EdgeOne(CONFIG, open_request).call("CreatePurgeTask", {})
                self.assertNotIn("example-key", str(raised.exception))

    def test_invalid_responses_are_rejected(self):
        for body in (b"not-json", b"[]", b"{}", b'{"Response": null}'):
            with self.subTest(body=body):
                client = purge.EdgeOne(CONFIG, lambda *args, **kwargs: io.BytesIO(body))
                with self.assertRaises(purge.PurgeError):
                    client.call("CreatePurgeTask", {})


if __name__ == "__main__":
    unittest.main()
