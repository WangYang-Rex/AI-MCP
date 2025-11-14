# 三个 MCP 工具，让 Cursor 编程效率翻倍

2025年6月20日

## 工具简介

### Sequential Thinking

[Sequential Thinking](https://github.com/smithery-ai/reference-servers/tree/main/src/sequentialthinking) 是一种通过结构化思维过程提供动态和反思性问题解决能力的 MCP 工具。它通过结构化"思维链"（Chain of Thoughts）帮助 LLM 分步解决复杂问题，支持思维修订（revision）和分支探索（branching）。

#### 规则

1. 使用 Sequential Thinking 协议将任务拆解为**思维步骤**。
2. 每一步遵循以下结构：
   - 明确当前目标或假设（如“评估身份验证选项”、“重构状态管理”）。
   - 根据上下文选择合适的 MCP 工具（如 `search_docs`、`code_generator`、`error_explainer`）。
   - 清晰地记录结果/输出。
   - 确定下一步思考目标，继续推进。
3. 存在不确定性时：
   - 可通过“分支思考”探索多种解决路径。
   - 比较权衡不同策略或方案。
   - 允许回滚或编辑前序思维步骤。

适用场景包括复杂问题分解（如规划、设计）、需中途修正的分析任务（如迭代开发）、信息过滤（如排除无关内容）。

### Context7

[Context7](https://github.com/upstash/context7) 是由 upstash 开发的 MCP 工具，专注于解决 AI 知识过时的问题。它能让 AI 获取最新、版本特定的文档和代码示例，从而减少错误信息（幻觉）并提高效率。

#### 优势

- **最新、最准确的代码**：获取反映最新库版本和最佳实践的建议。
- **减少调试时间**：减少因过时的 AI 知识导致的错误修复时间。
- **拒绝代码幻觉**：依赖于已记录的、存在的函数。
- **精准版本**：能根据你用的特定库版本给答案。
- **无缝的工作流程**：直接集成到现有的 AI 编程助手中（如 Cursor、带有 MCP 扩展的 VS Code 等），无需频繁切换到文档网站。

Context7 服务器目前支持了 17650 个库的文档，并且还在不断更新中。

### MCP-Feedback-Enhanced

[MCP-Feedback-Enhanced](https://github.com/Minidoracat/mcp-feedback-enhanced) 是一个面向开发者的反馈驱动型工作流工具，核心目标是通过用户反馈优化 AI 操作，减少平台成本并提升开发效率。

#### 规则

1. 在任何流程、任务或对话中，无论是提问、响应还是完成阶段任务，都必须调用 MCP mcp-feedback-enhanced。
2. 收到用户反馈后，只要反馈内容非空，必须再次调用 MCP mcp-feedback-enhanced，并根据反馈调整行为。
3. 只有当用户明确表示"结束"或"不再需要交互"时，才能停止调用 MCP mcp-feedback-enhanced，此时流程才算完成。
4. 除非收到结束指令，所有步骤都必须反复调用 MCP mcp-feedback-enhanced。
5. 在任务完成前，需使用 MCP mcp-feedback-enhanced 向用户征求反馈。

#### 功能

- **AI Summary**：让 AI 梳理总结已完成的工作，用户可基于此给出反馈。
- **图像上传**：支持 PNG/JPG 等多种格式，并自动压缩至 1MB 以内。
- **多语言切换**：支持英语、繁简中文，根据系统语言自动切换。

通过这些功能，开发者可以在反馈阶段不断优化生成的代码或功能，直到满意为止。

## Cursor 配置

以下是 Cursor 的 MCP 配置示例：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "DEFAULT_MINIMUM_TOKENS": "6000"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "mcp-feedback-enhanced": {
      "command": "uvx",
      "args": ["mcp-feedback-enhanced@latest"],
      "timeout": 600,
      "autoApprove": ["interactive_feedback"]
    }
  }
}
```