# 编码指导规则：非业务对象 DAO 层

> 适用项目：ding-data-engine
> 参照实现：AIChatCardDao

---

## 1. 分类标准

当实体类满足以下条件时，使用非业务对象 DAO 规范：

| 条件 | 说明 |
|------|------|
| 实体基类 | 继承 `BasePojo`（非 `BusinessDeployBasePojo`） |
| 公共字段 | 不包含 templateId, chargerId, flowStatus 等业务对象字段 |
| 分表策略 | 视业务场景决定，可能使用 `CORP_SHARING_32`，也可能不分表 |
| 数据库 | 仅 MySQL |

典型实体：AI卡片(AIChatCard)、AI对话记录(AIChatRecord)、AI助手(AIAsst)、MCP配置(McpApiKey)、电子签章配置(ESignDeployConfig) 等辅助功能实体。

**判断依据**：实体继承 `BasePojo` 而非 `BusinessDeployBasePojo`。

---

## 2. 类命名规范

| 角色 | 命名格式 | 示例 |
|------|---------|------|
| DAO | `{Entity}Dao` | `AIChatCardDao` |
| Query | `{Entity}Query` | `AIChatCardQuery` |
| Service 接口 | `{Entity}Service` | `AIChatCardService` |
| Service 实现 | `{Entity}ServiceImpl` | `AIChatCardServiceImpl` |

**要点**：
- DAO 类名不带 `Basic` 后缀（只有一套 DAO，无 Basic / 定制分离）
- 无 PostgreSQL 版本

---

## 3. 方法命名规范

使用 `操作动词 + 实体名 + 条件` 模式，方法名体现具体业务含义：

### 3.1 标准 CRUD 方法

| 操作 | 方法名模式 | 返回值 |
|------|-----------|--------|
| 插入 | `add{Entity}` | `void` |
| 按主键查询 | `get{Entity}ByKey` | 实体 |
| 按主键删除 | `deleteByKey` | `Integer` |
| 按主键更新 | `update{Entity}ByKey` | `Integer` |
| 分页查询 | `get{Entity}ListWithPage` | `Result<实体>` |
| 列表查询 | `get{Entity}List` | `List<实体>` |

### 3.2 自定义查询方法

按业务需求添加，命名遵循 `get{Entity}By{Condition}` 模式：

```java
// 按业务字段查询
public AIChatCard getAIChatCardByChatToken(String corpId, String chatToken)

// 按组合条件查询
public ESignFlowMapping getESignFlowMappingByCorpIdAndFlowId(String corpId, String flowId)

// 按企业查询
public McpApiSwitch getMcpApiSwitchByCorpId(String corpId)

// 按用户查询列表
public List<McpApiKey> getMcpApiKeyListByCorpAndUser(String corpId, String userId)
```

### 3.3 自定义删除/更新方法

```java
// 按条件删除
public void deleteByChatToken(String corpId, String chatToken)
public Integer deleteByCorpId(String corpId)

// 按条件更新
public void updateMcpApiSwitchByCorpId(String corpId, Integer status, String changerId)
```

---

## 4. 方法签名规范

### 4.1 参数顺序

```
方法名(String corpId, 业务参数...) throws ParameterException, SQLException
```

- `corpId` 为第一个参数（如需分表）
- 异常声明具体类型：`ParameterException`（参数校验）+ `SQLException`（数据库操作）
- 不需要分表的方法可以省略 `corpId` 参数

### 4.2 无 corpId 的场景

不分表的实体或全局查询，方法签名不含 `corpId`：

```java
public McpApiKey getMcpApiKeyByApiKey(String apiKey)
```

### 4.3 各方法签名模板

```java
// 标准 CRUD（分表）
public void add{Entity}(String corpId, {Entity} entity) throws ParameterException, SQLException
public {Entity} get{Entity}ByKey(String corpId, Long id) throws ParameterException, SQLException
public Integer deleteByKey(String corpId, Long id) throws ParameterException, SQLException
public Integer update{Entity}ByKey(String corpId, {Entity} entity) throws ParameterException, SQLException
public Result<{Entity}> get{Entity}ListWithPage({Entity}Query query) throws SQLException
public List<{Entity}> get{Entity}List({Entity}Query query) throws SQLException

// 标准 CRUD（不分表）
public void add{Entity}({Entity} entity)
public {Entity} get{Entity}ByKey(Long id)
public Integer deleteByKey(Long id)
public Integer update{Entity}ByKey({Entity} entity)
```

---

## 5. 参数组装规范

### 5.1 分表场景

与业务对象 DAO 一致，固定三要素：`corpId` + `tableId` + 业务参数。

**实体参数**（insert / update）：

```java
entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
entity.setCorpId(corpId);
```

**Map 参数**（query / delete）：

```java
Map<String, Object> params = Maps.newHashMap();
params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
params.put("corpId", corpId);
params.put("id", id);
```

### 5.2 不分表场景

无需设置 `tableId`，参数按需组装。

### 5.3 Query 参数（分页 / 列表）

通过 `Query.getParams()` 获取，与业务对象 DAO 一致。

---

## 6. SqlMap 命名规范

### 6.1 文件命名

| 文件类型 | 命名格式 | 示例 |
|---------|---------|------|
| SqlMap | `{entity}-sqlmap.xml` | `ai_chat_card-sqlmap.xml` |

**要点**：单一文件，无 Basic / 定制分离。

### 6.2 namespace 与 sqlId

```
namespace = 实体名（如 AIChatCard）
sqlId = 操作 + 实体名 + 条件
```

| 操作 | sqlId | 示例 |
|------|-------|------|
| 插入 | `{Ns}.insert{Entity}` | `AIChatCard.insertAIChatCard` |
| 按主键查询 | `{Ns}.get{Entity}ByKey` | `AIChatCard.getAIChatCardByKey` |
| 按条件查询 | `{Ns}.get{Entity}By{Condition}` | `AIChatCard.getAIChatCardByChatToken` |
| 按主键删除 | `{Ns}.deleteByKey` | `AIChatCard.deleteByKey` |
| 按主键更新 | `{Ns}.update{Entity}ByKey` | `AIChatCard.updateAIChatCardByKey` |
| 分页查询 | `{Ns}.get{Entity}ListWithPage` | `AIChatCard.getAIChatCardListWithPage` |
| 列表查询 | `{Ns}.get{Entity}List` | `AIChatCard.getAIChatCardList` |
| 计数查询 | `{Ns}.get{Entity}ListCount` | `AIChatCard.getAIChatCardListCount` |

### 6.3 与业务对象的差异

| 维度 | 非业务对象 | 业务对象 |
|------|----------|---------|
| 公共片段 | 不引入 `BusinessDeployBase` | 引入 `BusinessDeployBase` 公共片段 |
| resultMap | 独立定义 | 继承 `businessDeployBasePojo` |
| WHERE 条件 | 视分表策略决定是否加 `corp_id` | 固定 `corp_id=#{corpId} AND id=#{id}` |

---

## 7. 异常处理规范

- 方法签名声明具体异常：`throws ParameterException, SQLException`
- `ParameterException`：分表参数校验失败（如 corpId 为空时 `getTableId` 抛出）
- `SQLException`：数据库操作异常
- DAO 层原则上不 catch 异常，全部上抛给 Service 层处理
- 兼容既有分页行为：`get{Entity}ListWithPage` 捕获列表查询的 `SQLException`，记录错误日志后返回已经包含总数的分页结果

---

## 8. 注释规范

遵循项目 `编码风格规范-注释.md`，非业务对象 DAO 层的注释风格相对简洁：

### 8.1 类注释

```java
/**
 * AI对话卡片数据访问层
 *
 * @author xxx
 */
```

无 `BasicDao` 的设计思路说明（因为结构较简单，不需要额外阐述）。

### 8.2 方法注释

简洁 JavaDoc，说明参数含义和返回值：

```java
/**
 * 根据主键查询卡片
 *
 * @param corpId 企业ID
 * @param id     主键ID
 * @return 卡片实体，不存在时返回null
 * @throws ParameterException 分表参数异常
 * @throws SQLException       数据库操作异常
 */
```

---

## 9. 完整模板

### 9.1 分表型 DAO 模板

```java
package com.raycloud.yc.eco.ding.app.{module}.dao;

import com.google.common.collect.Maps;
import com.raycloud.ding.commons.model.exception.ParameterException;
import com.raycloud.ding.commons.model.model.Result;
import com.raycloud.yc.eco.ding.app.com.common.constants.CommonDBConstants;
import com.raycloud.yc.eco.ding.app.com.common.dao.adapter.SqlSessionMapClient;
import com.raycloud.yc.eco.ding.app.{module}.pojo.{Entity};
import com.raycloud.yc.eco.ding.app.{module}.query.{Entity}Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * {实体中文名}数据访问层
 *
 * @author {author}
 */
@Repository
public class {Entity}Dao {

    private static Logger logger = LoggerFactory.getLogger({Entity}Dao.class);

    @Autowired
    private SqlSessionMapClient sqlSessionMapClient;

    /**
     * 新增{实体中文名}
     *
     * @param corpId 企业ID
     * @param entity {实体中文名}对象
     * @throws ParameterException 分表参数异常
     * @throws SQLException       数据库操作异常
     */
    public void add{Entity}(String corpId, {Entity} entity) throws ParameterException, SQLException {
        // 设置分表编号
        entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 设置企业ID
        entity.setCorpId(corpId);
        // 执行新增操作
        sqlSessionMapClient.insert("{Entity}.insert{Entity}", entity);
    }

    /**
     * 根据主键查询
     *
     * @param corpId 企业ID
     * @param id     主键ID
     * @return {实体中文名}实体，不存在时返回null
     * @throws ParameterException 分表参数异常
     * @throws SQLException       数据库操作异常
     */
    public {Entity} get{Entity}ByKey(String corpId, Long id) throws ParameterException, SQLException {
        // 创建查询参数
        Map<String, Object> params = Maps.newHashMap();
        // 设置分表编号
        params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 设置企业ID
        params.put("corpId", corpId);
        // 设置记录ID
        params.put("id", id);
        // 查询单条记录
        return sqlSessionMapClient.queryForObject("{Entity}.get{Entity}ByKey", params);
    }

    /**
     * 根据主键删除
     *
     * @param corpId 企业ID
     * @param id     主键ID
     * @return 影响行数
     * @throws ParameterException 分表参数异常
     * @throws SQLException       数据库操作异常
     */
    public Integer deleteByKey(String corpId, Long id) throws ParameterException, SQLException {
        // 创建删除参数
        Map<String, Object> params = Maps.newHashMap();
        // 设置分表编号
        params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 设置企业ID
        params.put("corpId", corpId);
        // 设置记录ID
        params.put("id", id);
        // 删除单条记录
        return sqlSessionMapClient.delete("{Entity}.deleteByKey", params);
    }

    /**
     * 根据主键更新
     *
     * @param corpId 企业ID
     * @param entity {实体中文名}对象
     * @return 影响行数
     * @throws ParameterException 分表参数异常
     * @throws SQLException       数据库操作异常
     */
    public Integer update{Entity}ByKey(String corpId, {Entity} entity) throws ParameterException, SQLException {
        // 设置分表编号
        entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 设置企业ID
        entity.setCorpId(corpId);
        // 更新单条记录
        return sqlSessionMapClient.update("{Entity}.update{Entity}ByKey", entity);
    }

    /**
     * 按条件分页查询
     *
     * @param query 查询条件
     * @return 分页结果
     * @throws SQLException 数据库操作异常
     */
    public Result<{Entity}> get{Entity}ListWithPage({Entity}Query query) throws SQLException {
        // 创建分页结果
        Result<{Entity}> rs = new Result<{Entity}>();
        // 获取查询参数
        Map<String, Object> params = query.getParams();
        // 查询记录总数
        Integer count = sqlSessionMapClient.queryForObject("{Entity}.get{Entity}ListCount", params);
        // 设置记录总数
        rs.setCount(count);
        // 判断没有记录
        if (count <= 0) {
            // 中断流程
            return rs;
        }
        // 查询分页列表
        try {
            // 设置分页列表
            rs.setList(get{Entity}List(params, "{Entity}.get{Entity}ListWithPage"));
        } catch (SQLException e) {
            // 列表查询异常时返回已有分页结果
            logger.error(e.getMessage());
        }
        // 返回分页结果
        return rs;
    }

    /**
     * 按条件查询列表
     *
     * @param query 查询条件
     * @return {实体中文名}列表
     * @throws SQLException 数据库操作异常
     */
    public List<{Entity}> get{Entity}List({Entity}Query query) throws SQLException {
        // 查询记录列表
        return get{Entity}List(query.getParams(), "{Entity}.get{Entity}List");
    }

    private List<{Entity}> get{Entity}List(Map<String, Object> params, String statementName) throws SQLException {
        // 执行列表查询
        return sqlSessionMapClient.queryForList(statementName, params);
    }
}
```

### 9.2 不分表型 DAO 模板

不分表时省略 `corpId` 参数和 `tableId` 设置：

```java
@Repository
public class {Entity}Dao {

    @Autowired
    private SqlSessionMapClient sqlSessionMapClient;

    public void add{Entity}({Entity} entity) {
        // 执行新增操作
        sqlSessionMapClient.insert("{Entity}.insert{Entity}", entity);
    }

    public {Entity} get{Entity}ByKey(Long id) {
        // 查询单条记录
        return sqlSessionMapClient.queryForObject("{Entity}.get{Entity}ByKey", id);
    }

    public Integer deleteByKey(Long id) {
        // 删除单条记录
        return sqlSessionMapClient.delete("{Entity}.deleteByKey", id);
    }

    public Integer update{Entity}ByKey({Entity} entity) {
        // 更新单条记录
        return sqlSessionMapClient.update("{Entity}.update{Entity}ByKey", entity);
    }
}
```

### 9.3 占位符说明

| 占位符 | 含义 | 示例 |
|--------|------|------|
| `{module}` | 模块路径 | `ai.chat`、`mcp`、`esign` |
| `{Entity}` | 实体类名 | `AIChatCard`、`McpApiKey` |
| `{author}` | 作者 | 实际开发者 |
| `{实体中文名}` | 业务名称 | AI对话卡片、MCP密钥 |

---

## 10. 业务对象 vs 非业务对象 快速对照

| 维度 | 业务对象 DAO | 非业务对象 DAO |
|------|------------|--------------|
| 实体基类 | `BusinessDeployBasePojo` | `BasePojo` |
| 类名后缀 | `BasicDao` | `Dao` |
| 方法命名 | `SingleBean` 模式 | `add/get/update/delete + Entity` |
| 数据库 | MySQL + PostgreSQL | 仅 MySQL |
| SqlMap 公共片段 | 引入 `BusinessDeployBase` | 独立定义 |
| 异常声明 | `throws Exception` | `throws ParameterException, SQLException` |
| SqlMap 文件 | basic + 定制 两套 | 单一文件 |
