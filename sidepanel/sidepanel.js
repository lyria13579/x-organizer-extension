import { SAMPLE_POSTS } from "../data/sample-posts.js";
import {
  SORT_OPTIONS,
  buildLibrary,
  filterPosts,
  mergeImportedPosts,
  parseImportedPosts,
  sortPosts
} from "../src/domain.js";
import {
  applyClassificationPayload,
  requestAiClassification,
  requestLibraryAnswer,
  validateProviderConfig
} from "../src/aiClient.js";
import { applyStaticTranslations, t } from "../src/i18n.js";
import { buildLlmClassificationPrompt } from "../src/llmPrompt.js";
import {
  PROVIDER_PRESETS,
  getProviderPreset,
  normalizeAiSettings,
  providerConfigFromForm
} from "../src/providers.js";
import { STORAGE_KEYS, loadAppState, saveAppState } from "../src/storage.js";

const TUTORIAL_STEPS = [
  {
    id: "capture",
    titleKey: "tutorial.capture.title",
    bodyKey: "tutorial.capture.body",
    altKey: "tutorial.capture.alt",
    image: "./assets/tutorial-capture.png"
  },
  {
    id: "api",
    titleKey: "tutorial.api.title",
    bodyKey: "tutorial.api.body",
    altKey: "tutorial.api.alt",
    image: "./assets/tutorial-settings.png"
  },
  {
    id: "sort",
    titleKey: "tutorial.sort.title",
    bodyKey: "tutorial.sort.body",
    altKey: "tutorial.sort.alt",
    image: "./assets/tutorial-filters.png"
  },
  {
    id: "ai",
    titleKey: "tutorial.ai.title",
    bodyKey: "tutorial.ai.body",
    altKey: "tutorial.ai.alt",
    image: "./assets/tutorial-ask.png"
  }
];

const state = {
  appState: null,
  library: null,
  activeSource: "all",
  activeCategoryId: "all",
  query: "",
  sortKey: "recommended",
  activeView: "library",
  activeTutorialStepIndex: 0,
  language: "en",
  theme: "light",
  autoSync: {
    active: false,
    target: "",
    captured: 0,
    passes: 0,
    idleCount: 0,
    maxPasses: 0,
    nearBottom: false
  },
  liveRefreshTimer: 0,
  liveRefreshInFlight: false,
  isFullPage: new URLSearchParams(location.search).get("mode") === "page"
};

const refs = {
  syncStatus: document.getElementById("syncStatus"),
  totalCount: document.getElementById("totalCount"),
  coverageNote: document.getElementById("coverageNote"),
  libraryView: document.getElementById("libraryView"),
  tutorialView: document.getElementById("tutorialView"),
  categoryList: document.getElementById("categoryList"),
  topCategoryList: document.getElementById("topCategoryList"),
  renameCategoryButton: document.getElementById("renameCategoryButton"),
  resetCategoriesButton: document.getElementById("resetCategoriesButton"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  importInput: document.getElementById("importInput"),
  captureButton: document.getElementById("captureButton"),
  refreshButton: document.getElementById("refreshButton"),
  syncBookmarksButton: document.getElementById("syncBookmarksButton"),
  syncLikesButton: document.getElementById("syncLikesButton"),
  aiClassifyButton: document.getElementById("aiClassifyButton"),
  importButton: document.getElementById("importButton"),
  exportButton: document.getElementById("exportButton"),
  copyPromptButton: document.getElementById("copyPromptButton"),
  askAiButton: document.getElementById("askAiButton"),
  tutorialButton: document.getElementById("tutorialButton"),
  openFullPageButton: document.getElementById("openFullPageButton"),
  settingsButton: document.getElementById("settingsButton"),
  operationStatus: document.getElementById("operationStatus"),
  resultCount: document.getElementById("resultCount"),
  activeFilters: document.getElementById("activeFilters"),
  emptyState: document.getElementById("emptyState"),
  postList: document.getElementById("postList"),
  template: document.getElementById("postCardTemplate"),
  tutorialLightbox: document.getElementById("tutorialLightbox"),
  tutorialLightboxCounter: document.getElementById("tutorialLightboxCounter"),
  tutorialLightboxTitle: document.getElementById("tutorialLightboxTitle"),
  tutorialLightboxBody: document.getElementById("tutorialLightboxBody"),
  tutorialLightboxImage: document.getElementById("tutorialLightboxImage"),
  closeTutorialLightboxButton: document.getElementById("closeTutorialLightboxButton"),
  previousTutorialButton: document.getElementById("previousTutorialButton"),
  nextTutorialButton: document.getElementById("nextTutorialButton"),
  askDialog: document.getElementById("askDialog"),
  closeAskButton: document.getElementById("closeAskButton"),
  askForm: document.getElementById("askForm"),
  askQuestionInput: document.getElementById("askQuestionInput"),
  askSubmitButton: document.getElementById("askSubmitButton"),
  askAnswer: document.getElementById("askAnswer"),
  settingsDialog: document.getElementById("settingsDialog"),
  closeSettingsButton: document.getElementById("closeSettingsButton"),
  languageSelect: document.getElementById("languageSelect"),
  themeSelect: document.getElementById("themeSelect"),
  providerSelect: document.getElementById("providerSelect"),
  baseUrlInput: document.getElementById("baseUrlInput"),
  modelInput: document.getElementById("modelInput"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  apiValidationStatus: document.getElementById("apiValidationStatus"),
  apiValidationMessage: document.getElementById("apiValidationMessage"),
  validateApiButton: document.getElementById("validateApiButton"),
  saveSettingsButton: document.getElementById("saveSettingsButton")
};

init();

async function init() {
  document.body.classList.toggle("is-full-page", state.isFullPage);
  renderProviderOptions();
  bindEvents();

  const appState = await loadAppState();
  state.appState = appState.posts.length
    ? appState
    : {
      ...appState,
      posts: SAMPLE_POSTS,
      sync: {
        ...appState.sync,
        lastSyncAt: new Date().toISOString(),
        importedCount: SAMPLE_POSTS.length,
        coverageNote: "已加载本地样本数据，可导入自己的 X JSON 替换。"
      }
    };

  state.appState.settings.ai = normalizeAiSettings(state.appState.settings.ai);
  state.language = state.appState.settings.language || "zh";
  state.theme = state.appState.settings.theme || "light";
  refs.languageSelect.value = state.language;
  refs.themeSelect.value = state.theme;
  renderSortOptions();
  renderLanguage();
  applyTheme();
  renderSettingsForm();
  await persist();
  rebuildAndRender();
  applyTutorialShotMode();
}

function bindEvents() {
  refs.searchInput.addEventListener("input", () => {
    showLibraryView();
    state.query = refs.searchInput.value;
    render();
  });

  refs.sortSelect.addEventListener("change", () => {
    showLibraryView();
    state.sortKey = refs.sortSelect.value;
    render();
  });

  document.querySelectorAll(".source-tab").forEach((button) => {
    button.addEventListener("click", () => {
      showLibraryView();
      state.activeSource = button.dataset.source;
      render();
    });
  });

  refs.captureButton.addEventListener("click", () => {
    showLibraryView();
    captureActiveTab();
  });
  refs.refreshButton.addEventListener("click", () => {
    showLibraryView();
    captureActiveTab();
  });
  refs.syncBookmarksButton.addEventListener("click", () => {
    showLibraryView();
    runAutoSync("bookmark");
  });
  refs.syncLikesButton.addEventListener("click", () => {
    showLibraryView();
    runAutoSync("like");
  });
  refs.aiClassifyButton.addEventListener("click", () => {
    showLibraryView();
    runAiClassification();
  });
  refs.importButton.addEventListener("click", () => refs.importInput.click());
  refs.importInput.addEventListener("change", handleImport);
  refs.exportButton.addEventListener("click", exportLibrary);
  refs.copyPromptButton.addEventListener("click", copyLlmPrompt);
  refs.renameCategoryButton.addEventListener("click", renameActiveCategory);
  refs.resetCategoriesButton.addEventListener("click", resetCategories);
  refs.askAiButton.addEventListener("click", () => {
    showLibraryView();
    openAskDialog();
  });
  refs.tutorialButton.addEventListener("click", showTutorialView);
  refs.tutorialView.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-tutorial-step]");
    if (!trigger) return;
    openTutorialLightbox(trigger.dataset.tutorialStep);
  });
  refs.openFullPageButton.addEventListener("click", openFullPage);
  refs.closeTutorialLightboxButton.addEventListener("click", closeTutorialLightbox);
  refs.previousTutorialButton.addEventListener("click", () => moveTutorialLightbox(-1));
  refs.nextTutorialButton.addEventListener("click", () => moveTutorialLightbox(1));
  refs.tutorialLightbox.addEventListener("click", (event) => {
    if (event.target === refs.tutorialLightbox) closeTutorialLightbox();
  });
  refs.closeAskButton.addEventListener("click", closeAskDialog);
  refs.askForm.addEventListener("submit", askLibrary);
  refs.askDialog.addEventListener("click", (event) => {
    if (event.target === refs.askDialog) closeAskDialog();
  });
  refs.settingsButton.addEventListener("click", openSettings);
  refs.closeSettingsButton.addEventListener("click", closeSettings);
  refs.settingsDialog.addEventListener("click", (event) => {
    if (event.target === refs.settingsDialog) closeSettings();
  });
  refs.providerSelect.addEventListener("change", applySelectedProviderPreset);
  refs.validateApiButton.addEventListener("click", validateApiSettings);
  refs.saveSettingsButton.addEventListener("click", saveSettings);
  bindRuntimeMessages();
  bindStorageUpdates();
  document.addEventListener("keydown", handleGlobalKeydown);
}

function bindRuntimeMessages() {
  if (!globalThis.chrome?.runtime?.onMessage) return;

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "AUTO_SYNC_PROGRESS_VIEW" && message?.type !== "AUTO_SYNC_PROGRESS") {
      return false;
    }

    handleAutoSyncProgress(message);
    return false;
  });
}

function bindStorageUpdates() {
  if (!globalThis.chrome?.storage?.onChanged) return;

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEYS.appState]) return;
    scheduleLiveLibraryRefresh(250);
  });
}

function scheduleLiveLibraryRefresh(delay = 0) {
  window.clearTimeout(state.liveRefreshTimer);
  state.liveRefreshTimer = window.setTimeout(refreshLibraryFromStorage, delay);
}

async function refreshLibraryFromStorage() {
  if (state.liveRefreshInFlight) {
    scheduleLiveLibraryRefresh(250);
    return;
  }

  state.liveRefreshInFlight = true;
  try {
    state.appState = await loadAppState();
    state.appState.settings.ai = normalizeAiSettings(state.appState.settings.ai);
    rebuildAndRender();
    setAutoSyncState(state.autoSync);
  } finally {
    state.liveRefreshInFlight = false;
  }
}

function renderLanguage() {
  applyStaticTranslations(document, state.language);
  renderSortOptions();
  renderTutorialLightbox();
  setOperationStatus(t(state.language, "status.ready"));
}

function applyTheme() {
  document.body.classList.toggle("theme-light", state.theme === "light");
  document.body.classList.toggle("theme-dark", state.theme !== "light");
}

function renderSortOptions() {
  refs.sortSelect.replaceChildren(
    ...SORT_OPTIONS.map((option) => {
      const node = document.createElement("option");
      node.value = option.id;
      node.textContent = t(state.language, `sort.${option.id}`);
      node.selected = option.id === state.sortKey;
      return node;
    })
  );
}

function renderProviderOptions() {
  refs.providerSelect.replaceChildren(
    ...PROVIDER_PRESETS.map((provider) => {
      const option = document.createElement("option");
      option.value = provider.id;
      option.textContent = provider.name;
      return option;
    })
  );
}

function rebuildAndRender() {
  state.library = buildLibrary(state.appState.posts, {
    categoryAliases: state.appState.categoryAliases
  });
  render();
}

function render() {
  renderViewState();
  renderSourceTabs();
  renderOverview();
  renderCategories();

  const filtered = sortPosts(
    filterPosts(state.library.posts, {
      query: state.query,
      source: state.activeSource,
      categoryId: state.activeCategoryId
    }),
    state.sortKey
  );

  refs.resultCount.textContent = t(state.language, "result.count", { count: filtered.length });
  refs.activeFilters.textContent = t(state.language, "filter.summary", {
    source: sourceLabel(state.activeSource),
    category: categoryLabel(state.activeCategoryId)
  });
  refs.emptyState.hidden = filtered.length > 0;
  refs.postList.hidden = filtered.length === 0;
  refs.postList.replaceChildren(...filtered.map(renderPostCard));
}

function renderSourceTabs() {
  document.querySelectorAll(".source-tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.source === state.activeSource);
  });
}

function renderOverview() {
  const stats = state.library.stats;
  refs.totalCount.textContent = String(stats.total);
  refs.syncStatus.textContent = state.appState.sync.lastSyncAt
    ? t(state.language, "sync.lastUpdated", { time: formatDateTime(state.appState.sync.lastSyncAt) })
    : t(state.language, "sync.never");
  refs.coverageNote.textContent = coverageText();
}

function renderCategories() {
  const categories = [{
    id: "all",
    name: t(state.language, "category.all"),
    count: state.library.posts.length
  }, ...state.library.categories];

  refs.categoryList.replaceChildren(...categories.map((category) => renderCategoryButton(category, "list")));
  refs.topCategoryList.replaceChildren(...categories.map((category) => renderCategoryButton(category, "chip")));
}

function renderCategoryButton(category, variant = "list") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = variant === "chip" ? "category-chip" : "category-item";
  button.classList.toggle("is-active", state.activeCategoryId === category.id);
  button.innerHTML = `<span></span><small></small>`;
  button.querySelector("span").textContent = displayCategoryName(category);
  button.querySelector("small").textContent = String(category.count || 0);
  button.addEventListener("click", () => {
    activateCategory(category.id);
  });
  return button;
}

function activateCategory(categoryId) {
  showLibraryView();
  state.activeCategoryId = categoryId;
  render();
}

function showLibraryView() {
  if (state.activeView === "library") return;
  state.activeView = "library";
  renderViewState();
}

function showTutorialView() {
  state.activeView = "tutorial";
  renderViewState();
}

function renderViewState() {
  refs.libraryView.hidden = state.activeView !== "library";
  refs.tutorialView.hidden = state.activeView !== "tutorial";
  refs.tutorialButton.classList.toggle("is-active", state.activeView === "tutorial");
}

function applyTutorialShotMode() {
  const mode = new URLSearchParams(location.search).get("tutorialShot");
  if (!mode) return;

  document.body.classList.add("is-tutorial-shot");
  if (mode === "tutorial") {
    showTutorialView();
    return;
  }

  if (mode.startsWith("lightbox-")) {
    showTutorialView();
    openTutorialLightbox(mode.replace("lightbox-", ""));
    return;
  }

  if (mode === "settings") {
    openSettings();
    return;
  }

  if (mode === "ask") {
    openAskDialog();
    return;
  }

  if (mode === "filters") {
    const firstCategory = state.library.categories.find((category) => category.count > 0);
    if (firstCategory) {
      state.activeCategoryId = firstCategory.id;
      render();
    }
  }
}

function openTutorialLightbox(stepId) {
  const index = TUTORIAL_STEPS.findIndex((step) => step.id === stepId);
  state.activeTutorialStepIndex = index >= 0 ? index : 0;
  renderTutorialLightbox();
  refs.tutorialLightbox.hidden = false;
  refs.closeTutorialLightboxButton.focus();
}

function closeTutorialLightbox() {
  refs.tutorialLightbox.hidden = true;
}

function moveTutorialLightbox(direction) {
  const nextIndex = (state.activeTutorialStepIndex + direction + TUTORIAL_STEPS.length) % TUTORIAL_STEPS.length;
  state.activeTutorialStepIndex = nextIndex;
  renderTutorialLightbox();
}

function renderTutorialLightbox() {
  if (!refs.tutorialLightboxTitle) return;

  const step = TUTORIAL_STEPS[state.activeTutorialStepIndex] || TUTORIAL_STEPS[0];
  refs.tutorialLightboxCounter.textContent = `${String(state.activeTutorialStepIndex + 1).padStart(2, "0")} / ${String(TUTORIAL_STEPS.length).padStart(2, "0")}`;
  refs.tutorialLightboxTitle.textContent = t(state.language, step.titleKey);
  refs.tutorialLightboxBody.textContent = t(state.language, step.bodyKey);
  refs.tutorialLightboxImage.src = step.image;
  refs.tutorialLightboxImage.alt = t(state.language, step.altKey);
}

function handleGlobalKeydown(event) {
  if (!refs.tutorialLightbox.hidden) {
    if (event.key === "Escape") closeTutorialLightbox();
    if (event.key === "ArrowLeft") moveTutorialLightbox(-1);
    if (event.key === "ArrowRight") moveTutorialLightbox(1);
  }
}

function renderPostCard(post) {
  const fragment = refs.template.content.cloneNode(true);
  applyStaticTranslations(fragment, state.language);

  const card = fragment.querySelector(".post-card");
  const avatar = fragment.querySelector(".avatar");
  const authorName = fragment.querySelector(".author-name");
  const authorUsername = fragment.querySelector(".author-username");
  const postLink = fragment.querySelector(".post-link");
  const postText = fragment.querySelector(".post-text");
  const postSummary = fragment.querySelector(".post-summary");
  const sourceBadges = fragment.querySelector(".source-badges");
  const postDate = fragment.querySelector(".post-date");
  const confidence = fragment.querySelector(".confidence");
  const score = fragment.querySelector(".score-pill");
  const likes = fragment.querySelector(".likes");
  const retweets = fragment.querySelector(".retweets");
  const bookmarks = fragment.querySelector(".bookmarks");
  const replies = fragment.querySelector(".replies");
  const tagRow = fragment.querySelector(".tag-row");
  const categorySelect = fragment.querySelector(".category-picker select");

  card.dataset.postId = post.id;
  avatar.textContent = initials(post.author.name || post.author.username);
  authorName.textContent = post.author.name || post.author.username;
  authorUsername.textContent = post.author.username ? `@${post.author.username}` : "unknown";
  postLink.href = post.url || "https://x.com";
  postText.textContent = post.text || t(state.language, "card.noText");
  postSummary.textContent = post.summary;
  postDate.textContent = formatDate(post.createdAt);
  confidence.textContent = t(state.language, "card.confidence", { value: Math.round(post.confidence * 100) });
  confidence.title = t(state.language, "card.confidenceHelp");
  confidence.setAttribute("aria-label", confidence.title);
  score.textContent = t(state.language, "card.recommended", { value: post.score });
  likes.textContent = t(state.language, "card.likes", { value: formatNumber(post.metrics.likes) });
  retweets.textContent = t(state.language, "card.retweets", { value: formatNumber(post.metrics.retweets) });
  bookmarks.textContent = t(state.language, "card.bookmarks", { value: formatNumber(post.metrics.bookmarks) });
  replies.textContent = t(state.language, "card.replies", { value: formatNumber(post.metrics.replies) });

  sourceBadges.replaceChildren(...post.sourceTypes.map((source) => {
    const badge = document.createElement("span");
    badge.className = "source-badge";
    badge.textContent = sourceLabel(source);
    return badge;
  }));

  tagRow.replaceChildren(...post.tags.map((tag) => {
    const node = document.createElement("span");
    node.className = "tag";
    node.textContent = tag;
    return node;
  }));

  categorySelect.replaceChildren(...state.library.categories.map((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = displayCategoryName(category);
    option.selected = category.id === post.categoryId;
    return option;
  }));

  categorySelect.addEventListener("change", async () => {
    const category = state.library.categories.find((item) => item.id === categorySelect.value);
    await updatePostCategory(post.id, category);
  });

  return fragment;
}

async function captureActiveTab() {
  if (!globalThis.chrome?.runtime?.sendMessage) {
    setOperationStatus(t(state.language, "status.refreshNoTab"));
    return;
  }

  refs.captureButton.disabled = true;
  refs.refreshButton.disabled = true;
  setOperationStatus(t(state.language, "status.capturing"));

  try {
    const result = await chrome.runtime.sendMessage({ type: "REQUEST_ACTIVE_CAPTURE" });
    if (!result?.ok) throw new Error(result?.error || "refresh_failed");
    state.appState = await loadAppState();
    state.appState.settings.ai = normalizeAiSettings(state.appState.settings.ai);
    rebuildAndRender();
    setOperationStatus(t(state.language, "status.captureDone", { count: result.captured || 0 }));
  } catch (error) {
    setOperationStatus(error.message === "no_active_x_tab"
      ? t(state.language, "status.refreshNoTab")
      : `${t(state.language, "error.generic")}: ${friendlyError(error)}`);
  } finally {
    refs.captureButton.disabled = false;
    refs.refreshButton.disabled = false;
  }
}

async function runAutoSync(target) {
  if (!globalThis.chrome?.runtime?.sendMessage) {
    setOperationStatus(t(state.language, "status.refreshNoTab"));
    return;
  }

  const targetLabel = sourceLabel(target);
  setAutoSyncState({
    active: true,
    target,
    captured: 0,
    passes: 0,
    idleCount: 0,
    maxPasses: 0,
    nearBottom: false
  });
  setOperationStatus(t(state.language, "status.autoSyncRunning", { target: targetLabel }));

  try {
    const result = await chrome.runtime.sendMessage({
      type: "REQUEST_AUTO_SYNC",
      target
    });
    if (!result?.ok) throw new Error(result?.error || "auto_sync_failed");

    state.appState = await loadAppState();
    state.appState.settings.ai = normalizeAiSettings(state.appState.settings.ai);
    rebuildAndRender();
    setOperationStatus(t(state.language, "status.autoSyncDone", {
      target: targetLabel,
      count: result.captured || 0,
      passes: result.passes || 0,
      reason: autoSyncReasonLabel(result.reason)
    }));
  } catch (error) {
    setOperationStatus(`${t(state.language, "error.generic")}: ${friendlyError(error)}`);
  } finally {
    setAutoSyncState({
      active: false,
      target: "",
      captured: 0,
      passes: 0,
      idleCount: 0,
      maxPasses: 0,
      nearBottom: false
    });
  }
}

function handleAutoSyncProgress(message) {
  if (!state.autoSync.active) return;
  if (message.target && message.target !== state.autoSync.target) return;

  const next = {
    active: true,
    target: state.autoSync.target,
    captured: Number(message.captured || 0),
    passes: Number(message.passes || 0),
    idleCount: Number(message.idleCount || 0),
    maxPasses: Number(message.maxPasses || 0),
    nearBottom: Boolean(message.nearBottom)
  };

  setAutoSyncState(next);
  setOperationStatus(t(state.language, "status.autoSyncProgress", {
    target: sourceLabel(next.target),
    count: next.captured,
    passes: next.passes,
    idle: next.idleCount,
    bottom: next.nearBottom ? t(state.language, "sync.bottom.yes") : t(state.language, "sync.bottom.no")
  }));
  scheduleLiveLibraryRefresh(120);
}

function setAutoSyncState(nextState) {
  state.autoSync = nextState;

  const buttons = [refs.syncBookmarksButton, refs.syncLikesButton, refs.captureButton, refs.refreshButton];
  buttons.forEach((button) => {
    button.disabled = nextState.active;
  });

  refs.syncBookmarksButton.classList.toggle("is-loading", nextState.active && nextState.target === "bookmark");
  refs.syncLikesButton.classList.toggle("is-loading", nextState.active && nextState.target === "like");

  refs.syncBookmarksButton.textContent = syncButtonLabel("bookmark");
  refs.syncLikesButton.textContent = syncButtonLabel("like");
}

function syncButtonLabel(target) {
  if (!state.autoSync.active || state.autoSync.target !== target) {
    return t(state.language, target === "bookmark" ? "button.syncBookmarks" : "button.syncLikes");
  }

  return t(state.language, "button.syncing", {
    count: state.autoSync.captured,
    passes: state.autoSync.passes
  });
}

function autoSyncReasonLabel(reason) {
  if (reason === "idle") return t(state.language, "sync.reason.idle");
  if (reason === "max_passes") return t(state.language, "sync.reason.maxPasses");
  return t(state.language, "sync.reason.done");
}


async function runAiClassification() {
  const ai = normalizeAiSettings(state.appState.settings.ai);
  if (!ai.apiKey || ai.validation?.status !== "valid") {
    setOperationStatus(t(state.language, "status.aiNeedKey"));
    openSettings();
    return;
  }

  refs.aiClassifyButton.disabled = true;
  refs.aiClassifyButton.textContent = t(state.language, "button.runningAi");
  setOperationStatus(t(state.language, "button.runningAi"));

  try {
    await ensureProviderPermission(ai.baseUrl);
    const payload = await requestAiClassification(ai, state.library.posts, state.library.categories, state.language);
    state.appState = {
      ...state.appState,
      posts: applyClassificationPayload(state.appState.posts, payload),
      sync: {
        ...state.appState.sync,
        lastSyncAt: new Date().toISOString(),
        lastSource: "ai",
        coverageNote: state.language === "en"
          ? "AI classification applied to the current local library."
          : "已使用当前模型对本地资料库完成 AI 分类。"
      }
    };
    await persist();
    rebuildAndRender();
    setOperationStatus(t(state.language, "status.aiDone"));
  } catch (error) {
    setOperationStatus(`${t(state.language, "error.generic")}: ${friendlyError(error)}`);
  } finally {
    refs.aiClassifyButton.disabled = false;
    refs.aiClassifyButton.textContent = t(state.language, "button.aiClassify");
  }
}

async function handleImport() {
  const file = refs.importInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const imported = parseImportedPosts(text);
    state.appState = {
      ...state.appState,
      posts: mergeImportedPosts(state.appState.posts, imported),
      sync: {
        ...state.appState.sync,
        lastSyncAt: new Date().toISOString(),
        lastSource: "import",
        importedCount: state.appState.sync.importedCount + imported.length,
        coverageNote: state.language === "en"
          ? `Imported ${imported.length} JSON posts; duplicate status URLs are merged.`
          : `已导入 ${imported.length} 条 JSON 内容；重复 URL 或 status id 会自动合并。`
      }
    };
    await persist();
    rebuildAndRender();
    setOperationStatus(t(state.language, "status.imported"));
  } catch (error) {
    window.alert(error.message || t(state.language, "error.import"));
  } finally {
    refs.importInput.value = "";
  }
}

async function updatePostCategory(postId, category) {
  if (!category) return;

  state.appState = {
    ...state.appState,
    posts: state.appState.posts.map((post) => {
      if (post.id !== postId) return post;
      return {
        ...post,
        categoryId: category.id,
        categoryName: category.name,
        isUserCorrected: true,
        correctedAt: new Date().toISOString()
      };
    })
  };

  await persist();
  rebuildAndRender();
}

async function renameActiveCategory() {
  if (state.activeCategoryId === "all") {
    window.alert(t(state.language, "dialog.chooseCategory"));
    return;
  }

  const category = state.library.categories.find((item) => item.id === state.activeCategoryId);
  if (!category) return;

  const nextName = window.prompt(t(state.language, "dialog.renamePrompt"), displayCategoryName(category))?.trim();
  if (!nextName) return;

  state.appState = {
    ...state.appState,
    categoryAliases: {
      ...state.appState.categoryAliases,
      [category.id]: nextName
    },
    posts: state.appState.posts.map((post) => post.categoryId === category.id
      ? { ...post, categoryName: nextName }
      : post)
  };

  await persist();
  rebuildAndRender();
}

function exportLibrary() {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: "0.3.0",
    posts: state.library.posts,
    categories: state.library.categories,
    sync: state.appState.sync,
    settings: {
      language: state.appState.settings.language,
      theme: state.appState.settings.theme,
      ai: {
        providerId: state.appState.settings.ai.providerId,
        baseUrl: state.appState.settings.ai.baseUrl,
        model: state.appState.settings.ai.model,
        validation: state.appState.settings.ai.validation
      }
    }
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `x-organizer-export-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setOperationStatus(t(state.language, "status.exported"));
}

async function copyLlmPrompt() {
  const corrections = state.library.posts
    .filter((post) => post.isUserCorrected)
    .map((post) => ({
      id: post.id,
      category_id: post.categoryId,
      category_name: post.categoryName,
      corrected_at: post.correctedAt
    }));

  const prompt = buildLlmClassificationPrompt(
    state.library.posts,
    state.library.categories,
    corrections,
    state.language
  );
  await navigator.clipboard.writeText(prompt);
  refs.copyPromptButton.textContent = t(state.language, "button.copied");
  window.setTimeout(() => {
    refs.copyPromptButton.textContent = t(state.language, "button.copyPrompt");
  }, 1200);
}

async function resetCategories() {
  const confirmed = window.confirm(t(state.language, "dialog.resetCategoriesConfirm"));
  if (!confirmed) return;

  state.appState = {
    ...state.appState,
    posts: state.appState.posts.map((post) => ({
      ...post,
      categoryId: "",
      categoryName: "",
      confidence: 0,
      classificationSource: "",
      classificationReason: "",
      classifiedAt: "",
      isUserCorrected: false,
      correctedAt: ""
    })),
    categoryAliases: {},
    sync: {
      ...state.appState.sync,
      lastSyncAt: new Date().toISOString(),
      coverageNote: state.language === "en"
        ? "Category corrections reset; captured posts were kept."
        : "已重置分类；已采集内容仍保留。"
    }
  };
  state.activeCategoryId = "all";
  await persist();
  rebuildAndRender();
  setOperationStatus(t(state.language, "status.resetCategories"));
}

function openSettings() {
  renderSettingsForm();
  refs.settingsDialog.hidden = false;
  refs.apiKeyInput.focus();
}

function closeSettings() {
  refs.settingsDialog.hidden = true;
}

function openAskDialog() {
  refs.askDialog.hidden = false;
  if (!refs.askQuestionInput.value.trim()) {
    refs.askQuestionInput.value = t(state.language, "ask.example");
  }
  refs.askQuestionInput.focus();
}

function closeAskDialog() {
  refs.askDialog.hidden = true;
}

async function askLibrary(event) {
  event.preventDefault();
  const ai = normalizeAiSettings(state.appState.settings.ai);
  if (!ai.apiKey || ai.validation?.status !== "valid") {
    setOperationStatus(t(state.language, "status.aiNeedKey"));
    closeAskDialog();
    openSettings();
    return;
  }

  const question = refs.askQuestionInput.value.trim();
  if (!question) {
    setOperationStatus(t(state.language, "status.askNeedQuestion"));
    return;
  }

  refs.askSubmitButton.disabled = true;
  refs.askSubmitButton.textContent = t(state.language, "button.asking");
  refs.askAnswer.hidden = false;
  refs.askAnswer.textContent = t(state.language, "status.asking");
  setOperationStatus(t(state.language, "status.asking"));

  try {
    await ensureProviderPermission(ai.baseUrl);
    const result = await requestLibraryAnswer(ai, question, state.library.posts, state.language);
    renderAskResult(result, question);
    setOperationStatus(t(state.language, "status.askDone"));
  } catch (error) {
    const message = friendlyError(error);
    refs.askAnswer.textContent = `${t(state.language, "error.generic")}: ${message}`;
    setOperationStatus(`${t(state.language, "error.generic")}: ${message}`);
  } finally {
    refs.askSubmitButton.disabled = false;
    refs.askSubmitButton.textContent = t(state.language, "button.ask");
  }
}

function renderAskResult(result, question) {
  const answer = result?.answer || t(state.language, "ask.emptyAnswer");
  const reasonById = new Map((result?.items || []).map((item) => [String(item.id), item.reason]));
  const matchedPosts = resolveAskPosts(result, question);
  const summary = document.createElement("p");
  summary.className = "ask-answer__summary";
  summary.textContent = answer;

  const list = document.createElement("div");
  list.className = "ask-card-list";
  list.replaceChildren(...matchedPosts.map((post) => renderAskPostCard(post, reasonById.get(String(post.id)))));

  refs.askAnswer.hidden = false;
  refs.askAnswer.replaceChildren(summary, list);
}

function resolveAskPosts(result, question) {
  const byId = new Map(state.library.posts.map((post) => [String(post.id), post]));
  const direct = (result?.items || [])
    .map((item) => byId.get(String(item.id)))
    .filter(Boolean);
  if (direct.length) return uniquePosts(direct).slice(0, 8);
  return findLocalAskMatches(question).slice(0, 8);
}

function findLocalAskMatches(question) {
  const tokens = tokenizeQuestion(question);
  if (!tokens.length) return state.library.posts.slice(0, 8);
  return state.library.posts
    .map((post) => ({
      post,
      score: tokens.reduce((total, token) => total + (searchablePostText(post).includes(token) ? 1 : 0), 0)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.post.score || 0) - (a.post.score || 0))
    .map((item) => item.post);
}

function renderAskPostCard(post, reason = "") {
  const card = document.createElement("article");
  card.className = "ask-card";

  const top = document.createElement("div");
  top.className = "ask-card__top";

  const author = document.createElement("div");
  author.className = "ask-card__author";
  author.textContent = `${post.author?.name || post.author?.username || "X"} ${post.author?.username ? `@${post.author.username}` : ""}`;

  const open = document.createElement("a");
  open.href = post.url || "https://x.com";
  open.target = "_blank";
  open.rel = "noreferrer";
  open.textContent = t(state.language, "card.original");

  top.replaceChildren(author, open);

  const text = document.createElement("p");
  text.className = "ask-card__text";
  text.textContent = post.text || post.summary || t(state.language, "card.noText");

  const meta = document.createElement("div");
  meta.className = "ask-card__meta";
  const source = Array.isArray(post.sourceTypes) ? post.sourceTypes.map(sourceLabel).join(" / ") : "-";
  meta.textContent = `${source} · ${displayCategoryName({ id: post.categoryId, name: post.categoryName })} · ${formatDate(post.createdAt)}`;

  const why = document.createElement("p");
  why.className = "ask-card__reason";
  why.textContent = reason || localMatchReason();

  card.replaceChildren(top, text, meta, why);
  return card;
}

function uniquePosts(posts) {
  const seen = new Set();
  return posts.filter((post) => {
    const id = String(post.id || post.url || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function tokenizeQuestion(question) {
  const text = String(question || "").toLowerCase();
  const tokens = text
    .split(/[^\p{L}\p{N}_]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  const zhTerms = ["设计", "收藏", "书签", "点赞", "转发", "工程", "代码", "创业", "商业", "写作", "内容", "交易", "投资", "ai", "模型", "工具"];
  return Array.from(new Set([
    ...tokens,
    ...zhTerms.filter((term) => text.includes(term))
  ]));
}

function searchablePostText(post) {
  return [
    post.text,
    post.summary,
    post.categoryName,
    post.author?.name,
    post.author?.username,
    ...(Array.isArray(post.tags) ? post.tags : []),
    ...(Array.isArray(post.sourceTypes) ? post.sourceTypes : [])
  ].join(" ").toLowerCase();
}

function localMatchReason() {
  return state.language === "en" ? "Matched by local keyword fallback." : "根据本地关键词兜底匹配。";
}

function openFullPage() {
  const url = globalThis.chrome?.runtime?.getURL
    ? chrome.runtime.getURL("sidepanel/sidepanel.html?mode=page")
    : new URL("./sidepanel.html?mode=page", location.href).href;

  if (globalThis.chrome?.tabs?.create) {
    chrome.tabs.create({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function renderSettingsForm() {
  const ai = normalizeAiSettings(state.appState?.settings?.ai);
  refs.languageSelect.value = state.language;
  refs.themeSelect.value = state.theme;
  refs.providerSelect.value = ai.providerId;
  refs.baseUrlInput.value = ai.baseUrl;
  refs.modelInput.value = ai.model;
  refs.apiKeyInput.value = ai.apiKey;
  renderValidationStatus(ai.validation?.status || "untested");
}

function applySelectedProviderPreset() {
  const preset = getProviderPreset(refs.providerSelect.value);
  if (preset.id !== "custom") {
    refs.baseUrlInput.value = preset.baseUrl;
    refs.modelInput.value = preset.model;
  }
  renderValidationStatus("untested");
}

async function saveSettings() {
  const nextLanguage = refs.languageSelect.value;
  const nextTheme = refs.themeSelect.value;
  const ai = readSettingsForm();
  const previous = normalizeAiSettings(state.appState.settings.ai);
  const changedConnection = previous.providerId !== ai.providerId
    || previous.baseUrl !== ai.baseUrl
    || previous.model !== ai.model
    || previous.apiKey !== ai.apiKey;

  state.language = nextLanguage;
  state.theme = nextTheme;
  state.appState = {
    ...state.appState,
    settings: {
      language: nextLanguage,
      theme: nextTheme,
      ai: {
        ...ai,
        validation: changedConnection ? { status: "untested", checkedAt: "", message: "" } : ai.validation
      }
    }
  };

  await persist();
  renderLanguage();
  applyTheme();
  renderSettingsForm();
  rebuildAndRender();
  setOperationStatus(t(state.language, "settings.saved"));
}

async function validateApiSettings() {
  const config = readSettingsForm();
  refs.validateApiButton.disabled = true;
  refs.validateApiButton.textContent = t(state.language, "button.validating");
  renderValidationStatus("untested");
  renderValidationMessage("");

  try {
    await ensureProviderPermission(config.baseUrl);
    const result = await validateProviderConfig(config);
    const nextAi = {
      ...config,
      validation: {
        status: "valid",
        checkedAt: result.checkedAt,
        message: result.message
      }
    };
    state.appState = {
      ...state.appState,
      settings: {
        language: refs.languageSelect.value,
        theme: refs.themeSelect.value,
        ai: nextAi
      }
    };
    state.language = refs.languageSelect.value;
    state.theme = refs.themeSelect.value;
    await persist();
    renderLanguage();
    applyTheme();
    renderSettingsForm();
    renderValidationMessage("");
    setOperationStatus(t(state.language, "status.validationOk"));
  } catch (error) {
    const message = friendlyError(error);
    renderValidationStatus("invalid");
    renderValidationMessage(message);
    setOperationStatus(`${t(state.language, "status.validationFailed")}: ${message}`);
  } finally {
    refs.validateApiButton.disabled = false;
    refs.validateApiButton.textContent = t(state.language, "button.validate");
  }
}

function readSettingsForm() {
  const current = normalizeAiSettings(state.appState.settings.ai);
  return providerConfigFromForm({
    providerId: refs.providerSelect.value,
    baseUrl: refs.baseUrlInput.value,
    model: refs.modelInput.value,
    apiKey: refs.apiKeyInput.value,
    validation: current.validation
  });
}

function renderValidationStatus(status) {
  refs.apiValidationStatus.textContent = t(state.language, `settings.${status}`);
  refs.apiValidationStatus.dataset.status = status;
}

function renderValidationMessage(message) {
  refs.apiValidationMessage.textContent = message;
  refs.apiValidationMessage.hidden = !message;
}

async function persist() {
  await saveAppState(state.appState);
}

function setOperationStatus(message) {
  refs.operationStatus.textContent = message;
}

function sourceLabel(source) {
  if (source === "all") return t(state.language, "source.all");
  const label = t(state.language, `source.${source}`);
  return label === `source.${source}` ? source : label;
}

function categoryLabel(categoryId) {
  if (categoryId === "all") return t(state.language, "category.all");
  const category = state.library.categories.find((item) => item.id === categoryId);
  return category ? displayCategoryName(category) : "-";
}

function displayCategoryName(category) {
  if (!category) return "-";
  const localized = t(state.language, `category.${category.id}`);
  return localized === `category.${category.id}` ? category.name : localized;
}

function coverageText() {
  const source = state.appState.sync.lastSource;
  if (["sample", "import", "visible", "bookmark", "like", "ai"].includes(source)) {
    return t(state.language, `coverage.${source}`);
  }
  return state.appState.sync.coverageNote || t(state.language, "coverage.default");
}

function initials(value) {
  const text = String(value || "X").trim();
  return text.slice(0, 1).toUpperCase();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale(), {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale(), {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatNumber(value) {
  const number = Number(value) || 0;
  if (state.language === "zh" && number >= 10_000) return `${(number / 10_000).toFixed(1)}万`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return String(number);
}

function locale() {
  return state.language === "en" ? "en-US" : "zh-CN";
}

function friendlyError(error) {
  const message = error?.message || String(error);
  const code = message.split(":")[0];
  const known = {
    missing_api_key: state.language === "en" ? "Missing API key" : "缺少 API Key",
    missing_question: state.language === "en" ? "Enter a question first" : "请先输入问题",
    missing_base_url: state.language === "en" ? "Missing base URL" : "缺少 Base URL",
    invalid_base_url: state.language === "en" ? "Base URL must be HTTPS" : "Base URL 必须是 HTTPS",
    missing_model: state.language === "en" ? "Missing model" : "缺少模型",
    request_timeout: state.language === "en"
      ? "The model request timed out. Try again, or reduce the collected library size."
      : "模型响应超时。可以重试，或先减少本地资料库数量再问。",
    invalid_json_response: state.language === "en" ? "Model did not return valid JSON" : "模型没有返回有效 JSON",
    empty_classification_result: state.language === "en" ? "Model returned no classification items" : "模型没有返回分类结果",
    provider_permission_denied: state.language === "en" ? "Provider host permission was denied" : "没有获得模型服务域名权限",
    no_active_x_tab: state.language === "en" ? "Open an X/Twitter tab first" : "请先打开一个 X/Twitter 标签页",
    open_likes_page: t(state.language, "status.openLikesPage"),
    open_bookmarks_page: t(state.language, "status.openBookmarksPage"),
    tab_load_timeout: state.language === "en" ? "X page load timed out" : "X 页面加载超时",
    auto_sync_already_running: state.language === "en" ? "Auto sync is already running" : "自动同步正在进行中"
  };

  if (code === "models_request_failed" || code === "chat_request_failed") {
    const [, status, ...rest] = message.split(":");
    const detail = rest.join(":").replace(/^"|"$/g, "").trim();
    return `HTTP ${status || "-"} ${detail || code}`;
  }

  return known[code] || message.slice(0, 180);
}

async function ensureProviderPermission(baseUrl) {
  if (!globalThis.chrome?.permissions) return;

  const origin = `${new URL(baseUrl).origin}/*`;
  const hasPermission = await chrome.permissions.contains({ origins: [origin] });
  if (hasPermission) return;

  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) throw new Error("provider_permission_denied");
}
