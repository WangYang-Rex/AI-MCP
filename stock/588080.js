/**
 * 获取科创50ETF(588080)今日价格动态
 * 基于东方财富非官方API
 * 仅供学习研究使用
 */

const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  STOCK_CODE: '588080',
  MARKET_CODE: '1', // 1=上交所
  UT: 'bd1d9ddb04089700cf9c27f6f7426281',
  REQUEST_DELAY: 1000, // 请求间隔(毫秒)
};

/**
 * 发起HTTP GET请求
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://quote.eastmoney.com/',
        'Accept': 'application/json',
      }
    };

    protocol.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('JSON解析失败: ' + error.message));
        }
      });
    }).on('error', (error) => {
      reject(new Error('请求失败: ' + error.message));
    });
  });
}

/**
 * 格式化时间戳
 * 支持两种格式：
 * - "2025-10-16 09:15" -> "09:15:00"
 * - "2025-10-16 09:15:30" -> "09:15:30"
 */
function formatTime(timestamp) {
  const str = String(timestamp);
  
  // 提取时间部分 (空格后的内容)
  const timeStr = str.includes(' ') ? str.split(' ')[1] : str;
  
  // 解析时分秒
  const timeParts = timeStr.split(':');
  const hour = timeParts[0] || '00';
  const minute = timeParts[1] || '00';
  const second = timeParts[2] || '00';
  
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
}

/**
 * 获取股票基本信息
 */
async function getStockInfo() {
  const secid = `${CONFIG.MARKET_CODE}.${CONFIG.STOCK_CODE}`;
  const fields = 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21';
  const url = `http://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=${fields}&ut=${CONFIG.UT}`;
  
  try {
    const response = await httpGet(url);
    
    if (response.rc === 0 && response.data) {
      const data = response.data;
      const price = data.f2 ? (data.f2 / 1000).toFixed(3) : '-'; // 最新价
      const preClose = data.f18 ? (data.f18 / 1000).toFixed(3) : '-'; // 昨收价
      const change = data.f3 ? (data.f3 / 100).toFixed(2) : '-'; // 涨跌幅%
      const changeAmount = data.f4 ? (data.f4 / 1000).toFixed(3) : '-'; // 涨跌额
      
      return {
        code: data.f12 || CONFIG.STOCK_CODE,
        name: data.f14 || '科创50ETF',
        price,
        open: data.f17 ? (data.f17 / 1000).toFixed(3) : '-',  // 今开价
        high: data.f15 ? (data.f15 / 1000).toFixed(3) : '-',  // 最高价
        low: data.f16 ? (data.f16 / 1000).toFixed(3) : '-',   // 最低价
        preClose,
        change,
        changeAmount,
        volume: data.f5 ? (data.f5 / 100).toFixed(0) : '-',    // 成交量(手)
        amount: data.f6 ? (data.f6 / 10000).toFixed(2) : '-',  // 成交额(万元)
        turnover: data.f8 ? (data.f8 / 100).toFixed(2) : '-', // 换手率%
        amplitude: data.f7 ? (data.f7 / 100).toFixed(2) : '-', // 振幅%
      };
    } else {
      throw new Error('获取股票信息失败');
    }
  } catch (error) {
    console.error('❌ 获取股票信息出错:', error.message);
    return null;
  }
}

/**
 * 获取实时分时数据
 */
async function getTrendsData() {
  const secid = `${CONFIG.MARKET_CODE}.${CONFIG.STOCK_CODE}`;
  const fields1 = 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13';
  const fields2 = 'f51,f52,f53,f54,f55,f56,f57,f58';
  const url = `http://push2.eastmoney.com/api/qt/stock/trends2/get?secid=${secid}&fields1=${fields1}&fields2=${fields2}&ut=${CONFIG.UT}`;
  
  try {
    const response = await httpGet(url);
    
    if (response.rc === 0 && response.data) {
      const data = response.data;
      const preClose = data.prePrice; // 昨收价
      const trends = data.trends || [];
      
      return {
        preClose,
        trends: trends.map(item => {
          const parts = item.split(',');
          const time = formatTime(parts[0]);
          const price = parseFloat(parts[2]);
          const volume = parseInt(parts[5]) / 100; // 转换为手
          const amount = parseFloat(parts[6]);
          const avgPrice = parseFloat(parts[7]);
          
          return {
            time,
            price: price.toFixed(3),
            volume: volume.toFixed(0),
            amount: (amount / 10000).toFixed(2), // 转换为万元
            avgPrice: avgPrice.toFixed(3),
            change: ((price - preClose) / preClose * 100).toFixed(2),
          };
        })
      };
    } else {
      throw new Error('获取分时数据失败');
    }
  } catch (error) {
    console.error('❌ 获取分时数据出错:', error.message);
    return null;
  }
}

/**
 * 打印股票信息
 */
function printStockInfo(info) {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║         📊 股票基本信息                   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  代码: ${info.code} | 名称: ${info.name}`);
  console.log(`  最新价: ${info.price} 元`);
  const changeNum = parseFloat(info.change);
  const emoji = !isNaN(changeNum) ? (changeNum >= 0 ? '📈' : '📉') : '➖';
  console.log(`  涨跌幅: ${emoji} ${info.change}%`);
  console.log(`  涨跌额: ${info.changeAmount} 元`);
  console.log(`  今开: ${info.open} | 昨收: ${info.preClose}`);
  console.log(`  最高: ${info.high} | 最低: ${info.low}`);
  console.log(`  振幅: ${info.amplitude}%`);
  console.log(`  成交量: ${info.volume} 手`);
  console.log(`  成交额: ${info.amount} 万元`);
  console.log(`  换手率: ${info.turnover}%`);
  console.log('══════════════════════════════════════════\n');
}

/**
 * 打印分时数据
 */
function printTrendsData(trendsData, limit = 10) {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║         📈 今日分时价格动态              ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  昨收价: ${trendsData.preClose.toFixed(3)} 元\n`);
  
  const trends = trendsData.trends;
  const total = trends.length;
  
  if (total === 0) {
    console.log('  暂无分时数据\n');
    return;
  }
  
  // 显示开盘和最新的几条数据
  console.log('  时间      |  价格   | 涨跌幅  |  均价   | 成交量(手) | 成交额(万)');
  console.log('  ----------|---------|---------|---------|-----------|----------');
  
  // 显示开盘数据
  if (total > 0) {
    const first = trends[0];
    console.log(`  ${first.time} | ${first.price} | ${first.change >= 0 ? '+' : ''}${first.change}% | ${first.avgPrice} | ${first.volume.padStart(9)} | ${first.amount.padStart(10)}`);
  }
  
  // 如果数据点多，显示省略号
  if (total > limit + 1) {
    console.log('  ...       | ...     | ...     | ...     | ...       | ...');
  }
  
  // 显示最新的几条数据
  const recentTrends = trends.slice(-Math.min(limit, total - 1));
  recentTrends.forEach(trend => {
    console.log(`  ${trend.time} | ${trend.price} | ${trend.change >= 0 ? '+' : ''}${trend.change}% | ${trend.avgPrice} | ${trend.volume.padStart(9)} | ${trend.amount.padStart(10)}`);
  });
  
  console.log(`\n  ℹ️  共 ${total} 个数据点 (显示最新 ${Math.min(limit, total)} 条)`);
  console.log('══════════════════════════════════════════\n');
  
  // 输出trends中的所有价格，写入数组
  const prices = trends.map(item => item.price);
  console.log(prices);
}

/**
 * 主函数
 */
async function main() {
  console.log('\n🚀 开始获取科创50ETF(588080)实时数据...\n');
  
  // 获取股票基本信息
  console.log('⏳ 正在获取股票基本信息...');
  const stockInfo = await getStockInfo();
  
  if (stockInfo) {
    printStockInfo(stockInfo);
  } else {
    console.log('⚠️  无法获取股票基本信息，继续获取分时数据...\n');
  }
  
  // 延迟请求
  await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
  
  // 获取分时数据
  console.log('⏳ 正在获取今日分时数据...');
  const trendsData = await getTrendsData();
  
  if (trendsData) {
    printTrendsData(trendsData, 10);
  } else {
    console.log('❌ 无法获取分时数据\n');
  }
  
  console.log('✅ 数据获取完成！');
  console.log('\n⚠️  注意: 此接口为非官方接口，仅供学习研究使用');
}

// 运行程序
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 程序执行出错:', error.message);
    process.exit(1);
  });
}

module.exports = {
  getStockInfo,
  getTrendsData,
};

