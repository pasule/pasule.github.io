// Run as root on the origin. The temporary, unlisted test comment is removed.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

const endpoint = "http://127.0.0.1:18090/";
const password = (
	await readFile("/root/pasule-twikoo-admin.txt", "utf8")
).trim();
const adminToken = createHash("md5").update(password).digest("hex");
const visitorToken = randomUUID().replaceAll("-", "");
const path = `/__twikoo-verification-${randomUUID()}`;

async function request(event, payload = {}, target = endpoint) {
	const response = await fetch(target, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: "https://pasule.com",
		},
		body: JSON.stringify({ event, ...payload }),
		signal: AbortSignal.timeout(20000),
	});
	assert.equal(response.status, 200, `${event}: HTTP status`);
	return response.json();
}

const publicConfig = await request("GET_CONFIG");
assert.equal(publicConfig.code, 0);
assert.ok(!("ADMIN_PASS" in publicConfig.config));
const denied = await request("SET_PASSWORD", {
	password: "unauthorized-verification",
});
assert.notEqual(
	denied.code,
	0,
	"Anonymous users must not reset the administrator password",
);

let id;
try {
	const created = await request("COMMENT_SUBMIT", {
		accessToken: visitorToken,
		url: path,
		href: `https://pasule.com${path}`,
		nick: "Twikoo deployment verification",
		mail: "verification@example.invalid",
		comment: "<p>Temporary persistence test; automatically removed.</p>",
		ua: "Twikoo deployment verification",
	});
	assert.equal(created.code, 0, "Comment submission");
	id = created.id;
	assert.ok(id, "Created comment ID");

	execFileSync("systemctl", ["restart", "pasule-twikoo"]);
	for (let attempt = 0; ; attempt++) {
		try {
			const response = await fetch(`${endpoint}ping`);
			assert.equal(response.status, 200);
			break;
		} catch (error) {
			if (attempt >= 15) throw error;
			await setTimeout(250);
		}
	}
	const comments = await request("COMMENT_GET", { url: path });
	assert.equal(comments.code, 0);
	assert.equal(comments.count, 1, "Comment survives a service restart");
	assert.equal(comments.data[0].id, id);
	console.log(
		"PASS: public config privacy, administrator protection, comment write/read and restart persistence.",
	);
} finally {
	if (id) {
		const deleted = await request("COMMENT_DELETE_FOR_ADMIN", {
			id,
			accessToken: adminToken,
		});
		assert.equal(deleted.code, 0, "Remove temporary verification comment");
		const remaining = await request("COMMENT_GET", { url: path });
		assert.equal(remaining.count, 0);
		console.log("PASS: temporary verification comment removed.");
	}
}
