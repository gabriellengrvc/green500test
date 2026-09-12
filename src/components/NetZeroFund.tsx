import { useMemo, useState } from "react"
import type { Company } from "../sp500"

interface Props {
  companies: Company[]
}

type InvestedBucket = {
  key: string
  name: string
  range: [number, number]
  target: number
  color: string
  rationale: string
  tickers: string[]
}

const INVESTED_BUCKETS: InvestedBucket[] = [
  {
    key: "grid",
    name: "Grid & electrification infrastructure",
    range: [35, 40],
    target: 37.5,
    color: "#79ab52",
    rationale:
      "Fastest earnings realization, with project backlogs converting to revenue now.",
    tickers: [
      "ETN",
      "VRT",
      "HUBB",
      "PWR",
      "GEV",
      "AEP",
      "XEL",
      "D",
      "DTE",
      "AEE",
      "EVRG",
      "SO",
      "DUK",
    ],
  },
  {
    key: "materials",
    name: "Materials & mining",
    range: [20, 25],
    target: 22.5,
    color: "#0071e3",
    rationale:
      "Steady demand through the full buildout phase and less back-loaded than nuclear.",
    tickers: ["FCX", "ALB", "LIN"],
  },
  {
    key: "nuclear",
    name: "Nuclear-adjacent",
    range: [15, 15],
    target: 15,
    color: "#af52de",
    rationale:
      "A smaller seven-year position because permitting and construction push much of the earnings payoff beyond the fund horizon.",
    tickers: ["CEG", "VST", "PEG"],
  },
  {
    key: "efficiency",
    name: "Efficiency tech",
    range: [10, 15],
    target: 12.5,
    color: "#ff9500",
    rationale:
      "Semiconductors, HVAC electrification, and recurring replacement cycles.",
    tickers: ["ON", "CARR", "TT", "JCI"],
  },
]

const CASH = {
  name: "Cash / flexibility",
  range: [10, 15] as [number, number],
  target: 12.5,
  color: "#8e8e93",
  rationale:
    "Dry powder for execution and the planned rotation around years 6–7.",
}

const compactUSD = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)

const rangeLabel = ([minimum, maximum]: [number, number]) =>
  minimum === maximum ? `${minimum}%` : `${minimum}–${maximum}%`

export default function NetZeroFund({ companies }: Props) {
  const [fund, setFund] = useState(1_000_000_000)

  const strategy = useMemo(() => {
    const byTicker = new Map(
      companies.map((company) => [company.ticker, company]),
    )
    const buckets = INVESTED_BUCKETS.map((bucket) => {
      const holdings = bucket.tickers
        .map((ticker) => byTicker.get(ticker))
        .filter((company): company is Company => Boolean(company))
      const weight = holdings.length ? bucket.target / holdings.length : 0
      return {
        ...bucket,
        holdings: holdings.map((company) => ({
          ...company,
          weight,
          allocation: (fund * weight) / 100,
        })),
      }
    })
    const rows = buckets
      .flatMap((bucket) =>
        bucket.holdings.map((holding) => ({
          ...holding,
          bucket: bucket.name,
          color: bucket.color,
        })),
      )
      .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name))
    const invested = buckets.reduce((sum, bucket) => sum + bucket.target, 0)
    return { buckets, rows, invested }
  }, [companies, fund])

  let cursor = 0
  const slices = [...strategy.buckets, { ...CASH, key: "cash" }]
  const gradient = slices
    .map((bucket) => {
      const start = cursor
      cursor += bucket.target
      return `${bucket.color} ${start}% ${cursor}%`
    })
    .join(",")

  return (
    <section className="apple-shell netzero-card">
      <div className="netzero-hero strategy-hero">
        <div>
          <p className="eyebrow">NET-ZERO FUND · 7-YEAR STRATEGY</p>
          <h2>Buildout first. Rotate with discipline.</h2>
          <p>
            A focused $1B transition portfolio tilted toward the infrastructure
            earning from electrification now, with deliberate liquidity for a
            year 6–7 rotation.
          </p>
        </div>
        <div className="netzero-inputs strategy-input">
          <label>
            Fund size
            <input
              value={fund}
              min={1_000_000}
              step={10_000_000}
              type="number"
              onChange={(event) =>
                setFund(Math.max(1_000_000, Number(event.target.value) || 0))
              }
            />
          </label>
        </div>
      </div>

      <div className="strategy-kpis">
        <div>
          <span>Invested</span>
          <strong>{strategy.invested}%</strong>
          <small>{compactUSD((fund * strategy.invested) / 100)}</small>
        </div>
        <div>
          <span>Cash reserve</span>
          <strong>{CASH.target}%</strong>
          <small>{compactUSD((fund * CASH.target) / 100)}</small>
        </div>
        <div>
          <span>Named holdings</span>
          <strong>{strategy.rows.length}</strong>
          <small>current S&amp;P 500 members</small>
        </div>
        <div>
          <span>Excluded</span>
          <strong>0%</strong>
          <small>fossil fuel &amp; non-EV auto</small>
        </div>
      </div>

      <div className="strategy-grid">
        {strategy.buckets.map((bucket) => (
          <article className="strategy-bucket" key={bucket.key}>
            <div className="strategy-bucket-heading">
              <i style={{ background: bucket.color }} />
              <div>
                <h3>{bucket.name}</h3>
                <span>{rangeLabel(bucket.range)} mandate</span>
              </div>
              <strong>{bucket.target}%</strong>
            </div>
            <p>{bucket.rationale}</p>
            <small>
              {compactUSD((fund * bucket.range[0]) / 100)}–
              {compactUSD((fund * bucket.range[1]) / 100)} range
            </small>
            <div className="ticker-list">
              {bucket.holdings.map((holding) => (
                <span key={holding.ticker}>{holding.ticker}</span>
              ))}
            </div>
          </article>
        ))}
        <article className="strategy-bucket cash-bucket">
          <div className="strategy-bucket-heading">
            <i style={{ background: CASH.color }} />
            <div>
              <h3>{CASH.name}</h3>
              <span>{rangeLabel(CASH.range)} mandate</span>
            </div>
            <strong>{CASH.target}%</strong>
          </div>
          <p>{CASH.rationale}</p>
          <small>
            {compactUSD((fund * CASH.range[0]) / 100)}–
            {compactUSD((fund * CASH.range[1]) / 100)} range
          </small>
        </article>
      </div>

      <div className="netzero-summary strategy-summary">
        <div
          className="donut"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div>
            <strong>{compactUSD(fund)}</strong>
            <span>100% allocated</span>
          </div>
        </div>
        <div className="sector-legend">
          {slices.map((bucket) => (
            <div key={bucket.key}>
              <i style={{ background: bucket.color }} />
              <span>{bucket.name}</span>
              <b>{bucket.target}%</b>
            </div>
          ))}
        </div>
      </div>

      <div className="allocation-table netzero-table strategy-table">
        <div className="allocation-row allocation-header">
          <span>Company</span>
          <span>Theme</span>
          <span>Weight</span>
          <span>Allocation</span>
        </div>
        {strategy.rows.map((row, index) => (
          <div className="allocation-row" key={row.id}>
            <span>
              <em>{index + 1}</em>
              <span>
                <b>{row.name}</b>
                <small>
                  {row.ticker} · {row.sector}
                </small>
              </span>
            </span>
            <span className="theme-cell">
              <i style={{ background: row.color }} />
              {row.bucket}
            </span>
            <strong>{row.weight.toFixed(2)}%</strong>
            <b>{compactUSD(row.allocation)}</b>
          </div>
        ))}
      </div>

      <div className="eligibility-card">
        <div>
          <span className="status-dot included" />
          <p>
            <b>PEG included</b>
            <small>
              Verified in the dashboard’s current S&amp;P 500 universe and
              allocated within nuclear-adjacent.
            </small>
          </p>
        </div>
        <div>
          <span className="status-dot excluded" />
          <p>
            <b>TLN excluded</b>
            <small>
              Not a current S&amp;P 500 constituent, so it receives no
              allocation in this index-constrained fund.
            </small>
          </p>
        </div>
      </div>

      <div className="method-card">
        <h3>Strategy rules</h3>
        <p>
          <b>Default targets:</b> range midpoints produce a complete 100%
          allocation: 37.5% grid, 22.5% materials, 15% nuclear-adjacent, 12.5%
          efficiency, and 12.5% cash. Named equities are equal-weighted inside
          each sleeve because no security-level conviction weights were
          supplied.
        </p>
        <p>
          <b>Exclusions:</b> fossil-fuel producers and non-EV automakers receive
          0%. This is a transparent strategy model—not investment advice, a
          guarantee of returns, or proof of portfolio-level net-zero alignment.
        </p>
      </div>
    </section>
  )
}
