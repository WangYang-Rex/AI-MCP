#!/usr/bin/env node
/**
 * 递归 list_nodes，按节点 updateTime 筛选「最近 N 天内有变动」的非文件夹节点。
 * MCP 无单独「按修改时间搜索知识库」接口，故需全量遍历（大库较慢）。
 */
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const DEFAULT_CONFIG = path.join('..', 'export.config.json');

function loadMcpUrlFromCursor() {
  const p = path.join(os.homedir(), '.cursor', 'mcp.json');
  if (!fsSync.existsSync(p)) return null;
  try {
    const j = JSON.parse(fsSync.readFileSync(p, 'utf8'));
    return j.mcpServers?.['dingtalk-document']?.url ?? null;
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const o = { config: null, workspaceId: null, folderId: null, days: 1, out: null, help: false, delayMs: 400 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--config') o.config = argv[++i];
    else if (a === '-w' || a === '--workspace-id') o.workspaceId = argv[++i];
    else if (a.startsWith('--workspace-id=')) o.workspaceId = a.split('=').slice(1).join('=');
    else if (a === '-f' || a === '--folder-id') o.folderId = argv[++i];
    else if (a.startsWith('--folder-id=')) o.folderId = a.split('=').slice(1).join('=');
    else if (a === '--days') o.days = Number(argv[++i]);
    else if (a.startsWith('--days=')) o.days = Number(a.split('=')[1]);
    else if (a === '--out') o.out = argv[++i];
    else if (a.startsWith('--delay-ms=')) o.delayMs = Number(a.split('=')[1]);
    else if (a === '--delay-ms') o.delayMs = Number(argv[++i]);
  }
  return o;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toolResultToObject(r) {
  if (r.structuredContent && typeof r.structuredContent === 'object') {
    return /** @type {Record<string, unknown>} */ (r.structuredContent);
  }
  const text = (r.content || [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('')
    .trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { _rawText: text };
  }
}

async function callToolJson(client, name, args) {
  const r = await client.callTool({ name, arguments: args });
  if (r.isError) {
    const msg = (r.content || []).map((c) => c.text).join('') || 'tool error';
    throw new Error(`${name}: ${msg}`);
  }
  return toolResultToObject(r);
}

async function listAllNodes(client, opts) {
  const { folderId, workspaceId, delayMs } = opts;
  if (!folderId && !workspaceId) throw new Error('需要 folderId 或 workspaceId');
  const all = [];
  let pageToken;
  do {
    const args = /** @type {Record<string, unknown>} */ ({ pageSize: 50 });
    if (folderId) args.folderId = folderId;
    if (workspaceId) args.workspaceId = workspaceId;
    if (pageToken) args.pageToken = pageToken;
    const data = await callToolJson(client, 'list_nodes', args);
    await sleep(delayMs);
    for (const n of /** @type {unknown[]} */ (data.nodes || [])) all.push(n);
    const hasMore = data.hasMore === true;
    pageToken = hasMore && data.nextPageToken ? String(data.nextPageToken) : null;
  } while (pageToken);
  return all;
}

/**
 * @typedef {{ name?: string, nodeId?: string, nodeType?: string, contentType?: string | null, updateTime?: number, docUrl?: string }} DingNode
 * @typedef {{ node: DingNode, path: string }} Hit
 */

/**
 * @param {Client} client
 * @param {number} cutoffMs
 * @param {{ delayMs: number, workspaceId: string }} base
 * @param {Hit[]} hits
 */
async function walk(client, folderId, relParts, cutoffMs, base, hits) {
  const nodes = await listAllNodes(client, {
    folderId,
    workspaceId: base.workspaceId,
    delayMs: base.delayMs,
  });

  for (const raw of nodes) {
    const node = /** @type {DingNode} */ (raw);
    const seg = (node.name || 'untitled').replace(/[\\/:*?"<>|]/g, '_');
    const pth = [...relParts, seg].join('/');

    if (node.nodeType === 'folder') {
      if (node.hasChildren && node.nodeId) {
        await walk(client, node.nodeId, [...relParts, seg], cutoffMs, base, hits);
      }
      continue;
    }

    const t = typeof node.updateTime === 'number' ? node.updateTime : 0;
    if (t >= cutoffMs) {
      hits.push({ node, path: pth });
    }
  }
}

function fmtTime(ms) {
  if (!ms) return '-';
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19);
}

async function main() {
  const cli = parseArgs(process.argv);
  if (cli.help) {
    console.log(`用法: node list-recent-changes.mjs -w <workspaceId> [--days N] [--folder-id <可选子文件夹>] [--out report.md]

说明: 全量递归 list_nodes，筛选 updateTime >= 现在 - days（默认 1 天）。非文件夹节点均纳入（含 ALIDOC、上传文件等）。

环境变量: DINGTALK_DOCUMENT_MCP_URL（或 ~/.cursor/mcp.json，或 export.config.json 的 mcpUrl）
`);
    process.exit(0);
  }

  const configPath = path.resolve(cli.config || path.join(process.cwd(), DEFAULT_CONFIG));
  let mcpUrl = process.env.DINGTALK_DOCUMENT_MCP_URL || loadMcpUrlFromCursor();
  let workspaceId = (cli.workspaceId || '').trim();

  if (fsSync.existsSync(configPath)) {
    const j = JSON.parse(await fs.readFile(configPath, 'utf8'));
    if (!mcpUrl) mcpUrl = j.mcpUrl || loadMcpUrlFromCursor();
    if (!workspaceId) workspaceId = (j.workspaceId || '').trim();
  }

  if (!mcpUrl) {
    console.error('缺少 MCP URL');
    process.exit(1);
  }
  if (!workspaceId) {
    console.error('请指定 -w workspaceId 或在 export.config.json 中配置');
    process.exit(1);
  }

  const days = Number.isFinite(cli.days) && cli.days > 0 ? cli.days : 1;
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  const transport = new StreamableHTTPClientTransport(new URL(String(mcpUrl).trim()));
  const mcpClient = new Client({ name: 'dingtalk-recent', version: '1.0.0' });
  await mcpClient.connect(transport);

  /** @type {Hit[]} */
  const hits = [];
  const base = { workspaceId, delayMs: cli.delayMs };

  if (cli.folderId) {
    await walk(mcpClient, String(cli.folderId).trim(), [], cutoffMs, base, hits);
  } else {
    const roots = await listAllNodes(mcpClient, { workspaceId, delayMs: cli.delayMs });
    for (const raw of roots) {
      const node = /** @type {DingNode} */ (raw);
      const seg = (node.name || 'untitled').replace(/[\\/:*?"<>|]/g, '_');
      if (node.nodeType === 'folder') {
        if (node.hasChildren && node.nodeId) {
          await walk(mcpClient, node.nodeId, [seg], cutoffMs, base, hits);
        }
      } else {
        const t = typeof node.updateTime === 'number' ? node.updateTime : 0;
        if (t >= cutoffMs) hits.push({ node, path: seg });
      }
    }
  }

  await mcpClient.close();

  hits.sort((a, b) => (b.node.updateTime || 0) - (a.node.updateTime || 0));

  const lines = [
    `# 知识库 ${workspaceId} 最近 ${days} 天内有变动的节点`,
    '',
    `统计时间（本地）: ${new Date().toISOString()}，阈值 updateTime >= ${fmtTime(cutoffMs)}`,
    '',
    '| 更新时间(UTC) | 类型 | 路径 | 链接 |',
    '|---|---|---|---|',
  ];

  for (const { node, path: pth } of hits) {
    const typ = [node.nodeType, node.contentType].filter(Boolean).join(' / ');
    const url = node.docUrl || '';
    lines.push(`| ${fmtTime(node.updateTime)} | ${typ.replace(/\|/g, '\\|')} | ${pth.replace(/\|/g, '\\|')} | ${url} |`);
  }

  lines.push('', `共 **${hits.length}** 个非文件夹节点。`);

  const text = lines.join('\n');
  console.log(text);
  if (cli.out) {
    await fs.writeFile(path.resolve(cli.out), text + '\n', 'utf8');
    console.error(`已写入 ${cli.out}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
