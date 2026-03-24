---
title: "5月10号CRM非技术bug问题反馈记录"
nodeId: ZgpG2NdyVXrOqRxzH3E2AM698MwvDqPk
workspaceId: R2PmK2Q8rxRbeXvp
docUrl: "https://alidocs.dingtalk.com/i/nodes/ZgpG2NdyVXrOqRxzH3E2AM698MwvDqPk"
exportedAt: 2026-03-20T14:59:22.385Z
source: dingtalk-document-mcp
---
# 5月10号CRM非技术bug问题反馈记录

## 一、功能使用常见问题

1、为什么设置了计算公式，但是没有生效？



![Picture 1](https://alidocs2.oss-cn-zhangjiakou.aliyuncs.com/res/eLbnj1bxNveyylaN/img/f592a2c0-cae3-4bd3-8837-378a24ccea13.png?Expires=1774025950&OSSAccessKeyId=LTAI5tKTjg4Kq1HCdBJ8qpSp&Signature=FYgD9p1mXe4Z7%2BX55BvhTsqzztM%3D)

原因：设置的计算公式字段是个默认值字段，不是计算字段，不可能会触发计算的

2、项目的大列表常用筛选怎么没有了

原因：用户自己列表表头字段影藏了

3、为什么员工的部门是A同步过来总是变了



![Picture 2](https://alidocs2.oss-cn-zhangjiakou.aliyuncs.com/res/eLbnj1bxNveyylaN/img/f8126c25-5efe-4589-ace2-baa47f5465b0.png?Expires=1774025950&OSSAccessKeyId=LTAI5tKTjg4Kq1HCdBJ8qpSp&Signature=D5rpocCafnabzL%2FrM9pO1AvbzsA%3D)

原因：用户的部门A可见范围是不可见，所以自动挂在根部门下

4、导出图片和附件，列表是有图片的，为什么导出失败了



![Picture 3](https://alidocs2.oss-cn-zhangjiakou.aliyuncs.com/res/eLbnj1bxNveyylaN/img/330f53f6-4c98-49f5-a690-475fb45a288f.png?Expires=1774025950&OSSAccessKeyId=LTAI5tKTjg4Kq1HCdBJ8qpSp&Signature=eyUsIoC91xEUmF%2FvaDwhdBgQXf0%3D)

原因：只支持导出存储在有成CRM文件服务器的数据

5、为什么跟进记录PC端新建的时候，一直提示我跟进地址必填

原因：跟进地址是定位功能，PC端不能定位，产品需求影藏了此字段，地址必填，只能去移动端新建跟进

6、为什么配置了公海的回收规则，但是没有回收

原因，客户里的公海字段都没有填写

## 二、版本功能问题

#### 1、这个企业忽然很多功能模块缺失了



![Picture 4](https://alidocs2.oss-cn-zhangjiakou.aliyuncs.com/res/eLbnj1bxNveyylaN/img/96fbed45-02e5-4478-bbb8-6073d45f417b.png?Expires=1774025950&OSSAccessKeyId=LTAI5tKTjg4Kq1HCdBJ8qpSp&Signature=dHNWj1ioWGTbRMpbbUR%2BOdJiBho%3D)

原因：CRM版本到期了，赠送的功能是额外开通的，续费下单后会覆盖更新为当前版本范围的功能。

解决方案：给客成对应的工具权限；为提高客单价和续费升级业绩，建议销售杜绝和减少赠送，严格按照版本卖。

#### 2、要给用户试用项目阶段推进器功能，后台只开了项目，任务和阶段推进的功能都没开



![Picture 5](https://alidocs2.oss-cn-zhangjiakou.aliyuncs.com/res/eLbnj1bxNveyylaN/img/8298240e-070d-49b8-8849-617b5e934ede.png?Expires=1774025950&OSSAccessKeyId=LTAI5tKTjg4Kq1HCdBJ8qpSp&Signature=WhBkBpyj13jCbAnApVbWcCAGbMs%3D)

3、为什么这个企业没有子表单功能



![Picture 6](https://alidocs2.oss-cn-zhangjiakou.aliyuncs.com/res/eLbnj1bxNveyylaN/img/7599acb6-ba90-47e4-8d33-68de4170ea0d.png?Expires=1774025950&OSSAccessKeyId=LTAI5tKTjg4Kq1HCdBJ8qpSp&Signature=i9iSZq7Gkbdch5KPZbQr6d%2BA14Q%3D)

原因：高级功能是版本控制的

## 三、帮用户处理数据

1、因为用户管理员离职，让帮忙改下CRM管理员



![Picture 7](https://alidocs2.oss-cn-zhangjiakou.aliyuncs.com/res/eLbnj1bxNveyylaN/img/e25bfef6-f828-46bf-ab0c-8b4f036c4f8e.png?Expires=1774025950&OSSAccessKeyId=LTAI5tKTjg4Kq1HCdBJ8qpSp&Signature=Eu7GgCqZAGnAGmYepoMDtjOGoKo%3D)

处理方法：严格来讲，涉及数据安全问题，是需要引导让客户的系统管理员来操作的；

如遇特殊情况需要我们处理的：给客成对应的工具权限，可直接修改

2、员工离职了，可不可以帮用户处理下数据，直接改成通过

处理方法：离职交接都有审批交接的，可以直接换人，还不行，可以重置离职员工状态，代理操作审批数据

## 四、需求类问题

1、 计划回款中不要关联合同订单，能否把这字段取消或者，修改成非必填

原因：系统不支持，如果是需求问题，直接提交需求工单

## 五、问题反馈规范问题

1、开放接口反馈问题不规范

开放接口问题反馈：

1：接口调用地址：

2：接口请求参数：

3：接口调用返回结果：

2：日常问题反馈，经常提供的企业名称都是错的

规范示例：客户架构名称，客户来源（哪个平台），使用员工，功能界面，操作场景描述，截图，

