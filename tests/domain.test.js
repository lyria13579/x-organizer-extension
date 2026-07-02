import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLibrary,
  filterPosts,
  mergeImportedPosts,
  parseImportedPosts,
  sortPosts
} from "../src/domain.js";

const rawPosts = [
  {
    id: "1",
    text: "AI retrieval workflow with embeddings and prompt patterns for research notes.",
    author_username: "ai_builder",
    author_name: "AI Builder",
    source: "bookmark",
    like_count: 1200,
    retweet_count: 80,
    bookmark_count: 500,
    reply_count: 20,
    created_at: "2026-06-01T00:00:00.000Z",
    saved_at: "2026-06-02T00:00:00.000Z"
  },
  {
    id: "2",
    text: "CSS dashboard layout tip for stable cards and readable UI controls.",
    author_username: "ui_dev",
    author_name: "UI Dev",
    source: "like",
    like_count: 300,
    retweet_count: 15,
    bookmark_count: 80,
    reply_count: 5,
    created_at: "2026-06-03T00:00:00.000Z",
    saved_at: "2026-06-04T00:00:00.000Z"
  },
  {
    id: "3",
    text: "Founder lesson about market wedge, customer behavior, and startup pricing.",
    author_username: "founder_notes",
    author_name: "Founder Notes",
    source: "retweet",
    like_count: 900,
    retweet_count: 100,
    bookmark_count: 180,
    reply_count: 12,
    created_at: "2026-06-05T00:00:00.000Z",
    saved_at: "2026-06-06T00:00:00.000Z"
  }
];

test("buildLibrary normalizes posts and keeps categories capped at 10", () => {
  const library = buildLibrary(rawPosts);
  assert.equal(library.posts.length, 3);
  assert.ok(library.categories.length <= 10);
  assert.ok(library.posts.every((post) => post.categoryId));
  assert.ok(library.posts.every((post) => post.score >= 0 && post.score <= 100));
});

test("filterPosts supports query, source, and category filters", () => {
  const library = buildLibrary(rawPosts);
  const aiPost = library.posts.find((post) => post.text.includes("retrieval"));
  const byQuery = filterPosts(library.posts, { query: "retrieval" });
  const bySource = filterPosts(library.posts, { source: "retweet" });
  const byCategory = filterPosts(library.posts, { categoryId: aiPost.categoryId });

  assert.equal(byQuery.length, 1);
  assert.equal(bySource.length, 1);
  assert.ok(byCategory.some((post) => post.id === aiPost.id));
});

test("sortPosts orders numeric metrics descending", () => {
  const library = buildLibrary(rawPosts);
  const sorted = sortPosts(library.posts, "likes");
  assert.equal(sorted[0].id, "1");
});

test("parseImportedPosts accepts JSON array and normalizes source aliases", () => {
  const imported = parseImportedPosts(JSON.stringify([
    {
      tweet_id: "9",
      text: "Useful product onboarding checklist.",
      username: "pm",
      source: "liked",
      favorite_count: "1.2K"
    }
  ]));

  assert.equal(imported.length, 1);
  assert.deepEqual(imported[0].sourceTypes, ["like"]);
  assert.equal(imported[0].metrics.likes, 1200);
});

test("mergeImportedPosts deduplicates by URL and preserves user corrections", () => {
  const existing = [
    {
      id: "1",
      url: "https://x.com/a/status/1",
      text: "AI workflow",
      source: "bookmark",
      categoryId: "custom",
      categoryName: "我的分类",
      isUserCorrected: true
    }
  ];

  const incoming = [
    {
      id: "1",
      url: "https://x.com/a/status/1",
      text: "AI workflow updated",
      source: "like",
      categoryId: "ai_workflows",
      categoryName: "AI 工具与工作流"
    }
  ];

  const merged = mergeImportedPosts(existing, incoming);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].sourceTypes.sort(), ["bookmark", "like"]);
  assert.equal(merged[0].categoryId, "custom");
});

test("buildLibrary preserves AI generated custom categories", () => {
  const library = buildLibrary([
    {
      id: "ai-1",
      text: "A thread about personal knowledge management.",
      author_username: "pkm",
      source: "bookmark",
      categoryId: "personal_knowledge_base",
      categoryName: "Personal Knowledge Base",
      classificationSource: "ai",
      confidence: 0.88
    }
  ]);

  assert.equal(library.posts[0].categoryId, "personal_knowledge_base");
  assert.equal(library.categories[0].id, "personal_knowledge_base");
});
