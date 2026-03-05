# Figma Dev Mode MCP 使用指南

## 概述

Figma Dev Mode MCP Server 是 Figma 推出的一个创新工具，它通过模型上下文协议（Model Context Protocol）将 Figma 设计文件直接集成到 AI 代码编辑器中。这个工具让 AI 智能体能够获取重要的设计信息和上下文，从而生成更准确、更符合设计意图的代码。

**重要提示**

Figma Dev Mode MCP Server 目前处于公开测试阶段，某些功能和设置可能尚未完全可用。

## 为什么需要 Figma MCP？

在传统的设计到代码工作流程中，开发者通常需要：

- 手动查看设计稿并理解设计意图
- 猜测颜色值、间距和字体大小
- 重复创建已存在的组件
- 在设计和代码之间来回切换

Figma MCP 解决了这些痛点，让 AI 能够：

- 直接读取设计文件中的精确数值
- 理解设计系统和组件结构
- 生成与现有代码库一致的代码
- 保持设计和代码的同步

## 主要特性

### 🎨 从选中框架生成代码

- 智能代码生成：选择 Figma 中的任意框架，AI 可以将其转换为可用的代码
- 适用场景：非常适合产品团队构建新流程或迭代应用功能
- 支持多种框架：可以生成 React、Vue 等不同框架的代码

### 📐 提取设计上下文

- 变量提取：直接将设计变量（颜色、字体、间距等）拉入 IDE
- 组件信息：获取组件的详细结构和属性
- 布局数据：提取布局信息，包括 Grid、Flexbox 等
- 设计系统支持：特别适用于设计系统和基于组件的工作流程

### 🔗 Code Connect 智能集成

- 组件复用：通过重用实际组件来提升输出质量
- 代码一致性：确保生成的代码与现有代码库保持一致
- 映射关系：建立设计组件与代码组件的映射关系

### 📝 丰富的设计信息

- 文本内容：提取设计中的实际文本内容
- 图层名称：利用有意义的图层命名来理解设计意图
- 注释信息：读取设计中的注释和说明
- 占位符内容：即使是占位符内容也能为 AI 提供有价值的上下文

## 系统要求

### 必需条件

- Figma 桌面应用：必须使用 Figma 桌面版（不支持网页版）
- 订阅计划：需要 Professional、Organization 或 Enterprise 计划的 Dev 或 Full 席位
- 支持的编辑器：VS Code、Cursor、Windsurf、Claude Code 等支持 MCP 的编辑器

### 推荐配置

- 最新版本：确保 Figma 桌面应用更新到最新版本
- 稳定网络：良好的网络连接以确保 MCP 服务器稳定运行

## 安装指南

### 第一步：启用 Figma MCP 服务器

1. 打开 Figma 桌面应用
   - 确保已更新到最新版本
   - 如果没有桌面应用，请先[下载安装](https://www.figma.com/downloads/)
2. 创建或打开设计文件
   - 创建一个新的 Figma Design 文件
   - 或打开现有的设计文件
3. 启用 MCP 服务器
   - 点击左上角的 Figma 菜单
   - 在 Preferences（偏好设置） 下选择 Enable Dev Mode MCP Server
   - 看到屏幕底部的确认消息，表示服务器已启用并运行
4. 记录服务器地址
   - 服务器将在本地运行：`http://127.0.0.1:3845/sse`
   - 请记住这个地址，下一步配置时需要用到

### 第二步：配置 MCP 客户端

#### VS Code 配置

1. 打开设置
   - 使用快捷键 `⌘ ,`（Mac）或 `Ctrl ,`（Windows）
   - 或通过菜单：Code → Settings → Settings
2. 搜索 MCP 设置
   - 在搜索栏中输入 "MCP"
   - 选择 Edit in settings.json
3. 添加配置

```json
{
  "chat.mcp.discovery.enabled": true,
  "mcp": {
    "servers": {
      "Figma Dev Mode MCP": {
        "type": "sse",
        "url": "http://127.0.0.1:3845/sse"
      }
    }
  },
  "chat.agent.enabled": true
}
```

4. 验证连接
   - 使用快捷键 `⌥⌘B`（Mac）打开聊天工具栏
   - 切换到 Agent 模式
   - 在选择工具菜单中查找 `MCP Server: Figma Dev Mode MCP` 部分
   - 如果没有看到工具，请重启 Figma 桌面应用和 VS Code

#### Cursor 配置

1. 打开 Cursor 设置
   - 菜单：Cursor → Settings → Cursor Settings

2. 添加 MCP 服务器
   - 转到 MCP 标签页
   - 点击 + Add new global MCP server

3. 输入配置
   ```json
   {
      "mcpServers": {
        "Figma": {
          "url": "http://127.0.0.1:3845/sse"
        }
      }
    }
    ```
>这里需要注意一下你Figma客户端刚才提示的端口是否正确



## 使用方法

### 基于选择的方式（推荐）

1. 在 Figma 中选择设计元素
   - 打开 Figma 桌面应用
   - 选择你想要转换为代码的框架或图层
2. 在编辑器中发起请求
   - 在你的 AI 代码编辑器中输入提示
   - 例如："请帮我实现当前选中的设计"
   - 或："将选中的组件转换为 React 代码"

### 基于链接的方式

1. 复制 Figma 链接
   - 在 Figma 中右键点击框架或图层
   - 选择 "Copy link"
2. 在编辑器中使用链接
   - 将链接粘贴到 AI 编辑器中
   - 例如："请帮我实现这个设计：[Figma链接]"

**提示**

AI 客户端无法直接导航到链接，但会提取其中的 node-id 来识别要处理的设计对象。

## 实用示例

### 创建组件

"请根据当前选中的 Figma 设计创建一个 React 组件，使用 Tailwind CSS 进行样式设置"

### 提取设计变量

"从当前选中的设计中提取所有颜色变量和字体样式，并生成对应的 CSS 变量"

### 生成响应式布局

"将这个 Figma 框架转换为响应式的 HTML/CSS 布局，确保在移动端和桌面端都能正常显示"

### 创建设计系统组件

"基于选中的设计创建一个可复用的按钮组件，包含不同的变体（primary、secondary、disabled）"

## 可用工具

Figma Dev Mode MCP Server 提供了三个主要工具：

1. 代码工具：获取设计的代码表示，支持多种框架
2. 图像工具：提取设计中的图像资源
3. 变量定义工具：获取设计变量的定义和值

你可以在服务器设置中调整代码工具返回的响应类型，以便根据具体任务进行微调。

## 最佳实践

### 设计准备

- 使用有意义的图层名称：清晰的命名有助于 AI 理解设计意图
- 添加注释：在复杂的设计中添加注释说明
- 使用设计系统：利用 Figma 的组件和变量系统
- 保持设计文件整洁：删除不必要的图层和元素

### 代码生成

- 明确指定框架：告诉 AI 你想要使用的技术栈
- 提供上下文：说明组件的用途和预期行为
- 迭代优化：根据生成的代码进行调整和优化

## 使用心得

- 不太适合组件生态丰富完善的团队：生成的代码默认会使用原生/你指定的组件库去实现，跟已有代码的样式肯定是高度不统一的，哪怕你显示指定了XXX组件去实现，部分props/配置也需要经过多轮prompt，且最终效果也不尽如人意
- 比较适合样式要求不高、交互不太复杂的小模块：比如复杂的表单模块，经过简单的prompt后就能达到使用标准，或者也可以把生成的代码当做模块骨架，在其基础上进行人工完善
- prompt是门技术活

### 高级提示词技巧
关键提示词要素：
- 明确技术栈：指定框架（React/Vue）、CSS 方案
- 输出要求：文件结构、代码规范
- 特殊功能：响应式断点、动画状态
- 设计还原重点：标注需严格还原的部分

```
你是一名资深前端工程师，请根据 Figma 设计精确生成 React 组件: 
要求：
- 使用 react + stylus
- 不需要任何业务逻辑，只需要静态react组件
- 严格还原间距和颜色
- 对移动设备做适配处理
设计链接：https://www.figma.com/design/xxxx
```


```
你是一名资深前端工程师，请根据 Figma 设计精确生成 React 组件: 
要求：
- 使用 react + stylus
- 不需要任何业务逻辑，只需要静态react组件
- 严格还原间距和颜色
- 对移动设备做适配处理
设计链接：https://www.figma.com/design/xxxx
```


## 故障排除

### 常见问题


#### 1. 无法开启 Enable Dev Mode MCP Server

- 必须是付费席位（Dev Mode）
- 必须是Beta版的Figma Desktop App，[下载链接](https://help.figma.com/hc/en-us/articles/5601429983767-Guide-to-the-Figma-desktop-app#Download_the_beta_version)

捣鼓了好久始终也没找到什么Enable Dev Mode MCP Server选项，后来发现文档里下边还有张图，是在这里的Perfermance...
<img width="286" height="365" alt="Image" src="https://github.com/user-attachments/assets/7ee5105f-23cd-4a3e-81f5-3fa425da6eee" />

点了之后可以看到一个提示
<img width="364" height="72" alt="Image" src="https://github.com/user-attachments/assets/a6c5c2f6-2d46-4a6b-ab0d-d86064bc771d" />

#### 1. 无法连接到 MCP 服务器

- 确保 Figma 桌面应用已启用 MCP 服务器
- 检查端口 3845 是否被占用
- 重启 Figma 桌面应用和代码编辑器

#### 2. 看不到可用工具

- 验证编辑器配置是否正确
- 确保使用的是支持 MCP 的编辑器版本
- 检查网络连接

#### 3. 生成的代码质量不佳

- 提供更详细的提示信息
- 确保设计文件结构清晰
- 使用 Code Connect 提供更多上下文

#### 4. VS Code 中无法使用

- 确保已启用 GitHub Copilot
- 检查 MCP 配置是否正确
- 更新到最新版本的 VS Code

### 调试技巧

1. 检查服务器状态
   - 在 Figma 中查看 MCP 服务器是否正在运行
   - 访问 `http://127.0.0.1:3845/sse` 检查连接
2. 查看编辑器日志
   - 检查编辑器的错误日志
   - 查看 MCP 相关的错误信息
3. 测试连接
   - 使用简单的提示测试基本功能
   - 逐步增加复杂度
