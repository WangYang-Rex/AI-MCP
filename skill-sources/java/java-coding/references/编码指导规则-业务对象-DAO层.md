# 编码指导规则：业务对象 DAO 层

> 适用项目：ding-data-engine
> 参照实现：CorpContactorBasicDao

---

## 1. 分类标准

当实体类满足以下条件时，使用业务对象 DAO 规范：

| 条件 | 说明 |
|------|------|
| 实体基类 | 继承 `BusinessDeployBasePojo` |
| 公共字段 | 包含 corpId, templateId, chargerId, created, modified 等 |
| 分表策略 | 使用企业级分表（如 `CORP_SHARING_32`） |
| 数据库 | MySQL + PostgreSQL 双版本 |

典型实体：客户(CorpCustomer)、联系人(CorpContactor)、商机、项目(CorpProject)、拜访计划(CorpVisitPlan) 等 CRM 核心业务对象。

---

## 2. 类命名规范

| 角色 | 命名格式 | 示例 |
|------|---------|------|
| MySQL DAO | `{Entity}BasicDao` | `CorpContactorBasicDao` |
| PostgreSQL DAO | `{Entity}BasicPGDao` | `CorpContactorBasicPGDao` |
| Query | `{Entity}BasicQuery` | `CorpContactorBasicQuery` |
| Service 接口 | `{Entity}BasicService` | `CorpContactorBasicService` |
| Service 实现 | `{Entity}BasicServiceImpl` | `CorpContactorBasicServiceImpl` |

**要点**：
- DAO 类名带 `Basic` 后缀，表示仅包含标准 CRUD，不含 JOIN 和定制 SQL
- 同一实体可存在 `BasicDao`（标准 CRUD）和普通 `Dao`（定制 SQL）两套 DAO

---

## 3. 方法命名规范

统一使用 `SingleBean` 模式，与实体名无关，所有业务对象 DAO 方法名一致：

| 操作 | 方法名 | 返回值 |
|------|--------|--------|
| 插入 | `insertSingleBean` | `Long`（成功返回 id，失败返回 -1L） |
| 按主键查询 | `querySingleBeanByKey` | 实体 |
| 按主键批量查询 | `querySingleBeanByKeys` | `List<实体>` |
| 按主键删除 | `deleteSingleBeanByKey` | `Integer` |
| 按主键批量删除 | `deleteSingleBeanByKeys` | `Integer` |
| 按企业删除 | `deleteSingleBeanByCorpId` | `Integer` |
| 按主键更新 | `updateSingleBeanByKey` | `Integer` |
| 分页查询 | `querySingleBeanListWithPage` | `Result<实体>` |
| 列表查询 | `querySingleBeanList` | `List<实体>` |
| 计数查询 | `querySingleBeanListCount` | `Integer` |

**PostgreSQL 额外方法**：

| 操作 | 方法名 | 说明 |
|------|--------|------|
| 选择性更新 | `updateFullBeanByKey` | `selective` 参数控制 null 值是否更新 |
| 单条插入 | `insertFullBeanByKey` | 使用 `ON CONFLICT DO NOTHING` |
| 批量插入 | `batchInsertFullBeanByKey` | 使用 `ON CONFLICT DO NOTHING` |

---

## 4. 方法签名规范

### 4.1 参数顺序

```
方法名(String corpId, 业务参数...) throws Exception
```

- `corpId` 始终为第一个参数
- 异常统一 `throws Exception`，上抛给 Service 层处理
- 兼容既有 PG DAO 接口：`updateFullBeanByKey(boolean selective, String corpId, EntitySO entity)` 保持 `selective` 为第一个参数

### 4.2 各方法签名模板

```java
public Long insertSingleBean(String corpId, Entity entity) throws Exception
public Entity querySingleBeanByKey(String corpId, Long id) throws Exception
public List<Entity> querySingleBeanByKeys(String corpId, List<Long> ids) throws Exception
public Integer deleteSingleBeanByKey(String corpId, Long id) throws Exception
public Integer deleteSingleBeanByKeys(String corpId, List<Long> ids) throws Exception
public Integer deleteSingleBeanByCorpId(String corpId) throws Exception
public Integer updateSingleBeanByKey(String corpId, Entity entity) throws Exception
public Result<Entity> querySingleBeanListWithPage(Query query) throws SQLException
public List<Entity> querySingleBeanList(Query query) throws SQLException
public Integer querySingleBeanListCount(Query query) throws SQLException
```

---

## 5. 参数组装规范

### 5.1 实体参数（insert / update）

直接 set 到实体上：

```java
entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
entity.setCorpId(corpId);
```

### 5.2 Map 参数（query / delete）

```java
Map<String, Object> params = Maps.newHashMap();
params.put("id", id);
params.put("corpId", corpId);
params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
```

**固定三要素**：`corpId` + `tableId` + 业务参数，corpId 和 tableId 必传。

### 5.3 Query 参数（分页 / 列表）

通过 `Query.getParams()` 获取，Query 内部设置 tableId：

```java
// Query 类内
@Override
public Map<String, Object> getParams() throws SQLException {
    Map<String, Object> params = super.getParams();
    params.put("tableId", CommonDBConstants.getTableId(getCorpId(), CommonDBConstants.CORP_SHARING_32));
    return params;
}
```

---

## 6. SqlMap 命名规范

### 6.1 文件命名

| 文件类型 | 命名格式 | 示例 |
|---------|---------|------|
| MySQL 标准 CRUD | `{table}-basic-sqlmap.xml` | `corp_contactor-basic-sqlmap.xml` |
| MySQL 定制 SQL | `{table}-sqlmap.xml` | `corp_contactor-sqlmap.xml` |
| PostgreSQL CRUD | `{table}-basic-pg-sqlmap.xml` | `corp_contactor-basic-pg-sqlmap.xml` |

### 6.2 namespace 与 sqlId

```
namespace = 表名（如 CorpContactor），不带 Basic
sqlId = {操作}SingleBean（MySQL） / pg_{操作}FullBean（PostgreSQL）
```

| 操作 | MySQL sqlId | PG sqlId |
|------|-----------|----------|
| 插入 | `{Ns}.insertSingleBean` | `{Ns}.pg_insertFullBeanByKey` |
| 批量插入 | — | `{Ns}.pg_batchInsertFullBeanByKey` |
| 按主键查询 | `{Ns}.querySingleBeanByKey` | — |
| 按主键更新 | `{Ns}.updateSingleBeanByKey` | `{Ns}.pg_updateFullBeanByKey` |
| 按主键删除 | `{Ns}.deleteSingleBeanByKey` | 复用 MySQL 的 sqlId |
| 按主键批量删除 | `{Ns}.deleteSingleBeanByKeys` | 复用 MySQL 的 sqlId |
| 按企业删除 | `{Ns}.deleteSingleBeanByCorpId` | 复用 MySQL 的 sqlId |
| 分页查询 | `{Ns}.querySingleBeanListWithPage` | — |
| 列表查询 | `{Ns}.querySingleBeanList` | — |
| 计数查询 | `{Ns}.querySingleBeanListCount` | — |

### 6.3 公共片段

所有 sqlmap 必须引入 `BusinessDeployBase` 公共片段：

```xml
<!-- resultMap 继承 -->
<resultMap id="xxx" type="Entity" extends="BusinessDeployBase.businessDeployBasePojo">

<!-- 列定义 -->
<sql id="base_col">
    <include refid="BusinessDeployBase.common_col"/>,
    <!-- 业务字段 -->
</sql>

<!-- 更新 -->
<include refid="BusinessDeployBase.update_trim"/>

<!-- 插入 -->
<include refid="BusinessDeployBase.insert_before_trim"/>
<include refid="BusinessDeployBase.insert_after_trim"/>
<include refid="BusinessDeployBase.insert_duplicate_update"/>
```

### 6.4 WHERE 条件规范

```
WHERE corp_id=#{corpId} AND id=#{id}
```

corp_id 在前，id 在后。

---

## 7. 注释规范

### 7.1 类注释

格式：概述 + 设计思路（分表策略、参数组装、异常处理）

```java
/**
 * 联系人基础数据访问层（MySQL）
 * 提供标准CRUD操作，不包含JOIN查询和定制SQL
 *
 * 设计思路：
 * - 分表策略：使用CORP_SHARING_32，按corpId分32张表
 * - 参数组装：统一使用Maps.newHashMap()构建查询参数
 * - 异常处理：抛出Exception交由Service层统一处理
 *
 * @author xxx
 */
```

### 7.2 方法注释

完整 JavaDoc，所有参数说明含义，返回值说明各种情况：

```java
/**
 * 根据主键查询联系人
 *
 * @param corpId 企业ID，用于分表定位和权限校验
 * @param id     记录主键ID
 * @return 联系人实体，不存在时返回null
 * @throws Exception 数据库操作异常
 */
```

---

## 8. 完整模板

### 8.1 MySQL DAO 模板

```java
package com.raycloud.yc.eco.ding.app.{module}.dao;

import com.google.common.collect.Maps;
import com.raycloud.ding.commons.model.model.Result;
import com.raycloud.yc.eco.ding.app.com.common.constants.CommonDBConstants;
import com.raycloud.yc.eco.ding.app.com.common.dao.adapter.SqlSessionMapClient;
import com.raycloud.yc.eco.ding.app.{module}.pojo.{Entity};
import com.raycloud.yc.eco.ding.app.{module}.query.{Entity}BasicQuery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * {实体中文名}基础数据访问层（MySQL）
 * 提供标准CRUD操作，不包含JOIN查询和定制SQL
 *
 * 设计思路：
 * - 分表策略：使用CORP_SHARING_32，按corpId分32张表
 * - 参数组装：统一使用Maps.newHashMap()构建查询参数
 * - 异常处理：抛出Exception交由Service层统一处理
 *
 * @author {author}
 */
@Repository
public class {Entity}BasicDao {

    @Autowired
    private SqlSessionMapClient sqlSessionMapClient;

    /**
     * 新增{实体中文名}
     *
     * @param corpId 企业ID，用于分表和权限校验
     * @param entity {实体中文名}实体
     * @return 插入成功返回记录ID，失败返回-1L
     * @throws Exception 数据库操作异常
     */
    public Long insertSingleBean(String corpId, {Entity} entity) throws Exception {
        // 设置分表编号
        entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 设置企业ID
        entity.setCorpId(corpId);
        // 执行新增操作
        int insert = sqlSessionMapClient.insert("{Namespace}.insertSingleBean", entity);
        // 判断新增成功
        if (insert > 0) {
            // 返回记录ID
            return entity.getId();
        }
        // 返回失败标识
        return -1L;
    }

    /**
     * 根据主键查询{实体中文名}
     *
     * @param corpId 企业ID，用于分表定位和权限校验
     * @param id     记录主键ID
     * @return {实体中文名}实体，不存在时返回null
     * @throws Exception 数据库操作异常
     */
    public {Entity} querySingleBeanByKey(String corpId, Long id) throws Exception {
        // 创建查询参数
        Map<String, Object> params = Maps.newHashMap();
        // 设置记录ID
        params.put("id", id);
        // 设置企业ID
        params.put("corpId", corpId);
        // 设置分表编号
        params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 查询单条记录
        return sqlSessionMapClient.queryForObject("{Namespace}.querySingleBeanByKey", params);
    }

    /**
     * 根据主键批量查询{实体中文名}
     *
     * @param corpId 企业ID，用于分表定位和权限校验
     * @param ids    记录主键ID列表
     * @return {实体中文名}列表，不存在时返回空列表
     * @throws Exception 数据库操作异常
     */
    public List<{Entity}> querySingleBeanByKeys(String corpId, List<Long> ids) throws Exception {
        // 创建查询参数
        Map<String, Object> params = Maps.newHashMap();
        // 设置企业ID
        params.put("corpId", corpId);
        // 设置记录ID列表
        params.put("ids", ids);
        // 设置分表编号
        params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 查询记录列表
        return sqlSessionMapClient.queryForList("{Namespace}.querySingleBeanByKeys", params);
    }

    /**
     * 根据主键删除{实体中文名}
     *
     * @param corpId 企业ID，用于分表定位和权限校验
     * @param id     记录主键ID
     * @return 删除成功返回影响行数，失败返回0
     * @throws Exception 数据库操作异常
     */
    public Integer deleteSingleBeanByKey(String corpId, Long id) throws Exception {
        // 创建删除参数
        Map<String, Object> params = Maps.newHashMap();
        // 设置记录ID
        params.put("id", id);
        // 设置企业ID
        params.put("corpId", corpId);
        // 设置分表编号
        params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 删除单条记录
        return sqlSessionMapClient.delete("{Namespace}.deleteSingleBeanByKey", params);
    }

    /**
     * 根据主键批量删除{实体中文名}
     *
     * @param corpId 企业ID，用于分表定位和权限校验
     * @param ids    记录主键ID列表
     * @return 删除成功返回影响行数，失败返回0
     * @throws Exception 数据库操作异常
     */
    public Integer deleteSingleBeanByKeys(String corpId, List<Long> ids) throws Exception {
        // 创建删除参数
        Map<String, Object> params = Maps.newHashMap();
        // 设置企业ID
        params.put("corpId", corpId);
        // 设置记录ID列表
        params.put("ids", ids);
        // 设置分表编号
        params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 批量删除记录
        return sqlSessionMapClient.delete("{Namespace}.deleteSingleBeanByKeys", params);
    }

    /**
     * 根据企业删除所有{实体中文名}
     *
     * @param corpId 企业ID
     * @return 删除成功返回影响行数，失败返回0
     * @throws Exception 数据库操作异常
     */
    public Integer deleteSingleBeanByCorpId(String corpId) throws Exception {
        // 创建删除参数
        Map<String, Object> params = Maps.newHashMap();
        // 设置企业ID
        params.put("corpId", corpId);
        // 设置分表编号
        params.put("tableId", CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 删除企业记录
        return sqlSessionMapClient.delete("{Namespace}.deleteSingleBeanByCorpId", params);
    }

    /**
     * 根据主键更新{实体中文名}
     *
     * @param corpId 企业ID，用于分表定位和权限校验
     * @param entity {实体中文名}实体
     * @return 更新成功返回影响行数，失败返回0
     * @throws Exception 数据库操作异常
     */
    public Integer updateSingleBeanByKey(String corpId, {Entity} entity) throws Exception {
        // 设置企业ID
        entity.setCorpId(corpId);
        // 设置分表编号
        entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 更新单条记录
        return sqlSessionMapClient.update("{Namespace}.updateSingleBeanByKey", entity);
    }

    /**
     * 按条件分页查询{实体中文名}
     *
     * @param query 查询条件对象
     * @return 分页结果对象
     * @throws SQLException 数据库操作异常
     */
    public Result<{Entity}> querySingleBeanListWithPage({Entity}BasicQuery query) throws SQLException {
        // 创建分页结果
        Result<{Entity}> rs = new Result<{Entity}>();
        // 获取查询参数
        Map<String, Object> params = query.getParams();
        // 查询记录总数
        Integer count = sqlSessionMapClient.queryForObject("{Namespace}.querySingleBeanListCount", params);
        // 设置记录总数
        rs.setCount(count);
        // 判断没有记录
        if (count <= 0) {
            // 中断流程
            return rs;
        }
        // 查询分页列表
        rs.setList(querySingleBeanList(params, "{Namespace}.querySingleBeanListWithPage"));
        // 返回分页结果
        return rs;
    }

    /**
     * 按条件查询{实体中文名}列表
     *
     * @param query 查询条件对象
     * @return {实体中文名}列表
     * @throws SQLException 数据库操作异常
     */
    public List<{Entity}> querySingleBeanList({Entity}BasicQuery query) throws SQLException {
        // 查询记录列表
        return querySingleBeanList(query.getParams(), "{Namespace}.querySingleBeanList");
    }

    /**
     * 按条件查询{实体中文名}总数
     *
     * @param query 查询条件对象
     * @return 记录总数
     * @throws SQLException 数据库操作异常
     */
    public Integer querySingleBeanListCount({Entity}BasicQuery query) throws SQLException {
        // 查询记录总数
        return sqlSessionMapClient.queryForObject("{Namespace}.querySingleBeanListCount", query.getParams());
    }

    private List<{Entity}> querySingleBeanList(Map<String, Object> params, String statementName) throws SQLException {
        // 执行列表查询
        return sqlSessionMapClient.queryForList(statementName, params);
    }
}
```

### 8.2 PostgreSQL DAO 模板

```java
@Repository
public class {Entity}BasicPGDao {

    @Autowired
    private PgSqlSessionMapClient sqlSessionMapClient;

    /**
     * 插入（ON CONFLICT DO NOTHING）
     */
    public Long insertFullBeanByKey(String corpId, {Entity}SO entity) throws Exception {
        // 设置分表编号
        entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 设置企业ID
        entity.setCorpId(corpId);
        // 执行新增操作
        int insert = sqlSessionMapClient.insert("{Namespace}.pg_insertFullBeanByKey", entity);
        // 判断新增成功
        if (insert > 0) {
            // 返回记录ID
            return entity.getId();
        }
        // 返回失败标识
        return -1L;
    }

    /**
     * 批量插入（ON CONFLICT DO NOTHING）
     */
    public void batchInsertFullBeanByKey(String corpId, List<{Entity}SO> list) throws ParameterException {
        // 遍历新增记录
        for ({Entity}SO entity : list) {
            // 设置分表编号
            entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
            // 设置企业ID
            entity.setCorpId(corpId);
        }
        // 执行批量新增
        sqlSessionMapClient.insert("{Namespace}.pg_batchInsertFullBeanByKey", list);
    }

    /**
     * 选择性更新
     * selective=true 仅更新非null字段，selective=false 全量更新
     */
    public Integer updateFullBeanByKey(boolean selective, String corpId, {Entity}SO entity) throws Exception {
        // 设置企业ID
        entity.setCorpId(corpId);
        // 设置分表编号
        entity.setTableId(CommonDBConstants.getTableId(corpId, CommonDBConstants.CORP_SHARING_32));
        // 设置更新模式
        entity.setSelective(selective);
        // 更新单条记录
        return sqlSessionMapClient.update("{Namespace}.pg_updateFullBeanByKey", entity);
    }

    // DELETE 方法复用 MySQL DAO，调用方式相同
}
```

### 8.3 占位符说明

| 占位符 | 含义 | 示例 |
|--------|------|------|
| `{module}` | 模块路径 | `contactor`、`customer`、`visit.sign` |
| `{Entity}` | 实体类名 | `CorpContactor`、`CorpCustomer` |
| `{Namespace}` | sqlmap namespace | `CorpContactor`、`CorpCustomer` |
| `{author}` | 作者 | 实际开发者 |
| `{实体中文名}` | 业务名称 | 联系人、客户 |
