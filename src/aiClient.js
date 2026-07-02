import { buildLlmClassificationPrompt } from "./llmPrompt.js";
import {
  buildProviderUrl,
  makeAuthHeaders,
  normalizeAiSettings,
  providerDisplayName,
  validateConfigShape
} from "./providers.js";

export async function validateProviderConfig(rawConfig, options = {}) {
  const config = normalizeAiSettings(rawConfig);
  validateConfigShape(config);

  try {
    const models = await listModels(config, options);
    return {
      ok: true,
      providerName: providerDisplayName(config),
      checkedAt: new Date().toISOString(),
      message: models.length
        ? `validated_models:${models.slice(0, 5).join(",")}`
        : "validated_models"
    };
  } catch (error) {
    if (shouldFallbackToChat(error) && config.model) {
      await testChatCompletion(config, options);
      return {
        ok: true,
        providerName: providerDisplayName(config),
        checkedAt: new Date().toISOString(),
        message: "validated_chat"
      };
    }
    throw error;
  }
}

export async function listModels(rawConfig, options = {}) {
  const config = normalizeAiSettings(rawConfig);
  const response = await fetchWithTimeout(buildProviderUrl(config.baseUrl, "/models"), {
    method: "GET",
    headers: makeAuthHeaders(config),
    signal: options.signal
  }, options.timeoutMs);

  if (!response.ok) {
    throw await providerError(response, "models_request_failed");
  }

  const json = await response.json();
  const rows = Array.isArray(json.data)
    ? json.data
    : Array.isArray(json.models)
      ? json.models
      : Array.isArray(json)
        ? json
        : [];

  return rows.map((model) => typeof model === "string" ? model : model.id).filter(Boolean);
}

export async function requestAiClassification(rawConfig, posts, categories, language = "zh") {
  const config = normalizeAiSettings(rawConfig);
  validateConfigShape(config);

  if (!config.model) {
    throw new Error("missing_model");
  }

  const prompt = buildLlmClassificationPrompt(posts, categories, [], language);
  const content = await chatCompletion(config, [
    {
      role: "system",
      content: language === "en"
        ? "You organize X/Twitter saves into concise, structured personal knowledge categories. Return strict JSON only."
        : "你负责把 X/Twitter 收藏内容整理成结构化个人知识库分类。只返回严格 JSON。"
    },
    {
      role: "user",
      content: prompt
    }
  ], {
    temperature: 0.2,
    maxTokens: 4000,
    timeoutMs: 60000
  });

  return parseClassificationPayload(content);
}

export async function requestLibraryAnswer(rawConfig, question, posts, language = "zh") {
  const config = normalizeAiSettings(rawConfig);
  validateConfigShape(config);

  if (!config.model) {
    throw new Error("missing_model");
  }

  const cleanQuestion = String(question || "").trim();
  if (!cleanQuestion) {
    throw new Error("missing_question");
  }

  const corpus = buildLibraryCorpus(posts);
  const content = await chatCompletion(config, [
    {
      role: "system",
      content: language === "en"
        ? "You answer questions over a user's local X/Twitter archive. Use only the provided posts. Return strict JSON only."
        : "你基于用户本地 X/Twitter 资料库回答问题。只能使用提供的内容。只返回严格 JSON。"
    },
    {
      role: "user",
      content: language === "en"
        ? `Question: ${cleanQuestion}\n\nReturn this JSON shape:\n{"answer":"one short sentence","items":[{"id":"post id from archive","reason":"why it matches"}]}\nLimit items to 8.\n\nLocal archive:\n${corpus}`
        : `问题：${cleanQuestion}\n\n请返回这个 JSON 结构：\n{"answer":"一句话总结","items":[{"id":"资料库里的 post id","reason":"为什么匹配"}]}\nitems 最多 8 条。\n\n本地资料库：\n${corpus}`
    }
  ], {
    temperature: 0.15,
    maxTokens: 1800,
    timeoutMs: 60000
  });

  return parseLibraryAnswerPayload(content);
}

export async function chatCompletion(rawConfig, messages, options = {}) {
  const config = normalizeAiSettings(rawConfig);
  const response = await fetchWithTimeout(buildProviderUrl(config.baseUrl, "/chat/completions"), {
    method: "POST",
    headers: {
      ...makeAuthHeaders(config),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options.temperature ?? 0,
      max_tokens: options.maxTokens ?? 16,
      stream: false
    }),
    signal: options.signal
  }, options.timeoutMs);

  if (!response.ok) {
    throw await providerError(response, "chat_request_failed");
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content
    || json.choices?.[0]?.text
    || json.output_text
    || "";
}

export function parseClassificationPayload(content) {
  const json = extractJson(content);
  const categories = Array.isArray(json.categories) ? json.categories : [];
  const items = Array.isArray(json.items)
    ? json.items
    : Array.isArray(json.classifications)
      ? json.classifications
      : Array.isArray(json.posts)
        ? json.posts
        : Array.isArray(json.results)
          ? json.results
          : [];

  if (!items.length) {
    throw new Error("empty_classification_result");
  }

  return { categories, items };
}

export function parseLibraryAnswerPayload(content) {
  try {
    const json = extractJson(content);
    const items = Array.isArray(json.items)
      ? json.items
      : Array.isArray(json.results)
        ? json.results
        : Array.isArray(json.posts)
          ? json.posts
          : [];
    return {
      answer: String(json.answer || json.summary || "").trim(),
      items: items.map((item) => ({
        id: String(item.id || item.post_id || item.tweet_id || "").trim(),
        reason: String(item.reason || item.why || item.match_reason || "").trim()
      })).filter((item) => item.id).slice(0, 8),
      raw: content
    };
  } catch {
    return {
      answer: String(content || "").trim(),
      items: [],
      raw: content
    };
  }
}

export function applyClassificationPayload(posts, payload) {
  const categories = new Map((payload.categories || []).map((category) => [
    String(category.id || category.category_id || ""),
    category
  ]));
  const items = new Map((payload.items || []).map((item) => [
    String(item.id || item.post_id || item.tweet_id || ""),
    item
  ]));

  return posts.map((post) => {
    const item = items.get(String(post.id));
    if (!item) return post;

    const categoryId = String(item.category_id || item.categoryId || item.category || post.categoryId || "").trim();
    const category = categories.get(categoryId);
    const categoryName = String(
      item.category_name
      || item.categoryName
      || category?.name
      || category?.category_name
      || post.categoryName
      || categoryId
    ).trim();

    return {
      ...post,
      categoryId,
      categoryName,
      summary: String(item.summary || post.summary || "").trim(),
      valueType: String(item.value_type || item.valueType || post.valueType || "read").trim(),
      tags: normalizeTags(item.tags, post.tags),
      confidence: normalizeConfidence(item.confidence, post.confidence),
      score: normalizeScore(item.recommended_score ?? item.score, post.score),
      classificationReason: String(item.reason || item.classification_reason || "").trim(),
      classificationSource: "ai",
      classifiedAt: new Date().toISOString(),
      isUserCorrected: false
    };
  });
}

export function extractJson(content) {
  const text = String(content || "").trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("invalid_json_response");
    return JSON.parse(text.slice(start, end + 1));
  }
}

async function testChatCompletion(config, options = {}) {
  const content = await chatCompletion(config, [
    { role: "user", content: "Reply with OK." }
  ], {
    temperature: 0,
    maxTokens: 4,
    timeoutMs: options.timeoutMs,
    signal: options.signal
  });

  if (!content) throw new Error("empty_chat_validation");
}

function shouldFallbackToChat(error) {
  return [404, 405, 501].includes(error.status);
}

async function fetchWithTimeout(url, init, timeoutMs = 20000) {
  if (!timeoutMs) return fetch(url, init);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const signal = init.signal || controller.signal;

  try {
    return await fetch(url, { ...init, signal });
  } catch (error) {
    if (controller.signal.aborted || error?.name === "AbortError" || /aborted/i.test(error?.message || "")) {
      throw new Error("request_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function providerError(response, code) {
  const text = await response.text();
  const error = new Error(`${code}:${response.status}:${text.slice(0, 240)}`);
  error.status = response.status;
  return error;
}

function normalizeTags(tags, fallback = []) {
  return (Array.isArray(tags) ? tags : fallback)
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeConfidence(value, fallback) {
  const number = Number(value);
  if (Number.isFinite(number)) return Math.max(0, Math.min(1, number));
  return Number.isFinite(fallback) ? fallback : 0.7;
}

function normalizeScore(value, fallback) {
  const number = Number(value);
  if (Number.isFinite(number)) return Math.max(0, Math.min(100, Math.round(number)));
  return Number.isFinite(fallback) ? fallback : 0;
}

function buildLibraryCorpus(posts) {
  return (Array.isArray(posts) ? posts : [])
    .slice()
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
    .slice(0, 120)
    .map((post, index) => {
      const metrics = post.metrics || {};
      const source = Array.isArray(post.sourceTypes) ? post.sourceTypes.join(",") : "";
      const tags = Array.isArray(post.tags) ? post.tags.join(", ") : "";
      return [
        `#${index + 1}`,
        `id: ${post.id || ""}`,
        `source: ${source}`,
        `author: ${post.author?.name || ""} @${post.author?.username || ""}`,
        `category: ${post.categoryName || ""}`,
        `score: ${post.score || 0}`,
        `metrics: likes ${metrics.likes || 0}, reposts ${metrics.retweets || 0}, bookmarks ${metrics.bookmarks || 0}`,
        `tags: ${tags}`,
        `summary: ${truncate(post.summary, 180)}`,
        `text: ${truncate(post.text, 360)}`,
        `url: ${post.url || ""}`
      ].join("\n");
    })
    .join("\n---\n");
}

function truncate(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
