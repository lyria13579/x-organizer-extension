export const STORAGE_KEYS = {
  appState: "xOrganizer.appState"
};

export async function loadAppState() {
  const state = await storageGet(STORAGE_KEYS.appState);
  return normalizeAppState(state);
}

export async function saveAppState(nextState) {
  await storageSet(STORAGE_KEYS.appState, normalizeAppState(nextState));
}

export async function updateAppState(updater) {
  const current = await loadAppState();
  const next = await updater(current);
  await saveAppState(next);
  return next;
}

export function normalizeAppState(state = {}) {
  return {
    posts: Array.isArray(state.posts) ? state.posts : [],
    categoryAliases: state.categoryAliases && typeof state.categoryAliases === "object"
      ? state.categoryAliases
      : {},
    settings: {
      language: ["zh", "en"].includes(state.settings?.language) ? state.settings.language : "en",
      theme: ["dark", "light"].includes(state.settings?.theme) ? state.settings.theme : "light",
      ai: state.settings?.ai && typeof state.settings.ai === "object" ? state.settings.ai : {}
    },
    sync: {
      lastSyncAt: state.sync?.lastSyncAt || "",
      lastSource: state.sync?.lastSource || "sample",
      importedCount: Number.isFinite(state.sync?.importedCount) ? state.sync.importedCount : 0,
      visibleCaptureCount: Number.isFinite(state.sync?.visibleCaptureCount) ? state.sync.visibleCaptureCount : 0,
      coverageNote: state.sync?.coverageNote || "MVP 使用本地样本、导入数据和可见页被动采集，历史覆盖率可能不完整。"
    }
  };
}

async function storageGet(key) {
  if (globalThis.chrome?.storage?.local) {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  const raw = globalThis.localStorage?.getItem(key);
  return raw ? JSON.parse(raw) : undefined;
}

async function storageSet(key, value) {
  if (globalThis.chrome?.storage?.local) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }

  globalThis.localStorage?.setItem(key, JSON.stringify(value));
}
