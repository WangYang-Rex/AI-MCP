# 七牛云 AI 实时推理请求 - Node.js 实现

> 基于七牛云 AI 推理 API 的实时推理请求工具，支持流式和非流式两种模式

## 📚 API 文档

- **七牛云实时推理请求API接入说明文档**: https://developer.qiniu.com/aitokenapi/12882/ai-inference-api

## ✨ 功能特性

### 1. 核心功能
- ✅ **流式推理请求**：支持 Server-Sent Events (SSE) 格式的实时流式响应
- ✅ **非流式推理请求**：支持一次性获取完整响应
- ✅ **自动重试机制**：失败后自动重试3次，每次间隔1秒
- ✅ **完整的错误处理**：区分错误类型，提供详细的错误信息

### 2. 技术特点
- ✅ **零第三方依赖**：仅使用 Node.js 原生模块（https）
- ✅ **请求超时控制**：60秒超时保护
- ✅ **灵活配置**：支持自定义模型、温度、最大 token 数等参数
- ✅ **回调支持**：流式请求支持自定义回调函数处理数据块

## 📦 运行要求

- **Node.js**: >= 12.x
- **依赖**: 零第三方依赖，仅使用原生模块

## 🚀 快速开始

### 基本用法

```bash
# 运行脚本（包含示例）
node inference.js

# DEBUG模式（显示详细错误信息）
DEBUG=1 node inference.js
```

### 作为模块使用

```javascript
const { streamInference, inference, CONFIG } = require('./inference');

// 流式推理请求
const messages = [
  { role: 'user', content: '你好，请介绍一下自己' }
];

await streamInference(
  {
    model: 'qwen-plus',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: true
  },
  (chunk, data) => {
    // 实时处理每个数据块
    process.stdout.write(chunk);
  }
);

// 非流式推理请求
const response = await inference({
  model: 'qwen-plus',
  messages,
  temperature: 0.7,
  max_tokens: 1000,
  stream: false
});

console.log(response.choices[0].message.content);
```

## ⚙️ 配置说明

在 `inference.js` 文件顶部的 `CONFIG` 对象中可以自定义配置：

```javascript
const CONFIG = {
  // API 配置
  API_KEY: 'your-api-key-here',
  API_BASE_URL: 'https://api.qiniu.com',
  API_ENDPOINT: '/v1/chat/completions',
  
  // 请求配置
  REQUEST_TIMEOUT: 60000,        // 请求超时时间(ms)
  MAX_RETRIES: 3,                // 最大重试次数
  RETRY_DELAY: 1000,             // 重试间隔(ms)
  
  // 模型配置
  DEFAULT_MODEL: 'qwen-plus',    // 默认模型
  DEFAULT_TEMPERATURE: 0.7,      // 温度参数
  DEFAULT_MAX_TOKENS: 2000,      // 最大 token 数
};
```

### API Key

当前配置的 API Key：
```
sk-34bbdcdcc744853e58f35cb8d866c107631752558182cec899d934d259632ae4
```

⚠️ **注意**：请根据实际的七牛云 API 文档调整以下配置：
- `API_BASE_URL`：实际的 API 基础地址
- `API_ENDPOINT`：实际的 API 端点路径
- `DEFAULT_MODEL`：实际可用的模型名称

## 📖 API 函数说明

### `streamInference(options, onChunk, retries)`

发送流式推理请求。

**参数：**
- `options` (Object): 请求选项
  - `model` (string): 模型名称，默认 `CONFIG.DEFAULT_MODEL`
  - `messages` (Array): 消息数组，必需
  - `temperature` (number): 温度参数，默认 `0.7`
  - `max_tokens` (number): 最大 token 数，默认 `2000`
  - `stream` (boolean): 是否流式返回，默认 `true`
- `onChunk` (Function, 可选): 接收数据块的回调函数 `(chunk, data) => void`
- `retries` (number, 可选): 重试次数，默认 `CONFIG.MAX_RETRIES`

**返回：** `Promise<string>` - 完整的响应内容

### `inference(options, retries)`

发送非流式推理请求。

**参数：**
- `options` (Object): 请求选项（同 `streamInference`，但 `stream` 默认为 `false`）
- `retries` (number, 可选): 重试次数，默认 `CONFIG.MAX_RETRIES`

**返回：** `Promise<Object>` - 完整的响应对象

## 📝 消息格式

消息数组格式遵循 OpenAI Chat Completions API 格式：

```javascript
const messages = [
  {
    role: 'system',    // 系统角色（可选）
    content: '你是一个有用的助手'
  },
  {
    role: 'user',      // 用户角色
    content: '你好'
  },
  {
    role: 'assistant', // 助手角色（用于多轮对话）
    content: '你好！有什么可以帮助你的吗？'
  },
  {
    role: 'user',
    content: '请介绍一下人工智能'
  }
];
```

## 🔧 错误处理

脚本包含完善的错误处理机制：

- **网络错误**：自动重试，最多3次
- **服务器错误**（5xx）：自动重试
- **客户端错误**（4xx）：立即返回错误，不重试
- **超时错误**：自动重试
- **解析错误**：返回详细错误信息

设置 `DEBUG=1` 环境变量可以查看详细的错误栈信息。

## 📊 响应格式

### 流式响应

流式响应使用 Server-Sent Events (SSE) 格式，每个数据块格式：

```
data: {"choices":[{"delta":{"content":"内容片段"}}]}

data: [DONE]
```

### 非流式响应

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "完整回复内容"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## 🎯 使用示例

### 示例 1: 简单对话

```javascript
const { inference } = require('./inference');

const response = await inference({
  messages: [
    { role: 'user', content: '什么是人工智能？' }
  ]
});

console.log(response.choices[0].message.content);
```

### 示例 2: 流式输出

```javascript
const { streamInference } = require('./inference');

await streamInference(
  {
    messages: [
      { role: 'user', content: '请写一首关于春天的诗' }
    ]
  },
  (chunk) => {
    process.stdout.write(chunk);
  }
);
```

### 示例 3: 多轮对话

```javascript
const { inference } = require('./inference');

const messages = [
  { role: 'user', content: '我叫张三' },
  { role: 'assistant', content: '你好，张三！' },
  { role: 'user', content: '你还记得我的名字吗？' }
];

const response = await inference({ messages });
console.log(response.choices[0].message.content);
```

## ⚠️ 注意事项

1. **API 地址和端点**：请根据七牛云官方文档确认实际的 API 地址和端点路径
2. **模型名称**：请确认实际可用的模型名称，可能需要调整 `DEFAULT_MODEL`
3. **API Key 安全**：生产环境中请使用环境变量或配置文件管理 API Key，不要硬编码
4. **请求频率**：注意 API 的请求频率限制，避免过于频繁的请求
5. **Token 限制**：注意模型的 token 限制，合理设置 `max_tokens` 参数

## 📄 许可证

本项目仅供学习和参考使用。