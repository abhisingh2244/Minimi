"""
Compares two IV snapshots (e.g. today vs N days ago) -- both at the
per-contract level (ATM term structure) and as a full surface diff.
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from surface import build_grid
from scipy.interpolate import griddata


def atm_term_structure(df, band=0.03):
    """
    For each expiry, average the IV of contracts within `band` (fractional)
    of at-the-money -- gives a clean 'ATM IV by expiry' curve, which is the
    single most-watched summary of an IV surface (it's basically the
    market's term structure of expected volatility).
    """
    df = df.copy()
    df["moneyness"] = (df["strike"] / df["spot"] - 1).abs()
    atm = df[df["moneyness"] <= band]
    return atm.groupby("T")["iv"].mean().sort_index()


def compare_term_structures(current_df, historical_df, current_label="Today",
                             historical_label="N days ago"):
    """
    Returns a DataFrame indexed by T with columns [current_label, historical_label,
    'change'] -- the change in ATM IV per expiry between the two snapshots.
    """
    curr = atm_term_structure(current_df).rename(current_label)
    hist = atm_term_structure(historical_df).rename(historical_label)
    merged = pd.concat([curr, hist], axis=1)
    merged["change"] = merged[current_label] - merged[historical_label]
    return merged


def plot_term_structure_comparison(comparison_df, ticker, out_path,
                                    current_label="Today", historical_label="N days ago"):
    """Line chart: ATM IV term structure, current vs historical."""
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=comparison_df.index, y=comparison_df[current_label],
        mode="lines+markers", name=current_label, line=dict(color="royalblue"),
    ))
    fig.add_trace(go.Scatter(
        x=comparison_df.index, y=comparison_df[historical_label],
        mode="lines+markers", name=historical_label, line=dict(color="firebrick", dash="dash"),
    ))
    fig.update_layout(
        title=f"{ticker} ATM Implied Vol Term Structure — {current_label} vs {historical_label}",
        xaxis_title="Time to Expiry (years)",
        yaxis_title="ATM Implied Volatility",
        width=900, height=550,
    )
    fig.write_html(out_path)
    return fig


def plot_surface_diff(current_df, historical_df, ticker, out_path,
                       current_label="Today", historical_label="N days ago",
                       n_strike=60, n_T=40):
    """
    Full surface diff: interpolate both snapshots onto the same grid, plot
    (current_iv - historical_iv) as a 3D surface. Positive = vol rose since
    the historical snapshot; negative = vol fell.
    """
    # Use the overlapping strike/T range so we're not extrapolating wildly
    common_strike_min = max(current_df["strike"].min(), historical_df["strike"].min())
    common_strike_max = min(current_df["strike"].max(), historical_df["strike"].max())
    common_T_min = max(current_df["T"].min(), historical_df["T"].min())
    common_T_max = min(current_df["T"].max(), historical_df["T"].max())

    grid_strikes = np.linspace(common_strike_min, common_strike_max, n_strike)
    grid_T = np.linspace(common_T_min, common_T_max, n_T)
    K_mesh, T_mesh = np.meshgrid(grid_strikes, grid_T)

    def interp(df):
        points = df[["strike", "T"]].values
        values = df["iv"].values
        z = griddata(points, values, (K_mesh, T_mesh), method="linear")
        z_nearest = griddata(points, values, (K_mesh, T_mesh), method="nearest")
        return np.where(np.isnan(z), z_nearest, z)

    iv_current = interp(current_df)
    iv_historical = interp(historical_df)
    diff = iv_current - iv_historical

    fig = go.Figure(data=go.Surface(
        x=K_mesh, y=T_mesh, z=diff,
        colorscale="RdBu_r", cmid=0,
        colorbar=dict(title="IV change"),
    ))
    fig.update_layout(
        title=f"{ticker} IV Surface Change: {current_label} minus {historical_label}",
        scene=dict(
            xaxis_title="Strike",
            yaxis_title="Time to Expiry (years)",
            zaxis_title="IV change",
        ),
        width=950, height=750,
        margin=dict(l=0, r=0, b=0, t=40),
    )
    fig.write_html(out_path)
    return fig
