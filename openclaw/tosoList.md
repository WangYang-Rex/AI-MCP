## 做的配置

## 安装的skill
│   └── skills/            # Agent 技能库
│       ├── agent-browser/ # 浏览器自动化技能
│       ├── find-skills/   # 技能发现工具
│       ├── gog/           # 搜索增强技能
│       ├── humanizer/     # 回复人性化技能
│       ├── proactive-agent/ # 主动出击技能
│       ├── self-improving-agent/ # 自我改进技能
│       ├── skill-vetter/  # 技能审核工具
│       ├── tavily-search/ # Tavily 搜索技能
│       └── token-optimizer/ # Token 优化工具

## 定时任务
### 定时清理任务

- 执行时间
每周五 上午 10:00 自动执行
- 清理规则
保留 7 天内 的文件
超过 7 天的文件会被自动删除
- 相关文件
清理脚本 `~/.openclaw/scripts/cleanup-media.sh`
清理日志 `~/.openclaw/logs/cleanup.log`
- 查看方式
```bash
# 查看定时任务
crontab -l

# 查看清理日志
cat ~/.openclaw/logs/cleanup.log

# 手动执行一次
~/.openclaw/scripts/cleanup-media.sh
```