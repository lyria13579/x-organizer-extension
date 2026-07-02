# X Organizer / X 整理师

一个本地优先的 Chrome 扩展：把你在 X/Twitter 里的书签、点赞、转发和当前页面可见推文，整理成可搜索、可分类、可 AI 提问的个人资料库。

[English README](./README.md)

![X 整理师资料库](./docs/screenshots/zh-library-light.png)

## 为什么做

X 的收藏很容易越积越多，但真正要找回某条推文时很痛苦。X Organizer 的第一版选择本地优先：读取浏览器里已经加载出来的推文，保存到 `chrome.storage.local`，用卡片、分类、排序和搜索帮你重新整理。需要 AI 分类或 AI 对话时，再接入你自己的模型 API Key。

MVP 不依赖官方 X API。

## 功能

- **在 X/Twitter 页面内打开侧边栏**：向 `x.com` / `twitter.com` 注入 `X Organizer` 入口。
- **本地优先资料库**：帖子、分类、设置和同步状态保存在浏览器本地。
- **采集当前页**：抓取当前 X/Twitter 标签页已经渲染出来的可见推文。
- **自动滚动同步**：同步 Bookmarks / Likes 页面，边滚动边采集 X 已加载内容。
- **卡片化浏览**：作者、正文摘要、来源、热度指标、标签和分类一眼可见。
- **筛选和排序**：按来源、分类、关键词筛选；按推荐分、点赞、转发、收藏、评论、浏览量、发布时间、保存时间排序。
- **AI 分类**：使用你自己的模型 API 重新生成分类和标签。
- **AI 对话**：直接问本地资料库，回答会以匹配卡片形式展示。
- **自定义模型服务**：支持 DeepSeek、OpenAI、OpenRouter、Moonshot/Kimi、Qwen/DashScope、SiliconFlow、AIMLAPI 和自定义 OpenAI-compatible 服务。
- **中英文切换**。
- **深色/浅色主题**。
- **JSON 导入/导出**：导出资料库时不会导出 API Key。

## 截图

| 中文 | English |
| --- | --- |
| ![中文浅色资料库](./docs/screenshots/zh-library-light.png) | ![English light library](./docs/screenshots/en-library-light.png) |
| ![中文设置](./docs/screenshots/zh-settings-light.png) | ![English settings](./docs/screenshots/en-settings-light.png) |
| ![中文教程](./docs/screenshots/zh-tutorial-light.png) | ![English AI chat](./docs/screenshots/en-ai-chat-light.png) |

深色模式：

![English dark library](./docs/screenshots/en-library-dark.png)

## 本地安装

1. 克隆或下载这个仓库。
2. 打开 Chrome：`chrome://extensions`。
3. 开启 **Developer mode / 开发者模式**。
4. 点击 **Load unpacked / 加载已解压的扩展程序**。
5. 选择包含 `manifest.json` 的项目目录。
6. 打开 `https://x.com` 或 `https://twitter.com`。
7. 点击 X 左侧导航里的 `X Organizer` 入口，或点击浏览器扩展图标打开侧边栏。

## 使用方法

### 采集当前页

打开任意已加载推文的 X/Twitter 页面，点击 **采集当前页**。扩展会读取当前页面已经渲染出来的推文，并合并到本地资料库。

### 同步书签/点赞

点击 **同步书签** 或 **同步点赞**。扩展会打开/滚动对应页面，并采集 X 实际渲染出来的内容。

这不是官方 X API 爬虫，历史覆盖率取决于 X 在当前浏览器会话中加载了多少内容。

### 设置模型 API

打开 **设置**：

1. 选择模型服务。
2. 填写 Base URL、模型名和 API Key。
3. 点击 **校验 API**。
4. 校验成功后保存。

API Key 只保存在 `chrome.storage.local`，导出 JSON 时不会包含明文 Key。

### 用 AI 问资料库

点击 **AI 对话**，例如输入：

```text
找出有关设计系统的收藏，并列出来。
```

AI 只会读取已经采集到本地的内容。

## 开发

```bash
npm install
npm run check
```

脚本：

- `npm run validate`：检查扩展结构和必要文件。
- `npm test`：运行 `tests/` 下的 Node 测试。
- `npm run check`：执行结构校验和测试。

## 目录结构

```text
manifest.json              Chrome Manifest V3 配置
background.js              Service worker、打开侧边栏、采集/同步消息
content/                   X/Twitter content script 和注入入口
sidepanel/                 侧边栏 HTML/CSS/JS
src/domain.js              数据标准化、去重、分类、筛选、排序、评分
src/providers.js           模型服务预设和 API 配置校验
src/aiClient.js            OpenAI-compatible API 校验、分类、问答
src/i18n.js                中英文文案
src/storage.js             chrome.storage.local 与本地预览 fallback
data/sample-posts.js       本地预览样本
docs/                      技术说明、截图、隐私说明
tests/                     Node 测试
```

## 隐私与安全

- 本地推文资料库存储在 `chrome.storage.local`。
- API Key 存在本地，不会出现在 JSON 导出里。
- AI 分类和 AI 对话会把选中的本地帖子内容发送给你配置的模型服务商。
- MVP 不调用官方 X API。
- 仓库不内置任何 API Key。

更多说明见 [隐私说明](./docs/privacy.md)。

## 当前限制

- 这是 MVP，依赖页面 DOM 可见内容采集，而不是官方 X API。
- Bookmarks / Likes 同步覆盖率取决于 X 页面滚动时实际加载了多少。
- X DOM 结构变化可能导致采集选择器失效。
- 大规模资料库后续更适合迁移到 IndexedDB。

## 发布前检查

发布或分享前运行：

```bash
npm run check
rg -n "sk-[A-Za-z0-9_-]+|api[-_ ]?key|Bearer " .
```

完整清单见 [发布检查清单](./docs/release-checklist.md)。
