#!/usr/bin/env python3
"""Rank the EMA/RSI/ATR 15m strategy across XAU/USD, BTC/USD, and major forex pairs.

Requires network access to query1.finance.yahoo.com (blocked in some
sandboxed CI/agent environments — run this locally or in an unrestricted
session).

Usage:
    python scripts/compare_symbols.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from strategy.ema_rsi_atr_strategy import generate_trades
from strategy.engine import BARS_PER_YEAR_15M, apply_costs, calc_metrics, fetch_ohlcv, infer_asset_class

SYMBOLS = ["GC=F", "BTC-USD", "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCHF=X", "USDCAD=X"]
CAPITAL = 10_000.0
COMMISSION_PCT = 0.05
SLIPPAGE_PCT = 0.02


def main() -> None:
    rows = []
    for symbol in SYMBOLS:
        try:
            candles = fetch_ohlcv(symbol, interval="15m")
        except Exception as e:
            print(f"{symbol}: fetch failed ({e})", file=sys.stderr)
            continue
        if len(candles) < 250:
            print(f"{symbol}: not enough data ({len(candles)} bars)", file=sys.stderr)
            continue

        trades = apply_costs(generate_trades(candles), COMMISSION_PCT, SLIPPAGE_PCT)
        asset_class = infer_asset_class(symbol)
        m = calc_metrics(trades, CAPITAL, BARS_PER_YEAR_15M[asset_class], len(candles))
        rows.append({"symbol": symbol, **m})

    rows.sort(key=lambda r: r["sharpe_ratio"], reverse=True)
    header = f"{'symbol':<10}{'trades':>8}{'win%':>8}{'return%':>10}{'maxDD%':>9}{'PF':>7}{'sharpe':>8}"
    print(header)
    print("-" * len(header))
    for r in rows:
        print(f"{r['symbol']:<10}{r['total_trades']:>8}{r['win_rate_pct']:>8.1f}"
              f"{r['total_return_pct']:>10.2f}{r['max_drawdown_pct']:>9.2f}"
              f"{r['profit_factor']:>7}{r['sharpe_ratio']:>8.2f}")

    if rows:
        print(f"\nBest by Sharpe: {rows[0]['symbol']}")
    print("\nPast performance does not guarantee future results. Educational use only, not financial advice.")


if __name__ == "__main__":
    main()
