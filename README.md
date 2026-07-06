# TradingView-connected 15m Strategy Toolkit

Connects this repo to the [tradingview-mcp](https://github.com/atilaahmettaner/tradingview-mcp)
MCP server and ships a backtested 15-minute trend-pullback strategy in both
Python (for offline backtesting) and Pine Script (for use directly on
TradingView).

**Note on the name:** despite the name, `tradingview-mcp` does not use
TradingView's official API or scrape a TradingView session — it pulls prices
from Yahoo Finance, sentiment from Reddit, and news from public RSS feeds,
plus TradingView's public screener endpoints for scanning. No TradingView
account or API key is required.

## No strategy guarantees profit

Every number in this repo is a **backtest on historical data**. Past
performance does not predict future results — markets regime-shift, spreads
widen, brokers slip fills, and any public strategy can get arbitraged away.
Treat everything here as a documented, risk-managed starting point to
validate and paper-trade, not a guaranteed edge.

## What's connected

`.mcp.json` registers the `tradingview-mcp` server so any Claude Code session
opened in this repo (locally, or in an unrestricted environment) can call its
tools directly — `backtest_strategy`, `compare_strategies`,
`walk_forward_backtest_strategy`, `get_technical_analysis`, `coin_analysis`,
`market_sentiment`, etc. It runs via `uvx`, no manual install needed once `uv`
is on your machine.

**Known gap:** the sandbox this was built in blocks outbound requests to
`query1.finance.yahoo.com` at the network-policy level, so the strategy below
could not be validated with live 15m data from inside that session. Run the
scripts below locally (or in a Claude Code session without that restriction)
to get real numbers before trusting or trading this.

## The strategy: EMA/RSI/ATR trend-pullback (15m)

Raw crossover or oversold/overbought systems whipsaw heavily on 15-minute
noise. This strategy only takes entries in the direction of the prevailing
trend, waits for a shallow pullback rather than a full reversal, and sizes
stop/target off current volatility (ATR) instead of a fixed distance.

- **Trend filter:** EMA50 vs EMA200 sets long/short bias.
- **Entry trigger:** RSI(14) dips into the 45 (long) / 55 (short) zone and
  crosses back, with price already back above/below EMA50 confirming the
  trend has resumed.
- **Risk model:** stop = 1.5×ATR(14), target = 2.5×ATR(14) (~1.67:1
  reward:risk — needs only ~38% win rate to break even before costs).
- **Safety exit:** close the position early if the EMA trend flips against
  it.

Implementation: `strategy/indicators.py` (EMA/RSI/ATR, pure stdlib, no
pandas/numpy), `strategy/ema_rsi_atr_strategy.py` (signal + trade
generation), `strategy/engine.py` (Yahoo Finance 15m OHLCV fetch, cost
modeling, metrics).

### Run it locally

```bash
python scripts/run_backtest.py --symbol BTC-USD
python scripts/run_backtest.py --symbol EURUSD=X
python scripts/compare_symbols.py   # ranks XAU/USD, BTC/USD, and major FX pairs by Sharpe
```

Symbols use Yahoo Finance tickers: `GC=F` (gold futures, proxy for XAU/USD),
`BTC-USD`, `EURUSD=X`, `GBPUSD=X`, `USDJPY=X`, `AUDUSD=X`, `USDCHF=X`,
`USDCAD=X`. Yahoo only serves ~60 days of 15m history regardless of the
requested range — that's a hard upstream limit, not a bug here.

No dependencies beyond the Python standard library.

### Run it on TradingView directly

This is the more reliable validation path since TradingView supplies its own
real intraday data (no Yahoo Finance dependency at all):

1. Open a 15m chart for XAUUSD, BTCUSD, or a forex major.
2. Pine Editor → paste `pine/ema_rsi_atr_15m_strategy.pine` → Add to chart.
3. Open the Strategy Tester tab to see trades, equity curve, and drawdown
   computed directly from TradingView's own data.
4. Use `alertcondition` blocks already in the script to wire up webhook
   alerts if you want to forward signals to a broker/bot later.

### Before trading any of this live

- Paper-trade for a meaningful sample size first — 15m generates a lot of
  trades, so a "long enough" sample comes faster than on daily charts, but
  regime changes (news, session overlaps, low-liquidity hours) still need to
  be lived through, not just backtested.
- Re-check spread and commission assumptions against your actual broker —
  gold and forex spreads widen a lot outside major sessions.
- Consider running `walk_forward_backtest_strategy` (via the MCP tools) to
  check for overfitting before committing capital.
