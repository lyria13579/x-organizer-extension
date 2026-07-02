import { SAMPLE_POSTS } from "./data/sample-posts.js";
import { mergeImportedPosts } from "./src/domain.js";
import { loadAppState, saveAppState, updateAppState } from "./src/storage.js";

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await seedSampleDataIfEmpty();
    await configureSidePanelBehavior();
  } catch (error) {
    console.warn("[X Organizer] install setup failed", error);
  }
});

configureSidePanelBehavior().catch((error) => {
  console.warn("[X Organizer] initial side panel setup failed", error);
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    await configureSidePanelBehavior();
  } catch (error) {
    console.warn("[X Organizer] startup side panel setup failed", error);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await openSidePanel(tab?.id);
  } catch (error) {
    console.warn("[X Organizer] action click failed", error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "OPEN_SIDE_PANEL") {
    openSidePanelFromUserGesture(sender);
    return false;
  }

  handleMessage(message, sender)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
  return true;
});

async function handleMessage(message, sender) {
  if (!message || typeof message.type !== "string") return {};

  if (message.type === "INGEST_VISIBLE_POSTS") {
    const posts = Array.isArray(message.posts) ? message.posts : [];
    if (!posts.length) return { importedCount: 0 };

    const nextState = await updateAppState((state) => {
      const merged = mergeImportedPosts(state.posts, posts);
      return {
        ...state,
        posts: merged,
        sync: {
          ...state.sync,
          lastSyncAt: new Date().toISOString(),
          lastSource: "visible",
          visibleCaptureCount: state.sync.visibleCaptureCount + posts.length,
          coverageNote: "已被动采集当前 X 页面可见推文；完整历史仍取决于用户打开和滚动过的范围。"
        }
      };
    });

    return { importedCount: posts.length, total: nextState.posts.length };
  }

  if (message.type === "REQUEST_ACTIVE_CAPTURE") {
    const tab = await findTargetXTab();
    if (!tab?.id) {
      throw new Error("no_active_x_tab");
    }

    const result = await chrome.tabs.sendMessage(tab.id, { type: "CAPTURE_NOW" });
    return result || { captured: 0 };
  }

  if (message.type === "REQUEST_AUTO_SYNC") {
    return await requestAutoSync(message.target);
  }

  if (message.type === "AUTO_SYNC_PROGRESS") {
    const progress = {
      target: message.target || "visible",
      captured: message.captured || 0,
      passes: message.passes || 0,
      idleCount: message.idleCount || 0,
      maxPasses: message.maxPasses || 0,
      nearBottom: Boolean(message.nearBottom)
    };

    await updateAppState((state) => ({
      ...state,
      sync: {
        ...state.sync,
        lastSource: progress.target,
        coverageNote: `自动同步进行中：已捕获 ${progress.captured} 条，第 ${progress.passes} 轮。`
      }
    }));
    chrome.runtime.sendMessage({
      type: "AUTO_SYNC_PROGRESS_VIEW",
      ...progress
    }).catch(() => {});
    return {};
  }

  if (message.type === "RESET_SAMPLE_DATA") {
    await saveAppState({
      posts: SAMPLE_POSTS,
      categoryAliases: {},
      sync: {
        lastSyncAt: new Date().toISOString(),
        lastSource: "sample",
        importedCount: SAMPLE_POSTS.length,
        visibleCaptureCount: 0,
        coverageNote: "已重置为本地样本数据。"
      }
    });
    return { total: SAMPLE_POSTS.length };
  }

  return {};
}

async function seedSampleDataIfEmpty() {
  const state = await loadAppState();
  if (state.posts.length) return;

  await saveAppState({
    ...state,
    posts: SAMPLE_POSTS,
    sync: {
      ...state.sync,
      lastSyncAt: new Date().toISOString(),
      lastSource: "sample",
      importedCount: SAMPLE_POSTS.length,
      coverageNote: "首次安装已加载本地样本数据，可用 JSON 导入替换。"
    }
  });
}

async function openSidePanel(tabId) {
  if (!chrome.sidePanel || !tabId) return { opened: false, reason: "side_panel_unavailable" };

  if (chrome.sidePanel.setOptions) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "sidepanel/sidepanel.html",
      enabled: true
    });
  }

  if (!chrome.sidePanel.open) return { opened: false, reason: "side_panel_open_unavailable" };

  try {
    await chrome.sidePanel.open({ tabId });
    return { opened: true };
  } catch (error) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.windowId && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
        return { opened: true };
      }
    } catch (windowError) {
      console.warn("[X Organizer] sidePanel.open window fallback failed", windowError);
    }
    console.warn("[X Organizer] sidePanel.open failed", error);
    return { opened: false, reason: error.message || String(error) };
  }
}

function openSidePanelFromUserGesture(sender) {
  if (!chrome.sidePanel?.open) {
    return Promise.resolve({ opened: false, reason: "side_panel_open_unavailable" });
  }

  const tabId = sender?.tab?.id;
  const windowId = sender?.tab?.windowId;

  if (tabId) {
    const openPromise = chrome.sidePanel.open({ tabId });

    return openPromise
      .then(async () => {
        if (chrome.sidePanel.setOptions) {
          await chrome.sidePanel.setOptions({
            tabId,
            path: "sidepanel/sidepanel.html",
            enabled: true
          });
        }
        return { opened: true, target: "tab" };
      })
      .catch((error) => {
        console.warn("[X Organizer] content-triggered sidePanel.open failed", error);
        return { opened: false, reason: error.message || String(error) };
      });
  }

  if (windowId) {
    const openPromise = chrome.sidePanel.open({ windowId });

    return openPromise
      .then(() => ({ opened: true, target: "window" }))
      .catch((error) => {
        console.warn("[X Organizer] content-triggered sidePanel.open failed", error);
        return { opened: false, reason: error.message || String(error) };
      });
  }

  return Promise.resolve({ opened: false, reason: "missing_sender_context" });
}

async function configureSidePanelBehavior() {
  if (!chrome.sidePanel) return;

  if (chrome.sidePanel.setOptions) {
    await chrome.sidePanel.setOptions({
      path: "sidepanel/sidepanel.html",
      enabled: true
    });
  }

  if (chrome.sidePanel.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
}

async function requestAutoSync(target) {
  if (!["bookmark", "like"].includes(target)) throw new Error("invalid_sync_target");

  const tab = await findTargetXTab();
  if (!tab?.id) {
    throw new Error("no_active_x_tab");
  }

  const nextUrl = await resolveSyncUrl(tab, target);
  if (nextUrl && nextUrl !== tab.url) {
    await chrome.tabs.update(tab.id, { url: nextUrl });
    await waitForTabComplete(tab.id);
    await sleep(1600);
  }

  const result = await sendTabMessageWithRetry(tab.id, {
    type: "START_AUTO_SCROLL_SYNC",
    target
  });

  await updateAppState((state) => ({
    ...state,
    sync: {
      ...state.sync,
      lastSyncAt: new Date().toISOString(),
      lastSource: target,
      coverageNote: `自动同步完成：${target === "bookmark" ? "书签" : "点赞"}采集 ${result?.captured || 0} 条，滚动 ${result?.passes || 0} 轮。`
    }
  }));

  return result;
}

async function findTargetXTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (isXTab(active)) return active;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.find(isXTab) || null;
}

function isXTab(tab) {
  return Boolean(tab?.id && /^https:\/\/(x|twitter)\.com\//.test(tab.url || ""));
}

async function resolveSyncUrl(tab, target) {
  const url = new URL(tab.url);
  if (target === "bookmark") {
    if (url.pathname.toLowerCase().includes("/i/bookmarks")) return "";
    return `${url.origin}/i/bookmarks`;
  }

  if (url.pathname.toLowerCase().endsWith("/likes")) return "";

  const profile = await chrome.tabs.sendMessage(tab.id, { type: "GET_CURRENT_PROFILE_URL" }).catch(() => null);
  if (profile?.profileUrl) return `${profile.profileUrl.replace(/\/+$/, "")}/likes`;

  throw new Error("open_likes_page");
}

function waitForTabComplete(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("tab_load_timeout"));
    }, 30000);

    function listener(updatedTabId, info) {
      if (updatedTabId !== tabId || info.status !== "complete") return;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function sendTabMessageWithRetry(tabId, message) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const result = await chrome.tabs.sendMessage(tabId, message);
      if (!result?.ok) throw new Error(result?.error || "tab_message_failed");
      return result;
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }
  throw lastError || new Error("tab_message_failed");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
