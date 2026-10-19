# Java Skills

此目录保存个人 Java 技能的唯一源码。Agent 通过各自技能目录中的逐技能软链接发现这些技能。

## 当前技能

- `java-coding`
- `java-review`

## 手动新增技能

假设新技能名为 `<skill-name>`：

1. 在本目录创建 `<skill-name>/SKILL.md` 及所需配套资源。
2. 确认目录名与 `SKILL.md` frontmatter 中的 `name` 一致。
3. 为 Codex 和 Gemini 建立入口：

   ```bash
   ln -s ../skill-sources/java/<skill-name> ~/.agents/skills/<skill-name>
   ```

4. 为 Claude 建立入口：

   ```bash
   ln -s ../../.agents/skill-sources/java/<skill-name> ~/.claude/skills/<skill-name>
   ```

5. 重启或刷新相关 Agent，确认技能只出现一次且可以读取 `SKILL.md`。

变更或移除软链接前，先比较目标内容并将旧副本保存到 `~/.agents/skills-archive/YYYY-MM-DD/`。
