"""
Put-call parity cross-checks.

For European options: C - P = S*e^(-qT) - K*e^(-rT)

This gives us two useful things:
1. A DATA QUALITY CHECK — if calls and puts at the same strike/expiry
   imply wildly different forward prices, something's off (stale quote,
   wide spread, wrong dividend assumption).
2. A BETTER FORWARD PRICE — solving parity for the implied forward at
   each expiry is more accurate than just using spot, especially for
   dividend-paying names or longer-dated expiries. This matters because
   the SVI fit uses log-moneyness k = ln(K/F), so a bad forward silently
   biases the whole fitted smile.
"""

import numpy as np
import pandas as pd


def merge_calls_puts(calls_df, puts_df):
    """
    Inner-join calls and puts on (expiry, strike) so each row has both
    a call mid price and a put mid price for the same contract terms.
    """
    c = calls_df[["expiry", "T", "strike", "mid", "spot"]].rename(
        columns={"mid": "call_mid"})
    p = puts_df[["expiry", "T", "strike", "mid"]].rename(
        columns={"mid": "put_mid"})
    merged = c.merge(p, on=["expiry", "T", "strike"], how="inner")
    return merged.dropna(subset=["call_mid", "put_mid"])


def implied_forward_per_expiry(merged, r):
    """
    For each expiry, use the strikes closest to the money (where parity
    is most reliable, since deep ITM/OTM legs have wide spreads) to back
    out an implied forward price via:

        F = (C - P) * e^(rT) + K

    Returns a dict {T: forward_price} -- keyed by T (float years), matching
    the convention used everywhere else in this pipeline (surface.py,
    svi.py). NOTE: this groups by T rather than the expiry label string,
    so if you ever have two different expiry labels that round to the same
    T that's fine, but it does mean the key is a float -- match on the
    same T values used elsewhere, not the expiry string.
    """
    forwards = {}
    for T, group in merged.groupby("T"):
        spot = group["spot"].iloc[0]

        # Use the 5 strikes nearest current spot -- parity implied forward
        # is most reliable there (tightest spreads, least early-exercise
        # premium contamination for American-style contracts).
        group = group.copy()
        group["dist_to_spot"] = (group["strike"] - spot).abs()
        near_money = group.nsmallest(5, "dist_to_spot")

        implied_fwds = (
            (near_money["call_mid"] - near_money["put_mid"]) * np.exp(r * T)
            + near_money["strike"]
        )
        forwards[T] = implied_fwds.median()

    return forwards


def check_parity_violations(merged, r, tolerance=0.02):
    """
    Flag contracts where the quoted call/put prices imply a forward price
    that's far from the expiry's median implied forward -- a proxy for
    stale or bad quotes. `tolerance` is a fractional deviation (0.02 = 2%).

    Returns the merged DataFrame with columns: implied_forward,
    expiry_median_forward, deviation_pct, flagged
    """
    forwards = implied_forward_per_expiry(merged, r)

    out = merged.copy()
    out["implied_forward"] = (
        (out["call_mid"] - out["put_mid"]) * np.exp(r * out["T"]) + out["strike"]
    )
    out["expiry_median_forward"] = out["T"].map(forwards)
    out["deviation_pct"] = (
        (out["implied_forward"] - out["expiry_median_forward"])
        / out["expiry_median_forward"]
    ).abs()
    out["flagged"] = out["deviation_pct"] > tolerance

    return out
