"""
End-to-end pipeline: live options chain -> cleaned data -> implied vols
+ Greeks -> put-call parity check (better forwards) -> cubic-spline surface
+ SVI surface -> calendar-arbitrage check -> snapshot save -> optional
historical comparison -> interactive 3D plots.

Usage:
    python main.py --ticker SPY
    python main.py --ticker SPY --compare-days 7   # also diff vs a snapshot saved ~7 days ago
"""

import argparse
import numpy as np
import pandas as pd

from data_fetcher import fetch_option_chain, clean_chain, get_risk_free_rate
from bs_iv import implied_vol, compute_greeks
from surface import cubic_spline_surface, svi_surface
from svi import check_calendar_arbitrage
from parity import merge_calls_puts, implied_forward_per_expiry, check_parity_violations
from visualize import plot_surface
from snapshot import save_snapshot, load_snapshot_n_days_ago
from compare import compare_term_structures, plot_term_structure_comparison, plot_surface_diff


def compute_ivs_and_greeks(df, r, q=0.0):
    """Add 'iv', 'delta', 'gamma', 'vega', 'theta' columns."""
    records = []
    for _, row in df.iterrows():
        iv = implied_vol(
            market_price=row["mid"], S=row["spot"], K=row["strike"],
            T=row["T"], r=r, q=q, option_type=row["option_type"],
        )
        rec = row.to_dict()
        rec["iv"] = iv
        if iv == iv and iv > 0:  # not NaN
            rec.update(compute_greeks(
                row["spot"], row["strike"], row["T"], r, iv, q, row["option_type"]
            ))
        else:
            rec.update({"delta": np.nan, "gamma": np.nan, "vega": np.nan, "theta": np.nan})
        records.append(rec)

    out = pd.DataFrame(records)
    return out[out["iv"].notna() & (out["iv"] > 0.01) & (out["iv"] < 3.0)].reset_index(drop=True)


def run(ticker_symbol, min_open_interest=10, moneyness_bounds=(0.7, 1.3),
        out_prefix=None, compare_days=None, snapshot_dir="snapshots"):

    out_prefix = out_prefix or ticker_symbol.lower()

    print("Fetching risk-free rate...")
    r = get_risk_free_rate()
    print(f"  r = {r:.4%}")

    print(f"Fetching option chain for {ticker_symbol} (calls and puts)...")
    raw_calls = fetch_option_chain(ticker_symbol, option_type="call")
    raw_puts = fetch_option_chain(ticker_symbol, option_type="put")
    print(f"  {len(raw_calls)} call contracts, {len(raw_puts)} put contracts")

    print("Cleaning (liquidity + moneyness filters)...")
    clean_calls = clean_chain(raw_calls, min_open_interest, moneyness_bounds)
    clean_puts = clean_chain(raw_puts, min_open_interest, moneyness_bounds)
    print(f"  {len(clean_calls)} calls, {len(clean_puts)} puts after cleaning")

    # --- Put-call parity: data quality check + better forward prices ---
    print("Checking put-call parity...")
    merged = merge_calls_puts(clean_calls, clean_puts)
    forward_by_T = {}
    if len(merged) >= 3:
        parity_checked = check_parity_violations(merged, r)
        n_flagged = parity_checked["flagged"].sum()
        print(f"  {n_flagged}/{len(parity_checked)} contract pairs flagged as parity "
              f"outliers (>2% deviation from expiry's median implied forward)")
        forward_by_T = implied_forward_per_expiry(merged, r)
        for T, F in sorted(forward_by_T.items()):
            print(f"    T={T:.3f} -> implied forward = {F:.2f}")
    else:
        print("  Not enough overlapping call/put strikes to check parity; "
              "falling back to spot as the forward proxy.")

    # --- IV + Greeks (using calls; swap to clean_puts if you prefer) ---
    print("Computing Black-Scholes implied vols and Greeks...")
    priced = compute_ivs_and_greeks(clean_calls, r=r)
    print(f"  {len(priced)} valid contracts with IV + Greeks computed")

    if len(priced) < 20:
        raise ValueError(
            "Too few liquid contracts after cleaning — try a more liquid "
            "ticker (SPY, QQQ, AAPL) or loosen min_open_interest/moneyness_bounds."
        )

    print("Building cubic-spline surface...")
    K1, T1, iv_spline = cubic_spline_surface(priced)

    print("Fitting SVI per expiry (using parity-implied forwards where available)...")
    K2, T2, iv_svi, diagnostics = svi_surface(priced, forward_by_T=forward_by_T or None)

    n_ok = sum(1 for d in diagnostics.values() if d.get("success"))
    n_arb_free = sum(1 for d in diagnostics.values()
                      if d.get("success") and d.get("arbitrage_free_check"))
    print(f"  SVI fit succeeded for {n_ok}/{len(diagnostics)} expiries "
          f"({n_arb_free} pass the butterfly-arbitrage check)")

    # --- Calendar-spread (term structure) arbitrage check ---
    print("Checking for calendar-spread arbitrage across expiries...")
    fwd_for_check = forward_by_T if forward_by_T else {
        T: priced[priced["T"] == T]["spot"].iloc[0] for T in priced["T"].unique()
    }
    violations = check_calendar_arbitrage(diagnostics, fwd_for_check)
    if violations:
        print(f"  WARNING: {len(violations)} calendar-arbitrage violations found "
              f"(total variance decreased between adjacent expiries at some strikes)")
        worst = max(violations, key=lambda v: -v["gap"])
        print(f"    worst case: T {worst['T1']:.3f}->{worst['T2']:.3f} at strike "
              f"{worst['strike']:.1f}, variance gap = {worst['gap']:.5f}")
    else:
        print("  No calendar-spread arbitrage detected. Good.")

    # --- Plots ---
    raw_points = {"strike": priced["strike"].values, "T": priced["T"].values,
                  "iv": priced["iv"].values}

    plot_surface(K1, T1, iv_spline,
                 f"{ticker_symbol} Implied Vol Surface — Cubic Spline",
                 f"/mnt/user-data/outputs/{out_prefix}_iv_surface_spline.html",
                 raw_points=raw_points)
    plot_surface(K2, T2, iv_svi,
                 f"{ticker_symbol} Implied Vol Surface — SVI Fit",
                 f"/mnt/user-data/outputs/{out_prefix}_iv_surface_svi.html",
                 raw_points=raw_points)

    # --- Snapshot for future historical comparisons ---
    snap_path = save_snapshot(priced, ticker_symbol, snapshot_dir)
    print(f"Snapshot saved to {snap_path}")

    # --- Historical comparison (if requested and a suitable snapshot exists) ---
    if compare_days is not None:
        date_used, hist_df = load_snapshot_n_days_ago(ticker_symbol, compare_days, snapshot_dir)
        if hist_df is None:
            print(f"No snapshot found ~{compare_days} days ago — run this script again "
                  f"in a few days to build up history for comparison.")
        else:
            print(f"Comparing against snapshot from {date_used} "
                  f"({(pd.Timestamp.now().date() - date_used).days} days ago)...")
            hist_label = f"{date_used}"
            comparison = compare_term_structures(priced, hist_df, "Today", hist_label)
            print(comparison.round(4).to_string())

            plot_term_structure_comparison(
                comparison, ticker_symbol,
                f"/mnt/user-data/outputs/{out_prefix}_term_structure_comparison.html",
                "Today", hist_label,
            )
            plot_surface_diff(
                priced, hist_df, ticker_symbol,
                f"/mnt/user-data/outputs/{out_prefix}_surface_diff.html",
                "Today", hist_label,
            )
            print("Comparison plots saved.")

    print("Done. Outputs saved to /mnt/user-data/outputs/")
    return priced, diagnostics, violations


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ticker", default="SPY")
    parser.add_argument("--min-oi", type=int, default=10)
    parser.add_argument("--compare-days", type=int, default=None,
                         help="Also compare against a snapshot saved ~N days ago, if one exists")
    args = parser.parse_args()

    run(args.ticker, min_open_interest=args.min_oi, compare_days=args.compare_days)
