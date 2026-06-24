# 有成CRM 开放接口开发文档

> 本目录是有成CRM（杭州有成精益科技有限公司）对外开放接口的离线开发文档，整理自官网帮助中心「有成CRM开发文档」菜单，共 **45 篇**，已按菜单结构归档，并对正文（标题/文件名）做了去序号与格式规范化处理。
>
> 官网来源：<https://www.ycbg.com/help-center.html?tab=1&id=641>

---

## 📑 目录导航

- **入门**
  - [概述（首次接入必看）](概述（首次接入必看）.md)
  - [服务端接入申请](服务端接入申请.md)
  - [开发示例](开发示例.md)
  - [获取 corpAccessToken](获取corpAccessToken.md)
- **基础数据操作接口** — [进入目录](有成CRM基础数据操作接口/)
- **业务对象操作接口（V1）** — [进入目录](有成CRM业务对象操作接口/)
- **业务对象接口 V2（推荐）** — [进入目录](有成CRM业务对象接口V2/)
- [有成CRM-MCP 服务](有成CRM-MCP服务.md)
- **开发常见问题** — [进入目录](开发常见问题/)

---

## 🚀 快速入门

第三方首次接入分 **4 步**（操作入口均在 PC 端 `设置 → 开发者中心`）：

```
1. 申请企业开放数据权限   →  获得 appId / appSecret
2. 设置接口调用 IP 白名单  →  请求来源 IP 必须在白名单内
3. 获取 corpAccessToken    →  用 appId + appSecret + corpId 换取
4. 调用数据开放接口        →  每次请求携带 corpAccessToken + corpId
```

### 最小调用示例

```bash
# 1) 获取 corpAccessToken（有效期 7200 秒，重复获取自动续期）
curl -X POST http://crmapi.superboss.cc/oapi/corp/corp_access_token/get.json \
  -H "Content-Type: application/json" \
  -d '{
    "corpId":     "CORP_ID",
    "appId":      "APP_ID",
    "appSecret":  "APP_SECRET"
  }'

# 2) 用返回的 corpAccessToken 查询客户列表（推荐 V2）
curl -X POST http://crmapi.superboss.cc/oapi/corp/v2/data/list.json \
  -H "Content-Type: application/json" \
  -d '{
    "corpId":          "CORP_ID",
    "corpAccessToken": "CORP_ACCESS_TOKEN",
    "deployId":        "customer"
  }'
```

详见 [开发示例](开发示例.md)（以「查询客户中分配状态为未分配的数据」为例的完整流程）。

---

## 🧠 核心概念

| 概念 | 说明 |
|------|------|
| **业务对象** | 客户、线索、合同订单、产品、回款等业务实体的统称。所有数据操作本质上都是对业务对象的操作。 |
| **deployId** | 业务对象的唯一标识，接口通过它区分不同业务对象。如 `customer`（客户）、`opportunity`（销售机会）、`sale_order`（合同订单）。通过 [开放业务对象列表](有成CRM业务对象操作接口/开放业务对象列表.md) 获取。 |
| **templateId** | 单据模板 ID。同一业务对象在不同场景下字段不同，可用模板区分；系统预设默认模板为 `default_template`。通过 [人员可见模版范围列表](有成CRM基础数据操作接口/人员可见模版范围列表.md) 获取。 |
| **corpAccessToken** | 访问企业数据的全局唯一票据，有效期 **7200 秒**，重复获取返回相同结果并自动续期。 |
| **corpId** | 企业 ID，与 corpAccessToken 一起用于建立访问连接。 |

---

## ⚙️ 通用约定

| 项目 | 约定 |
|------|------|
| **请求方式** | 全部为 `POST` |
| **数据格式** | `application/json`，UTF-8 编码 |
| **API 根域名** | `http://crmapi.superboss.cc/` |
| **鉴权方式** | 请求体携带 `corpAccessToken` + `corpId`（非 Header） |
| **频率限制** | 单企业不超过 **60 次 / 20 秒** |
| **幂等性** | 数据新增接口 **5 秒内**提交完全相同参数会被幂等过滤 |
| **统一响应结构** | `{ apiName, data, message, result }`，`result=100` 表示成功 |

> ⚠️ 重置 `appSecret` 会使当前 `corpAccessToken` 即时失效，需用新 `appSecret` 重新获取。

---

## 📋 接口总览

> 完整路径 = `http://crmapi.superboss.cc` + 下表「路径」。

### 鉴权

| 接口 | 方法 | 路径 |
|------|:----:|------|
| [获取 corpAccessToken](获取corpAccessToken.md) | POST | `/oapi/corp/corp_access_token/get.json` |

### 基础数据操作接口（`/oapi/corp/v1/`）

| 接口 | 路径 |
|------|------|
| [企业下人员列表](有成CRM基础数据操作接口/企业下人员列表.md) | `/oapi/corp/v1/user/list.json` |
| [人员可见部门范围列表](有成CRM基础数据操作接口/人员可见部门范围列表.md) | `/oapi/corp/v1/owner/dept/list.json` |
| [人员可见人员范围列表](有成CRM基础数据操作接口/人员可见人员范围列表.md) | `/oapi/corp/v1/owner/user/list.json` |
| [人员可见模版范围列表](有成CRM基础数据操作接口/人员可见模版范围列表.md) | `/oapi/corp/v1/owner/template/list.json` |
| [开放业务对象字段列表](有成CRM基础数据操作接口/开放业务对象字段列表.md) | `/oapi/corp/v1/object/field/list.json` |
| [业务对象新增页面字段列表](有成CRM基础数据操作接口/业务对象新增页面字段列表.md) | `/oapi/corp/v1/add/field/list.json` |
| [业务对象编辑页面字段列表](有成CRM基础数据操作接口/业务对象编辑页面字段列表.md) | `/oapi/corp/v1/upd/field/list.json` |
| [获取销售机会阶段列表](有成CRM基础数据操作接口/获取销售机会阶段列表.md) | `/oapi/corp/v1/opportunity_stage/list.json` |
| [数据字典值列表查询](有成CRM基础数据操作接口/数据字典值列表查询.md) | `/oapi/corp/v1/dic/list.json` |

### 业务对象操作接口 V1（`/oapi/corp/v1/`）

> 数据 CRUD 官方**推荐使用 V2**，下表已标注。

| 接口 | 路径 | 备注 |
|------|------|------|
| [开放业务对象列表](有成CRM业务对象操作接口/开放业务对象列表.md) | `/oapi/corp/v1/object/list.json` | 获取可操作业务对象，返回 deployId |
| [开放业务对象数据列表](有成CRM业务对象操作接口/开放业务对象数据列表.md) | `/oapi/corp/v1/data/list.json` | [推荐 V2](有成CRM业务对象接口V2/数据列表V2接口.md) |
| [开放业务对象数据详情](有成CRM业务对象操作接口/开放业务对象数据详情.md) | `/oapi/corp/v1/data/detail.json` | [推荐 V2](有成CRM业务对象接口V2/数据详情V2接口.md) |
| [开放业务对象数据新增](有成CRM业务对象操作接口/开放业务对象数据新增.md) | `/oapi/corp/v1/data/insert.json` | [推荐 V2](有成CRM业务对象接口V2/数据新增V2接口.md) |
| [开放业务对象数据更新](有成CRM业务对象操作接口/开放业务对象数据更新.md) | `/oapi/corp/v1/data/update.json` | [推荐 V2](有成CRM业务对象接口V2/数据更新V2接口.md) |
| [开放业务对象数据删除](有成CRM业务对象操作接口/开放业务对象数据删除.md) | `/oapi/corp/v1/data/delete.json` | [推荐 V2](有成CRM业务对象接口V2/数据删除V2接口.md) |
| [更换负责人](有成CRM业务对象操作接口/更换负责人.md) | `/oapi/corp/v1/data/update/charger.json` | |
| [批量新增协作人](有成CRM业务对象操作接口/批量新增协作人.md) | `/oapi/corp/v1/data/batch/add/collaborator.json` | |
| [批量删除协作人](有成CRM业务对象操作接口/批量删除协作人.md) | `/oapi/corp/v1/data/batch/del/collaborator.json` | |
| [更换客户公海](有成CRM业务对象操作接口/更换客户公海.md) | `/oapi/corp/v1/customer/change_seas.json` | |
| [更换线索公海](有成CRM业务对象操作接口/更换线索公海.md) | `/oapi/corp/v1/saleClue/change_seas.json` | |
| [新增公海成员](有成CRM业务对象操作接口/新增公海成员.md) | `/oapi/corp/v1/customer/add/seas/person.json` | |
| [删除公海成员](有成CRM业务对象操作接口/删除公海成员.md) | `/oapi/corp/v1/customer/del/seas/person.json` | |
| [合同关联订单列表](有成CRM业务对象操作接口/合同关联订单列表.md) | `/oapi/corp/v1/contract/sale/order.json` | |
| [产品上下架](有成CRM业务对象操作接口/产品上下架（未上线）.md) | `/oapi/corp/v1/product/shelves.json` | 未上线 |
| [出入库拆分升级说明](有成CRM业务对象操作接口/出入库拆分升级说明.md) | — | 说明类 |

### 业务对象接口 V2（`/oapi/corp/v2/`）⭐ 推荐接入

| 接口 | 路径 |
|------|------|
| [数据列表 V2 接口](有成CRM业务对象接口V2/数据列表V2接口.md) | `/oapi/corp/v2/data/list.json` |
| [数据详情 V2 接口](有成CRM业务对象接口V2/数据详情V2接口.md) | `/oapi/corp/v2/data/detail.json` |
| [数据新增 V2 接口](有成CRM业务对象接口V2/数据新增V2接口.md) | `/oapi/corp/v2/data/insert.json` |
| [数据更新 V2 接口](有成CRM业务对象接口V2/数据更新V2接口.md) | `/oapi/corp/v2/data/update.json` |
| [数据删除 V2 接口](有成CRM业务对象接口V2/数据删除V2接口.md) | `/oapi/corp/v2/data/delete.json` |

---

## ❓ 开发常见问题速查

| 问题 | 关键点 |
|------|--------|
| [新增接口未返回子对象 Id，编辑时如何传入子对象内容？](开发常见问题/新增接口未返回子对象Id，编辑时如何传入子对象内容？.md) | 子对象处理 |
| [数据详情和列表接口返回的手机号是加密的](开发常见问题/数据详情和列表接口%20返回的手机号是加密的.md) | 手机号脱敏 |
| [常见 comparison 查询条件组装格式示例](开发常见问题/常见comparison查询条件组装格式示例.md) | 查询条件结构 |
| [非必填字段接口新增时报错必需传入](开发常见问题/页面新增_修改时对应字段为非必填内容，但是通过接口新增时报错必需传入.md) | 字段必填校验 |
| [下拉类型字段如何获取其取值范围](开发常见问题/下拉类型的字段如何获取其取值范围.md) | 下拉取值 |
| [下拉类型字段作为查询条件查不到数据](开发常见问题/下拉类型的字段%20作为查询条件查询不到对应的数据.md) | 下拉查询 |
| [负责人数据传入不生效](开发常见问题/负责人数据传入不生效.md) | 负责人字段 |
| [怎样找到我要的接口](开发常见问题/怎样找到我要的接口.md) | 接口定位 |
| [客户新增报"来源或者数据不能为空"](开发常见问题/客户新增报“来源或者数据不能为空”.md) | 来源字段 |
| [怎样获取业务对象中关联对象的 Id 值](开发常见问题/怎样获取业务对象中关联对象的Id值.md) | 关联对象 |

---

## 📌 说明

- 本目录为官网文档的**离线整理副本**，正文内容与官网保持一致；如官网更新，可重新抓取刷新。
- [有成CRM-MCP 服务](有成CRM-MCP服务.md) 官网页面目前无正文内容（待上线），已如实保留占位。
- 文件名 / H1 标题已统一去掉官网菜单序号，便于检索与引用。
- 接口为 HTTP（非 HTTPS），调用时注意网络安全与 IP 白名单配置。
