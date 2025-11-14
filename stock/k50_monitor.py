import requests
import time
from datetime import datetime

# === 用户可配置参数 ===
SYMBOL = "sh588080"        # 科创50ETF
COST_PRICE = 1.415
POSITION = 0.75             # 当前仓位比例（75%）
INTERVAL = 30               # 刷新间隔（秒）

# 策略区间设定
BUY_ZONE = (1.36, 1.40)
HOLD_ZONE = (1.40, 1.48)
SELL_ZONE = (1.50, 1.53)
BREAKOUT_LINE = 1.55
STOP_LOSS = 1.38

def get_price(symbol):
    """获取实时行情（使用新浪财经接口）"""
    url = f"https://hq.sinajs.cn/list={symbol}"
    resp = requests.get(url)
    resp.encoding = 'gbk'
    data = resp.text.split(',')
    if len(data) > 3:
        price = float(data[3])
        return price
    return None

def suggest_action(price):
    """根据当前价格给出操作建议"""
    if price is None:
        return "无法获取行情"

    if price < STOP_LOSS:
        return f"⚠️ 跌破支撑 ({STOP_LOSS})，建议减仓至25%以内"
    elif BUY_ZONE[0] <= price < BUY_ZONE[1]:
        return "🟢 低位区间，可轻仓低吸"
    elif HOLD_ZONE[0] <= price <= HOLD_ZONE[1]:
        return "🟡 中枢区间，继续持有"
    elif SELL_ZONE[0] <= price <= SELL_ZONE[1]:
        return "🟠 接近压力位，建议分批止盈"
    elif price > BREAKOUT_LINE:
        return "🚀 强势突破，可顺势持有或少量加仓"
    else:
        return "⚪ 观察中，无明显操作信号"

def main():
    print("=== 科创50ETF 自动跟踪助手 ===")
    print(f"成本价：{COST_PRICE} | 当前仓位：{POSITION*100:.0f}%")
    print("按 Ctrl+C 退出\n")

    while True:
        try:
            price = get_price(SYMBOL)
            now = datetime.now().strftime("%H:%M:%S")
            advice = suggest_action(price)
            profit = (price - COST_PRICE) / COST_PRICE * 100 if price else 0

            print(f"[{now}] 当前价：{price:.3f} | 浮动收益：{profit:+.2f}% | {advice}")
            time.sleep(INTERVAL)
        except KeyboardInterrupt:
            print("\n已退出程序。")
            break
        except Exception as e:
            print("出错：", e)
            time.sleep(10)

if __name__ == "__main__":
    main()
