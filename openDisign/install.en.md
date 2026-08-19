# Open Design — agent setup guide

You are a coding agent (Claude Code, Codex, Cursor, openclaw, hermes, or similar). The user wants Open Design wired into your workflow. Open Design is a local privileged daemon (`od`) plus a Skills + Design-Systems registry that exposes four interchangeable surfaces: CLI, HTTP API, MCP, and Skills.

Follow the setup checklist, then keep the reference sections handy.

## Setup checklist

1. Confirm the daemon is reachable:

   ```bash
   curl -s od://app/api/health | jq
   ```

   If it 404s or times out, ask the user to run `pnpm tools-dev` (dev) or open the Open Design app (packaged).

2. Detect available agent CLIs and confirm `od` is on PATH:

   ```bash
   od doctor
   od status --json
   ```

3. Pull the MCP install snippet (use it instead of hand-writing `mcpServers` config):

   ```bash
   curl -s od://app/api/mcp/install-info | jq
   ```

4. Persist the MCP server config in your client (e.g. `~/.cursor/mcp.json`, `~/.config/claude-code/config.json`, your own agent runner). The snippet from step 3 already includes the right `command`, `args`, and `env`.

5. Verify the integration end-to-end:

   ```bash
   curl -s od://app/api/skills | jq '.skills | length'
   od skills list --json
   ```

## Open Design works wherever your agent works

Open Design is more than a window — it is a local privileged daemon (`od`) plus a Skills + Design-Systems + Atoms registry. Once it's running on your machine, any code agent (Claude Code, Codex, Cursor, OpenCode/openclaw, Hermes, your own script) can drive generations, inspect projects, and produce design artifacts through four interchangeable surfaces.

- CLI — `od <command>` for headless scripts, CI, and shell automation.
- MCP server — wires Open Design as a Model Context Protocol server so any MCP-capable agent can list skills, run scenarios, and read artifacts.
- HTTP API — `od://app/api/*` REST + SSE endpoints; the same surface the web UI uses.
- Skills — drop-in `SKILL.md` packs (Claude-compatible) that any agent already on your PATH can invoke without Open Design at all.
- Standard artifacts — seed real HTML projects from Skills, bundled default plugins, and community plugin examples before the daemon starts.

### Start the daemon (and web UI) locally

```bash
pnpm tools-dev
# or, if `od` is on your PATH (packaged install):
od --port 7456
```

### Confirm it is reachable

```bash
curl -s od://app/api/health | jq
```

### Ingest standard artifacts before boot

```bash
pnpm seed:test-projects --offline --data-dir ./.od \
  --decks 2 --webs 2 --default-plugins 3 --community-plugins 3
# Then start Open Design in the shell you normally use for dev:
pnpm tools-dev
```

> The daemon writes to `./.od/` (project-local) by default. Set `OD_DATA_DIR=~/.open-design` to share data across projects.

## Drive Open Design from any shell

The `od` bin ships with the daemon and is the same binary used by Claude Code / Codex when they run a generation. Most subcommands are thin clients that POST to the local daemon, so they work the same whether you launched it via `pnpm tools-dev` or as a packaged app.

- `od` (no args) — boots the daemon and opens the web UI.
- `od media generate ...` — produce image / video / audio bytes through the unified media protocol.
- `od project create` + `od run start` — create a project, send a message, and stream the run.
- `od plugin install <source>` / `od plugin apply <id>` — install and apply community plugins.
- `od skills list` / `od design-systems list` — inspect what is available locally.
- `od status` / `od doctor` — verify daemon health and detect agent CLIs on your PATH.

### Generate an image (delegates to the configured media provider)

```bash
od media generate \
  --surface image \
  --model gpt-image-1 \
  --aspect 1:1 \
  --prompt "Editorial product shot, soft daylight, muted palette" \
  --output ./out/hero.png
```

### Use the CLI from a source checkout

```bash
corepack enable
pnpm install
pnpm --filter @open-design/daemon build

export OD_NODE_BIN="${OD_NODE_BIN:-/opt/homebrew/opt/node@24/bin/node}"
export OD_BIN="$PWD/apps/daemon/dist/cli.js"
"$OD_NODE_BIN" "$OD_BIN" daemon start --headless --serve-web --port 7456
```

### Run a design project headlessly and stream events

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

### Answer a discovery question form from the CLI

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

### Verify generated files after the stream completes

```bash
od files list "$PROJECT_ID" --daemon-url "$DAEMON_URL" --json
od files read "$PROJECT_ID" index.html --daemon-url "$DAEMON_URL" | head
```

### Inventory locally available skills and design systems

```bash
od skills list --json
od design-systems list --json
```

### Check seeded artifacts through the CLI

```bash
od project list --daemon-url od://app
od files list <seed-project-id> --daemon-url od://app
od files read <seed-project-id> index.html --daemon-url od://app | head
```

### Verify environment + detected agents (Claude, Codex, Cursor, …)

```bash
od doctor
od status --json
```

> All subcommands accept `--daemon-url http://127.0.0.1:<port>` to target a specific running daemon — useful when running a sandboxed second instance for tests. From a source checkout, replace `od` with `"$OD_NODE_BIN" "$OD_BIN"` after exporting those variables.

## Expose Open Design as an MCP server to any coding agent

Open Design ships with a Model Context Protocol server (`od mcp`) that lets any MCP-capable client — Cursor, Claude Code, Antigravity, VS Code Copilot Chat, openclaw, hermes — discover Open Design tools (list skills, render previews, generate media, run plugins) without shelling out manually. The daemon publishes a ready-to-paste install snippet via `GET /api/mcp/install-info` for each major client.

- Stdio transport — no extra port, the client spawns `od mcp` directly.
- Auto-discovers the live daemon URL via the local IPC status socket when launched as a sidecar.
- Falls back to `--daemon-url http://127.0.0.1:<port>` for plain installs so the MCP process always finds a running daemon.
- Pins `OD_DATA_DIR` so the spawned MCP process writes to the same place the daemon already uses (avoids EPERM in packaged macOS app bundles).

### Generic MCP client config (works in Cursor, Claude Code, Codex, …)

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

### Or: ask the daemon for the snippet tailored to your install

```bash
curl -s od://app/api/mcp/install-info | jq
```

### Live-artifacts MCP variant (read & refresh dashboards)

```bash
od mcp live-artifacts
```

> In the Open Design app, open Settings → Integrations to copy a client-specific install command (Cursor, Claude Code, Antigravity, VS Code) instead of editing JSON by hand.

## Same REST + SSE surface the web UI uses

The local daemon serves an HTTP API at `od://app` (port configurable). Every endpoint the web UI calls is also fair game for your scripts. Streaming endpoints (chat turns, project runs) emit Server-Sent Events with the contract types in `@open-design/contracts`.

- `GET /api/health` — daemon liveness.
- `GET /api/skills` and `GET /api/design-systems` — available registries.
- `GET /api/projects` and `POST /api/projects` — list and create projects (POST returns the project + first conversation).
- `GET /api/projects/:id/chat` — SSE stream of agent events for a conversation.
- `POST /api/plugins/:id/apply` — bind an installed plugin and get its rendered example query + inputs.
- `GET /api/agents` — detected code-agent CLIs on your PATH.

### List installed skills (the agent will use these as templates)

```bash
curl -s od://app/api/skills | jq '.skills[0]'
```

### Create a project from a prompt (full server-side flow)

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

### Stream a chat turn (SSE — each line is JSON-Lines compatible)

```bash
curl -N \
  -H 'accept: text/event-stream' \
  od://app/api/projects/<projectId>/chat?conversationId=<convId>
```

> Pure TypeScript types for every request/response live in `@open-design/contracts` — import them in your script for full autocomplete without wiring a generator.

## Drop-in Skills for any agent — even without Open Design running

A Skill is a directory with a Claude-compatible `SKILL.md` (YAML front-matter + body). Open Design extends the format with the `od:` namespace (`mode`, `preview`, `design_system`, `inputs`, …) so the same artifact can be used both inside Open Design and by a vanilla agent like Claude Code, Codex, openclaw, or hermes. Discovery follows a precedence chain so projects can override their own skills.

- Discovery: `./.claude/skills/` → `./skills/` → `~/.claude/skills/` (project wins).
- Symlink one skill into multiple projects to share it without copying.
- Each skill can declare connectors, atoms, design-system requirements, and a `preview` example output for the gallery.
- Headless: an agent with `od` on its PATH can call `od skills list` then run any skill; the daemon is optional for read-only flows.
- `pnpm seed:test-projects` exercises the same artifact shape with default plugin examples and community plugin examples, then stores the resulting `index.html` projects as reusable test data.

### Minimal SKILL.md (Claude-compatible front matter + Open Design extras)

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

### Symlink a shared skill into a project (cc-switch style)

```bash
mkdir -p .claude/skills
ln -s ~/.claude/skills/editorial-pitch-deck .claude/skills/editorial-pitch-deck
```

### Headless: list skills the daemon sees right now

```bash
od skills list --json | jq '.skills[].name'
```

### Headless artifact fixture bundle

```bash
pnpm seed:test-projects --offline --data-dir ./.od \
  --decks 2 --webs 2 \
  --default-plugins 3 --community-plugins 3
# Shell 1: start Open Design after ingesting.
pnpm tools-dev
# Shell 2: inspect the produced projects.
od project list --json --daemon-url od://app
```

> Spec: `docs/skills-protocol.md` and `docs/agent-adapters.md` cover the full adapter surface (Claude Code, Codex, Cursor, MCP-capable agents, BYOK API fallback) and the per-adapter skill injection strategies.

## Reference URLs

- Daemon: `od://app`
- Health: `od://app/api/health`
- MCP install info: `od://app/api/mcp/install-info`
- Skills: `od://app/api/skills`
- Design systems: `od://app/api/design-systems`
- Projects: `od://app/api/projects`

> When in doubt, prefer the HTTP API for stateless reads, the MCP server for agent-driven tool calls, and the CLI for shell automation or CI.
