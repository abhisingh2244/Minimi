"""
Builds the implied volatility surface two ways from the same cleaned data:

1. Cubic spline smoothing over scattered (strike, T) points -> a purely
   numerical smoother. Good for visualization, but doesn't guarantee
   any no-arbitrage properties and can misbehave where data is sparse.

2. SVI surface: fit SVI per expiry slice, then interpolate the SVI
   parameters (or just the resulting vols) across expiries. This is
   closer to what practitioners actually use because each expiry slice
   individually has a sensible, controlled shape.
"""

import numpy as np
from scipy.interpolate import griddata

from svi import fit_svi_slice, svi_implied_vol


def build_grid(strikes, expiries_T, n_strike=60, n_T=40):
    """Build a regular (strike, T) grid spanning the observed data range."""
    k_min, k_max = np.min(strikes), np.max(strikes)
    t_min, t_max = np.min(expiries_T), np.max(expiries_T)

    grid_strikes = np.linspace(k_min, k_max, n_strike)
    grid_T = np.linspace(t_min, t_max, n_T)
    return np.meshgrid(grid_strikes, grid_T)  # returns (K_mesh, T_mesh)


def cubic_spline_surface(df, n_strike=60, n_T=40):
    """
    df must have columns: strike, T, iv (already-computed BS implied vol).
    Uses scipy.interpolate.griddata with cubic method on scattered points.
    """
    points = df[["strike", "T"]].values
    values = df["iv"].values

    K_mesh, T_mesh = build_grid(df["strike"].values, df["T"].values, n_strike, n_T)

    iv_cubic = griddata(points, values, (K_mesh, T_mesh), method="cubic")
    # Cubic can leave NaNs at the convex-hull edges; backfill with 'nearest'
    iv_nearest = griddata(points, values, (K_mesh, T_mesh), method="nearest")
    iv_cubic = np.where(np.isnan(iv_cubic), iv_nearest, iv_cubic)

    return K_mesh, T_mesh, iv_cubic


def svi_surface(df, n_strike=60, n_T=40, forward_by_T=None):
    """
    Fit SVI per expiry, then build a smooth surface by:
      (a) evaluating each fitted SVI slice on a common strike grid, and
      (b) linearly interpolating those slice-vols across T.

    forward_by_T : optional dict {T: forward_price}. If not provided,
        falls back to spot as a proxy for the forward (fine for short-dated
        equity index options; for dividend-heavy or longer-dated names,
        pass parity.implied_forward_per_expiry(...) results instead --
        it materially changes the fitted skew for those cases).

    Returns K_mesh, T_mesh, iv_surface, and a dict of per-expiry fit info
    (params + whether the butterfly-arbitrage check passed) for diagnostics.
    """
    from svi import check_butterfly_arbitrage

    K_mesh, T_mesh = build_grid(df["strike"].values, df["T"].values, n_strike, n_T)
    grid_strikes = K_mesh[0, :]

    expiries = sorted(df["T"].unique())
    slice_vols = []  # one row per expiry, evaluated at grid_strikes
    fit_diagnostics = {}

    for T in expiries:
        sub = df[df["T"] == T]
        if forward_by_T is not None and T in forward_by_T:
            forward = forward_by_T[T]
        else:
            forward = sub["spot"].iloc[0]  # fallback proxy
        params = fit_svi_slice(sub["strike"].values, sub["iv"].values, T, forward)

        if params is None:
            slice_vols.append(np.full_like(grid_strikes, np.nan))
            fit_diagnostics[T] = {"success": False}
            continue

        k_grid = np.log(grid_strikes / forward)
        ivs = svi_implied_vol(k_grid, params, T)
        slice_vols.append(ivs)
        fit_diagnostics[T] = {
            "success": True,
            "params": params,
            "arbitrage_free_check": check_butterfly_arbitrage(params),
        }

    slice_vols = np.array(slice_vols)  # shape (n_expiries, n_strike)

    # Interpolate across T (rows) for each strike (column) onto the fine T grid
    fine_T = T_mesh[:, 0]
    iv_surface = np.full((len(fine_T), len(grid_strikes)), np.nan)

    for j in range(len(grid_strikes)):
        col = slice_vols[:, j]
        valid = ~np.isnan(col)
        if valid.sum() >= 2:
            iv_surface[:, j] = np.interp(
                fine_T, np.array(expiries)[valid], col[valid]
            )
        elif valid.sum() == 1:
            iv_surface[:, j] = col[valid][0]

    return K_mesh, T_mesh, iv_surface, fit_diagnostics
