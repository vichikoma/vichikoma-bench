# -*- coding: utf-8 -*-
"""复核牛马咖啡 2026Q3 全部口径：从原始 CSV 清洗并计算，输出与画面一致的每个数字。"""
import csv, io, os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, '..', '..', 'data', 'sales_2025-01_2026-09.csv')

rows = []
with io.open(CSV_PATH, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        rows.append(tuple(r.values()))

print('原始行数:', len(rows))
print('完全重复行数:', len(rows) - len(set(rows)))

seen, clean, dup = set(), [], 0
for r in rows:
    if r in seen:
        dup += 1
        continue
    seen.add(r)
    clean.append(r)
print('去重后行数:', len(clean), '(剔除重复 %d 行)' % dup)

neg = sum(1 for r in clean if float(r[4]) <= 0 or float(r[6]) < 0)
print('销售额<=0 或 毛利<0 的异常行:', neg)

months = sorted({r[0] for r in clean})
print('月份范围:', months[0], '->', months[-1])

Q3_26 = ['2026-07', '2026-08', '2026-09']
Q3_25 = ['2025-07', '2025-08', '2025-09']


def agg(months_want, key_fn=lambda r: True):
    s = p = 0.0
    for r in clean:
        if r[0] in months_want and key_fn(r):
            s += float(r[4])
            p += float(r[6])
    return s, p


def by(months_want, idx):
    d = defaultdict(lambda: [0.0, 0.0])
    for r in clean:
        if r[0] in months_want:
            d[r[idx]][0] += float(r[4])
            d[r[idx]][1] += float(r[6])
    return d


s26, p26 = agg(Q3_26)
s25, p25 = agg(Q3_25)
print()
print('== Q3 总量 ==')
print('Q3-2026 销售额(元):', s26, ' 毛利(元):', p26)
print('Q3-2025 销售额(元):', s25)
print('同比 %:', round((s26 / s25 - 1) * 100, 2))
print('毛利率 %:', round(p26 / s26 * 100, 2), ' 去年同期毛利率 %:', round(agg(Q3_25)[1] / s25 * 100, 2))

print()
print('== 分月(万元) ==')
m26, m25 = by(Q3_26, 0), by(Q3_25, 0)
for a, b in zip(Q3_26, Q3_25):
    print(a, '今年(万):', round(m26[a][0] / 1e4, 2), ' 去年(万):', round(m25[b][0] / 1e4, 2),
          ' 同比%:', round((m26[a][0] / m25[b][0] - 1) * 100, 2))

print()
print('== 分渠道 ==')
c26, c25 = by(Q3_26, 3), by(Q3_25, 3)
for k in c26:
    share = c26[k][0] / s26 * 100
    print(k, '销售额(元):', c26[k][0], ' 占比%:', round(share, 2),
          ' 去年(元):', c25[k][0], ' 同比%:', round((c26[k][0] / c25[k][0] - 1) * 100, 2),
          ' 毛利率%:', round(c26[k][1] / c26[k][0] * 100, 2))

print()
print('== 外卖分月(元) ==')
for m in Q3_26:
    v = sum(float(r[4]) for r in clean if r[0] == m and r[3] == '外卖')
    print(m, v)

print()
print('== 分品类 ==')
k26, k25 = by(Q3_26, 2), by(Q3_25, 2)
for k in k26:
    print(k, '今年(元):', k26[k][0], ' 去年(元):', k25[k][0],
          ' 同比%:', round((k26[k][0] / k25[k][0] - 1) * 100, 2),
          ' 占比%:', round(k26[k][0] / s26 * 100, 2),
          ' 去年占比%:', round(k25[k][0] / s25 * 100, 2))
