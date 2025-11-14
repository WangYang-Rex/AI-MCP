/**
 * 灯塔工厂概念股 – 实时行情（Node.js）
 * 运行：node lighthouse.js
 * 依赖：原生 http / https / fs / zlib，零第三方包
 * 
 * 优化功能：
 * - ✅ 添加请求头（User-Agent、Referer）
 * - ✅ 请求重试机制
 * - ✅ 数据缓存
 * - ✅ 请求间隔控制
 * - ✅ 完善错误处理
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

/* ========== 配置区 ========== */
const CONFIG = {
  // 请求配置
  REQUEST_TIMEOUT: 10000,        // 请求超时时间(ms)
  MAX_RETRIES: 3,                // 最大重试次数
  RETRY_DELAY: 1000,             // 重试间隔(ms)
  
  // 缓存配置
  CACHE_ENABLED: true,           // 是否启用缓存
  CACHE_TTL: 60 * 1000,          // 缓存有效期(ms) - 1分钟
  CACHE_FILE: 'lighthouse.cache.json',
  
  // 输出配置
  OUTPUT_CSV: 'lighthouse.csv',
  OUTPUT_JSON: 'lighthouse.json',
};

/* 1. 手工维护的概念股代码（带市场前缀） */
const stocks = [
  { code: '588080', market: 1 },  // 588080 - 上交所
  { code: '600588', market: 1 },  // 用友网络 - 上交所
  { code: '688777', market: 1 },  // 中控技术 - 科创板
  { code: '300378', market: 0 },  // 鼎捷数智 - 深交所
  { code: '600845', market: 1 },  // 宝信软件 - 上交所
  { code: '300124', market: 0 },  // 汇川技术 - 深交所
  { code: '002747', market: 0 },  // 埃斯顿 - 深交所
  { code: '688353', market: 1 },  // 华盛锂电 - 科创板
  { code: '300496', market: 0 },  // 中科创达 - 深交所
  { code: '688208', market: 1 },  // 道通科技 - 科创板
  { code: '002230', market: 0 }   // 科大讯飞 - 深交所
];

/* 2. 构建股票代码列表（格式：市场.代码） */
const secids = stocks.map(s => `${s.market}.${s.code}`).join(',');

/* 3. 东方财富批量查询接口 */
const URL = `http://push2.eastmoney.com/api/qt/ulist.np/get?` +
  `fltt=2&invt=2&secids=${secids}&` +
  `fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18&` +
  `ut=bd1d9ddb04089700cf9c27f6f7426281`;

/* ========== 工具函数 ========== */

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 读取缓存
 */
function readCache() {
  if (!CONFIG.CACHE_ENABLED) return null;
  
  try {
    if (!fs.existsSync(CONFIG.CACHE_FILE)) return null;
    
    const cache = JSON.parse(fs.readFileSync(CONFIG.CACHE_FILE, 'utf-8'));
    const now = Date.now();
    
    // 检查缓存是否过期
    if (cache.timestamp && (now - cache.timestamp) < CONFIG.CACHE_TTL) {
      return cache.data;
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️  读取缓存失败:', error.message);
    return null;
  }
}

/**
 * 写入缓存
 */
function writeCache(data) {
  if (!CONFIG.CACHE_ENABLED) return;
  
  try {
    const cache = {
      timestamp: Date.now(),
      data: data
    };
    fs.writeFileSync(CONFIG.CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn('⚠️  写入缓存失败:', error.message);
  }
}

/**
 * HTTP请求函数（支持 gzip 解压和重试）
 */
function fetch(url, retries = CONFIG.MAX_RETRIES) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    // 添加请求头（模拟浏览器）
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'http://quote.eastmoney.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Connection': 'keep-alive'
      },
      timeout: CONFIG.REQUEST_TIMEOUT
    };
    
    const req = protocol.get(url, options, (res) => {
      // 检查响应状态
      if (res.statusCode !== 200) {
        reject(new Error(`请求失败，状态码: ${res.statusCode}`));
        return;
      }

      let buf = [];
      res.on('data', chunk => buf.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(buf);
        
        // 根据 content-encoding 解压
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded.toString());
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded.toString());
          });
        } else {
          resolve(buffer.toString());
        }
      });
    });
    
    // 错误处理和重试
    req.on('error', async (error) => {
      if (retries > 0) {
        console.warn(`⚠️  请求失败，${CONFIG.RETRY_DELAY}ms 后重试 (剩余 ${retries} 次): ${error.message}`);
        await delay(CONFIG.RETRY_DELAY);
        try {
          const result = await fetch(url, retries - 1);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(error);
      }
    });
    
    // 超时处理
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

/**
 * 数据验证函数
 */
function validateData(json) {
  if (!json || typeof json !== 'object') {
    throw new Error('接口返回数据格式错误');
  }
  
  if (!json.data || !json.data.diff) {
    throw new Error('接口返回数据结构异常');
  }
  
  if (!Array.isArray(json.data.diff) || json.data.diff.length === 0) {
    throw new Error('接口返回数据为空');
  }
  
  return true;
}

/**
 * 数据处理函数
 */
function processData(rawData) {
  return rawData
    .filter(item => item.f2 !== null && item.f2 !== '-')  // 过滤停牌或无效数据
    .map(item => ({
      代码: String(item.f12).padStart(6, '0'),
      名称: item.f14 || '未知',
      最新价: item.f2 || 0,
      涨跌幅: item.f3 || 0,
      涨跌额: item.f4 || 0,
      成交量: item.f5 || 0,
      成交额: item.f6 || 0,
      振幅: item.f7 || 0,
      换手率: item.f8 || 0,
      市盈率: item.f9 || 0,
      最高: item.f15 || 0,
      最低: item.f16 || 0,
      今开: item.f17 || 0,
      昨收: item.f18 || 0,
      市场: item.f13 === 1 ? '上交所' : '深交所',
      市场代码: item.f13
    }))
    .sort((a, b) => b.涨跌幅 - a.涨跌幅);
}

/**
 * 保存为CSV
 */
function saveToCSV(rows, filename) {
  const csv = ['代码,名称,市场,最新价,涨跌幅(%),涨跌额,成交量(手),成交额(万),换手率(%),振幅(%),市盈率,最高,最低,今开,昨收']
    .concat(rows.map(r => 
      `${r.代码},${r.名称},${r.市场},${r.最新价},${r.涨跌幅},${r.涨跌额},${r.成交量},${r.成交额},${r.换手率},${r.振幅},${r.市盈率},${r.最高},${r.最低},${r.今开},${r.昨收}`
    ))
    .join('\n');
  fs.writeFileSync(filename, csv, 'utf-8');
}

/**
 * 保存为JSON
 */
function saveToJSON(rows, filename) {
  const output = {
    timestamp: new Date().toISOString(),
    count: rows.length,
    data: rows
  };
  fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf-8');
}

/**
 * 显示统计信息
 */
function showStatistics(rows) {
  if (rows.length === 0) return;
  
  const rising = rows.filter(r => r.涨跌幅 > 0).length;
  const falling = rows.filter(r => r.涨跌幅 < 0).length;
  const flat = rows.filter(r => r.涨跌幅 === 0).length;
  
  const avgChange = (rows.reduce((sum, r) => sum + r.涨跌幅, 0) / rows.length).toFixed(2);
  const totalVolume = rows.reduce((sum, r) => sum + r.成交量, 0);
  const totalAmount = rows.reduce((sum, r) => sum + r.成交额, 0);
  
  console.log('\n📈 市场统计:');
  console.log(`  上涨: ${rising} 只 | 下跌: ${falling} 只 | 平盘: ${flat} 只`);
  console.log(`  平均涨跌幅: ${avgChange}%`);
  console.log(`  总成交量: ${(totalVolume / 10000).toFixed(2)} 万手`);
  console.log(`  总成交额: ${(totalAmount / 100000000).toFixed(2)} 亿元`);
}

/* ========== 主逻辑 ========== */
(async () => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 开始获取灯塔工厂概念股数据...\n');
    
    // 1. 尝试读取缓存
    let cachedData = readCache();
    let rows;
    
    if (cachedData) {
      console.log('💾 使用缓存数据（缓存有效期内）');
      rows = cachedData.rows;
    } else {
      // 2. 发起网络请求
      console.log('🌐 从东方财富API获取数据...');
      const txt = await fetch(URL);
      const json = JSON.parse(txt);
      
      // 3. 数据验证
      validateData(json);
      
      // 4. 数据处理
      rows = processData(json.data.diff);
      
      // 5. 写入缓存
      writeCache({ rows, timestamp: Date.now() });
      console.log('✅ 数据获取成功\n');
    }
    
    // 6. 显示数据
    console.log('📊 灯塔工厂概念股 – 实时行情（东方财富）');
    console.log(`📅 查询时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log(`📈 成功获取 ${rows.length} 只股票数据\n`);
    console.table(rows.map(r => ({
      代码: r.代码,
      名称: r.名称,
      市场: r.市场,
      最新价: r.最新价,
      涨跌幅: `${r.涨跌幅}%`,
      涨跌额: r.涨跌额,
      换手率: `${r.换手率}%`,
      振幅: `${r.振幅}%`
    })));
    
    // 7. 显示统计信息
    showStatistics(rows);
    
    // 8. 保存文件
    console.log('\n💾 保存数据...');
    saveToCSV(rows, CONFIG.OUTPUT_CSV);
    console.log(`  ✅ CSV已保存: ${CONFIG.OUTPUT_CSV}`);
    
    saveToJSON(rows, CONFIG.OUTPUT_JSON);
    console.log(`  ✅ JSON已保存: ${CONFIG.OUTPUT_JSON}`);
    
    // 9. 性能统计
    const duration = Date.now() - startTime;
    console.log(`\n⏱️  总耗时: ${duration}ms\n`);
    
  } catch (error) {
    console.error('\n❌ 执行失败');
    console.error(`错误类型: ${error.name}`);
    console.error(`错误信息: ${error.message}`);
    
    if (process.env.DEBUG) {
      console.error('\n详细错误栈:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
})();
