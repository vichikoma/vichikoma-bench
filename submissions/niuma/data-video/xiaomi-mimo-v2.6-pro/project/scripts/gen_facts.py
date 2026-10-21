# -*- coding: utf-8 -*-
"""生成 out/facts.json：画面里每一个数字的精确写法 / 来源 / 出现时间。
全部数值从 data/sales_2025-01_2026-09.csv 清洗后计算（去重 10 行完全重复导出）。
"""
import csv, io, json, os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, '..', '..', 'data', 'sales_2025-01_2026-09.csv')
OUT_PATH = os.path.join(HERE, '..', '..', 'out', 'facts.json')

# ---------- 清洗 ----------
seen, rows = set(), []
with io.open(CSV_PATH, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        key = (r['月份'], r['大区'], r['品类'], r['渠道'], r['销售额(元)'], r['订单数'], r['毛利(元)'])
        if key in seen:
            continue
        seen.add(key)
        rows.append(r)

Q3_26 = ('2026-07', '2026-08', '2026-09')
Q3_25 = ('2025-07', '2025-08', '2025-09')


def sel(months, **kw):
    out = []
    for r in rows:
        if r['月份'] in months and all(r[k] == v for k, v in kw.items()):
            out.append(r)
    return out


def sales(rs):
    return sum(int(r['销售额(元)']) for r in rs)


def profit(rs):
    return sum(int(r['毛利(元)']) for r in rs)


s26, s25 = sales(sel(Q3_26)), sales(sel(Q3_25))
p26, p25 = profit(sel(Q3_26)), profit(sel(Q3_25))
m26 = [sales(sel((m,))) for m in Q3_26]
m25 = [sales(sel((m,))) for m in Q3_25]
deliv, store = sales(sel(Q3_26, 渠道='外卖')), sales(sel(Q3_26, 渠道='门店'))
deliv25, store25 = sales(sel(Q3_25, 渠道='外卖')), sales(sel(Q3_25, 渠道='门店'))
deliv_p, store_p = profit(sel(Q3_26, 渠道='外卖')), profit(sel(Q3_26, 渠道='门店'))
lf, lf25 = sales(sel(Q3_26, 品类='轻食')), sales(sel(Q3_25, 品类='轻食'))

# ---------- 画面上的数字（value/source/appears） ----------
def wan(x):
    return round(x / 1e4, 2)


def pct1(x):
    return round(x * 100, 1)


numbers = [
    # S1 封面 0–4s
    {'value': '2026',
     'source': '原始数据 月份字段 2026-07 至 2026-09（任务口径：2026 年第三季度）',
     'appears': 'S1 封面 · 1.0s–4.0s（副标题贴纸「2026 第三季度 · 经营快报」）'},
    # S2 总量 4–10s
    {'value': '%.2f' % wan(s26),
     'source': '2026Q3 销售额合计 %d 元 ÷ 10000 = %.2f 万元（清洗：剔除 10 行完全重复导出）' % (s26, wan(s26)),
     'appears': 'S2 · 4.0s–10.0s（主数字，5.0s 滚动到位）'},
    {'value': '+%.1f%%' % pct1(s26 / s25 - 1),
     'source': '%d ÷ %d − 1 = %.2f%%' % (s26, s25, (s26 / s25 - 1) * 100),
     'appears': 'S2 · 6.0s–10.0s（同比贴纸）'},
    {'value': '%.2f' % wan(m26[0]),
     'source': '2026-07 销售额 %d 元 ÷ 10000' % m26[0],
     'appears': 'S2 · 5.5s–10.0s（柱状图 7 月数值标签）'},
    {'value': '%.2f' % wan(m26[1]),
     'source': '2026-08 销售额 %d 元 ÷ 10000' % m26[1],
     'appears': 'S2 · 6.0s–10.0s（柱状图 8 月数值标签）'},
    {'value': '%.2f' % wan(m26[2]),
     'source': '2026-09 销售额 %d 元 ÷ 10000' % m26[2],
     'appears': 'S2 · 6.5s–10.0s（柱状图 9 月数值标签）'},
    {'value': '7',
     'source': '月份标签（2026-07）',
     'appears': 'S2 · 4.5s–10.0s（月度轴「7月」）'},
    {'value': '8',
     'source': '月份标签（2026-08）',
     'appears': 'S2 · 5.0s–10.0s（月度轴「8月」）'},
    {'value': '9',
     'source': '月份标签（2026-09）',
     'appears': 'S2 · 5.5s–10.0s（月度轴「9月」）'},
    # S3 轻食 10–18s
    {'value': '+%.1f%%' % pct1(lf / lf25 - 1),
     'source': '轻食品类 %d ÷ %d − 1 = %.2f%%（全片最高增速，置于 12.0s 高潮帧）' % (lf, lf25, (lf / lf25 - 1) * 100),
     'appears': 'S3 · 10.0s–18.0s（12.0s 滚动到位并放大为焦点）'},
    {'value': '%.2f' % wan(lf),
     'source': '轻食品类 2026Q3 销售额 %d 元 ÷ 10000' % lf,
     'appears': 'S3 · 15.0s–18.0s（「轻食销售额」）'},
    {'value': '%.1f%%' % pct1(lf25 / s25),
     'source': '轻食 2025Q3 %d ÷ 大盘 %d = %.2f%%' % (lf25, s25, lf25 / s25 * 100),
     'appears': 'S3 · 15.5s–18.0s（品类占比·去年同期）'},
    {'value': '%.1f%%' % pct1(lf / s26),
     'source': '轻食 2026Q3 %d ÷ 大盘 %d = %.2f%%' % (lf, s26, lf / s26 * 100),
     'appears': 'S3 · 16.0s–18.0s（品类占比·今年）'},
    # S4 渠道 18–24s
    {'value': '%.1f%%' % pct1(deliv / s26),
     'source': '外卖 %d ÷ 大盘 %d = %.2f%%' % (deliv, s26, deliv / s26 * 100),
     'appears': 'S4 · 18.5s–24.0s（堆叠条·外卖）'},
    {'value': '%.1f%%' % pct1(store / s26),
     'source': '门店 %d ÷ 大盘 %d = %.2f%%' % (store, s26, store / s26 * 100),
     'appears': 'S4 · 18.5s–24.0s（堆叠条·门店）'},
    {'value': '+%.1f%%' % pct1(deliv / deliv25 - 1),
     'source': '外卖 %d ÷ %d − 1 = %.2f%%' % (deliv, deliv25, (deliv / deliv25 - 1) * 100),
     'appears': 'S4 · 20.0s–24.0s（外卖同比贴纸）'},
    {'value': '+%.1f%%' % pct1(store / store25 - 1),
     'source': '门店 %d ÷ %d − 1 = %.2f%%' % (store, store25, (store / store25 - 1) * 100),
     'appears': 'S4 · 20.5s–24.0s（门店同比贴纸）'},
    # S5 毛利 24–28s
    {'value': '%.1f%%' % pct1(p26 / s26),
     'source': '毛利 %d ÷ 销售额 %d = %.2f%%' % (p26, s26, p26 / s26 * 100),
     'appears': 'S5 · 24.0s–28.0s（主数字）'},
    {'value': '%.1fpp' % (p26 / s26 * 100 - p25 / s25 * 100),
     'source': '毛利率 %.2f%% − 去年同期 %.2f%%（%d ÷ %d）' % (p26 / s26 * 100, p25 / s25 * 100, p25, s25),
     'appears': 'S5 · 25.5s–28.0s（同比贴纸）'},
    {'value': '%.1f%%' % pct1(deliv_p / deliv),
     'source': '外卖毛利 %d ÷ 外卖销售额 %d = %.2f%%' % (deliv_p, deliv, deliv_p / deliv * 100),
     'appears': 'S5 · 24.5s–28.0s（分渠道毛利率·外卖）'},
    {'value': '%.1f%%' % pct1(store_p / store),
     'source': '门店毛利 %d ÷ 门店销售额 %d = %.2f%%' % (store_p, store, store_p / store * 100),
     'appears': 'S5 · 25.0s–28.0s（分渠道毛利率·门店）'},
    # S6 片尾 28–30s
    {'value': '2026',
     'source': '原始数据 月份字段 2026-07 至 2026-09（任务口径：2026 年第三季度）',
     'appears': 'S6 片尾 · 28.5s–30.0s（「2026 第三季度」贴纸）'},
]

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with io.open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump({'numbers': numbers}, f, ensure_ascii=False, indent=2)

print('facts.json 条目数:', len(numbers))
for n in numbers:
    print(n['value'], '|', n['appears'])
