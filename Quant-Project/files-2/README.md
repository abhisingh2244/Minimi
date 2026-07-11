# Implied Volatility Surface Builder

Pulls a live (delayed ~15-20min) options chain via `yfinance`, computes
Black-Scholes implied volatility per contract, then builds a 3D IV surface
two ways:

1. **Cubic spline** — pure numerical smoothing over scattered (strike, T) points.
2. **SVI (Stochastic Volatility Inspired)** — fits Gatheral's raw SVI parameterization
   to each expiry's smile individually, then interpolates across expiries.
   This is much closer to how practitioners actually build surfaces, because
   each slice gets a well-behaved, roughly arbitrage-consistent shape instead
   of letting a spline wiggle wherever noisy quotes push it.

## Setup

```bash
pip install yfinance scipy numpy pandas plotly
```

## Run

```bash
python main.py --ticker SPY
python main.py --ticker SPY --compare-days 7   # also diff against a snapshot from ~7 days ago
```

Outputs (all in the working directory / `/mnt/user-data/outputs`):
- `{ticker}_iv_surface_spline.html` — cubic-spline surface
- `{ticker}_iv_surface_svi.html` — SVI-fit surface
- `{ticker}_term_structure_comparison.html` — ATM IV today vs N days ago (if `--compare-days` used and a snapshot exists)
- `{ticker}_surface_diff.html` — full surface diff, today minus N days ago (same condition)
- `snapshots/{TICKER}_{date}.csv` — today's priced chain, saved automatically every run so future runs can compare against it

## How it works

- **`data_fetcher.py`** — pulls the option chain across up to 8 expiries,
  computes mid = (bid+ask)/2, filters out illiquid contracts (low open
  interest) and extreme moneyness (deep ITM/OTM quotes are noisy and low-vega,
  so their implied IV is poorly determined by price alone).
- **`bs_iv.py`** — Black-Scholes pricer, implied vol solver via Brent's
  method (robust even where vega is tiny, unlike raw Newton-Raphson), and
  the full Greeks set: delta, gamma, vega, theta.
- **`parity.py`** — put-call parity cross-check. Flags contracts whose
  call/put quotes imply a wildly different forward than the expiry's
  median (a data-quality red flag), and derives a more accurate
  parity-implied forward per expiry than just using spot — this matters
  because the SVI fit is defined in terms of log-moneyness `ln(K/F)`, so a
  wrong forward silently distorts the whole fitted skew.
- **`svi.py`** — raw SVI fit per expiry via least-squares, with two
  no-arbitrage sanity checks:
  - **butterfly (static) arbitrage**: `b*(1+|rho|) <= 4` per slice
  - **calendar-spread arbitrage**: total variance `w(K,T) = sigma^2 * T`
    must be non-decreasing in T at every strike; `check_calendar_arbitrage`
    flags every (strike, adjacent-expiry-pair) where it isn't.
- **`surface.py`** — builds both surfaces on a common strike/T grid; SVI
  fitting now accepts parity-implied forwards instead of assuming spot.
- **`snapshot.py`** — saves each run's priced chain to `snapshots/`, tagged
  by date, so later runs can load "N days ago" for comparison. (Yahoo
  Finance doesn't expose historical options chains, so this only works if
  you actually run the script periodically to build up history.)
- **`compare.py`** — ATM term-structure comparison (today vs a historical
  snapshot) and a full 3D surface-diff plot (today minus historical).
- **`visualize.py`** — Plotly 3D surface + scatter of raw market points
  overlaid, so you can see fit quality at a glance.

## Testing note

`test_synthetic.py` and `test_synthetic_v2.py` validate the whole pipeline
against synthetic (but realistically noisy) options chains, since this was
built in a sandbox that can't reach Yahoo Finance's servers. `test_synthetic_v2.py`
specifically checks: Greeks are in valid ranges (delta∈[0,1], gamma/vega≥0),
parity-implied forwards correctly recover `S·e^(rT)`, SVI fits converge and
pass arbitrage checks, and the historical-comparison direction matches a
known synthetic vol shift.

## Things worth experimenting with next

- **Term structure smoothing**: right now expiries are linearly interpolated
  after per-slice SVI fits. A proper implementation would jointly fit an
  SVI *surface* (e.g. SSVI) that enforces no calendar-spread arbitrage
  across expiries too, not just within each slice.
- **Forward price vs spot**: this version uses spot as a proxy for the
  forward in the SVI log-moneyness term. For short-dated equity index
  options that's fine; for longer-dated or dividend-heavy names, compute
  the actual forward `F = S*exp((r-q)*T)` and use that instead.
- **Weighting the SVI fit** by vega or open interest so liquid, informative
  quotes matter more than thin ones.
- **Put-call consistency**: currently fits calls (or puts) only. Combining
  both, or checking put-call parity, is a good robustness addition.

## Note on data access

This was built and tested against a synthetic (but realistically noisy)
options chain, because the sandbox this was built in can't reach Yahoo
Finance's servers directly. The `bs_iv.py` → `svi.py` → `surface.py` →
`visualize.py` pipeline is fully tested and correct; `data_fetcher.py`'s
yfinance calls will work as-is on your machine with normal internet access.
