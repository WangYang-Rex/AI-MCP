好，这一版我们**彻底去掉“自愈”**，给你一套：

> ✅ **纯前端项目内运行的 AI + Playwright 测试方案（稳定可执行版）**

核心原则👇
👉 **AI 只生成 DSL，执行完全依赖稳定 selector（testid）**

---

# 一、最终架构（精简 & 可落地）

```text
自然语言
   ↓
AI → DSL（一次性生成）
   ↓
本地缓存（JSON）
   ↓
Playwright Runner（执行）
   ↓
结果输出
```

---

# 二、项目结构（直接照这个建）

```text
your-project/
├── src/
├── tests/
│   ├── ai/
│   │   ├── generateDSL.ts
│   │   ├── runner.ts
│   │   ├── types.ts
│   │   └── cache.ts
│   │
│   ├── cache/
│   │   └── login.json
│   │
│   └── specs/
│       └── login.test.ts
│
├── playwright.config.ts
├── package.json
└── .env
```

---

# 三、核心设计（非常重要）

## ✅ 1. DSL 标准（必须固定）

```ts
// tests/ai/types.ts

export type Step =
  | { action: 'goto'; url: string }
  | { action: 'click'; testId: string }
  | { action: 'fill'; testId: string; value: string }
  | { action: 'assert'; type: 'url'; value: string }
  | { action: 'assert'; type: 'visible'; testId: string };
```

---

## ✅ 2. 前端必须统一规范

👉 所有关键元素：

```html
<input data-testid="username-input" />
<input data-testid="password-input" />
<button data-testid="login-btn">登录</button>
```

👉 这是整个方案稳定性的核心（比 AI 重要 100 倍）

---

# 四、AI → DSL（生成模块）

---

## generateDSL.ts

```ts
// tests/ai/generateDSL.ts

import OpenAI from 'openai';
import { Step } from './types';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateDSL(input: string): Promise<Step[]> {
  const prompt = `
你是自动化测试工程师。

请把用户需求转换为测试步骤 JSON 数组。

规则：
1. 只能输出 JSON
2. action 仅支持：goto, click, fill, assert
3. 必须使用 testId（不要使用文本、css）
4. URL 使用相对路径
5. 不要解释

示例：
[
  { "action": "goto", "url": "/login" },
  { "action": "fill", "testId": "username-input", "value": "admin" },
  { "action": "fill", "testId": "password-input", "value": "123456" },
  { "action": "click", "testId": "login-btn" },
  { "action": "assert", "type": "url", "value": "/dashboard" }
]

需求：
${input}
`;

  const res = await client.chat.completions.create({
    model: 'gpt-5.3',
    messages: [{ role: 'user', content: prompt }]
  });

  const content = res.choices[0].message.content!;

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('DSL 解析失败:\n' + content);
  }
}
```

---

# 五、DSL 缓存（避免重复调用 AI）

---

## cache.ts

```ts
// tests/ai/cache.ts

import fs from 'fs';
import path from 'path';
import { Step } from './types';

const CACHE_DIR = path.resolve(__dirname, '../cache');

export function saveDSL(name: string, steps: Step[]) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
  }

  fs.writeFileSync(
    path.join(CACHE_DIR, `${name}.json`),
    JSON.stringify(steps, null, 2)
  );
}

export function loadDSL(name: string): Step[] | null {
  const file = path.join(CACHE_DIR, `${name}.json`);

  if (!fs.existsSync(file)) return null;

  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
```

---

# 六、执行引擎（核心）

---

## runner.ts

```ts
// tests/ai/runner.ts

import { expect } from '@playwright/test';
import { Step } from './types';

export async function runDSL(page, steps: Step[]) {
  for (const step of steps) {
    console.log('➡️ 执行步骤:', step);

    switch (step.action) {
      case 'goto':
        await page.goto(step.url);
        break;

      case 'click':
        await page.getByTestId(step.testId).click();
        break;

      case 'fill':
        await page.getByTestId(step.testId).fill(step.value);
        break;

      case 'assert':
        await handleAssert(page, step);
        break;
    }
  }
}

async function handleAssert(page, step: Step) {
  if (step.type === 'url') {
    await expect(page).toHaveURL(step.value);
  }

  if (step.type === 'visible') {
    await expect(page.getByTestId(step.testId)).toBeVisible();
  }
}
```

---

# 七、测试入口（最关键）

---

## login.test.ts

```ts
// tests/specs/login.test.ts

import { test } from '@playwright/test';
import { generateDSL } from '../ai/generateDSL';
import { runDSL } from '../ai/runner';
import { loadDSL, saveDSL } from '../ai/cache';

test('AI 登录测试', async ({ page }) => {
  const name = 'login';

  let steps = loadDSL(name);

  if (!steps) {
    steps = await generateDSL(`
      打开登录页，
      输入账号 admin，
      输入密码 123456，
      点击登录，
      并验证进入 dashboard 页面
    `);

    saveDSL(name, steps);
  }

  await runDSL(page, steps);
});
```

---

# 八、Playwright 配置

---

## playwright.config.ts

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
    headless: false
  },
  testDir: './tests/specs'
});
```

---

# 九、运行方式

---

## 1️⃣ 安装

```bash
npm install
npx playwright install
```

---

## 2️⃣ 设置环境变量

```bash
export OPENAI_API_KEY=xxx
```

---

## 3️⃣ 启动前端项目

```bash
npm run dev
```

---

## 4️⃣ 跑测试

```bash
npx playwright test
```

---

# 十、最佳实践（你必须做）

---

## ✅ 1. AI 只用一次

```ts
// 开发阶段
generateDSL()

// 提交后
只用 cache
```

---

## ✅ 2. 强制 testid 规范

```html
data-testid="xxx"
```

---

## ✅ 3. DSL 入库（推荐）

```text
tests/cache/*.json → git 管理
```

---

## ✅ 4. CI 不调用 AI

👉 CI 只跑：

```bash
npx playwright test
```

---

# 十一、你现在得到的能力

---

## ✅ 已具备：

* AI 自动生成测试
* 稳定执行（无自愈）
* 可维护 DSL
* 可 CI 集成

---

## ❌ 不包含：

* 自愈（你明确不要）
* Agent
* 平台

---

# 十二、一句话总结

```text
AI 负责“写测试”，Playwright 负责“稳定执行”，testid 保证“长期可维护”
```

---

# 如果你下一步想再进阶

我建议你后面再加：

👉 **AI 失败分析（不影响稳定性）**

或者：

👉 **自动生成测试覆盖报告（非常适合你这种负责人）**

---

如果你愿意，我可以下一步帮你👇

👉 把这一套**打包成一个 npm 工具（类似 ai-test-cli）**
你团队可以一键用。
