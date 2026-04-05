const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:4000";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@democlub.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "password123";

const results = [];

const logResult = (name, ok, detail) => {
  const status = ok ? "PASS" : "FAIL";
  results.push({ name, ok, detail });
  console.log(`[${status}] ${name}${detail ? ` - ${detail}` : ""}`);
};

const parseJson = async (response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
};

const requestJson = async (path, init) => {
  const response = await fetch(`${backendUrl}${path}`, init);
  const body = await parseJson(response);
  return { response, body };
};

let token = null;

try {
  const { response, body } = await requestJson("/api/health");
  const ok = response.ok && body?.status === "ok" && body?.service === "backend";
  logResult("backend health", ok, `status=${response.status}`);
} catch (error) {
  logResult("backend health", false, error instanceof Error ? error.message : String(error));
}

try {
  const { response, body } = await requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  token = body?.token ?? null;
  const ok = response.ok && typeof token === "string" && token.length > 20;
  logResult("backend login", ok, `status=${response.status}`);
} catch (error) {
  logResult("backend login", false, error instanceof Error ? error.message : String(error));
}

try {
  if (!token) {
    throw new Error("Token not available from login step");
  }

  const { response, body } = await requestJson("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const ok = response.ok && body?.user?.email === adminEmail && typeof body?.club?.id === "string";
  logResult("backend auth/me", ok, `status=${response.status}`);
} catch (error) {
  logResult("backend auth/me", false, error instanceof Error ? error.message : String(error));
}

try {
  if (!token) {
    throw new Error("Token not available from login step");
  }

  const { response, body } = await requestJson("/api/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const ok =
    response.ok &&
    body?.message === "Protected dashboard route ready" &&
    typeof body?.context?.clubId === "string";

  logResult("backend dashboard", ok, `status=${response.status}`);
} catch (error) {
  logResult("backend dashboard", false, error instanceof Error ? error.message : String(error));
}

const failed = results.filter((item) => !item.ok);

console.log(`\nBackend smoke summary: ${results.length - failed.length}/${results.length} passed`);

if (failed.length > 0) {
  process.exit(1);
}

