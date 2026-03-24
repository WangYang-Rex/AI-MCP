#!/usr/bin/env node
/**
 * @fileoverview 通过钉钉文档 MCP（Streamable HTTP）递归导出知识库子树到本地目录。
 * 在线文档（ALIDOC）→ Markdown；其它文件节点 → download_file 凭证 + HTTP GET。
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/** @typedef {{ mcpUrl?: string, workspaceId?: string, rootFolderId?: string, rootDisplayName: string, outputDir: string, metaDir: string, delayMs: number, skipBinary: boolean }} ExportConfig */

const DEFAULT_CONFIG_REL = path.join('..', 'export.config.json');

function parseArgs(argv) {
  const opts = {
    config: null,
    dryRun: false,
    verbose: false,
    /** 关闭顺序进度日志（默认会输出「1、2、…」步骤） */
    quiet: false,
    maxNodes: Infinity,
    help: false,
    /** 命令行覆盖：知识库 workspaceId */
    workspaceId: null,
    /** 命令行：从该文件夹递归（dentryUuid） */
    folderId: null,
    /** true：不传 folderId，从知识库根目录列出并导出整库 */
    kbRoot: false,
    /** 本地根目录段显示名（默认取配置 rootDisplayName，整库时常用「知识库-xxx」） */
    rootLabel: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--verbose' || a === '-v') opts.verbose = true;
    else if (a === '--quiet' || a === '-q') opts.quiet = true;
    else if (a === '--config') opts.config = argv[++i];
    else if (a === '--kb-root') opts.kbRoot = true;
    else if (a === '--workspace-id' || a === '-w') opts.workspaceId = argv[++i];
    else if (a.startsWith('--workspace-id=')) opts.workspaceId = a.split('=').slice(1).join('=');
    else if (a === '--folder-id' || a === '-f') opts.folderId = argv[++i];
    else if (a.startsWith('--folder-id=')) opts.folderId = a.split('=').slice(1).join('=');
    else if (a === '--root-label') opts.rootLabel = argv[++i];
    else if (a.startsWith('--root-label=')) opts.rootLabel = a.split('=').slice(1).join('=');
    else if (a.startsWith('--max-nodes=')) opts.maxNodes = Number(a.split('=')[1]);
    else if (a === '--max-nodes') opts.maxNodes = Number(argv[++i]);
  }
  return opts;
}

function printHelp() {
  console.log(`用法: node export-dingtalk-docs.mjs [选项]

导出范围（二选一，命令行优先于配置文件）:
  --kb-root                  导出指定知识库「根目录」下全部内容（list_nodes 仅传 workspaceId）
  -w, --workspace-id <id>    知识库 ID（workspaceId）
  -f, --folder-id <id>       仅导出该文件夹及其子树（可传 dentryUuid 或文档夹链接中的 ID）

说明:
  • 使用 --folder-id 时默认仍导出「以 rootDisplayName 为名的最外层目录 + 子树」；
    若与 --kb-root 同时指定，以 --kb-root 为准（整库根）。
  • 仅配置文件中配有 rootFolderId 且不传 --kb-root 时：行为与此前一致，从该文件夹导出。

选项:
  --config <path>          配置文件（默认: ../export.config.json）
  --root-label <name>      本地落盘路径的第一级目录名（默认同配置 rootDisplayName；整库时建议设为易识别名称）
  --dry-run                只遍历并打印计划，不写文件
  --verbose, -v            额外技术日志（与顺序进度可同时使用）
  --quiet, -q              关闭「1、2、…」顺序进度输出
  --max-nodes N            仅处理前 N 个「文件/文档」节点（调试用）
  --help                   帮助

环境变量:
  DINGTALK_DOCUMENT_MCP_URL   钉钉文档 Streamable HTTP MCP 地址（与 Cursor mcp.json 中 dingtalk-document.url 一致）
`);
}

/** 从 Cursor 用户配置读取 MCP URL（不设环境变量时尝试，密钥仍在本地不会进仓库）。 */
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

async function loadConfig(configPath) {
  const raw = await fs.readFile(configPath, 'utf8');
  const j = JSON.parse(raw);
  return {
    mcpUrl: process.env.DINGTALK_DOCUMENT_MCP_URL || j.mcpUrl || loadMcpUrlFromCursor(),
    workspaceId: j.workspaceId,
    rootFolderId: j.rootFolderId,
    rootDisplayName: j.rootDisplayName || 'export-root',
    outputDir: path.resolve(path.dirname(configPath), j.outputDir || '../export'),
    metaDir: path.resolve(path.dirname(configPath), j.metaDir || '../export-meta'),
    delayMs: j.delayMs ?? 400,
    skipBinary: j.skipBinary === true,
  };
}

/**
 * 合并 CLI 与配置文件，得到本次运行的 workspaceId / 是否整库 / 起始 folderId。
 * @param {ExportConfig} cfg
 * @param {ReturnType<parseArgs>} cli
 */
function resolveScope(cfg, cli) {
  const workspaceId = (cli.workspaceId || cfg.workspaceId || '').trim();
  const kbRoot = cli.kbRoot === true;
  const folderFromCli = cli.folderId ? String(cli.folderId).trim() : '';
  const folderFromCfg = cfg.rootFolderId ? String(cfg.rootFolderId).trim() : '';

  let startFolderId = '';
  if (!kbRoot) {
    startFolderId = folderFromCli || folderFromCfg;
  }

  const rootLabel = sanitizeFileName(
    (cli.rootLabel || cfg.rootDisplayName || (kbRoot ? `kb-${workspaceId}` : 'export-root')).trim(),
  );

  return { workspaceId, kbRoot, startFolderId, rootLabel };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** @param {import('@modelcontextprotocol/sdk/types.js').CallToolResult} r */
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

/** @param {Client} client */
async function callToolJson(client, name, args) {
  const r = await client.callTool({ name, arguments: args });
  if (r.isError) {
    const msg = (r.content || []).map((c) => c.text).join('') || 'tool error';
    throw new Error(`${name}: ${msg}`);
  }
  return toolResultToObject(r);
}

/**
 * 非法路径字符替换（Windows / macOS 通用）。
 * @param {string} name
 */
function sanitizeFileName(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/**
 * 将路径转为日志用 POSIX 风格相对路径。
 * @param {string} fromDir
 * @param {string} absPath
 */
function relPathForLog(fromDir, absPath) {
  return path.relative(fromDir, absPath).split(path.sep).join('/');
}

/**
 * 顺序编号进度输出（默认开启，便于观察导出进行到哪一步）。
 * @param {{ logSeq: number }} counters
 * @param {ReturnType<parseArgs>} cli
 * @param {string} message
 */
function progressLine(counters, cli, message) {
  if (cli.quiet) return;
  counters.logSeq += 1;
  console.error(`${counters.logSeq}、${message}`);
}

/**
 * 分页列出子节点。
 * - 传 folderId：列出该文件夹下子节点（可与 workspaceId 同传）
 * - 不传 folderId、仅传 workspaceId：列出知识库根目录子节点
 * @param {Client} client
 * @param {{ folderId?: string, workspaceId?: string, delayMs: number }} opts
 */
async function listAllNodes(client, opts) {
  const { folderId, workspaceId, delayMs } = opts;
  if (!folderId && !workspaceId) {
    throw new Error('list_nodes: 需要 folderId 或 workspaceId');
  }
  const all = [];
  let pageToken;
  do {
    const args = /** @type {Record<string, unknown>} */ ({ pageSize: 50 });
    if (folderId) args.folderId = folderId;
    if (workspaceId) args.workspaceId = workspaceId;
    if (pageToken) args.pageToken = pageToken;

    const data = await callToolJson(client, 'list_nodes', args);
    await sleep(delayMs);

    const nodes = /** @type {unknown[]} */ (data.nodes || []);
    for (const n of nodes) all.push(n);

    const hasMore = data.hasMore === true;
    pageToken = hasMore && data.nextPageToken ? String(data.nextPageToken) : null;
  } while (pageToken);
  return /** @type {DingNode[]} */ (all);
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string} [rawFallback]
 */
function extractMarkdown(obj, rawFallback = '') {
  if (typeof obj === 'string') return obj;
  if (typeof obj.markdown === 'string') return obj.markdown;
  if (typeof obj.content === 'string') return obj.content;
  if (typeof obj.data === 'string') return obj.data;
  if (typeof obj._rawText === 'string') return obj._rawText;
  return rawFallback || JSON.stringify(obj, null, 2);
}

/**
 * @typedef {{ nodeId: string, name: string, nodeType: string, contentType?: string | null, hasChildren?: boolean, docUrl?: string }} DingNode
 */

/**
 * 在目录内保证文件名唯一。
 * @param {Set<string>} usedNames
 * @param {string} base
 * @param {string} extWithDot 包含点，例如 .md
 */
function uniqueName(usedNames, base, extWithDot) {
  let name = `${base}${extWithDot}`;
  let i = 0;
  while (usedNames.has(name)) {
    i += 1;
    name = `${base}_${i}${extWithDot}`;
  }
  usedNames.add(name);
  return name;
}

/** @param {ExportConfig} cfg */
async function appendManifest(cfg, line) {
  const f = path.join(cfg.metaDir, 'manifest.jsonl');
  await fs.mkdir(cfg.metaDir, { recursive: true });
  await fs.appendFile(f, JSON.stringify(line) + '\n', 'utf8');
}

/**
 * 处理某一目录下的直接子节点列表（已由 list_nodes 拉平为一层）。
 * @param {Client} client
 * @param {ExportConfig} cfg
 * @param {ReturnType<parseArgs>} cli
 * @param {DingNode[]} nodes
 * @param {string[]} relParts 当前目录在本地 export 下的相对路径段
 * @param {string} workspaceId
 * @param {{ docCount: number, logSeq: number }} counters
 */
async function processDirectChildren(client, cfg, cli, nodes, relParts, workspaceId, counters) {
  /** 当前钉盘子目录内文件名去重（仅同一 list_nodes 的直接子级） */
  const usedInThisFolder = new Set();

  for (const raw of nodes) {
    const node = /** @type {DingNode} */ (raw);
    const safeName = sanitizeFileName(node.name || 'untitled');
    const childRel = [...relParts, safeName];

    if (node.nodeType === 'folder') {
      const childDir = path.join(cfg.outputDir, ...childRel);
      if (cli.verbose) console.error(`[dir] ${childRel.join('/')}`);
      progressLine(counters, cli, `准备处理子文件夹：${childRel.join('/')}`);
      if (!cli.dryRun) {
        await fs.mkdir(childDir, { recursive: true });
      }
      if (node.hasChildren && node.nodeId) {
        await walkFolder(client, cfg, cli, node.nodeId, childRel, workspaceId, counters);
        if (counters.docCount >= cli.maxNodes) return;
        // progressLine(counters, cli, `子文件夹遍历完成：${childRel.join('/')}`);
      } else {
        progressLine(counters, cli, `子文件夹无递归子节点（跳过列表）：${childRel.join('/')}`);
      }
      continue;
    }

    // 文件类节点
    if (counters.docCount >= cli.maxNodes) return;

    const isAlidoc = (node.contentType || '').toUpperCase() === 'ALIDOC';

    if (isAlidoc) {
      const base = safeName.replace(/\.md$/i, '');
      const fname = uniqueName(usedInThisFolder, base, '.md');
      const outPath = path.join(cfg.outputDir, ...relParts, fname);

      const fm = [
        '---',
        `title: ${JSON.stringify(node.name || '')}`,
        `nodeId: ${node.nodeId}`,
        `workspaceId: ${workspaceId}`,
        `docUrl: ${JSON.stringify(node.docUrl || '')}`,
        `exportedAt: ${new Date().toISOString()}`,
        'source: dingtalk-document-mcp',
        '---',
        '',
      ].join('\n');

      const relOut = relPathForLog(cfg.outputDir, outPath);
      if (cli.verbose) console.error(`[alidoc] → ${relOut}`);
      if (!cli.dryRun) {
        progressLine(counters, cli, `正在导出在线文档：${relOut}`);
        try {
          const data = await callToolJson(client, 'get_document_content', { nodeId: node.nodeId });
          await sleep(cfg.delayMs);
          const body = extractMarkdown(data);
          await fs.mkdir(path.dirname(outPath), { recursive: true });
          await fs.writeFile(outPath, fm + body, 'utf8');
          await appendManifest(cfg, {
            ok: true,
            type: 'alidoc',
            nodeId: node.nodeId,
            relPath: path.relative(cfg.outputDir, outPath),
          });
          // progressLine(counters, cli, `已完成导出在线文档：${relOut}`);
        } catch (e) {
          const err = e instanceof Error ? e.message : String(e);
          progressLine(counters, cli, `导出失败（在线文档）：${relOut} — ${err}`);
          await appendManifest(cfg, {
            ok: false,
            type: 'alidoc',
            nodeId: node.nodeId,
            relPath: childRel.join('/'),
            error: err,
          });
        }
      } else {
        progressLine(counters, cli, `（预演）将导出在线文档：${relOut}`);
      }
      counters.docCount += 1;
      if (counters.docCount >= cli.maxNodes) return;
      continue;
    }

    if (cfg.skipBinary) {
      if (cli.verbose) console.error(`[skip-binary] ${childRel.join('/')}`);
      progressLine(counters, cli, `已跳过附件下载（skipBinary）：${childRel.join('/')}`);
      if (!cli.dryRun) {
        await appendManifest(cfg, {
          ok: true,
          skipped: true,
          type: 'binary_skipped',
          nodeId: node.nodeId,
          name: childRel.join('/'),
        });
      }
      counters.docCount += 1;
      if (counters.docCount >= cli.maxNodes) return;
      continue;
    }

    // 其它文件：download_file + fetch
    const extGuess = path.extname(safeName) || '';
    const base = extGuess ? safeName.slice(0, -extGuess.length) : safeName;
    const fname = uniqueName(usedInThisFolder, base || 'file', extGuess || '.bin');
    const outPath = path.join(cfg.outputDir, ...relParts, fname);

    const relFileOut = relPathForLog(cfg.outputDir, outPath);
    if (cli.verbose) console.error(`[file] → ${relFileOut}`);
    if (!cli.dryRun) {
      progressLine(counters, cli, `正在下载文件：${relFileOut}`);
      try {
        const cred = await callToolJson(client, 'download_file', { nodeId: node.nodeId });
        await sleep(cfg.delayMs);
        const urls = cred.resourceUrl;
        const url = Array.isArray(urls) ? urls[0] : urls;
        if (!url || typeof url !== 'string') {
          throw new Error('download_file: 无 resourceUrl');
        }
        /** @type {Record<string, string>} */
        const hdrs = {};
        if (cred.headers && typeof cred.headers === 'object') {
          for (const [k, v] of Object.entries(cred.headers)) {
            if (v != null) hdrs[k] = String(v);
          }
        }
        const res = await fetch(url, { headers: hdrs });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, buf);
        await appendManifest(cfg, {
          ok: true,
          type: 'file',
          nodeId: node.nodeId,
          relPath: path.relative(cfg.outputDir, outPath),
        });
        // progressLine(counters, cli, `已完成下载文件：${relFileOut}`);
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        progressLine(counters, cli, `下载失败（文件）：${relFileOut} — ${err}`);
        await appendManifest(cfg, {
          ok: false,
          type: 'file',
          nodeId: node.nodeId,
          relPath: childRel.join('/'),
          error: err,
        });
      }
    } else {
      progressLine(counters, cli, `（预演）将下载文件：${relFileOut}`);
    }
    counters.docCount += 1;
    if (counters.docCount >= cli.maxNodes) return;
  }
}

/**
 * 从某一文件夹开始递归导出。
 * @param {Client} client
 * @param {ExportConfig} cfg
 * @param {ReturnType<parseArgs>} cli
 */
async function walkFolder(client, cfg, cli, folderId, relParts, workspaceId, counters) {
  if (counters.docCount >= cli.maxNodes) return;
  const rel = relParts.join('/');
  // progressLine(counters, cli, `正在列出目录：${rel}`);
  const nodes = await listAllNodes(client, {
    folderId,
    workspaceId,
    delayMs: cfg.delayMs,
  });
  // progressLine(counters, cli, `列出完成，共 ${nodes.length} 个子节点：${rel}`);
  await processDirectChildren(client, cfg, cli, nodes, relParts, workspaceId, counters);
}

/**
 * 从知识库根（不传 folderId）列出顶层节点并导出。
 * @param {Client} client
 * @param {ExportConfig} cfg
 * @param {ReturnType<parseArgs>} cli
 */
async function walkKnowledgeBaseRoot(client, cfg, cli, rootRel, workspaceId, counters) {
  if (counters.docCount >= cli.maxNodes) return;
  const rel = rootRel.join('/');
  progressLine(counters, cli, `正在列出知识库根目录：${rel}`);
  const nodes = await listAllNodes(client, {
    workspaceId,
    delayMs: cfg.delayMs,
  });
  progressLine(counters, cli, `知识库根目录列出完成，共 ${nodes.length} 个顶层节点：${rel}`);
  await processDirectChildren(client, cfg, cli, nodes, rootRel, workspaceId, counters);
}

async function main() {
  const cli = parseArgs(process.argv);
  if (cli.help) {
    printHelp();
    process.exit(0);
  }

  const configPath = path.resolve(cli.config || path.join(process.cwd(), DEFAULT_CONFIG_REL));
  const cfg = await loadConfig(configPath);

  if (!cfg.mcpUrl || typeof cfg.mcpUrl !== 'string') {
    console.error(
      '未配置 MCP 地址：请设置环境变量 DINGTALK_DOCUMENT_MCP_URL，或在 export.config.json 中填写 mcpUrl（勿提交密钥）。',
    );
    process.exit(1);
  }

  const scope = resolveScope(cfg, cli);

  if (!scope.workspaceId) {
    console.error('请指定知识库 ID：配置文件 workspaceId，或使用 -w / --workspace-id');
    process.exit(1);
  }

  if (!scope.kbRoot && !scope.startFolderId) {
    console.error('请指定导出范围之一：① --kb-root 导出整库根目录  ② -f / rootFolderId 导出某文件夹');
    process.exit(1);
  }

  const transport = new StreamableHTTPClientTransport(new URL(cfg.mcpUrl.trim()));
  const client = new Client({ name: 'dingtalk-export', version: '1.0.0' });
  await client.connect(transport);

  const rootRel = [scope.rootLabel];
  if (!cli.dryRun) {
    await fs.mkdir(path.join(cfg.outputDir, ...rootRel), { recursive: true });
    await fs.mkdir(cfg.metaDir, { recursive: true });
  }

  const counters = { docCount: 0, logSeq: 0 };
  const modeLabel = scope.kbRoot
    ? `整库根 workspaceId=${scope.workspaceId}`
    : `文件夹 folderId=${scope.startFolderId}`;
  console.error(`导出开始: ${modeLabel} → ${path.join(cfg.outputDir, ...rootRel)} dryRun=${cli.dryRun}`);

  if (scope.kbRoot) {
    await walkKnowledgeBaseRoot(client, cfg, cli, rootRel, scope.workspaceId, counters);
  } else {
    await walkFolder(client, cfg, cli, scope.startFolderId, rootRel, scope.workspaceId, counters);
  }

  await client.close();
  const tail = cli.dryRun ? ' （dry-run 未写入）' : '';
  const steps = cli.quiet ? '' : `，进度日志条数: ${counters.logSeq}`;
  console.error(`完成。已处理文档/文件节点数: ${counters.docCount}${steps}${tail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
