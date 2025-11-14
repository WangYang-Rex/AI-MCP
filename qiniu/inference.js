/**
 * 七牛云 AI 实时推理请求 - Node.js 实现
 * 运行：node inference.js
 * 依赖：原生 https，零第三方包
 * 
 * 功能：
 * - ✅ 实时流式推理请求
 * - ✅ 完整的错误处理
 * - ✅ 请求重试机制
 * - ✅ 支持多种模型和参数配置
 */

const https = require('https');
const { URL } = require('url');

/* ========== 配置区 ========== */
const CONFIG = {
  // API 配置
  API_KEY: 'sk-34bbdcdcc744853e58f35cb8d866c107631752558182cec899d934d259632ae4',
  // 可能的 API 基础地址（按优先级排序）
  API_BASE_URLS: [
    'https://ai.qiniu.com',           // 选项1: AI 服务独立域名
    'https://api.qiniu.com',          // 选项2: 标准 API 域名
    'https://qiniu.com',               // 选项3: 主域名
  ],
  // 可能的 API 端点路径（按优先级排序）
  API_ENDPOINTS: [
    '/v1/chat/completions',            // 选项1: OpenAI 兼容格式
    '/v1/ai/inference',                // 选项2: AI 推理端点
    '/aitokenapi/12882/ai-inference-api', // 选项3: 文档路径格式
    '/v1/completions',                 // 选项4: 简化格式
  ],
  // 当前使用的配置（会自动尝试）
  API_BASE_URL: 'https://api.qiniu.com', // 默认使用标准 API 域名
  API_ENDPOINT: '/v1/chat/completions',  // 默认端点
  
  // 请求配置
  REQUEST_TIMEOUT: 60000,        // 请求超时时间(ms) - 60秒
  MAX_RETRIES: 3,                // 最大重试次数
  RETRY_DELAY: 1000,             // 重试间隔(ms)
  
  // 模型配置（根据实际可用模型调整）
  DEFAULT_MODEL: 'qwen-plus',    // 默认模型
  DEFAULT_TEMPERATURE: 0.7,      // 温度参数
  DEFAULT_MAX_TOKENS: 2000,      // 最大 token 数
};

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 尝试不同的端点组合
 * @param {Object} options - 请求选项
 * @param {number} retries - 重试次数（用于避免递归）
 * @returns {Promise} 请求结果
 */
async function tryEndpoints(options = {}, retries = 0) {
  const baseUrls = CONFIG.API_BASE_URLS || [CONFIG.API_BASE_URL];
  const endpoints = CONFIG.API_ENDPOINTS || [CONFIG.API_ENDPOINT];
  
  const errors = [];
  const originalBaseUrl = CONFIG.API_BASE_URL;
  const originalEndpoint = CONFIG.API_ENDPOINT;
  
  try {
    for (const baseUrl of baseUrls) {
      for (const endpoint of endpoints) {
        // 跳过当前正在使用的端点（避免重复尝试）
        if (baseUrl === originalBaseUrl && endpoint === originalEndpoint && retries === 0) {
          continue;
        }
        
        // 临时修改配置
        CONFIG.API_BASE_URL = baseUrl;
        CONFIG.API_ENDPOINT = endpoint;
        
        try {
          console.log(`🔍 尝试端点: ${baseUrl}${endpoint}`);
          // 使用 skipEndpointTry = true 避免再次触发端点尝试
          const result = await inferenceInternal(options, CONFIG.MAX_RETRIES, true);
          // 成功则更新配置并返回
          console.log(`✅ 成功使用端点: ${baseUrl}${endpoint}\n`);
          // 更新配置为成功的端点
          CONFIG.API_BASE_URL = baseUrl;
          CONFIG.API_ENDPOINT = endpoint;
          return result;
        } catch (error) {
          errors.push({
            baseUrl,
            endpoint,
            error: error.message,
            statusCode: error.statusCode
          });
          
          // 如果是 404，继续尝试下一个
          if (error.statusCode === 404) {
            console.log(`❌ ${baseUrl}${endpoint} - 404 Not Found，尝试下一个...`);
            continue;
          }
          
          // 如果是其他错误（如认证错误），可能端点是对的但参数有问题
          if (error.statusCode === 401 || error.statusCode === 403) {
            console.log(`⚠️  ${baseUrl}${endpoint} - ${error.statusCode}，端点可能正确但认证失败`);
            throw error; // 认证错误直接抛出
          }
        }
      }
    }
    
    // 所有端点都失败，抛出详细错误
    const errorMsg = `所有端点尝试失败:\n${errors.map(e => `  - ${e.baseUrl}${e.endpoint}: ${e.error} (${e.statusCode || 'N/A'})`).join('\n')}`;
    throw new Error(errorMsg);
  } finally {
    // 恢复原始配置
    CONFIG.API_BASE_URL = originalBaseUrl;
    CONFIG.API_ENDPOINT = originalEndpoint;
  }
}

/**
 * 发送实时推理请求（流式响应）
 * @param {Object} options - 请求选项
 * @param {string} options.model - 模型名称
 * @param {Array} options.messages - 消息数组
 * @param {number} options.temperature - 温度参数
 * @param {number} options.max_tokens - 最大 token 数
 * @param {boolean} options.stream - 是否流式返回
 * @param {Function} onChunk - 接收数据块的回调函数
 * @param {number} retries - 重试次数
 */
function streamInference(options = {}, onChunk = null, retries = CONFIG.MAX_RETRIES) {
  return new Promise((resolve, reject) => {
    const {
      model = CONFIG.DEFAULT_MODEL,
      messages = [],
      temperature = CONFIG.DEFAULT_TEMPERATURE,
      max_tokens = CONFIG.DEFAULT_MAX_TOKENS,
      stream = true
    } = options;

    // 验证必需参数
    if (!messages || messages.length === 0) {
      reject(new Error('消息数组不能为空'));
      return;
    }

    // 构建请求体
    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      stream
    };

    // 构建完整 URL
    const apiUrl = `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINT}`;
    const url = new URL(apiUrl);

    // 请求选项
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      timeout: CONFIG.REQUEST_TIMEOUT
    };

    // 创建请求
    const req = https.request(requestOptions, (res) => {
      // 检查响应状态
      if (res.statusCode !== 200) {
        let errorBody = '';
        res.on('data', chunk => { errorBody += chunk.toString(); });
        res.on('end', () => {
          const error = new Error(`请求失败，状态码: ${res.statusCode}, 响应: ${errorBody.substring(0, 200)}`);
          error.statusCode = res.statusCode;
          error.body = errorBody;
          error.url = `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINT}`;
          
          // 如果是 404 且是第一次尝试，尝试其他端点（流式请求暂不支持端点尝试，直接抛出错误）
          if (res.statusCode === 404) {
            console.warn(`⚠️  端点不存在 (404): ${error.url}`);
            reject(error);
            return;
          }
          
          // 如果是服务器错误且还有重试次数，则重试
          if (res.statusCode >= 500 && retries > 0) {
            console.warn(`⚠️  服务器错误，${CONFIG.RETRY_DELAY}ms 后重试 (剩余 ${retries} 次)`);
            delay(CONFIG.RETRY_DELAY).then(() => {
              streamInference(options, onChunk, retries - 1)
                .then(resolve)
                .catch(reject);
            });
            return;
          }
          reject(error);
        });
        return;
      }

      // 处理流式响应
      let buffer = '';
      let fullResponse = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // 处理 Server-Sent Events (SSE) 格式
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // SSE 格式: data: {...}
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6); // 移除 'data: ' 前缀
            
            // 检查是否是结束标记
            if (dataStr.trim() === '[DONE]') {
              resolve(fullResponse);
              return;
            }

            try {
              const data = JSON.parse(dataStr);
              
              // 提取内容
              if (data.choices && data.choices[0]) {
                const delta = data.choices[0].delta;
                if (delta && delta.content) {
                  const content = delta.content;
                  fullResponse += content;
                  
                  // 调用回调函数
                  if (onChunk && typeof onChunk === 'function') {
                    onChunk(content, data);
                  } else {
                    // 默认输出到控制台
                    process.stdout.write(content);
                  }
                }
              }
            } catch (e) {
              // 忽略 JSON 解析错误（可能是部分数据）
              console.warn('⚠️  解析数据块失败:', e.message);
            }
          }
        }
      });

      res.on('end', () => {
        if (buffer.trim()) {
          // 处理最后一个数据块
          if (buffer.startsWith('data: ')) {
            const dataStr = buffer.slice(6);
            if (dataStr.trim() !== '[DONE]') {
              try {
                const data = JSON.parse(dataStr);
                if (data.choices && data.choices[0]) {
                  const delta = data.choices[0].delta;
                  if (delta && delta.content) {
                    fullResponse += delta.content;
                    if (onChunk && typeof onChunk === 'function') {
                      onChunk(delta.content, data);
                    } else {
                      process.stdout.write(delta.content);
                    }
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
        resolve(fullResponse);
      });

      res.on('error', (error) => {
        reject(error);
      });
    });

    // 错误处理
    req.on('error', (error) => {
      if (retries > 0) {
        console.warn(`⚠️  请求失败，${CONFIG.RETRY_DELAY}ms 后重试 (剩余 ${retries} 次): ${error.message}`);
        delay(CONFIG.RETRY_DELAY).then(() => {
          streamInference(options, onChunk, retries - 1)
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject(error);
      }
    });

    // 超时处理
    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        console.warn(`⚠️  请求超时，${CONFIG.RETRY_DELAY}ms 后重试 (剩余 ${retries} 次)`);
        delay(CONFIG.RETRY_DELAY).then(() => {
          streamInference(options, onChunk, retries - 1)
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject(new Error('请求超时'));
      }
    });

    // 发送请求
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

/**
 * 发送非流式推理请求（内部实现）
 * @param {Object} options - 请求选项
 * @param {number} retries - 重试次数
 * @param {boolean} skipEndpointTry - 是否跳过端点尝试（避免递归）
 */
function inferenceInternal(options = {}, retries = CONFIG.MAX_RETRIES, skipEndpointTry = false) {
  return new Promise((resolve, reject) => {
    const {
      model = CONFIG.DEFAULT_MODEL,
      messages = [],
      temperature = CONFIG.DEFAULT_TEMPERATURE,
      max_tokens = CONFIG.DEFAULT_MAX_TOKENS,
      stream = false
    } = options;

    // 验证必需参数
    if (!messages || messages.length === 0) {
      reject(new Error('消息数组不能为空'));
      return;
    }

    // 构建请求体
    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      stream
    };

    // 构建完整 URL
    const apiUrl = `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINT}`;
    const url = new URL(apiUrl);

    // 请求选项
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'Accept': 'application/json',
      },
      timeout: CONFIG.REQUEST_TIMEOUT
    };

    // 创建请求
    const req = https.request(requestOptions, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk.toString();
      });

      res.on('end', () => {
        // 检查响应状态
        if (res.statusCode !== 200) {
          const error = new Error(`请求失败，状态码: ${res.statusCode}, 响应: ${responseBody.substring(0, 200)}`);
          error.statusCode = res.statusCode;
          error.body = responseBody;
          error.url = `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINT}`;
          
          // 如果是 404 且是第一次尝试且未跳过端点尝试，尝试其他端点
          if (res.statusCode === 404 && retries === CONFIG.MAX_RETRIES && !skipEndpointTry) {
            console.warn(`⚠️  端点不存在 (404)，将尝试其他端点组合...`);
            tryEndpoints(options, retries)
              .then(resolve)
              .catch(reject);
            return;
          }
          
          // 如果是服务器错误且还有重试次数，则重试
          if (res.statusCode >= 500 && retries > 0) {
            console.warn(`⚠️  服务器错误，${CONFIG.RETRY_DELAY}ms 后重试 (剩余 ${retries} 次)`);
            delay(CONFIG.RETRY_DELAY).then(() => {
              inferenceInternal(options, retries - 1, skipEndpointTry)
                .then(resolve)
                .catch(reject);
            });
            return;
          }
          reject(error);
          return;
        }

        try {
          const data = JSON.parse(responseBody);
          resolve(data);
        } catch (e) {
          reject(new Error(`解析响应失败: ${e.message}, 响应: ${responseBody}`));
        }
      });

      res.on('error', (error) => {
        reject(error);
      });
    });

    // 错误处理
    req.on('error', (error) => {
      // 网络错误（如域名不存在）不重试，直接尝试其他端点或抛出错误
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        if (retries === CONFIG.MAX_RETRIES && !skipEndpointTry) {
          console.warn(`⚠️  网络错误 (${error.code})，将尝试其他端点组合...`);
          tryEndpoints(options, retries)
            .then(resolve)
            .catch(reject);
          return;
        }
        reject(error);
        return;
      }
      
      if (retries > 0) {
        console.warn(`⚠️  请求失败，${CONFIG.RETRY_DELAY}ms 后重试 (剩余 ${retries} 次): ${error.message}`);
        delay(CONFIG.RETRY_DELAY).then(() => {
          inferenceInternal(options, retries - 1, skipEndpointTry)
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject(error);
      }
    });

    // 超时处理
    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        console.warn(`⚠️  请求超时，${CONFIG.RETRY_DELAY}ms 后重试 (剩余 ${retries} 次)`);
        delay(CONFIG.RETRY_DELAY).then(() => {
          inferenceInternal(options, retries - 1, skipEndpointTry)
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject(new Error('请求超时'));
      }
    });

    // 发送请求
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

/**
 * 发送非流式推理请求（公开接口）
 * @param {Object} options - 请求选项
 * @param {number} retries - 重试次数
 */
function inference(options = {}, retries = CONFIG.MAX_RETRIES) {
  return inferenceInternal(options, retries, false);
}

/* ========== 主逻辑 ========== */
(async () => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 七牛云 AI 实时推理请求\n');
    console.log('📝 配置信息:');
    console.log(`  - API 端点: ${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINT}`);
    console.log(`  - 默认模型: ${CONFIG.DEFAULT_MODEL}`);
    console.log(`  - API Key: ${CONFIG.API_KEY.substring(0, 20)}...\n`);

    // 示例 1: 流式推理请求
    console.log('📡 示例 1: 流式推理请求');
    console.log('='.repeat(50));
    
    const messages = [
      {
        role: 'user',
        content: '请用一句话介绍人工智能'
      }
    ];

    console.log(`\n💬 用户消息: ${messages[0].content}\n`);
    console.log('🤖 AI 回复 (流式):\n');

    const streamResponse = await streamInference(
      {
        model: CONFIG.DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true
      },
      (chunk, data) => {
        // 自定义回调：实时输出内容
        process.stdout.write(chunk);
      }
    );

    console.log('\n\n✅ 流式请求完成');
    console.log(`📊 完整响应长度: ${streamResponse.length} 字符\n`);

    // 示例 2: 非流式推理请求
    console.log('\n📡 示例 2: 非流式推理请求');
    console.log('='.repeat(50));
    
    const nonStreamMessages = [
      {
        role: 'user',
        content: '什么是机器学习？'
      }
    ];

    console.log(`\n💬 用户消息: ${nonStreamMessages[0].content}\n`);

    const nonStreamResponse = await inference({
      model: CONFIG.DEFAULT_MODEL,
      messages: nonStreamMessages,
      temperature: 0.7,
      max_tokens: 500,
      stream: false
    });

    console.log('🤖 AI 回复 (完整):');
    if (nonStreamResponse.choices && nonStreamResponse.choices[0]) {
      const content = nonStreamResponse.choices[0].message?.content || '';
      console.log(content);
      console.log('\n✅ 非流式请求完成');
      
      // 显示使用统计
      if (nonStreamResponse.usage) {
        console.log('\n📊 Token 使用统计:');
        console.log(`  - Prompt Tokens: ${nonStreamResponse.usage.prompt_tokens || 0}`);
        console.log(`  - Completion Tokens: ${nonStreamResponse.usage.completion_tokens || 0}`);
        console.log(`  - Total Tokens: ${nonStreamResponse.usage.total_tokens || 0}`);
      }
    }

    // 性能统计
    const duration = Date.now() - startTime;
    console.log(`\n⏱️  总耗时: ${duration}ms\n`);
    
  } catch (error) {
    console.error('\n❌ 执行失败');
    console.error(`错误类型: ${error.constructor.name}`);
    console.error(`错误消息: ${error.message}`);
    
    if (error.statusCode) {
      console.error(`HTTP 状态码: ${error.statusCode}`);
    }
    
    if (error.body) {
      console.error(`响应内容: ${error.body}`);
    }
    
    if (process.env.DEBUG === '1') {
      console.error('\n详细错误栈:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
})();

// 导出函数供其他模块使用
module.exports = {
  streamInference,
  inference,
  CONFIG
};

