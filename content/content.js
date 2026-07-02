const ENTRY_ID = "x-organizer-entry";
const FLOATING_ENTRY_ID = "x-organizer-floating-entry";
const CAPTURE_INTERVAL_MS = 6500;
const MAX_CAPTURED_PER_PASS = 24;
const AUTO_SYNC_DEFAULTS = {
  maxPasses: 420,
  idlePasses: 10,
  delayMs: 1450
};

let captureTimer = 0;
let activeAutoSync = null;
let lastOrganizerOpenAt = 0;

injectEntryWhenReady();
observeNavigation();
scheduleVisibleCapture(1200);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CAPTURE_NOW") {
    captureVisibleTweets()
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }

  if (message?.type === "START_AUTO_SCROLL_SYNC") {
    autoScrollSync(message.target)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }

  if (message?.type === "GET_CURRENT_PROFILE_URL") {
    sendResponse({ ok: true, profileUrl: getCurrentProfileUrl() });
    return false;
  }

  return false;
});

function injectEntryWhenReady() {
  injectEntry();
  injectFloatingEntry();
  const retry = window.setInterval(() => {
    const navReady = injectEntry();
    const floatingReady = injectFloatingEntry();
    if (navReady && floatingReady) window.clearInterval(retry);
  }, 1000);
}

function observeNavigation() {
  const observer = new MutationObserver(() => {
    injectEntry();
    injectFloatingEntry();
    scheduleVisibleCapture(CAPTURE_INTERVAL_MS);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function injectEntry() {
  if (document.getElementById(ENTRY_ID)) return true;

  const nav = document.querySelector('header nav[role="navigation"]')
    || document.querySelector('nav[aria-label="Primary"]')
    || document.querySelector('nav[aria-label="主导航"]')
    || document.querySelector("header nav");

  if (!nav) return false;

  const button = document.createElement("button");
  button.id = ENTRY_ID;
  button.className = "x-organizer-entry";
  button.type = "button";
  button.setAttribute("aria-label", "Open X Organizer");
  button.innerHTML = [
    '<span class="x-organizer-entry__mark" aria-hidden="true"><span></span><span></span></span>',
    '<span class="x-organizer-entry__label">X Organizer</span>'
  ].join("");

  bindOrganizerOpenEvents(button);

  nav.appendChild(button);
  return true;
}

function injectFloatingEntry() {
  if (document.getElementById(FLOATING_ENTRY_ID)) return true;

  const button = document.createElement("button");
  button.id = FLOATING_ENTRY_ID;
  button.className = "x-organizer-floating-entry";
  button.type = "button";
  button.setAttribute("aria-label", "Open X Organizer");
  button.innerHTML = [
    '<span class="x-organizer-floating-entry__mark" aria-hidden="true"><span></span><span></span></span>',
    '<span class="x-organizer-floating-entry__text">Organizer</span>'
  ].join("");
  bindOrganizerOpenEvents(button);
  document.documentElement.appendChild(button);
  return true;
}

function bindOrganizerOpenEvents(button) {
  button.addEventListener("mousedown", openOrganizerFromPage, { capture: true });
  button.addEventListener("pointerdown", openOrganizerFromPage, { capture: true });
  button.addEventListener("click", openOrganizerFromPage, { capture: true });
  button.addEventListener("keydown", openOrganizerFromKeyboard, { capture: true });
}

function stopPageNavigation(event) {
  event.preventDefault();
  event.stopPropagation();
}

function openOrganizerFromPage(event) {
  event?.preventDefault();
  event?.stopImmediatePropagation();

  if (typeof event?.button === "number" && event.button !== 0) return;

  const now = Date.now();
  if (now - lastOrganizerOpenAt < 80) return;
  lastOrganizerOpenAt = now;

  chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
  scheduleVisibleCapture(100);
}

function openOrganizerFromKeyboard(event) {
  if (!["Enter", " "].includes(event.key)) return;
  openOrganizerFromPage(event);
}

function scheduleVisibleCapture(delay) {
  window.clearTimeout(captureTimer);
  captureTimer = window.setTimeout(() => {
    captureVisibleTweets().catch(() => {});
  }, delay);
}

async function captureVisibleTweets() {
  const posts = Array.from(document.querySelectorAll('article[data-testid="tweet"]'))
    .slice(0, MAX_CAPTURED_PER_PASS)
    .map(articleToPost)
    .filter(Boolean);

  if (!posts.length) return { captured: 0 };

  const result = await chrome.runtime.sendMessage({
    type: "INGEST_VISIBLE_POSTS",
    posts
  });

  return {
    captured: posts.length,
    total: result?.total
  };
}

async function autoScrollSync(target) {
  if (activeAutoSync) throw new Error("auto_sync_already_running");
  assertSyncPage(target);

  const run = {
    target,
    seenIds: new Set(),
    captured: 0,
    passes: 0
  };
  activeAutoSync = run;

  try {
    window.clearTimeout(captureTimer);
    let idleCount = 0;
    let lastScrollY = -1;
    let stopReason = "max_passes";
    const scroller = document.scrollingElement || document.documentElement;

    window.scrollTo({ top: 0, behavior: "instant" });
    await sleep(800);

    for (let pass = 0; pass < AUTO_SYNC_DEFAULTS.maxPasses; pass += 1) {
      run.passes = pass + 1;
      const posts = getVisibleTweetPosts();
      const newPosts = posts.filter((post) => {
        const key = post.url || post.id;
        if (!key || run.seenIds.has(key)) return false;
        run.seenIds.add(key);
        return true;
      });

      if (newPosts.length) {
        run.captured += newPosts.length;
        await chrome.runtime.sendMessage({
          type: "INGEST_VISIBLE_POSTS",
          posts: newPosts
        });
      }

      const before = window.scrollY;
      window.scrollBy({ top: Math.round(window.innerHeight * 0.86), behavior: "smooth" });
      await sleep(AUTO_SYNC_DEFAULTS.delayMs);
      const after = window.scrollY;
      const barelyMoved = Math.abs(after - lastScrollY) < 12 && Math.abs(after - before) < 12;
      const nearBottom = Math.ceil(after + window.innerHeight) >= scroller.scrollHeight - 24;

      if (!newPosts.length && (barelyMoved || nearBottom)) {
        idleCount += 1;
      } else if (newPosts.length || !barelyMoved) {
        idleCount = 0;
      }

      lastScrollY = after;
      await chrome.runtime.sendMessage({
        type: "AUTO_SYNC_PROGRESS",
        target,
        captured: run.captured,
        passes: run.passes,
        idleCount,
        maxPasses: AUTO_SYNC_DEFAULTS.maxPasses,
        nearBottom
      }).catch(() => {});

      if (nearBottom && idleCount >= AUTO_SYNC_DEFAULTS.idlePasses) {
        stopReason = "idle";
        break;
      }
    }

    return {
      target,
      captured: run.captured,
      passes: run.passes,
      reason: stopReason
    };
  } finally {
    activeAutoSync = null;
    scheduleVisibleCapture(CAPTURE_INTERVAL_MS);
  }
}

function getVisibleTweetPosts() {
  return Array.from(document.querySelectorAll('article[data-testid="tweet"]'))
    .map(articleToPost)
    .filter(Boolean);
}

function assertSyncPage(target) {
  const path = location.pathname.toLowerCase();
  if (target === "bookmark" && path.includes("/i/bookmarks")) return;
  if (target === "like" && path.endsWith("/likes")) return;
  throw new Error(target === "bookmark" ? "open_bookmarks_page" : "open_likes_page");
}

function getCurrentProfileUrl() {
  const profileLink = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]')
    || Array.from(document.querySelectorAll('a[href^="/"]')).find((link) => {
      const href = link.getAttribute("href") || "";
      return /^\/[^/?#]+$/.test(href)
        && !href.startsWith("/i/")
        && !["/home", "/explore", "/notifications", "/messages", "/settings"].includes(href);
    });

  const href = profileLink?.getAttribute("href") || "";
  if (!href) return "";
  return new URL(href, location.origin).href;
}

function articleToPost(article) {
  const textNode = article.querySelector('[data-testid="tweetText"]');
  const text = (textNode?.innerText || "").trim();
  const statusLink = Array.from(article.querySelectorAll('a[href*="/status/"]'))
    .map((link) => link.getAttribute("href"))
    .find(Boolean);

  if (!text && !statusLink) return null;

  const absoluteUrl = statusLink ? new URL(statusLink, location.origin).href : "";
  const id = absoluteUrl.match(/status\/(\d+)/)?.[1] || "";
  const username = absoluteUrl.match(/x\.com\/([^/]+)\/status/)?.[1]
    || absoluteUrl.match(/twitter\.com\/([^/]+)\/status/)?.[1]
    || "";
  const authorName = article.querySelector('[data-testid="User-Name"] span')?.textContent?.trim()
    || username
    || "Unknown";
  const createdAt = article.querySelector("time")?.getAttribute("datetime") || new Date().toISOString();
  const metrics = parseMetrics(article);

  return {
    id,
    text,
    author_username: username,
    author_name: authorName,
    url: absoluteUrl,
    created_at: createdAt,
    saved_at: new Date().toISOString(),
    source: inferSource(article),
    like_count: metrics.likes,
    retweet_count: metrics.retweets,
    bookmark_count: metrics.bookmarks,
    reply_count: metrics.replies,
    quote_count: metrics.quotes,
    views_count: metrics.views,
    urls: extractUrls(text),
    media: extractMedia(article)
  };
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function inferSource(article) {
  const path = location.pathname.toLowerCase();
  const socialContext = article.querySelector('[data-testid="socialContext"]')?.textContent?.toLowerCase() || "";

  if (path.includes("/i/bookmarks")) return "bookmark";
  if (path.endsWith("/likes")) return "like";
  if (socialContext.includes("reposted") || socialContext.includes("转帖") || socialContext.includes("转发")) return "retweet";
  return "visible";
}

function parseMetrics(article) {
  const labels = Array.from(article.querySelectorAll("[aria-label]"))
    .map((node) => node.getAttribute("aria-label") || "")
    .join(" ");

  return {
    replies: parseMetric(labels, ["replies", "reply", "回复"]),
    retweets: parseMetric(labels, ["reposts", "repost", "retweets", "retweet", "转帖", "转发"]),
    quotes: parseMetric(labels, ["quotes", "quote", "引用"]),
    likes: parseMetric(labels, ["likes", "like", "赞"]),
    bookmarks: parseMetric(labels, ["bookmarks", "bookmark", "收藏"]),
    views: parseMetric(labels, ["views", "view", "查看", "浏览"])
  };
}

function parseMetric(labels, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const after = labels.match(new RegExp(`([\\d.,]+\\s*[KMB万千]?)\\s+${escaped}`, "i"));
    if (after) return parseCompactNumber(after[1]);

    const before = labels.match(new RegExp(`${escaped}\\s+([\\d.,]+\\s*[KMB万千]?)`, "i"));
    if (before) return parseCompactNumber(before[1]);
  }
  return 0;
}

function parseCompactNumber(value) {
  const compact = String(value || "").replace(/,/g, "").trim().toLowerCase();
  const multiplier = compact.endsWith("k") || compact.endsWith("千")
    ? 1_000
    : compact.endsWith("m") || compact.endsWith("万")
      ? compact.endsWith("万") ? 10_000 : 1_000_000
      : 1;
  const parsed = Number.parseFloat(compact);
  return Number.isFinite(parsed) ? Math.round(parsed * multiplier) : 0;
}

function extractUrls(text) {
  return Array.from(String(text || "").matchAll(/https?:\/\/[^\s)]+/g)).map((match) => match[0]);
}

function extractMedia(article) {
  return Array.from(article.querySelectorAll('img[src*="twimg.com/media"], video source[src]'))
    .map((node) => node.currentSrc || node.src || node.getAttribute("src"))
    .filter(Boolean)
    .slice(0, 4);
}
