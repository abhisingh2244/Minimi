"""
Black-Scholes pricing and implied volatility (IV) inversion.

We use Brent's method (bisection-style, guaranteed to converge if a root
exists in the bracket) rather than raw Newton-Raphson, because option
vega can be tiny for deep ITM/OTM strikes and Newton can blow up there.
"""

import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq


def bs_price(S, K, T, r, sigma, q=0.0, option_type="call"):
    """
    Black-Scholes price for a European option.

    S : spot price
    K : strike
    T : time to expiry in years
    r : risk-free rate (annualized, continuously compounded)
    sigma : volatility (annualized)
    q : continuous dividend yield
    option_type : 'call' or 'put'
    """
    if T <= 0 or sigma <= 0:
        # Degenerate case: return intrinsic value
        if option_type == "call":
            return max(S - K, 0.0)
        else:
            return max(K - S, 0.0)

    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    if option_type == "call":
        price = S * np.exp(-q * T) * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    else:
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * np.exp(-q * T) * norm.cdf(-d1)

    return price


def implied_vol(
    market_price, S, K, T, r, q=0.0, option_type="call",
    lo=1e-4, hi=5.0
):
    """
    Solve for the implied volatility that reproduces market_price under
    Black-Scholes, via Brent's method on [lo, hi].

    Returns np.nan if no solution exists in the bracket (e.g. price
    violates no-arbitrage bounds, which happens with noisy/stale quotes).
    """
    if market_price <= 0 or T <= 0:
        return np.nan

    # No-arbitrage sanity check: price must exceed intrinsic value bound
    intrinsic = max(S - K, 0.0) if option_type == "call" else max(K - S, 0.0)
    if market_price < intrinsic * 0.999:
        return np.nan

    def objective(sigma):
        return bs_price(S, K, T, r, sigma, q, option_type) - market_price

    try:
        f_lo, f_hi = objective(lo), objective(hi)
        if f_lo * f_hi > 0:
            # No sign change in bracket -> can't solve reliably
            return np.nan
        return brentq(objective, lo, hi, xtol=1e-6, maxiter=100)
    except (ValueError, RuntimeError):
        return np.nan


def vega(S, K, T, r, sigma, q=0.0):
    """Black-Scholes vega: sensitivity of price to a 1.0 (100%) change in vol.
    Convention: divide by 100 if you want the 'per 1 vol point' number traders quote."""
    if T <= 0 or sigma <= 0:
        return 0.0
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    return S * np.exp(-q * T) * norm.pdf(d1) * np.sqrt(T)


def delta(S, K, T, r, sigma, q=0.0, option_type="call"):
    """Black-Scholes delta: sensitivity of price to a $1 change in spot."""
    if T <= 0 or sigma <= 0:
        if option_type == "call":
            return 1.0 if S > K else 0.0
        else:
            return -1.0 if S < K else 0.0
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    if option_type == "call":
        return np.exp(-q * T) * norm.cdf(d1)
    else:
        return -np.exp(-q * T) * norm.cdf(-d1)


def gamma(S, K, T, r, sigma, q=0.0):
    """Black-Scholes gamma: sensitivity of delta to a $1 change in spot.
    Same for calls and puts (put-call parity: their deltas differ by a
    constant, so the derivative of delta w.r.t. spot is identical)."""
    if T <= 0 or sigma <= 0:
        return 0.0
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    return np.exp(-q * T) * norm.pdf(d1) / (S * sigma * np.sqrt(T))


def theta(S, K, T, r, sigma, q=0.0, option_type="call"):
    """Black-Scholes theta: sensitivity of price to the passage of time,
    expressed per year (divide by 365 for the 'per calendar day' number
    traders usually quote)."""
    if T <= 0 or sigma <= 0:
        return 0.0
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    term1 = -S * np.exp(-q * T) * norm.pdf(d1) * sigma / (2 * np.sqrt(T))
    if option_type == "call":
        term2 = -r * K * np.exp(-r * T) * norm.cdf(d2)
        term3 = q * S * np.exp(-q * T) * norm.cdf(d1)
    else:
        term2 = r * K * np.exp(-r * T) * norm.cdf(-d2)
        term3 = -q * S * np.exp(-q * T) * norm.cdf(-d1)
    return term1 + term2 + term3


def compute_greeks(S, K, T, r, sigma, q=0.0, option_type="call"):
    """Convenience wrapper: returns all Greeks as a dict for one contract."""
    return {
        "delta": delta(S, K, T, r, sigma, q, option_type),
        "gamma": gamma(S, K, T, r, sigma, q),
        "vega": vega(S, K, T, r, sigma, q),
        "theta": theta(S, K, T, r, sigma, q, option_type),
    }
