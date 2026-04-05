const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8001";

const parseJson = async (response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
};

try {
  const response = await fetch(`${aiServiceUrl}/health`);
  const body = await parseJson(response);
  const ok = response.ok && body?.status === "ok" && body?.service === "ai-service";

  console.log(`[${ok ? "PASS" : "FAIL"}] ai-service health - status=${response.status}`);

  if (!ok) {
    process.exit(1);
  }

  console.log("\nAI service smoke summary: 1/1 passed");
} catch (error) {
  console.log(`[FAIL] ai-service health - ${error instanceof Error ? error.message : String(error)}`);
  console.log("\nAI service smoke summary: 0/1 passed");
  process.exit(1);
}

