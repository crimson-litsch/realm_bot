import { logger } from "./lib/logger";

const DEV_PORTAL = "https://developer.clashofclans.com/api";
const KEY_NAME = "realm-discord-bot";

let cachedToken: string | null = null;

async function getOutboundIp(): Promise<string> {
  const res = await fetch("https://api.ipify.org?format=json");
  const { ip } = await res.json() as { ip: string };
  return ip;
}

async function portalLogin(): Promise<{ token: string; cookie: string }> {
  const email = process.env["COC_EMAIL"];
  const password = process.env["COC_PASSWORD"];
  if (!email || !password) throw new Error("COC_EMAIL / COC_PASSWORD not set");

  const res = await fetch(`${DEV_PORTAL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CoC portal login failed ${res.status}: ${body}`);
  }

  const data = await res.json() as { temporaryAPIToken: string };
  const cookie = res.headers.get("set-cookie") ?? "";
  return { token: data.temporaryAPIToken, cookie };
}

interface PortalKey {
  id: string;
  name: string;
  key: string;
  cidrRanges: string[];
}

async function listKeys(cookie: string, token: string): Promise<PortalKey[]> {
  const res = await fetch(`${DEV_PORTAL}/apikey/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie,
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  const data = await res.json() as { keys: PortalKey[] };
  return data.keys ?? [];
}

async function createKey(cookie: string, token: string, ip: string): Promise<string> {
  const res = await fetch(`${DEV_PORTAL}/apikey/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie,
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: KEY_NAME,
      description: "Auto-managed by Realm Discord bot",
      cidrRanges: [ip],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create CoC API key: ${body}`);
  }

  const data = await res.json() as { key: PortalKey };
  return data.key.key;
}

async function revokeKey(cookie: string, token: string, keyId: string): Promise<void> {
  await fetch(`${DEV_PORTAL}/apikey/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie,
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ id: keyId }),
  });
}

export async function initCocToken(): Promise<void> {
  try {
    const ip = await getOutboundIp();
    logger.info({ ip }, "Outbound IP — use this for CoC API key whitelist");

    const { token: portalToken, cookie } = await portalLogin();
    const keys = await listKeys(cookie, portalToken);

    const existing = keys.find((k) => k.cidrRanges.includes(ip));

    if (existing) {
      cachedToken = existing.key;
      logger.info({ name: existing.name }, "CoC API key already valid for current IP — reusing");
      return;
    }

    const botKeys = keys.filter((k) => k.name === KEY_NAME);
    for (const old of botKeys) {
      await revokeKey(cookie, portalToken, old.id);
      logger.info({ id: old.id }, "Revoked stale CoC API key");
    }

    const newApiToken = await createKey(cookie, portalToken, ip);
    cachedToken = newApiToken;
    logger.info({ ip }, "Created new CoC API key for current IP");
  } catch (err) {
    logger.error({ err }, "Auto CoC token rotation failed — falling back to COC_API_TOKEN env var");
    cachedToken = process.env["COC_API_TOKEN"] ?? null;
  }
}

export function getCocToken(): string {
  if (!cachedToken) {
    const fallback = process.env["COC_API_TOKEN"];
    if (!fallback) throw new Error("No CoC API token available");
    return fallback;
  }
  return cachedToken;
}
