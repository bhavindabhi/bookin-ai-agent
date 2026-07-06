"""OHLCV fetch (Yahoo Finance chart API) + trade simulation + performance metrics."""
from __future__ import annotations

import json
import math
import statistics
import urllib.request
from datetime import datetime, timezone

_UA = "bookin-ai-agent/1.0 backtest"
_YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart"

# Yahoo restricts intraday granularity to a recent lookback window regardless
# of the requested range: 15m candles are only available for ~60 days.
INTRADAY_MAX_RANGE = {"15m": "60d", "1h": "730d"}

# Approx bars/year used to annualize Sharpe. Forex/crypto trade ~24h;
# equities/futures are bound by session hours.
BARS_PER_YEAR_15M = {
    "forex": 96 * 365,       # 24h, 96 fifteen-min bars/day
    "crypto": 96 * 365,
    "futures": 96 * 252,     # ~24h but weekday-only settlement calendar
    "equity": 26 * 252,      # 6.5h session -> 26 bars/day
}


def infer_asset_class(symbol: str) -> str:
    if symbol.endswith("=X"):
        return "forex"
    if symbol.endswith("=F"):
        return "futures"
    if symbol.endswith("-USD"):
        return "crypto"
    return "equity"


def fetch_ohlcv(symbol: str, interval: str = "15m") -> list[dict]:
    range_ = INTRADAY_MAX_RANGE.get(interval, "1y")
    url = f"{_YF_BASE}/{symbol}?interval={interval}&range={range_}"
    req = urllib.request.Request(url, headers={"User-Agent": _UA})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    result = data["chart"]["result"][0]
    timestamps = result["timestamp"]
    q = result["indicators"]["quote"][0]

    candles = []
    for i, ts in enumerate(timestamps):
        o, h, l, c, v = q["open"][i], q["high"][i], q["low"][i], q["close"][i], q["volume"][i]
        if None in (o, h, l, c):
            continue
        candles.append({
            "date": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
            "open": round(o, 5), "high": round(h, 5), "low": round(l, 5),
            "close": round(c, 5), "volume": v or 0,
        })
    return candles


def apply_costs(trades: list[dict], commission_pct: float, slippage_pct: float) -> list[dict]:
    total_cost_pct = (commission_pct + slippage_pct) * 2
    out = []
    for t in trades:
        sign = 1 if t["direction"] == "long" else -1
        gross = sign * (t["exit_price"] - t["entry_price"]) / t["entry_price"] * 100
        net = round(gross - total_cost_pct, 3)
        out.append({**t, "return_pct": net, "gross_return_pct": round(gross, 3)})
    return out


def calc_metrics(trades: list[dict], initial_capital: float, bars_per_year: int, n_bars: int) -> dict:
    empty = {
        "total_trades": 0, "win_rate_pct": 0, "total_return_pct": 0,
        "final_capital": initial_capital, "max_drawdown_pct": 0,
        "profit_factor": 0, "sharpe_ratio": 0, "expectancy_pct": 0,
    }
    if not trades:
        return empty

    winners = [t for t in trades if t["return_pct"] > 0]
    losers = [t for t in trades if t["return_pct"] <= 0]

    capital = initial_capital
    peak = capital
    max_dd = 0.0
    returns = []
    for t in trades:
        r = t["return_pct"] / 100
        capital *= (1 + r)
        returns.append(r)
        peak = max(peak, capital)
        max_dd = max(max_dd, (peak - capital) / peak * 100)

    total_return = (capital - initial_capital) / initial_capital * 100
    gp = sum(t["return_pct"] for t in winners)
    gl = abs(sum(t["return_pct"] for t in losers))
    profit_factor = round(gp / gl, 2) if gl > 0 else float("inf")

    sharpe = 0.0
    if len(returns) > 1:
        mean_r, std_r = statistics.mean(returns), statistics.stdev(returns)
        if std_r > 0:
            trades_per_year = len(trades) / n_bars * bars_per_year
            sharpe = round((mean_r / std_r) * math.sqrt(trades_per_year), 2)

    wr = len(winners) / len(trades)
    avg_gain = sum(t["return_pct"] for t in winners) / len(winners) if winners else 0
    avg_loss = sum(t["return_pct"] for t in losers) / len(losers) if losers else 0
    expectancy = round(wr * avg_gain + (1 - wr) * avg_loss, 3)

    return {
        "total_trades": len(trades),
        "winning_trades": len(winners),
        "losing_trades": len(losers),
        "win_rate_pct": round(wr * 100, 1),
        "total_return_pct": round(total_return, 2),
        "final_capital": round(capital, 2),
        "max_drawdown_pct": round(-max_dd, 2),
        "profit_factor": profit_factor,
        "sharpe_ratio": sharpe,
        "expectancy_pct": expectancy,
    }
