import { SECTORS, type Sector } from "../sp500";

type Tab = "All" | Sector;

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  count: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function AppToolbar({
  activeTab,
  onTabChange,
  count,
  searchQuery,
  onSearchQueryChange,
}: Props) {
  const tabs: Tab[] = ["All", ...SECTORS];

  return (
    <header>
      <div className="border-b border-black/[0.10] bg-white/80">
        <div className="apple-shell flex min-h-[52px] items-center justify-between gap-6">
          <div className="select-none whitespace-nowrap text-[28px] leading-none tracking-[-1.3px]" aria-label="Green500">
            <span className="font-semibold text-[#78ad50]">green</span>
            <span className="font-light text-black">500</span>
          </div>

          <div className="flex items-center gap-7">
            <label className="relative flex items-center gap-2 text-[13px] text-[#1d1d1f]">
              <span className="font-medium">Sectors</span>
              <select
                value={activeTab}
                onChange={(event) => onTabChange(event.target.value as Tab)}
                aria-label="Filter by sector"
                className="h-8 max-w-[230px] cursor-pointer rounded-full border border-black/[0.10] bg-[#f5f5f7] px-3 pr-8 text-[12px] outline-none focus:border-[#a3c689] focus:ring-2 focus:ring-[#a3c689]/30"
              >
                {tabs.map((tab) => (
                  <option key={tab} value={tab}>{tab === "All" ? "All sectors" : tab}</option>
                ))}
              </select>
            </label>
            <span className="whitespace-nowrap text-[12px] text-[#6e6e73]">Updated September 2026</span>
          </div>
        </div>
      </div>

      <div className="apple-shell flex flex-wrap items-end justify-between gap-5 py-7">
        <div>
          <h1 className="m-0 text-[32px] font-semibold leading-tight tracking-[-0.8px] text-[#1d1d1f]">
            S&amp;P 500 Sustainability Index
          </h1>
          <p className="mt-1 mb-0 text-[14px] text-[#6e6e73]">{count} companies</p>
        </div>

        <label className="flex h-11 min-w-[280px] items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-within:border-[#a3c689] focus-within:ring-2 focus-within:ring-[#a3c689]/25">
          <span className="text-[#86868b]"><SearchIcon /></span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search company or ticker"
            aria-label="Search companies"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
          />
        </label>
      </div>
    </header>
  );
}
