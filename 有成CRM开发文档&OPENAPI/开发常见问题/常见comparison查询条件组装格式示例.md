# 常见comparison查询条件组装格式示例

**日期范围条件组装**：

``` ql-syntax
{
    "conditionConfig": [
        {
            "conditions": [
                {
                    "comparison": "after",
                    "deployId": "customer",
                    "fieldName": "modified",
                    "fieldValue": "2021-12-20 16:03:52",
                    "domType": "DATETIME"
                },
                {
                    "comparison": "before",
                    "deployId": "customer",
                    "fieldName": "modified",
                    "fieldValue": "2021-12-20 16:08:52",
                    "domType": "DATETIME"
                }
            ]
        }
    ]
}
```

**IN 条件组装**：

``` ql-syntax
{
    "conditionConfig": [
        {
            "conditions": [
                {
                    "comparison": "IN_ARRAY",
                    "fieldName": "id",
                    "deployId": "customer",
                    "fieldValue": "1011,1010",
                    "domType": "TEXT"
                }
            ]
        }
    ]
}
```

**利用浏览器devTools快速构建查询条件**

在CRM系统中，页面查询条件格式与开放接口的查询条件格式是完全一致的，因此可以通过后台页面 快速的组织好查询条件。

1 打开页面上 高级筛选按钮 按需求组织好查询条件

![](https://dingtalkcdn.superboss.cc/ding/website/image/1647227260487.png)

2 **调出devTools，一般快捷键为F12，然后点击确定发起请求，在devTools对应请求的payload中 就可以获取到界面组织的查询条件 将这部分拷贝出来即可。**

![](https://dingtalkcdn.superboss.cc/ding/website/image/1647227290367.png)
