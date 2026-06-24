# 获取corpAccessToken

corpAccessToken是访问企业数据的全局唯一票据，拉取企业数据时需要携带corpAccessToken和corpId，corpAccessToken的有效期为7200秒，有效期重复获取返回结果相同并自动续期。

**请求说明**

请求方式：post

请求参数类型：application/json

请求路径：http://crmapi.superboss.cc/oapi/corp/corp_access_token/get.json

**请求参数说明**：

| 参数      | 参数类型 | 参数必填 | 说明                  |
|-----------|----------|----------|-----------------------|
| appId     | String   | 是       | 企业开放权限appId     |
| appSecret | String   | 是       | 企业开放权限appSecret |
| corpId    | String   | 是       | 企业ID                |

**请求参数结构示例：**

```json
{
"corpId":"CORP_ID",
"appId": "APP_ID",
"appSecret": "APP_SECRET"
}
```

**响应结果说明：**

| 参数                 | 参数类型 | 参数必填 | 参数说明                       |
|----------------------|----------|----------|--------------------------------|
| apiName              | String   | 是       | 接口apiName                    |
| data                 | Object   | 否       | 响应数据                       |
| data.corpAccessToken | String   | 否       | 访问企业数据合法性票据         |
| data.expiresTime     | Int      | 否       | 访问企业数据合同性票据有效时间 |
| message              | String   | 是       | 返回码描述                     |
| result               | Int      | 是       | 返回码                         |

**响应结果结果示例；**

a.正常结果

```json
{
"apiName": "",
"data": {
"corpAccessToken": "CORP_ACCESS_TOKEN",
"expiresTime": 7200
},
"message": "操作成功",
"result": 100
}
```

b.错误结果

```json
{
"apiName": "",
"message": "参数appId或appSecret错误",
"result": 11005
}
```
