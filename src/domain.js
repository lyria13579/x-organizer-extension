export const SOURCE_LABELS = {
  bookmark: "书签",
  like: "点赞",
  retweet: "转发",
  visible: "可见页",
  import: "导入"
};

export const SORT_OPTIONS = [
  { id: "recommended", label: "推荐分" },
  { id: "likes", label: "点赞数" },
  { id: "retweets", label: "转发数" },
  { id: "bookmarks", label: "收藏数" },
  { id: "replies", label: "回复数" },
  { id: "views", label: "浏览量" },
  { id: "createdAt", label: "发布时间" },
  { id: "savedAt", label: "保存时间" }
];

export const TOPIC_RULES = [
  {
    id: "ai_workflows",
    name: "AI 工具与工作流",
    keywords: ["ai", "agent", "llm", "model", "prompt", "embedding", "retrieval", "rag", "workflow", "自动化", "模型", "提示词", "智能体", "检索", "工具链"],
    definition: "AI 工具、模型使用、提示词、检索增强和自动化工作流。",
    valueHints: ["tool", "tutorial", "actionable"]
  },
  {
    id: "product_strategy",
    name: "产品策略与增长",
    keywords: ["product", "user", "ux", "growth", "retention", "pricing", "onboarding", "activation", "strategy", "产品", "增长", "留存", "用户", "定价", "体验"],
    definition: "产品判断、用户体验、增长路径和商业化策略。",
    valueHints: ["opinion", "case", "actionable"]
  },
  {
    id: "engineering",
    name: "工程实现与代码",
    keywords: ["code", "typescript", "javascript", "css", "react", "next.js", "api", "database", "debug", "testing", "代码", "前端", "后端", "数据库", "测试", "工程"],
    definition: "编程技巧、架构实现、调试测试和工程实践。",
    valueHints: ["tutorial", "tool", "actionable"]
  },
  {
    id: "design_systems",
    name: "设计系统与界面",
    keywords: ["design", "ui", "layout", "figma", "typography", "color", "component", "dashboard", "视觉", "设计", "界面", "排版", "组件", "仪表盘"],
    definition: "UI 设计、设计系统、界面细节和视觉判断。",
    valueHints: ["case", "inspiration", "actionable"]
  },
  {
    id: "startup_business",
    name: "创业与商业",
    keywords: ["startup", "founder", "market", "sales", "customer", "business", "revenue", "moat", "创业", "商业", "客户", "收入", "销售", "护城河"],
    definition: "创业方法、商业模式、销售和市场判断。",
    valueHints: ["opinion", "case"]
  },
  {
    id: "research_learning",
    name: "研究论文与学习",
    keywords: ["paper", "research", "study", "benchmark", "dataset", "course", "learn", "论文", "研究", "学习", "课程", "数据集", "实验"],
    definition: "论文、研究结果、课程资料和学习路径。",
    valueHints: ["read", "tutorial"]
  },
  {
    id: "trading_investing",
    name: "交易与投资",
    keywords: ["market", "trade", "trading", "crypto", "stock", "price", "breakout", "risk", "alpha", "投资", "交易", "市场", "币", "股票", "突破", "风险"],
    definition: "市场观察、交易策略、投资观点和风险管理。",
    valueHints: ["opinion", "case"]
  },
  {
    id: "media_writing",
    name: "写作与内容",
    keywords: ["write", "writing", "content", "newsletter", "thread", "story", "creator", "copy", "写作", "内容", "创作", "文案", "长帖", "播客"],
    definition: "写作方法、内容生产、传播表达和创作者工作流。",
    valueHints: ["tutorial", "inspiration", "actionable"]
  },
  {
    id: "tools_resources",
    name: "工具资源与清单",
    keywords: ["tool", "template", "resource", "list", "repo", "github", "extension", "plugin", "工具", "模板", "资源", "清单", "插件", "仓库"],
    definition: "具体工具、模板、资源列表、仓库和插件。",
    valueHints: ["tool", "read"]
  },
  {
    id: "life_culture",
    name: "生活与文化",
    keywords: ["life", "book", "film", "music", "health", "travel", "culture", "生活", "书", "电影", "音乐", "健康", "旅行", "文化"],
    definition: "生活方式、文化消费、健康和个人兴趣。",
    valueHints: ["inspiration", "read"]
  }
];

export const PENDING_CATEGORY = {
  id: "pending_review",
  name: "待确认",
  definition: "主题不明确或置信度较低，需要用户手动确认。",
  count: 0
};

const VALUE_TYPE_RULES = [
  { id: "tool", label: "工具", keywords: ["tool", "tools", "app", "extension", "plugin", "repo", "github", "工具", "插件", "仓库"] },
  { id: "tutorial", label: "教程", keywords: ["how to", "guide", "step", "tutorial", "pattern", "tip", "技巧", "教程", "步骤", "方法"] },
  { id: "case", label: "案例", keywords: ["case", "example", "teardown", "analysis", "案例", "拆解", "复盘", "分析"] },
  { id: "opinion", label: "观点", keywords: ["think", "lesson", "why", "moat", "note", "观点", "判断", "经验"] },
  { id: "read", label: "待读", keywords: ["paper", "book", "study", "course", "report", "论文", "书", "报告", "课程"] },
  { id: "actionable", label: "可执行", keywords: ["workflow", "checklist", "playbook", "framework", "流程", "清单", "框架", "可执行"] },
  { id: "inspiration", label: "灵感", keywords: ["inspiration", "idea", "story", "creative", "灵感", "想法", "故事"] }
];

export function normalizePost(raw) {
  const metrics = normalizeMetrics(raw);
  const author = normalizeAuthor(raw);
  const id = stringValue(raw.id ?? raw.tweet_id ?? raw.tweetId ?? extractStatusId(raw.url)) || stableId(raw);
  const sourceTypes = normalizeSourceTypes(raw);
  const createdAt = normalizeDate(raw.created_at ?? raw.createdAt ?? raw.date);
  const savedAt = normalizeDate(raw.saved_at ?? raw.savedAt ?? raw.collectedAt ?? new Date().toISOString());
  const username = author.username || "unknown";
  const url = raw.url || raw.link || (id ? `https://x.com/${username}/status/${id}` : "");
  const text = stringValue(raw.text ?? raw.full_text ?? raw.content ?? raw.body).trim();

  return {
    id,
    text,
    author,
    url,
    createdAt,
    savedAt,
    sourceTypes,
    metrics,
    media: Array.isArray(raw.media) ? raw.media : [],
    urls: Array.isArray(raw.urls) ? raw.urls : extractUrls(text),
    categoryId: raw.categoryId || raw.category_id || "",
    categoryName: raw.categoryName || raw.category_name || "",
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 6) : [],
    summary: raw.summary || "",
    valueType: raw.valueType || raw.value_type || "",
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0,
    score: typeof raw.score === "number" ? raw.score : 0,
    classificationSource: raw.classificationSource || raw.classification_source || "",
    classificationReason: raw.classificationReason || raw.classification_reason || "",
    classifiedAt: raw.classifiedAt || raw.classified_at || "",
    isUserCorrected: Boolean(raw.isUserCorrected || raw.user_corrected),
    correctedAt: raw.correctedAt || ""
  };
}

export function mergeImportedPosts(existingPosts, incomingPosts) {
  const merged = new Map();

  for (const post of existingPosts.map(normalizePost)) {
    merged.set(postKey(post), post);
  }

  for (const raw of incomingPosts.map(normalizePost)) {
    const key = postKey(raw);
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, raw);
      continue;
    }

    merged.set(key, {
      ...previous,
      ...raw,
      sourceTypes: uniqueStrings([...previous.sourceTypes, ...raw.sourceTypes]),
      metrics: mergeMetrics(previous.metrics, raw.metrics),
      tags: uniqueStrings([...previous.tags, ...raw.tags]).slice(0, 8),
      categoryId: previous.isUserCorrected ? previous.categoryId : raw.categoryId || previous.categoryId,
      categoryName: previous.isUserCorrected ? previous.categoryName : raw.categoryName || previous.categoryName,
      classificationSource: previous.isUserCorrected ? previous.classificationSource : raw.classificationSource || previous.classificationSource,
      classificationReason: previous.isUserCorrected ? previous.classificationReason : raw.classificationReason || previous.classificationReason,
      classifiedAt: previous.isUserCorrected ? previous.classifiedAt : raw.classifiedAt || previous.classifiedAt,
      isUserCorrected: previous.isUserCorrected || raw.isUserCorrected,
      correctedAt: previous.correctedAt || raw.correctedAt,
      savedAt: latestDate(previous.savedAt, raw.savedAt)
    });
  }

  return Array.from(merged.values()).sort((a, b) => dateValue(b.savedAt) - dateValue(a.savedAt));
}

export function parseImportedPosts(text) {
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.posts)
      ? parsed.posts
      : Array.isArray(parsed.data)
        ? parsed.data
        : [];

  if (!rows.length) {
    throw new Error("没有找到可导入的数组。请提供 JSON 数组，或包含 posts/data 数组的对象。");
  }

  return rows.map(normalizePost).filter((post) => post.text || post.url);
}

export function buildLibrary(rawPosts, options = {}) {
  const normalizedPosts = rawPosts.map(normalizePost).filter((post) => post.text || post.url);
  const categories = deriveCategories(normalizedPosts, {
    maxCategories: options.maxCategories || 10,
    categoryAliases: options.categoryAliases || {}
  });

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const enrichedPosts = normalizedPosts.map((post) => {
    const classified = classifyPost(post, categories, options.categoryAliases || {});
    const category = categoryById.get(classified.categoryId) || PENDING_CATEGORY;
    const summary = post.summary || summarizeText(post.text);
    const valueType = post.valueType || inferValueType(post, category);
    const tags = post.tags.length ? post.tags : inferTags(post, category);
    const confidence = post.isUserCorrected ? 1 : classified.confidence;
    const localScore = calculateRecommendationScore({ ...post, valueType, confidence });
    const score = post.classificationSource === "ai" && post.score > 0
      ? Math.round((post.score + localScore) / 2)
      : localScore;

    return {
      ...post,
      categoryId: category.id,
      categoryName: category.name,
      tags,
      summary,
      valueType,
      confidence,
      score
    };
  });

  const counts = countBy(enrichedPosts, (post) => post.categoryId);
  const categoriesWithCounts = categories
    .map((category) => ({ ...category, count: counts.get(category.id) || 0 }))
    .filter((category) => category.count > 0 || category.id === PENDING_CATEGORY.id);

  return {
    posts: enrichedPosts,
    categories: categoriesWithCounts,
    stats: calculateStats(enrichedPosts, categoriesWithCounts)
  };
}

export function deriveCategories(posts, options = {}) {
  const maxCategories = Math.max(1, Math.min(options.maxCategories || 10, 10));
  const categoryAliases = options.categoryAliases || {};
  const existingCategories = deriveExistingCategories(posts, categoryAliases);
  const scoredRules = TOPIC_RULES.map((rule) => {
    const count = posts.reduce((total, post) => total + (scoreRule(post, rule) > 0 ? 1 : 0), 0);
    const signal = posts.reduce((total, post) => total + scoreRule(post, rule), 0);
    return { ...rule, name: categoryAliases[rule.id] || rule.name, count, signal };
  })
    .filter((rule) => rule.count > 0)
    .sort((a, b) => b.count - a.count || b.signal - a.signal || a.name.localeCompare(b.name, "zh-Hans-CN"));

  const topicLimit = Math.max(1, maxCategories - 1);
  const selected = [...existingCategories];

  for (const rule of scoredRules) {
    if (selected.length >= topicLimit) break;
    if (!selected.some((category) => category.id === rule.id)) selected.push(rule);
  }

  if (!selected.length && posts.length) {
    selected.push({
      id: "general_collection",
      name: categoryAliases.general_collection || "综合收藏",
      definition: "尚未形成明显主题，但值得保留的内容。",
      keywords: [],
      valueHints: ["read"],
      count: posts.length,
      signal: 0
    });
  }

  return [
    ...selected,
    {
      ...PENDING_CATEGORY,
      name: categoryAliases[PENDING_CATEGORY.id] || PENDING_CATEGORY.name
    }
  ].slice(0, maxCategories);
}

export function classifyPost(post, categories, categoryAliases = {}) {
  if (post.isUserCorrected && post.categoryId) {
    return {
      categoryId: post.categoryId,
      categoryName: post.categoryName || categoryAliases[post.categoryId] || post.categoryId,
      confidence: 1,
      reason: "用户手动修正"
    };
  }

  if (post.classificationSource === "ai" && post.categoryId) {
    return {
      categoryId: post.categoryId,
      categoryName: post.categoryName || categoryAliases[post.categoryId] || post.categoryId,
      confidence: post.confidence || 0.82,
      reason: post.classificationReason || "AI 分类结果"
    };
  }

  const candidates = categories
    .filter((category) => category.id !== PENDING_CATEGORY.id)
    .map((category) => ({
      category,
      score: scoreRule(post, category)
    }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best || best.score <= 0) {
    return {
      categoryId: PENDING_CATEGORY.id,
      categoryName: categoryAliases[PENDING_CATEGORY.id] || PENDING_CATEGORY.name,
      confidence: 0.42,
      reason: "未命中足够主题关键词"
    };
  }

  const runnerUp = candidates[1]?.score || 0;
  const confidence = clamp(0.55 + (best.score - runnerUp) * 0.08 + Math.min(best.score, 6) * 0.04, 0.56, 0.94);
  if (confidence < 0.58) {
    return {
      categoryId: PENDING_CATEGORY.id,
      categoryName: categoryAliases[PENDING_CATEGORY.id] || PENDING_CATEGORY.name,
      confidence,
      reason: "主题边界接近"
    };
  }

  return {
    categoryId: best.category.id,
    categoryName: best.category.name,
    confidence,
    reason: `命中 ${best.category.name} 的关键词和上下文`
  };
}

export function filterPosts(posts, filters = {}) {
  const query = (filters.query || "").trim().toLowerCase();
  const source = filters.source || "all";
  const categoryId = filters.categoryId || "all";

  return posts.filter((post) => {
    const matchesQuery = !query || [
      post.text,
      post.summary,
      post.author.username,
      post.author.name,
      post.categoryName,
      ...post.tags
    ].join(" ").toLowerCase().includes(query);

    const matchesSource = source === "all" || post.sourceTypes.includes(source);
    const matchesCategory = categoryId === "all" || post.categoryId === categoryId;

    return matchesQuery && matchesSource && matchesCategory;
  });
}

export function sortPosts(posts, sortKey = "recommended") {
  const key = sortKey || "recommended";
  const sorted = [...posts];
  sorted.sort((a, b) => {
    if (key === "recommended") return b.score - a.score || dateValue(b.savedAt) - dateValue(a.savedAt);
    if (key === "createdAt" || key === "savedAt") return dateValue(b[key]) - dateValue(a[key]);
    return metricValue(b, key) - metricValue(a, key) || b.score - a.score;
  });
  return sorted;
}

export function calculateRecommendationScore(post) {
  const metrics = post.metrics || {};
  const sourceBoost = post.sourceTypes.reduce((total, source) => {
    if (source === "bookmark") return total + 14;
    if (source === "retweet") return total + 10;
    if (source === "like") return total + 5;
    return total + 2;
  }, 0);

  const publicHeat =
    logScore(metrics.likes, 3.2) +
    logScore(metrics.retweets, 4) +
    logScore(metrics.bookmarks, 4.8) +
    logScore(metrics.replies, 1.5) +
    logScore(metrics.views, 0.9);

  const valueBoost = {
    tool: 8,
    tutorial: 8,
    actionable: 7,
    case: 6,
    read: 5,
    opinion: 4,
    inspiration: 4
  }[post.valueType] || 3;

  const textBoost = Math.min((post.text || "").length / 80, 8);
  const confidenceBoost = (post.confidence || 0.5) * 8;
  const recencyBoost = recencyScore(post.savedAt || post.createdAt);

  return Math.round(clamp(sourceBoost + publicHeat + valueBoost + textBoost + confidenceBoost + recencyBoost, 0, 100));
}

export function calculateStats(posts, categories) {
  const sourceCounts = {};
  for (const source of Object.keys(SOURCE_LABELS)) sourceCounts[source] = 0;
  for (const post of posts) {
    for (const source of post.sourceTypes) {
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    }
  }

  const lastSavedAt = posts.reduce((latest, post) => latestDate(latest, post.savedAt), "");

  return {
    total: posts.length,
    sourceCounts,
    categories: categories.length,
    lastSavedAt,
    averageScore: posts.length
      ? Math.round(posts.reduce((sum, post) => sum + post.score, 0) / posts.length)
      : 0
  };
}

function normalizeMetrics(raw) {
  return {
    likes: numberValue(raw.favorite_count ?? raw.like_count ?? raw.likes ?? raw.metrics?.likes),
    retweets: numberValue(raw.retweet_count ?? raw.reposts ?? raw.retweets ?? raw.metrics?.retweets),
    bookmarks: numberValue(raw.bookmark_count ?? raw.bookmarks ?? raw.metrics?.bookmarks),
    replies: numberValue(raw.reply_count ?? raw.replies ?? raw.metrics?.replies),
    quotes: numberValue(raw.quote_count ?? raw.quotes ?? raw.metrics?.quotes),
    views: numberValue(raw.views_count ?? raw.view_count ?? raw.views ?? raw.metrics?.views)
  };
}

function normalizeAuthor(raw) {
  const username = stringValue(raw.author_username ?? raw.username ?? raw.author?.username).replace(/^@/, "");
  return {
    username,
    name: stringValue(raw.author_name ?? raw.name ?? raw.author?.name) || username || "Unknown",
    avatarUrl: stringValue(raw.author_avatar_url ?? raw.avatarUrl ?? raw.author?.avatarUrl)
  };
}

function normalizeSourceTypes(raw) {
  const sourceList = Array.isArray(raw.sourceTypes)
    ? raw.sourceTypes
    : Array.isArray(raw.sources)
      ? raw.sources
      : [raw.source || raw.type || "import"];

  const normalized = sourceList
    .map((source) => String(source).toLowerCase().trim())
    .map((source) => {
      if (["favorite", "liked", "likes"].includes(source)) return "like";
      if (["bookmark", "bookmarks", "saved"].includes(source)) return "bookmark";
      if (["retweet", "repost", "reposted", "share"].includes(source)) return "retweet";
      if (["visible", "timeline"].includes(source)) return "visible";
      return SOURCE_LABELS[source] ? source : "import";
    });

  return uniqueStrings(normalized);
}

function scoreRule(post, rule) {
  const haystack = [
    post.text,
    post.summary,
    post.author?.username,
    post.author?.name,
    ...(post.tags || []),
    ...(post.urls || [])
  ].join(" ").toLowerCase();

  return (rule.keywords || []).reduce((score, keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    if (!normalizedKeyword) return score;
    if (haystack.includes(normalizedKeyword)) return score + (normalizedKeyword.length > 4 ? 2 : 1);
    return score;
  }, 0);
}

function inferValueType(post, category) {
  const haystack = `${post.text} ${post.summary} ${(post.urls || []).join(" ")}`.toLowerCase();
  const matched = VALUE_TYPE_RULES
    .map((rule) => ({
      ...rule,
      score: rule.keywords.reduce((total, keyword) => total + (haystack.includes(keyword.toLowerCase()) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (matched?.score > 0) return matched.id;
  return category?.valueHints?.[0] || "read";
}

function inferTags(post, category) {
  const hashtags = Array.from((post.text || "").matchAll(/#([\p{L}\p{N}_-]+)/gu)).map((match) => match[1]);
  const sourceTags = post.sourceTypes.map((source) => SOURCE_LABELS[source] || source);
  const topicTags = (category?.keywords || [])
    .filter((keyword) => keyword.length > 2 && post.text.toLowerCase().includes(keyword.toLowerCase()))
    .slice(0, 3);

  return uniqueStrings([
    category?.name,
    ...hashtags,
    ...topicTags,
    ...sourceTags
  ].filter(Boolean)).slice(0, 5);
}

function deriveExistingCategories(posts, categoryAliases) {
  const categories = new Map();

  for (const post of posts) {
    if (!post.categoryId || post.categoryId === PENDING_CATEGORY.id) continue;
    if (!post.categoryName && !categoryAliases[post.categoryId]) continue;
    if (!post.isUserCorrected && post.classificationSource !== "ai") continue;

    const current = categories.get(post.categoryId) || {
      id: post.categoryId,
      name: categoryAliases[post.categoryId] || post.categoryName || post.categoryId,
      definition: "用户或 AI 生成的自定义分类。",
      keywords: [],
      valueHints: ["read"],
      count: 0,
      signal: 0
    };
    current.count += 1;
    current.signal += 1;
    categories.set(post.categoryId, current);
  }

  return Array.from(categories.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-Hans-CN"));
}

function summarizeText(text) {
  const compact = (text || "").replace(/\s+/g, " ").trim();
  if (!compact) return "暂无正文摘要。";
  if (compact.length <= 118) return compact;
  const sentenceEnd = compact.slice(0, 140).search(/[。.!?]\s/);
  if (sentenceEnd > 50) return compact.slice(0, sentenceEnd + 1);
  return `${compact.slice(0, 118).trim()}...`;
}

function extractUrls(text) {
  return Array.from(String(text || "").matchAll(/https?:\/\/[^\s)]+/g)).map((match) => match[0]);
}

function extractStatusId(url) {
  const match = String(url || "").match(/status\/(\d+)/);
  return match?.[1] || "";
}

function postKey(post) {
  return post.url || `${post.author.username}:${post.id}` || stableId(post);
}

function stableId(raw) {
  const text = stringValue(raw.text ?? raw.content ?? raw.url);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return `local-${hash.toString(16)}`;
}

function mergeMetrics(a, b) {
  return {
    likes: Math.max(a.likes || 0, b.likes || 0),
    retweets: Math.max(a.retweets || 0, b.retweets || 0),
    bookmarks: Math.max(a.bookmarks || 0, b.bookmarks || 0),
    replies: Math.max(a.replies || 0, b.replies || 0),
    quotes: Math.max(a.quotes || 0, b.quotes || 0),
    views: Math.max(a.views || 0, b.views || 0)
  };
}

function metricValue(post, key) {
  const metricKey = key === "retweets" ? "retweets" : key;
  return post.metrics?.[metricKey] || 0;
}

function countBy(items, getKey) {
  const counts = new Map();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function latestDate(a, b) {
  if (!a) return b || "";
  if (!b) return a || "";
  return dateValue(a) >= dateValue(b) ? a : b;
}

function dateValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function numberValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const compact = value.replace(/,/g, "").trim().toLowerCase();
  const multiplier = compact.endsWith("k") ? 1_000 : compact.endsWith("m") ? 1_000_000 : 1;
  const parsed = Number.parseFloat(compact);
  return Number.isFinite(parsed) ? Math.round(parsed * multiplier) : 0;
}

function stringValue(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function logScore(value, weight) {
  return Math.log10((value || 0) + 1) * weight;
}

function recencyScore(value) {
  const ageDays = Math.max(0, (Date.now() - dateValue(value)) / 86_400_000);
  return clamp(8 - ageDays * 0.08, 0, 8);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
