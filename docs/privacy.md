# Privacy

## English

X Organizer is designed as a local-first Chrome extension.

- Captured X/Twitter posts are stored in `chrome.storage.local`.
- API keys are stored in `chrome.storage.local`.
- JSON exports include posts, categories, sync state, and model configuration metadata, but do **not** include the API key.
- AI classification and Ask Library send selected local post content to the model provider configured by the user.
- The extension does not include a built-in API key.
- The extension does not use the official X API in the MVP.
- Auto-scroll sync only captures posts rendered in the user's browser session.

You should review your model provider's privacy policy before sending local library content to it.

## 中文

X Organizer / X 整理师按本地优先方式设计。

- 采集到的 X/Twitter 内容存储在 `chrome.storage.local`。
- API Key 存储在 `chrome.storage.local`。
- JSON 导出包含帖子、分类、同步状态和模型配置摘要，但**不会**包含 API Key。
- AI 分类和 AI 对话会把选中的本地帖子内容发送给用户自己配置的模型服务商。
- 扩展不内置任何 API Key。
- MVP 不使用官方 X API。
- 自动滚动同步只会采集用户浏览器会话中实际渲染出来的内容。

在把本地资料库内容发送给模型服务商前，请先确认对应服务商的隐私政策。
