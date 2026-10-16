// Run as root on the origin before exposing the API through Nginx.
import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const endpoint = "http://127.0.0.1:18090/";
const credentialPath = "/root/pasule-twikoo-admin.txt";
const md5 = (value) => createHash("md5").update(value).digest("hex");

async function call(event, payload = {}) {
	const response = await fetch(endpoint, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ event, ...payload }),
		signal: AbortSignal.timeout(15000),
	});
	if (!response.ok) throw new Error(`${event}: HTTP ${response.status}`);
	const result = await response.json();
	if (result.code !== 0)
		throw new Error(`${event}: ${result.message || result.code}`);
	return result;
}

const status = await call("GET_PASSWORD_STATUS");
let password;
try {
	password = (await readFile(credentialPath, "utf8")).trim();
} catch (error) {
	if (error.code !== "ENOENT") throw error;
	if (status.status)
		throw new Error("An administrator already exists; refusing to reset it.");
	password = randomBytes(24).toString("base64url");
	await writeFile(credentialPath, `${password}\n`, { mode: 0o600, flag: "wx" });
}

const accessToken = md5(password);
if (!status.status) await call("SET_PASSWORD", { password: accessToken });
await call("LOGIN", { password: accessToken });
await call("SET_CONFIG", {
	accessToken,
	config: {
		SITE_NAME: "Pasule Blog",
		SITE_URL: "https://pasule.com",
		BLOGGER_NICK: "Pasule",
		CORS_ALLOW_ORIGIN:
			"https://pasule.com,https://www.pasule.com,https://pasule-blog.pages.dev",
		COMMENT_PLACEHOLDER: "欢迎留言交流～ 支持 Markdown，邮箱不会公开显示。",
		REQUIRED_FIELDS: "nick,mail",
		SHOW_REGION: "false",
		HIGHLIGHT: "false",
		SHOW_IMAGE: "false",
		LIMIT_PER_MINUTE: "5",
		LIMIT_LENGTH: "2000",
	},
});
console.log(
	`Twikoo initialized; administrator password saved privately at ${credentialPath}.`,
);
