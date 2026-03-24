# dingtalk-document

本目录存放通过 **钉钉文档 MCP** 导出的 Markdown 快照，便于版本管理与检索。

## 一键导出（推荐）

1. 复制配置模板：  
   `cp export.config.example.json export.config.json`  
2. 安装依赖：`cd scripts && npm install`  
3. 设置 MCP 地址（与 Cursor `~/.cursor/mcp.json` 里 `dingtalk-document.url` 相同，**勿提交到 Git**）：  
   `export DINGTALK_DOCUMENT_MCP_URL='https://mcp-gw.dingtalk.com/server/...'`  
   若不设置，脚本会尝试从本机 `~/.cursor/mcp.json` 读取。  
4. 导出（**须指定知识库 ID**，可用配置文件或 `-w`）：  
   - **某文件夹及子树**（默认读配置的 `rootFolderId`）：`npm run export`  
   - **任意文件夹**：`npm run export -- -w <workspaceId> -f <folderId> --root-label <本地根目录名>`  
   - **整库根目录**（知识库顶层所有一级节点）：`npm run export:kb -- -w <workspaceId> --root-label <本地根目录名>`  
     若已在 `export.config.json` 写好 `workspaceId`，也可：`npm run export:kb -- --root-label 我的知识库`  
   - 试跑：`npm run export:dry` 或加 `--dry-run --max-nodes 5`  
5. 产出：`export/前端文档/` 下镜像目录树；`export-meta/manifest.jsonl` 记录成功/失败。  

`export/`、`export-meta/`、`export.config.json` 已列入 [.gitignore](./.gitignore)。

| 文件 | 说明 |
|------|------|
| [前端文档-目录结构.md](./前端文档-目录结构.md) | 知识库 `R2PmK2gngjVnZXvp` 下「前端文档」文件夹的目录树（含覆盖说明） |
| [导出任务-分批执行计划.md](./导出任务-分批执行计划.md) | 按目录结构镜像落盘、`list_nodes` 递归 + 导出 alidoc/附件 的分批任务与 SOP |
| [新人文档链接索引.md](./新人文档链接索引.md) | 「项目手册」内《新人文档链接索引》正文导出（语雀/钉钉外链 + 业务学习配图） |
