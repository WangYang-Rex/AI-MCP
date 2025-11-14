
# import pandas as pd

# === 网格交易参数设置 ===
INITIAL_CAPITAL = 10000
SYMBOL = "科创版50ETF"
PRICE_LOW = 1.30
PRICE_HIGH = 1.63
GRID_COUNT = 40
GRID_INVEST = 1000

# === 自动计算网格线 ===
grid_gap = (PRICE_HIGH - PRICE_LOW) / GRID_COUNT
grid_prices = [round(PRICE_LOW + i * grid_gap, 3) for i in range(GRID_COUNT + 1)]

# === 模拟价格波动（示例序列，可替换为实时行情） ===
price_series = ['1.467', '1.467', '1.467', '1.467', '1.467', '1.467', '1.466',
  '1.458', '1.455', '1.456', '1.455', '1.455', '1.455', '1.455',
  '1.455', '1.455', '1.456', '1.463', '1.466', '1.465', '1.462',
  '1.466', '1.466', '1.469', '1.467', '1.467', '1.466', '1.469',
  '1.469', '1.464', '1.461', '1.460', '1.465', '1.465', '1.462',
  '1.464', '1.462', '1.461', '1.464', '1.466', '1.468', '1.467',
  '1.466', '1.468', '1.470', '1.466', '1.469', '1.469', '1.469',
  '1.467', '1.472', '1.470', '1.469', '1.470', '1.472', '1.474',
  '1.474', '1.475', '1.473', '1.476', '1.473', '1.476', '1.480',
  '1.479', '1.479', '1.473', '1.475', '1.475', '1.472', '1.476',
  '1.473', '1.471', '1.472', '1.471', '1.470', '1.470', '1.472',
  '1.468', '1.467', '1.469', '1.466', '1.467', '1.468', '1.471',
  '1.473', '1.471', '1.471', '1.473', '1.470', '1.470', '1.473',
  '1.473', '1.474', '1.475', '1.479', '1.477', '1.475', '1.476',
  '1.477', '1.474']

# === 初始化账户状态 ===
cash = INITIAL_CAPITAL
position = 0
trade_log = []

print(f"开始网格交易模拟：{SYMBOL}")
print(f"区间：{PRICE_LOW} - {PRICE_HIGH}，网格数：{GRID_COUNT}，每格投资额：{GRID_INVEST}")

for price_str in price_series:
    # 将价格转换为浮点数
    price = float(price_str)
    
    # 检查是否触发买入条件
    buy_levels = [p for p in grid_prices if p >= price and p < price + grid_gap/2]
    sell_levels = [p for p in grid_prices if p <= price and p > price - grid_gap/2]

    # 模拟买入
    if buy_levels and cash >= GRID_INVEST:
        buy_price = buy_levels[0]
        qty = round(GRID_INVEST / price, 2)
        cash -= GRID_INVEST
        position += qty
        trade_log.append({"价格": price, "操作": "买入", "数量": qty, "现金余额": cash, "持仓": position})

    # 模拟卖出（如果有持仓）
    elif sell_levels and position > 0:
        sell_price = sell_levels[-1]
        qty = round(GRID_INVEST / price, 2)
        if qty > position:
            qty = position
        cash += qty * price
        position -= qty
        trade_log.append({"价格": price, "操作": "卖出", "数量": qty, "现金余额": cash, "持仓": position})

# === 计算最终收益 ===
last_price = float(price_series[-1])
total_value = cash + position * last_price
profit = total_value - INITIAL_CAPITAL
roi = profit / INITIAL_CAPITAL * 100

print("\n=== 模拟结果 ===")
print(f"最终价格: {last_price:.2f}")
print(f"持仓数量: {position:.2f}")
print(f"现金余额: {cash:.2f}")
print(f"账户总值: {total_value:.2f}")
print(f"总收益: {profit:.2f} 元 ({roi:.2f}%)")

# # === 输出交易记录 ===
# df = pd.DataFrame(trade_log)
# print("\n=== 交易记录 ===")
# print(df)

# df.to_csv("grid_trading_log.csv", index=False, encoding="utf-8-sig")
# print("\n交易日志已保存为 grid_trading_log.csv")
