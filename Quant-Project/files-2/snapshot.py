"""
Historical IV comparison.

Important caveat: Yahoo Finance (and yfinance) only exposes the CURRENT
options chain -- there's no free API for historical options chains going
back in time. So "historical comparison" here works by having this script
save a timestamped snapshot every time you run it, and comparing against
whatever snapshot you saved N days ago. Run this daily (e.g. via cron) to
build up a real history.
"""

import os
import glob
from datetime import datetime, timedelta

import pandas as pd


def save_snapshot(df, ticker, snapshot_dir="snapshots"):
    """
    Save today's cleaned + IV-computed chain to disk, tagged with today's
    date. Columns saved: expiry, T, strike, mid, iv, spot, option_type
    (plus greeks if present).
    """
    os.makedirs(snapshot_dir, exist_ok=True)
    today_str = datetime.now().strftime("%Y-%m-%d")
    path = os.path.join(snapshot_dir, f"{ticker.upper()}_{today_str}.csv")
    df.to_csv(path, index=False)
    return path


def list_snapshots(ticker, snapshot_dir="snapshots"):
    """Return sorted list of (date, filepath) for all saved snapshots of this ticker."""
    pattern = os.path.join(snapshot_dir, f"{ticker.upper()}_*.csv")
    files = glob.glob(pattern)
    dated = []
    for f in files:
        base = os.path.basename(f).replace(".csv", "")
        date_str = base.split("_", 1)[1]
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
            dated.append((date, f))
        except ValueError:
            continue
    return sorted(dated)


def load_snapshot_n_days_ago(ticker, n_days, snapshot_dir="snapshots"):
    """
    Load the snapshot closest to (but not after) `n_days` ago.
    Returns (date_used, DataFrame) or (None, None) if no snapshot old enough exists.
    """
    target_date = (datetime.now() - timedelta(days=n_days)).date()
    snapshots = list_snapshots(ticker, snapshot_dir)
    if not snapshots:
        return None, None

    # Closest snapshot at or before the target date
    eligible = [(d, f) for d, f in snapshots if d <= target_date]
    if not eligible:
        return None, None

    date_used, path = eligible[-1]  # most recent among eligible
    return date_used, pd.read_csv(path)
