## 编辑配置并重启
```bash
# 编辑
code  ~/.openclaw/openclaw.json
# 开启命令行对话
openclaw tui        # 命令行对话
openclaw dashboard  # 浏览器打开 Dashboard

```

## 诊断 重启
```bash
openclaw doctor    # 检查配置问题
openclaw status    # 查看网关状态
openclaw dashboard # 浏览器打开 Dashboard

openclaw gateway start    # 启动网关
openclaw gateway stop     # 停止网关
openclaw gateway restart  # 重启网关
openclaw gateway status   # 检查 Gateway 状态（你的进程 PID 40839 已在运行）
openclaw gateway health --url ws://127.0.0.1:18789 健康检查
```