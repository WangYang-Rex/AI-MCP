## 编辑配置并重启
```bash
# 编辑
code  ~/.openclaw/openclaw.json
# 开启命令行对话
openclaw tui        # 命令行对话
openclaw dashboard  # 浏览器打开 Dashboard

```

## 常用命令
```bash
openclaw status          # 查看整体状态
openclaw gateway status  # 查看 Gateway 运行状态
openclaw health          # 健康检查
openclaw onboard --install-daemon  # 初始化向导
openclaw configure       # 重新配置（只改一部分 修改模型、频道等）
openclaw daemon restart  # 重启后台服务
openclaw daemon logs     # 查看运行日志
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

## 日志

```bash
# 实时跟踪日志（推荐调试用）
openclaw logs --follow  

# 加过滤条件，只看飞书相关：
openclaw logs --follow --filter feishu

# 查看历史日志
openclaw logs

```
