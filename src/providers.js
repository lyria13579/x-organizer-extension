export const PROVIDER_PRESETS = [
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    apiStyle: "openai-compatible"
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    apiStyle: "openai-compatible"
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4.1-mini",
    apiStyle: "openai-compatible"
  },
  {
    id: "moonshot",
    name: "Moonshot / Kimi",
    baseUrl: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    apiStyle: "openai-compatible"
  },
  {
    id: "dashscope",
    name: "Qwen / DashScope",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    apiStyle: "openai-compatible"
  },
  {
    id: "siliconflow",
    name: "SiliconFlow",
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "deepseek-ai/DeepSeek-V3",
    apiStyle: "openai-compatible"
  },
  {
    id: "aimlapi",
    name: "AIMLAPI",
    baseUrl: "https://api.aimlapi.com/v1",
    model: "gpt-4o-mini",
    apiStyle: "openai-compatible"
  },
  {
    id: "custom",
    name: "Custom OpenAI-compatible",
    baseUrl: "",
    model: "",
    apiStyle: "openai-compatible"
  }
];

export function getProviderPreset(providerId) {
  return PROVIDER_PRESETS.find((provider) => provider.id === providerId) || PROVIDER_PRESETS[0];
}

export function defaultAiSettings() {
  const preset = getProviderPreset("deepseek");
  return {
    providerId: preset.id,
    providerName: preset.name,
    baseUrl: preset.baseUrl,
    model: preset.model,
    apiKey: "",
    validation: {
      status: "untested",
      checkedAt: "",
      message: ""
    }
  };
}

export function normalizeAiSettings(settings = {}) {
  const preset = getProviderPreset(settings.providerId || "deepseek");
  return {
    providerId: settings.providerId || preset.id,
    providerName: settings.providerName || preset.name,
    baseUrl: trimTrailingSlash(settings.baseUrl || preset.baseUrl),
    model: String(settings.model || preset.model || "").trim(),
    apiKey: String(settings.apiKey || ""),
    validation: {
      status: settings.validation?.status || "untested",
      checkedAt: settings.validation?.checkedAt || "",
      message: settings.validation?.message || ""
    }
  };
}

export function providerDisplayName(config) {
  return getProviderPreset(config?.providerId).name || config?.providerName || "Provider";
}

export function buildProviderUrl(baseUrl, endpoint) {
  const cleanBase = trimTrailingSlash(baseUrl);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

export function makeAuthHeaders(config) {
  const headers = {
    Authorization: `Bearer ${config.apiKey}`
  };

  if (config.providerId === "openrouter") {
    headers["X-Title"] = "X Organizer";
  }

  return headers;
}

export function providerConfigFromForm(values) {
  const preset = getProviderPreset(values.providerId);
  return normalizeAiSettings({
    providerId: values.providerId,
    providerName: preset.name,
    baseUrl: values.baseUrl,
    model: values.model,
    apiKey: values.apiKey,
    validation: values.validation
  });
}

export function validateConfigShape(config) {
  if (!config.apiKey?.trim()) {
    throw new Error("missing_api_key");
  }
  if (!config.baseUrl?.trim()) {
    throw new Error("missing_base_url");
  }
  if (!/^https:\/\/[^ ]+$/i.test(config.baseUrl)) {
    throw new Error("invalid_base_url");
  }
}

function trimTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}
