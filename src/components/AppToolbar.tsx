import type { Sector } from "../sp500";

type Tab = "All" | Sector;
const TABS: Tab[] = ["All", "Finance", "Tech", "Industrial", "Energy", "Healthcare", "Consumer"];

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  count: number;
  horizon: "short" | "long";
  onHorizonChange: (horizon: "short" | "long") => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" /><path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

export default function AppToolbar({ activeTab, onTabChange, count, horizon, onHorizonChange, searchQuery, onSearchQueryChange }: Props) {
  return (
    <header className="px-5 pt-4 pb-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[34px] font-bold leading-[41px] tracking-[0.4px] text-[#1a1a1a]">Green500</h1>
          <p className="m-0 text-[15px] font-medium text-[#727272]">{count} companies · S&amp;P 500 Sustainability Index</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-full bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.12)]">
            {(["short", "long"] as const).map((value) => (
              <button key={value} type="button" onClick={() => onHorizonChange(value)} className="h-9 rounded-full px-3 text-[12px] font-medium capitalize transition-colors" style={{ border: "none", cursor: "pointer", background: horizon === value ? "#0071e3" : "transparent", color: horizon === value ? "#fff" : "#1a1a1a" }}>{value}</button>
            ))}
          </div>
          <label className="flex h-11 min-w-[250px] items-center gap-2 rounded-full bg-white px-4 shadow-[0_1px_4px_rgba(0,0,0,0.12)] focus-within:ring-2 focus-within:ring-[#0071e3]/30">
            <span className="text-[#86868b]"><SearchIcon /></span>
            <input type="search" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Search company or ticker" aria-label="Search companies" className="min-w-0 flex-1 bg-transparent text-[14px] text-[#1d1d1f] outline-none" />
          </label>
        </div>
      </div>
      <nav className="mt-4 flex gap-1 overflow-x-auto pb-1" aria-label="Company sectors">
        {TABS.map((tab) => {
          const selected = activeTab === tab;
          return <button key={tab} type="button" onClick={() => onTabChange(tab)} className="h-9 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors" style={{ border: "none", cursor: "pointer", background: selected ? "#1d1d1f" : "rgba(255,255,255,0.75)", color: selected ? "#fff" : "#1d1d1f" }}>{tab}</button>;
        })}
      </nav>
    </header>
  );
}
