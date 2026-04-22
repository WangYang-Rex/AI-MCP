---
name: pm-data-analytics
description: |
  数据分析技能集：SQL 查询生成、队列分析、A/B 测试分析。帮助分析用户数据、生成查询语句、识别留存模式。

  **当以下情况时使用此 Skill**：
  (1) 需要编写 SQL 查询分析数据
  (2) 进行队列 (Cohort) 留存分析
  (3) 分析 A/B 测试结果
  (4) 评估统计显著性
---

# PM Data Analytics - 数据分析技能

## 概述

这个数据分析技能集提供产品经理所需的数据分析工具，帮助：
- 从自然语言生成 SQL 查询
- 分析用户留存和参与度
- 评估实验结果的统计显著性

## 核心命令

### 1. /write-query - 编写 SQL 查询

**使用场景**：从自然语言描述生成 SQL 查询。

**支持数据库**：
- BigQuery
- PostgreSQL
- MySQL
- 其他主流数据库

**示例**：
- "查询过去 30 天每个国家的活跃用户数"
- "计算新用户注册后 7 天留存率"

---

### 2. /analyze-cohorts - 队列分析

**使用场景**：分析用户留存和参与度趋势。

**输出**：
- 留存曲线
- 功能采用率
- 参与度趋势

---

### 3. /analyze-test - A/B 测试分析

**使用场景**：分析 A/B 测试结果并给出建议。

**包含**：
- **统计显著性** (Statistical Significance) - 验证结果是否显著
- **样本量验证** (Sample Size Validation) - 检查样本是否足够
- **置信区间** (Confidence Intervals) - 结果的不确定性范围
- **建议** (Recommendation) - Ship / Extend / Stop 建议

---

## 专项技能

| 技能 | 用途 |
|------|------|
| **ab-test-analysis** | A/B 测试分析（统计显著性、样本量、置信区间、建议） |
| **cohort-analysis** | 队列分析（用户留存） |
| **sql-queries** | 从自然语言生成 SQL 查询 |

---

## 使用建议

**数据驱动决策流程**：
1. `/write-query` - 获取所需数据
2. `/analyze-cohorts` - 分析用户行为
3. `/analyze-test` - 验证实验结果

**实验分析流程**：
1. 收集实验数据
2. `/analyze-test` - 分析结果并决定是否上线

---

**作者**: Paweł Huryn  
**许可证**: MIT  
**来源**: https://github.com/phuryn/pm-skills (已适配 OpenClaw)
