### git项目
**遇到任何问题，务必要先看 [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp)**

### 1. 启动 MCP 服务

```bash
# 1. 首先运行登录工具
# chmod +x xiaohongshu-login-darwin-arm64
./xiaohongshu-login-darwin-arm64

# 2. 然后启动 MCP 服务
# chmod +x xiaohongshu-mcp-darwin-arm64
./xiaohongshu-mcp-darwin-arm64

```

### 2. 验证 MCP

```bash
npx @modelcontextprotocol/inspector
```
运行后，打开红色标记的链接，配置 MCP inspector，输入 http://localhost:18060/mcp ，点击 Connect 按钮。

### 3. MCP 客户端接入

Claude Code CLI 接入

```bash
# 添加 HTTP MCP 服务器
claude mcp add --transport http xiaohongshu-mcp http://localhost:18060/mcp

# 检查 MCP 是否添加成功（确保 MCP 已经启动的前提下，运行下面命令）
claude mcp list
```

### 4. 可用 MCP 工具

使用 Claude Code 发布内容到小红书：

**示例 1：使用 HTTP 图片链接**

```
帮我写一篇帖子发布到小红书上，
配图为：https://cn.bing.com/th?id=OHR.MaoriRock_EN-US6499689741_UHD.jpg&w=3840
图片是："纽西兰陶波湖的Ngātoroirangi矿湾毛利岩雕（© Joppi/Getty Images）"

使用 xiaohongshu-mcp 进行发布。
```

**示例 2：使用本地图片路径（推荐）**

```
帮我写一篇关于春天的帖子发布到小红书上，
使用这些本地图片：
- /Users/username/Pictures/spring_flowers.jpg
- /Users/username/Pictures/cherry_blossom.jpg

使用 xiaohongshu-mcp 进行发布。
```

**示例 3：发布视频内容**

```
帮我写一篇关于美食制作的视频发布到小红书上，
使用这个本地视频文件：
- /Users/username/Videos/cooking_tutorial.mp4

使用 xiaohongshu-mcp 的视频发布功能。
```

![claude-cli 进行发布](./assets/claude_push.gif)