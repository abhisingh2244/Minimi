"""
SVI (Stochastic Volatility Inspired) parameterization, Gatheral's raw form.

For a single expiry slice, SVI models total implied variance w(k) = sigma^2 * T
as a function of log-moneyness k = ln(K/F):

    w(k) = a + b * ( rho*(k - m) + sqrt((k - m)^2 + sigma^2) )

Parameters: a (level), b (angle/slope), rho (rotation, |rho|<1),
m (translation), sigma (curvature at the vertex, sigma>0).

This is the industry-standard way to smooth/interpolate a single-expiry
vol smile because it enforces a sensible, roughly-arbitrage-consistent
shape rather than letting a spline wiggle wherever noisy quotes push it.
"""

import numpy as np
from scipy.optimize import least_squares


def svi_total_variance(k, params):
    a, b, rho, m, sigma = params
    return a + b * (rho * (k - m) + np.sqrt((k - m) ** 2 + sigma ** 2))


def svi_implied_vol(k, params, T):
    w = svi_total_variance(k, params)
    w = np.maximum(w, 1e-8)  # guard against negative variance from a bad fit
    return np.sqrt(w / T)


def _initial_guess(k, w):
    """Heuristic starting point: flat level at the observed minimum variance,
    modest slope, no skew, centered at the money."""
    a0 = max(np.min(w) * 0.9, 1e-4)
    b0 = 0.1
    rho0 = 0.0
    m0 = k[np.argmin(np.abs(k))] if len(k) else 0.0
    sigma0 = 0.1
    return [a0, b0, rho0, m0, sigma0]


def fit_svi_slice(strikes, ivs, T, forward, weights=None):
    """
    Fit raw SVI to one expiry's smile.

    strikes, ivs : arrays of strikes and their (already-computed) BS implied vols
    T : time to expiry in years
    forward : forward price for this expiry (approx = spot * exp((r-q)T); we
              use spot as a simplifying proxy elsewhere and pass it in here)

    Returns fitted params [a, b, rho, m, sigma], or None if fit fails /
    too few points to fit 5 parameters reliably.
    """
    strikes = np.asarray(strikes, dtype=float)
    ivs = np.asarray(ivs, dtype=float)

    mask = np.isfinite(strikes) & np.isfinite(ivs) & (ivs > 0)
    strikes, ivs = strikes[mask], ivs[mask]

    if len(strikes) < 6:
        return None  # not enough points to trust a 5-parameter fit

    k = np.log(strikes / forward)
    w = (ivs ** 2) * T  # total variance

    if weights is None:
        weights = np.ones_like(w)

    p0 = _initial_guess(k, w)

    # Bounds keep the fit in a sane, roughly-arbitrage-respecting region:
    # b >= 0 (variance must be non-decreasing away from vertex),
    # |rho| < 1 (it's a rotation parameter), sigma > 0 (curvature scale).
    lower = [1e-6, 0.0, -0.999, -2.0, 1e-4]
    upper = [5.0, 5.0, 0.999, 2.0, 5.0]

    def residuals(params):
        return weights * (svi_total_variance(k, params) - w)

    try:
        result = least_squares(
            residuals, p0, bounds=(lower, upper), max_nfev=5000
        )
        if not result.success:
            return None
        return result.x
    except Exception:
        return None


def check_butterfly_arbitrage(params):
    """
    Necessary condition for the SVI slice to be free of butterfly
    (static) arbitrage: b * (1 + |rho|) <= 4.
    This is a quick sanity check, not a full arbitrage-free proof.
    """
    a, b, rho, m, sigma = params
    return b * (1 + abs(rho)) <= 4.0 + 1e-9


def check_calendar_arbitrage(fit_diagnostics, forward_by_T, n_check_strikes=40):
    """
    Calendar-spread (term-structure) no-arbitrage check: total implied
    variance w(K, T) = sigma(K,T)^2 * T must be non-decreasing in T for
    every fixed strike K. If it dips, that strike/expiry pair implies a
    negative forward variance between the two expiries -- a static
    arbitrage (sell the short-dated option, buy the long-dated one, lock
    in a risk-free profit under Black-Scholes assumptions).

    fit_diagnostics : dict {T: {"success": bool, "params": [...]}} as
                       returned by surface.svi_surface()
    forward_by_T : dict {T: forward_price} -- use parity.implied_forward_per_expiry
                   if available, otherwise spot as a fallback proxy.

    Returns a list of violation dicts: {T1, T2, strike, w1, w2, gap}
    for every (adjacent expiry, strike) pair where variance decreased.
    """
    fitted = {
        T: d["params"] for T, d in fit_diagnostics.items() if d.get("success")
    }
    expiries = sorted(fitted.keys())
    if len(expiries) < 2:
        return []

    # Common strike grid spanning all forwards, evaluated in log-moneyness
    # terms per-expiry (since each expiry can have its own forward).
    all_forwards = [forward_by_T.get(T) for T in expiries if forward_by_T.get(T)]
    if not all_forwards:
        return []
    ref_forward = np.median(all_forwards)
    strikes = np.linspace(ref_forward * 0.8, ref_forward * 1.2, n_check_strikes)

    violations = []
    for T1, T2 in zip(expiries[:-1], expiries[1:]):
        F1 = forward_by_T.get(T1, ref_forward)
        F2 = forward_by_T.get(T2, ref_forward)

        k1 = np.log(strikes / F1)
        k2 = np.log(strikes / F2)

        w1 = svi_total_variance(k1, fitted[T1])
        w2 = svi_total_variance(k2, fitted[T2])

        bad = w2 < w1 - 1e-6  # small numerical tolerance
        for K, w1_, w2_ in zip(strikes[bad], w1[bad], w2[bad]):
            violations.append({
                "T1": T1, "T2": T2, "strike": K,
                "w1": w1_, "w2": w2_, "gap": w2_ - w1_,
            })

    return violations
