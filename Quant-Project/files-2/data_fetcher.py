"""
Pulls the live options chain for a ticker via yfinance and returns it as a
clean, tidy DataFrame ready for IV computation.

Note: yfinance data is delayed (typically 15-20 min), not real-time, and
comes from Yahoo's public endpoints. That's fine for building/learning a
surface; for production or trading you'd want a paid feed (Polygon,
CBOE DataShop, OPRA direct).
"""

import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime


def get_risk_free_rate():
    """
    Rough proxy for the risk-free rate using the 13-week Treasury bill
    yield (^IRX ticker), which yfinance quotes in percent.
    Falls back to a hardcoded value if the fetch fails.
    """
    try:
        irx = yf.Ticker("^IRX").history(period="5d")
        rate = irx["Close"].iloc[-1] / 100.0
        if 0 < rate < 0.25:  # sanity bound
            return rate
    except Exception:
        pass
    return 0.045  # fallback ~ current short-term rate ballpark


def fetch_option_chain(
    ticker_symbol,
    max_expiries=8,
    min_days_to_expiry=1,
    max_days_to_expiry=365,
    option_type="call",
):
    """
    Fetch option chain data across multiple expiries for a single ticker.

    Returns a DataFrame with columns:
        expiry, T (years), strike, bid, ask, mid, lastPrice, volume,
        openInterest, spot, option_type
    """
    ticker = yf.Ticker(ticker_symbol)
    spot = ticker.history(period="1d")["Close"].iloc[-1]

    all_expiries = ticker.options
    if not all_expiries:
        raise ValueError(f"No options data found for {ticker_symbol}")

    today = datetime.now().date()
    rows = []

    used_expiries = 0
    for exp_str in all_expiries:
        if used_expiries >= max_expiries:
            break

        exp_date = datetime.strptime(exp_str, "%Y-%m-%d").date()
        days_to_expiry = (exp_date - today).days
        if not (min_days_to_expiry <= days_to_expiry <= max_days_to_expiry):
            continue

        try:
            chain = ticker.option_chain(exp_str)
        except Exception:
            continue

        df = chain.calls if option_type == "call" else chain.puts
        if df.empty:
            continue

        T = days_to_expiry / 365.0
        for _, row in df.iterrows():
            bid, ask = row.get("bid", np.nan), row.get("ask", np.nan)
            mid = np.nan
            if bid is not None and ask is not None and bid > 0 and ask > 0:
                mid = (bid + ask) / 2.0
            rows.append({
                "expiry": exp_str,
                "T": T,
                "strike": row["strike"],
                "bid": bid,
                "ask": ask,
                "mid": mid,
                "lastPrice": row.get("lastPrice", np.nan),
                "volume": row.get("volume", 0),
                "openInterest": row.get("openInterest", 0),
                "spot": spot,
                "option_type": option_type,
            })
        used_expiries += 1

    result = pd.DataFrame(rows)
    if result.empty:
        raise ValueError(f"No usable option rows found for {ticker_symbol}")
    return result


def clean_chain(df, min_open_interest=10, moneyness_bounds=(0.7, 1.3)):
    """
    Filter out illiquid / noisy quotes that would produce garbage IVs:
    - require a valid bid/ask mid price
    - require some minimum open interest (liquidity proxy)
    - restrict to a reasonable moneyness band (avoids deep OTM noise)
    """
    out = df.copy()
    out = out[out["mid"].notna() & (out["mid"] > 0)]
    out = out[out["openInterest"].fillna(0) >= min_open_interest]

    moneyness = out["strike"] / out["spot"]
    lo, hi = moneyness_bounds
    out = out[(moneyness >= lo) & (moneyness <= hi)]

    return out.reset_index(drop=True)
