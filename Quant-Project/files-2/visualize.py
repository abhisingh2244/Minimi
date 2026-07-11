"""
3D visualization of implied volatility surfaces using Plotly.
Saves standalone interactive HTML files (rotate/zoom in browser).
"""

import plotly.graph_objects as go


def plot_surface(K_mesh, T_mesh, iv_mesh, title, out_path, raw_points=None):
    """
    K_mesh, T_mesh, iv_mesh : 2D arrays from surface.py
    raw_points : optional dict with 'strike', 'T', 'iv' arrays of the
                 original cleaned data, plotted as scatter markers on top
                 so you can see how well the surface fits the real quotes.
    """
    fig = go.Figure()

    fig.add_trace(go.Surface(
        x=K_mesh, y=T_mesh, z=iv_mesh,
        colorscale="Viridis",
        opacity=0.9,
        colorbar=dict(title="Implied Vol"),
        name="Fitted surface",
    ))

    if raw_points is not None:
        fig.add_trace(go.Scatter3d(
            x=raw_points["strike"], y=raw_points["T"], z=raw_points["iv"],
            mode="markers",
            marker=dict(size=3, color="red"),
            name="Raw market IVs",
        ))

    fig.update_layout(
        title=title,
        scene=dict(
            xaxis_title="Strike",
            yaxis_title="Time to Expiry (years)",
            zaxis_title="Implied Volatility",
        ),
        width=950,
        height=750,
        margin=dict(l=0, r=0, b=0, t=40),
    )

    fig.write_html(out_path)
    return fig
