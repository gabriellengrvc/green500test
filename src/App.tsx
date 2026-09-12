import { useState, useMemo, useCallback } from "react";
import { ALL_COMPANIES, type Sector } from "./sp500";
import { computeWeights, scoreAndRank, type ScoredCompany, type Horizon } from "./scoring";
import AppToolbar from "./components/AppToolbar";

type Tab = "All" | Sector;

const SECTOR_COLORS: Record<string, string> = {
  Finance:    "#0071e3",
  Tech:       "#8e44ad",
  Industrial: "#d68910",
  Energy:     "#e74c3c",
  Healthcare: "#27ae60",
  Consumer:   "#e67e22",
};

const SCORE_COLOR = (s: number) =>
  s >= 75 ? "#30d158" : s >= 50 ? "#34c759" : s >= 30 ? "#ff9f0a" : "#ff453a";

const INDICATORS = [
  { key: "emissionsIntensity", label: "Emissions Intensity", invert: true,  cat: "emissions" },
  { key: "energyEfficiency",   label: "Energy Efficiency",   invert: false, cat: "emissions" },
  { key: "carbonSensitivity",  label: "Carbon Sensitivity",  invert: true,  cat: "emissions" },
  { key: "greenCapex",         label: "Green Capex",         invert: false, cat: "resilience" },
  { key: "trackRecord",        label: "Track Record",        invert: false, cat: "resilience" },
  { key: "rdGreen",            label: "R&D Green Tech",      invert: false, cat: "resilience" },
] as const;

// Company logos use two independent market-data sources before a guaranteed monogram fallback.
function CompanyLogo({ name, ticker, size = 32 }: { name: string; ticker: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  const [sourceIndex, setSourceIndex] = useState(0);
  const normalizedTicker = ticker.replaceAll(".", "-");
  const sources = [
    `https://assets.parqet.com/logos/symbol/${encodeURIComponent(ticker)}?format=png`,
    `https://images.financialmodelingprep.com/symbol/${normalizedTicker}.png`,
  ];

  if (sourceIndex >= sources.length) {
    return (
      <div
        className="rounded-[10px] flex items-center justify-center shrink-0 font-semibold"
        style={{ width: size, height: size, background: "#e8e8ed", color: "#636366", fontSize: size * 0.4 }}
        aria-label={`${name} logo fallback`}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px] shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size, background: "#f2f2f7", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <img
        src={sources[sourceIndex]}
        alt={`${name} logo`}
        className="w-full h-full object-contain p-1"
        loading="lazy"
        onError={() => setSourceIndex(index => index + 1)}
      />
    </div>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: "#e8e8ed" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] tabular-nums" style={{ color: "#86868b", minWidth: 22, textAlign: "right", fontFamily: "var(--font-mono)" }}>
        {value}
      </span>
    </div>
  );
}

function IndicatorBar({ label, raw, invert, cat, emissionsWeight }: {
  label: string; raw: number; invert: boolean; cat: string; emissionsWeight: number;
}) {
  const value = invert ? 100 - raw : raw;
  const relevance = cat === "emissions" ? emissionsWeight : 1 - emissionsWeight;
  const dim = relevance < 0.28;
  const color = SCORE_COLOR(value);

  return (
    <div className="space-y-1" style={{ opacity: dim ? 0.35 : 1, transition: "opacity 0.3s" }}>
      <div className="flex justify-between items-center">
        <span className="text-[12px]" style={{ color: "#86868b", fontFamily: "-apple-system, 'SF Pro Text', sans-serif" }}>
          {label}
        </span>
        <span
          className="text-[11px] px-1.5 py-px rounded-full"
          style={{
            background: cat === "emissions" ? "rgba(0,113,227,0.08)" : "rgba(48,209,88,0.1)",
            color: cat === "emissions" ? "#0071e3" : "#30d158",
            fontFamily: "var(--font-mono)",
          }}
        >
          {cat}
        </span>
      </div>
      <MiniBar value={value} color={color} />
    </div>
  );
}

function ExpandedRow({ company, emissionsWeight }: { company: ScoredCompany; emissionsWeight: number }) {
  return (
    <tr className="row-expand">
      <td colSpan={7} className="px-4 pb-4 pt-0">
        <div
          className="rounded-[14px] p-4 grid gap-3 mx-10"
          style={{
            background: "#fafafa",
            border: "0.5px solid rgba(0,0,0,0.08)",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 24,
          }}
        >
          {INDICATORS.map((ind) => (
            <IndicatorBar
              key={ind.key}
              label={ind.label}
              raw={company[ind.key as keyof typeof company] as number}
              invert={ind.invert}
              cat={ind.cat}
              emissionsWeight={emissionsWeight}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

const PAGE_SIZE = 20;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [horizon, setHorizon] = useState<Horizon>("short");
  const [emissionsWeight, setEmissionsWeight] = useState(0.5);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<"rank" | "score" | "name">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");

  const weights = useMemo(() => computeWeights(horizon, emissionsWeight), [horizon, emissionsWeight]);

  const scored = useMemo(() => {
    const sectorCompanies = activeTab === "All" ? ALL_COMPANIES : ALL_COMPANIES.filter(c => c.sector === activeTab);
    const query = searchQuery.trim().toLocaleLowerCase();
    const filtered = query ? sectorCompanies.filter(c => c.name.toLocaleLowerCase().includes(query) || c.ticker.toLocaleLowerCase().includes(query)) : sectorCompanies;
    return scoreAndRank(filtered, weights);
  }, [activeTab, searchQuery, weights]);

  const sorted = useMemo(() => {
    const arr = [...scored];
    arr.sort((a, b) => {
      const cmp =
        sortKey === "rank" ? a.sectorRank - b.sectorRank :
        sortKey === "score" ? b.score - a.score :
        a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [scored, sortKey, sortDir]);

  const pageData = useMemo(() => sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [sorted, page]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleExpanded = useCallback((id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  };

  const SortArrow = ({ col }: { col: typeof sortKey }) =>
    sortKey === col ? (
      <span className="ml-1" style={{ color: "#0071e3", fontSize: 10 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="ml-1" style={{ color: "#d1d1d6", fontSize: 10 }}>⇅</span>
    );

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}>

      {/* Toolbar from import (adapted) */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(245,245,247,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "0.5px solid rgba(0,0,0,0.1)" }}>
        <AppToolbar
          activeTab={activeTab}
          onTabChange={(t) => { setActiveTab(t); setPage(0); setExpanded(new Set()); }}
          count={sorted.length}
          horizon={horizon}
          onHorizonChange={setHorizon}
          searchQuery={searchQuery}
          onSearchQueryChange={(query) => { setSearchQuery(query); setPage(0); setExpanded(new Set()); }}
        />

        {/* Emissions ↔ Resilience slider row */}
        <div className="flex items-center gap-4 px-5 pb-3">
          <span className="text-[13px]" style={{ color: emissionsWeight > 0.55 ? "#0071e3" : "#86868b", transition: "color 0.2s" }}>
            Emissions
          </span>
          <div className="flex-1 max-w-xs flex flex-col gap-0.5">
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={emissionsWeight}
              onChange={e => { setEmissionsWeight(parseFloat(e.target.value)); setPage(0); }}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between">
              <span className="text-[11px]" style={{ color: "#d1d1d6", fontFamily: "var(--font-mono)" }}>
                {Math.round(emissionsWeight * 100)}%
              </span>
              <span className="text-[11px]" style={{ color: "#d1d1d6", fontFamily: "var(--font-mono)" }}>
                {Math.round((1 - emissionsWeight) * 100)}%
              </span>
            </div>
          </div>
          <span className="text-[13px]" style={{ color: emissionsWeight < 0.45 ? "#30d158" : "#86868b", transition: "color 0.2s" }}>
            Resilience
          </span>

          <div className="ml-auto flex gap-2 text-[11px]" style={{ color: "#86868b" }}>
            {(Object.entries(weights) as [string, number][])
              .sort((a, b) => b[1] - a[1]).slice(0, 3)
              .map(([k, v]) => (
                <span key={k} style={{ fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "#c7c7cc" }}>{k.replace(/([A-Z])/g, " $1").trim().split(" ").map(w => w[0]).join("").toUpperCase()}</span>
                  {" "}<span style={{ color: "#0071e3" }}>{Math.round(v * 100)}%</span>
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-4 mt-4 mb-4 rounded-[18px] overflow-hidden" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)", background: "#fafafa" }}>
              <th className="text-left px-4 py-3 cursor-pointer select-none" style={{ color: "#86868b", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", width: 70 }} onClick={() => handleSort("rank")}>
                RANK <SortArrow col="rank" />
              </th>
              <th className="text-left px-4 py-3 cursor-pointer select-none" style={{ color: "#86868b", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }} onClick={() => handleSort("name")}>
                COMPANY <SortArrow col="name" />
              </th>
              <th className="text-left px-4 py-3" style={{ color: "#86868b", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
                SECTOR
              </th>
              <th className="text-left px-4 py-3 cursor-pointer select-none" style={{ color: "#86868b", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", minWidth: 180 }} onClick={() => handleSort("score")}>
                ESG SCORE <SortArrow col="score" />
              </th>
              <th className="text-left px-4 py-3" style={{ color: "#86868b", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", minWidth: 100 }}>
                EMISSIONS
              </th>
              <th className="text-left px-4 py-3" style={{ color: "#86868b", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", minWidth: 100 }}>
                RESILIENCE
              </th>
              <th style={{ width: 20 }} />
            </tr>
          </thead>
          <tbody>
            {pageData.map((company) => {
              const isOpen = expanded.has(company.id);
              const sColor = SECTOR_COLORS[company.sector];
              const scoreColor = SCORE_COLOR(company.score);
              const emAvg = Math.round(((100 - company.emissionsIntensity) + company.energyEfficiency + (100 - company.carbonSensitivity)) / 3);
              const resAvg = Math.round((company.greenCapex + company.trackRecord + company.rdGreen) / 3);

              return [
                <tr
                  key={company.id}
                  onClick={() => toggleExpanded(company.id)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: isOpen ? "none" : "0.5px solid rgba(0,0,0,0.06)" }}
                  onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "#f9f9fb"; }}
                  onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[13px]" style={{ color: "#1d1d1f", fontFamily: "var(--font-mono)" }}>
                        #{company.sectorRank}
                      </span>
                      <span className="text-[11px]" style={{ color: "#c7c7cc", fontFamily: "var(--font-mono)" }}>
                        /{company.sectorCount}
                      </span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CompanyLogo name={company.name} ticker={company.ticker} size={32} />
                      <div>
                        <div className="font-medium text-[14px]" style={{ color: "#1d1d1f" }}>{company.name}</div>
                        <div className="text-[11px]" style={{ color: "#86868b", fontFamily: "var(--font-mono)" }}>{company.ticker}</div>
                      </div>
                    </div>
                  </td>

                  {/* Sector */}
                  <td className="px-4 py-3">
                    <span
                      className="text-[12px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${sColor}12`, color: sColor }}
                    >
                      {company.sector}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[20px] font-semibold tabular-nums" style={{ color: scoreColor, minWidth: 36, fontFamily: "var(--font-mono)" }}>
                        {company.score}
                      </span>
                      <div className="flex-1" style={{ minWidth: 80 }}>
                        <div className="rounded-full" style={{ height: 4, background: "#f2f2f7", minWidth: 80 }}>
                          <div
                            className="rounded-full transition-all duration-500"
                            style={{ height: 4, width: `${company.score}%`, background: scoreColor }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Emissions avg */}
                  <td className="px-4 py-3" style={{ minWidth: 100 }}>
                    <MiniBar value={emAvg} color={SCORE_COLOR(emAvg)} />
                  </td>

                  {/* Resilience avg */}
                  <td className="px-4 py-3" style={{ minWidth: 100 }}>
                    <MiniBar value={resAvg} color={SCORE_COLOR(resAvg)} />
                  </td>

                  {/* Expand chevron */}
                  <td className="pr-4 py-3 text-center">
                    <span style={{ color: "#c7c7cc", fontSize: 10, display: "block", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                  </td>
                </tr>,

                isOpen && (
                  <ExpandedRow key={`${company.id}-exp`} company={company} emissionsWeight={emissionsWeight} />
                ),
              ];
            })}
            {pageData.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-14 text-center text-[14px]" style={{ color: "#86868b" }}>No companies match “{searchQuery}”.</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination — Apple-style */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
          <span className="text-[13px]" style={{ color: "#86868b" }}>
            {sorted.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn onClick={() => setPage(0)} disabled={page === 0} label="«" />
            <PaginationBtn onClick={() => setPage(p => p - 1)} disabled={page === 0} label="‹" />
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p = page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i;
              if (p < 0) p = i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="transition-all text-[13px] rounded-lg"
                  style={{
                    minWidth: 30, height: 30,
                    background: p === page ? "#0071e3" : "transparent",
                    color: p === page ? "#ffffff" : "#1d1d1f",
                    fontFamily: "var(--font-mono)",
                    border: "none", cursor: "pointer",
                  }}
                >
                  {p + 1}
                </button>
              );
            })}
            <PaginationBtn onClick={() => setPage(p => p + 1)} disabled={totalPages === 0 || page === totalPages - 1} label="›" />
            <PaginationBtn onClick={() => setPage(totalPages - 1)} disabled={totalPages === 0 || page === totalPages - 1} label="»" />
          </div>
          <span className="text-[13px]" style={{ color: "#c7c7cc", fontFamily: "var(--font-mono)" }}>
            {totalPages === 0 ? 0 : page + 1} / {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}

function PaginationBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="transition-all text-[14px] rounded-lg"
      style={{
        minWidth: 30, height: 30,
        background: "transparent",
        color: disabled ? "#d1d1d6" : "#1d1d1f",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}
