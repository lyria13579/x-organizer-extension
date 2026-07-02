import { SORT_OPTIONS } from "./domain.js";

export function buildLlmClassificationPrompt(posts, categories, corrections = [], language = "zh") {
  const compactPosts = posts.slice(0, 120).map((post) => ({
    id: post.id,
    text: post.text,
    author_username: post.author.username,
    created_at: post.createdAt,
    saved_at: post.savedAt,
    source: post.sourceTypes,
    metrics: post.metrics,
    urls: post.urls
  }));

  const outputLanguage = language === "en" ? "English" : "简体中文";

  return `你是一个专业的 X/Twitter 内容知识管理助手。请基于下面的内容样本，为用户生成最多 10 个自定义分类，并为每条内容输出结构化分类结果。

Output language: ${outputLanguage}

要求：
1. 分类必须从用户真实内容中归纳，不要照搬固定模板。
2. 每个分类包含 id、name、definition、include_rules、exclude_rules、example_ids。
3. 每条内容输出 category_id、summary、value_type、tags、confidence、reason、recommended_score。
4. confidence 低于 0.6 的内容放入 pending_review。
5. 如果分类超过 10 个，请合并相近分类。
6. 推荐分需要综合来源、公开互动、可执行性、重复度、发布时间和保存时间。
7. 只输出 JSON，不要输出 Markdown。
8. JSON 顶层必须是：
{
  "categories": [
    {
      "id": "stable_snake_case_id",
      "name": "分类名",
      "definition": "分类定义",
      "include_rules": ["收录标准"],
      "exclude_rules": ["排除标准"],
      "example_ids": ["post id"]
    }
  ],
  "items": [
    {
      "id": "post id",
      "category_id": "stable_snake_case_id",
      "category_name": "分类名",
      "summary": "一句摘要",
      "value_type": "tool|tutorial|case|opinion|read|actionable|inspiration",
      "tags": ["tag"],
      "confidence": 0.86,
      "reason": "分类理由",
      "recommended_score": 0
    }
  ]
}

当前本地分类候选：
${JSON.stringify(categories.map(({ id, name, definition, count }) => ({ id, name, definition, count })), null, 2)}

用户已纠正样本：
${JSON.stringify(corrections.slice(0, 30), null, 2)}

排序字段：
${JSON.stringify(SORT_OPTIONS.map((option) => option.id))}

内容数据：
${JSON.stringify(compactPosts, null, 2)}
`;
}
