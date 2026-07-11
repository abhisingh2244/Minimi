"""
Full pipeline test using synthetic data, covering ALL new features:
- Greeks computed alongside IV
- Put-call parity cross-check + parity-implied forwards
- Calendar-spread arbitrage check across expiries
- Historical comparison (simulates a snapshot from "7 days ago")
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from bs_iv import bs_price, implied_vol, compute_greeks
from parity import merge_calls_puts, implied_forward_per_expiry, check_parity_violations
from surface import svi_surface
from svi import check_calendar_arbitrage
from snapshot import save_snapshot, load_snapshot_n_days_ago
from compare import compare_term_structures, plot_term_structure_comparison, plot_surface_diff

np.random.seed(7)

SPOT = 500.0
R = 0.045
EXPIRIES = [0.08, 0.17, 0.25, 0.5, 0.75, 1.0]


def true_iv(strike, T, spot, vol_shift=0.0):
    """Same smile shape as before, with an optional level shift to simulate
    the market moving between two dates."""
    m = np.log(strike / spot)
    base = 0.16 + 0.05 * np.exp(-2 * T) + vol_shift
    skew = -0.35 * m + 0.15 * m ** 2
    return max(base + skew, 0.03)


def generate_chain(spot, vol_shift=0.0):
    rows = []
    for T in EXPIRIES:
        strikes = np.linspace(spot * 0.75, spot * 1.25, 25)
        for K in strikes:
            for opt_type in ["call", "put"]:
                sigma_true = true_iv(K, T, spot, vol_shift)
                price = bs_price(spot, K, T, R, sigma_true, option_type=opt_type)
                spread = max(price * 0.02, 0.02)
                noise = np.random.normal(0, price * 0.003)
                mid = price + noise
                bid, ask = mid - spread / 2, mid + spread / 2
                rows.append({
                    "expiry": f"T={T}", "T": T, "strike": K,
                    "bid": bid, "ask": ask, "mid": mid,
                    "lastPrice": mid, "volume": np.random.randint(50, 5000),
                    "openInterest": np.random.randint(50, 5000),
                    "spot": spot, "option_type": opt_type,
                })
    return pd.DataFrame(rows)


def compute_ivs_and_greeks(df, r):
    records = []
    for _, row in df.iterrows():
        iv = implied_vol(row["mid"], row["spot"], row["strike"], row["T"], r,
                          option_type=row["option_type"])
        rec = row.to_dict()
        rec["iv"] = iv
        if iv == iv and iv > 0:
            rec.update(compute_greeks(row["spot"], row["strike"], row["T"], r, iv,
                                       option_type=row["option_type"]))
        else:
            rec.update({"delta": np.nan, "gamma": np.nan, "vega": np.nan, "theta": np.nan})
        records.append(rec)
    out = pd.DataFrame(records)
    return out[out["iv"].notna() & (out["iv"] > 0.01) & (out["iv"] < 3.0)].reset_index(drop=True)


print("=" * 70)
print("STEP 1: Generate 'today' and 'historical' synthetic chains")
print("=" * 70)
today_chain = generate_chain(SPOT, vol_shift=0.0)
# Simulate 7 days ago: slightly lower spot, slightly lower vol level
hist_spot = SPOT * 0.98
hist_chain = generate_chain(hist_spot, vol_shift=-0.02)
print(f"Today: {len(today_chain)} rows | Historical: {len(hist_chain)} rows")

print("\n" + "=" * 70)
print("STEP 2: Compute IV + Greeks for both")
print("=" * 70)
today_calls = today_chain[today_chain["option_type"] == "call"].reset_index(drop=True)
today_puts = today_chain[today_chain["option_type"] == "put"].reset_index(drop=True)

today_priced = compute_ivs_and_greeks(today_calls, R)
print(f"Today priced calls: {len(today_priced)} rows")
print("Sample Greeks (first 3 rows):")
print(today_priced[["strike", "T", "iv", "delta", "gamma", "vega", "theta"]].head(3).to_string())

# Sanity checks on Greeks
assert (today_priced["delta"].between(0, 1)).all(), "Call deltas should be in [0,1]"
assert (today_priced["gamma"] >= 0).all(), "Gamma should be non-negative"
assert (today_priced["vega"] >= 0).all(), "Vega should be non-negative"
print("Greeks sanity checks passed (delta in [0,1], gamma>=0, vega>=0)")

print("\n" + "=" * 70)
print("STEP 3: Put-call parity check")
print("=" * 70)
today_puts_priced = compute_ivs_and_greeks(today_puts, R)
merged = merge_calls_puts(today_calls, today_puts)
print(f"Merged call/put pairs: {len(merged)}")

parity_checked = check_parity_violations(merged, R)
n_flagged = parity_checked["flagged"].sum()
print(f"Flagged as parity outliers: {n_flagged}/{len(parity_checked)}")

forward_by_T = implied_forward_per_expiry(merged, R)
print("Parity-implied forwards vs theoretical forward S*exp(r*T) (q=0 here, so no dividend drift):")
max_fwd_error = 0.0
for T, F in sorted(forward_by_T.items()):
    theoretical_F = SPOT * np.exp(R * T)
    err = abs(F - theoretical_F)
    max_fwd_error = max(max_fwd_error, err)
    print(f"  T={T:.3f}  implied F={F:.2f}  theoretical F={theoretical_F:.2f}  diff={F-theoretical_F:+.3f}")
assert max_fwd_error < 1.0, f"Parity-implied forward error too large: {max_fwd_error}"
print(f"Max forward error = {max_fwd_error:.3f} -- parity math checks out "
      f"(F correctly recovers S*e^(rT), not raw spot -- that's the forward, as expected).")

print("\n" + "=" * 70)
print("STEP 4: SVI fit using parity-implied forwards + calendar arbitrage check")
print("=" * 70)
K, T, iv_svi, diagnostics = svi_surface(today_priced, forward_by_T=forward_by_T)
n_ok = sum(1 for d in diagnostics.values() if d.get("success"))
print(f"SVI fits succeeded: {n_ok}/{len(diagnostics)}")

violations = check_calendar_arbitrage(diagnostics, forward_by_T)
print(f"Calendar arbitrage violations: {len(violations)} "
      f"(expected 0 or near-0, since our synthetic surface was built to be smooth in T)")

print("\n" + "=" * 70)
print("STEP 5: Historical comparison")
print("=" * 70)
hist_calls = hist_chain[hist_chain["option_type"] == "call"].reset_index(drop=True)
hist_priced = compute_ivs_and_greeks(hist_calls, R)

# Save both as snapshots with fabricated dates (today, and 7 days ago)
today_str = datetime.now().strftime("%Y-%m-%d")
hist_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

import os
os.makedirs("/home/claude/iv_surface/test_snapshots", exist_ok=True)
today_priced.to_csv(f"/home/claude/iv_surface/test_snapshots/TEST_{today_str}.csv", index=False)
hist_priced.to_csv(f"/home/claude/iv_surface/test_snapshots/TEST_{hist_date}.csv", index=False)

date_used, loaded_hist = load_snapshot_n_days_ago("TEST", 7, "/home/claude/iv_surface/test_snapshots")
print(f"Loaded historical snapshot dated: {date_used}")
assert loaded_hist is not None, "Failed to load historical snapshot"

comparison = compare_term_structures(today_priced, loaded_hist, "Today", str(date_used))
print("\nATM IV term structure comparison:")
print(comparison.round(4).to_string())

assert (comparison["change"] > 0).all(), (
    "Expected today's ATM IV to be higher than historical (we shifted vol +0.02 for today)"
)
print("\nDirection check passed: today's ATM IV > historical ATM IV, as expected "
      "from the synthetic vol_shift we applied.")

plot_term_structure_comparison(
    comparison, "TEST", "/home/claude/iv_surface/test_term_structure_comparison.html",
    "Today", str(date_used),
)
plot_surface_diff(
    today_priced, loaded_hist, "TEST", "/home/claude/iv_surface/test_surface_diff.html",
    "Today", str(date_used),
)
print("Comparison plots written.")

print("\n" + "=" * 70)
print("ALL TESTS PASSED")
print("=" * 70)
