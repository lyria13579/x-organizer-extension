import assert from "node:assert/strict";
import test from "node:test";
import {
  applyClassificationPayload,
  chatCompletion,
  extractJson,
  parseClassificationPayload,
  parseLibraryAnswerPayload,
  requestLibraryAnswer
} from "../src/aiClient.js";
import { buildProviderUrl, normalizeAiSettings, validateConfigShape } from "../src/providers.js";

test("buildProviderUrl joins base URL and endpoint", () => {
  assert.equal(
    buildProviderUrl("https://api.openai.com/v1/", "/models"),
    "https://api.openai.com/v1/models"
  );
});

test("validateConfigShape rejects missing or unsafe config", () => {
  assert.throws(() => validateConfigShape(normalizeAiSettings({ apiKey: "" })), /missing_api_key/);
  assert.throws(
    () => validateConfigShape(normalizeAiSettings({ apiKey: "sk-test", baseUrl: "http://example.com" })),
    /invalid_base_url/
  );
});

test("extractJson accepts fenced model output", () => {
  const payload = extractJson("```json\n{\"items\":[{\"id\":\"1\"}]}\n```");
  assert.deepEqual(payload.items, [{ id: "1" }]);
});

test("parseClassificationPayload normalizes item field names", () => {
  const payload = parseClassificationPayload(JSON.stringify({
    categories: [{ id: "ai", name: "AI" }],
    classifications: [{ id: "1", category_id: "ai" }]
  }));

  assert.equal(payload.categories.length, 1);
  assert.equal(payload.items.length, 1);
});

test("parseLibraryAnswerPayload normalizes answer item ids", () => {
  const payload = parseLibraryAnswerPayload(JSON.stringify({
    answer: "Found design posts.",
    results: [{ post_id: "42", why: "Mentions layout systems" }]
  }));

  assert.equal(payload.answer, "Found design posts.");
  assert.deepEqual(payload.items, [{ id: "42", reason: "Mentions layout systems" }]);
});

test("applyClassificationPayload updates matching posts only", () => {
  const posts = [
    { id: "1", text: "AI workflow", tags: [], score: 0 },
    { id: "2", text: "Other", tags: [], score: 0 }
  ];
  const updated = applyClassificationPayload(posts, {
    categories: [{ id: "ai_tools", name: "AI Tools" }],
    items: [{
      id: "1",
      category_id: "ai_tools",
      summary: "Workflow summary",
      tags: ["AI"],
      confidence: 0.9,
      recommended_score: 88
    }]
  });

  assert.equal(updated[0].categoryId, "ai_tools");
  assert.equal(updated[0].categoryName, "AI Tools");
  assert.equal(updated[0].classificationSource, "ai");
  assert.equal(updated[1].categoryId, undefined);
});

test("requestLibraryAnswer rejects empty questions before requesting the provider", async () => {
  await assert.rejects(
    requestLibraryAnswer({
      apiKey: "sk-test",
      baseUrl: "https://api.example.com/v1",
      model: "test-model"
    }, "   ", []),
    /missing_question/
  );
});

test("chatCompletion normalizes aborted provider requests", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const error = new Error("signal is aborted without reason");
    error.name = "AbortError";
    throw error;
  };

  try {
    await assert.rejects(
      chatCompletion({
        apiKey: "sk-test",
        baseUrl: "https://api.example.com/v1",
        model: "test-model"
      }, [{ role: "user", content: "hello" }], { timeoutMs: 1000 }),
      /request_timeout/
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});
