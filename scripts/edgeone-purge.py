#!/usr/bin/env python3
"""Invalidate this blog's EdgeOne cache and wait for completion (stdlib only)."""

import argparse
import datetime
import hashlib
import hmac
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field

API_HOST = "teo.tencentcloudapi.com"
API_VERSION = "2022-09-01"
BLOG_HOST = "pasule.com"


class PurgeError(RuntimeError):
    pass


@dataclass(frozen=True)
class Config:
    secret_id: str = field(repr=False)
    secret_key: str = field(repr=False)
    zone_id: str
    token: str = field(default="", repr=False)

    @classmethod
    def from_environment(cls):
        names = ("TENCENTCLOUD_SECRET_ID", "TENCENTCLOUD_SECRET_KEY", "EDGEONE_ZONE_ID")
        values = [os.environ.get(name, "").strip() for name in names]
        missing = [name for name, value in zip(names, values) if not value]
        if missing:
            raise PurgeError("Missing production secrets: " + ", ".join(missing))
        if not re.fullmatch(r"zone-[a-zA-Z0-9]+", values[2]):
            raise PurgeError("EDGEONE_ZONE_ID must be a site ID such as zone-xxxx.")
        return cls(*values, token=os.environ.get("TENCENTCLOUD_TOKEN", "").strip())


def signed_request(config, action, payload, timestamp=None):
    """Tencent Cloud TC3-HMAC-SHA256, signing content-type and host headers."""
    timestamp = int(time.time()) if timestamp is None else timestamp
    date = datetime.datetime.fromtimestamp(timestamp, datetime.timezone.utc).strftime("%Y-%m-%d")
    body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    content_type = "application/json; charset=utf-8"
    signed_headers = "content-type;host"
    canonical_headers = f"content-type:{content_type}\nhost:{API_HOST}\n"
    canonical_request = "\n".join((
        "POST", "/", "", canonical_headers, signed_headers, hashlib.sha256(body).hexdigest()
    ))
    scope = f"{date}/teo/tc3_request"
    string_to_sign = "\n".join((
        "TC3-HMAC-SHA256", str(timestamp), scope,
        hashlib.sha256(canonical_request.encode("utf-8")).hexdigest(),
    ))

    def digest(key, value):
        return hmac.new(key, value.encode("utf-8"), hashlib.sha256).digest()

    date_key = digest(("TC3" + config.secret_key).encode("utf-8"), date)
    service_key = digest(date_key, "teo")
    signing_key = digest(service_key, "tc3_request")
    signature = hmac.new(signing_key, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": content_type,
        "Host": API_HOST,
        "X-TC-Action": action,
        "X-TC-Version": API_VERSION,
        "X-TC-Timestamp": str(timestamp),
        "Authorization": (
            f"TC3-HMAC-SHA256 Credential={config.secret_id}/{scope}, "
            f"SignedHeaders={signed_headers}, Signature={signature}"
        ),
    }
    if config.token:
        headers["X-TC-Token"] = config.token
    return urllib.request.Request(f"https://{API_HOST}/", data=body, headers=headers, method="POST")


class EdgeOne:
    def __init__(self, config, open_request=urllib.request.urlopen):
        self.config = config
        self.open_request = open_request

    def call(self, action, payload, timeout=20):
        request = signed_request(self.config, action, payload)
        try:
            with self.open_request(request, timeout=timeout) as response:
                document = json.loads(response.read(1_048_576))
        except urllib.error.HTTPError as error:
            raise PurgeError(f"EdgeOne {action} returned HTTP {error.code}.") from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise PurgeError(f"EdgeOne {action} could not reach the API within the request timeout.") from None
        except (ValueError, UnicodeError):
            raise PurgeError(f"EdgeOne {action} returned invalid JSON.") from None
        result = document.get("Response") if isinstance(document, dict) else None
        if not isinstance(result, dict):
            raise PurgeError(f"EdgeOne {action} returned an invalid response.")
        if result.get("Error"):
            code = result["Error"].get("Code", "UnknownError")
            request_id = result.get("RequestId", "unavailable")
            raise PurgeError(f"EdgeOne {action}: {code}; request ID: {request_id}.")
        return result


def purge_and_wait(client, max_wait=300, clock=time.monotonic, sleep=time.sleep, log=print):
    zone_id = client.config.zone_id
    created = client.call("CreatePurgeTask", {
        "ZoneId": zone_id,
        "Type": "purge_host",
        "Method": "invalidate",
        "Targets": [BLOG_HOST],
    })
    if created.get("FailedList"):
        raise PurgeError("EdgeOne rejected one or more cache refresh targets.")
    job_id = created.get("JobId")
    if not isinstance(job_id, str) or not job_id:
        raise PurgeError("EdgeOne did not return a cache refresh task ID.")
    log(f"EdgeOne cache refresh submitted for {BLOG_HOST}: {job_id}")
    deadline = clock() + max_wait
    while clock() < deadline:
        result = client.call("DescribePurgeTasks", {
            "ZoneId": zone_id,
            "Filters": [{"Name": "job-id", "Values": [job_id]}],
            "Limit": 1000,
        }, timeout=min(20, max(1, deadline - clock())))
        tasks = result.get("Tasks") or []
        # Empty/eventually consistent results must not be treated as success.
        if any(task.get("JobId") != job_id for task in tasks):
            raise PurgeError("EdgeOne returned a different cache refresh task.")
        statuses = [task.get("Status") for task in tasks]
        terminal_failures = {"failed", "timeout", "canceled", "invalid"}
        if any(status in terminal_failures for status in statuses):
            raise PurgeError(f"EdgeOne cache refresh {job_id} failed; check its task history.")
        if tasks and len(tasks) == result.get("TotalCount") and all(status == "success" for status in statuses):
            log(f"EdgeOne cache refresh completed: {job_id}")
            return job_id
        log(f"Waiting for EdgeOne cache refresh {job_id}...")
        remaining = deadline - clock()
        if remaining > 0:
            sleep(min(5, remaining))
    raise PurgeError(f"EdgeOne cache refresh {job_id} did not finish within {max_wait}s.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate secrets only; make no API calls.")
    args = parser.parse_args()
    try:
        config = Config.from_environment()
        if args.check:
            print("EdgeOne credential configuration is present (not yet authenticated).")
        else:
            purge_and_wait(EdgeOne(config))
    except PurgeError as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
