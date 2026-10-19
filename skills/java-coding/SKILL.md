---
name: java-coding
description: 按个人 Java 编码规范编写和修改所有 Java 项目代码。创建、修改、修复或重构任意仓库中的 Java 源码、Java 测试、接口、实现类、Controller、Service、DAO、Query、DTO、VO、PO、RO 或相关 MyBatis SQLMap 时使用，不限制项目名称。只读 Java 代码审查不使用本技能，应使用 java-review。
---

# Java 编码

## 执行流程

1. 编写或修改 Java 源码、Java 测试或相关 MyBatis SQLMap 前，完整读取下列通用规范：
   - [命名](references/编码风格规范-命名.md)
   - [注释](references/编码风格规范-注释.md)
   - [注解](references/编码风格规范-注解.md)
   - [方法结构](references/编码风格规范-方法结构.md)
   - [换行](references/编码风格规范-换行.md)
2. 仅当当前项目是 `ding-data-engine`，且任务涉及 DAO、Query 或 SQLMap 时，判断实体类型并完整读取对应规则：
   - 实体继承 `BusinessDeployBasePojo`：读取[业务对象 DAO 规则](references/编码指导规则-业务对象-DAO层.md)。
   - 实体继承 `BasePojo` 且不继承 `BusinessDeployBasePojo`：读取[非业务对象 DAO 规则](references/编码指导规则-非业务对象-DAO层.md)。
   - 未关联上述实体的通用 Query 或 SQLMap：跳过 DAO 专项规则。
   - 其他项目不得使用这两份 DAO 专项规则。
3. 使用 code-review-graph 检索同模块、同职责的现有实现，确认实际依赖、调用关系和项目惯例。
4. 按规范实施最小范围修改。规则冲突时，`ding-data-engine` DAO 专项规则优先于通用风格规则；用户当前任务的明确要求优先于本技能。
5. 修改完成后执行相关模块测试、格式检查和 `git diff --check`。声明完成时提供可复现的验证结果。
6. 未经用户明确要求，不创建 Git 提交。

## 边界

- 通用风格规范适用于所有项目中的所有 Java 源码和测试文件。
- 仅使用当前项目已经引入的框架、注解和工具类；不得为满足风格规范额外引入 Lombok、Swagger、Spring、Apache Commons 等依赖。
- `ding-data-engine` DAO 专项规则不得外溢到其他项目。
- 不因格式偏好扩大业务修改范围。
- 不凭记忆替代规范原文；每次触发均按上述路由读取。
