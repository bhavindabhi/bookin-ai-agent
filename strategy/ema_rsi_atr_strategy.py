"""
EMA/RSI/ATR trend-pullback strategy for the 15-minute timeframe.

Rationale: raw crossover or oversold/overbought systems whipsaw heavily on
15m noise. This strategy only takes momentum entries in the direction of the
prevailing trend (EMA50 vs EMA200), waits for a shallow RSI pullback rather
than a full reversal signal, and sizes exits off ATR so risk adapts to each
symbol's current volatility instead of a fixed pip/point target.

Long:  EMA50 > EMA200 (uptrend) AND RSI crosses back above 45 from below
       AND close > EMA50 (trend resumption confirmed)
Short: EMA50 < EMA200 (downtrend) AND RSI crosses back below 55 from above
       AND close < EMA50

Exit:  stop = entry -/+ 1.5*ATR14, target = entry +/- 2.5*ATR14 (~1.67R),
       or an early exit if the EMA trend flips against the position.
"""
from __future__ import annotations

from strategy.indicators import atr, ema, rsi

EMA_FAST = 50
EMA_SLOW = 200
RSI_PERIOD = 14
RSI_LONG_TRIGGER = 45
RSI_SHORT_TRIGGER = 55
ATR_PERIOD = 14
STOP_ATR_MULT = 1.5
TARGET_ATR_MULT = 2.5


def generate_trades(candles: list[dict]) -> list[dict]:
    closes = [c["close"] for c in candles]
    highs = [c["high"] for c in candles]
    lows = [c["low"] for c in candles]

    ema_fast = ema(closes, EMA_FAST)
    ema_slow = ema(closes, EMA_SLOW)
    rsi_vals = rsi(closes, RSI_PERIOD)
    atr_vals = atr(highs, lows, closes, ATR_PERIOD)

    trades: list[dict] = []
    position = None
    start = max(EMA_SLOW, RSI_PERIOD, ATR_PERIOD) + 1

    for i in range(start, len(candles)):
        if None in (ema_fast[i], ema_slow[i], rsi_vals[i], atr_vals[i], rsi_vals[i - 1]):
            continue

        price, date = closes[i], candles[i]["date"]
        uptrend = ema_fast[i] > ema_slow[i]
        downtrend = ema_fast[i] < ema_slow[i]

        if position is not None:
            exit_price, hit = None, False
            if position["direction"] == "long":
                if lows[i] <= position["stop"]:
                    exit_price, hit = position["stop"], True
                elif highs[i] >= position["target"]:
                    exit_price, hit = position["target"], True
                elif downtrend:
                    exit_price, hit = price, True
            else:
                if highs[i] >= position["stop"]:
                    exit_price, hit = position["stop"], True
                elif lows[i] <= position["target"]:
                    exit_price, hit = position["target"], True
                elif uptrend:
                    exit_price, hit = price, True

            if hit:
                trades.append({**position, "exit_date": date, "exit_price": exit_price})
                position = None
            continue

        if uptrend and rsi_vals[i - 1] < RSI_LONG_TRIGGER <= rsi_vals[i] and price > ema_fast[i]:
            a = atr_vals[i]
            position = {
                "direction": "long", "entry_date": date, "entry_price": price,
                "stop": price - STOP_ATR_MULT * a, "target": price + TARGET_ATR_MULT * a,
            }
        elif downtrend and rsi_vals[i - 1] > RSI_SHORT_TRIGGER >= rsi_vals[i] and price < ema_fast[i]:
            a = atr_vals[i]
            position = {
                "direction": "short", "entry_date": date, "entry_price": price,
                "stop": price + STOP_ATR_MULT * a, "target": price - TARGET_ATR_MULT * a,
            }

    return trades
