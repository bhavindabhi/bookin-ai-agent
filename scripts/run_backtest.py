#!/usr/bin/env python3
"""Backtest the EMA/RSI/ATR 15m strategy on a single symbol.

Requires network access to query1.finance.yahoo.com (blocked in some
sandboxed CI/agent environments — run this locally or in an unrestricted
session).

Usage:
    python scripts/run_backtest.py --symbol BTC-USD
    python scripts/run_backtest.py --symbol EURUSD=X --capital 5000
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from strategy.ema_rsi_atr_strategy import generate_trades
from strategy.engine import BARS_PER_YEAR_15M, apply_costs, calc_metrics, fetch_ohlcv, infer_asset_class


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", required=True, help="Yahoo Finance ticker, e.g. BTC-USD, EURUSD=X, GC=F")
    parser.add_argument("--capital", type=float, default=10_000.0)
    parser.add_argument("--commission-pct", type=float, default=0.05)
    parser.add_argument("--slippage-pct", type=float, default=0.02)
    args = parser.parse_args()

    candles = fetch_ohlcv(args.symbol, interval="15m")
    if len(candles) < 250:
        print(f"Not enough 15m data for {args.symbol} ({len(candles)} bars).", file=sys.stderr)
        sys.exit(1)

    raw_trades = generate_trades(candles)
    trades = apply_costs(raw_trades, args.commission_pct, args.slippage_pct)
    asset_class = infer_asset_class(args.symbol)
    metrics = calc_metrics(trades, args.capital, BARS_PER_YEAR_15M[asset_class], len(candles))

    report = {
        "symbol": args.symbol,
        "asset_class": asset_class,
        "interval": "15m",
        "candles_analyzed": len(candles),
        "date_from": candles[0]["date"],
        "date_to": candles[-1]["date"],
        **metrics,
        "disclaimer": "Past performance does not guarantee future results. Educational use only, not financial advice.",
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
