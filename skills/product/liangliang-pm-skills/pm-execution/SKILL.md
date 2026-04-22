---
name: pm-execution
description: |
  产品执行技能集：PRD 编写、OKR 规划、路线图、冲刺管理、用户故事、优先级框架。包含发布说明、利益相关者地图、测试场景、风险预演等执行工具。

  **当以下情况时使用此 Skill**：
  (1) 编写产品需求文档 (PRD)
  (2) 规划 OKR 和路线图
  (3) 编写用户故事和验收标准
  (4) 规划冲刺和回顾
  (5) 优先排序功能 backlog
  (6) 生成测试场景
  (7) 管理利益相关者
---

# PM Execution - 产品执行技能

## 概述

这个产品执行技能集提供从需求到交付的完整执行工具，帮助产品经理：
- 编写高质量的产品需求文档
- 规划 OKR 和路线图
- 管理冲刺和团队执行
- 有效优先排序 backlog

## 核心命令

### 1. /write-prd - 编写 PRD

**使用场景**：从功能想法或问题陈述创建全面的产品需求文档。

**PRD 结构（8 部分）**：
1. 摘要（Summary）
2. 背景（Background）
3. 目标（Objectives）
4. 市场细分（Market Segments）
5. 价值主张（Value Propositions）
6. 解决方案详情（Solution Details）
7. 发布计划（Release Planning）
8. 成功指标（Success Metrics）

---

### 2. /write-stories - 编写用户故事

**使用场景**：将功能拆解为可执行的 backlog 项目。

**支持格式**：
- **用户故事** - "作为 [角色]，我想要 [功能]，以便 [价值]"
- **Jobs Stories** - "当 [情境]，我想要 [动机]，以便我能 [结果]"
- **WWA 格式** - Why-What-Acceptance

**包含**：详细描述、设计链接、验收标准（遵循 INVEST 原则）

---

### 3. /plan-okrs - 规划 OKR

**使用场景**：制定与公司目标对齐的团队级 OKR。

**输出**：
- 定性目标（鼓舞人心）
- 可衡量的关键结果
- 与公司目标的关联

---

### 4. /sprint - 冲刺生命周期

**使用场景**：
- 规划冲刺（容量估算、故事选择、依赖映射、风险识别）
- 运行冲刺回顾
- 生成发布说明

---

### 5. /pre-mortem - 风险预演

**使用场景**：在 PRD、发布计划或功能上线前识别潜在风险。

**方法**：假设项目失败，反向推理找出可能出错的地方。

---

### 6. /transform-roadmap - 路线图转换

**使用场景**：将功能导向的路线图转换为结果导向的路线图。

**帮助**：更好地沟通战略意图，聚焦业务结果而非功能输出。

---

### 7. /test-scenarios - 生成测试场景

**使用场景**：从用户故事或功能规格生成全面的测试场景。

**涵盖**：
- 主路径（Happy Paths）
- 边界情况（Edge Cases）
- 错误处理（Error Handling）

---

### 8. /stakeholder-map - 利益相关者地图

**使用场景**：映射利益相关者并创建定制化沟通计划。

**方法**：权力×利益网格，识别不同象限的沟通策略。

---

### 9. /meeting-notes - 会议记录总结

**使用场景**：总结会议录音或文字记录。

**输出**：结构化模板（日期、参与者、主题、决策、行动项、后续跟进）

---

### 10. /generate-data - 生成测试数据

**使用场景**：为测试生成逼真的虚拟数据集。

**输出格式**：CSV、JSON、SQL inserts 或 Python 脚本

---

## 专项技能

| 技能 | 用途 |
|------|------|
| **brainstorm-okrs** | OKR 头脑风暴（与公司目标对齐） |
| **create-prd** | 使用 8 部分模板创建 PRD |
| **dummy-dataset** | 生成逼真测试数据 |
| **job-stories** | 创建 Jobs Stories 格式 |
| **outcome-roadmap** | 将输出导向路线图转为结果导向 |
| **pre-mortem** | PRD 风险预演分析 |
| **prioritization-frameworks** | 9 种优先级框架参考（RICE、MoSCoW、Kano 等） |
| **release-notes** | 生成面向用户的发布说明 |
| **retro** | 结构化冲刺回顾 |
| **sprint-plan** | 冲刺规划（容量、故事、依赖、风险） |
| **stakeholder-map** | 权力/利益网格利益相关者分析 |
| **summarize-meeting** | 会议记录总结 |
| **test-scenarios** | 全面测试场景 |
| **user-stories** | 3C 和 INVEST 用户故事 |
| **wwas** | Why-What-Acceptance 格式 |

---

## 使用建议

**功能交付流程**：
1. `/write-prd` - 编写 PRD
2. `/write-stories` - 拆解用户故事
3. `/test-scenarios` - 生成测试场景
4. `/sprint` - 规划冲刺

**规划和优先级流程**：
1. `/plan-okrs` - 制定 OKR
2. `/transform-roadmap` - 创建结果导向路线图
3. 使用 prioritization-frameworks - 优先排序 backlog

---

**作者**: Paweł Huryn  
**许可证**: MIT  
**来源**: https://github.com/phuryn/pm-skills (已适配 OpenClaw)
