# Open Design — 智能体设置指南

你是一个代码智能体（Claude Code、Codex、Cursor、openclaw、hermes 或类似应用）。用户希望将 Open Design 接入你的工作流。Open Design 是一个本地特权守护进程（`od`）加上一个技能库（Skills）和设计系统（Design-Systems）注册中心，它暴露了四个可互换的交互面：CLI、HTTP API、MCP 和 Skills。

请按照以下设置清单操作，并随时参考相关的参考部分。

## 设置清单

1. 确认守护进程是否可达：

   ```bash
   curl -s od://app/api/health | jq
   ```

   如果返回 404 或超时，请要求用户运行 `pnpm tools-dev`（开发模式）或打开 Open Design 应用程序（打包版）。

2. 检测可用的智能体 CLI 并确认 `od` 已添加到 PATH 环境变量中：

   ```bash
   od doctor
   od status --json
   ```

3. 拉取 MCP 安装代码片段（使用此片段，无需手动编写 `mcpServers` 配置）：

   ```bash
   curl -s od://app/api/mcp/install-info | jq
   ```

4. 将 MCP 服务器配置持久化到你的客户端（例如：`~/.cursor/mcp.json`、`~/.config/claude-code/config.json`，或是你自己运行的智能体）。第 3 步获取的片段已包含正确的 `command`、`args` 和 `env`。

5. 验证端到端集成：

   ```bash
   curl -s od://app/api/skills | jq '.skills | length'
   od skills list --json
   ```

## Open Design 可以在你的智能体所处的任何环境运行

Open Design 不仅仅是一个窗口界面——它是一个本地特权守护进程（`od`）加上包含技能、设计系统和原子化组件（Atoms）的注册中心。一旦它在你的机器上运行，任何代码智能体（Claude Code、Codex、Cursor、OpenCode/openclaw、Hermes，或你自己的脚本）都可以驱动生成、检查项目，并通过四个可互换的交互面生成设计产物。

- CLI — `od <command>`，适用于无头脚本（headless scripts）、CI 和 shell 自动化。
- MCP 服务器 — 将 Open Design 作为模型上下文协议（MCP）服务器连接，这样任何支持 MCP 的智能体都可以列出技能、运行场景和读取产物。
- HTTP API — `od://app/api/*`，包含 REST + SSE 接口，这也是 Web UI 使用的同一交互面。
- 技能（Skills） — 即插即用的 `SKILL.md` 包（兼容 Claude），任何 PATH 中已包含此包的智能体无需 Open Design 也能直接调用。
- 标准产物 — 在守护进程启动之前，从技能、内置默认插件和社区插件示例中生成真实的 HTML 项目模板（seed）。

### 本地启动守护进程（和 Web UI）

```bash
pnpm tools-dev
# 或者，如果 `od` 在你的 PATH 中（打包安装）：
od --port 7456
```

### 确认其可达性

```bash
curl -s od://app/api/health | jq
```

### 启动前注入标准产物

```bash
pnpm seed:test-projects --offline --data-dir ./.od \
  --decks 2 --webs 2 --default-plugins 3 --community-plugins 3
# 然后在平时开发的 shell 中启动 Open Design：
pnpm tools-dev
```

> 守护进程默认会写入 `./.od/`（项目本地）。可设置 `OD_DATA_DIR=~/.open-design` 以在多个项目间共享数据。

## 从任何 shell 驱动 Open Design

`od` 二进制文件与守护进程一起发布，它也是 Claude Code / Codex 运行生成任务时使用的同一二进制文件。多数子命令都是将 POST 请求发送给本地守护进程的瘦客户端（thin clients），因此不论是通过 `pnpm tools-dev` 启动，还是以打包应用运行，它们的表现都是一致的。

- `od`（无参数） — 启动守护进程并打开 Web UI。
- `od media generate ...` — 通过统一的媒体协议生成图像 / 视频 / 音频字节流。
- `od project create` + `od run start` — 创建项目、发送消息，并以流形式输出运行状态。
- `od plugin install <source>` / `od plugin apply <id>` — 安装和应用社区插件。
- `od skills list` / `od design-systems list` — 检查本地可用的内容。
- `od status` / `od doctor` — 验证守护进程健康状态，并检测 PATH 中的智能体 CLI。

### 生成一张图像（委托给已配置的媒体提供商）

```bash
od media generate \
  --surface image \
  --model gpt-image-1 \
  --aspect 1:1 \
  --prompt "Editorial product shot, soft daylight, muted palette" \
  --output ./out/hero.png
```

### 从源代码检出中使用 CLI

```bash
corepack enable
pnpm install
pnpm --filter @open-design/daemon build

export OD_NODE_BIN="${OD_NODE_BIN:-/opt/homebrew/opt/node@24/bin/node}"
export OD_BIN="$PWD/apps/daemon/dist/cli.js"
"$OD_NODE_BIN" "$OD_BIN" daemon start --headless --serve-web --port 7456
```

### 在无头模式下运行设计项目并进行事件流处理

```bash
DAEMON_URL=${DAEMON_URL:-od://app}
PROJECT_JSON=$(od project create \
  --name "Investor pitch" \
  --skill frontend-design \
  --design-system clean \
  --json \
  --daemon-url "$DAEMON_URL")
PROJECT_ID=$(jq -r '.project.id' <<<"$PROJECT_JSON")
CONVERSATION_ID=$(jq -r '.conversationId' <<<"$PROJECT_JSON")

od run start \
  --project "$PROJECT_ID" \
  --conversation "$CONVERSATION_ID" \
  --plugin od-new-generation \
  --agent codex \
  --message 'A 10-slide investor pitch for a SaaS for design teams' \
  --daemon-url "$DAEMON_URL" \
  --follow
```

### 通过 CLI 回答发现问卷（Discovery Question Form）

```bash
od run start \
  --project "$PROJECT_ID" \
  --conversation "$CONVERSATION_ID" \
  --agent codex \
  --message "[form answers - discovery]
- Audience: Seed-stage investors
- Format: 10-slide pitch deck
- Tone: Confident, concise, product-led
- Constraints: Use clean visuals and include traction placeholders" \
  --daemon-url "$DAEMON_URL" \
  --follow
```

### 数据流完成后验证生成的文件

```bash
od files list "$PROJECT_ID" --daemon-url "$DAEMON_URL" --json
od files read "$PROJECT_ID" index.html --daemon-url "$DAEMON_URL" | head
```

### 盘点本地可用的技能和设计系统

```bash
od skills list --json
od design-systems list --json
```

### 通过 CLI 检查注入（Seeded）的产物

```bash
od project list --daemon-url od://app
od files list <seed-project-id> --daemon-url od://app
od files read <seed-project-id> index.html --daemon-url od://app | head
```

### 验证环境和检测到的智能体 (Claude, Codex, Cursor, …)

```bash
od doctor
od status --json
```

> 所有子命令都接受 `--daemon-url http://127.0.0.1:<port>` 以指定运行中的特定守护进程 —— 这在运行沙盒测试实例时很有用。从源代码检出运行时，如果导出了这些变量，可以将 `od` 替换为 `"$OD_NODE_BIN" "$OD_BIN"`。

## 将 Open Design 作为 MCP 服务器暴露给任何代码智能体

Open Design 附带一个模型上下文协议服务器 (`od mcp`)，它允许任何支持 MCP 的客户端（Cursor、Claude Code、Antigravity、VS Code Copilot Chat、openclaw、hermes）在无需手动执行 shell 命令的情况下发现 Open Design 工具（列出技能、渲染预览、生成媒体、运行插件）。守护进程为每个主要的客户端通过 `GET /api/mcp/install-info` 发布一个即可粘贴的安装代码片段。

- 标准输入输出（Stdio）传输 — 无需额外端口，客户端直接启动 `od mcp`。
- 当作为 sidecar（边车模式）启动时，通过本地 IPC 状态 socket 自动发现实时守护进程的 URL。
- 普通安装降级使用 `--daemon-url http://127.0.0.1:<port>`，因此 MCP 进程始终能找到运行中的守护进程。
- 绑定 `OD_DATA_DIR`，使生成的 MCP 进程与守护进程使用同一写入位置（避免在 macOS 打包应用程序包时出现 EPERM 错误）。

### 通用的 MCP 客户端配置（适用于 Cursor, Claude Code, Codex, …）

```json
{
  "mcpServers": {
    "open-design": {
      "command": "od",
      "args": ["mcp", "--daemon-url", "od://app"],
      "env": { "OD_DATA_DIR": "~/.open-design" }
    }
  }
}
```

### 或者：向守护进程请求专为你的安装定制的代码片段

```bash
curl -s od://app/api/mcp/install-info | jq
```

### 实时产物 MCP 变体（读取并刷新仪表板）

```bash
od mcp live-artifacts
```

> 在 Open Design 应用程序中，你可以打开“设置 (Settings) → 集成 (Integrations)” 来复制客户端专属的安装命令（针对 Cursor、Claude Code、Antigravity、VS Code 等），而不用手动编辑 JSON 文件。

## 与 Web UI 使用相同的 REST + SSE 接口

本地守护进程在 `od://app` 提供 HTTP API（端口可配置）。Web UI 调用的每个端点也都完全开放给你的脚本使用。流式端点（如聊天轮次、项目运行）会根据 `@open-design/contracts` 中的契约类型发出 Server-Sent Events（服务器发送事件）。

- `GET /api/health` — 守护进程活跃度。
- `GET /api/skills` 和 `GET /api/design-systems` — 可用的注册中心。
- `GET /api/projects` 和 `POST /api/projects` — 列出和创建项目（POST 返回项目及第一个对话）。
- `GET /api/projects/:id/chat` — 针对对话输出智能体事件的 SSE 流。
- `POST /api/plugins/:id/apply` — 绑定已安装的插件并获取渲染后的示例查询及输入。
- `GET /api/agents` — 检测 PATH 中已有的代码智能体 CLI。

### 列出已安装的技能（智能体将把这些用作模板）

```bash
curl -s od://app/api/skills | jq '.skills[0]'
```

### 从提示语创建一个项目（完全的服务器端流程）

```bash
curl -s -X POST od://app/api/projects \
  -H 'content-type: application/json' \
  -d '{
    "name": "Hermes test run",
    "metadata": { "kind": "prototype" },
    "pendingPrompt": "A landing page for an AI agent CLI",
    "pluginId": "od-new-generation",
    "autoSendFirstMessage": true
  }'
```

### 以流形式接收聊天轮次（SSE — 每一行兼容 JSON-Lines）

```bash
curl -N \
  -H 'accept: text/event-stream' \
  od://app/api/projects/<projectId>/chat?conversationId=<convId>
```

> 在 `@open-design/contracts` 中包含了每个请求 / 响应纯正的 TypeScript 类型 —— 将它们导入你的脚本，即可在无需编写生成器的情况下获得完整的自动补全。

## 适用于任何智能体的即插即用技能（Skills）—— 即便没有运行 Open Design

一个技能（Skill）是一个包含兼容 Claude 的 `SKILL.md`（包含 YAML front-matter 头部元数据和正文）的目录。Open Design 用 `od:` 命名空间（比如 `mode`, `preview`, `design_system`, `inputs`... 等）扩展了该格式，这样同一个产物既能在 Open Design 内部使用，也可以被原生的智能体（如 Claude Code、Codex、openclaw、或 hermes）使用。发现机制遵循优先级链规则，因此项目可以覆盖自身的技能。

- 发现路径优先级：`./.claude/skills/` → `./skills/` → `~/.claude/skills/`（项目内的优先级最高）。
- 可以将一个技能符号链接（Symlink）到多个项目中，无需复制即可实现共享。
- 每个技能都可以声明连接器（connectors）、原子组件（atoms）、设计系统要求以及用于展示库的一个 `preview` 示例输出。
- 无头模式（Headless）：PATH 环境变量中带有 `od` 的智能体可调用 `od skills list` 然后运行任何技能；对于只读流，守护进程是可选的。
- `pnpm seed:test-projects` 验证了与默认插件示例和社区插件示例相同的产物结构，并将结果中的 `index.html` 项目作为可重用的测试数据保存。

### 最简化的 SKILL.md（兼容 Claude 的 front matter + Open Design 扩展）

```yaml
---
name: editorial-pitch-deck
description: A 10-slide editorial pitch deck — Swiss grid + serif headlines
od:
  mode: deck
  preview: ./example.html
  design_system: editorial-mono
  inputs:
    - name: company
      type: string
      required: true
---

# Editorial pitch deck

Use Swiss-grid layouts with oversized serif headlines and bold drop caps.
Cover, vision, market, product, traction, team, ask, contact.

```

### 将共享技能符号链接到项目中 (cc-switch style)

```bash
mkdir -p .claude/skills
ln -s ~/.claude/skills/editorial-pitch-deck .claude/skills/editorial-pitch-deck
```

### 无头模式：列出当前守护进程识别到的技能

```bash
od skills list --json | jq '.skills[].name'
```

### 无头模式下的产物预置包

```bash
pnpm seed:test-projects --offline --data-dir ./.od \
  --decks 2 --webs 2 \
  --default-plugins 3 --community-plugins 3
# 终端 1：注入后启动 Open Design
pnpm tools-dev
# 终端 2：检查生成的项目
od project list --json --daemon-url od://app
```

> 规范：`docs/skills-protocol.md` 和 `docs/agent-adapters.md` 涵盖了完整的适配器平面（Claude Code, Codex, Cursor, 支持 MCP 的智能体, 回退至自带的 API）以及各适配器的技能注入策略。

## 参考 URL

- 守护进程：`od://app`
- 健康检查：`od://app/api/health`
- MCP 安装信息：`od://app/api/mcp/install-info`
- 技能：`od://app/api/skills`
- 设计系统：`od://app/api/design-systems`
- 项目：`od://app/api/projects`

> 如有疑问，对于无状态读取优先使用 HTTP API；对于智能体驱动的工具调用使用 MCP 服务器；而对于 shell 自动化或 CI 则使用 CLI。
